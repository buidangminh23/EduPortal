-- Khoá sổ điểm, và nhật ký ai đã sửa điểm.
--
-- Two things the schema could not do, which a school notices on the same day.
--
-- The first: nothing closes a học kỳ. Marks are chốt at the end of a term, the
-- học bạ is signed, and from that moment a change to a mark is not data entry —
-- it is a correction, and the school has to know it happened. Until now a
-- teacher could edit học kỳ I in April, and the only sign was that a number was
-- different from the one on the printed sheet.
--
-- The second: nothing records who changed a mark. 006 gave assessment_records
-- updated_by and updated_at, which name only the *last* writer — the previous
-- value and the previous author are overwritten by the write that replaced
-- them. So when a parent says "điểm con tôi bị sửa", the school can say what the
-- mark is now and who touched it last, and nothing at all about what it was
-- before or who made it that. That is not an answer; it is the same
-- unfalsifiable shrug from both sides.
--
-- Two tables, three triggers, and a rule about who may go on writing after the
-- book is closed.
--
-- Depends on 012: the lock is keyed by năm học, and every row this file guards
-- or records carries the school_year column 012 adds.
--
-- Re-runnable, like 010 and 012 — guarded throughout, because an operator who
-- has just re-applied 006 will want to put these triggers back.

-- ── Which sổ điểm are closed ───────────────────────────────────────────────
-- A row means closed. No status column, no boolean: an open học kỳ is one
-- nobody has locked, so it is the absence of a row, the same shape 011 chose
-- for chưa đánh giá. A boolean would let a period be both listed and open,
-- which is two ways of saying one thing and therefore a way for them to differ.

CREATE TABLE IF NOT EXISTS gradebook_locks (
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    school_year TEXT NOT NULL,
    semester SMALLINT NOT NULL CHECK (semester IN (1, 2)),

    locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    -- NOT NULL, and the reference deliberately RESTRICT rather than the
    -- SET NULL that 006 uses for updated_by. A closed sổ điểm is an act somebody
    -- performed; a lock whose author has been deleted is a lock nobody closed,
    -- and the school would be left with a book it cannot say who shut. Deleting
    -- that account is refused instead, which is the direction to fail in.
    locked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

    PRIMARY KEY (school_id, school_year, semester),

    -- The same format rule 012 states on the three record tables, for the same
    -- reason and stated the same way: a lock filed under '2025-2027' locks
    -- nothing, and would look exactly like a lock that works.
    CONSTRAINT gradebook_lock_school_year_format CHECK (
        CASE WHEN school_year ~ '^[0-9]{4}-[0-9]{4}$'
             THEN left(school_year, 4)::INT + 1 = right(school_year, 4)::INT
             ELSE FALSE END
    )
);

ALTER TABLE gradebook_locks ENABLE ROW LEVEL SECURITY;

-- Anyone in the school may see that a period is closed. A teacher whose write
-- was just refused needs to be able to find out why, and "học kỳ I năm học
-- 2025-2026 đã khoá" is not a fact about any student.
DROP POLICY IF EXISTS "gradebook_locks_select" ON gradebook_locks;
CREATE POLICY "gradebook_locks_select" ON gradebook_locks FOR SELECT
    TO authenticated USING (school_id = auth_school_id());

-- Closing and re-opening the book is Ban Giám Hiệu's, not a teacher's — a
-- teacher who could lift the lock on their own class is a teacher for whom the
-- lock does not exist.
DROP POLICY IF EXISTS "gradebook_locks_admin_write" ON gradebook_locks;
CREATE POLICY "gradebook_locks_admin_write" ON gradebook_locks FOR ALL
    TO authenticated
    USING (auth_role() = 'admin' AND school_id = auth_school_id())
    WITH CHECK (auth_role() = 'admin' AND school_id = auth_school_id());

-- SELECT, INSERT and DELETE, and no UPDATE on purpose. Locking is INSERT and
-- unlocking is DELETE; there is nothing in the row left to change that is not a
-- fact about an act already performed. Without the privilege, the UPDATE half
-- of the FOR ALL policy above can never be used — a policy without a grant is
-- inert, which 005 learned the other way round.
GRANT SELECT, INSERT, DELETE ON TABLE gradebook_locks TO authenticated;

