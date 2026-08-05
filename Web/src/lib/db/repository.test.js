/**
 * Contract tests for the storage seam.
 *
 * Two things are checked. First, that the local adapter behaves the way the
 * database will — upserts collapse to one row, not two. Second, that the
 * Supabase adapter builds the queries it claims to, using a fake client that
 * records calls. The second half cannot prove the SQL is right, but it does
 * catch the mistakes that would otherwise only surface against a live project:
 * a wrong table name, a missing tenant column, a forgotten conflict target.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { REPOSITORY_METHODS, createSupabaseAdapter, localAdapter, fromMockExamRow } from './repository';

/** Node has no localStorage, and safeStorage swallows that into a silent no-op. */
function installMemoryStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

beforeEach(() => {
  installMemoryStorage();
});

/** One handed-in paper, in the shape the exam screen produces. */
const mockPaper = (over = {}) => ({
  studentId: 'HS001',
  studentName: 'Nguyễn Hoàng Nam',
  class: '12A1',
  examId: 'SYS_SUBJ_Math',
  title: 'Đề thi thử Toán',
  block: 'SINGLE',
  score: 8.25,
  totalQuestions: 22,
  timeSpent: '48:12',
  interruptions: 2,
  subjectBreakdown: { Math: { subjectScore: 8.25 } },
  selectedAnswers: { MP01: 'B' },
  takenAt: '2026-08-03T07:00:00.000Z',
  ...over
});

describe('adapter contract', () => {
  it('is satisfied by the local adapter', () => {
    REPOSITORY_METHODS.forEach((method) => {
      expect(typeof localAdapter[method], method).toBe('function');
    });
  });

  it('is satisfied by the Supabase adapter', () => {
    const adapter = createSupabaseAdapter({ from: () => ({}) }, 'school-1');
    REPOSITORY_METHODS.forEach((method) => {
      expect(typeof adapter[method], method).toBe('function');
    });
  });

  it('exposes no method on one adapter that the other lacks', () => {
    const supabase = createSupabaseAdapter({ from: () => ({}) }, 'school-1');
    const names = (a) => Object.keys(a).filter((k) => typeof a[k] === 'function').sort();
    expect(names(localAdapter)).toEqual(names(supabase));
  });

  it('returns promises from the local adapter, so callers must await either way', () => {
    expect(localAdapter.listInvoices()).toBeInstanceOf(Promise);
    expect(localAdapter.listAttendance()).toBeInstanceOf(Promise);
  });
});

describe('local adapter · sổ điểm', () => {
  const marks = {
    studentId: 'HS001',
    subject: 'Math',
    semester: 2,
    regular: [8, 9],
    midterm: 7,
    final: 6,
    average: 6.7
  };

  it('round-trips a saved record', async () => {
    await localAdapter.saveAssessment(marks);
    const [row] = await localAdapter.listAssessments({ studentId: 'HS001' });
    expect(row).toMatchObject({ student_id: 'HS001', subject: 'Math', semester: 2, average: 6.7 });
  });

  it('keeps one row per student, subject and semester', async () => {
    await localAdapter.saveAssessment(marks);
    await localAdapter.saveAssessment({ ...marks, average: 9.1 });
    const found = await localAdapter.listAssessments({ studentId: 'HS001' });
    expect(found).toHaveLength(1);
    expect(found[0].average).toBe(9.1);
  });

  it('keeps the two semesters apart', async () => {
    await localAdapter.saveAssessment(marks);
    await localAdapter.saveAssessment({ ...marks, semester: 1, average: 5 });
    expect(await localAdapter.listAssessments({ studentId: 'HS001' })).toHaveLength(2);
    expect(await localAdapter.listAssessments({ studentId: 'HS001', semester: 1 })).toHaveLength(1);
  });

  it('does not leak one student\'s marks into another\'s query', async () => {
    await localAdapter.saveAssessment(marks);
    await localAdapter.saveAssessment({ ...marks, studentId: 'HS002' });
    const found = await localAdapter.listAssessments({ studentId: 'HS002' });
    expect(found).toHaveLength(1);
    expect(found[0].student_id).toBe('HS002');
  });
});

