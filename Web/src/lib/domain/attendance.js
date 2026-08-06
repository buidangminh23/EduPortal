/**
 * Attendance records and the leave-request workflow.
 *
 * Two rules drive everything here:
 *   1. An absence is only "có phép" when a leave request covering that date was
 *      approved. Nobody can excuse an absence by editing it directly.
 *   2. Attendance is a record of what happened, so it cannot be filed for a
 *      date that has not happened yet.
 */

import { isValidIsoDate, todayIso } from './dates';

export { isValidIsoDate, todayIso };

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  EXCUSED: 'excused',
  UNEXCUSED: 'unexcused'
};

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

export const ATTENDANCE_LABEL = {
  [ATTENDANCE_STATUS.PRESENT]: 'Có mặt',
  [ATTENDANCE_STATUS.LATE]: 'Đi muộn',
  [ATTENDANCE_STATUS.EXCUSED]: 'Nghỉ có phép',
  [ATTENDANCE_STATUS.UNEXCUSED]: 'Nghỉ không phép'
};

export const LEAVE_LABEL = {
  [LEAVE_STATUS.PENDING]: 'Chờ duyệt',
  [LEAVE_STATUS.APPROVED]: 'Đã duyệt',
  [LEAVE_STATUS.REJECTED]: 'Từ chối',
  [LEAVE_STATUS.CANCELLED]: 'Đã huỷ'
};

/** Statuses that still count as the student having attended. */
const ATTENDED_STATUSES = [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE];

/** Which transitions the leave workflow permits. */
const LEAVE_TRANSITIONS = {
  [LEAVE_STATUS.PENDING]: [LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED, LEAVE_STATUS.CANCELLED],
  [LEAVE_STATUS.APPROVED]: [],
  [LEAVE_STATUS.REJECTED]: [],
  [LEAVE_STATUS.CANCELLED]: []
};

/**
 * Validates an attendance entry before it is stored.
 *
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAttendanceEntry({ studentId, date, status }, { today = todayIso() } = {}) {
  const errors = [];

  if (!studentId) errors.push('Thiếu mã học sinh.');
  if (!isValidIsoDate(date)) {
    errors.push('Ngày điểm danh không hợp lệ (định dạng YYYY-MM-DD).');
  } else if (date > today) {
    errors.push('Không thể điểm danh cho ngày trong tương lai.');
  }
  if (!Object.values(ATTENDANCE_STATUS).includes(status)) {
    errors.push('Trạng thái điểm danh không hợp lệ.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a leave request.
 *
 * Back-dating is allowed — a parent often files after the child has already
 * been kept home sick — but the range itself must be coherent.
 */
export function validateLeaveRequest({ studentId, fromDate, toDate, reason }) {
  const errors = [];

  if (!studentId) errors.push('Thiếu mã học sinh.');
  if (!isValidIsoDate(fromDate)) errors.push('Ngày bắt đầu nghỉ không hợp lệ.');
  if (!isValidIsoDate(toDate)) errors.push('Ngày kết thúc nghỉ không hợp lệ.');
  if (isValidIsoDate(fromDate) && isValidIsoDate(toDate) && fromDate > toDate) {
    errors.push('Ngày kết thúc phải sau hoặc trùng ngày bắt đầu.');
  }
  if (!reason || String(reason).trim().length < 5) {
    errors.push('Lý do xin nghỉ cần ít nhất 5 ký tự.');
  }

  return { valid: errors.length === 0, errors };
}

/** Whether the leave workflow allows moving from one status to another. */
export function canTransitionLeave(from, to) {
  return (LEAVE_TRANSITIONS[from] || []).includes(to);
}

/**
 * Applies a decision to a leave request, returning a new object.
 *
 * @throws {Error} when the transition is not allowed, so a double-approval is
 *   a loud bug rather than a silent overwrite of the first decision.
 */
export function transitionLeave(request, nextStatus, { decidedBy, decidedAt } = {}) {
  if (!canTransitionLeave(request.status, nextStatus)) {
    throw new Error(
      `Không thể chuyển đơn nghỉ từ "${LEAVE_LABEL[request.status] || request.status}" sang "${
        LEAVE_LABEL[nextStatus] || nextStatus
      }".`
    );
  }

  return {
    ...request,
    status: nextStatus,
    decidedBy: decidedBy || null,
    decidedAt: decidedAt || new Date().toISOString()
  };
}

/** Whether an approved leave request covers the given date. */
export function isDateCoveredByLeave(date, leaveRequests) {
  return (leaveRequests || []).some((request) => {
    if (request.status !== LEAVE_STATUS.APPROVED) return false;
    // A one-day request is filed with a single `date`; read it as a range whose
    // ends are that day, otherwise an approved single-day leave excuses nothing.
    const fromDate = request.fromDate || request.date;
    const toDate = request.toDate || request.date;
    return Boolean(fromDate) && Boolean(toDate) && fromDate <= date && toDate >= date;
  });
}

