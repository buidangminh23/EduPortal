import { DEMO_PERSONAS, DEMO_SCHOOL_ID } from './demoSession';

/**
 * Works out who a write should be attributed to, or says it cannot.
 *
 * The tutor trainer used to answer this with `profile?.id || 'e1000000-…'` —
 * a specific seeded teacher's UUID. In the demo that happened to be right. In
 * a real deployment it meant that any moment the profile was absent — still
 * loading, failed to load, signed out mid-edit — a teacher's knowledge base
 * was filed under a stranger, or under a row that does not exist in that
 * school's database at all. The subject had the same shape: `profile?.subject`
 * reads a column `profiles` does not have, so every teacher in the country was
 * silently recorded as teaching Toán học.
 *
 * Returning null is the important case. "I don't know who you are" is an
 * answer, and the caller must be able to act on it instead of being handed a
 * plausible name.
 *
 * @returns {{teacherId: string, schoolId: string|null, subject: string|null, isDemo: boolean}|null}
 */
export function resolveTeacherAuthor({ profile, session } = {}) {
  // A real profile always wins. Nothing is filled in from elsewhere: a missing
  // school or subject is reported as missing, because guessing either is how
  // records end up under the wrong school.
  if (profile?.id) {
    return {
      teacherId: profile.id,
      schoolId: profile.school_id ?? null,
      subject: profile.subject ?? null,
      isDemo: false
    };
  }

  // The demo has no auth session by design, so identity comes from the persona
  // that was picked. Only personas that stand for a real seeded row qualify.
  if (session?.isDemo) {
    const persona = DEMO_PERSONAS[session.role];
    if (persona?.profileId) {
      return {
        teacherId: persona.profileId,
        schoolId: DEMO_SCHOOL_ID,
        subject: persona.subject ?? null,
        isDemo: true
      };
    }
  }

  return null;
}

/**
 * Whether an author is complete enough to file subject-specific content.
 *
 * Saving a knowledge entry needs a school to file it under and a subject to
 * file it as. An author missing either can still be shown their own settings,
 * but must not write, because the write would land somewhere arbitrary.
 */
export function canFileContent(author) {
  return Boolean(author?.teacherId && author?.schoolId && author?.subject);
}
