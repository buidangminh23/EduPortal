-- Proves the row-level security rules actually hold, by impersonating each role
-- and asserting what comes back.
--
-- Policies are the only thing standing between a parent and every other child's
-- marks, and they are invisible from the client: a policy that returns too much
-- looks exactly like a policy that works. So each rule is exercised here rather
-- than reasoned about.
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

INSERT INTO schools (id, name, domain, sgk_series) VALUES
    ('ffffffff-1111-1111-1111-111111111111', 'THPT Kiểm Thử', 'rlstest.edu.vn', 'canh_dieu');

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

INSERT INTO assessment_records (school_id, student_id, subject, semester, regular, midterm, final, average) VALUES
    ('ffffffff-1111-1111-1111-111111111111', 'ff000000-0000-0000-0000-000000000003', 'Toán', 2, ARRAY[8.0, 9.0], 7.0, 6.0, 6.9),
    ('ffffffff-1111-1111-1111-111111111111', 'ff000000-0000-0000-0000-000000000004', 'Toán', 2, ARRAY[5.0, 5.0], 5.0, 5.0, 5.0);

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

-- ── Reading one's own profile must not recurse ─────────────────────────────
-- This is the query that ran on every sign-in and aborted before the fix.

SET LOCAL ROLE postgres;
SELECT act_as('ff000000-0000-0000-0000-000000000003');

SELECT expect('đọc hồ sơ của chính mình không gây đệ quy',
    (SELECT count(*) FROM profiles WHERE id = 'ff000000-0000-0000-0000-000000000003'), 1);

SET LOCAL ROLE postgres;

ROLLBACK;
