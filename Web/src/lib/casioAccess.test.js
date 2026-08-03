import { describe, it, expect } from 'vitest';
import { canUseCasio } from './casioAccess';
import { DEMO_ROLES } from './demoSession';

describe('canUseCasio', () => {
  it('opens for students', () => {
    expect(canUseCasio('student')).toBe(true);
  });

  it('opens for every teacher variant', () => {
    expect(canUseCasio('teacher')).toBe(true);
    expect(canUseCasio('teacher_subject')).toBe(true);
    expect(canUseCasio('teacher_homeroom')).toBe(true);
  });

  it('stays shut for ban giám hiệu and phụ huynh', () => {
    expect(canUseCasio('admin')).toBe(false);
    expect(canUseCasio('parent')).toBe(false);
  });

  it('stays shut when there is no role yet', () => {
    // `currentRole` is '' before a session exists, and undefined if the context
    // is read outside a provider — neither may open the calculator.
    expect(canUseCasio('')).toBe(false);
    expect(canUseCasio(undefined)).toBe(false);
    expect(canUseCasio(null)).toBe(false);
  });

  it('covers every role the app can actually be viewed as', () => {
    // Guards against a new persona silently landing outside both answers.
    const allowed = DEMO_ROLES.filter(canUseCasio);
    expect(allowed).toEqual(['student', 'teacher_subject', 'teacher_homeroom']);
  });
});
