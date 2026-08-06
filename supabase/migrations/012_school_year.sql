-- Năm học — the column every academic record has been missing.
--
-- 006 gave assessment_records UNIQUE (student_id, subject, semester), and
-- comment_results the same shape; 011 gave conduct_results
-- UNIQUE (student_id, semester). A học bạ follows a pupil for three years, so
-- those columns do not identify a row. The day a lớp 11 teacher enters Toán học
-- kỳ I, the upsert in Web/src/lib/db/repository.js — which conflicts on exactly
-- those columns — finds the lớp 10 row of the same name and writes over it.
-- Nothing errors and nothing is logged. The lớp 10 marks are not hidden, they
-- are gone, and they are gone everywhere at once because this is the only copy.
-- By lớp 12 a học bạ holds one of the three years it is meant to hold.
--
-- Every result Thông tư 22 describes belongs to a học kỳ *of a năm học*. The
-- schema recorded the học kỳ and threw the năm học away.
--
-- So: one new column on the three tables that carry a per-học-kỳ verdict, and
-- the uniqueness rebuilt around it. attendance_records is deliberately left
-- alone — see the note at the end.

-- ── What a năm học is written as ───────────────────────────────────────────
-- TEXT, '2025-2026'. That is how it is written on a học bạ, on a quyết định and
-- on the wall of the phòng hội đồng, so it is what a teacher checking a screen
-- against a paper record can compare without translating.
--
-- Not an integer: 2025 alone is ambiguous on paper — the year it began or the
-- year it ended — and the ambiguity would be resolved differently by different
-- readers of the same column. Not a date range: the school does not decide the
-- boundary dates and would then be storing two facts it has to keep consistent
-- with a third.

CREATE OR REPLACE FUNCTION school_year_start_month()
RETURNS SMALLINT
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 8::SMALLINT $$;

COMMENT ON FUNCTION school_year_start_month() IS
    'Tháng bắt đầu một năm học (1-12). Must equal SCHOOL_YEAR_START_MONTH in Web/src/lib/domain/schoolYear.js.';

