/**
 * What "hôm nay" means to the app.
 *
 * The bundled dataset is a snapshot of one school day, so on demo data every
 * screen has to agree on that day — otherwise the timetable, the canteen menu
 * and the attendance register each show a different "today" and the product
 * looks broken. Once real data is wired up, this returns the actual date and
 * nothing else has to change.
 *
 * Previously this date was a literal repeated across a dozen files, which meant
 * newly recorded attendance was silently stamped with a date in the past.
 */

import { todayIso } from '../lib/domain/dates';

/** The school day the bundled demo dataset describes. */
export const DEMO_TODAY = '2026-06-03';

/**
 * True while the app is running on the bundled demo dataset.
 *
 * Supplying a Supabase project is what switches it off, since that is the point
 * at which records start coming from a real school rather than from the seed.
 */
export const isDemoData = !import.meta.env?.VITE_SUPABASE_URL;

/** The date every screen should treat as today. */
export function currentSchoolDay() {
  return isDemoData ? DEMO_TODAY : todayIso();
}
