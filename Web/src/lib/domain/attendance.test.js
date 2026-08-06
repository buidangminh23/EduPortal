import { describe, it, expect } from 'vitest';
import {
  ATTENDANCE_STATUS,
  LEAVE_STATUS,
  canTransitionLeave,
  countConsecutiveUnexcusedAbsences,
  hasUnexcusedAbsenceStreak,
  isDateCoveredByLeave,
  isValidIsoDate,
  resolveAttendanceStatus,
  summariseAttendance,
  summariseDailyAttendance,
  todayIso,
  transitionLeave,
  validateAttendanceEntry,
  validateLeaveRequest
} from './attendance';

const approvedLeave = {
  id: 'L1',
  studentId: 'HS001',
  fromDate: '2026-06-10',
  toDate: '2026-06-12',
  status: LEAVE_STATUS.APPROVED
};

const record = (date, status, studentId = 'HS001') => ({ studentId, date, status });

describe('todayIso', () => {
  it('formats the local date, not the UTC date', () => {
    // 00:30 local on 2 June must stay 2 June even when UTC has not rolled over.
    const localMidnightish = new Date(2026, 5, 2, 0, 30);
    expect(todayIso(localMidnightish)).toBe('2026-06-02');
  });
});

describe('isValidIsoDate', () => {
  it('accepts a real calendar date', () => {
    expect(isValidIsoDate('2026-06-02')).toBe(true);
  });

  it('rejects impossible dates and wrong shapes', () => {
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('02/06/2026')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate(null)).toBe(false);
  });
});

describe('validateAttendanceEntry', () => {
  const today = '2026-06-02';

  it('accepts a well-formed entry for today', () => {
    const result = validateAttendanceEntry(
      { studentId: 'HS001', date: today, status: ATTENDANCE_STATUS.PRESENT },
      { today }
    );
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('refuses to record attendance for a future date', () => {
    const result = validateAttendanceEntry(
      { studentId: 'HS001', date: '2026-06-03', status: ATTENDANCE_STATUS.PRESENT },
      { today }
    );
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/tương lai/);
  });

  it('accepts a past date, since registers get filled in late', () => {
    expect(
      validateAttendanceEntry(
        { studentId: 'HS001', date: '2026-05-20', status: ATTENDANCE_STATUS.LATE },
        { today }
      ).valid
    ).toBe(true);
  });

  it('rejects an unknown status', () => {
    const result = validateAttendanceEntry(
      { studentId: 'HS001', date: today, status: 'maybe' },
      { today }
    );
    expect(result.valid).toBe(false);
  });

  it('reports a missing student and a bad date together', () => {
    const result = validateAttendanceEntry({ date: 'hôm nay', status: 'x' }, { today });
    expect(result.errors).toHaveLength(3);
  });
});

describe('validateLeaveRequest', () => {
  const base = {
    studentId: 'HS001',
    fromDate: '2026-06-10',
    toDate: '2026-06-12',
    reason: 'Con bị sốt cao'
  };

  it('accepts a well-formed request', () => {
    expect(validateLeaveRequest(base)).toEqual({ valid: true, errors: [] });
  });

  it('accepts a single-day leave', () => {
    expect(validateLeaveRequest({ ...base, toDate: base.fromDate }).valid).toBe(true);
  });

  it('rejects a range that ends before it starts', () => {
    const result = validateLeaveRequest({ ...base, toDate: '2026-06-09' });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/sau hoặc trùng/);
  });

  it('rejects a token reason', () => {
    expect(validateLeaveRequest({ ...base, reason: 'ốm' }).valid).toBe(false);
    expect(validateLeaveRequest({ ...base, reason: '   ' }).valid).toBe(false);
  });

  it('allows back-dating, because parents file after keeping a child home', () => {
    expect(validateLeaveRequest({ ...base, fromDate: '2020-01-01', toDate: '2020-01-02' }).valid).toBe(
      true
    );
  });
});

