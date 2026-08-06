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
    schoolYear: '2025-2026',
    regular: [8, 9],
    midterm: 7,
    final: 6,
    average: 6.7
  };

  it('round-trips a saved record', async () => {
    await localAdapter.saveAssessment(marks);
    const [row] = await localAdapter.listAssessments({ studentId: 'HS001' });
    expect(row).toMatchObject({
      student_id: 'HS001', subject: 'Math', semester: 2, school_year: '2025-2026', average: 6.7
    });
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

  /**
   * The defect this whole change exists for, at the layer that caused it.
   *
   * One pupil, one môn, one học kỳ, three năm học — a học bạ. Before năm học
   * was part of the identity these were one row, and lớp 12 opened a học bạ
   * holding one of the three years it is meant to hold.
   */
  it('keeps a pupil\'s three years of Toán học kỳ I apart', async () => {
    const hocKyI = { ...marks, semester: 1 };

    await localAdapter.saveAssessment({ ...hocKyI, schoolYear: '2024-2025', average: 6.5 });
    await localAdapter.saveAssessment({ ...hocKyI, schoolYear: '2025-2026', average: 7.5 });
    await localAdapter.saveAssessment({ ...hocKyI, schoolYear: '2026-2027', average: 8.5 });

    const all = await localAdapter.listAssessments({ studentId: 'HS001', semester: 1 });
    expect(all).toHaveLength(3);
    expect(all.map((row) => row.average).sort()).toEqual([6.5, 7.5, 8.5]);
  });

  it('hands back one năm học when asked for one, leaving the others stored', async () => {
    await localAdapter.saveAssessment({ ...marks, schoolYear: '2024-2025', average: 5 });
    await localAdapter.saveAssessment(marks);

    const thisYear = await localAdapter.listAssessments({
      studentId: 'HS001', semester: 2, schoolYear: '2025-2026'
    });

    expect(thisYear).toHaveLength(1);
    expect(thisYear[0].average).toBe(6.7);
  });

  it('still corrects in place within one năm học', async () => {
    await localAdapter.saveAssessment({ ...marks, schoolYear: '2024-2025' });
    await localAdapter.saveAssessment({ ...marks, schoolYear: '2024-2025', average: 9.1 });

    const found = await localAdapter.listAssessments({ studentId: 'HS001', schoolYear: '2024-2025' });
    expect(found).toHaveLength(1);
    expect(found[0].average).toBe(9.1);
  });

  // A write with no năm học is the write that used to destroy a year of a học
  // bạ. Postgres refuses it — school_year is NOT NULL with no DEFAULT — and the
  // browser store, which has no constraints of its own, has to refuse it too or
  // the demo goes on doing quietly what the database now forbids.
  it.each([
    ['nothing at all', undefined],
    ['an empty string', ''],
    ['a single year', '2025'],
    ['two years that are not consecutive', '2025-2027'],
    ['the display spelling', '2025 - 2026'],
    ['an en dash', '2025–2026'],
    ['a number', 2025]
  ])('refuses a mark filed under %s', async (_label, schoolYear) => {
    await expect(localAdapter.saveAssessment({ ...marks, schoolYear }))
      .rejects.toThrow(/năm học/);

    expect(await localAdapter.listAssessments({})).toEqual([]);
  });
});

