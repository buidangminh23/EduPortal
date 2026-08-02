import { describe, it, expect } from 'vitest';
import { resolveTeacherAuthor, canFileContent } from './authorIdentity';
import { DEMO_SCHOOL_ID } from './demoSession';

const SEEDED_TEACHER = 'e1000000-0000-0000-0000-000000000001';

describe('resolveTeacherAuthor', () => {
  it('uses the signed-in profile', () => {
    const author = resolveTeacherAuthor({
      profile: { id: 'real-uuid', school_id: 'school-uuid', subject: 'Vật lí' }
    });
    expect(author).toEqual({
      teacherId: 'real-uuid',
      schoolId: 'school-uuid',
      subject: 'Vật lí',
      isDemo: false
    });
  });

  it('reports a missing subject rather than assuming Toán học', () => {
    // `profiles` has no subject column — it lives on teaching_assignments — so
    // this is the ordinary case against a real database, not an edge case.
    const author = resolveTeacherAuthor({
      profile: { id: 'real-uuid', school_id: 'school-uuid' }
    });
    expect(author.subject).toBeNull();
    expect(canFileContent(author)).toBe(false);
  });

  it('reports a missing school rather than borrowing the demo school', () => {
    const author = resolveTeacherAuthor({ profile: { id: 'real-uuid', subject: 'Hoá học' } });
    expect(author.schoolId).toBeNull();
    expect(canFileContent(author)).toBe(false);
  });

  it('never falls back to a demo persona while a real profile is present', () => {
    const author = resolveTeacherAuthor({
      profile: { id: 'real-uuid', school_id: 'school-uuid' },
      session: { isDemo: true, role: 'teacher_subject' }
    });
    expect(author.teacherId).toBe('real-uuid');
    expect(author.teacherId).not.toBe(SEEDED_TEACHER);
    expect(author.isDemo).toBe(false);
  });

  it('resolves a demo teacher to the seeded row they stand for', () => {
    const author = resolveTeacherAuthor({ session: { isDemo: true, role: 'teacher_subject' } });
    expect(author).toEqual({
      teacherId: SEEDED_TEACHER,
      schoolId: DEMO_SCHOOL_ID,
      subject: 'Toán học',
      isDemo: true
    });
    expect(canFileContent(author)).toBe(true);
  });

  it('gives each demo teacher their own subject', () => {
    // The old code hardcoded Toán học, so the Ngữ văn teacher's material was
    // filed under maths.
    const vanTeacher = resolveTeacherAuthor({ session: { isDemo: true, role: 'teacher_homeroom' } });
    expect(vanTeacher.subject).toBe('Ngữ văn');
    expect(vanTeacher.teacherId).not.toBe(SEEDED_TEACHER);
  });

  it('will not let a demo student or parent author teaching content', () => {
    for (const role of ['student', 'parent']) {
      const author = resolveTeacherAuthor({ session: { isDemo: true, role } });
      // They resolve to their own row, but with no subject they cannot file.
      expect(author.subject).toBeNull();
      expect(canFileContent(author)).toBe(false);
    }
  });

  it('returns null when there is neither a profile nor a demo session', () => {
    expect(resolveTeacherAuthor({})).toBeNull();
    expect(resolveTeacherAuthor()).toBeNull();
    expect(resolveTeacherAuthor({ profile: null, session: null })).toBeNull();
  });

  it('returns null for a session that only claims to be a demo', () => {
    // A session without isDemo is a real session shape; it must not be able to
    // borrow a seeded teacher's identity by naming a role.
    expect(resolveTeacherAuthor({ session: { role: 'teacher_subject' } })).toBeNull();
    expect(resolveTeacherAuthor({ session: { isDemo: true, role: 'khong-ton-tai' } })).toBeNull();
  });
});

describe('canFileContent', () => {
  it('requires an author, a school and a subject', () => {
    expect(canFileContent(null)).toBe(false);
    expect(canFileContent({ teacherId: 'a', schoolId: 'b', subject: 'Toán học' })).toBe(true);
    expect(canFileContent({ teacherId: 'a', schoolId: 'b', subject: null })).toBe(false);
    expect(canFileContent({ teacherId: 'a', schoolId: null, subject: 'Toán học' })).toBe(false);
    expect(canFileContent({ teacherId: null, schoolId: 'b', subject: 'Toán học' })).toBe(false);
  });
});
