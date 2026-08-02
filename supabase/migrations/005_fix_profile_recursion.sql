-- Fixes the recursive policy on `profiles` and gives every later policy a
-- non-recursive way to ask who the caller is.
--
-- 001_identity.sql wrote:
--
--   CREATE POLICY "Allow users to read profiles in the same school"
--       ON profiles FOR SELECT
--       USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
--
-- A policy on `profiles` that itself selects from `profiles` re-enters the same
-- policy, and Postgres aborts with:
--
--   infinite recursion detected in policy for relation "profiles"
--
-- The first thing the app does after login is read the caller's profile, so
-- this breaks sign-in outright. It went unnoticed because the app has only ever
-- run against the in-browser mock.
--
-- The fix is a SECURITY DEFINER function: it runs as its owner, so reading
-- `profiles` inside it does not re-trigger the policy. It is marked STABLE so
-- Postgres evaluates it once per statement rather than once per row.

-- ── Helpers ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auth_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION auth_school_id() IS
    'School of the signed-in user. SECURITY DEFINER so policies on profiles can call it without recursing.';

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION auth_role() IS
    'Role of the signed-in user: admin | teacher | student | parent.';

-- Students in classes the caller teaches. Empty for non-teachers.
CREATE OR REPLACE FUNCTION auth_taught_student_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT e.student_id
    FROM enrollments e
    JOIN teaching_assignments ta ON ta.class_id = e.class_id
    WHERE ta.teacher_id = auth.uid();
$$;

COMMENT ON FUNCTION auth_taught_student_ids() IS
    'Students the signed-in teacher is assigned to, via their classes.';

REVOKE EXECUTE ON FUNCTION auth_school_id() FROM public;
REVOKE EXECUTE ON FUNCTION auth_role() FROM public;
REVOKE EXECUTE ON FUNCTION auth_taught_student_ids() FROM public;
GRANT EXECUTE ON FUNCTION auth_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_taught_student_ids() TO authenticated;

-- ── Replace the recursive policies ─────────────────────────────────────────

DROP POLICY IF EXISTS "Allow users to read profiles in the same school" ON profiles;

CREATE POLICY "profiles_select_same_school"
    ON profiles FOR SELECT
    TO authenticated
    USING (school_id = auth_school_id());

-- The same pattern was used on every other table in 001; swap them all over so
-- no policy reads `profiles` directly.
DROP POLICY IF EXISTS "Allow users to read subject groups in their school" ON subject_groups;
CREATE POLICY "subject_groups_select_same_school"
    ON subject_groups FOR SELECT
    TO authenticated
    USING (school_id = auth_school_id());

DROP POLICY IF EXISTS "Allow users to read classes in their school" ON classes;
CREATE POLICY "classes_select_same_school"
    ON classes FOR SELECT
    TO authenticated
    USING (school_id = auth_school_id());

-- ── Guardians ──────────────────────────────────────────────────────────────
-- 001 created parent accounts but nothing recording whose child is whose, so
-- there was no way to scope a parent to their own children. Every parent policy
-- below depends on this table.

CREATE TABLE IF NOT EXISTS guardians (
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS guardians_student_idx ON guardians(student_id);

ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardians_select_own"
    ON guardians FOR SELECT
    TO authenticated
    USING (parent_id = auth.uid() OR student_id = auth.uid() OR auth_role() = 'admin');

CREATE POLICY "guardians_admin_write"
    ON guardians FOR ALL
    TO authenticated
    USING (auth_role() = 'admin')
    WITH CHECK (auth_role() = 'admin');

-- Children of the signed-in parent. Empty for everyone else.
CREATE OR REPLACE FUNCTION auth_child_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT student_id FROM guardians WHERE parent_id = auth.uid();
$$;

COMMENT ON FUNCTION auth_child_ids() IS
    'Students the signed-in parent is guardian of.';

REVOKE EXECUTE ON FUNCTION auth_child_ids() FROM public;
GRANT EXECUTE ON FUNCTION auth_child_ids() TO authenticated;

-- ── One predicate every academic table reuses ──────────────────────────────
-- Who may see a given student's records:
--   admin   — anyone in their school
--   teacher — students in classes they teach
--   student — themselves
--   parent  — their own children only
--
-- Parents deliberately cannot see other children's records, including class
-- rankings. Widening this later is a one-line change; narrowing it after the
-- data has been shown is not.

CREATE OR REPLACE FUNCTION can_view_student(target UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE auth_role()
        WHEN 'admin'   THEN EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = target AND p.school_id = auth_school_id()
        )
        WHEN 'teacher' THEN target IN (SELECT auth_taught_student_ids())
        WHEN 'student' THEN target = auth.uid()
        WHEN 'parent'  THEN target IN (SELECT auth_child_ids())
        ELSE FALSE
    END;
$$;

COMMENT ON FUNCTION can_view_student(UUID) IS
    'Whether the signed-in user may read a given student''s academic records.';

-- Who may write a student's academic records: staff only.
CREATE OR REPLACE FUNCTION can_edit_student(target UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE auth_role()
        WHEN 'admin'   THEN EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = target AND p.school_id = auth_school_id()
        )
        WHEN 'teacher' THEN target IN (SELECT auth_taught_student_ids())
        ELSE FALSE
    END;
$$;

COMMENT ON FUNCTION can_edit_student(UUID) IS
    'Whether the signed-in user may write a given student''s academic records. Students and parents never can.';

REVOKE EXECUTE ON FUNCTION can_view_student(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION can_edit_student(UUID) FROM public;
GRANT EXECUTE ON FUNCTION can_view_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_student(UUID) TO authenticated;

-- Tables created in a migration carry no privileges for the API roles, so
-- without this the client is refused at the table before RLS is ever consulted:
-- "permission denied for table". RLS then narrows these grants to rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE guardians TO authenticated;

-- The same omission covers every table from 001-004: they were given policies
-- but never grants, so the whole original schema was unreachable from a client.
-- Nobody hit it because the app has only ever run against the in-browser mock.
GRANT SELECT ON TABLE schools TO authenticated;
GRANT SELECT, UPDATE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    subject_groups,
    group_members,
    classes,
    teaching_assignments,
    enrollments,
    method_presets,
    tutor_configs,
    knowledge_entries,
    worked_solutions,
    topic_rules,
    conversations,
    messages,
    review_queue,
    golden_tests
TO authenticated;