describe('local adapter · điểm danh', () => {
  const entry = { studentId: 'HS001', date: '2026-06-03', status: 'present', checkInTime: '07:15' };

  it('keeps one record per student per day, correcting rather than duplicating', async () => {
    await localAdapter.saveAttendance(entry);
    await localAdapter.saveAttendance({ ...entry, status: 'late', checkInTime: '07:40' });
    const found = await localAdapter.listAttendance({ studentId: 'HS001' });
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ status: 'late', check_in_time: '07:40' });
  });

  it('keeps separate days separate', async () => {
    await localAdapter.saveAttendance(entry);
    await localAdapter.saveAttendance({ ...entry, date: '2026-06-04' });
    expect(await localAdapter.listAttendance({ studentId: 'HS001' })).toHaveLength(2);
  });
});

describe('local adapter · đơn xin nghỉ', () => {
  const request = {
    id: 'L1',
    studentId: 'HS001',
    fromDate: '2026-06-10',
    toDate: '2026-06-12',
    reason: 'Con bị sốt cao'
  };

  it('files a request as pending with no decision attached', async () => {
    const row = await localAdapter.createLeaveRequest(request);
    expect(row.status).toBe('pending');
    expect(row.decided_by).toBeNull();
    expect(row.decided_at).toBeNull();
  });

  it('stamps who decided and when', async () => {
    await localAdapter.createLeaveRequest(request);
    const decided = await localAdapter.decideLeaveRequest({ id: 'L1', status: 'approved', decidedBy: 'T01' });
    expect(decided.status).toBe('approved');
    expect(decided.decided_by).toBe('T01');
    expect(decided.decided_at).toBeTruthy();
  });
});

describe('local adapter · học phí', () => {
  const invoice = {
    id: 'F01',
    studentId: 'HS001',
    title: 'Học phí tháng 6/2026',
    amount: 2_500_000,
    dueDate: '2026-06-15'
  };

  it('issues an invoice unpaid, with no payment stamped', async () => {
    const row = await localAdapter.createInvoice(invoice);
    expect(row.status).toBe('unpaid');
    expect(row.paid_at).toBeNull();
    expect(row.confirmed_by).toBeNull();
  });

  it('a declared transfer is not a payment', async () => {
    await localAdapter.createInvoice(invoice);
    const declared = await localAdapter.declareTransfer({ id: 'F01', reference: 'HS001 F01' });
    expect(declared.status).toBe('pending_reconciliation');
    expect(declared.paid_at).toBeNull();
    expect(declared.confirmed_by).toBeNull();
    expect(declared.payment_reference).toBe('HS001 F01');
  });

  it('only confirmation names who received the money', async () => {
    await localAdapter.createInvoice(invoice);
    await localAdapter.declareTransfer({ id: 'F01', reference: 'HS001 F01' });
    const paid = await localAdapter.confirmPayment({ id: 'F01', confirmedBy: 'ketoan01' });
    expect(paid.status).toBe('paid');
    expect(paid.confirmed_by).toBe('ketoan01');
    expect(paid.paid_at).toBeTruthy();
  });

  it('filters the reconciliation queue by status', async () => {
    await localAdapter.createInvoice(invoice);
    await localAdapter.createInvoice({ ...invoice, id: 'F02' });
    await localAdapter.declareTransfer({ id: 'F02', reference: 'HS001 F02' });
    const waiting = await localAdapter.listInvoices({ status: 'pending_reconciliation' });
    expect(waiting.map((r) => r.id)).toEqual(['F02']);
  });
});