/**
 * Resolves the status actually shown for a record.
 *
 * An absence is upgraded to "có phép" only when an approved leave request
 * covers it, which keeps the excuse tied to a decision someone signed off on.
 */
export function resolveAttendanceStatus(record, leaveRequests) {
  const isAbsence =
    record.status === ATTENDANCE_STATUS.UNEXCUSED || record.status === ATTENDANCE_STATUS.EXCUSED;
  if (!isAbsence) return record.status;

  const studentLeave = (leaveRequests || []).filter((r) => r.studentId === record.studentId);
  return isDateCoveredByLeave(record.date, studentLeave)
    ? ATTENDANCE_STATUS.EXCUSED
    : ATTENDANCE_STATUS.UNEXCUSED;
}

/**
 * Summarises a student's attendance.
 *
 * `rate` is the share of sessions the student was physically present for,
 * late included, expressed 0–100 and rounded to one decimal.
 */
export function summariseAttendance(records, leaveRequests = []) {
  const resolved = (records || []).map((record) => ({
    ...record,
    status: resolveAttendanceStatus(record, leaveRequests)
  }));

  const counts = {
    [ATTENDANCE_STATUS.PRESENT]: 0,
    [ATTENDANCE_STATUS.LATE]: 0,
    [ATTENDANCE_STATUS.EXCUSED]: 0,
    [ATTENDANCE_STATUS.UNEXCUSED]: 0
  };
  resolved.forEach((record) => {
    if (counts[record.status] !== undefined) counts[record.status] += 1;
  });

  const total = resolved.length;
  const attended = ATTENDED_STATUSES.reduce((sum, status) => sum + counts[status], 0);

  return {
    total,
    present: counts[ATTENDANCE_STATUS.PRESENT],
    late: counts[ATTENDANCE_STATUS.LATE],
    excused: counts[ATTENDANCE_STATUS.EXCUSED],
    unexcused: counts[ATTENDANCE_STATUS.UNEXCUSED],
    rate: total === 0 ? null : Math.round((attended / total) * 1000) / 10
  };
}

/**
 * Summarises one day for a whole roster: a class, a grade, the school.
 *
 * The rate is the same one a student sees on their own page — attended over
 * *recorded* sessions — so the two screens can be reconciled. Students nobody
 * has ticked off yet are reported apart as `notRecorded`: "chưa điểm danh" is a
 * different fact from "vắng", and counting the first as the second is what made
 * a morning before the register opens read as 0% chuyên cần.
 *
 * `rate` is null while nothing has been recorded, which the caller should show
 * as "chưa điểm danh" rather than as a number.
 */
export function summariseDailyAttendance(studentIds, records, leaveRequests = []) {
  const roster = new Set(studentIds || []);
  const onRoster = (records || []).filter((record) => roster.has(record.studentId));
  const summary = summariseAttendance(onRoster, leaveRequests);

  return {
    enrolled: roster.size,
    recorded: summary.total,
    notRecorded: Math.max(roster.size - summary.total, 0),
    present: summary.present,
    late: summary.late,
    excused: summary.excused,
    unexcused: summary.unexcused,
    rate: summary.rate
  };
}

/** How many unexcused absences in a row warrant telling the parent. */
export const UNEXCUSED_STREAK_ALERT = 3;

/**
 * Counts the run of unexcused absences ending at a student's latest session.
 *
 * "Liên tiếp" is counted over *recorded sessions*, newest first, not over
 * calendar days: a weekend, a holiday or a day the register was never opened
 * leaves no record, and such a gap neither counts as an absence nor breaks the
 * run. The run stops at the first session the student attended or that an
 * approved leave request excuses — the same call `resolveAttendanceStatus`
 * makes, so the warning can never disagree with the child's own attendance log.
 *
 * `records` must belong to one student.
 */
export function countConsecutiveUnexcusedAbsences(records, leaveRequests = []) {
  const sessions = (records || [])
    .filter((record) => isValidIsoDate(record.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  let run = 0;
  for (const session of sessions) {
    if (resolveAttendanceStatus(session, leaveRequests) !== ATTENDANCE_STATUS.UNEXCUSED) break;
    run += 1;
  }
  return run;
}

/** Whether a student's latest sessions form a run long enough to warn about. */
export function hasUnexcusedAbsenceStreak(
  records,
  leaveRequests = [],
  { threshold = UNEXCUSED_STREAK_ALERT } = {}
) {
  return countConsecutiveUnexcusedAbsences(records, leaveRequests) >= threshold;
}
