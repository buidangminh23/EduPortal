/**
 * The seam between the app and wherever records actually live.
 *
 * Two adapters implement the same interface: `localAdapter` keeps the current
 * in-browser behaviour so the demo still runs with no configuration, and
 * `supabaseAdapter` talks to Postgres. Nothing above this layer knows which is
 * in use, so switching is an env var rather than an edit.
 *
 * Every method is async even in the local adapter. That is deliberate: if the
 * local one were synchronous, callers would be written without awaits and would
 * all break on the day the real database is plugged in.
 *
 * The domain modules in ../domain do the arithmetic and stay untouched — this
 * layer only moves records.
 */

import { safeStorage } from '../safeStorage';

/** Storage keys, kept in one place so the two adapters cannot drift apart. */
const KEYS = {
  assessments: 'db_assessment_records',
  comments: 'db_comment_results',
  attendance: 'db_attendance_records',
  leave: 'db_leave_requests',
  invoices: 'db_invoices'
};

function readAll(key) {
  try {
    const raw = safeStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // Corrupt JSON is treated as an empty table rather than a crash: losing a
    // cache is recoverable, a blank screen at the start of a lesson is not.
    return [];
  }
}

function writeAll(key, rows) {
  safeStorage.setItem(key, JSON.stringify(rows));
}

const matches = (row, filter) =>
  Object.entries(filter).every(([field, value]) => row[field] === value);

/** Replaces the row matching `identity`, or appends it. */
function upsertRow(key, identity, patch) {
  const rows = readAll(key);
  const index = rows.findIndex((row) => matches(row, identity));
  const next = { ...identity, ...(index >= 0 ? rows[index] : {}), ...patch };

  if (index >= 0) rows[index] = next;
  else rows.push(next);

  writeAll(key, rows);
  return next;
}

/**
 * Records held in the browser. This is the demo store, and it is per-browser:
 * marks entered on one machine are invisible on another.
 */
export const localAdapter = {
  name: 'local',

  async listAssessments({ studentId, semester } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (semester) filter.semester = semester;
    return readAll(KEYS.assessments).filter((row) => matches(row, filter));
  },

  async saveAssessment({ studentId, subject, semester, regular, midterm, final, average, updatedBy }) {
    return upsertRow(
      KEYS.assessments,
      { student_id: studentId, subject, semester },
      {
        regular,
        midterm,
        final,
        average,
        updated_by: updatedBy ?? null,
        updated_at: new Date().toISOString()
      }
    );
  },

  async saveCommentResult({ studentId, subject, semester, result, updatedBy }) {
    return upsertRow(
      KEYS.comments,
      { student_id: studentId, subject, semester },
      { result, updated_by: updatedBy ?? null, updated_at: new Date().toISOString() }
    );
  },

  async listCommentResults({ studentId } = {}) {
    const filter = studentId ? { student_id: studentId } : {};
    return readAll(KEYS.comments).filter((row) => matches(row, filter));
  },

  async listAttendance({ studentId, date } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (date) filter.date = date;
    return readAll(KEYS.attendance).filter((row) => matches(row, filter));
  },

  async saveAttendance({ studentId, date, status, checkInTime, note, recordedBy }) {
    return upsertRow(
      KEYS.attendance,
      { student_id: studentId, date },
      {
        status,
        check_in_time: checkInTime ?? null,
        note: note ?? null,
        recorded_by: recordedBy ?? null,
        updated_at: new Date().toISOString()
      }
    );
  },

  async listLeaveRequests({ studentId } = {}) {
    const filter = studentId ? { student_id: studentId } : {};
    return readAll(KEYS.leave).filter((row) => matches(row, filter));
  },

  async createLeaveRequest({ id, studentId, fromDate, toDate, reason, requestedBy }) {
    const rows = readAll(KEYS.leave);
    const row = {
      id,
      student_id: studentId,
      from_date: fromDate,
      to_date: toDate,
      reason,
      status: 'pending',
      requested_by: requestedBy ?? null,
      decided_by: null,
      decided_at: null,
      created_at: new Date().toISOString()
    };
    rows.push(row);
    writeAll(KEYS.leave, rows);
    return row;
  },

  async decideLeaveRequest({ id, status, decidedBy }) {
    return upsertRow(KEYS.leave, { id }, {
      status,
      decided_by: decidedBy ?? null,
      decided_at: new Date().toISOString()
    });
  },

  async listInvoices({ studentId, status } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (status) filter.status = status;
    return readAll(KEYS.invoices).filter((row) => matches(row, filter));
  },

  async createInvoice({ id, studentId, title, amount, dueDate }) {
    const rows = readAll(KEYS.invoices);
    const row = {
      id,
      student_id: studentId,
      title,
      amount,
      due_date: dueDate,
      status: 'unpaid',
      declared_at: null,
      payment_reference: null,
      paid_at: null,
      confirmed_by: null,
      created_at: new Date().toISOString()
    };
    rows.push(row);
    writeAll(KEYS.invoices, rows);
    return row;
  },

  async declareTransfer({ id, reference }) {
    return upsertRow(KEYS.invoices, { id }, {
      status: 'pending_reconciliation',
      declared_at: new Date().toISOString(),
      payment_reference: reference ?? null
    });
  },

  async confirmPayment({ id, confirmedBy, method = 'vietqr' }) {
    return upsertRow(KEYS.invoices, { id }, {
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_method: method,
      confirmed_by: confirmedBy ?? null
    });
  }
};

