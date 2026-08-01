import { describe, it, expect } from 'vitest';
import {
  ATTENDANCE_STATUS,
  LEAVE_STATUS,
  canTransitionLeave,
  isDateCoveredByLeave,
  isValidIsoDate,
  resolveAttendanceStatus,
  summariseAttendance,
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