describe('local adapter · kết quả rèn luyện', () => {
  // Học kỳ as the number the database stores, not the 'semester2' key the
  // student record carries. The translation happens above this layer.
  const conduct = { studentId: 'HS001', semester: 2, schoolYear: '2025-2026', band: 'Khá' };

  it('round-trips a recorded mức', async () => {
    await localAdapter.saveConductResult({ ...conduct, updatedBy: 'T01' });
    const [row] = await localAdapter.listConductResults({ studentId: 'HS001' });
    expect(row).toMatchObject({ student_id: 'HS001', semester: 2, band: 'Khá', updated_by: 'T01' });
  });

  it('corrects the mức in place rather than recording a second one', async () => {
    await localAdapter.saveConductResult(conduct);
    await localAdapter.saveConductResult({ ...conduct, band: 'Tốt' });
    const found = await localAdapter.listConductResults({ studentId: 'HS001' });
    expect(found).toHaveLength(1);
    expect(found[0].band).toBe('Tốt');
  });

  it('keeps the two học kỳ apart, because cả năm is derived from both', async () => {
    await localAdapter.saveConductResult(conduct);
    await localAdapter.saveConductResult({ ...conduct, semester: 1, band: 'Tốt' });
    expect(await localAdapter.listConductResults({ studentId: 'HS001' })).toHaveLength(2);
    const [firstTerm] = await localAdapter.listConductResults({ studentId: 'HS001', semester: 1 });
    expect(firstTerm.band).toBe('Tốt');
  });

  it('stores no năm học band, which Điều 8 khoản 2 điểm b derives', async () => {
    await localAdapter.saveConductResult(conduct);
    await localAdapter.saveConductResult({ ...conduct, semester: 1, band: 'Tốt' });
    const rows = await localAdapter.listConductResults({ studentId: 'HS001' });
    rows.forEach((row) => {
      expect(Object.keys(row)).toEqual(
        expect.not.arrayContaining(['year', 'year_band', 'band_year', 'conduct_year'])
      );
    });
  });

  it('does not leak one student\'s rèn luyện into another\'s query', async () => {
    await localAdapter.saveConductResult(conduct);
    await localAdapter.saveConductResult({ ...conduct, studentId: 'HS002', band: 'Đạt' });
    const found = await localAdapter.listConductResults({ studentId: 'HS002' });
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ student_id: 'HS002', band: 'Đạt' });
  });

  it('takes the mức back off the student when it is cleared, rather than emptying it', async () => {
    await localAdapter.saveConductResult(conduct);
    const cleared = await localAdapter.saveConductResult({ ...conduct, band: null });

    // Chưa đánh giá is the absence of a row: a student nobody has assessed and
    // one whose mức was withdrawn have to read back the same.
    expect(cleared).toBeNull();
    expect(await localAdapter.listConductResults({ studentId: 'HS001' })).toEqual([]);
  });

  it('clears only the học kỳ named, leaving the other assessment standing', async () => {
    await localAdapter.saveConductResult({ ...conduct, semester: 1, band: 'Tốt' });
    await localAdapter.saveConductResult(conduct);
    await localAdapter.saveConductResult({ ...conduct, band: null });

    const left = await localAdapter.listConductResults({ studentId: 'HS001' });
    expect(left).toHaveLength(1);
    expect(left[0]).toMatchObject({ semester: 1, band: 'Tốt' });
  });

  it('clears one student without touching another\'s', async () => {
    await localAdapter.saveConductResult(conduct);
    await localAdapter.saveConductResult({ ...conduct, studentId: 'HS002' });
    await localAdapter.saveConductResult({ ...conduct, band: null });

    expect(await localAdapter.listConductResults({ studentId: 'HS002' })).toHaveLength(1);
  });

  it('clearing a semester nobody assessed is not an error', async () => {
    await expect(localAdapter.saveConductResult({ ...conduct, band: null })).resolves.toBeNull();
  });

  it('keeps each năm học\'s two mức apart', async () => {
    await localAdapter.saveConductResult({ ...conduct, schoolYear: '2024-2025', band: 'Đạt' });
    await localAdapter.saveConductResult(conduct);

    expect(await localAdapter.listConductResults({ studentId: 'HS001' })).toHaveLength(2);

    const [thisYear] = await localAdapter.listConductResults({
      studentId: 'HS001', semester: 2, schoolYear: '2025-2026'
    });
    expect(thisYear.band).toBe('Khá');
  });

  // "Chưa đánh giá" on this năm học must not reach back and withdraw the mức
  // the pupil was given last năm học, which Điều 8 khoản 2 điểm b still needs.
  it('clears only the năm học named', async () => {
    await localAdapter.saveConductResult({ ...conduct, schoolYear: '2024-2025', band: 'Tốt' });
    await localAdapter.saveConductResult(conduct);
    await localAdapter.saveConductResult({ ...conduct, band: null });

    const left = await localAdapter.listConductResults({ studentId: 'HS001' });
    expect(left).toHaveLength(1);
    expect(left[0]).toMatchObject({ school_year: '2024-2025', band: 'Tốt' });
  });

  it('refuses a mức with no năm học, and clearing one too', async () => {
    await expect(localAdapter.saveConductResult({ ...conduct, schoolYear: undefined }))
      .rejects.toThrow(/năm học/);

    // Including the clear: a delete that does not name the năm học is a delete
    // that would take every year's mức off the pupil at once.
    await expect(localAdapter.saveConductResult({ ...conduct, schoolYear: undefined, band: null }))
      .rejects.toThrow(/năm học/);
  });
});

