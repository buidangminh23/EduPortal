-- Proves the row-level security rules actually hold, by impersonating each role
-- and asserting what comes back.
--
-- Policies are the only thing standing between a parent and every other child's
-- marks, and they are invisible from the client: a policy that returns too much
-- looks exactly like a policy that works. So each rule is exercised here rather
-- than reasoned about.
--
-- Grants are exercised too, at the end. A policy decides which rows a caller
-- may write; the grant decides which columns, and until 010 nothing decided
-- that at all — which is how a student could hand themselves the admin role
-- while every policy in this file went on passing.
--
-- And triggers, since 013, because two of the rules a school cares about most
-- are not expressible as policies at all: a closed sổ điểm refuses writes that
-- RLS would happily allow, and every change to a mark leaves a row behind in a
-- log the caller who made it cannot reach.
--
-- Run against a local stack:
--     supabase db reset
--     psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -v ON_ERROR_STOP=1 -f supabase/tests/rls_check.sql
--
-- Any failure raises, so a non-zero exit means a rule is wrong.

\set ON_ERROR_STOP on

BEGIN;

-- ── Fixtures ───────────────────────────────────────────────────────────────
-- Seeded as the table owner, which RLS does not apply to.

-- A second school, so that "move myself into another school" is a real move
-- rather than a foreign key error that would pass the test for the wrong
-- reason. Nobody is enrolled in it.
INSERT INTO schools (id, name, domain, sgk_series) VALUES
    ('ffffffff-1111-1111-1111-111111111111', 'THPT Kiểm Thử',  'rlstest.edu.vn', 'canh_dieu'),
    ('ffffffff-2222-2222-2222-222222222222', 'THPT Trường Bên', 'other.edu.vn',   'ket_noi_tri_thuc');

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ('ff000000-0000-0000-0000-000000000001', 'admin@test.edu.vn',   '{}'::jsonb),
    ('ff000000-0000-0000-0000-000000000002', 'teacher@test.edu.vn', '{}'::jsonb),
    ('ff000000-0000-0000-0000-000000000003', 'hs1@test.edu.vn',     '{}'::jsonb),
    ('ff000000-0000-0000-0000-000000000004', 'hs2@test.edu.vn',     '{}'::jsonb),
    ('ff000000-0000-0000-0000-000000000005', 'parent1@test.edu.vn', '{}'::jsonb);

INSERT INTO profiles (id, school_id, role, full_name) VALUES
    ('ff000000-0000-0000-0000-000000000001', 'ffffffff-1111-1111-1111-111111111111', 'admin',   'Hiệu trưởng'),
    ('ff000000-0000-0000-0000-000000000002', 'ffffffff-1111-1111-1111-111111111111', 'teacher', 'GV Toán'),
    ('ff000000-0000-0000-0000-000000000003', 'ffffffff-1111-1111-1111-111111111111', 'student', 'Học sinh Một'),
    ('ff000000-0000-0000-0000-000000000004', 'ffffffff-1111-1111-1111-111111111111', 'student', 'Học sinh Hai'),
    ('ff000000-0000-0000-0000-000000000005', 'ffffffff-1111-1111-1111-111111111111', 'parent',  'Phụ huynh Một');

INSERT INTO classes (id, school_id, name, grade) VALUES
    ('ff000000-0000-0000-0000-0000000000c1', 'ffffffff-1111-1111-1111-111111111111', '12A1', 12);

-- The teacher takes 12A1; both students are enrolled in it.
INSERT INTO teaching_assignments (teacher_id, class_id, subject) VALUES
    ('ff000000-0000-0000-0000-000000000002', 'ff000000-0000-0000-0000-0000000000c1', 'Toán');

INSERT INTO enrollments (student_id, class_id) VALUES
    ('ff000000-0000-0000-0000-000000000003', 'ff000000-0000-0000-0000-0000000000c1'),
    ('ff000000-0000-0000-0000-000000000004', 'ff000000-0000-0000-0000-0000000000c1');

-- Parent One is guardian of Student One only. Student Two is another family.
INSERT INTO guardians (parent_id, student_id) VALUES
    ('ff000000-0000-0000-0000-000000000005', 'ff000000-0000-0000-0000-000000000003');

