-- The one column a student could rewrite to own the school.
--
-- 001 gave profiles this policy:
--
--   CREATE POLICY "Allow users to update their own profile"
--       ON profiles FOR UPDATE
--       USING (id = auth.uid()) WITH CHECK (id = auth.uid());
--
-- and 005 gave it this grant:
--
--   GRANT SELECT, UPDATE ON TABLE profiles TO authenticated;
--
-- Between them they say which ROW a signed-in user may write, and nothing at
-- all about which COLUMNS of it. `role` is one of those columns, and 005 also
-- wrote:
--
--   auth_role() -> SELECT role FROM profiles WHERE id = auth.uid()
--
-- which every policy in this schema consults to decide what the caller may
-- see. So the value that decides everything is read out of the one field the
-- caller can overwrite. From the browser console of a signed-in fifteen-year-
-- old:
--
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', myId)
--
-- and from the next statement onward can_view_student() answers yes for every
-- student in the school — marks, attendance, học phí, tư vấn tâm lý notes —
-- while CAMERA_ALLOWED_ROLES in server/src/lib/viewerIdentity.js, which reads
-- this same column back out of this same table, hands over the live camera
-- wall. No policy, trigger or constraint stood between the console and any of
-- it.
--
-- What was missing was never the row rule; it was the column list. A user owns
-- how they are displayed. They do not own what they are.

-- ── The grant, narrowed to what a user owns about themselves ───────────────
-- Revoking a table-level privilege also drops the matching column-level ones,
-- so this pair leaves exactly two writable columns behind and nothing else.
-- The order matters: the GRANT must follow the REVOKE, not precede it.
--
-- Left out on purpose:
--   role       — the escalation above
--   school_id  — moving yourself into another school re-points auth_school_id()
--                at that school's roster, which is the same hole through a
--                different door
--   id         — the primary key, and the thing every policy identifies you by
--   created_at — an account's own record of when it appeared
--
-- Nothing in the application writes any of them. Web/src only ever reads this
-- table (AuthContext.fetchProfile, viewerIdentity's select=role); the single
-- writer is server/src/routes/sso.js, which goes in with the service key and
-- is therefore exempt from both row-level security and column grants. So the
-- narrower grant costs the product nothing: changing somebody's role stays an
-- act the school performs, never one an account performs upon itself.
--
-- A teacher who needs a different name on a certificate files a request. A
-- student who can edit their own role owns the school. When it is not obvious
-- that a column is safe here, it belongs on the list above.

REVOKE UPDATE ON TABLE profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url) ON TABLE profiles TO authenticated;

-- anon has no UPDATE policy on this table, so today it can write nothing
-- whatever its grants say. Narrowed anyway, so that a policy written for it
-- later starts from two columns rather than from the whole row.
REVOKE UPDATE ON TABLE profiles FROM anon;

-- ── The second lock, for when the first one is undone ──────────────────────
-- A column grant is invisible from every file except this one. The next
-- migration that needs profiles writable has one obvious line to reach for —
-- GRANT UPDATE ON TABLE profiles TO authenticated, which is exactly what 005
-- wrote — and that line silently restores the escalation with nothing in the
-- diff to suggest it. So the rule is also written somewhere it can be read:
-- role and school_id do not change on a write that arrives as an ordinary
-- signed-in user, whatever that user has been granted.
--
-- The SSO route legitimately sets both, and its upsert
-- (Prefer: resolution=merge-duplicates) becomes an UPDATE from the second
-- sign-in onward, so it passes through here on every login after the first.
-- Rather than list the privileged role names and hope the list stays right,
-- the test asks what they have in common: a caller that can already bypass
-- row-level security is a caller this guard has nothing to add for. That is
-- true of service_role, of postgres and of supabase_admin, and it is false of
-- authenticated, of anon, and of any client role invented after today — those
-- are refused, which is the direction to fail in.
--
-- SECURITY INVOKER, deliberately, unlike the helpers in 005: the whole check
-- rests on current_user being the caller rather than this function's owner.
--
-- INSERT is not guarded because authenticated holds neither the privilege nor
-- a policy for it — the first row of an account is written by the SSO route.

CREATE OR REPLACE FUNCTION guard_profile_privilege_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    privileged BOOLEAN;
BEGIN
    IF NEW.role IS NOT DISTINCT FROM OLD.role
       AND NEW.school_id IS NOT DISTINCT FROM OLD.school_id
    THEN
        RETURN NEW;
    END IF;

    SELECT rolsuper OR rolbypassrls INTO privileged
    FROM pg_roles WHERE rolname = current_user;

    -- COALESCE, not a bare test: a caller this catalogue cannot account for is
    -- refused rather than waved through.
    IF COALESCE(privileged, FALSE) THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Chỉ nhà trường mới được đổi vai trò hoặc trường của một tài khoản.';
END;
$$;

COMMENT ON FUNCTION guard_profile_privilege_columns() IS
    'Refuses any change to profiles.role or profiles.school_id from a caller that cannot already bypass RLS. Backs up the column grants above, which a later broad GRANT would silently undo.';

DROP TRIGGER IF EXISTS profiles_privilege_guard ON profiles;

CREATE TRIGGER profiles_privilege_guard
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION guard_profile_privilege_columns();
