-- The indices the policies have been asking for since 005.
--
-- Nothing here changes what anybody can see. It changes how much of a table
-- Postgres has to read to work that out — which at a hundred demo rows is
-- invisible and at a thousand students is the difference between a gradebook
-- that opens and one that times out.
--
-- Every index below is chosen from a predicate that already exists in an
-- earlier migration, so each one is paired with the policy or function it
-- serves. Composite where the predicate names two columns, partial where the
-- predicate names a value, single-column where that is genuinely all that is
-- asked. IF NOT EXISTS throughout, the way 005 does it, so this file can be
-- re-run against a database that already has some of them.

-- ── The one that matters most ──────────────────────────────────────────────
-- 005 defines auth_taught_student_ids() as
--
--   SELECT e.student_id FROM enrollments e
--   JOIN teaching_assignments ta ON ta.class_id = e.class_id
--   WHERE ta.teacher_id = auth.uid()
--
-- and that function backs can_view_student / can_edit_student, which back the
-- policies on assessment_records, comment_results, attendance_records,
-- leave_requests, invoices and mock_exam_results. 001 gave enrollments a
-- primary key of (student_id, class_id) and nothing else — an index that leads
-- with the wrong column for this join — so every teacher read or write against
-- any of those six tables has been scanning the whole enrollment table.
--
-- student_id rides along because it is the only column the function selects:
-- with it here Postgres answers from the index alone and never touches the
-- table. The leading column is still class_id, so this serves a plain
-- "who is in this class" lookup too.
CREATE INDEX IF NOT EXISTS enrollments_class_idx ON enrollments(class_id, student_id);

-- The other side of that join, and "who teaches this class". 001's
-- UNIQUE (teacher_id, class_id, subject) already answers the teacher_id
-- direction; nothing answers the class_id direction, including the policy on
-- this table, which filters on class_id.
CREATE INDEX IF NOT EXISTS teaching_assignments_class_idx ON teaching_assignments(class_id);

-- ── Hỏi đáp gia sư ─────────────────────────────────────────────────────────
-- 003 created messages with no index at all, so opening a conversation reads
-- every message in the school to find the dozen that belong to it. Ordered by
-- created_at because that is how a conversation is read — the index hands the
-- history back already in order rather than sorting it afterwards.
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at);

-- 003's SELECT policy is `student_id = auth.uid() OR teacher_id = auth.uid()`.
-- Two separate indices rather than one composite: an OR over two columns is
-- served by scanning both and combining, and a composite leading with
-- student_id cannot answer the teacher_id half at all.
CREATE INDEX IF NOT EXISTS conversations_student_idx ON conversations(student_id);
CREATE INDEX IF NOT EXISTS conversations_teacher_idx ON conversations(teacher_id);

-- 002's read policy on knowledge_entries branches three ways. The base layer
-- is found by school and layer together; the teacher and group layers are both
-- found by owner_id, which is a profile id in one case and a subject group id
-- in the other.
CREATE INDEX IF NOT EXISTS knowledge_entries_school_layer_idx ON knowledge_entries(school_id, layer);
CREATE INDEX IF NOT EXISTS knowledge_entries_owner_idx ON knowledge_entries(owner_id);

-- ── Cấu hình gia sư và hàng chờ duyệt ──────────────────────────────────────
-- 002's own policy for a teacher: teacher_id = auth.uid().
CREATE INDEX IF NOT EXISTS tutor_configs_teacher_idx ON tutor_configs(teacher_id);

-- 002's second policy lets any student read a published config. Partial rather
-- than an index on status: the column holds two values, so indexing it whole
-- buys nothing, while an index over only the published rows is small and is
-- what that policy actually selects. teacher_id leads it so "the published
-- config of this teacher" — the question the tutor screen asks — is answered
-- by the same index.
CREATE INDEX IF NOT EXISTS tutor_configs_published_idx
    ON tutor_configs(teacher_id) WHERE status = 'published';

-- 004's policy scopes the queue to its teacher; the screen then shows what is
-- still pending. Composite, because those two are always asked together.
CREATE INDEX IF NOT EXISTS review_queue_teacher_idx ON review_queue(teacher_id, status);

CREATE INDEX IF NOT EXISTS golden_tests_owner_idx ON golden_tests(owner_id);

-- ── Sổ điểm — môn đánh giá bằng nhận xét ───────────────────────────────────
-- assessment_records got assessment_records_student_idx in 006 and its sibling
-- did not, so the nhận xét subjects fall back to the implicit index behind
-- UNIQUE (student_id, subject, semester) — which cannot answer "this student,
-- this semester" without a subject to go with it.
CREATE INDEX IF NOT EXISTS comment_results_student_idx ON comment_results(student_id, semester);

-- ── Tenant scoping ─────────────────────────────────────────────────────────
-- Every read of these three is filtered by school_id, by the policies 005
-- rewrote and by auth_school_id() inside them. One school makes that a full
-- scan that happens to return everything; the index is what keeps an admin
-- roster honest at a thousand accounts, and what a second school would need
-- from the first day.
CREATE INDEX IF NOT EXISTS profiles_school_idx ON profiles(school_id);
CREATE INDEX IF NOT EXISTS classes_school_idx ON classes(school_id);
CREATE INDEX IF NOT EXISTS subject_groups_school_idx ON subject_groups(school_id);