CREATE OR REPLACE FUNCTION is_gradebook_locked(school UUID, year_label TEXT, semester_number SMALLINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM gradebook_locks
        WHERE school_id = school
          AND school_year = year_label
          AND semester = semester_number
    );
$$;

-- SECURITY DEFINER, so the answer does not depend on what the caller is allowed
-- to see. If this read went through the policy above and the policy ever hid a
-- lock row from somebody, the guard below would read "not locked" and let the
-- write through — a visibility rule quietly becoming a permission rule, failing
-- open. The one thing a lock must never do.
COMMENT ON FUNCTION is_gradebook_locked(UUID, TEXT, SMALLINT) IS
    'Whether a school''s sổ điểm for a học kỳ of a năm học has been closed. Reads gradebook_locks regardless of who is asking, on purpose.';

REVOKE EXECUTE ON FUNCTION is_gradebook_locked(UUID, TEXT, SMALLINT) FROM public;
GRANT EXECUTE ON FUNCTION is_gradebook_locked(UUID, TEXT, SMALLINT) TO authenticated;

-- ── Who is exempt from a guard ─────────────────────────────────────────────
-- 010 asked this question and answered it by what the caller can already do
-- rather than by naming role names that go stale: a caller that can already
-- bypass row-level security is a caller a guard written in SQL has nothing to
-- add for. postgres and service_role qualify; authenticated, anon and any
-- client role invented after today do not, and are refused.
--
-- SECURITY INVOKER — the default, and the whole point. current_user has to be
-- the caller, not this function's owner. A SECURITY DEFINER version of this
-- would answer "yes" to everybody, which is the failure mode where a guard goes
-- on being called and stops guarding.
--
-- 010's copy of this test is left where it is rather than rewritten to call
-- here. Two guards sharing one helper is one helper whose next edit silently
-- changes both, and the thing being protected in 010 — nobody hands themselves
-- the admin role — is not a thing to make depend on a file about sổ điểm.

CREATE OR REPLACE FUNCTION caller_bypasses_rls()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
    SELECT COALESCE(
        (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user),
        FALSE
    );
$$;

COMMENT ON FUNCTION caller_bypasses_rls() IS
    'Whether the current caller can already bypass row-level security. SECURITY INVOKER on purpose: the answer is about the caller, not about this function.';

REVOKE EXECUTE ON FUNCTION caller_bypasses_rls() FROM public;
GRANT EXECUTE ON FUNCTION caller_bypasses_rls() TO authenticated;

-- ── The lock itself ────────────────────────────────────────────────────────
-- A trigger, not a policy and not a check in the client.
--
-- Not the client, because the client is the thing being checked: a lock the
-- browser enforces is a lock that a browser with the developer console open
-- does not have. Not a policy, because a policy can only see the row in front
-- of it, and whether that row's học kỳ is closed lives in another table — RLS
-- could express it with a subquery, but it would then have to be repeated
-- identically on the INSERT, UPDATE and DELETE policies of three tables, and
-- the sixth copy is where the difference gets in.
--
-- Admin is let through. That is not a hole, it is the correction path: a mark
-- that turns out to be wrong after chốt has to be fixable by the school, and
-- the AFTER trigger below records the correction, so the way it becomes visible
-- is the log rather than the refusal. A school that has to re-open the whole
-- học kỳ to fix one digit re-opens it for everybody.
--
-- An UPDATE is checked against both the period it is leaving and the period it
-- is entering. Moving a row out of a closed học kỳ takes a mark out of a signed
-- học bạ just as surely as editing it there, and it would otherwise pass a
-- guard that only looked at where the row was going.

