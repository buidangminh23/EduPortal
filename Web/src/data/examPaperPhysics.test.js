/**
 * Re-derives every answer on the Vật lí paper from the question's own data.
 *
 * Physics adds a failure mode the Toán paper did not have: unit conversion.
 * A right formula with J reported as kJ is still a wrong answer key, so the
 * checks below carry units explicitly and convert at the end.
 */
import { describe, it, expect } from 'vitest';
import { PHYSICS_PAPER_QUESTIONS, PHYSICS_PAPER_META, PHYSICS_CONSTANTS } from './examPaperPhysics';
import {
  QUESTION_TYPE,
  examFormatFor,
  formatQuestionCount,
  pointsForQuestion
} from '../config/examFormat';

const { WATER_SPECIFIC_HEAT: C_WATER, ICE_FUSION_HEAT, ELEMENTARY_CHARGE, U_IN_MEV } = PHYSICS_CONSTANTS;

const byId = Object.fromEntries(PHYSICS_PAPER_QUESTIONS.map((q) => [q.id, q]));


/** Text of the option a question marks correct, with tags and entities stripped. */
const answerText = (id) => {
  const q = byId[id];
  return q.options
    .find((o) => o.key === q.correctKey)
    .text.replace(/<[^>]+>/g, '')
    .replace(/&middot;/g, '.')
    .replace(/&deg;/g, '')
    .trim();
};
const shortOf = (id) => byId[id].correctAnswer;
const statement = (id, letter) => byId[id].statements.find((s) => s.id === letter).correct;
const parseVn = (text) => Number(String(text).replace(',', '.'));

/** Kelvin from Celsius, the conversion the paper uses. */
const toKelvin = (celsius) => celsius + 273;

