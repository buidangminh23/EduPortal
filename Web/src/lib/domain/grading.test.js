import { describe, it, expect } from 'vitest';
import {
  LEARNING_BAND,
  TITLE,
  classifyLearning,
  classifyTitle,
  computeSemesterAverage,
  computeYearAverage,
  explainSemesterAverage,
  applySubjectRecord,
  requiredRegularAssessments,
  roundGrade,
  toAssessmentRecord,
  validateAssessmentRecord,
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

describe('toAssessmentRecord', () => {
  it('maps the old four-column layout onto the circular\'s weights', () => {
    const record = toAssessmentRecord(
      { oral: 8, quiz15m: 7, test1Period: 9, semester: 6 },
      2
    );
    expect(record).toEqual({ regular: [8, 7], midterm: 9, final: 6 });
  });

  it('gives the same average the old fixed formula produced', () => {
    const legacy = { oral: 8, quiz15m: 7, test1Period: 9, semester: 6 };
    const oldFormula = (8 + 7 + 9 * 2 + 6 * 3) / 7;
    expect(computeSemesterAverage(toAssessmentRecord(legacy, 2))).toBe(roundGrade(oldFormula));
  });

  it('pads with blanks when the subject needs more regular marks', () => {
    const record = toAssessmentRecord({ oral: 8, quiz15m: 7, test1Period: 9, semester: 6 }, 4);
    expect(record.regular).toEqual([8, 7, null, null]);
  });

  it('keeps a bare stored average as the final mark rather than inventing marks', () => {
    const record = toAssessmentRecord(8.5, 2);
    expect(record).toEqual({ regular: [null, null], midterm: null, final: 8.5 });
  });

  it('passes an already-migrated record through unchanged', () => {
    const record = { regular: [8, 9], midterm: 7, final: 6 };
    expect(toAssessmentRecord(record, 2)).toEqual(record);
  });

  it('resizes an existing record when the subject requirement changes', () => {
    expect(toAssessmentRecord({ regular: [8, 9, 7, 6], midterm: 7, final: 6 }, 2).regular).toEqual([8, 9]);
    expect(toAssessmentRecord({ regular: [8], midterm: 7, final: 6 }, 3).regular).toEqual([8, null, null]);
  });

  it('returns an empty record for nothing stored', () => {
    expect(toAssessmentRecord(undefined, 3)).toEqual({
      regular: [null, null, null],
      midterm: null,
      final: null
    });
  });

  it('drops a stored mark that is out of range instead of trusting it', () => {
    expect(toAssessmentRecord({ oral: 99, quiz15m: 7, test1Period: 9, semester: 6 }, 2).regular).toEqual([
      null,
      7
    ]);
  });
});

describe('validateAssessmentRecord', () => {
  it('accepts a complete, in-range record', () => {
    const result = validateAssessmentRecord({ regular: [8, 9], midterm: 7, final: 6 });
    expect(result).toEqual({ valid: true, errors: [], complete: true });
  });

  it('accepts a half-filled record, since marks arrive across a term', () => {
    const result = validateAssessmentRecord({ regular: [8, null], midterm: null, final: null });
    expect(result.valid).toBe(true);
    expect(result.complete).toBe(false);
  });

  it('names the slot that is wrong', () => {
    const result = validateAssessmentRecord({ regular: [8, 11], midterm: 7, final: 6 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/thường xuyên 2/);
  });

  it('rejects a bad mid-term or final', () => {
    expect(validateAssessmentRecord({ regular: [8], midterm: -1, final: 6 }).errors[0]).toMatch(/giữa kỳ/);
    expect(validateAssessmentRecord({ regular: [8], midterm: 7, final: 8.25 }).errors[0]).toMatch(/cuối kỳ/);
  });
});

describe('applySubjectRecord', () => {
  const student = {
    id: 'HS001',
    grades: { Math: 8.5, Literature: 7.8 },
    gradesDetailed: {}
  };
  const complete = { regular: [8, 9], midterm: 7, final: 6 };
  const partial = { regular: [8, null], midterm: null, final: null };

  it('derives the subject average from the marks', () => {
    const { student: next, average } = applySubjectRecord(student, 'Math', complete);
    expect(average).toBe(computeSemesterAverage(complete));
    expect(next.grades.Math).toBe(average);
  });

  it('stores the marks behind the average', () => {
    const { student: next } = applySubjectRecord(student, 'Math', complete);
    expect(next.gradesDetailed.Math).toEqual(complete);
  });

  it('keeps a recorded average when this term\'s entry is still incomplete', () => {
    const { student: next, average } = applySubjectRecord(student, 'Math', partial);
    expect(average).toBeNull();
    expect(next.grades.Math).toBe(8.5);
  });

  it('still saves the partial marks so nothing typed is lost', () => {
    const { student: next } = applySubjectRecord(student, 'Math', partial);
    expect(next.gradesDetailed.Math).toEqual(partial);
  });

  it('leaves other subjects alone', () => {
    const { student: next } = applySubjectRecord(student, 'Math', complete);
    expect(next.grades.Literature).toBe(7.8);
  });

  it('does not mutate the student it was given', () => {
    applySubjectRecord(student, 'Math', complete);
    expect(student.grades.Math).toBe(8.5);
    expect(student.gradesDetailed).toEqual({});
  });

  it('rejects an out-of-range mark and changes nothing', () => {
    const { student: next, errors } = applySubjectRecord(student, 'Math', {
      regular: [8, 11],
      midterm: 7,
      final: 6
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(next).toBe(student);
  });

  it('replaces the average when marks are edited again', () => {
    const first = applySubjectRecord(student, 'Math', complete).student;
    const second = applySubjectRecord(first, 'Math', { regular: [10, 10], midterm: 10, final: 10 }).student;
    expect(second.grades.Math).toBe(10);
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
