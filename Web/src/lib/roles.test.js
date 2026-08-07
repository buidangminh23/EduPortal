import { describe, it, expect } from 'vitest';
import { isTeacher, isSubjectTeacher, isHomeroomTeacher, isStaff, SESSION_ROLES } from './roles';
import { DEMO_PERSONAS } from './demoSession';

/**
 * The regression these lock down: every screen used to ask
 * `currentRole === 'teacher'`, which no sign-in ever produces, so the two real
 * teacher roles failed the check and lost their own controls.
 */

describe('isTeacher', () => {
  it('accepts both teacher roles a session can carry', () => {
    expect(isTeacher('teacher_subject')).toBe(true);
    expect(isTeacher('teacher_homeroom')).toBe(true);
  });

  it('accepts the legacy plain role so an older stored session keeps its rights', () => {
    expect(isTeacher('teacher')).toBe(true);
  });

  it('rejects the roles that are not teaching staff', () => {
    expect(isTeacher('student')).toBe(false);
    expect(isTeacher('parent')).toBe(false);
    expect(isTeacher('admin')).toBe(false);
    expect(isTeacher(undefined)).toBe(false);
    expect(isTeacher(null)).toBe(false);
    expect(isTeacher('')).toBe(false);
  });
});

describe('isSubjectTeacher / isHomeroomTeacher', () => {
  it('separates the two teaching roles', () => {
    expect(isSubjectTeacher('teacher_subject')).toBe(true);
    expect(isSubjectTeacher('teacher_homeroom')).toBe(false);
    expect(isHomeroomTeacher('teacher_homeroom')).toBe(true);
    expect(isHomeroomTeacher('teacher_subject')).toBe(false);
  });
});

describe('isStaff', () => {
  it('covers teachers and the principal office, nobody else', () => {
    expect(isStaff('admin')).toBe(true);
    expect(isStaff('teacher_subject')).toBe(true);
    expect(isStaff('teacher_homeroom')).toBe(true);
    expect(isStaff('student')).toBe(false);
    expect(isStaff('parent')).toBe(false);
  });
});

describe('SESSION_ROLES', () => {
  it('matches the personas sign-in can actually hand out', () => {
    expect([...SESSION_ROLES].sort()).toEqual(Object.keys(DEMO_PERSONAS).sort());
  });

  it('does not contain the plain teacher role any screen used to test for', () => {
    expect(SESSION_ROLES).not.toContain('teacher');
  });
});