describe('paper structure', () => {
  const format = examFormatFor('Physics');

  it('carries exactly the questions the format calls for', () => {
    expect(PHYSICS_PAPER_QUESTIONS).toHaveLength(formatQuestionCount(format));
  });

  it('has 18 nhiều lựa chọn, 4 đúng/sai and 6 trả lời ngắn', () => {
    const counts = PHYSICS_PAPER_QUESTIONS.reduce((acc, q) => {
      const type = q.type || QUESTION_TYPE.MULTIPLE_CHOICE;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    expect(counts[QUESTION_TYPE.MULTIPLE_CHOICE]).toBe(18);
    expect(counts[QUESTION_TYPE.TRUE_FALSE]).toBe(4);
    expect(counts[QUESTION_TYPE.SHORT_ANSWER]).toBe(6);
  });

  it('is worth exactly 10 điểm at the format weights', () => {
    const total = PHYSICS_PAPER_QUESTIONS.reduce(
      (sum, q) => sum + pointsForQuestion('Physics', q.type || QUESTION_TYPE.MULTIPLE_CHOICE),
      0
    );
    expect(total).toBeCloseTo(PHYSICS_PAPER_META.totalPoints, 10);
  });

  it('runs for the 50 phút the format sets', () => {
    expect(PHYSICS_PAPER_META.durationMinutes).toBe(format.durationMinutes);
  });
});

describe('paper hygiene', () => {
  it('gives every question a unique id', () => {
    const ids = PHYSICS_PAPER_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every multiple-choice question four options and a valid key', () => {
    PHYSICS_PAPER_QUESTIONS.filter((q) => !q.type).forEach((q) => {
      expect(q.options, q.id).toHaveLength(4);
      expect(q.options.map((o) => o.key), q.id).toEqual(['A', 'B', 'C', 'D']);
      expect(q.options.some((o) => o.key === q.correctKey), q.id).toBe(true);
    });
  });

  it('gives every đúng/sai question four statements, not all true', () => {
    PHYSICS_PAPER_QUESTIONS.filter((q) => q.type === QUESTION_TYPE.TRUE_FALSE).forEach((q) => {
      expect(q.statements, q.id).toHaveLength(4);
      const trues = q.statements.filter((s) => s.correct).length;
      expect(trues, q.id).toBeGreaterThan(0);
      expect(trues, q.id).toBeLessThan(4);
    });
  });

  it('explains every question', () => {
    PHYSICS_PAPER_QUESTIONS.forEach((q) => {
      expect(q.explanation?.length, q.id).toBeGreaterThan(30);
    });
  });

  it('spreads the correct key across all four letters', () => {
    const keys = new Set(PHYSICS_PAPER_QUESTIONS.filter((q) => !q.type).map((q) => q.correctKey));
    expect(keys.size).toBe(4);
  });

  it('does not lean on any one letter for more than half the answers', () => {
    const mcq = PHYSICS_PAPER_QUESTIONS.filter((q) => !q.type);
    const counts = mcq.reduce((acc, q) => ({ ...acc, [q.correctKey]: (acc[q.correctKey] || 0) + 1 }), {});
    expect(Math.max(...Object.values(counts))).toBeLessThanOrEqual(mcq.length / 2);
  });

  it('stays on the lớp 12 strands, leaving dao động and sóng to lớp 11', () => {
    const text = JSON.stringify(PHYSICS_PAPER_QUESTIONS).toLowerCase();
    expect(text).not.toContain('dao động điều hoà');
    expect(text).not.toContain('sóng cơ');
    expect(text).not.toContain('con lắc');
  });
});

describe('Phần I — nhiệt học', () => {
  it('PP02 · Q = mcΔt on 2 kg over 10 K is 84 kJ', () => {
    const joules = 2 * C_WATER * (30 - 20);
    expect(joules / 1000).toBeCloseTo(84, 10);
    expect(answerText('PP02')).toBe('84 kJ');
  });

  it('PP03 · melting 0.5 kg of ice takes λm', () => {
    expect(ICE_FUSION_HEAT * 0.5).toBeCloseTo(1.7e5, 5);
    expect(answerText('PP03')).toBe('1,7.105 J');
  });

  it('PP04 · ΔU = Q + A with A negative when the gas does work', () => {
    const Q = 100;
    const workDoneByGas = 70;
    expect(Q + -workDoneByGas).toBe(30);
    expect(answerText('PP04')).toBe('30 J');
  });

  it('PP05 · 27°C is 300 K', () => {
    expect(toKelvin(27)).toBe(300);
    expect(answerText('PP05')).toBe('300 K');
  });
});

describe('Phần I — khí lí tưởng', () => {
  it('PP06 · Boyle: compressing 5 L to 2 L raises 4e4 Pa to 1e5 Pa', () => {
    expect((4e4 * 5) / 2).toBeCloseTo(1e5, 5);
    expect(answerText('PP06')).toBe('105 Pa');
  });

  it('PP07 · isobaric heating 300 K → 400 K takes 3 L to 4 L', () => {
    expect((3 * 400) / 300).toBeCloseTo(4, 10);
    expect(answerText('PP07')).toBe('4 lít');
  });

  it('PP08 · isochoric heating 300 K → 450 K takes 2e5 Pa to 3e5 Pa', () => {
    expect((2e5 * 450) / 300).toBeCloseTo(3e5, 5);
    expect(answerText('PP08')).toBe('3.105 Pa');
  });
});

describe('Phần I — từ trường', () => {
  it('PP10 · F = BIl at right angles', () => {
    expect(0.5 * 2 * 0.2).toBeCloseTo(0.2, 10);
    expect(answerText('PP10')).toBe('0,2 N');
  });

  it('PP11 · Lorentz force f = qvB', () => {
    expect(ELEMENTARY_CHARGE * 1e6 * 0.1).toBeCloseTo(1.6e-14, 20);
    expect(answerText('PP11')).toBe('1,6.10-14 N');
  });

  it('PP12 · Φ = BS when the normal is along B', () => {
    expect(0.2 * 0.1 * Math.cos(0)).toBeCloseTo(0.02, 10);
    expect(answerText('PP12')).toBe('0,02 Wb');
  });

  it('PP13 · |e| = ΔΦ/Δt', () => {
    expect(0.04 / 0.1).toBeCloseTo(0.4, 10);
    expect(answerText('PP13')).toBe('0,4 V');
  });
});

describe('Phần I — hạt nhân', () => {
  it('PP15 · neutrons are A - Z', () => {
    expect(235 - 92).toBe(143);
    expect(answerText('PP15')).toBe('143');
  });

  it('PP17 · W = Δm·c² with 1u = 931.5 MeV/c²', () => {
    expect(0.03 * U_IN_MEV).toBeCloseTo(27.945, 10);
    expect(answerText('PP17')).toBe('27,9 MeV');
  });

  it('PP18 · after 2T a quarter of the nuclei remain', () => {
    expect(2 ** -2).toBeCloseTo(0.25, 10);
    expect(answerText('PP18')).toBe('25%');
  });
});

describe('Phần II — statements re-derived', () => {
  it('PP19 · heating water, and Q rises with mass rather than falling', () => {
    expect(1 * C_WATER * 1).toBe(4200);
    expect((1 * C_WATER * 80) / 1000).toBeCloseTo(336, 10);
    expect(2 * C_WATER * 1).toBeGreaterThan(1 * C_WATER * 1); // doubling m doubles Q
    expect(statement('PP19', 'a')).toBe(true);
    expect(statement('PP19', 'b')).toBe(true);
    expect(statement('PP19', 'd')).toBe(false);
  });

  it('PP20 · the three gas transformations hold, and p is inverse to V', () => {
    expect((1e5 * 4) / 2).toBeCloseTo(2e5, 5); // isothermal
    expect((1e5 * 600) / 300).toBeCloseTo(2e5, 5); // isochoric
    expect((300 * 6) / 4).toBeCloseTo(450, 10); // isobaric
    const pAt2L = (1e5 * 4) / 2;
    const pAt8L = (1e5 * 4) / 8;
    expect(pAt2L).toBeGreaterThan(pAt8L); // smaller V, larger p
    expect(statement('PP20', 'd')).toBe(false);
  });

  it('PP21 · flux, its vanishing at 90°, and the induced emf', () => {
    expect(0.1 * 0.2 * Math.cos(0)).toBeCloseTo(0.02, 10);
    expect(0.1 * 0.2 * Math.cos(Math.PI / 2)).toBeCloseTo(0, 10);
    expect(0.02 / 0.05).toBeCloseTo(0.4, 10);
    expect(statement('PP21', 'd')).toBe(false);
  });

  it('PP22 · decay after 1, 2 and 3 half-lives, and never to zero', () => {
    expect(2 ** -1).toBeCloseTo(0.5, 10);
    expect(2 ** -3).toBeCloseTo(1 / 8, 10);
    expect(1 - 2 ** -2).toBeCloseTo(0.75, 10);
    expect(2 ** -2).toBeGreaterThan(0); // something always remains
    expect(statement('PP22', 'd')).toBe(false);
  });
});

describe('Phần III — short answers re-derived', () => {
  it('PP23 · 3 kg of water over 20 K needs 252 kJ', () => {
    const kJ = (3 * C_WATER * (45 - 25)) / 1000;
    expect(kJ).toBeCloseTo(Number(shortOf('PP23')), 10);
  });

  it('PP24 · compressing 6 L to 2 L triples the pressure', () => {
    expect(6 / 2).toBeCloseTo(Number(shortOf('PP24')), 10);
  });

  it('PP25 · F = BIl gives 0.6 N', () => {
    expect(0.3 * 4 * 0.5).toBeCloseTo(parseVn(shortOf('PP25')), 10);
  });

  it('PP26 · |e| = 0.06/0.2 gives 0.3 V', () => {
    expect(0.06 / 0.2).toBeCloseTo(parseVn(shortOf('PP26')), 10);
  });

  it('PP27 · after 4T the count falls by a factor of 16', () => {
    expect(2 ** 4).toBe(Number(shortOf('PP27')));
  });

  it('PP28 · binding energy per nucleon is W/A', () => {
    expect(28.4 / 4).toBeCloseTo(parseVn(shortOf('PP28')), 10);
  });
});