/** Records every call so a test can assert the query that was built. */
function fakeClient() {
  const calls = [];
  const result = { data: {}, error: null };

  const builder = (table) => {
    const chain = {
      select: (...args) => { calls.push({ table, op: 'select', args }); return chain; },
      eq: (field, value) => { calls.push({ table, op: 'eq', field, value }); return chain; },
      order: (field, options) => { calls.push({ table, op: 'order', field, options }); return chain; },
      limit: (value) => { calls.push({ table, op: 'limit', value }); return chain; },
      insert: (payload) => { calls.push({ table, op: 'insert', payload }); return chain; },
      update: (payload) => { calls.push({ table, op: 'update', payload }); return chain; },
      upsert: (payload, options) => { calls.push({ table, op: 'upsert', payload, options }); return chain; },
      single: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
      then: (resolve) => Promise.resolve(result).then(resolve)
    };
    return chain;
  };

  return { calls, client: { from: builder } };
}

describe('supabase adapter · query shape', () => {
  const find = (calls, op, table) => calls.find((c) => c.op === op && c.table === table);

  it('writes marks to assessment_records, keyed for upsert', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveAssessment({
      studentId: 'HS001', subject: 'Math', semester: 2, regular: [8], midterm: 7, final: 6, average: 6.6
    });
    const call = find(calls, 'upsert', 'assessment_records');
    expect(call.options.onConflict).toBe('student_id,subject,semester');
    expect(call.payload.school_id).toBe('school-1');
    expect(call.payload.student_id).toBe('HS001');
  });

  it('keys attendance upserts on student and day', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveAttendance({
      studentId: 'HS001', date: '2026-06-03', status: 'present'
    });
    expect(find(calls, 'upsert', 'attendance_records').options.onConflict).toBe('student_id,date');
  });

  it('stamps the tenant on every insert, so a row cannot land in the wrong school', async () => {
    const { calls, client } = fakeClient();
    const adapter = createSupabaseAdapter(client, 'school-1');
    await adapter.createInvoice({ studentId: 'HS001', title: 'Học phí', amount: 100, dueDate: '2026-06-15' });
    await adapter.createLeaveRequest({ studentId: 'HS001', fromDate: '2026-06-10', toDate: '2026-06-10', reason: 'Ốm sốt' });
    calls.filter((c) => c.op === 'insert' || c.op === 'upsert').forEach((call) => {
      expect(call.payload.school_id, call.table).toBe('school-1');
    });
  });

  it('declares a transfer without stamping payment', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').declareTransfer({ id: 'F01', reference: 'HS001 F01' });
    const call = find(calls, 'update', 'invoices');
    expect(call.payload.status).toBe('pending_reconciliation');
    expect(call.payload).not.toHaveProperty('paid_at');
    expect(call.payload).not.toHaveProperty('confirmed_by');
  });

  it('confirms payment with an attributed confirmer', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').confirmPayment({ id: 'F01', confirmedBy: 'ketoan01' });
    const call = find(calls, 'update', 'invoices');
    expect(call.payload.status).toBe('paid');
    expect(call.payload.confirmed_by).toBe('ketoan01');
    expect(call.payload.paid_at).toBeTruthy();
  });

  it('does not filter by role — row-level security decides what comes back', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').listInvoices();
    expect(calls.filter((c) => c.op === 'eq')).toHaveLength(0);
  });

  it('surfaces a database error instead of returning an empty list', async () => {
    const failing = { from: () => {
      const chain = {
        select: () => chain,
        limit: () => chain,
        then: (resolve) => Promise.resolve({ data: null, error: { message: 'permission denied' } }).then(resolve)
      };
      return chain;
    } };
    await expect(createSupabaseAdapter(failing, 'school-1').listInvoices()).rejects.toThrow(/permission denied/);
  });

  it('inserts a mock exam sitting rather than upserting over the last one', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveMockExamResult(mockPaper());

    const call = find(calls, 'insert', 'mock_exam_results');
    expect(call).toBeTruthy();
    expect(find(calls, 'upsert', 'mock_exam_results')).toBeUndefined();
    expect(call.payload.school_id).toBe('school-1');
    expect(call.payload.student_id).toBe('HS001');
    expect(call.payload.interruptions).toBe(2);
    expect(call.payload.selected_answers).toEqual({ MP01: 'B' });
  });

  it('does not send the app-shaped field name, which Postgres has no column for', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveMockExamResult(mockPaper({ localId: 'local-1' }));

    expect(find(calls, 'insert', 'mock_exam_results').payload).not.toHaveProperty('localId');
  });

  it('asks for the newest sittings first', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').listMockExamResults();

    expect(find(calls, 'order', 'mock_exam_results').options).toMatchObject({ ascending: false });
  });

  it('sends the outbox key, so the database can refuse the same paper twice', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveMockExamResult(mockPaper({ localId: 'local-42' }));

    expect(find(calls, 'insert', 'mock_exam_results').payload.local_id).toBe('local-42');
  });

  it('sends no key for a paper that did not come through the outbox', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveMockExamResult(mockPaper());

    expect(find(calls, 'insert', 'mock_exam_results').payload.local_id).toBeNull();
  });
});

