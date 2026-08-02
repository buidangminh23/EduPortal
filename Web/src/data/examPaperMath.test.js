/**
 * Re-derives every answer on the Toán paper independently.
 *
 * The questions were written by hand, so the answer keys are the part most
 * likely to be wrong — and a mock exam that marks a correct answer wrong
 * teaches the student the wrong thing. Each check below recomputes the result
 * from the question's own data (numeric integration, vector arithmetic,
 * combinatorics) rather than restating the key, so a typo in an answer fails
 * the suite instead of reaching a student.
 */
import { describe, it, expect } from 'vitest';
import { MATH_PAPER_QUESTIONS, MATH_PAPER_META } from './examPaperMath';
import {
  QUESTION_TYPE,
  examFormatFor,
  formatQuestionCount,
  pointsForQuestion
} from '../config/examFormat';

const byId = Object.fromEntries(MATH_PAPER_QUESTIONS.map((q) => [q.id, q]));
const keyOf = (id) => byId[id].correctKey;
const shortOf = (id) => byId[id].correctAnswer;
const statement = (id, letter) => byId[id].statements.find((s) => s.id === letter).correct;

/** Text of the option a question marks correct, with tags stripped. */
const correctOptionText = (id) => {
  const q = byId[id];
  return q.options.find((o) => o.key === q.correctKey).text.replace(/<[^>]+>/g, '');
};

/** Composite Simpson's rule — enough precision to catch a wrong antiderivative. */
function integrate(f, a, b, n = 2000) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i += 1) {
    sum += f(a + i * h) * (i % 2 === 0 ? 2 : 4);
  }
  return (sum * h) / 3;
}

/** Vietnamese decimal comma to a number. */
const parseVn = (text) => Number(String(text).replace(',', '.'));

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
const choose = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));