/** Throws whatever the database said rather than returning a silent empty set. */
function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'Lỗi truy cập cơ sở dữ liệu.');
  return data;
}

/**
 * Records held in Postgres.
 *
 * Row-level security decides what comes back, so these queries deliberately do
 * not filter by role — asking for "all invoices" as a parent returns only their
 * child's, enforced by the database rather than by this code. That is the whole
 * reason a frontend may talk to Postgres directly.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {string} schoolId Tenant the caller belongs to, stamped on inserts.
 */
export function createSupabaseAdapter(client, schoolId) {
  const rows = (table) => client.from(table);

  return {
    name: 'supabase',

    async listAssessments({ studentId, semester } = {}) {
      let query = rows('assessment_records').select('*');
      if (studentId) query = query.eq('student_id', studentId);
      if (semester) query = query.eq('semester', semester);
      return unwrap(await query);
    },

    async saveAssessment({ studentId, subject, semester, regular, midterm, final, average, updatedBy }) {
      const payload = {
        school_id: schoolId,
        student_id: studentId,
        subject,
        semester,
        regular,
        midterm,
        final,
        average,
        updated_by: updatedBy ?? null,
        updated_at: new Date().toISOString()
      };
      return unwrap(
        await rows('assessment_records')
          .upsert(payload, { onConflict: 'student_id,subject,semester' })
          .select()
          .single()
      );
    },

    async listCommentResults({ studentId } = {}) {
      let query = rows('comment_results').select('*');
      if (studentId) query = query.eq('student_id', studentId);
      return unwrap(await query);
    },

    async saveCommentResult({ studentId, subject, semester, result, updatedBy }) {
      return unwrap(
        await rows('comment_results')
          .upsert(
            {
              school_id: schoolId,
              student_id: studentId,
              subject,
              semester,
              result,
              updated_by: updatedBy ?? null,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'student_id,subject,semester' }
          )
          .select()
          .single()
      );
    },

    async listAttendance({ studentId, date } = {}) {
      let query = rows('attendance_records').select('*');
      if (studentId) query = query.eq('student_id', studentId);
      if (date) query = query.eq('date', date);
      return unwrap(await query);
    },

    async saveAttendance({ studentId, date, status, checkInTime, note, recordedBy }) {
      return unwrap(
        await rows('attendance_records')
          .upsert(
            {
              school_id: schoolId,
              student_id: studentId,
              date,
              status,
              check_in_time: checkInTime ?? null,
              note: note ?? null,
              recorded_by: recordedBy ?? null,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'student_id,date' }
          )
          .select()
          .single()
      );
    },

    async listLeaveRequests({ studentId } = {}) {
      let query = rows('leave_requests').select('*');
      if (studentId) query = query.eq('student_id', studentId);
      return unwrap(await query);
    },

    async createLeaveRequest({ studentId, fromDate, toDate, reason, requestedBy }) {
      return unwrap(
        await rows('leave_requests')
          .insert({
            school_id: schoolId,
            student_id: studentId,
            from_date: fromDate,
            to_date: toDate,
            reason,
            requested_by: requestedBy ?? null
          })
          .select()
          .single()
      );
    },

    async decideLeaveRequest({ id, status, decidedBy }) {
      return unwrap(
        await rows('leave_requests')
          .update({ status, decided_by: decidedBy ?? null, decided_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()
      );
    },

    async listInvoices({ studentId, status } = {}) {
      let query = rows('invoices').select('*');
      if (studentId) query = query.eq('student_id', studentId);
      if (status) query = query.eq('status', status);
      return unwrap(await query);
    },

    async createInvoice({ studentId, title, amount, dueDate }) {
      return unwrap(
        await rows('invoices')
          .insert({ school_id: schoolId, student_id: studentId, title, amount, due_date: dueDate })
          .select()
          .single()
      );
    },

    async declareTransfer({ id, reference }) {
      return unwrap(
        await rows('invoices')
          .update({
            status: 'pending_reconciliation',
            declared_at: new Date().toISOString(),
            payment_reference: reference ?? null
          })
          .eq('id', id)
          .select()
          .single()
      );
    },

    async confirmPayment({ id, confirmedBy, method = 'vietqr' }) {
      // The database trigger rejects this for anyone who is not staff, so a
      // parent calling it gets an error rather than a silently ignored write.
      return unwrap(
        await rows('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            paid_method: method,
            confirmed_by: confirmedBy ?? null
          })
          .eq('id', id)
          .select()
          .single()
      );
    }
  };
}

/** Method names both adapters must provide, asserted by the contract tests. */
export const REPOSITORY_METHODS = [
  'listAssessments',
  'saveAssessment',
  'listCommentResults',
  'saveCommentResult',
  'listAttendance',
  'saveAttendance',
  'listLeaveRequests',
  'createLeaveRequest',
  'decideLeaveRequest',
  'listInvoices',
  'createInvoice',
  'declareTransfer',
  'confirmPayment'
];
