import { describe, it, expect } from 'vitest';
import {
  EXAM_FORMATS,
  MAX_SUBJECT_SCORE,
  QUESTION_TYPE,
  TRUE_FALSE_POINTS,
  examFormatFor,
  formatQuestionCount,
  formatTotalPoints,
  isEssayPaper,
  pointsForQuestion,
  trueFalsePoints
} from './examFormat';

const multipleChoicePapers = Object.entries(EXAM_FORMATS).filter(([, f]) => f.mode === 'mcq');

describe('exam paper structure', () => {
  it('makes every multiple-choice paper add up to exactly 10 điểm', () => {
    // The cheapest guard against a mistyped count or weight: if a part is
    // wrong, the paper stops summing to 10.
    multipleChoicePapers.forEach(([subject, format]) => {
      expect(formatTotalPoints(format), subject).toBeCloseTo(MAX_SUBJECT_SCORE, 10);
    });
  });

  it('gives Toán 22 questions across three parts in 90 phút', () => {
    const format = examFormatFor('Math');
    expect(format.durationMinutes).toBe(90);
    expect(formatQuestionCount(format)).toBe(22);
    expect(format.parts.map((p) => p.count)).toEqual([12, 4, 6]);
  });

  it('gives the science papers 28 questions in 50 phút', () => {
    ['Physics', 'Chemistry', 'Biology'].forEach((subject) => {
      const format = examFormatFor(subject);
      expect(format.durationMinutes, subject).toBe(50);
      expect(format.parts.map((p) => p.count), subject).toEqual([18, 4, 6]);
    });
  });

  it('gives the social-science papers two parts, with no trả lời ngắn', () => {
    const format = examFormatFor('History');
    expect(format.parts.map((p) => p.count)).toEqual([24, 4]);
    expect(format.parts.some((p) => p.type === QUESTION_TYPE.SHORT_ANSWER)).toBe(false);
  });

  it('gives Ngoại ngữ 40 multiple-choice questions', () => {
    expect(formatQuestionCount(examFormatFor('English'))).toBe(40);
  });

  it('marks Ngữ văn as an essay paper of 120 phút, not multiple choice', () => {
    expect(isEssayPaper('Literature')).toBe(true);
    expect(examFormatFor('Literature').durationMinutes).toBe(120);
    expect(formatQuestionCount(examFormatFor('Literature'))).toBe(0);
  });

  it('does not treat a multiple-choice subject as an essay paper', () => {
    expect(isEssayPaper('Math')).toBe(false);
  });

  it('returns null for a subject with no published paper', () => {
    expect(examFormatFor('PhysicalEducation')).toBeNull();
    expect(formatTotalPoints(null)).toBe(0);
  });
});

describe('pointsForQuestion', () => {
  it('weights a đúng/sai question four times a multiple-choice one', () => {
    expect(pointsForQuestion('Math', QUESTION_TYPE.MULTIPLE_CHOICE)).toBe(0.25);
    expect(pointsForQuestion('Math', QUESTION_TYPE.TRUE_FALSE)).toBe(1.0);
  });

  it('weights trả lời ngắn differently in Toán and in the sciences', () => {
    expect(pointsForQuestion('Math', QUESTION_TYPE.SHORT_ANSWER)).toBe(0.5);
    expect(pointsForQuestion('Chemistry', QUESTION_TYPE.SHORT_ANSWER)).toBe(0.25);
  });

  it('returns zero for a part the subject does not have', () => {
    expect(pointsForQuestion('History', QUESTION_TYPE.SHORT_ANSWER)).toBe(0);
    expect(pointsForQuestion('Literature', QUESTION_TYPE.MULTIPLE_CHOICE)).toBe(0);
  });
});

describe('trueFalsePoints', () => {
  it('follows the published partial-credit scale', () => {
    expect(trueFalsePoints(0)).toBe(0);
    expect(trueFalsePoints(1)).toBe(0.1);
    expect(trueFalsePoints(2)).toBe(0.25);
    expect(trueFalsePoints(3)).toBe(0.5);
    expect(trueFalsePoints(4)).toBe(1.0);
  });

  it('rewards the last correct statement most, as the scale intends', () => {
    const gains = TRUE_FALSE_POINTS.slice(1).map((p, i) => p - TRUE_FALSE_POINTS[i]);
    expect(Math.max(...gains)).toBe(gains[gains.length - 1]);
  });

  it('scales to the question weight where a paper differs', () => {
    expect(trueFalsePoints(4, 0.5)).toBe(0.5);
    expect(trueFalsePoints(2, 0.5)).toBe(0.125);
  });

  it('clamps nonsense input instead of returning undefined', () => {
    expect(trueFalsePoints(-1)).toBe(0);
    expect(trueFalsePoints(9)).toBe(1.0);
  });
});
