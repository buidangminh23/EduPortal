import { describe, it, expect } from 'vitest';
import {
  LEARNING_BAND,
  TITLE,
  classifyLearning,
  classifyTitle,
  computeSemesterAverage,
  computeYearAverage,
  explainSemesterAverage,
  requiredRegularAssessments,
  roundGrade,
  validateScore
} from './grading';

/** Builds a subject list where `count` subjects sit at `high` and the rest at `low`. */
const subjects = (count, high, rest, low) => [
  ...Array.from({ length: count }, () => high),
  ...Array.from({ length: rest }, () => low)
];

describe('roundGrade', () => {
  it('rounds to one decimal place', () => {
    expect(roundGrade(8.333333)).toBe(8.3);
    expect(roundGrade(7.666666)).toBe(7.7);
  });

  it('rounds a midpoint up rather than letting float error swallow it', () => {
    expect(roundGrade(8.25)).toBe(8.3);
    expect(roundGrade(1.05)).toBe(1.1);
  });

  it('returns null for non-numeric input', () => {
    expect(roundGrade(Number.NaN)).toBeNull();
    expect(roundGrade(Infinity)).toBeNull();
  });
});

describe('validateScore', () => {
  it('accepts marks within 0–10 with at most one decimal', () => {
    expect(validateScore(8.5)).toEqual({ valid: true, error: null, value: 8.5 });
    expect(validateScore(0)).toEqual({ valid: true, error: null, value: 0 });
    expect(validateScore(10)).toEqual({ valid: true, error: null, value: 10 });
  });

  it('accepts a comma decimal separator, as Vietnamese keyboards produce', () => {
    expect(validateScore('8,5').value).toBe(8.5);
  });

  it('treats a blank field as "not entered yet", not as zero', () => {
    expect(validateScore('')).toEqual({ valid: true, error: null, value: null });
    expect(validateScore(null).value).toBeNull();
  });

  it('rejects marks outside 0–10', () => {
    expect(validateScore(10.5).valid).toBe(false);
    expect(validateScore(-1).valid).toBe(false);
    expect(validateScore(11).error).toMatch(/0–10/);
  });

  it('rejects more than one decimal place', () => {
    expect(validateScore(8.25).valid).toBe(false);
    expect(validateScore(8.25).error).toMatch(/1 chữ số thập phân/);
  });

  it('rejects text', () => {
    expect(validateScore('giỏi').valid).toBe(false);
  });
});

describe('requiredRegularAssessments (Điều 6 khoản 1)', () => {
  it('requires 2 assessments for subjects of at most 35 lessons a year', () => {
    expect(requiredRegularAssessments(35)).toBe(2);
    expect(requiredRegularAssessments(18)).toBe(2);
  });

  it('requires 3 assessments above 35 and up to 70 lessons', () => {
    expect(requiredRegularAssessments(36)).toBe(3);
    expect(requiredRegularAssessments(70)).toBe(3);
  });

  it('requires 4 assessments above 70 lessons', () => {
    expect(requiredRegularAssessments(71)).toBe(4);
    expect(requiredRegularAssessments(140)).toBe(4);
  });
});

describe('computeSemesterAverage (Điều 9 khoản 1)', () => {
  it('weights mid-term by 2 and final by 3', () => {
    // (8+9+7+8 + 2×8 + 3×9) / (4+5) = 75/9 = 8.33 → 8.3
    expect(computeSemesterAverage({ regular: [8, 9, 7, 8], midterm: 8, final: 9 })).toBe(8.3);
  });

  it('divides by the number of regular marks plus 5, not by the mark count', () => {
    // 2 regular marks: (9+9 + 2×9 + 3×9) / (2+5) = 63/7 = 9.0
    expect(computeSemesterAverage({ regular: [9, 9], midterm: 9, final: 9 })).toBe(9);
  });

  it('gives the final assessment three times the pull of one regular mark', () => {
    const highFinal = computeSemesterAverage({ regular: [5, 5, 5, 5], midterm: 5, final: 10 });
    const highRegular = computeSemesterAverage({ regular: [10, 5, 5, 5], midterm: 5, final: 5 });
    expect(highFinal).toBeGreaterThan(highRegular);
  });

  it('returns null while the semester is incomplete', () => {
    expect(computeSemesterAverage({ regular: [8, 9], midterm: 8 })).toBeNull();
    expect(computeSemesterAverage({ regular: [8, 9], final: 8 })).toBeNull();
    expect(computeSemesterAverage({ regular: [], midterm: 8, final: 8 })).toBeNull();
    expect(computeSemesterAverage({})).toBeNull();
  });

  it('ignores blank slots among the regular marks', () => {
    expect(computeSemesterAverage({ regular: [8, '', null, 9], midterm: 8, final: 9 })).toBe(
      computeSemesterAverage({ regular: [8, 9], midterm: 8, final: 9 })
    );
  });

  it('handles a straight-zero semester without returning null', () => {
    expect(computeSemesterAverage({ regular: [0, 0], midterm: 0, final: 0 })).toBe(0);
  });
});