-- Every academic record carries its năm học since 012. Written out here rather
-- than left to a default because there is no default: a row that cannot say
-- which of a pupil's three years it belongs to is the bug 012 exists to end,
-- and the fixtures are held to the same rule as the application.
INSERT INTO assessment_records (school_id, student_id, subject, semester, school_year, regular, midterm, final, average) VALUES
    ('ffffffff-1111-1111-1111-111111111111', 'ff000000-0000-0000-0000-000000000003', 'Toán', 2, '2025-2026', ARRAY[8.0, 9.0], 7.0, 6.0, 6.9),
    ('ffffffff-1111-1111-1111-111111111111', 'ff000000-0000-0000-0000-000000000004', 'Toán', 2, '2025-2026', ARRAY[5.0, 5.0], 5.0, 5.0, 5.0);

-- Kết quả rèn luyện học kỳ I, as the teacher entered it. Student One is Khá and
-- Student Two is Đạt, deliberately neither of them Tốt, so that an attempt below
-- to write 'Tốt' is a real change rather than a value that was already there.
INSERT INTO conduct_results (school_id, student_id, semester, school_year, band, updated_by) VALUES
    ('ffffffff-1111-1111-1111-111111111111', 'ff000000-0000-0000-0000-000000000003', 1, '2025-2026', 'Khá',
     'ff000000-0000-0000-0000-000000000002'),
    ('ffffffff-1111-1111-1111-111111111111', 'ff000000-0000-0000-0000-000000000004', 1, '2025-2026', 'Đạt',
     'ff000000-0000-0000-0000-000000000002');

INSERT INTO invoices (id, school_id, student_id, title, amount, due_date) VALUES
    ('ff000000-0000-0000-0000-0000000000f1', 'ffffffff-1111-1111-1111-111111111111',
     'ff000000-0000-0000-0000-000000000003', 'Học phí tháng 6', 2500000, '2026-06-15');

-- ── Helpers ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION act_as(user_id UUID) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L', json_build_object('sub', user_id, 'role', 'authenticated')::text);
    EXECUTE 'SET LOCAL ROLE authenticated';
END;
$$;

