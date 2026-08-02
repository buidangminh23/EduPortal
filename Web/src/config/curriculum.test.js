import { describe, it, expect } from 'vitest';
import {
  ASSESSMENT,
  COMMENT_SUBJECTS,
  SCORED_SUBJECTS,
  SUBJECTS,
  TRACK,
  findSubject,
  isScored,
  regularSlotsFor,
  subjectName
} from './curriculum';

/** Keys that already exist in saved gradebooks and must never be renamed. */
const LEGACY_KEYS = ['Math', 'Literature', 'Physics', 'English'];

describe('subject table', () => {
  it('gives every subject the fields the gradebook depends on', () => {
    SUBJECTS.forEach((subject) => {
      expect(subject.key, `${subject.name} key`).toMatch(/^[A-Za-z]+$/);
      expect(subject.name.length, `${subject.key} name`).toBeGreaterThan(0);
      expect(Number.isInteger(subject.lessonsPerYear), `${subject.key} hours`).toBe(true);
      expect(Object.values(ASSESSMENT)).toContain(subject.assessment);
      expect(Object.values(TRACK)).toContain(subject.track);
    });
  });

  it('keeps keys unique, since they index stored marks', () => {
    const keys = SUBJECTS.map((subject) => subject.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('still contains every key already present in saved gradebooks', () => {
    LEGACY_KEYS.forEach((key) => {
      expect(findSubject(key), key).not.toBeNull();
    });
  });

  it('splits into scored and comment-assessed with nothing left over', () => {
    expect(SCORED_SUBJECTS.length + COMMENT_SUBJECTS.length).toBe(SUBJECTS.length);
  });

  it('offers enough scored subjects for a lawful classification', () => {
    // Điều 9 khoản 2 needs at least six scored subjects before any band applies.
    expect(SCORED_SUBJECTS.length).toBeGreaterThanOrEqual(6);
  });
});

describe('regularSlotsFor (Điều 6 khoản 1)', () => {
  it('does not resize the four subjects that already hold marks', () => {
    // Changing a slot count reshapes every stored record for that subject,
    // so the expansion must leave the original four exactly as they were.
    expect(regularSlotsFor('Math')).toBe(4);
    expect(regularSlotsFor('Literature')).toBe(4);
    expect(regularSlotsFor('English')).toBe(4);
    expect(regularSlotsFor('Physics')).toBe(3);
  });

  it('derives the count from the subject\'s hours', () => {
    expect(regularSlotsFor('DefenceEducation')).toBe(2); // 35 tiết
    expect(regularSlotsFor('History')).toBe(3); // 52 tiết
    expect(regularSlotsFor('Chemistry')).toBe(3); // 70 tiết
  });

  it('falls back for a subject the table does not list', () => {
    expect(regularSlotsFor('Astronomy')).toBe(3);
  });
});

describe('isScored (Điều 5)', () => {
  it('marks Giáo dục thể chất and Nghệ thuật as comment-assessed', () => {
    expect(isScored('PhysicalEducation')).toBe(false);
    expect(isScored('Music')).toBe(false);
    expect(isScored('FineArts')).toBe(false);
  });

  it('marks trải nghiệm and nội dung địa phương as comment-assessed', () => {
    expect(isScored('ExperientialActivities')).toBe(false);
    expect(isScored('LocalContent')).toBe(false);
  });

  it('keeps the academic subjects on marks', () => {
    expect(isScored('Math')).toBe(true);
    expect(isScored('History')).toBe(true);
    expect(isScored('DefenceEducation')).toBe(true);
  });

  it('assumes an unlisted subject is scored, which is the common case', () => {
    expect(isScored('Astronomy')).toBe(true);
  });
});

describe('subjectName', () => {
  it('returns the Vietnamese name', () => {
    expect(subjectName('Math')).toBe('Toán');
    expect(subjectName('Chemistry')).toBe('Hoá học');
  });

  it('falls back to the key rather than rendering undefined', () => {
    expect(subjectName('Astronomy')).toBe('Astronomy');
  });
});