describe('leave workflow', () => {
  it('allows a pending request to be approved, rejected or cancelled', () => {
    expect(canTransitionLeave(LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED)).toBe(true);
    expect(canTransitionLeave(LEAVE_STATUS.PENDING, LEAVE_STATUS.REJECTED)).toBe(true);
    expect(canTransitionLeave(LEAVE_STATUS.PENDING, LEAVE_STATUS.CANCELLED)).toBe(true);
  });

  it('freezes a request once it has been decided', () => {
    expect(canTransitionLeave(LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED)).toBe(false);
    expect(canTransitionLeave(LEAVE_STATUS.REJECTED, LEAVE_STATUS.APPROVED)).toBe(false);
    expect(canTransitionLeave(LEAVE_STATUS.CANCELLED, LEAVE_STATUS.APPROVED)).toBe(false);
  });

  it('records who decided and when', () => {
    const pending = { ...approvedLeave, status: LEAVE_STATUS.PENDING };
    const decided = transitionLeave(pending, LEAVE_STATUS.APPROVED, {
      decidedBy: 'T01',
      decidedAt: '2026-06-09T08:00:00.000Z'
    });
    expect(decided.status).toBe(LEAVE_STATUS.APPROVED);
    expect(decided.decidedBy).toBe('T01');
    expect(decided.decidedAt).toBe('2026-06-09T08:00:00.000Z');
  });

  it('leaves the original request untouched', () => {
    const pending = { ...approvedLeave, status: LEAVE_STATUS.PENDING };
    transitionLeave(pending, LEAVE_STATUS.APPROVED, { decidedBy: 'T01' });
    expect(pending.status).toBe(LEAVE_STATUS.PENDING);
  });

  it('throws rather than silently overwriting an earlier decision', () => {
    expect(() => transitionLeave(approvedLeave, LEAVE_STATUS.REJECTED)).toThrow(/Không thể chuyển/);
  });
});

describe('isDateCoveredByLeave', () => {
  it('covers both endpoints of the range', () => {
    expect(isDateCoveredByLeave('2026-06-10', [approvedLeave])).toBe(true);
    expect(isDateCoveredByLeave('2026-06-12', [approvedLeave])).toBe(true);
  });

  it('does not cover dates outside the range', () => {
    expect(isDateCoveredByLeave('2026-06-09', [approvedLeave])).toBe(false);
    expect(isDateCoveredByLeave('2026-06-13', [approvedLeave])).toBe(false);
  });

  it('ignores requests that were not approved', () => {
    const pending = { ...approvedLeave, status: LEAVE_STATUS.PENDING };
    expect(isDateCoveredByLeave('2026-06-11', [pending])).toBe(false);
  });

  it('covers a one-day request filed with a single date', () => {
    const oneDay = { id: 'L2', studentId: 'HS001', date: '2026-06-04', status: LEAVE_STATUS.APPROVED };
    expect(isDateCoveredByLeave('2026-06-04', [oneDay])).toBe(true);
    expect(isDateCoveredByLeave('2026-06-05', [oneDay])).toBe(false);
  });
});

describe('resolveAttendanceStatus', () => {
  it('excuses an absence covered by an approved request', () => {
    const entry = record('2026-06-11', ATTENDANCE_STATUS.UNEXCUSED);
    expect(resolveAttendanceStatus(entry, [approvedLeave])).toBe(ATTENDANCE_STATUS.EXCUSED);
  });

  it('demotes an absence back to unexcused when no approval covers it', () => {
    const entry = record('2026-06-20', ATTENDANCE_STATUS.EXCUSED);
    expect(resolveAttendanceStatus(entry, [approvedLeave])).toBe(ATTENDANCE_STATUS.UNEXCUSED);
  });

  it('does not apply another student\'s leave', () => {
    const entry = record('2026-06-11', ATTENDANCE_STATUS.UNEXCUSED, 'HS002');
    expect(resolveAttendanceStatus(entry, [approvedLeave])).toBe(ATTENDANCE_STATUS.UNEXCUSED);
  });

  it('leaves present and late records alone', () => {
    expect(resolveAttendanceStatus(record('2026-06-11', ATTENDANCE_STATUS.PRESENT), [approvedLeave])).toBe(
      ATTENDANCE_STATUS.PRESENT
    );
    expect(resolveAttendanceStatus(record('2026-06-11', ATTENDANCE_STATUS.LATE), [approvedLeave])).toBe(
      ATTENDANCE_STATUS.LATE
    );
  });
});

