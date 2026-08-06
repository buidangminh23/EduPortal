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
 *
 * Two rules run through every academic method here, and both are the database's
 * rules restated where the browser store can be held to them as well.
 *
 * Năm học. Every mark, nhận xét and kết quả rèn luyện is identified by student,
 * môn, học kỳ *and* năm học — see supabase/migrations/012_school_year.sql. Leave
 * the năm học out and the upsert finds last year's row of the same name and
 * writes over it, which is how a học bạ loses two of the three years it is meant
 * to hold. So a write without a valid one is refused here rather than sent.
 *
 * Khoá sổ điểm. Once a học kỳ is closed only Ban Giám Hiệu may write to it, and
 * every write to assessment_records is recorded — 013_gradebook_lock.sql. In
 * Postgres a trigger does both. The browser store has no triggers, so this file
 * does them by hand: the same refusal, the same nhật ký. The enforcer differs;
 * what a teacher sees must not.
 */

import { safeStorage } from '../safeStorage';
import { isValidSchoolYear } from '../domain/schoolYear';

/** Storage keys, kept in one place so the two adapters cannot drift apart. */
const KEYS = {
  assessments: 'db_assessment_records',
  comments: 'db_comment_results',
  conduct: 'db_conduct_results',
  attendance: 'db_attendance_records',
  leave: 'db_leave_requests',
  invoices: 'db_invoices',
  mockExams: 'db_mock_exam_results',
  locks: 'db_gradebook_locks',
  history: 'db_assessment_history'
};

/**
 * Rows a list hands back when the caller does not say otherwise.
 *
 * Not a page size — nothing above this layer pages — but a ceiling. Row-level
 * security decides which rows a caller may see, and for an admin that is the
 * whole school: without a bound, one screen asking for "the results" is asking
 * a browser tab to hold every result the school has ever recorded. A caller
 * that genuinely needs more says so and says why.
 */
export const DEFAULT_ROW_LIMIT = 1000;

/**
 * Postgres unique_violation.
 *
 * On mock_exam_results it means the outbox sent a paper that had already
 * arrived, which is a write that already happened rather than a write that
 * failed. See supabase/migrations/008_mock_exam_idempotency.sql. On
 * gradebook_locks it means the học kỳ was already closed, which is the state the
 * caller was asking for; both are handled by reading the stored row back.
 */
const UNIQUE_VIOLATION = '23505';

/**
 * Refuses a write that does not say which năm học it belongs to.
 *
 * Both adapters call this, and that is the point. Postgres refuses a missing
 * năm học by itself — the column is NOT NULL with no DEFAULT, on purpose — but
 * the browser store has no constraints, so without this the demo would go on
 * quietly collapsing three years of a học bạ onto one row while the real
 * database refused the same write. Checking here makes the refusal the same
 * refusal in both.
 *
 * The check is `isValidSchoolYear`, not "is it a non-empty string": '2025-2027'
 * and 'năm học 2025 - 2026' would each sit in the uniqueness constraint beside
 * '2025-2026' without colliding with it, and the pupil would end up with two
 * Toán rows for one học kỳ — the same defect wearing a different spelling.
 */
function requireSchoolYear(schoolYear) {
  if (!isValidSchoolYear(schoolYear)) {
    throw new Error(
      `Thiếu năm học hợp lệ (dạng '2025-2026'), nên bản ghi không được lưu — hiện nhận được: ${JSON.stringify(schoolYear)}.`
    );
  }
  return schoolYear;
}

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

/** @returns {boolean} False when the browser refused to store it. */
function writeAll(key, rows) {
  return safeStorage.setItem(key, JSON.stringify(rows));
}

const matches = (row, filter) =>
  Object.entries(filter).every(([field, value]) => row[field] === value);

/** The stored row matching `identity`, or null. */
const findRow = (key, identity) => readAll(key).find((row) => matches(row, identity)) ?? null;

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

/** Drops the row matching `identity`. Returns null — there is no row to hand back. */
function removeRow(key, identity) {
  const rows = readAll(key);
  const remaining = rows.filter((row) => !matches(row, identity));
  if (remaining.length !== rows.length) writeAll(key, remaining);
  return null;
}

