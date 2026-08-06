/**
 * Which năm học a date falls in, and what a stored năm học may look like.
 *
 * A học bạ follows a pupil for three years, so every mark, nhận xét and kết quả
 * rèn luyện has to say which năm học it belongs to. Without that, the lớp 11
 * Toán học kỳ I mark lands on top of the lớp 10 one and two years of a pupil's
 * record disappear with no trace that they were ever there.
 *
 * A năm học is written the way schools write it — '2025-2026', the two calendar
 * years it spans joined by a hyphen. It is text: never an integer, never a date
 * range. The name is the identity, and the only thing ever done with two of
 * them is comparing them for equality.
 *
 * The one judgement in this file is where a năm học begins, because the
 * Vietnamese school year does not run January to December. A mark entered in
 * July belongs to the năm học that is ending; one entered in September to the
 * năm học beginning. The month that divides them is the constant below.
 */

import { isValidIsoDate } from './dates';

/**
 * The month a new năm học begins (1–12).
 *
 * September, because the năm học is named after the calendar year its khai
 * giảng falls in, and Bộ GD&ĐT's khung kế hoạch thời gian năm học puts khai
 * giảng on 5 September nationwide.
 *
 * August is deliberately not the boundary. Thông tư 22/2021/TT-BGDĐT Điều 13
 * khoản 3 places rèn luyện trong kì nghỉ hè, and the kiểm tra đánh giá lại that
 * closes it, "trong khoảng thời gian trước khai giảng năm học mới" — so a mark
 * entered in August is a retake settling the năm học that just ended, not the
 * first mark of the next one. Filing it forward would move a struggling pupil's
 * second chance into the wrong year of their học bạ and leave the year it was
 * meant to repair still showing Chưa đạt.
 *
 * This is the only figure in the module that knows about the calendar: a school
 * running a different one edits this line and nothing else.
 *
 * VERIFY BEFORE PRODUCTION USE: September is the national norm, not a decision
 * this school has made, and this boundary is a whole month while khai giảng is
 * a single day — a record dated 1–4 September is filed under the năm học
 * beginning although the lễ khai giảng has not happened yet. Confirm both
 * against the school's own kế hoạch thời gian năm học before any học bạ is
 * issued from this system.
 */
export const SCHOOL_YEAR_START_MONTH = 9;

/**
 * '2025-2026' exactly: four digits, an ASCII hyphen, four digits.
 *
 * Anchored and without tolerance for surrounding space, because this pattern
 * guards what goes into the database rather than what a human typed.
 */
const SCHOOL_YEAR = /^(\d{4})-(\d{4})$/;

/**
 * The calendar year and month a value names, or null if it names none.
 *
 * A Date is read through its local fields, for the reason `dates.js` gives: a
 * school's calendar is its own local one. A YYYY-MM-DD string is split instead
 * of being handed to `new Date`, which would read it as UTC midnight and, in
 * any timezone west of Greenwich, hand back the previous day. On 1 September
 * that previous day is in August, so the whole năm học would shift by one.
 */
function calendarPartsOf(date) {
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return null;
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  }

  if (typeof date === 'string' && isValidIsoDate(date)) {
    const [year, month] = date.split('-').map(Number);
    return { year, month };
  }

  return null;
}

/**
 * The năm học a date falls in, as '2025-2026'.
 *
 * Takes a Date or a YYYY-MM-DD string. Anything else — a timestamp with a time
 * in it, a number, a date that does not exist — returns null rather than a
 * guess. The result is about to be written into a NOT NULL column that decides
 * which school year a mark belongs to, so a wrong year here is the silent
 * overwrite this module exists to prevent; refusing lets the write fail loudly
 * instead.
 */
export function schoolYearOf(date) {
  const parts = calendarPartsOf(date);
  if (parts === null) return null;

  const startYear = parts.month >= SCHOOL_YEAR_START_MONTH ? parts.year : parts.year - 1;
  return `${startYear}-${startYear + 1}`;
}

/**
 * The năm học a record written now belongs to.
 *
 * The default argument is the machine's clock, which is right for a real
 * school. On the bundled demo dataset "today" is a fixed day rather than the
 * clock's (see `config/demoClock`), so a caller stamping demo records must pass
 * `currentSchoolDay()` in — otherwise the seed and anything entered on top of
 * it end up in different năm học.
 */
export function currentSchoolYear(date = new Date()) {
  return schoolYearOf(date);
}

/**
 * Whether a value is a năm học this app could have written.
 *
 * Shape alone would not settle it. '2025-2027' spans two years and '2026-2025'
 * runs backwards, yet both satisfy a pattern that merely counts digits; a năm
 * học is one year long, so the second year must be the first plus one.
 *
 * Display spellings are not storage. The UI writes "năm học 2025 - 2026" with
 * spaces and "2025–2026" with an en dash, and neither is accepted here. One of
 * those reaching the database would sit alongside '2025-2026' in the uniqueness
 * constraint without colliding with it, and the same pupil would end up with
 * two Toán rows for one học kỳ — which is the defect in a new disguise.
 *
 * Nothing recorded is not valid either, unlike a nhận xét result: school_year
 * is NOT NULL wherever it appears, so a missing năm học is a bug in the caller
 * rather than a blank the pupil has yet to earn.
 */
export function isValidSchoolYear(value) {
  if (typeof value !== 'string') return false;

  const match = SCHOOL_YEAR.exec(value);
  if (match === null) return false;

  return Number(match[2]) === Number(match[1]) + 1;
}