describe('summariseAttendance', () => {
  const records = [
    record('2026-06-01', ATTENDANCE_STATUS.PRESENT),
    record('2026-06-02', ATTENDANCE_STATUS.PRESENT),
    record('2026-06-03', ATTENDANCE_STATUS.LATE),
    record('2026-06-11', ATTENDANCE_STATUS.UNEXCUSED),
    record('2026-06-20', ATTENDANCE_STATUS.UNEXCUSED)
  ];

  it('counts each status after applying approved leave', () => {
    const summary = summariseAttendance(records, [approvedLeave]);
    expect(summary).toMatchObject({
      total: 5,
      present: 2,
      late: 1,
      excused: 1,
      unexcused: 1
    });
  });

  it('counts a late arrival as attended', () => {
    expect(summariseAttendance(records, [approvedLeave]).rate).toBe(60);
  });

  it('returns a null rate rather than 0 when nothing has been recorded', () => {
    expect(summariseAttendance([], []).rate).toBeNull();
    expect(summariseAttendance([], []).total).toBe(0);
  });

  it('tolerates missing arguments instead of throwing', () => {
    expect(summariseAttendance(undefined).total).toBe(0);
  });
});

describe('summariseDailyAttendance', () => {
  const roster = ['HS001', 'HS002', 'HS003', 'HS004'];
  const today = [
    record('2026-06-03', ATTENDANCE_STATUS.PRESENT, 'HS001'),
    record('2026-06-03', ATTENDANCE_STATUS.LATE, 'HS002'),
    record('2026-06-03', ATTENDANCE_STATUS.UNEXCUSED, 'HS003')
  ];

  it('rates attendance over the sessions actually recorded', () => {
    const summary = summariseDailyAttendance(roster, today);
    expect(summary).toMatchObject({
      enrolled: 4,
      recorded: 3,
      notRecorded: 1,
      present: 1,
      late: 1,
      unexcused: 1
    });
    // Two of the three recorded students turned up, not two of four enrolled.
    expect(summary.rate).toBe(66.7);
  });

  it('reads an unrecorded morning as "chưa điểm danh", not as 0%', () => {
    const summary = summariseDailyAttendance(roster, []);
    expect(summary.rate).toBeNull();
    expect(summary.recorded).toBe(0);
    expect(summary.notRecorded).toBe(4);
  });

  it('agrees with the student\'s own page for a fully recorded day', () => {
    const everyone = [...today, record('2026-06-03', ATTENDANCE_STATUS.PRESENT, 'HS004')];
    expect(summariseDailyAttendance(roster, everyone).rate).toBe(
      summariseAttendance(everyone).rate
    );
  });

  it('ignores records for students outside the roster', () => {
    const summary = summariseDailyAttendance(['HS001'], today);
    expect(summary).toMatchObject({ enrolled: 1, recorded: 1, notRecorded: 0, present: 1 });
    expect(summary.rate).toBe(100);
  });

  it('counts an absence excused by approved leave as recorded but not attended', () => {
    const summary = summariseDailyAttendance(
      ['HS001'],
      [record('2026-06-11', ATTENDANCE_STATUS.UNEXCUSED)],
      [approvedLeave]
    );
    expect(summary).toMatchObject({ recorded: 1, excused: 1, unexcused: 0 });
    expect(summary.rate).toBe(0);
  });

  it('tolerates an empty roster instead of dividing by zero', () => {
    expect(summariseDailyAttendance([], today)).toMatchObject({
      enrolled: 0,
      recorded: 0,
      notRecorded: 0,
      rate: null
    });
  });
});

