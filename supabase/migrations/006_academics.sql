-- Storage for the three core workflows that still live in localStorage:
-- sổ điểm, điểm danh, học phí. Plus a bucket for teaching materials.
--
-- Shapes match the domain modules in Web/src/lib/domain/ so the calculation
-- layer needs no changes: grading.js already works on { regular[], midterm,
-- final }, attendance.js on { studentId, date, status }, fees.js on integer
-- đồng. The database stores what those functions consume, and re-states their
-- invariants as CHECK constraints so a bug in the client cannot write a value
-- the circular does not allow.
--
-- Every policy here delegates to can_view_student / can_edit_student from
-- 005, which is the single place the visibility rule is written down.

-- ── Sổ điểm — môn tính điểm ────────────────────────────────────────────────

CREATE TABLE assessment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    semester SMALLINT NOT NULL CHECK (semester IN (1, 2)),

    -- ĐĐGtx. Thông tư 22 Điều 6 allows 2 to 4 depending on lessons per year;
    -- NULL entries are slots not yet filled, which is why this is not NOT NULL.
    regular NUMERIC(4,1)[] NOT NULL DEFAULT '{}',
    midterm NUMERIC(4,1),   -- ĐĐGgk, hệ số 2
    final NUMERIC(4,1),     -- ĐĐGck, hệ số 3

    -- ĐTBmhk, derived by the client from the marks above. Stored so the school
    -- can query and report on it without recomputing, never typed by hand.
    average NUMERIC(4,1),

    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    UNIQUE (student_id, subject, semester),

    CONSTRAINT assessment_midterm_range CHECK (midterm IS NULL OR (midterm >= 0 AND midterm <= 10)),
    CONSTRAINT assessment_final_range CHECK (final IS NULL OR (final >= 0 AND final <= 10)),
    CONSTRAINT assessment_average_range CHECK (average IS NULL OR (average >= 0 AND average <= 10)),
    -- Guards the array too: a client bug cannot store 15 as a mark.
    -- Written with ALL rather than a subquery over unnest(), because a CHECK
    -- constraint may not contain a subquery.
    CONSTRAINT assessment_regular_range CHECK (
        regular IS NULL OR (0 <= ALL (regular) AND 10 >= ALL (regular))
    ),
    CONSTRAINT assessment_regular_count CHECK (array_length(regular, 1) IS NULL OR array_length(regular, 1) <= 4)
);

CREATE INDEX assessment_records_student_idx ON assessment_records(student_id, semester);

ALTER TABLE assessment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessment_select" ON assessment_records FOR SELECT
    TO authenticated USING (can_view_student(student_id));
CREATE POLICY "assessment_insert" ON assessment_records FOR INSERT
    TO authenticated WITH CHECK (can_edit_student(student_id));
CREATE POLICY "assessment_update" ON assessment_records FOR UPDATE
    TO authenticated USING (can_edit_student(student_id)) WITH CHECK (can_edit_student(student_id));

-- ── Sổ điểm — môn đánh giá bằng nhận xét ───────────────────────────────────
-- Kept apart from the marks rather than squeezed into the same row: Điều 5
-- gives these subjects no number at all, and a NULL average beside a text
-- result invites someone to average them together.

CREATE TABLE comment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    semester SMALLINT NOT NULL CHECK (semester IN (1, 2)),
    result TEXT CHECK (result IN ('Đạt', 'Chưa đạt')),
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE (student_id, subject, semester)
);

ALTER TABLE comment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_results_select" ON comment_results FOR SELECT
    TO authenticated USING (can_view_student(student_id));
CREATE POLICY "comment_results_write" ON comment_results FOR ALL
    TO authenticated USING (can_edit_student(student_id)) WITH CHECK (can_edit_student(student_id));

-- ── Điểm danh ──────────────────────────────────────────────────────────────

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'late', 'excused', 'unexcused')),
    check_in_time TEXT,
    note TEXT,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    -- One record per student per day: re-scanning a card corrects the entry
    -- rather than stacking a second one, matching logAttendance in the client.
    UNIQUE (student_id, date)
);

-- Attendance is a record of what happened, so it cannot be filed ahead. This
-- is a trigger rather than a CHECK because CURRENT_DATE is STABLE, not
-- IMMUTABLE, and Postgres will not accept it in a constraint.
CREATE OR REPLACE FUNCTION reject_future_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Không thể điểm danh cho ngày trong tương lai (%).', NEW.date;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER attendance_not_future
    BEFORE INSERT OR UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION reject_future_attendance();

CREATE INDEX attendance_records_date_idx ON attendance_records(school_id, date);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select" ON attendance_records FOR SELECT
    TO authenticated USING (can_view_student(student_id));
CREATE POLICY "attendance_write" ON attendance_records FOR ALL
    TO authenticated USING (can_edit_student(student_id)) WITH CHECK (can_edit_student(student_id));

-- ── Đơn xin nghỉ ───────────────────────────────────────────────────────────

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    CONSTRAINT leave_range_ordered CHECK (to_date >= from_date),
    CONSTRAINT leave_reason_length CHECK (char_length(btrim(reason)) >= 5),
    -- A decided request must say who decided it, so an approval always has an
    -- author. This is what makes an excused absence traceable.
    CONSTRAINT leave_decision_attributed CHECK (
        status IN ('pending', 'cancelled') OR (decided_by IS NOT NULL AND decided_at IS NOT NULL)
    )
);