CREATE OR REPLACE FUNCTION reject_write_to_locked_gradebook()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    exempt BOOLEAN;
BEGIN
    -- COALESCE, because auth_role() is NULL for a caller with no session, and
    -- NULL = 'admin' is NULL, and NOT NULL is NULL, and an IF on NULL does
    -- nothing. Without it this guard would skip both checks below for exactly
    -- the callers it is least sure about.
    exempt := COALESCE(auth_role() = 'admin', FALSE) OR caller_bypasses_rls();

    IF NOT exempt THEN
        -- Nested rather than joined with AND: Postgres does not promise which
        -- side of an AND it evaluates first, and OLD does not exist on INSERT.
        IF TG_OP <> 'INSERT' THEN
            IF is_gradebook_locked(OLD.school_id, OLD.school_year, OLD.semester) THEN
                RAISE EXCEPTION
                    'Sổ điểm học kỳ % năm học % đã khoá, chỉ Ban Giám Hiệu mới sửa được.',
                    OLD.semester, OLD.school_year;
            END IF;
        END IF;

        IF TG_OP <> 'DELETE' THEN
            IF is_gradebook_locked(NEW.school_id, NEW.school_year, NEW.semester) THEN
                RAISE EXCEPTION
                    'Sổ điểm học kỳ % năm học % đã khoá, chỉ Ban Giám Hiệu mới ghi vào được.',
                    NEW.semester, NEW.school_year;
            END IF;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION reject_write_to_locked_gradebook() IS
    'Refuses writes to a học kỳ whose sổ điểm has been closed. Admin and callers that already bypass RLS are let through; the change is recorded by assessment_history.';

-- ── Nhật ký sửa điểm ───────────────────────────────────────────────────────
-- Append-only, and append-only has to mean something a grant enforces rather
-- than something a comment claims.
--
-- What the client is given is SELECT, and nothing else — no INSERT, no UPDATE,
-- no DELETE, for any role. Rows arrive only through the trigger below, which is
-- SECURITY DEFINER and therefore writes as this table's owner, so it needs no
-- privilege the client could also use. That is the whole mechanism: there is no
-- INSERT path a client can reach even by mistake, because there is no INSERT
-- privilege to reach it with, and a policy written for one later would be inert
-- without the grant.
--
-- The table does not FORCE ROW LEVEL SECURITY, which is load-bearing: forcing
-- it would apply the policies to the owner too, and the trigger's insert would
-- then be judged by a policy that lets nobody write.
--
-- No foreign keys, which is the one place this table deliberately breaks the
-- pattern of every other table in the schema. student_id here would want
-- ON DELETE CASCADE to match assessment_records, and that is precisely wrong:
-- removing an account would then remove the record of what was done to it, and
-- "delete the pupil" would become a way to erase the evidence. RESTRICT would
-- be the opposite mistake — a school that can never remove an account. So the
-- log records identifiers, not references. An id that no longer resolves is
-- still evidence of what happened, and this table is about what happened.
--
-- No range checks on the marks either. 006 decides what a mark may be; this
-- table records what was written. A log that can refuse to record something is
-- a log with a gap exactly where somebody wrote something strange.

CREATE TABLE IF NOT EXISTS assessment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The row this came from. Kept for joining a live record to its past, and
    -- left dangling on purpose once that row is gone.
    assessment_id UUID,

    school_id UUID NOT NULL,
    student_id UUID NOT NULL,
    subject TEXT NOT NULL,
    semester SMALLINT NOT NULL,
    school_year TEXT NOT NULL,

    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),

    old_regular NUMERIC(4,1)[],
    old_midterm NUMERIC(4,1),
    old_final NUMERIC(4,1),
    old_average NUMERIC(4,1),

    new_regular NUMERIC(4,1)[],
    new_midterm NUMERIC(4,1),
    new_final NUMERIC(4,1),
    new_average NUMERIC(4,1),

    -- NULL only for a write that came from outside the application — a psql
    -- session or the service key. See the trigger: an ordinary signed-in caller
    -- with no identity is refused rather than recorded as nobody.
    changed_by UUID,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- The question this table exists to answer is asked about one child: "ai sửa
-- điểm của con tôi, lúc nào, từ mấy sang mấy", newest first.
CREATE INDEX IF NOT EXISTS assessment_history_student_idx
    ON assessment_history(student_id, changed_at DESC);

-- And the one the policy below asks on every single read, plus the review a
-- hiệu trưởng does of the whole school after chốt điểm.
CREATE INDEX IF NOT EXISTS assessment_history_school_idx
    ON assessment_history(school_id, changed_at DESC);

ALTER TABLE assessment_history ENABLE ROW LEVEL SECURITY;

