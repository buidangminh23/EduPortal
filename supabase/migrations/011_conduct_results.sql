-- Kết quả rèn luyện — Thông tư 22/2021/TT-BGDĐT Điều 8.
--
-- Until now this lived only in the browser the giáo viên chủ nhiệm typed it
-- into: Web/src/lib/db/repository.js had no table to write to, so the mức went
-- into the students blob in localStorage and stopped there. A GVCN who assesses
-- a class from the staff room and a head teacher who opens the học bạ from the
-- office see two different records, and the danh hiệu — which classifyTitle
-- decides from kết quả rèn luyện together with kết quả học tập — cannot be
-- awarded from any machine but the one that did the typing.
--
-- The shape matches Web/src/lib/domain/conduct.js so the calculation layer needs
-- no changes: one mức per học kỳ (Điều 8 khoản 2 điểm a), stored as one of the
-- four words the circular names.
--
-- Visibility delegates to can_view_student / can_edit_student from 005, the
-- single place "who may read a student's academic records" is written down.

-- ── Kết quả rèn luyện theo học kỳ ──────────────────────────────────────────

CREATE TABLE conduct_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 1 or 2, the same as assessment_records and comment_results in 006. The
    -- student projection uses 'semester1' / 'semester2', the shape
    -- conductResults shares with commentResults, and the two spellings meet in
    -- exactly one place: conductSemesterNumber / conductSemesterKey in
    -- Web/src/lib/domain/conduct.js, which AppContext calls on the way out and
    -- on the way back. The repository passes the number through untouched, so
    -- nothing between that pair and this column knows there are two spellings
    -- at all — which is the point. Two places that both know how to translate
    -- is one place that can be corrected and one that stays wrong.
    semester SMALLINT NOT NULL CHECK (semester IN (1, 2)),

    -- The mức. NOT NULL, and the four values are the four LEARNING_BAND words —
    -- Điều 8 khoản 2 names no fifth, and conduct.js compares this string against
    -- LEARNING_BAND.GOOD when deciding a danh hiệu, so a near-miss spelling here
    -- would silently deny one.
    --
    -- There is no "chưa đánh giá" value because chưa đánh giá is the absence of
    -- a row. The obvious alternative — a nullable band, one row per student per
    -- semester written the moment a class is opened — makes an empty row
    -- indistinguishable from an assessment that happened and reached no verdict,
    -- and readConductBand's whole purpose is that a screen can tell those apart.
    -- A student the GVCN has not yet reached must read back as nothing at all.
    band TEXT NOT NULL CHECK (band IN ('Tốt', 'Khá', 'Đạt', 'Chưa đạt')),

    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    -- One mức per student per học kỳ. Re-assessing corrects the existing row
    -- rather than stacking a second verdict beside the first, which is what lets
    -- the repository upsert on this pair the way 006's siblings do.
    UNIQUE (student_id, semester)
);

-- Kết quả rèn luyện cả năm học is deliberately not a column here. Điều 8 khoản
-- 2 điểm b derives it from the two semesters, and conductBandForYear does that
-- derivation; a stored year band would be a second source for the same fact and
-- would go stale the moment somebody corrects học kỳ I, leaving a học bạ whose
-- year result no longer follows from the semesters printed above it.

-- No index beyond the one UNIQUE (student_id, semester) already builds. That
-- index leads with student_id, so it answers both questions the screens ask —
-- "this student's rèn luyện" and "this student, this học kỳ". This is where
-- comment_results differed and needed comment_results_student_idx in 009: its
-- UNIQUE leads (student_id, subject, semester), which cannot answer a lookup
-- with no subject in it.

ALTER TABLE conduct_results ENABLE ROW LEVEL SECURITY;

-- Students, their teachers, their parents and the head teacher may read, the
-- same audience as every other academic record.
CREATE POLICY "conduct_results_select" ON conduct_results FOR SELECT
    TO authenticated USING (can_view_student(student_id));

-- Who may write.
--
-- Điều 8 khoản 1 makes this the giáo viên chủ nhiệm's assessment: they follow
-- the student through the year, weigh what the subject teachers and the family
-- report, take the student's self-assessment, and only then choose a mức. It is
-- not any teacher's to enter.
--
-- The database cannot say that, and this policy does not pretend to. What
-- can_edit_student admits, from 005, is an admin over anyone in their school and
-- a teacher over any student enrolled in any class they are assigned to — so a
-- GVCN qualifies, and so does the maths teacher who shares that class. Nothing
-- in the schema tells the two apart: teaching_assignments records
-- (teacher_id, class_id, subject) and carries no homeroom flag, and 005 offers
-- no helper narrower than this one. Inventing a marker here — treating some
-- subject string as "chủ nhiệm", say — would be inventing a rule the school
-- never stated, and it would be the kind of rule that is wrong quietly.
--
-- So the honest division: the database enforces "staff who teach this student",
-- which is what it can know, and the application is expected to route entry
-- through the GVCN, which is what the circular requires. updated_by names who
-- entered each mức, so an assessment that came from the wrong teacher is at
-- least visible afterwards rather than anonymous. When the schema grows a
-- homeroom relation, this policy is the one line to narrow.
--
-- FOR ALL, following comment_results, which also covers DELETE, and staff are
-- granted it below on purpose: applyConductResult takes null to clear an entry,
-- and since chưa đánh giá is the absence of a row, undoing a mistaken mức is a
-- DELETE or it is nothing. Without it a teacher who picked the wrong word could
-- only replace it with another verdict, never take the verdict back off the
-- child.
CREATE POLICY "conduct_results_write" ON conduct_results FOR ALL
    TO authenticated USING (can_edit_student(student_id)) WITH CHECK (can_edit_student(student_id));

-- ── Grants ─────────────────────────────────────────────────────────────────
-- A table created in a migration carries no privileges for the API roles, so
-- without this the client is refused at the table and the policies above never
-- run. RLS narrows this grant row by row.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE conduct_results TO authenticated;
