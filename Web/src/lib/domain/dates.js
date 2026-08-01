/**
 * Calendar-date helpers shared by the attendance and fees domains.
 *
 * School records are calendar facts, not instants: "nghỉ ngày 10/6" and "hạn
 * nộp 15/6" mean the same thing regardless of the reader's clock. Everything
 * here therefore works on YYYY-MM-DD strings and never lets a timezone shift
 * the day, which is the classic source of off-by-one dates in Vietnam (UTC+7).
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Today as YYYY-MM-DD in the reader's own timezone — schools run on local time. */
export function todayIso(now = new Date()) {
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/**
 * Whether the string is a real calendar date in YYYY-MM-DD form.
 *
 * The parts are rebuilt in UTC and compared back, which rejects dates that
 * roll over (2026-02-30 → 2 March) without dragging the local timezone in.
 */
export function isValidIsoDate(value) {
  if (!ISO_DATE.test(String(value || ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * Whole days from `fromIso` to `toIso`; negative when `toIso` is earlier.
 * Returns null if either side is not a valid date.
 */
export function daysBetween(fromIso, toIso) {
  if (!isValidIsoDate(fromIso) || !isValidIsoDate(toIso)) return null;
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / MS_PER_DAY);
}