/**
 * What the BEFORE trigger in 013 does, for the store that has no triggers.
 *
 * Ban Giám Hiệu is let through, exactly as the trigger lets them through: a mark
 * found to be wrong after chốt has to be fixable without re-opening the học kỳ
 * for the whole school. The correction is not exempt from the nhật ký below —
 * that is what makes it a correction rather than a quiet edit.
 *
 * The role is passed in because this store has no session to ask. Postgres does
 * not take the caller's word for it and neither should anything that reaches a
 * server: there, `auth_role()` reads a signed token, and this argument is not
 * sent at all. It decides only what the demo, which is one person's browser,
 * will let that person do.
 */
function assertGradebookOpen({ schoolYear, semester, actorRole }) {
  if (actorRole === 'admin') return;

  const locked = readAll(KEYS.locks).some(
    (row) => row.school_year === schoolYear && row.semester === semester
  );

  if (locked) {
    throw new Error(
      `Sổ điểm học kỳ ${semester} năm học ${schoolYear} đã khoá, chỉ Ban Giám Hiệu mới ghi vào được.`
    );
  }
}

/**
 * What the AFTER trigger in 013 does, for the same reason.
 *
 * Without this the browser store would answer "nobody has ever changed this
 * mark" to a question it simply cannot answer, which is worse than answering
 * nothing: a school reading a demo would believe the log works.
 *
 * Both the old and the new marks are written, including a write that changed
 * none of them — a teacher who says they never touched the row cannot be
 * believed from a log that drops the writes it judged uninteresting.
 *
 * `assessment_id` is null: rows in this store are identified by student, môn,
 * học kỳ and năm học rather than by a generated id, and those four are on the
 * history row already.
 */
function recordAssessmentChange({ before, after, changedBy }) {
  const rows = readAll(KEYS.history);

  rows.push({
    id: `history-${rows.length + 1}-${Date.now()}`,
    assessment_id: null,
    school_id: null,
    student_id: after.student_id,
    subject: after.subject,
    semester: after.semester,
    school_year: after.school_year,
    operation: before ? 'UPDATE' : 'INSERT',
    old_regular: before?.regular ?? null,
    old_midterm: before?.midterm ?? null,
    old_final: before?.final ?? null,
    old_average: before?.average ?? null,
    new_regular: after.regular ?? null,
    new_midterm: after.midterm ?? null,
    new_final: after.final ?? null,
    new_average: after.average ?? null,
    changed_by: changedBy ?? null,
    changed_at: new Date().toISOString()
  });

  writeAll(KEYS.history, rows);
}

/**
 * Records held in the browser. This is the demo store, and it is per-browser:
 * marks entered on one machine are invisible on another.
 */