describe('local adapter · nhận xét', () => {
  const comment = {
    studentId: 'HS001',
    subject: 'PhysicalEducation',
    semester: 2,
    schoolYear: '2025-2026',
    result: 'Đạt'
  };

  it('keeps the same môn and học kỳ of two năm học apart', async () => {
    await localAdapter.saveCommentResult({ ...comment, schoolYear: '2024-2025', result: 'Chưa đạt' });
    await localAdapter.saveCommentResult(comment);

    const all = await localAdapter.listCommentResults({ studentId: 'HS001' });
    expect(all).toHaveLength(2);

    const thisYear = await localAdapter.listCommentResults({
      studentId: 'HS001', schoolYear: '2025-2026'
    });
    expect(thisYear).toHaveLength(1);
    expect(thisYear[0].result).toBe('Đạt');
  });

  it('refuses a nhận xét with no năm học', async () => {
    await expect(localAdapter.saveCommentResult({ ...comment, schoolYear: null }))
      .rejects.toThrow(/năm học/);
  });
});

/**
 * The browser store has no triggers, so it plays both of them by hand. These
 * cases are written against the behaviour the two migrations describe rather
 * than against the mechanism, because the mechanism is the part that differs
 * and the behaviour is the part that must not.
 */
describe('local adapter · khoá sổ điểm', () => {
  const marks = {
    studentId: 'HS001',
    subject: 'Math',
    semester: 2,
    schoolYear: '2025-2026',
    regular: [8],
    midterm: 7,
    final: 6,
    average: 6.6
  };
  const lock = { schoolYear: '2025-2026', semester: 2, locked: true, lockedBy: 'BGH01' };

  it('is open until somebody closes it', async () => {
    expect(await localAdapter.listGradebookLocks({ schoolYear: '2025-2026' })).toEqual([]);
  });

  it('records who closed it and when', async () => {
    const row = await localAdapter.setGradebookLock(lock);

    expect(row).toMatchObject({ school_year: '2025-2026', semester: 2, locked_by: 'BGH01' });
    expect(row.locked_at).toBeTruthy();
  });

  // Presence is the whole state: an open học kỳ is one nobody has locked, so
  // re-opening takes the row away rather than setting a flag on it.
  it('re-opening takes the row away rather than marking it open', async () => {
    await localAdapter.setGradebookLock(lock);
    const cleared = await localAdapter.setGradebookLock({ ...lock, locked: false });

    expect(cleared).toBeNull();
    expect(await localAdapter.listGradebookLocks({})).toEqual([]);
  });

  it('keeps the name of whoever closed it first', async () => {
    await localAdapter.setGradebookLock(lock);
    const again = await localAdapter.setGradebookLock({ ...lock, lockedBy: 'BGH02' });

    expect(again.locked_by).toBe('BGH01');
    expect(await localAdapter.listGradebookLocks({})).toHaveLength(1);
  });

  it('refuses to close a sổ điểm with nobody\'s name on it', async () => {
    await expect(localAdapter.setGradebookLock({ ...lock, lockedBy: null }))
      .rejects.toThrow(/người khoá/);
  });

  it('refuses a teacher\'s mark once the học kỳ is closed', async () => {
    await localAdapter.setGradebookLock(lock);

    await expect(localAdapter.saveAssessment({ ...marks, actorRole: 'teacher' }))
      .rejects.toThrow(/đã khoá/);
    expect(await localAdapter.listAssessments({})).toEqual([]);
  });

  it('refuses a nhận xét and a mức rèn luyện in the same closed học kỳ', async () => {
    await localAdapter.setGradebookLock(lock);

    await expect(localAdapter.saveCommentResult({
      studentId: 'HS001', subject: 'Music', semester: 2, schoolYear: '2025-2026',
      result: 'Đạt', actorRole: 'teacher'
    })).rejects.toThrow(/đã khoá/);

    await expect(localAdapter.saveConductResult({
      studentId: 'HS001', semester: 2, schoolYear: '2025-2026', band: 'Tốt', actorRole: 'teacher'
    })).rejects.toThrow(/đã khoá/);
  });

  // The correction path, not a hole in the lock: a mark found to be wrong after
  // chốt has to be fixable without re-opening the học kỳ for the whole school.
  it('lets Ban Giám Hiệu correct a closed học kỳ', async () => {
    await localAdapter.setGradebookLock(lock);

    const saved = await localAdapter.saveAssessment({ ...marks, actorRole: 'admin' });
    expect(saved.average).toBe(6.6);
  });

  it('closes one học kỳ of one năm học and leaves the rest writable', async () => {
    await localAdapter.setGradebookLock(lock);

    // The other học kỳ of the same năm học…
    await expect(localAdapter.saveAssessment({ ...marks, semester: 1, actorRole: 'teacher' }))
      .resolves.toMatchObject({ semester: 1 });

    // …and the same học kỳ of another năm học.
    await expect(localAdapter.saveAssessment({ ...marks, schoolYear: '2026-2027', actorRole: 'teacher' }))
      .resolves.toMatchObject({ school_year: '2026-2027' });
  });

  it('refuses a lock filed under a năm học that is not one', async () => {
    await expect(localAdapter.setGradebookLock({ ...lock, schoolYear: '2025-2027' }))
      .rejects.toThrow(/năm học/);
  });
});