-- Ban Giám Hiệu, and only them, and only their own school.
--
-- Deliberately not the teacher who made the change, and deliberately not the
-- parent asking the question. A parent reading this table would see every
-- intermediate value a teacher ever typed, including the digit they fixed a
-- minute later, and would be reading marks that were never anybody's result.
-- The school answers "điểm con tôi bị sửa" from this table; it is not the
-- answer itself. 005 already put the argument the right way round — widening
-- this is one line, and narrowing it after the data has been shown is not.
DROP POLICY IF EXISTS "assessment_history_select_admin" ON assessment_history;
CREATE POLICY "assessment_history_select_admin" ON assessment_history FOR SELECT
    TO authenticated
    USING (auth_role() = 'admin' AND school_id = auth_school_id());

GRANT SELECT ON TABLE assessment_history TO authenticated;

CREATE OR REPLACE FUNCTION record_assessment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    actor UUID := auth.uid();

    key_row UUID;
    key_school UUID;
    key_student UUID;
    key_subject TEXT;
    key_semester SMALLINT;
    key_year TEXT;

    was_regular NUMERIC(4,1)[];
    was_midterm NUMERIC(4,1);
    was_final NUMERIC(4,1);
    was_average NUMERIC(4,1);

    now_regular NUMERIC(4,1)[];
    now_midterm NUMERIC(4,1);
    now_final NUMERIC(4,1);
    now_average NUMERIC(4,1);
BEGIN
    -- auth.uid() reads the `sub` claim of the request's JWT, so it is there for
    -- every write that arrives through PostgREST and absent for every write
    -- that does not: a migration, a psql session, the service key.
    --
    -- Absent and ordinary is refused. A history row that cannot name who made
    -- the change is close to worthless — it proves a mark moved and leaves the
    -- school exactly as unable to answer the parent as it was before — so the
    -- write does not happen rather than happening anonymously.
    --
    -- Absent and privileged is recorded as NULL. Those writes are database
    -- operations, not application ones; their author is the shell somebody
    -- typed them into, and NULL says so honestly. Refusing them instead would
    -- mean this schema could not be seeded, could not be corrected by the DBA
    -- it tells operators to be, and could not run its own rls_check.sql — a
    -- guard that stops the schema being installed is a guard that gets deleted.
    IF actor IS NULL AND NOT caller_bypasses_rls() THEN
        RAISE EXCEPTION 'Không xác định được tài khoản thay đổi điểm, nên thay đổi bị từ chối.';
    END IF;

    IF TG_OP <> 'INSERT' THEN
        key_row := OLD.id;
        key_school := OLD.school_id;
        key_student := OLD.student_id;
        key_subject := OLD.subject;
        key_semester := OLD.semester;
        key_year := OLD.school_year;

        was_regular := OLD.regular;
        was_midterm := OLD.midterm;
        was_final := OLD.final;
        was_average := OLD.average;
    END IF;

    -- After the OLD block, so that an UPDATE files the row under where it ended
    -- up. Where it came from is still readable from the old marks beside it.
    IF TG_OP <> 'DELETE' THEN
        key_row := NEW.id;
        key_school := NEW.school_id;
        key_student := NEW.student_id;
        key_subject := NEW.subject;
        key_semester := NEW.semester;
        key_year := NEW.school_year;

        now_regular := NEW.regular;
        now_midterm := NEW.midterm;
        now_final := NEW.final;
        now_average := NEW.average;
    END IF;

    INSERT INTO assessment_history (
        assessment_id, school_id, student_id, subject, semester, school_year, operation,
        old_regular, old_midterm, old_final, old_average,
        new_regular, new_midterm, new_final, new_average,
        changed_by
    ) VALUES (
        key_row, key_school, key_student, key_subject, key_semester, key_year, TG_OP,
        was_regular, was_midterm, was_final, was_average,
        now_regular, now_midterm, now_final, now_average,
        actor
    );

    -- Every write is recorded, including an UPDATE that leaves all four marks
    -- as they were. The tempting filter — only log when something differs —
    -- makes the log unable to answer the other half of the question: a teacher
    -- who says they never touched the row cannot be believed from a log that
    -- drops the writes it judged uninteresting. A reader who wants only real
    -- changes asks for old_average IS DISTINCT FROM new_average, which is a
    -- filter they can choose and unchoose.
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION record_assessment_change() IS
    'Writes one assessment_history row per write to assessment_records. SECURITY DEFINER because the client is granted no INSERT on the log, which is what makes it append-only.';

