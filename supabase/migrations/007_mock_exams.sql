-- Kết quả thi thử. Until now these lived only in the browser that sat the
-- paper: a student who cleared their cache lost every attempt, and no teacher
-- or head teacher could see a single result. A school can run a mock exam for
-- a thousand students and end up with nothing to look at.
--
-- Each sitting is its own row, appended, never edited. A paper that has been
-- handed in is a record of what somebody wrote at a moment — the policies
-- below give nobody UPDATE or DELETE, so a mark cannot be quietly improved
-- after the fact, not by the student and not by staff.
--
-- Visibility delegates to can_view_student from 005, which is where the rule
-- "who may read a student's academic records" is written down once.

CREATE TABLE mock_exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Which paper. `exam_id` is the app's own identifier, including the
    -- derived ones for single-subject papers ("A00_full_Math"), so it is text
    -- rather than a reference to a table of exams that does not exist yet.
    exam_id TEXT NOT NULL,
    title TEXT NOT NULL,
    block TEXT,

    -- Who sat it, as they were at the time. Denormalised on purpose: a student
    -- moves class between sittings, and a result belongs to the class they were
    -- in that day. Reading the current class back would quietly re-file last
    -- term's papers under this term's class.
    student_name TEXT,
    class_name TEXT,

    -- Out of 30 for a three-subject block, out of 10 for one subject. Which it
    -- is can be read from subject_breakdown, which names every subject sat.
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 30),
    total_questions SMALLINT NOT NULL CHECK (total_questions >= 0),

    -- "48:12" — how long the paper was open, as the student's screen showed it.
    time_spent TEXT,

    -- How many times the machine went down mid-paper and the student resumed.
    -- Kept because a teacher reading a low score deserves to know the exam was
    -- sat three times over rather than guess at nerves.
    interruptions SMALLINT NOT NULL DEFAULT 0 CHECK (interruptions >= 0),

    -- Per-subject marks, exactly as calculateExamScore produced them.
    subject_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- The answer sheet, so a paper can be reviewed question by question later.
    selected_answers JSONB NOT NULL DEFAULT '{}'::jsonb,

    taken_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- The two questions asked of this table: "how has this student been doing"
-- and "how did the school do on this paper".
CREATE INDEX mock_exam_results_student_idx ON mock_exam_results(student_id, taken_at DESC);
CREATE INDEX mock_exam_results_school_idx ON mock_exam_results(school_id, exam_id);

ALTER TABLE mock_exam_results ENABLE ROW LEVEL SECURITY;

-- Students, their teachers, their parents and the head teacher may read.
CREATE POLICY "mock_exam_select" ON mock_exam_results FOR SELECT
    TO authenticated USING (can_view_student(student_id));

-- A student hands in their own paper. Staff may also file one — a teacher
-- entering a sitting done on paper — but nobody may file one under a student
-- they have nothing to do with.
CREATE POLICY "mock_exam_insert" ON mock_exam_results FOR INSERT
    TO authenticated WITH CHECK (
        student_id = auth.uid() OR can_edit_student(student_id)
    );

-- Deliberately no UPDATE and no DELETE policy: a handed-in paper is not
-- editable by anybody through the application. Correcting one is a database
-- operation somebody has to do on purpose, which is the point.

GRANT SELECT, INSERT ON TABLE mock_exam_results TO authenticated;