describe('local adapter · nhật ký sửa điểm', () => {
  const marks = {
    studentId: 'HS001',
    subject: 'Math',
    semester: 2,
    schoolYear: '2025-2026',
    regular: [8],
    midterm: 7,
    final: 6,
    average: 6.6,
    updatedBy: 'T01'
  };

  it('records the first mark as an INSERT with nothing before it', async () => {
    await localAdapter.saveAssessment(marks);
    const [entry] = await localAdapter.listAssessmentHistory({ studentId: 'HS001' });

    expect(entry).toMatchObject({
      student_id: 'HS001',
      subject: 'Math',
      semester: 2,
      school_year: '2025-2026',
      operation: 'INSERT',
      old_average: null,
      new_average: 6.6,
      changed_by: 'T01'
    });
    expect(entry.changed_at).toBeTruthy();
  });

  // The question a parent asks is "từ mấy sang mấy", and only a log holding
  // both numbers can answer it: updated_by and updated_at name the last writer
  // and nothing about what they replaced.
  it('records a correction with both the old and the new marks', async () => {
    await localAdapter.saveAssessment(marks);
    await localAdapter.saveAssessment({ ...marks, final: 9, average: 8.1, updatedBy: 'T02' });

    const [newest] = await localAdapter.listAssessmentHistory({ studentId: 'HS001' });
    expect(newest).toMatchObject({
      operation: 'UPDATE',
      old_final: 6,
      old_average: 6.6,
      new_final: 9,
      new_average: 8.1,
      changed_by: 'T02'
    });
  });

  // A teacher who says they never touched the row cannot be believed from a log
  // that drops the writes it judged uninteresting.
  it('records a write that changed nothing', async () => {
    await localAdapter.saveAssessment(marks);
    await localAdapter.saveAssessment(marks);

    const entries = await localAdapter.listAssessmentHistory({ studentId: 'HS001' });
    expect(entries).toHaveLength(2);
    expect(entries.map((row) => row.operation)).toEqual(['UPDATE', 'INSERT']);
  });

  it('records an admin\'s correction to a closed sổ điểm', async () => {
    await localAdapter.saveAssessment(marks);
    await localAdapter.setGradebookLock({
      schoolYear: '2025-2026', semester: 2, locked: true, lockedBy: 'BGH01'
    });
    await localAdapter.saveAssessment({ ...marks, average: 9.9, updatedBy: 'BGH01', actorRole: 'admin' });

    const [newest] = await localAdapter.listAssessmentHistory({ studentId: 'HS001' });
    expect(newest).toMatchObject({ new_average: 9.9, changed_by: 'BGH01' });
  });

  it('records nothing for a write the lock refused', async () => {
    await localAdapter.setGradebookLock({
      schoolYear: '2025-2026', semester: 2, locked: true, lockedBy: 'BGH01'
    });
    await expect(localAdapter.saveAssessment({ ...marks, actorRole: 'teacher' })).rejects.toThrow();

    expect(await localAdapter.listAssessmentHistory({})).toEqual([]);
  });

  it('records nothing for a write the browser refused', async () => {
    const realSetItem = globalThis.localStorage.setItem;
    globalThis.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };

    await expect(localAdapter.saveAssessment(marks)).rejects.toThrow(/không lưu được/);

    globalThis.localStorage.setItem = realSetItem;
    expect(await localAdapter.listAssessmentHistory({})).toEqual([]);
  });

  it('narrows to one pupil and one môn', async () => {
    await localAdapter.saveAssessment(marks);
    await localAdapter.saveAssessment({ ...marks, subject: 'Literature' });
    await localAdapter.saveAssessment({ ...marks, studentId: 'HS002' });

    const mine = await localAdapter.listAssessmentHistory({ studentId: 'HS001', subject: 'Math' });
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ student_id: 'HS001', subject: 'Math' });
  });

  it('offers no way to write the log by hand', () => {
    // Append-only is a grant in Postgres — the client is given SELECT and
    // nothing else — so the seam must not carry a method the grant refuses.
    expect(REPOSITORY_METHODS).not.toContain('saveAssessmentHistory');
    expect(localAdapter.saveAssessmentHistory).toBeUndefined();
    expect(createSupabaseAdapter({ from: () => ({}) }, 'school-1').saveAssessmentHistory).toBeUndefined();
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
      delete: () => { calls.push({ table, op: 'delete' }); return chain; },
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
      studentId: 'HS001', subject: 'Math', semester: 2, schoolYear: '2025-2026',
      regular: [8], midterm: 7, final: 6, average: 6.6
    });
    const call = find(calls, 'upsert', 'assessment_records');
    // The conflict target is the UNIQUE 012 rebuilt. Leave năm học out of it and
    // Postgres finds last year's row of the same name and writes over it.
    expect(call.options.onConflict).toBe('student_id,subject,semester,school_year');
    expect(call.payload.school_id).toBe('school-1');
    expect(call.payload.student_id).toBe('HS001');
    expect(call.payload.school_year).toBe('2025-2026');
  });

  it('writes nhận xét keyed on năm học too', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveCommentResult({
      studentId: 'HS001', subject: 'Music', semester: 1, schoolYear: '2025-2026', result: 'Đạt'
    });

    const call = find(calls, 'upsert', 'comment_results');
    expect(call.options.onConflict).toBe('student_id,subject,semester,school_year');
    expect(call.payload.school_year).toBe('2025-2026');
  });

  it('writes kết quả rèn luyện to conduct_results, keyed on student, học kỳ and năm học', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveConductResult({
      studentId: 'HS001', semester: 2, schoolYear: '2025-2026', band: 'Khá', updatedBy: 'T01'
    });

    const call = find(calls, 'upsert', 'conduct_results');
    expect(call.options.onConflict).toBe('student_id,semester,school_year');
    expect(call.payload).toMatchObject({
      school_id: 'school-1',
      student_id: 'HS001',
      semester: 2,
      school_year: '2025-2026',
      band: 'Khá',
      updated_by: 'T01'
    });
  });

  it('sends no năm học band, so the derived result cannot drift from a stored one', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveConductResult({
      studentId: 'HS001', semester: 1, schoolYear: '2025-2026', band: 'Tốt'
    });

    const { payload } = find(calls, 'upsert', 'conduct_results');
    // school_year says which năm học the row belongs to; these would say what
    // the năm học result *is*, which Điều 8 khoản 2 điểm b derives.
    ['year', 'year_band', 'band_year', 'conduct_year'].forEach((column) => {
      expect(payload).not.toHaveProperty(column);
    });
  });

  it('deletes the row when a mức is taken back, because band is NOT NULL', async () => {
    const { calls, client } = fakeClient();
    const cleared = await createSupabaseAdapter(client, 'school-1').saveConductResult({
      studentId: 'HS001', semester: 2, schoolYear: '2025-2026', band: null
    });

    expect(find(calls, 'delete', 'conduct_results')).toBeTruthy();
    // An upsert of an empty band would be refused by the column, and an upsert
    // of anything else would leave a verdict on a child the teacher withdrew.
    expect(find(calls, 'upsert', 'conduct_results')).toBeUndefined();
    // Năm học among them: a delete that does not name it takes the pupil's mức
    // off every năm học at once.
    expect(calls.filter((c) => c.op === 'eq' && c.table === 'conduct_results')).toEqual([
      { table: 'conduct_results', op: 'eq', field: 'student_id', value: 'HS001' },
      { table: 'conduct_results', op: 'eq', field: 'semester', value: 2 },
      { table: 'conduct_results', op: 'eq', field: 'school_year', value: '2025-2026' }
    ]);
    expect(cleared).toBeNull();
  });

  it('narrows a rèn luyện read to one student, one học kỳ and one năm học when asked', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').listConductResults({
      studentId: 'HS001', semester: 2, schoolYear: '2025-2026'
    });

    expect(calls.filter((c) => c.op === 'eq' && c.table === 'conduct_results')).toEqual([
      { table: 'conduct_results', op: 'eq', field: 'student_id', value: 'HS001' },
      { table: 'conduct_results', op: 'eq', field: 'semester', value: 2 },
      { table: 'conduct_results', op: 'eq', field: 'school_year', value: '2025-2026' }
    ]);
  });

  it('narrows a sổ điểm read to one năm học when asked', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').listAssessments({
      studentId: 'HS001', semester: 2, schoolYear: '2025-2026'
    });

    expect(calls.filter((c) => c.op === 'eq' && c.table === 'assessment_records')).toEqual([
      { table: 'assessment_records', op: 'eq', field: 'student_id', value: 'HS001' },
      { table: 'assessment_records', op: 'eq', field: 'semester', value: 2 },
      { table: 'assessment_records', op: 'eq', field: 'school_year', value: '2025-2026' }
    ]);
  });

  // The same refusal the browser store gives, so a client bug is a message in
  // Vietnamese rather than a 23502 from Postgres after a round trip.
  it('refuses to send an academic write with no năm học', async () => {
    const { client } = fakeClient();
    const adapter = createSupabaseAdapter(client, 'school-1');

    await expect(adapter.saveAssessment({ studentId: 'HS001', subject: 'Math', semester: 2 }))
      .rejects.toThrow(/năm học/);
    await expect(adapter.saveCommentResult({ studentId: 'HS001', subject: 'Music', semester: 2, result: 'Đạt' }))
      .rejects.toThrow(/năm học/);
    await expect(adapter.saveConductResult({ studentId: 'HS001', semester: 2, band: 'Khá' }))
      .rejects.toThrow(/năm học/);
  });

  it('does not send the caller\'s own word for what role they hold', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').saveAssessment({
      studentId: 'HS001', subject: 'Math', semester: 2, schoolYear: '2025-2026',
      regular: [8], midterm: 7, final: 6, average: 6.6, actorRole: 'admin'
    });

    // The trigger reads auth_role() from a signed token. A role in the payload
    // would be a lock any browser could open by typing 'admin'.
    const { payload } = find(calls, 'upsert', 'assessment_records');
    expect(payload).not.toHaveProperty('actorRole');
    expect(payload).not.toHaveProperty('actor_role');
    expect(payload).not.toHaveProperty('role');
  });

  it('closes a sổ điểm with an insert, since the table grants no UPDATE', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').setGradebookLock({
      schoolYear: '2025-2026', semester: 2, locked: true, lockedBy: 'BGH01'
    });

    const call = find(calls, 'insert', 'gradebook_locks');
    expect(call.payload).toMatchObject({
      school_id: 'school-1', school_year: '2025-2026', semester: 2, locked_by: 'BGH01'
    });
    expect(find(calls, 'upsert', 'gradebook_locks')).toBeUndefined();
  });

  it('re-opens a sổ điểm by deleting the row that named it closed', async () => {
    const { calls, client } = fakeClient();
    const cleared = await createSupabaseAdapter(client, 'school-1').setGradebookLock({
      schoolYear: '2025-2026', semester: 2, locked: false
    });

    expect(find(calls, 'delete', 'gradebook_locks')).toBeTruthy();
    expect(calls.filter((c) => c.op === 'eq' && c.table === 'gradebook_locks')).toEqual([
      { table: 'gradebook_locks', op: 'eq', field: 'school_id', value: 'school-1' },
      { table: 'gradebook_locks', op: 'eq', field: 'school_year', value: '2025-2026' },
      { table: 'gradebook_locks', op: 'eq', field: 'semester', value: 2 }
    ]);
    expect(cleared).toBeNull();
  });

  it('asks for the newest changes to a pupil\'s marks first', async () => {
    const { calls, client } = fakeClient();
    await createSupabaseAdapter(client, 'school-1').listAssessmentHistory({
      studentId: 'HS001', subject: 'Math'
    });

    expect(find(calls, 'order', 'assessment_history').options).toMatchObject({ ascending: false });
    expect(calls.filter((c) => c.op === 'eq' && c.table === 'assessment_history')).toEqual([
      { table: 'assessment_history', op: 'eq', field: 'student_id', value: 'HS001' },
      { table: 'assessment_history', op: 'eq', field: 'subject', value: 'Math' }
    ]);
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
    await adapter.saveConductResult({ studentId: 'HS001', semester: 2, schoolYear: '2025-2026', band: 'Khá' });
    await adapter.setGradebookLock({ schoolYear: '2025-2026', semester: 2, locked: true, lockedBy: 'BGH01' });
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

describe('a học kỳ somebody closed twice', () => {
  const duplicate = { code: '23505', message: 'duplicate key value violates unique constraint' };

  it('is a sổ điểm already closed, not a failure to close it', async () => {
    const stored = { school_year: '2025-2026', semester: 2, locked_by: 'BGH01' };
    const { client } = refusingClient(duplicate, stored);

    const lock = await createSupabaseAdapter(client, 'school-1').setGradebookLock({
      schoolYear: '2025-2026', semester: 2, locked: true, lockedBy: 'BGH02'
    });

    // The lock that is there, with the first closer's name on it: a second
    // click reports the book shut rather than reporting an error, and does not
    // rewrite who shut it.
    expect(lock).toEqual(stored);
  });

  it('does not hide a refusal that is not a duplicate', async () => {
    const { client } = refusingClient({ code: '42501', message: 'permission denied' });

    await expect(
      createSupabaseAdapter(client, 'school-1').setGradebookLock({
        schoolYear: '2025-2026', semester: 2, locked: true, lockedBy: 'T01'
      })
    ).rejects.toThrow(/permission denied/);
  });

  it('refuses to close a sổ điểm with nobody\'s name on it', async () => {
    const { client } = fakeClient();

    await expect(
      createSupabaseAdapter(client, 'school-1').setGradebookLock({
        schoolYear: '2025-2026', semester: 2, locked: true, lockedBy: null
      })
    ).rejects.toThrow(/người khoá/);
  });
});

describe('bounded reads', () => {
  const limitFor = (calls, table) => calls.find((c) => c.op === 'limit' && c.table === table)?.value;

  it('never asks Postgres for every row of a table', async () => {
    const { calls, client } = fakeClient();
    const adapter = createSupabaseAdapter(client, 'school-1');

    await adapter.listAssessments();
    await adapter.listAssessmentHistory();
    await adapter.listCommentResults();
    await adapter.listConductResults();
    await adapter.listGradebookLocks();
    await adapter.listAttendance();
    await adapter.listLeaveRequests();
    await adapter.listInvoices();
    await adapter.listMockExamResults();

    [
      'assessment_records',
      'assessment_history',
      'comment_results',
      'conduct_results',
      'gradebook_locks',
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