describe('paper structure', () => {
  const format = examFormatFor('Math');

  it('carries exactly the questions the format calls for', () => {
    expect(MATH_PAPER_QUESTIONS).toHaveLength(formatQuestionCount(format));
  });

  it('has the right number of questions in each part', () => {
    const counts = MATH_PAPER_QUESTIONS.reduce((acc, q) => {
      const type = q.type || QUESTION_TYPE.MULTIPLE_CHOICE;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    expect(counts[QUESTION_TYPE.MULTIPLE_CHOICE]).toBe(12);
    expect(counts[QUESTION_TYPE.TRUE_FALSE]).toBe(4);
    expect(counts[QUESTION_TYPE.SHORT_ANSWER]).toBe(6);
  });

  it('is worth exactly 10 điểm at the format weights', () => {
    const total = MATH_PAPER_QUESTIONS.reduce(
      (sum, q) => sum + pointsForQuestion('Math', q.type || QUESTION_TYPE.MULTIPLE_CHOICE),
      0
    );
    expect(total).toBeCloseTo(MATH_PAPER_META.totalPoints, 10);
  });

  it('matches the paper duration in the format', () => {
    expect(MATH_PAPER_META.durationMinutes).toBe(format.durationMinutes);
  });
});

describe('paper hygiene', () => {
  it('gives every question a unique id', () => {
    const ids = MATH_PAPER_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every multiple-choice question four options and a valid key', () => {
    MATH_PAPER_QUESTIONS.filter((q) => !q.type).forEach((q) => {
      expect(q.options, q.id).toHaveLength(4);
      expect(q.options.map((o) => o.key), q.id).toEqual(['A', 'B', 'C', 'D']);
      expect(q.options.some((o) => o.key === q.correctKey), q.id).toBe(true);
    });
  });

  it('gives every đúng/sai question four statements', () => {
    MATH_PAPER_QUESTIONS.filter((q) => q.type === QUESTION_TYPE.TRUE_FALSE).forEach((q) => {
      expect(q.statements, q.id).toHaveLength(4);
      expect(q.statements.map((s) => s.id), q.id).toEqual(['a', 'b', 'c', 'd']);
      expect(q.statements.every((s) => typeof s.correct === 'boolean'), q.id).toBe(true);
    });
  });

  it('does not make every statement in a đúng/sai question true', () => {
    // An all-true question is answerable without reading it.
    MATH_PAPER_QUESTIONS.filter((q) => q.type === QUESTION_TYPE.TRUE_FALSE).forEach((q) => {
      const trues = q.statements.filter((s) => s.correct).length;
      expect(trues, q.id).toBeLessThan(4);
      expect(trues, q.id).toBeGreaterThan(0);
    });
  });

  it('explains every question', () => {
    MATH_PAPER_QUESTIONS.forEach((q) => {
      expect(q.explanation?.length, q.id).toBeGreaterThan(30);
    });
  });

  it('spreads the correct key across all four letters', () => {
    // A paper where every answer is A is a broken paper.
    const keys = new Set(MATH_PAPER_QUESTIONS.filter((q) => !q.type).map((q) => q.correctKey));
    expect(keys.size).toBeGreaterThanOrEqual(3);
  });

  it('stays clear of số phức, which the current syllabus dropped', () => {
    const text = JSON.stringify(MATH_PAPER_QUESTIONS).toLowerCase();
    expect(text).not.toContain('số phức');
    expect(text).not.toContain('môđun');
  });
});

describe('Phần I — answers re-derived', () => {
  it('MP01 · y = -x³+3x²-1 increases exactly where y\' > 0', () => {
    const dy = (x) => -3 * x * x + 6 * x;
    expect(dy(1)).toBeGreaterThan(0); // inside (0;2)
    expect(dy(-1)).toBeLessThan(0);
    expect(dy(3)).toBeLessThan(0);
    expect(keyOf('MP01')).toBe('B');
  });

  it('MP02 · y = x⁴-2x²+3 has three sign changes in y\'', () => {
    const dy = (x) => 4 * x ** 3 - 4 * x;
    const sample = [-2, -0.5, 0.5, 2].map((x) => Math.sign(dy(x)));
    const changes = sample.slice(1).filter((s, i) => s !== sample[i]).length;
    expect(changes).toBe(3);
    expect(correctOptionText('MP02')).toBe('3');
  });

  it('MP03 · (3x-2)/(x+1) tends to 3', () => {
    const y = (x) => (3 * x - 2) / (x + 1);
    expect(y(1e9)).toBeCloseTo(3, 6);
    expect(y(-1e9)).toBeCloseTo(3, 6);
    expect(correctOptionText('MP03')).toContain('y = 3');
  });

  it('MP04 · x + 4/x bottoms out at 4', () => {
    const f = (x) => x + 4 / x;
    let min = Infinity;
    for (let x = 0.01; x < 20; x += 0.001) min = Math.min(min, f(x));
    expect(min).toBeCloseTo(4, 3);
    expect(correctOptionText('MP04')).toBe('4');
  });

  it('MP05 · x²+sin x differentiates back to 2x+cos x', () => {
    const F = (x) => x * x + Math.sin(x);
    const h = 1e-6;
    [0.3, 1.1, 2.4].forEach((x) => {
      expect((F(x + h) - F(x - h)) / (2 * h)).toBeCloseTo(2 * x + Math.cos(x), 5);
    });
    expect(keyOf('MP05')).toBe('A');
  });

  it('MP06 · ∫₀² (3x²-2x) dx = 4', () => {
    expect(integrate((x) => 3 * x * x - 2 * x, 0, 2)).toBeCloseTo(4, 6);
    expect(correctOptionText('MP06')).toContain('4');
  });

  it('MP07 · area under y = x²-4x+3 between its roots is 4/3', () => {
    const area = Math.abs(integrate((x) => x * x - 4 * x + 3, 1, 3));
    expect(area).toBeCloseTo(4 / 3, 6);
    expect(correctOptionText('MP07')).toBe('4/3');
  });

  it('MP08 · the chosen plane contains M and has the stated normal', () => {
    // x + 2y - 2z + 6 = 0 through M(2,-1,3)
    expect(2 + 2 * -1 - 2 * 3 + 6).toBe(0);
    expect(keyOf('MP08')).toBe('A');
  });

  it('MP09 · distance from A(1,-2,1) to 2x-y+2z-3=0 is 1', () => {
    const d = Math.abs(2 * 1 - -2 + 2 * 1 - 3) / Math.hypot(2, -1, 2);
    expect(d).toBeCloseTo(1, 10);
    expect(correctOptionText('MP09')).toBe('1');
  });

  it('MP10 · the chosen sphere has centre I(1,-2,3) and R² = 16', () => {
    const onSphere = (x, y, z) => (x - 1) ** 2 + (y + 2) ** 2 + (z - 3) ** 2;
    expect(onSphere(5, -2, 3)).toBe(16); // a point at distance 4
    expect(keyOf('MP10')).toBe('A');
  });

  it('MP11 · grouped range is last upper bound minus first lower bound', () => {
    const groups = [[0, 30], [30, 60], [60, 90], [90, 120]];
    expect(groups[groups.length - 1][1] - groups[0][0]).toBe(120);
    expect(correctOptionText('MP11')).toBe('120');
  });

  it('MP12 · P(A|B) = 0.3/0.5', () => {
    expect(0.3 / 0.5).toBeCloseTo(0.6, 10);
    expect(parseVn(correctOptionText('MP12'))).toBeCloseTo(0.6, 10);
  });
});

describe('Phần II — statements re-derived', () => {
  it('MP13 · (2x+1)/(x-1) is decreasing, not increasing', () => {
    const y = (x) => (2 * x + 1) / (x - 1);
    expect(y(3)).toBeGreaterThan(y(4)); // decreasing on (1;+∞)
    expect(y(1e9)).toBeCloseTo(2, 6); // horizontal asymptote y = 2
    expect(statement('MP13', 'a')).toBe(true);
    expect(statement('MP13', 'b')).toBe(true);
    expect(statement('MP13', 'c')).toBe(true);
    expect(statement('MP13', 'd')).toBe(false);
  });

  it('MP14 · the three stated integrals hold and the fourth does not', () => {
    const f = (x) => 3 * x * x - 2 * x + 1;
    expect(integrate(f, 0, 1)).toBeCloseTo(1, 6);
    expect(integrate(f, 0, 2)).toBeCloseTo(6, 6);
    expect(integrate(f, 1, 2)).toBeCloseTo(5, 6); // the question claims 4
    expect(statement('MP14', 'b')).toBe(true);
    expect(statement('MP14', 'c')).toBe(true);
    expect(statement('MP14', 'd')).toBe(false);
  });

  it('MP15 · angle A is not right, though the other three claims hold', () => {
    const A = [1, 0, 0];
    const B = [0, 2, 0];
    const C = [0, 0, 3];
    const AB = B.map((v, i) => v - A[i]);
    const AC = C.map((v, i) => v - A[i]);
    expect(AB).toEqual([-1, 2, 0]);
    expect(Math.hypot(...AB)).toBeCloseTo(Math.SQRT2 * Math.sqrt(2.5), 10);
    expect(Math.hypot(...AB)).toBeCloseTo(Math.sqrt(5), 10);
    // plane 6x + 3y + 2z - 6 = 0 passes through all three points
    const plane = ([x, y, z]) => 6 * x + 3 * y + 2 * z - 6;
    [A, B, C].forEach((p) => expect(plane(p)).toBeCloseTo(0, 10));
    const dot = AB.reduce((s, v, i) => s + v * AC[i], 0);
    expect(dot).not.toBe(0);
    expect(statement('MP15', 'd')).toBe(false);
  });

  it('MP16 · the three probabilities hold and "at least one blue" does not', () => {
    const total = choose(8, 2);
    expect(choose(5, 2) / total).toBeCloseTo(5 / 14, 10);
    expect(choose(3, 2) / total).toBeCloseTo(3 / 28, 10);
    expect((5 * 3) / total).toBeCloseTo(15 / 28, 10);
    expect(1 - choose(5, 2) / total).toBeCloseTo(9 / 14, 10); // not 3/28
    expect(statement('MP16', 'd')).toBe(false);
  });

  it('MP16 · its three parts partition the sample space', () => {
    const total = choose(8, 2);
    const sum = (choose(5, 2) + choose(3, 2) + 5 * 3) / total;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe('Phần III — short answers re-derived', () => {
  it('MP17 · ∫₁² (2x+1) dx = 4', () => {
    expect(integrate((x) => 2 * x + 1, 1, 2)).toBeCloseTo(Number(shortOf('MP17')), 6);
  });

  it('MP18 · the solid of revolution is 8π', () => {
    const k = integrate((x) => x, 0, 4); // V = π ∫ (√x)² dx
    expect(k).toBeCloseTo(Number(shortOf('MP18')), 6);
  });

  it('MP19 · max of x³-3x²+1 on [-1;3] is 1', () => {
    const f = (x) => x ** 3 - 3 * x * x + 1;
    let max = -Infinity;
    for (let x = -1; x <= 3; x += 0.0001) max = Math.max(max, f(x));
    expect(max).toBeCloseTo(Number(shortOf('MP19')), 3);
  });

  it('MP20 · the two parallel planes are 2 apart', () => {
    const d = Math.abs(1 - -5) / Math.hypot(1, 2, -2);
    expect(d).toBeCloseTo(Number(shortOf('MP20')), 10);
  });

  it('MP21 · P(A|B) = 0.1/0.4', () => {
    expect(0.1 / 0.4).toBeCloseTo(parseVn(shortOf('MP21')), 10);
  });

  it('MP22 · the grouped mean is 5.6', () => {
    const groups = [[[0, 4], 3], [[4, 8], 5], [[8, 12], 2]];
    const n = groups.reduce((s, [, count]) => s + count, 0);
    const mean = groups.reduce((s, [[lo, hi], count]) => s + ((lo + hi) / 2) * count, 0) / n;
    expect(mean).toBeCloseTo(parseVn(shortOf('MP22')), 10);
  });
});