describe('computeYearAverage (Điều 9 khoản 1)', () => {
  it('counts semester 2 twice', () => {
    // (7 + 2×8) / 3 = 7.67 → 7.7
    expect(computeYearAverage(7, 8)).toBe(7.7);
  });

  it('returns the same value when both semesters match', () => {
    expect(computeYearAverage(8.5, 8.5)).toBe(8.5);
  });

  it('returns null when either semester is missing', () => {
    expect(computeYearAverage(null, 8)).toBeNull();
    expect(computeYearAverage(8, null)).toBeNull();
  });
});

describe('classifyLearning (Điều 9 khoản 2)', () => {
  it('awards Tốt when nothing is below 6.5 and at least 6 subjects reach 8.0', () => {
    expect(classifyLearning(subjects(6, 8.0, 2, 6.5))).toBe(LEARNING_BAND.GOOD);
  });

  it('withholds Tốt when only 5 subjects reach 8.0', () => {
    expect(classifyLearning(subjects(5, 8.0, 3, 6.5))).not.toBe(LEARNING_BAND.GOOD);
  });

  it('withholds Tốt when a single subject dips below 6.5', () => {
    expect(classifyLearning([...subjects(6, 9.0, 1, 6.4)])).not.toBe(LEARNING_BAND.GOOD);
  });

  it('awards Khá when nothing is below 5.0 and at least 6 subjects reach 6.5', () => {
    expect(classifyLearning(subjects(6, 7.0, 2, 5.0))).toBe(LEARNING_BAND.FAIR);
  });

  it('awards Đạt when at least 6 subjects reach 5.0 and nothing falls below 3.5', () => {
    expect(classifyLearning([...subjects(6, 5.5, 1, 3.5)])).toBe(LEARNING_BAND.PASS);
  });

  it('fails the student when any subject drops below 3.5', () => {
    expect(classifyLearning([...subjects(7, 9.0, 1, 3.4)])).toBe(LEARNING_BAND.FAIL);
  });

  it('fails the student when fewer than 6 subjects reach 5.0', () => {
    expect(classifyLearning(subjects(5, 9.0, 3, 4.0))).toBe(LEARNING_BAND.FAIL);
  });

  it('lets a comment-assessed failure block Tốt and Khá but not Đạt', () => {
    const marks = subjects(8, 9.0, 0, 0);
    expect(classifyLearning(marks, { commentOnlyFailures: 1 })).toBe(LEARNING_BAND.PASS);
    expect(classifyLearning(marks, { commentOnlyFailures: 2 })).toBe(LEARNING_BAND.FAIL);
  });

  it('returns null when no subject has been graded', () => {
    expect(classifyLearning([])).toBeNull();
  });
});

describe('classifyTitle (Điều 15)', () => {
  const goodBands = { learningBand: LEARNING_BAND.GOOD, conductBand: LEARNING_BAND.GOOD };

  it('awards Xuất sắc when at least 6 subjects reach 9.0', () => {
    expect(classifyTitle({ ...goodBands, yearAverages: subjects(6, 9.0, 2, 7.0) })).toBe(
      TITLE.EXCELLENT
    );
  });

  it('awards Giỏi when both bands are Tốt but fewer than 6 subjects reach 9.0', () => {
    expect(classifyTitle({ ...goodBands, yearAverages: subjects(5, 9.0, 3, 7.0) })).toBe(TITLE.GOOD);
  });

  it('awards nothing when conduct is not Tốt', () => {
    expect(
      classifyTitle({
        learningBand: LEARNING_BAND.GOOD,
        conductBand: LEARNING_BAND.FAIR,
        yearAverages: subjects(8, 9.5, 0, 0)
      })
    ).toBeNull();
  });

  it('awards nothing when learning is not Tốt', () => {
    expect(
      classifyTitle({
        learningBand: LEARNING_BAND.FAIR,
        conductBand: LEARNING_BAND.GOOD,
        yearAverages: subjects(8, 9.5, 0, 0)
      })
    ).toBeNull();
  });
});

describe('explainSemesterAverage', () => {
  it('shows the arithmetic behind the average', () => {
    const explained = explainSemesterAverage({ regular: [8, 9], midterm: 8, final: 9 });
    expect(explained.average).toBe(computeSemesterAverage({ regular: [8, 9], midterm: 8, final: 9 }));
    expect(explained.divisor).toBe(7);
    expect(explained.formula).toBe('(8 + 9 + 2×8 + 3×9) / 7');
    expect(explained.basis).toMatch(/22\/2021/);
  });

  it('returns null when there is no lawful average to explain', () => {
    expect(explainSemesterAverage({ regular: [8], midterm: 8 })).toBeNull();
  });
});