-- The second lock, for the day the grant above is widened by accident. 010
-- makes the same argument about the same kind of hole: a privilege is invisible
-- from every file except the one that set it, and the next migration that needs
-- this table writable has one obvious line to reach for. A superuser can still
-- drop this trigger — that is fine, and the point. It is not here to stop
-- somebody who owns the database, it is here so that an ordinary caller who has
-- been handed a privilege by mistake is still refused.
CREATE OR REPLACE FUNCTION reject_history_rewrite()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF caller_bypasses_rls() THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Nhật ký thay đổi điểm chỉ được ghi thêm, không sửa và không xoá được.';
END;
$$;

COMMENT ON FUNCTION reject_history_rewrite() IS
    'Refuses UPDATE and DELETE on assessment_history from any caller that cannot already bypass RLS. Backs up the grant, which a later broad GRANT would silently undo.';

-- ── The triggers, and why each is timed the way it is ──────────────────────
-- The lock is BEFORE. It has to run while the write can still be stopped, and
-- when it raises the statement aborts, so the row is never stored and the AFTER
-- trigger never fires. A refused write leaves nothing in the log, which is
-- right: nothing changed.
--
-- The history is AFTER, for the mirror-image reason. A BEFORE version would
-- record changes that a CHECK constraint, an RLS WITH CHECK clause or the lock
-- guard itself went on to reject, and the log would show marks that were never
-- stored — a log that is wrong in the direction of accusing people.
--
-- Between them they give the admin correction path its shape: the BEFORE guard
-- lets an admin through, the row lands, and the AFTER trigger records it. The
-- correction is not exempt from the log; it is the reason the log is there.
--
-- Ordering between triggers of the same table and timing is alphabetical by
-- name, and these two have different timings, so there is no race to reason
-- about here. The names are prefixed with the table so that stays legible if a
-- third one is ever added.

DROP TRIGGER IF EXISTS assessment_records_gradebook_lock ON assessment_records;
CREATE TRIGGER assessment_records_gradebook_lock
    BEFORE INSERT OR UPDATE OR DELETE ON assessment_records
    FOR EACH ROW EXECUTE FUNCTION reject_write_to_locked_gradebook();

DROP TRIGGER IF EXISTS comment_results_gradebook_lock ON comment_results;
CREATE TRIGGER comment_results_gradebook_lock
    BEFORE INSERT OR UPDATE OR DELETE ON comment_results
    FOR EACH ROW EXECUTE FUNCTION reject_write_to_locked_gradebook();

DROP TRIGGER IF EXISTS conduct_results_gradebook_lock ON conduct_results;
CREATE TRIGGER conduct_results_gradebook_lock
    BEFORE INSERT OR UPDATE OR DELETE ON conduct_results
    FOR EACH ROW EXECUTE FUNCTION reject_write_to_locked_gradebook();

DROP TRIGGER IF EXISTS assessment_records_history ON assessment_records;
CREATE TRIGGER assessment_records_history
    AFTER INSERT OR UPDATE OR DELETE ON assessment_records
    FOR EACH ROW EXECUTE FUNCTION record_assessment_change();

DROP TRIGGER IF EXISTS assessment_history_append_only ON assessment_history;
CREATE TRIGGER assessment_history_append_only
    BEFORE UPDATE OR DELETE ON assessment_history
    FOR EACH ROW EXECUTE FUNCTION reject_history_rewrite();

-- comment_results and conduct_results are locked but not logged. Marks are what
-- a parent disputes and what a danh hiệu is computed from, so that is where the
-- log starts; a nhận xét going from Đạt to Chưa đạt, or a mức rèn luyện from
-- Khá to Tốt, leaves no history today. The trigger above is shaped for
-- assessment_records' four mark columns and does not generalise to them for
-- free — each would need its own table of before-and-after. Worth doing, and
-- worth doing on purpose rather than as a side effect of this file.