CREATE INDEX leave_requests_student_idx ON leave_requests(student_id, from_date);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Parents file for their own child; staff may file on a student's behalf.
CREATE POLICY "leave_select" ON leave_requests FOR SELECT
    TO authenticated USING (can_view_student(student_id));
CREATE POLICY "leave_insert" ON leave_requests FOR INSERT
    TO authenticated WITH CHECK (can_view_student(student_id));
-- Only staff decide. A parent cannot approve their own child's leave.
CREATE POLICY "leave_decide" ON leave_requests FOR UPDATE
    TO authenticated USING (can_edit_student(student_id)) WITH CHECK (can_edit_student(student_id));

-- ── Học phí ────────────────────────────────────────────────────────────────

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,

    -- Integer đồng. BIGINT rather than NUMERIC because Vietnam has no sub-unit
    -- in practice and float money does not reconcile against a bank statement.
    amount BIGINT NOT NULL CHECK (amount > 0 AND amount <= 999999999),

    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid'
        CHECK (status IN ('unpaid', 'pending_reconciliation', 'paid', 'cancelled')),

    -- Set when the payer says they transferred; not proof of payment.
    declared_at TIMESTAMPTZ,
    payment_reference TEXT,

    -- Set only when the school matches it against a statement.
    paid_at TIMESTAMPTZ,
    paid_method TEXT,
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    -- A paid invoice must name who confirmed it. Without this the two-step
    -- reconciliation collapses back into "whoever clicked pay".
    CONSTRAINT invoice_payment_attributed CHECK (
        status <> 'paid' OR (paid_at IS NOT NULL AND confirmed_by IS NOT NULL)
    ),
    CONSTRAINT invoice_declaration_stamped CHECK (
        status <> 'pending_reconciliation' OR declared_at IS NOT NULL
    )
);

CREATE INDEX invoices_student_idx ON invoices(student_id, status);
CREATE INDEX invoices_reconciliation_idx ON invoices(school_id, status) WHERE status = 'pending_reconciliation';

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select" ON invoices FOR SELECT
    TO authenticated USING (can_view_student(student_id));

-- Only staff issue and cancel invoices.
CREATE POLICY "invoices_insert" ON invoices FOR INSERT
    TO authenticated WITH CHECK (can_edit_student(student_id));

-- Parents may update an invoice for their own child, but only to declare a
-- transfer. Confirming payment is checked in the trigger below, because RLS
-- alone cannot compare the old row to the new one.
CREATE POLICY "invoices_update" ON invoices FOR UPDATE
    TO authenticated USING (can_view_student(student_id)) WITH CHECK (can_view_student(student_id));

CREATE OR REPLACE FUNCTION enforce_invoice_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Staff may make any transition.
    IF can_edit_student(NEW.student_id) THEN
        RETURN NEW;
    END IF;

    -- Everyone else may only move unpaid -> pending_reconciliation, and may not
    -- touch the amount. This is what stops a payer marking their own fee paid.
    IF OLD.status = 'unpaid'
       AND NEW.status = 'pending_reconciliation'
       AND NEW.amount = OLD.amount
       AND NEW.paid_at IS NULL
       AND NEW.confirmed_by IS NULL
    THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Chỉ nhà trường mới được xác nhận đã thu tiền.';
END;
$$;

CREATE TRIGGER invoices_transition_guard
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION enforce_invoice_transitions();

-- ── Tài liệu ───────────────────────────────────────────────────────────────
-- Metadata lives here; the file itself goes to Supabase Storage. Base64 blobs
-- in localStorage were the previous answer, which capped a file at whatever
-- survived a 5 MB per-origin quota shared with every other piece of state.

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    subject TEXT,
    title TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'material'
        CHECK (kind IN ('material', 'exam', 'lesson_plan', 'notice', 'other')),
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT,
    size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
    -- Materials are visible school-wide by default; a teacher can keep a draft
    -- to themselves.
    is_shared BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX documents_school_idx ON documents(school_id, kind);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON documents FOR SELECT
    TO authenticated
    USING (school_id = auth_school_id() AND (is_shared OR owner_id = auth.uid()));

CREATE POLICY "documents_write_own" ON documents FOR ALL
    TO authenticated
    USING (owner_id = auth.uid() OR auth_role() = 'admin')
    WITH CHECK ((owner_id = auth.uid() OR auth_role() = 'admin') AND school_id = auth_school_id());

-- ── Storage bucket ─────────────────────────────────────────────────────────
-- Private: files are reached through short-lived signed URLs, so a leaked path
-- does not become a public link to a student's document.

INSERT INTO storage.buckets (id, name, public)
VALUES ('school-documents', 'school-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Objects are laid out as {school_id}/{owner_id}/{filename}, so the first path
-- segment is what scopes a school to its own files.
CREATE POLICY "documents_storage_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'school-documents'
        AND (storage.foldername(name))[1] = auth_school_id()::text
    );

CREATE POLICY "documents_storage_write"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'school-documents'
        AND (storage.foldername(name))[1] = auth_school_id()::text
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "documents_storage_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'school-documents'
        AND (storage.foldername(name))[1] = auth_school_id()::text
        AND ((storage.foldername(name))[2] = auth.uid()::text OR auth_role() = 'admin')
    );

-- ── Grants ─────────────────────────────────────────────────────────────────
-- Without these the API roles are refused at the table and the policies above
-- never run. RLS narrows what these grants expose, row by row.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    assessment_records,
    comment_results,
    attendance_records,
    leave_requests,
    invoices,
    documents
TO authenticated;
