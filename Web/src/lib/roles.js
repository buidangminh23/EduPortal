/**
 * The roles a session can actually carry, and the predicates screens should ask
 * instead of comparing strings.
 *
 * Sign-in only ever issues `student`, `teacher_subject`, `teacher_homeroom`,
 * `parent` or `admin` (see `DEMO_PERSONAS` in `lib/demoSession.js` and the role
 * list in `components/Login.jsx`). A plain `teacher` was never one of them, yet
 * screens all over the app tested `currentRole === 'teacher'` — a comparison
 * that is false for every real teacher, so their own buttons never rendered.
 *
 * `teacher` stays in the accepted set only so a session persisted by an older
 * build still reads as a teacher rather than silently losing its permissions.
 */

export const TEACHER_ROLES = Object.freeze(['teacher_subject', 'teacher_homeroom', 'teacher']);

export const SESSION_ROLES = Object.freeze(['student', 'teacher_subject', 'teacher_homeroom', 'parent', 'admin']);

export function isTeacher(role) {
  return TEACHER_ROLES.includes(role);
}

export function isSubjectTeacher(role) {
  return role === 'teacher_subject';
}

export function isHomeroomTeacher(role) {
  return role === 'teacher_homeroom';
}

/** A teacher or the principal's office — the two sides that administer a class. */
export function isStaff(role) {
  return role === 'admin' || isTeacher(role);
}