/**
 * A client whose insert is always refused, so the adapter's reading of that
 * refusal can be tested. `single` answers the insert, `maybeSingle` the read
 * back — the same two calls the adapter makes.
 */
function refusingClient(error, stored = null) {
  const calls = [];
  const chain = {
    insert: (payload) => { calls.push({ op: 'insert', payload }); return chain; },
    select: () => chain,
    eq: (field, value) => { calls.push({ op: 'eq', field, value }); return chain; },
    single: () => Promise.resolve({ data: null, error }),
    maybeSingle: () => Promise.resolve({ data: stored, error: null })
  };
  return { calls, client: { from: () => chain } };
}

describe('a paper the outbox sent twice', () => {
  const duplicate = { code: '23505', message: 'duplicate key value violates unique constraint' };

  it('is a paper already stored, not a send that failed', async () => {
    const stored = { id: 'row-1', local_id: 'local-42', student_id: 'HS001' };
    const { calls, client } = refusingClient(duplicate, stored);

    const saved = await createSupabaseAdapter(client, 'school-1').saveMockExamResult(
      mockPaper({ localId: 'local-42' })
    );

    // Handed back rather than thrown: the outbox must drop this paper from the
    // queue instead of retrying it until it is called stuck.
    expect(saved).toEqual(stored);
    expect(calls).toContainEqual({ op: 'eq', field: 'local_id', value: 'local-42' });
  });

  it('does not hide a refusal that is not a duplicate', async () => {
    const { client } = refusingClient({ code: '42501', message: 'permission denied' });

    await expect(
      createSupabaseAdapter(client, 'school-1').saveMockExamResult(mockPaper({ localId: 'local-42' }))
    ).rejects.toThrow(/permission denied/);
  });

  it('is stored once by the browser store too', async () => {
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'local-42' }));
    const again = await localAdapter.saveMockExamResult(mockPaper({ localId: 'local-42', score: 3 }));

    const rows = await localAdapter.listMockExamResults({});
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].score)).toBe(8.25);
    expect(again.id).toBe('local-42');
  });
});

describe('bounded reads', () => {
  const limitFor = (calls, table) => calls.find((c) => c.op === 'limit' && c.table === table)?.value;

  it('never asks Postgres for every row of a table', async () => {
    const { calls, client } = fakeClient();
    const adapter = createSupabaseAdapter(client, 'school-1');

    await adapter.listAssessments();
    await adapter.listCommentResults();
    await adapter.listAttendance();
    await adapter.listLeaveRequests();
    await adapter.listInvoices();
    await adapter.listMockExamResults();

    [
      'assessment_records',
      'comment_results',
      'attendance_records',
      'leave_requests',
      'invoices',
      'mock_exam_results'
    ].forEach((table) => {
      expect(limitFor(calls, table), table).toBeGreaterThan(0);
    });
  });

  it('lets a caller that knows what it needs ask for less', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').listMockExamResults({ limit: 25 });

    expect(limitFor(calls, 'mock_exam_results')).toBe(25);
  });

  it('caps the browser store the same way', async () => {
    for (let i = 0; i < 5; i++) {
      await localAdapter.saveMockExamResult(mockPaper({ localId: `local-${i}` }));
    }

    expect(await localAdapter.listMockExamResults({ limit: 2 })).toHaveLength(2);
  });

  it('drops the oldest sittings rather than an arbitrary handful when it caps', async () => {
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'old', takenAt: '2026-01-04T07:00:00.000Z' }));
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'new', takenAt: '2026-08-03T07:00:00.000Z' }));

    const [only] = await localAdapter.listMockExamResults({ limit: 1 });

    expect(only.id).toBe('new');
  });
});