export const localAdapter = {
  name: 'local',

  /**
   * A năm học is optional on a read and required on a write.
   *
   * A screen that wants one năm học says so and gets that year; a screen
   * reviewing a pupil's whole học bạ asks for all of them and sorts it out
   * above. Leaving it out of a *write* has no such honest reading — it can only
   * mean the caller does not know which year it is filing under.
   */
  async listAssessments({ studentId, semester, schoolYear, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (semester) filter.semester = semester;
    if (schoolYear) filter.school_year = schoolYear;
    return readAll(KEYS.assessments).filter((row) => matches(row, filter)).slice(0, limit);
  },

  async saveAssessment({
    studentId, subject, semester, schoolYear, regular, midterm, final, average, updatedBy, actorRole
  }) {
    requireSchoolYear(schoolYear);
    assertGradebookOpen({ schoolYear, semester, actorRole });

    // Năm học is part of the identity, not part of the payload. In the payload
    // it would be a field this year's write overwrites on last year's row,
    // which is the defect rather than the fix.
    const identity = { student_id: studentId, subject, semester, school_year: schoolYear };
    const before = findRow(KEYS.assessments, identity);

    const saved = upsertRow(KEYS.assessments, identity, {
      regular,
      midterm,
      final,
      average,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    });

    // Read back before recording it. In Postgres the AFTER trigger never fires
    // for a statement that aborted, so a refused write leaves nothing in the
    // log; here a browser that has run out of room refuses silently, and a log
    // written anyway would show a mark that was never stored — wrong in the
    // direction of accusing somebody.
    if (findRow(KEYS.assessments, identity) === null) {
      throw new Error('Trình duyệt không lưu được điểm (hết dung lượng hoặc bị chặn).');
    }

    recordAssessmentChange({ before, after: saved, changedBy: updatedBy });
    return saved;
  },

  /**
   * Read-only, and there is no save beside it on purpose.
   *
   * In Postgres the client is granted SELECT on assessment_history and nothing
   * else; rows arrive only through the trigger. A save method here would be a
   * way to write the log by hand, which is a way to write it wrongly.
   *
   * Who may read it is the one thing this store cannot reproduce: Postgres
   * shows it to Ban Giám Hiệu of that school and nobody else, and a browser
   * store has no session to check that against.
   */
  async listAssessmentHistory({ studentId, subject, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (subject) filter.subject = subject;

    // Reversed before the sort, so that two changes recorded in the same
    // millisecond — a teacher tabbing along a row — still read newest first
    // rather than in whichever order a stable sort left them.
    return readAll(KEYS.history)
      .filter((row) => matches(row, filter))
      .reverse()
      .sort((a, b) => String(b.changed_at).localeCompare(String(a.changed_at)))
      .slice(0, limit);
  },

  async saveCommentResult({ studentId, subject, semester, schoolYear, result, updatedBy, actorRole }) {
    requireSchoolYear(schoolYear);
    assertGradebookOpen({ schoolYear, semester, actorRole });

    return upsertRow(
      KEYS.comments,
      { student_id: studentId, subject, semester, school_year: schoolYear },
      { result, updated_by: updatedBy ?? null, updated_at: new Date().toISOString() }
    );
  },

  async listCommentResults({ studentId, schoolYear, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (schoolYear) filter.school_year = schoolYear;
    return readAll(KEYS.comments).filter((row) => matches(row, filter)).slice(0, limit);
  },

  async listConductResults({ studentId, semester, schoolYear, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (semester) filter.semester = semester;
    if (schoolYear) filter.school_year = schoolYear;
    return readAll(KEYS.conduct).filter((row) => matches(row, filter)).slice(0, limit);
  },

  /**
   * One mức per student per học kỳ, corrected in place.
   *
   * A null band removes the row rather than storing an empty one. Chưa đánh giá
   * is the absence of a record — a student the giáo viên chủ nhiệm has not
   * reached yet and one whose mức was entered by mistake and taken back read
   * the same, because they are the same. See supabase/migrations/011.
   *
   * No năm học *band* is stored — Thông tư 22 Điều 8 khoản 2 điểm b derives it
   * from these two, and a stored copy would be a second source that disagrees
   * the moment a semester is edited. The năm học the two rows belong to is a
   * different thing and is stored, because otherwise this year's mức lands on
   * top of last year's.
   */
  async saveConductResult({ studentId, semester, schoolYear, band, updatedBy, actorRole }) {
    requireSchoolYear(schoolYear);
    assertGradebookOpen({ schoolYear, semester, actorRole });

    const identity = { student_id: studentId, semester, school_year: schoolYear };
    if (band === null || band === undefined) return removeRow(KEYS.conduct, identity);

    return upsertRow(
      KEYS.conduct,
      identity,
      { band, updated_by: updatedBy ?? null, updated_at: new Date().toISOString() }
    );
  },

  async listGradebookLocks({ schoolYear, semester, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = {};
    if (schoolYear) filter.school_year = schoolYear;
    if (semester) filter.semester = semester;
    return readAll(KEYS.locks).filter((row) => matches(row, filter)).slice(0, limit);
  },

  /**
   * Closes or re-opens one học kỳ of one năm học.
   *
   * A row means closed, so locking is an insert and unlocking is a delete —
   * the shape gradebook_locks has, and the same shape 011 chose for chưa đánh
   * giá. There is no status to update and therefore no way for a period to be
   * listed and open at once.
   *
   * Locking a học kỳ that is already locked hands back the lock that is there
   * rather than restamping it. Postgres refuses the second insert outright, and
   * a store that quietly rewrote locked_by would answer "who closed the book"
   * with the name of the last person to click the button.
   *
   * `lockedBy` is required because locked_by is NOT NULL and its foreign key is
   * ON DELETE RESTRICT: a closed sổ điểm is an act somebody performed, and a
   * lock nobody closed is not a thing this can hold.
   */
  async setGradebookLock({ schoolYear, semester, locked, lockedBy }) {
    requireSchoolYear(schoolYear);

    const identity = { school_year: schoolYear, semester };
    if (!locked) return removeRow(KEYS.locks, identity);

    const already = findRow(KEYS.locks, identity);
    if (already) return already;

    if (!lockedBy) {
      throw new Error('Chưa xác định được người khoá sổ điểm, nên sổ điểm không được khoá.');
    }

    return upsertRow(KEYS.locks, identity, {
      school_id: null,
      locked_at: new Date().toISOString(),
      locked_by: lockedBy
    });
  },

  async listAttendance({ studentId, date, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (date) filter.date = date;
    return readAll(KEYS.attendance).filter((row) => matches(row, filter)).slice(0, limit);
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

  async listLeaveRequests({ studentId, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = studentId ? { student_id: studentId } : {};
    return readAll(KEYS.leave).filter((row) => matches(row, filter)).slice(0, limit);
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

  async listInvoices({ studentId, status, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = {};
    if (studentId) filter.student_id = studentId;
    if (status) filter.status = status;
    return readAll(KEYS.invoices).filter((row) => matches(row, filter)).slice(0, limit);
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
  },

  async listMockExamResults({ studentId, limit = DEFAULT_ROW_LIMIT } = {}) {
    const filter = studentId ? { student_id: studentId } : {};
    // Sorted before the cap, so a capped list is the newest sittings rather
    // than whichever ones happen to sit at the front of storage.
    return readAll(KEYS.mockExams)
      .filter((row) => matches(row, filter))
      .sort((a, b) => String(b.taken_at).localeCompare(String(a.taken_at)))
      .slice(0, limit);
  },

  async saveMockExamResult(result) {
    // Appended, never upserted: sitting the same paper twice is two results,
    // and the second must not overwrite the first.
    const rows = readAll(KEYS.mockExams);

    // The same guarantee the unique index on local_id gives Postgres, so the
    // browser store cannot end up with the duplicate the database refuses: a
    // paper the outbox sends twice is stored once, and the second send is told
    // the paper is already there rather than told it failed.
    const already = result.localId ? rows.find((row) => row.id === result.localId) : null;
    if (already) return already;

    const row = { ...toMockExamRow(result), id: result.localId || `local-${rows.length + 1}-${Date.now()}` };
    rows.push(row);

    // A storage that refused the write has to say so. Reporting success would
    // let the outbox drop a paper it never actually stored — the one failure
    // this whole mechanism exists to prevent.
    if (!writeAll(KEYS.mockExams, rows)) {
      throw new Error('Trình duyệt không lưu được kết quả (hết dung lượng hoặc bị chặn).');
    }
    return row;
  }
};

/** The one place the app's result shape becomes the database's column names. */
function toMockExamRow(result) {
  return {
    student_id: result.studentId,
    student_name: result.studentName ?? null,
    class_name: result.class ?? null,
    exam_id: result.examId,
    title: result.title,
    block: result.block ?? null,
    score: result.score,
    total_questions: result.totalQuestions ?? 0,
    time_spent: result.timeSpent ?? null,
    interruptions: result.interruptions ?? 0,
    subject_breakdown: result.subjectBreakdown ?? {},
    selected_answers: result.selectedAnswers ?? {},
    taken_at: result.takenAt || new Date().toISOString()
  };
}

/** Database row back into what the screens already read. */
export function fromMockExamRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    // The teacher and head teacher screens list attempts by name and class, so
    // these travel with the row rather than being looked up per render.
    studentName: row.student_name ?? null,
    class: row.class_name ?? null,
    examId: row.exam_id,
    title: row.title,
    block: row.block,
    score: Number(row.score),
    totalQuestions: row.total_questions,
    timeSpent: row.time_spent,
    interruptions: row.interruptions ?? 0,
    subjectBreakdown: row.subject_breakdown || {},
    selectedAnswers: row.selected_answers || {},
    date: String(row.taken_at || '').split('T')[0]
  };
}

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

    async listAssessments({ studentId, semester, schoolYear, limit = DEFAULT_ROW_LIMIT } = {}) {
      let query = rows('assessment_records').select('*').limit(limit);
      if (studentId) query = query.eq('student_id', studentId);
      if (semester) query = query.eq('semester', semester);
      if (schoolYear) query = query.eq('school_year', schoolYear);
      return unwrap(await query);
    },

    /**
     * The conflict target is the UNIQUE 012 rebuilt, năm học included.
     *
     * `actorRole` is accepted by the browser store and deliberately not sent
     * here. Whether this write is allowed into a closed sổ điểm is decided by
     * the BEFORE trigger from `auth_role()`, which reads a signed token; a role
     * the client typed into a payload would be a lock any client could open.
     */
    async saveAssessment({
      studentId, subject, semester, schoolYear, regular, midterm, final, average, updatedBy
    }) {
      requireSchoolYear(schoolYear);

      const payload = {
        school_id: schoolId,
        student_id: studentId,
        subject,
        semester,
        school_year: schoolYear,
        regular,
        midterm,
        final,
        average,
        updated_by: updatedBy ?? null,
        updated_at: new Date().toISOString()
      };
      return unwrap(
        await rows('assessment_records')
          .upsert(payload, { onConflict: 'student_id,subject,semester,school_year' })
          .select()
          .single()
      );
    },

    /**
     * Nhật ký sửa điểm, newest first. Read-only: the client is granted SELECT
     * on this table and nothing else, and the rows are written by the trigger.
     * Row-level security shows it to Ban Giám Hiệu of that school alone, so a
     * teacher or a parent asking gets an empty list rather than an error.
     */
    async listAssessmentHistory({ studentId, subject, limit = DEFAULT_ROW_LIMIT } = {}) {
      let query = rows('assessment_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(limit);
      if (studentId) query = query.eq('student_id', studentId);
      if (subject) query = query.eq('subject', subject);
      return unwrap(await query);
    },

    async listCommentResults({ studentId, schoolYear, limit = DEFAULT_ROW_LIMIT } = {}) {
      let query = rows('comment_results').select('*').limit(limit);
      if (studentId) query = query.eq('student_id', studentId);
      if (schoolYear) query = query.eq('school_year', schoolYear);
      return unwrap(await query);
    },

    async saveCommentResult({ studentId, subject, semester, schoolYear, result, updatedBy }) {
      requireSchoolYear(schoolYear);

      return unwrap(
        await rows('comment_results')
          .upsert(
            {
              school_id: schoolId,
              student_id: studentId,
              subject,
              semester,
              school_year: schoolYear,
              result,
              updated_by: updatedBy ?? null,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'student_id,subject,semester,school_year' }
          )
          .select()
          .single()
      );
    },

    async listConductResults({ studentId, semester, schoolYear, limit = DEFAULT_ROW_LIMIT } = {}) {
      let query = rows('conduct_results').select('*').limit(limit);
      if (studentId) query = query.eq('student_id', studentId);
      if (semester) query = query.eq('semester', semester);
      if (schoolYear) query = query.eq('school_year', schoolYear);
      return unwrap(await query);
    },

    /**
     * One mức per student per học kỳ — the UNIQUE the conflict target names.
     *
     * A null band deletes the row. `band` is NOT NULL, on purpose: chưa đánh
     * giá is the absence of a record, so an empty row is not a thing the table
     * can hold, and taking a mức back off a child is a delete or it is nothing.
     * The write policy is FOR ALL and the grant includes DELETE for exactly
     * this.
     *
     * No năm học *band* column is written because there is none: Điều 8 khoản 2
     * điểm b derives cả năm from these two rows, and a stored year band would
     * drift from them the first time a semester was corrected. Which năm học
     * the two rows belong to is a separate fact and is written, since 012.
     *
     * The delete names the năm học too. Without it, "Chưa đánh giá" on this
     * year's học kỳ II would take last year's mức off the child as well.
     */
    async saveConductResult({ studentId, semester, schoolYear, band, updatedBy }) {
      requireSchoolYear(schoolYear);

      if (band === null || band === undefined) {
        unwrap(
          await rows('conduct_results')
            .delete()
            .eq('student_id', studentId)
            .eq('semester', semester)
            .eq('school_year', schoolYear)
        );
        return null;
      }

      return unwrap(
        await rows('conduct_results')
          .upsert(
            {
              school_id: schoolId,
              student_id: studentId,
              semester,
              school_year: schoolYear,
              band,
              updated_by: updatedBy ?? null,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'student_id,semester,school_year' }
          )
          .select()
          .single()
      );
    },

    async listGradebookLocks({ schoolYear, semester, limit = DEFAULT_ROW_LIMIT } = {}) {
      let query = rows('gradebook_locks').select('*').limit(limit);
      if (schoolYear) query = query.eq('school_year', schoolYear);
      if (semester) query = query.eq('semester', semester);
      return unwrap(await query);
    },

    /**
     * Insert to close, delete to re-open — the only two privileges the table
     * grants. There is deliberately no UPDATE, so this cannot be written as an
     * upsert: a conflicting upsert would try to update and be refused for want
     * of the privilege rather than for the reason that matters.
     *
     * A refused insert on this table means the học kỳ is already closed, which
     * is the state being asked for. The lock that is already there is read back
     * and handed over — the same reading 008 gave a duplicate mock exam paper —
     * so a second click reports the book shut rather than reporting an error.
     *
     * Ban Giám Hiệu is the only role the policy admits; a teacher calling this
     * gets a refusal from Postgres, which is where that decision belongs.
     */
    async setGradebookLock({ schoolYear, semester, locked, lockedBy }) {
      requireSchoolYear(schoolYear);

      if (!locked) {
        unwrap(
          await rows('gradebook_locks')
            .delete()
            .eq('school_id', schoolId)
            .eq('school_year', schoolYear)
            .eq('semester', semester)
        );
        return null;
      }

      if (!lockedBy) {
        throw new Error('Chưa xác định được người khoá sổ điểm, nên sổ điểm không được khoá.');
      }

      const { data, error } = await rows('gradebook_locks')
        .insert({
          school_id: schoolId,
          school_year: schoolYear,
          semester,
          locked_by: lockedBy
        })
        .select()
        .single();

      if (!error) return data;

      if (error.code === UNIQUE_VIOLATION) {
        const stored = await rows('gradebook_locks')
          .select('*')
          .eq('school_id', schoolId)
          .eq('school_year', schoolYear)
          .eq('semester', semester)
          .maybeSingle();
        return stored.data ?? null;
      }

      throw new Error(error.message || 'Lỗi truy cập cơ sở dữ liệu.');
    },

    async listAttendance({ studentId, date, limit = DEFAULT_ROW_LIMIT } = {}) {
      let query = rows('attendance_records').select('*').limit(limit);
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

    async listLeaveRequests({ studentId, limit = DEFAULT_ROW_LIMIT } = {}) {
      let query = rows('leave_requests').select('*').limit(limit);
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

    async listInvoices({ studentId, status, limit = DEFAULT_ROW_LIMIT } = {}) {
      let query = rows('invoices').select('*').limit(limit);
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
    },

    async listMockExamResults({ studentId, limit = DEFAULT_ROW_LIMIT } = {}) {
      // Newest first and then capped, so a capped list is the recent sittings.
      let query = rows('mock_exam_results')
        .select('*')
        .order('taken_at', { ascending: false })
        .limit(limit);
      if (studentId) query = query.eq('student_id', studentId);
      return unwrap(await query);
    },

    async saveMockExamResult(result) {
      // Insert, not upsert. Two sittings of the same paper are two rows, and
      // the table grants no UPDATE to anybody: a handed-in paper stays as it
      // was handed in. `local_id` is the outbox's key travelling with the
      // paper, and the unique index on it is what refuses a second copy of one
      // sitting without needing that UPDATE privilege.
      const { data, error } = await rows('mock_exam_results')
        .insert({ school_id: schoolId, local_id: result.localId ?? null, ...toMockExamRow(result) })
        .select()
        .single();

      if (!error) return data;

      // A unique violation here means this paper is already in the table: the
      // send succeeded, on an attempt whose answer never got back to the
      // browser. Reporting it as a failure would leave the outbox retrying a
      // paper that is safely stored, ten times, and then calling it stuck.
      if (error.code === UNIQUE_VIOLATION) {
        if (!result.localId) return null;
        const stored = await rows('mock_exam_results')
          .select('*')
          .eq('local_id', result.localId)
          .maybeSingle();
        return stored.data ?? null;
      }

      throw new Error(error.message || 'Lỗi truy cập cơ sở dữ liệu.');
    }
  };
}

/** Method names both adapters must provide, asserted by the contract tests. */
export const REPOSITORY_METHODS = [
  'listAssessments',
  'saveAssessment',
  'listAssessmentHistory',
  'listCommentResults',
  'saveCommentResult',
  'listConductResults',
  'saveConductResult',
  'listGradebookLocks',
  'setGradebookLock',
  'listAttendance',
  'saveAttendance',
  'listLeaveRequests',
  'createLeaveRequest',
  'decideLeaveRequest',
  'listInvoices',
  'createInvoice',
  'declareTransfer',
  'confirmPayment',
  'listMockExamResults',
  'saveMockExamResult'
];
