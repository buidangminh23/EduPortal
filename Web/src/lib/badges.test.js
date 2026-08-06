import { describe, it, expect } from 'vitest';
import { BADGE_DEFS, SESSIONS_PER_TERM } from './badges';

/** 17 weeks of daily check-ins — the term the floor is derived from. */
const SESSIONS_IN_A_TERM = SESSIONS_PER_TERM;

const STUDENT_ID = 'HS999';

const badge = (id) => BADGE_DEFS.find((b) => b.id === id);

const studentWith = (overrides = {}) => ({
  id: STUDENT_ID,
  grades: {},
  gradesSem1: {},
  feeStatus: [],
  ...overrides
});

const sessions = (count, status = 'present') =>
  Array.from({ length: count }, (_, i) => ({
    id: `AT${i}`,
    studentId: STUDENT_ID,
    status,
    date: `2026-01-${i}`
  }));

const earnedIds = (student, logs = [], applications = []) =>
  BADGE_DEFS.filter((b) => b.check(student, logs, applications)).map((b) => b.id);

/** The smallest run of clean check-ins that earns the badge, or null. */
const smallestQualifyingRun = (id) => {
  const rule = badge(id);
  for (let n = 1; n <= SESSIONS_IN_A_TERM; n += 1) {
    if (rule.check(studentWith(), sessions(n))) return n;
  }
  return null;
};

describe('a family\'s finances stay off the achievements page', () => {
  it('awards the same badges whether or not the fees are paid', () => {
    const fees = (paid) => [{ id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid }];
    const logs = sessions(SESSIONS_IN_A_TERM);

    expect(earnedIds(studentWith({ feeStatus: fees(false) }), logs))
      .toEqual(earnedIds(studentWith({ feeStatus: fees(true) }), logs));
  });

  it('never reads feeStatus at all, under any badge name', () => {
    const paidUp = studentWith({ feeStatus: [{ id: 'F01', paid: true, amount: 1 }] });
    // A student object with no feeStatus key must not change any verdict.
    const { feeStatus, ...noFeeRecord } = paidUp;
    expect(feeStatus).toBeDefined();
    expect(earnedIds(noFeeRecord, sessions(10))).toEqual(earnedIds(paidUp, sessions(10)));
  });

  it('does not describe any badge in terms of money owed', () => {
    BADGE_DEFS.forEach((b) => {
      expect(`${b.label} ${b.desc}`, b.id).not.toMatch(/học phí|đóng tiền|nợ|thanh toán/i);
    });
  });
});

describe('subject excellence covers every scored subject', () => {
  const rule = badge('top_subject');

  it('treats Hoá học and Sinh học exactly like Toán and Vật lí', () => {
    ['Math', 'Physics', 'Chemistry', 'Biology'].forEach((key) => {
      expect(rule.check(studentWith({ grades: { [key]: 9.2 } })), key).toBe(true);
    });
  });

  it('holds every subject to the same mark, Ngữ văn included', () => {
    expect(rule.check(studentWith({ grades: { Literature: 8.5 } }))).toBe(false);
    expect(rule.check(studentWith({ grades: { Literature: 9.0 } }))).toBe(true);
  });

  it('ignores comment-assessed subjects, which carry no mark to compare', () => {
    expect(rule.check(studentWith({ grades: { PhysicalEducation: 10 } }))).toBe(false);
  });

  it('names the marks behind the badge, and the best one when short', () => {
    expect(rule.note(studentWith({ grades: { Chemistry: 9.4 } }))).toContain('Hoá học 9.4');
    expect(rule.note(studentWith({ grades: { Math: 8.5, Biology: 7.0 } }))).toContain('Toán 8.5');
  });
});

describe('attendance badges need a meaningful portion of the term', () => {
  it('does not call three recorded days chuyên cần', () => {
    expect(badge('full_attend').check(studentWith(), sessions(3))).toBe(false);
    expect(badge('on_time').check(studentWith(), sessions(3))).toBe(false);
  });

  it('asks for at least several weeks of record, and never more than a term', () => {
    ['full_attend', 'on_time'].forEach((id) => {
      const floor = smallestQualifyingRun(id);
      expect(floor, id).toBeGreaterThanOrEqual(20);
      expect(floor, id).toBeLessThanOrEqual(SESSIONS_IN_A_TERM);
    });
  });

  it('ranks a full clean term above a short perfect run', () => {
    expect(badge('full_attend').check(studentWith(), sessions(SESSIONS_IN_A_TERM))).toBe(true);
  });

  it('counts a late arrival as attendance, not as an absence', () => {
    const mostlyOnTime = [...sessions(SESSIONS_IN_A_TERM - 1), ...sessions(1, 'late')];
    expect(badge('full_attend').check(studentWith(), mostlyOnTime)).toBe(true);
    expect(badge('on_time').check(studentWith(), mostlyOnTime)).toBe(false);
  });

  it('breaks chuyên cần on an absence, excused or not', () => {
    ['excused', 'unexcused'].forEach((status) => {
      const term = [...sessions(SESSIONS_IN_A_TERM - 1), ...sessions(1, status)];
      expect(badge('full_attend').check(studentWith(), term), status).toBe(false);
    });
  });

  it('says how far along the record is instead of leaving it locked in silence', () => {
    const note = badge('full_attend').note(studentWith(), sessions(3));
    expect(note).toMatch(/^Mới ghi nhận 3\/\d+ buổi$/);
  });

  it('says what broke the badge once enough of the term is on record', () => {
    const term = [...sessions(SESSIONS_IN_A_TERM - 2), ...sessions(2, 'unexcused')];
    expect(badge('full_attend').note(studentWith(), term)).toContain('2 buổi');
  });

  it('only counts this student\'s own check-ins', () => {
    const others = sessions(SESSIONS_IN_A_TERM).map((log) => ({ ...log, studentId: 'HS001' }));
    expect(badge('full_attend').check(studentWith(), others)).toBe(false);
  });
});