describe('mock exam sittings · browser store', () => {
  it('appends each sitting instead of collapsing them onto one row', async () => {
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'a', score: 5 }));
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'b', score: 9 }));

    const rows = await localAdapter.listMockExamResults({ studentId: 'HS001' });

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => Number(r.score)).sort()).toEqual([5, 9]);
  });

  it('keeps the id the outbox gave it, so a reload shows one sitting not two', async () => {
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'local-42' }));

    expect((await localAdapter.listMockExamResults({}))[0].id).toBe('local-42');
  });

  it('carries the name and class the student had that day', async () => {
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'a' }));

    expect((await localAdapter.listMockExamResults({}))[0]).toMatchObject({
      student_name: 'Nguyễn Hoàng Nam',
      class_name: '12A1'
    });
  });

  it('hands back one student\'s papers without the others', async () => {
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'a' }));
    await localAdapter.saveMockExamResult(mockPaper({ localId: 'b', studentId: 'HS002' }));

    const mine = await localAdapter.listMockExamResults({ studentId: 'HS001' });

    expect(mine).toHaveLength(1);
    expect(mine[0].student_id).toBe('HS001');
  });

  it('reports a refused write instead of letting the outbox drop the paper', async () => {
    const realSetItem = globalThis.localStorage.setItem;
    globalThis.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };

    await expect(localAdapter.saveMockExamResult(mockPaper({ localId: 'a' })))
      .rejects.toThrow(/không lưu được/);

    globalThis.localStorage.setItem = realSetItem;
  });
});

describe('fromMockExamRow', () => {
  it('gives the screens back the shape they already read', () => {
    const row = {
      id: 'row-1',
      student_id: 'HS001',
      student_name: 'Nguyễn Hoàng Nam',
      class_name: '12A1',
      exam_id: 'SYS_SUBJ_Math',
      title: 'Đề thi thử Toán',
      block: 'SINGLE',
      score: '8.25',
      total_questions: 22,
      time_spent: '48:12',
      interruptions: 2,
      subject_breakdown: { Math: { subjectScore: 8.25 } },
      selected_answers: { MP01: 'B' },
      taken_at: '2026-08-03T07:00:00.000Z'
    };

    expect(fromMockExamRow(row)).toEqual({
      id: 'row-1',
      studentId: 'HS001',
      studentName: 'Nguyễn Hoàng Nam',
      class: '12A1',
      examId: 'SYS_SUBJ_Math',
      title: 'Đề thi thử Toán',
      block: 'SINGLE',
      score: 8.25,
      totalQuestions: 22,
      timeSpent: '48:12',
      interruptions: 2,
      subjectBreakdown: { Math: { subjectScore: 8.25 } },
      selectedAnswers: { MP01: 'B' },
      date: '2026-08-03'
    });
  });

  it('survives a row whose optional columns are empty', () => {
    const bare = fromMockExamRow({ id: 'r', student_id: 'HS001', exam_id: 'e', title: 't', score: 0, total_questions: 0 });

    expect(bare.subjectBreakdown).toEqual({});
    expect(bare.selectedAnswers).toEqual({});
    expect(bare.interruptions).toBe(0);
    expect(bare.studentName).toBeNull();
  });
});