CREATE OR REPLACE FUNCTION expect(label TEXT, actual BIGINT, wanted BIGINT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    IF actual IS DISTINCT FROM wanted THEN
        RAISE EXCEPTION 'FAIL — %: mong đợi %, nhận được %', label, wanted, actual;
    END IF;
    RAISE NOTICE 'ok — %', label;
END;
$$;

-- ── A parent sees their own child and nobody else's ────────────────────────

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000005');

SELECT expect('phụ huynh đọc được điểm của con mình',
    (SELECT count(*) FROM assessment_records WHERE student_id = 'ff000000-0000-0000-0000-000000000003'), 1);

SELECT expect('phụ huynh KHÔNG đọc được điểm học sinh khác',
    (SELECT count(*) FROM assessment_records WHERE student_id = 'ff000000-0000-0000-0000-000000000004'), 0);

SELECT expect('phụ huynh chỉ thấy đúng 1 bản ghi điểm trong toàn bảng',
    (SELECT count(*) FROM assessment_records), 1);

SELECT expect('phụ huynh đọc được hoá đơn của con mình',
    (SELECT count(*) FROM invoices), 1);

-- ── A parent cannot mark their own fee paid ────────────────────────────────
-- RLS alone cannot express this, so a trigger enforces it. Without the guard a
-- payer could clear their own debt.

DO $$
DECLARE blocked BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE invoices SET status = 'paid', paid_at = now(), confirmed_by = 'ff000000-0000-0000-0000-000000000005'
        WHERE id = 'ff000000-0000-0000-0000-0000000000f1';
    EXCEPTION WHEN OTHERS THEN
        blocked := TRUE;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'FAIL — phụ huynh tự đánh dấu ĐÃ THU được tiền';
    END IF;
    RAISE NOTICE 'ok — phụ huynh không tự xác nhận đã thu tiền được';
END;
$$;

-- But declaring a transfer must still work, or the payment flow is dead.
UPDATE invoices SET status = 'pending_reconciliation', declared_at = now(), payment_reference = 'HS1 F01'
WHERE id = 'ff000000-0000-0000-0000-0000000000f1';

SELECT expect('phụ huynh báo đã chuyển khoản được',
    (SELECT count(*) FROM invoices WHERE status = 'pending_reconciliation'), 1);

-- ── A student sees only themselves ─────────────────────────────────────────

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000004');

SELECT expect('học sinh chỉ thấy điểm của chính mình',
    (SELECT count(*) FROM assessment_records), 1);

SELECT expect('học sinh KHÔNG thấy điểm bạn cùng lớp',
    (SELECT count(*) FROM assessment_records WHERE student_id = 'ff000000-0000-0000-0000-000000000003'), 0);

DO $$
DECLARE blocked BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE assessment_records SET average = 10 WHERE student_id = 'ff000000-0000-0000-0000-000000000004';
        IF NOT FOUND THEN blocked := TRUE; END IF;
    EXCEPTION WHEN OTHERS THEN
        blocked := TRUE;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'FAIL — học sinh tự sửa điểm của mình được';
    END IF;
    RAISE NOTICE 'ok — học sinh không tự sửa điểm được';
END;
$$;

-- ── A teacher sees the students they teach, and may write ──────────────────

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000002');

SELECT expect('giáo viên thấy điểm cả hai học sinh lớp mình dạy',
    (SELECT count(*) FROM assessment_records), 2);

UPDATE assessment_records SET average = 7.5 WHERE student_id = 'ff000000-0000-0000-0000-000000000003';
SELECT expect('giáo viên sửa được điểm học sinh lớp mình',
    (SELECT count(*) FROM assessment_records WHERE average = 7.5), 1);

-- ── An admin sees the whole school ─────────────────────────────────────────

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000001');

SELECT expect('hiệu trưởng thấy toàn trường',
    (SELECT count(*) FROM assessment_records), 2);

SELECT expect('hiệu trưởng đọc được hồ sơ toàn trường',
    (SELECT count(*) FROM profiles), 5);

-- ── Kết quả rèn luyện belongs to the teacher who assessed it ───────────────
-- Thông tư 22 Điều 8 khoản 1 leaves the mức to the giáo viên chủ nhiệm. 011
-- hands the write to can_edit_student, which admits staff and refuses everybody
-- the circular never asked — the half of that rule a database can enforce, and
-- the half worth proving. A mức decides a danh hiệu, so the two people with the
-- clearest reason to improve one are the student it is about and the parent
-- reading it, and neither of them may.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000004');

SELECT expect('học sinh chỉ thấy kết quả rèn luyện của chính mình',
    (SELECT count(*) FROM conduct_results), 1);

-- Filing a mức for a học kỳ nobody has assessed yet. The row is refused by the
-- WITH CHECK clause, which raises rather than writing nothing quietly.
DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO conduct_results (school_id, student_id, semester, school_year, band)
        VALUES ('ffffffff-1111-1111-1111-111111111111',
                'ff000000-0000-0000-0000-000000000004', 2, '2025-2026', 'Tốt');
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — học sinh tự ghi kết quả rèn luyện cho mình được';
    END IF;
    RAISE NOTICE 'ok — học sinh không tự ghi kết quả rèn luyện được';
END;
$$;

-- And rewriting the mức the teacher already gave them. This one is refused by
-- the USING clause, which matches no row instead of raising, so the check is
-- that nothing was updated.
DO $$
DECLARE blocked BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE conduct_results SET band = 'Tốt'
        WHERE student_id = 'ff000000-0000-0000-0000-000000000004';
        IF NOT FOUND THEN blocked := TRUE; END IF;
    EXCEPTION WHEN OTHERS THEN
        blocked := TRUE;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'FAIL — học sinh tự sửa mức rèn luyện của mình được';
    END IF;
    RAISE NOTICE 'ok — học sinh không tự sửa mức rèn luyện được';
END;
$$;

SELECT expect('mức rèn luyện của học sinh vẫn đúng mức giáo viên đã ghi',
    (SELECT count(*) FROM conduct_results
     WHERE student_id = 'ff000000-0000-0000-0000-000000000004' AND band = 'Đạt'), 1);

-- A parent, on their own child's record.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000005');