-- The same rule as schoolYearOf() in Web/src/lib/domain/schoolYear.js, written
-- here because the backfill below has to run inside the database and cannot
-- call the browser's copy.
--
-- The number lives in exactly two places — that function above and the JS
-- constant — and they have to agree, because a database that thinks the năm học
-- starts in August and a client that thinks it starts in September will file
-- the same August mark under two different years and neither will complain. The
-- cheap check is `SELECT school_year_of(now());` beside currentSchoolYear() in
-- the browser console: if they differ, one of the two copies is wrong, and it
-- is this one that decides what the historical rows below say.
--
-- The boundary reads the moment in Vietnamese local time, not UTC. Web/src/lib/
-- domain/dates.js already fixes that convention for the rest of the school
-- record — a school day is a calendar fact, and a mark saved at half past
-- midnight on 1 August is an August mark whatever a UTC clock says about it.
CREATE OR REPLACE FUNCTION school_year_of(moment TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
    SELECT CASE
        WHEN EXTRACT(MONTH FROM d)::INT >= school_year_start_month()
            THEN  EXTRACT(YEAR FROM d)::INT      || '-' || (EXTRACT(YEAR FROM d)::INT + 1)
        ELSE     (EXTRACT(YEAR FROM d)::INT - 1) || '-' ||  EXTRACT(YEAR FROM d)::INT
    END
    FROM (SELECT timezone('Asia/Ho_Chi_Minh', moment)) AS vn(d);
$$;

COMMENT ON FUNCTION school_year_of(TIMESTAMPTZ) IS
    'Năm học chứa một thời điểm, dạng ''2025-2026''. Mirrors schoolYearOf() in Web/src/lib/domain/schoolYear.js.';

REVOKE EXECUTE ON FUNCTION school_year_start_month() FROM public;
REVOKE EXECUTE ON FUNCTION school_year_of(TIMESTAMPTZ) FROM public;
GRANT EXECUTE ON FUNCTION school_year_start_month() TO authenticated;
GRANT EXECUTE ON FUNCTION school_year_of(TIMESTAMPTZ) TO authenticated;

-- ── The column ─────────────────────────────────────────────────────────────
-- Added nullable, filled, and only then made NOT NULL. The order matters: the
-- format constraint further down treats NULL as a failure, so it cannot be in
-- place while the column is still empty.
--
-- IF NOT EXISTS throughout, the way 008 does it, so a database that has already
-- taken this migration can take it again without failing halfway.

ALTER TABLE assessment_records ADD COLUMN IF NOT EXISTS school_year TEXT;
ALTER TABLE comment_results    ADD COLUMN IF NOT EXISTS school_year TEXT;
ALTER TABLE conduct_results    ADD COLUMN IF NOT EXISTS school_year TEXT;

-- ── The rows that are already there ────────────────────────────────────────
-- The column is NOT NULL and the existing rows say nothing about a năm học, so
-- something has to decide for them. Not a literal — '2025-2026' typed into this
-- file is a guess that becomes permanent the moment the migration runs, and it
-- is wrong for every school that installs this a year from now.
--
-- Each row's own updated_at is the only evidence the row carries, so each row
-- is dated by it, through the same boundary rule the client uses. A row last
-- touched in July belongs to the năm học that was *ending*, not the one about
-- to begin: học kỳ II is over by the end of May and July is nghỉ hè, so a mark
-- typed on 3 July 2026 is a mark of năm học 2025-2026. That is the `< tháng 8`
-- branch of school_year_of, and it is the case worth stating out loud because
-- it is the one a reader is most likely to assume the other way round.
--
-- Where this is imperfect, and knowingly: updated_at is when the row was last
-- written, not when the mark was earned. A học kỳ I mark corrected in October
-- of the following năm học is filed under the following năm học. Nothing in the
-- row can tell us otherwise, and the alternative — one literal for every row —
-- is wrong for more of them, more quietly. A school that knows better can
-- correct specific rows afterwards; it cannot un-collapse rows that a single
-- literal has since merged.
--
-- WHERE school_year IS NULL so a re-run touches nothing it has already dated.

UPDATE assessment_records SET school_year = school_year_of(updated_at) WHERE school_year IS NULL;
UPDATE comment_results    SET school_year = school_year_of(updated_at) WHERE school_year IS NULL;
UPDATE conduct_results    SET school_year = school_year_of(updated_at) WHERE school_year IS NULL;

ALTER TABLE assessment_records ALTER COLUMN school_year SET NOT NULL;
ALTER TABLE comment_results    ALTER COLUMN school_year SET NOT NULL;
ALTER TABLE conduct_results    ALTER COLUMN school_year SET NOT NULL;

-- Deliberately no DEFAULT. A default would let a client that has not been
-- taught about năm học go on writing, and its rows would land in whatever year
-- the server clock made plausible — which is the same class of silent, wrong,
-- unnoticed write this migration exists to end. Without one, such a client is
-- refused by name (23502, "null value in column school_year"), which is a bug
-- report rather than a corrupted học bạ.

-- ── The format ─────────────────────────────────────────────────────────────
-- Four digits, a hyphen, four digits, and the second number one greater than
-- the first. '2025-2027' and '2025-2025' are not năm học, and a column that
-- accepts them is a column two rows can disagree about while both look right.
-- This is isValidSchoolYear() in Web/src/lib/domain/schoolYear.js, restated
-- where a client bug cannot get past it.
--
-- Written with CASE rather than `regex AND arithmetic`: Postgres does not
-- promise which side of an AND it evaluates first, and if the cast runs on a
-- value the regex would have rejected, the row is refused with a type error
-- instead of a constraint violation. CASE fixes the order.
--
-- Repeated per table rather than hidden in a DOMAIN or a function-backed CHECK.
-- A CHECK that calls a function can be restored out of order by pg_dump and is
-- not re-validated when the function later changes, and 006 already states
-- CHECK (semester IN (1, 2)) three times for the same reason: a constraint you
-- can read at the table it guards is a constraint that survives being moved.
--
-- DROP then ADD, the shape 010 uses for its trigger, because ALTER TABLE has no
-- ADD CONSTRAINT IF NOT EXISTS and this file has to be safe to re-run.

ALTER TABLE assessment_records DROP CONSTRAINT IF EXISTS assessment_school_year_format;
ALTER TABLE assessment_records ADD CONSTRAINT assessment_school_year_format CHECK (
    CASE WHEN school_year ~ '^[0-9]{4}-[0-9]{4}$'
         THEN left(school_year, 4)::INT + 1 = right(school_year, 4)::INT
         ELSE FALSE END
);

ALTER TABLE comment_results DROP CONSTRAINT IF EXISTS comment_school_year_format;
ALTER TABLE comment_results ADD CONSTRAINT comment_school_year_format CHECK (
    CASE WHEN school_year ~ '^[0-9]{4}-[0-9]{4}$'
         THEN left(school_year, 4)::INT + 1 = right(school_year, 4)::INT
         ELSE FALSE END
);

ALTER TABLE conduct_results DROP CONSTRAINT IF EXISTS conduct_school_year_format;
ALTER TABLE conduct_results ADD CONSTRAINT conduct_school_year_format CHECK (
    CASE WHEN school_year ~ '^[0-9]{4}-[0-9]{4}$'
         THEN left(school_year, 4)::INT + 1 = right(school_year, 4)::INT
         ELSE FALSE END
);

-- ── The uniqueness, rebuilt ────────────────────────────────────────────────
-- The old constraints were written inline in 006 and 011 —
-- UNIQUE (student_id, subject, semester) — so they were never given a name here
-- and have to be dropped by the one Postgres generated for them:
-- table_column_column_..._key. That is why the names below look mechanical.
-- The new ones are named on purpose, so the next migration that has to touch
-- them does not have to work out what Postgres would have called them.
--
-- IF EXISTS on the drops, and the new name dropped before it is added, so a
-- second run of this file rebuilds rather than failing on a name that is
-- already taken.

ALTER TABLE assessment_records DROP CONSTRAINT IF EXISTS assessment_records_student_id_subject_semester_key;
ALTER TABLE assessment_records DROP CONSTRAINT IF EXISTS assessment_records_student_subject_semester_year_key;
ALTER TABLE assessment_records ADD CONSTRAINT assessment_records_student_subject_semester_year_key
    UNIQUE (student_id, subject, semester, school_year);

ALTER TABLE comment_results DROP CONSTRAINT IF EXISTS comment_results_student_id_subject_semester_key;
ALTER TABLE comment_results DROP CONSTRAINT IF EXISTS comment_results_student_subject_semester_year_key;
ALTER TABLE comment_results ADD CONSTRAINT comment_results_student_subject_semester_year_key
    UNIQUE (student_id, subject, semester, school_year);

ALTER TABLE conduct_results DROP CONSTRAINT IF EXISTS conduct_results_student_id_semester_key;
ALTER TABLE conduct_results DROP CONSTRAINT IF EXISTS conduct_results_student_semester_year_key;
ALTER TABLE conduct_results ADD CONSTRAINT conduct_results_student_semester_year_key
    UNIQUE (student_id, semester, school_year);

-- Those three drops name constraints nobody wrote down: they are what Postgres
-- generates for an inline UNIQUE, and they were read off 006 and 011 by the
-- rule table_column_column_key. IF EXISTS makes a wrong guess silent, and a
-- silent wrong guess here is the worst outcome this file has — the old
-- three-column uniqueness would survive beside the new one, every upsert would
-- still conflict on it, and lớp 11 would still write over lớp 10 while the
-- migration reported success.
--
-- So the guess is checked rather than trusted. Any unique constraint left on
-- these tables that does not mention năm học is that failure, and this stops.
DO $$
DECLARE
    stale TEXT;
BEGIN
    SELECT string_agg(con.conname::TEXT, ', ')
      INTO stale
      FROM pg_constraint con
     WHERE con.conrelid IN ('assessment_records'::regclass,
                            'comment_results'::regclass,
                            'conduct_results'::regclass)
       AND con.contype = 'u'
       AND NOT EXISTS (
             SELECT 1
               FROM pg_attribute att
              WHERE att.attrelid = con.conrelid
                AND att.attname = 'school_year'
                AND att.attnum = ANY (con.conkey));

    IF stale IS NOT NULL THEN
        RAISE EXCEPTION
            'Còn ràng buộc duy nhất chưa tính năm học: %. Điểm của các năm học sẽ tiếp tục ghi đè lên nhau.',
            stale;
    END IF;
END $$;

-- ── The indices that follow from it ────────────────────────────────────────
-- 009 exists because the policies were reading whole tables to answer questions
-- an index could have answered, and the same question has to be asked again of
-- every screen now that a fourth column is in the filter.
--
-- assessment_records: 006 built assessment_records_student_idx on
-- (student_id, semester), and the screens now ask for (student_id, semester,
-- school_year) — AppContext loads one student's marks for the current học kỳ of
-- the current năm học. The new UNIQUE cannot serve that: it leads
-- (student_id, subject, ...), and a lookup with no subject in it stops at the
-- first column. So the old index is replaced rather than joined by a second
-- one — (student_id, semester) is a prefix of the new index, so everything the
-- old one answered the new one answers too, and two indices where one will do
-- is a cost paid on every mark a teacher saves.

DROP INDEX IF EXISTS assessment_records_student_idx;
CREATE INDEX IF NOT EXISTS assessment_records_student_year_idx
    ON assessment_records(student_id, semester, school_year);

-- comment_results got the same shape in 009, for the same reason, and needs the
-- same widening.
DROP INDEX IF EXISTS comment_results_student_idx;
CREATE INDEX IF NOT EXISTS comment_results_student_year_idx
    ON comment_results(student_id, semester, school_year);

-- The other half of that screen: staff open a whole class or the whole school,
-- so ownStudentId is null and the filter is nothing but học kỳ and năm học.
-- Nothing indexed that before, because before this migration there was only
-- ever one năm học in the table and the answer was "all of it".
CREATE INDEX IF NOT EXISTS assessment_records_year_semester_idx
    ON assessment_records(school_year, semester);

-- conduct_results needs nothing new. Its rebuilt UNIQUE leads
-- (student_id, semester, school_year), which is exactly the lookup — this is
-- the point 011 already made about its own UNIQUE, and widening the constraint
-- widened the index with it.

-- ── Why attendance_records has no school_year ──────────────────────────────
-- It has a date on every row, and a date already says which năm học it is in —
-- school_year_of() above is that translation. Adding the column would store the
-- same fact twice, and the copy would be the one that goes wrong: correct the
-- date on a record filed under the wrong day and the năm học beside it stays as
-- it was, so the row would then claim two different years at once. A screen
-- that wants a năm học of điểm danh asks for a date range, and
-- attendance_records_date_idx from 006 — (school_id, date) — is already the
-- index for that.