describe('countConsecutiveUnexcusedAbsences', () => {
  it('counts the run ending at the latest session, whatever order it is given', () => {
    const records = [
      record('2026-06-03', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-01', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-02', ATTENDANCE_STATUS.UNEXCUSED)
    ];
    expect(countConsecutiveUnexcusedAbsences(records)).toBe(3);
  });

  it('stops at the last session the student attended', () => {
    const records = [
      record('2026-05-29', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-01', ATTENDANCE_STATUS.LATE),
      record('2026-06-02', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-03', ATTENDANCE_STATUS.UNEXCUSED)
    ];
    expect(countConsecutiveUnexcusedAbsences(records)).toBe(2);
  });

  it('breaks the run on a day an approved leave request covers', () => {
    // 10–12/6 is approved leave, so the absence on 11/6 is nghỉ có phép and the
    // run of unexcused absences restarts after it.
    const records = [
      record('2026-06-09', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-11', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-15', ATTENDANCE_STATUS.UNEXCUSED)
    ];
    expect(countConsecutiveUnexcusedAbsences(records, [approvedLeave])).toBe(1);
    expect(countConsecutiveUnexcusedAbsences(records, [])).toBe(3);
  });

  it('does not break the run on a day with no record at all', () => {
    // 04/6 and 05/6 were never recorded — a weekend, a holiday, or a register
    // nobody opened. A gap is not evidence the child came to school.
    const records = [
      record('2026-06-03', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-06', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-09', ATTENDANCE_STATUS.UNEXCUSED)
    ];
    expect(countConsecutiveUnexcusedAbsences(records)).toBe(3);
  });

  it('returns zero when the latest session was attended', () => {
    const records = [
      record('2026-06-01', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-02', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-03', ATTENDANCE_STATUS.PRESENT)
    ];
    expect(countConsecutiveUnexcusedAbsences(records)).toBe(0);
  });

  it('ignores another student\'s leave when excusing an absence', () => {
    const records = [record('2026-06-11', ATTENDANCE_STATUS.UNEXCUSED, 'HS002')];
    expect(countConsecutiveUnexcusedAbsences(records, [approvedLeave])).toBe(1);
  });

  it('returns zero for a student with no records', () => {
    expect(countConsecutiveUnexcusedAbsences([])).toBe(0);
    expect(countConsecutiveUnexcusedAbsences(undefined)).toBe(0);
  });

  it('leaves the caller\'s array in its original order', () => {
    const records = [
      record('2026-06-01', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-03', ATTENDANCE_STATUS.UNEXCUSED)
    ];
    countConsecutiveUnexcusedAbsences(records);
    expect(records[0].date).toBe('2026-06-01');
  });
});

describe('hasUnexcusedAbsenceStreak', () => {
  const threeInARow = [
    record('2026-06-01', ATTENDANCE_STATUS.UNEXCUSED),
    record('2026-06-02', ATTENDANCE_STATUS.UNEXCUSED),
    record('2026-06-03', ATTENDANCE_STATUS.UNEXCUSED)
  ];

  it('warns once three sessions in a row are unexcused', () => {
    expect(hasUnexcusedAbsenceStreak(threeInARow)).toBe(true);
    expect(hasUnexcusedAbsenceStreak(threeInARow.slice(0, 2))).toBe(false);
  });

  it('stays quiet when the absences were covered by approved leave', () => {
    const covered = [
      record('2026-06-10', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-11', ATTENDANCE_STATUS.UNEXCUSED),
      record('2026-06-12', ATTENDANCE_STATUS.UNEXCUSED)
    ];
    expect(hasUnexcusedAbsenceStreak(covered, [approvedLeave])).toBe(false);
  });

  it('accepts a different threshold if the school sets one', () => {
    expect(hasUnexcusedAbsenceStreak(threeInARow, [], { threshold: 4 })).toBe(false);
    expect(hasUnexcusedAbsenceStreak(threeInARow.slice(0, 2), [], { threshold: 2 })).toBe(true);
  });
});