SELECT expect('phụ huynh chỉ thấy kết quả rèn luyện của con mình',
    (SELECT count(*) FROM conduct_results), 1);

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO conduct_results (school_id, student_id, semester, school_year, band)
        VALUES ('ffffffff-1111-1111-1111-111111111111',
                'ff000000-0000-0000-0000-000000000003', 2, '2025-2026', 'Tốt');
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — phụ huynh tự ghi kết quả rèn luyện cho con được';
    END IF;
    RAISE NOTICE 'ok — phụ huynh không tự ghi kết quả rèn luyện cho con được';
END;
$$;

DO $$
DECLARE blocked BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE conduct_results SET band = 'Tốt'
        WHERE student_id = 'ff000000-0000-0000-0000-000000000003';
        IF NOT FOUND THEN blocked := TRUE; END IF;
    EXCEPTION WHEN OTHERS THEN
        blocked := TRUE;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'FAIL — phụ huynh tự nâng mức rèn luyện của con được';
    END IF;
    RAISE NOTICE 'ok — phụ huynh không nâng được mức rèn luyện của con';
END;
$$;

-- Deleting is the other way to get rid of an unwelcome mức, because 011 makes
-- chưa đánh giá the absence of a row. It is the same policy, so it fails the
-- same silent way, and it is asked separately because "nobody may edit" and
-- "nobody may erase" are two different sentences.
DO $$
DECLARE blocked BOOLEAN := FALSE;
BEGIN
    BEGIN
        DELETE FROM conduct_results
        WHERE student_id = 'ff000000-0000-0000-0000-000000000003';
        IF NOT FOUND THEN blocked := TRUE; END IF;
    EXCEPTION WHEN OTHERS THEN
        blocked := TRUE;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'FAIL — phụ huynh xoá được kết quả rèn luyện của con';
    END IF;
    RAISE NOTICE 'ok — phụ huynh không xoá được kết quả rèn luyện của con';
END;
$$;

SELECT expect('mức rèn luyện của con vẫn nguyên là Khá',
    (SELECT count(*) FROM conduct_results
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003' AND band = 'Khá'), 1);

-- And the teacher's own entry still works, including taking one back. A lock
-- that also stops the GVCN correcting a mức they typed wrong is a bug reported
-- as a lock — and with no "chưa đánh giá" value to write, undoing one is a
-- DELETE or it is nothing.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000002');

INSERT INTO conduct_results (school_id, student_id, semester, school_year, band, updated_by)
VALUES ('ffffffff-1111-1111-1111-111111111111',
        'ff000000-0000-0000-0000-000000000003', 2, '2025-2026', 'Tốt',
        'ff000000-0000-0000-0000-000000000002');

SELECT expect('giáo viên ghi được mức rèn luyện học kỳ II',
    (SELECT count(*) FROM conduct_results
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003'), 2);

DELETE FROM conduct_results
 WHERE student_id = 'ff000000-0000-0000-0000-000000000003' AND semester = 2;

SELECT expect('giáo viên xoá lại được mức vừa ghi nhầm',
    (SELECT count(*) FROM conduct_results
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003'), 1);

-- ── Sổ điểm đã khoá ────────────────────────────────────────────────────────
-- Everything above this line is decided by row-level security, and none of it
-- can express "học kỳ này đã chốt". A policy sees one row of one table; whether
-- that row's học kỳ has been closed is a fact in another table entirely. So 013
-- puts the rule in a trigger, and a trigger is invisible from the client in
-- exactly the way a policy is: one that has stopped firing looks like a school
-- where nobody happens to have edited an old mark yet.
--
-- The lock arrives here rather than with the fixtures at the top so that every
-- assertion above is measured against an open sổ điểm and means only what it
-- says.

SET LOCAL ROLE postgres;

-- A học kỳ I mark to close the book on. Student One now has Toán in both học
-- kỳ, which is also the shape 012 made possible: before it, a second row for
-- the same subject and student could only exist by displacing the first.
INSERT INTO assessment_records (school_id, student_id, subject, semester, school_year, regular, midterm, final, average) VALUES
    ('ffffffff-1111-1111-1111-111111111111', 'ff000000-0000-0000-0000-000000000003',
     'Toán', 1, '2025-2026', ARRAY[6.0], 6.0, 6.0, 6.0);

-- Ban Giám Hiệu closes học kỳ I. Written through the policy rather than as the
-- owner, so this also asserts that an admin may close a book at all.
SELECT act_as('ff000000-0000-0000-0000-000000000001');

INSERT INTO gradebook_locks (school_id, school_year, semester, locked_by)
VALUES ('ffffffff-1111-1111-1111-111111111111', '2025-2026', 1,
        'ff000000-0000-0000-0000-000000000001');

SELECT expect('hiệu trưởng khoá được sổ điểm học kỳ I',
    (SELECT count(*) FROM gradebook_locks WHERE semester = 1), 1);

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000002');

-- A teacher whose write is about to be refused has to be able to find out why,
-- so the lock itself is readable school-wide. It says nothing about any student.
SELECT expect('giáo viên đọc được trạng thái khoá của sổ điểm',
    (SELECT count(*) FROM gradebook_locks), 1);

DO $$
DECLARE blocked BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE assessment_records SET average = 9.9
        WHERE student_id = 'ff000000-0000-0000-0000-000000000003' AND semester = 1;
    EXCEPTION WHEN raise_exception THEN
        blocked := TRUE;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'FAIL — giáo viên sửa được điểm học kỳ đã khoá';
    END IF;
    RAISE NOTICE 'ok — giáo viên không sửa được điểm học kỳ đã khoá';
END;
$$;

SELECT expect('điểm học kỳ đã khoá vẫn nguyên như lúc chốt',
    (SELECT count(*) FROM assessment_records
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003'
       AND semester = 1 AND average = 6.0), 1);

-- Filing a new subject into a closed học kỳ is the same act as editing one.
DO $$
DECLARE blocked BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO assessment_records (school_id, student_id, subject, semester, school_year, average)
        VALUES ('ffffffff-1111-1111-1111-111111111111',
                'ff000000-0000-0000-0000-000000000003', 'Vật lí', 1, '2025-2026', 9.0);
    EXCEPTION WHEN raise_exception THEN
        blocked := TRUE;
    END;

    IF NOT blocked THEN
        RAISE EXCEPTION 'FAIL — giáo viên thêm được môn mới vào học kỳ đã khoá';
    END IF;
    RAISE NOTICE 'ok — giáo viên không thêm được môn vào học kỳ đã khoá';
END;
$$;

-- And the other direction, which is the one worth stating: a lock on học kỳ I
-- must not close học kỳ II. A guard that stops the term in progress is reported
-- as "hệ thống hỏng", and it is fixed by turning the guard off.
UPDATE assessment_records SET average = 8.0
WHERE student_id = 'ff000000-0000-0000-0000-000000000003' AND semester = 2;

SELECT expect('giáo viên vẫn vào được điểm học kỳ chưa khoá',
    (SELECT count(*) FROM assessment_records
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003'
       AND semester = 2 AND average = 8.0), 1);

-- Lifting the lock is not a teacher's to do. A teacher who could unlock their
-- own class is a teacher for whom no lock exists.
DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO gradebook_locks (school_id, school_year, semester, locked_by)
        VALUES ('ffffffff-1111-1111-1111-111111111111', '2025-2026', 2,
                'ff000000-0000-0000-0000-000000000002');
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — giáo viên tự khoá được sổ điểm';
    END IF;
    RAISE NOTICE 'ok — giáo viên không tự khoá sổ điểm được';
END;
$$;

-- The correction path. A wrong mark found after chốt has to be fixable, or the
-- school keeps a second gradebook on paper and this one stops being true.
SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000001');

UPDATE assessment_records SET average = 6.5
WHERE student_id = 'ff000000-0000-0000-0000-000000000003' AND semester = 1;

SELECT expect('hiệu trưởng sửa được điểm trong học kỳ đã khoá',
    (SELECT count(*) FROM assessment_records
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003'
       AND semester = 1 AND average = 6.5), 1);

-- ── Nhật ký sửa điểm ───────────────────────────────────────────────────────
-- The question this table exists for is a parent's: "điểm con tôi bị sửa". Both
-- halves of the answer are asserted here — the teacher's ordinary edit earlier
-- in this file, and the admin's correction inside the closed học kỳ just now.
-- The correction being logged is the whole reason the lock may let an admin
-- through at all.

SELECT expect('nhật ký ghi lại lần giáo viên sửa điểm, kèm điểm cũ và điểm mới',
    (SELECT count(*) FROM assessment_history
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003'
       AND operation = 'UPDATE'
       AND changed_by = 'ff000000-0000-0000-0000-000000000002'
       AND old_average = 6.9 AND new_average = 7.5), 1);

SELECT expect('nhật ký ghi lại cả lần hiệu trưởng sửa điểm đã chốt',
    (SELECT count(*) FROM assessment_history
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003'
       AND semester = 1
       AND changed_by = 'ff000000-0000-0000-0000-000000000001'
       AND old_average = 6.0 AND new_average = 6.5), 1);

-- And the write that was refused left nothing behind. This is what the BEFORE
-- guard and the AFTER log being timed the way they are actually buys: a log
-- that records attempts as if they were changes accuses people of things they
-- did not manage to do.
SELECT expect('lần ghi bị từ chối không để lại dòng nào trong nhật ký',
    (SELECT count(*) FROM assessment_history WHERE subject = 'Vật lí'), 0);

-- Who may read it: Ban Giám Hiệu, nobody else. A parent reading this table
-- would see every digit a teacher ever typed and corrected a minute later, and
-- would be reading marks that were never anybody's result.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000004');

SELECT expect('học sinh không đọc được nhật ký sửa điểm',
    (SELECT count(*) FROM assessment_history), 0);

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO assessment_history (school_id, student_id, subject, semester, school_year, operation, new_average)
        VALUES ('ffffffff-1111-1111-1111-111111111111',
                'ff000000-0000-0000-0000-000000000004', 'Toán', 2, '2025-2026', 'UPDATE', 10);
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — học sinh tự viết được vào nhật ký sửa điểm';
    END IF;
    RAISE NOTICE 'ok — học sinh không viết được vào nhật ký sửa điểm';
END;
$$;

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000005');

SELECT expect('phụ huynh không đọc được nhật ký sửa điểm',
    (SELECT count(*) FROM assessment_history), 0);

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        DELETE FROM gradebook_locks WHERE semester = 1;
        IF NOT FOUND THEN refused := TRUE; END IF;
    EXCEPTION WHEN OTHERS THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — phụ huynh mở khoá được sổ điểm';
    END IF;
    RAISE NOTICE 'ok — phụ huynh không mở khoá được sổ điểm';
END;
$$;

-- The teacher deleting the row that names them. This is the one an audit log
-- lives or dies by: a log its own subject can edit records only what that
-- subject was willing to leave in it. Refused at the privilege, before a single
-- row is looked at — authenticated is granted SELECT on this table and nothing
-- else.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000002');

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        DELETE FROM assessment_history
        WHERE changed_by = 'ff000000-0000-0000-0000-000000000002';
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — giáo viên xoá được dòng nhật ký ghi tên mình';
    END IF;
    RAISE NOTICE 'ok — giáo viên không xoá được dòng nhật ký ghi tên mình';
END;
$$;

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE assessment_history SET old_average = new_average
        WHERE changed_by = 'ff000000-0000-0000-0000-000000000002';
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — giáo viên sửa lại được dòng nhật ký ghi tên mình';
    END IF;
    RAISE NOTICE 'ok — giáo viên không sửa được dòng nhật ký ghi tên mình';
END;
$$;

-- The second lock, tested the way 010's is: a guard nobody has ever seen fire
-- is a guess. It cannot fire while the client holds neither the privilege nor a
-- policy, so both are widened here exactly the way a later migration would by
-- accident — GRANT ALL and a FOR ALL policy are each one line somebody writes
-- without thinking about this table — and the write is still refused. This time
-- by the trigger, whose error is its own.
--
-- The probe policy is FOR ALL rather than FOR DELETE, because a DELETE with a
-- WHERE clause has to read the rows it is deleting and so is judged by the
-- SELECT policy too. FOR DELETE alone would leave the teacher matching no rows,
-- and the test would pass without the trigger ever running — proving nothing,
-- loudly.

SET LOCAL ROLE postgres;
GRANT DELETE ON TABLE assessment_history TO authenticated;
CREATE POLICY "assessment_history_delete_probe" ON assessment_history FOR ALL
    TO authenticated USING (TRUE) WITH CHECK (TRUE);
SELECT act_as('ff000000-0000-0000-0000-000000000002');

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        DELETE FROM assessment_history
        WHERE changed_by = 'ff000000-0000-0000-0000-000000000002';
    EXCEPTION WHEN raise_exception THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — nới quyền là mở lại đường xoá nhật ký';
    END IF;
    RAISE NOTICE 'ok — trigger vẫn giữ nhật ký nguyên vẹn dù quyền bị nới';
END;
$$;

SET LOCAL ROLE postgres;
DROP POLICY "assessment_history_delete_probe" ON assessment_history;
REVOKE DELETE ON TABLE assessment_history FROM authenticated;

SELECT expect('nhật ký vẫn còn nguyên dòng ghi tên giáo viên',
    (SELECT count(*) FROM assessment_history
     WHERE changed_by = 'ff000000-0000-0000-0000-000000000002'
       AND old_average = 6.9 AND new_average = 7.5), 1);

-- Unlocking, and the teacher can work again. The lock is a row: its absence is
-- an open sổ điểm, so this also asserts that removing it removes the refusal
-- rather than leaving something behind that has to be undone separately.

SELECT act_as('ff000000-0000-0000-0000-000000000001');
DELETE FROM gradebook_locks WHERE semester = 1;

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000002');

UPDATE assessment_records SET average = 7.0
WHERE student_id = 'ff000000-0000-0000-0000-000000000003' AND semester = 1;

SELECT expect('mở khoá xong giáo viên vào điểm học kỳ I lại được',
    (SELECT count(*) FROM assessment_records
     WHERE student_id = 'ff000000-0000-0000-0000-000000000003'
       AND semester = 1 AND average = 7.0), 1);

-- ── Reading one's own profile must not recurse ─────────────────────────────
-- This is the query that ran on every sign-in and aborted before the fix.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000003');

SELECT expect('đọc hồ sơ của chính mình không gây đệ quy',
    (SELECT count(*) FROM profiles WHERE id = 'ff000000-0000-0000-0000-000000000003'), 1);

-- ── Nobody hands themselves a role ─────────────────────────────────────────
-- Everything above this line is decided by profiles.role, which auth_role()
-- reads and every policy in the schema believes. 001 said which row a user may
-- update and nothing about which columns; 005 granted UPDATE on the whole
-- table. So the field that decides who may read a child's marks was writable
-- by the child, and nothing in this file noticed — every assertion above still
-- passes for a student who has just made themselves an admin, because by then
-- they really are one.
--
-- 010 refuses the write at the column grant, which means Postgres raises
-- insufficient_privilege before a single row is examined. That is a different
-- outcome from "the policy matched nothing and zero rows changed", and the
-- difference matters: one means the door is locked, the other means the door
-- happened to open onto an empty room. So these tests name the error.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000003');

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE profiles SET role = 'admin'
        WHERE id = 'ff000000-0000-0000-0000-000000000003';
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — học sinh tự đặt mình thành admin được';
    END IF;
    RAISE NOTICE 'ok — học sinh không đổi được vai trò của chính mình';
END;
$$;

SELECT expect('vai trò của học sinh vẫn là student sau khi thử nâng quyền',
    (SELECT count(*) FROM profiles
     WHERE id = 'ff000000-0000-0000-0000-000000000003' AND role = 'student'), 1);

-- Crossing schools is the same escalation through a different column:
-- auth_school_id() would then point at the other school's roster.

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE profiles SET school_id = 'ffffffff-2222-2222-2222-222222222222'
        WHERE id = 'ff000000-0000-0000-0000-000000000003';
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — học sinh tự chuyển mình sang trường khác được';
    END IF;
    RAISE NOTICE 'ok — học sinh không tự chuyển trường được';
END;
$$;

SELECT expect('học sinh vẫn thuộc trường cũ',
    (SELECT count(*) FROM profiles
     WHERE id = 'ff000000-0000-0000-0000-000000000003'
       AND school_id = 'ffffffff-1111-1111-1111-111111111111'), 1);

-- Staff are ordinary signed-in users as far as this grant is concerned. A
-- teacher already reads a whole class; admin would be the whole school.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000002');

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE profiles SET role = 'admin'
        WHERE id = 'ff000000-0000-0000-0000-000000000002';
    EXCEPTION WHEN insufficient_privilege THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — giáo viên tự lên hiệu trưởng được';
    END IF;
    RAISE NOTICE 'ok — giáo viên không tự lên admin được';
END;
$$;

SELECT expect('giáo viên vẫn là teacher',
    (SELECT count(*) FROM profiles
     WHERE id = 'ff000000-0000-0000-0000-000000000002' AND role = 'teacher'), 1);

-- ── And the fields a user does own still work ──────────────────────────────
-- A lock that also stops somebody fixing the spelling of their own name is a
-- bug reported as a lock. This is the half of 010 that must keep working.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000003');

UPDATE profiles
   SET full_name = 'Nguyễn Học Sinh Một',
       avatar_url = 'https://cdn.rlstest.edu.vn/hs1.png'
 WHERE id = 'ff000000-0000-0000-0000-000000000003';

SELECT expect('học sinh vẫn sửa được tên hiển thị và ảnh đại diện của mình',
    (SELECT count(*) FROM profiles
     WHERE id = 'ff000000-0000-0000-0000-000000000003'
       AND full_name = 'Nguyễn Học Sinh Một'
       AND avatar_url = 'https://cdn.rlstest.edu.vn/hs1.png'), 1);

-- ── The second lock, tested on its own ─────────────────────────────────────
-- The column grant is what closes this hole; the trigger in 010 is what
-- survives somebody re-opening it, and a guard nobody has ever seen fire is a
-- guess. It cannot fire while the grant is narrow — the privilege check runs
-- first — so widen the grant here exactly the way a future migration would by
-- accident, and check the write is still refused. This time the error is the
-- trigger's own, not the privilege system's.

SET LOCAL ROLE postgres;
GRANT UPDATE ON TABLE profiles TO authenticated;
SELECT act_as('ff000000-0000-0000-0000-000000000003');

DO $$
DECLARE refused BOOLEAN := FALSE;
BEGIN
    BEGIN
        UPDATE profiles SET role = 'admin'
        WHERE id = 'ff000000-0000-0000-0000-000000000003';
    EXCEPTION WHEN raise_exception THEN
        refused := TRUE;
    END;

    IF NOT refused THEN
        RAISE EXCEPTION 'FAIL — nới lại quyền UPDATE là mở lại lỗ nâng quyền';
    END IF;
    RAISE NOTICE 'ok — trigger vẫn chặn dù quyền UPDATE bị nới lại toàn bảng';
END;
$$;

SELECT expect('vai trò học sinh vẫn nguyên sau khi trigger chặn',
    (SELECT count(*) FROM profiles
     WHERE id = 'ff000000-0000-0000-0000-000000000003' AND role = 'student'), 1);

SET LOCAL ROLE postgres;

-- Put the real grant back, so anything added below this line is measured
-- against the schema as 010 leaves it and not against the widened one. The
-- ROLLBACK would undo it either way; this is so the file never leaves a reader
-- guessing which grant is in force at any point in it.
REVOKE UPDATE ON TABLE profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url) ON TABLE profiles TO authenticated;

ROLLBACK;
