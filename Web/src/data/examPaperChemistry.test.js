/**
 * Re-derives every answer on the Hoá học paper.
 *
 * Chemistry's characteristic failure is the molar mass: a value one unit out
 * looks entirely plausible on the page and is invisible to proofreading. So the
 * checks below never restate a molar mass — they parse the molecular formula
 * and sum ATOMIC_MASSES atom by atom, which is the arithmetic a marker would
 * have to redo by hand.
 */
import { describe, it, expect } from 'vitest';
import {
  ATOMIC_MASSES,
  CHEMISTRY_PAPER_META,
  CHEMISTRY_PAPER_QUESTIONS,
  FARADAY,
  STANDARD_POTENTIALS
} from './examPaperChemistry';
import {
  QUESTION_TYPE,
  examFormatFor,
  formatQuestionCount,
  pointsForQuestion
} from '../config/examFormat';

const byId = Object.fromEntries(CHEMISTRY_PAPER_QUESTIONS.map((q) => [q.id, q]));
const shortOf = (id) => byId[id].correctAnswer;
const statement = (id, letter) => byId[id].statements.find((s) => s.id === letter).correct;
/**
 * Leading number of a Vietnamese-formatted value, ignoring any unit suffix:
 * option text reads '1,10 V', so a bare Number() would give NaN.
 */
const parseVn = (text) => {
  const match = String(text).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
};

/** Text of the option marked correct, tags and entities stripped. */
const answerText = (id) => {
  const q = byId[id];
  return q.options
    .find((o) => o.key === q.correctKey)
    .text.replace(/<[^>]+>/g, '')
    .replace(/&middot;/g, '.')
    .trim();
};

/**
 * Molar mass from a flat molecular formula such as C6H12O6 or C2H5NO2.
 * Deliberately simple — the paper uses no brackets or hydrates.
 */
function molarMass(formula) {
  const matches = [...formula.matchAll(/([A-Z][a-z]?)(\d*)/g)].filter(([, el]) => el);
  return matches.reduce((sum, [, element, count]) => {
    const mass = ATOMIC_MASSES[element];
    if (mass === undefined) throw new Error(`Chưa khai báo nguyên tử khối của ${element}`);
    return sum + mass * (count === '' ? 1 : Number(count));
  }, 0);
}

describe('molarMass helper', () => {
  it('sums a formula atom by atom', () => {
    expect(molarMass('H2O')).toBe(18);
    expect(molarMass('CH4')).toBe(16);
  });

  it('refuses an element the paper never declared', () => {
    expect(() => molarMass('XyZ2')).toThrow(/nguyên tử khối/);
  });
});

describe('paper structure', () => {
  const format = examFormatFor('Chemistry');

  it('carries exactly the questions the format calls for', () => {
    expect(CHEMISTRY_PAPER_QUESTIONS).toHaveLength(formatQuestionCount(format));
  });

  it('has 18 nhiều lựa chọn, 4 đúng/sai and 6 trả lời ngắn', () => {
    const counts = CHEMISTRY_PAPER_QUESTIONS.reduce((acc, q) => {
      const type = q.type || QUESTION_TYPE.MULTIPLE_CHOICE;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    expect(counts[QUESTION_TYPE.MULTIPLE_CHOICE]).toBe(18);
    expect(counts[QUESTION_TYPE.TRUE_FALSE]).toBe(4);
    expect(counts[QUESTION_TYPE.SHORT_ANSWER]).toBe(6);
  });

  it('is worth exactly 10 điểm at the format weights', () => {
    const total = CHEMISTRY_PAPER_QUESTIONS.reduce(
      (sum, q) => sum + pointsForQuestion('Chemistry', q.type || QUESTION_TYPE.MULTIPLE_CHOICE),
      0
    );
    expect(total).toBeCloseTo(CHEMISTRY_PAPER_META.totalPoints, 10);
  });

  it('runs for the 50 phút the format sets', () => {
    expect(CHEMISTRY_PAPER_META.durationMinutes).toBe(format.durationMinutes);
  });
});

describe('paper hygiene', () => {
  it('gives every question a unique id', () => {
    const ids = CHEMISTRY_PAPER_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every multiple-choice question four options and a valid key', () => {
    CHEMISTRY_PAPER_QUESTIONS.filter((q) => !q.type).forEach((q) => {
      expect(q.options, q.id).toHaveLength(4);
      expect(q.options.map((o) => o.key), q.id).toEqual(['A', 'B', 'C', 'D']);
      expect(q.options.some((o) => o.key === q.correctKey), q.id).toBe(true);
    });
  });

  it('gives every đúng/sai question four statements, not all true', () => {
    CHEMISTRY_PAPER_QUESTIONS.filter((q) => q.type === QUESTION_TYPE.TRUE_FALSE).forEach((q) => {
      expect(q.statements, q.id).toHaveLength(4);
      const trues = q.statements.filter((s) => s.correct).length;
      expect(trues, q.id).toBeGreaterThan(0);
      expect(trues, q.id).toBeLessThan(4);
    });
  });

  it('explains every question', () => {
    CHEMISTRY_PAPER_QUESTIONS.forEach((q) => {
      expect(q.explanation?.length, q.id).toBeGreaterThan(30);
    });
  });

  it('uses all four letters and leans on none of them', () => {
    const mcq = CHEMISTRY_PAPER_QUESTIONS.filter((q) => !q.type);
    const counts = mcq.reduce((acc, q) => ({ ...acc, [q.correctKey]: (acc[q.correctKey] || 0) + 1 }), {});
    expect(Object.keys(counts).sort()).toEqual(['A', 'B', 'C', 'D']);
    expect(Math.max(...Object.values(counts))).toBeLessThanOrEqual(mcq.length / 2);
  });
});

describe('Phần I — phân tử khối tính lại từ công thức', () => {
  it('CP01 · ethyl acetate C4H8O2', () => {
    expect(molarMass('C4H8O2')).toBe(88);
    expect(answerText('CP01')).toBe('88');
  });

  it('CP04 · glucose C6H12O6', () => {
    expect(molarMass('C6H12O6')).toBe(180);
    expect(answerText('CP04')).toBe('180');
  });

  it('CP07 · methylamine CH5N', () => {
    expect(molarMass('CH5N')).toBe(31);
    expect(answerText('CP07')).toBe('31');
  });

  it('distinguishes glucose from the distractors offered', () => {
    // 162 is the tinh bột đơn vị, 342 is saccharose — both are real numbers,
    // which is what makes them good distractors and worth pinning apart.
    expect(molarMass('C6H10O5')).toBe(162);
    expect(molarMass('C12H22O11')).toBe(342);
    expect(molarMass('C6H12O6')).not.toBe(162);
  });
});

describe('Phần I — pin điện và điện phân', () => {
  it('CP13 · E°pin = E°cathode - E°anode', () => {
    const emf = STANDARD_POTENTIALS['Cu2+/Cu'] - STANDARD_POTENTIALS['Zn2+/Zn'];
    expect(emf).toBeCloseTo(1.1, 10);
    expect(parseVn(answerText('CP13'))).toBeCloseTo(1.1, 10);
  });

  it('CP13 · the emf is positive, so the cell reaction runs by itself', () => {
    expect(STANDARD_POTENTIALS['Cu2+/Cu'] - STANDARD_POTENTIALS['Zn2+/Zn']).toBeGreaterThan(0);
  });

  it('CP12 · zinc is the lower potential, hence the anode', () => {
    expect(STANDARD_POTENTIALS['Zn2+/Zn']).toBeLessThan(STANDARD_POTENTIALS['Cu2+/Cu']);
    expect(answerText('CP12')).toMatch(/anode/);
    expect(answerText('CP12')).toMatch(/oxi hoá/);
  });
});

describe('Phần II — statements re-derived', () => {
  it('CP19 · the ester claims hold, and it is not a trùng ngưng product', () => {
    expect(molarMass('C4H8O2')).toBe(88);
    expect(statement('CP19', 'a')).toBe(true);
    expect(statement('CP19', 'b')).toBe(true);
    expect(statement('CP19', 'd')).toBe(false);
  });

  it('CP20 · glucose is a monosaccharide, so it does not hydrolyse', () => {
    expect(molarMass('C6H12O6')).toBe(180);
    expect(statement('CP20', 'a')).toBe(true);
    expect(statement('CP20', 'b')).toBe(true);
    expect(statement('CP20', 'd')).toBe(false);
  });

  it('CP21 · the Cu electrode gains mass rather than losing it', () => {
    expect(STANDARD_POTENTIALS['Cu2+/Cu'] - STANDARD_POTENTIALS['Zn2+/Zn']).toBeCloseTo(1.1, 10);
    expect(statement('CP21', 'a')).toBe(true);
    expect(statement('CP21', 'b')).toBe(true);
    expect(statement('CP21', 'c')).toBe(true);
    expect(statement('CP21', 'd')).toBe(false);
  });

  it('CP22 · boiling fixes temporary hardness only', () => {
    expect(statement('CP22', 'b')).toBe(true);
    expect(statement('CP22', 'd')).toBe(false);
    // The two claims about boiling must disagree, or the question is incoherent.
    expect(statement('CP22', 'b')).not.toBe(statement('CP22', 'd'));
  });
});

describe('Phần III — short answers re-derived', () => {
  it('CP23 · glycine C2H5NO2 is 75', () => {
    expect(molarMass('C2H5NO2')).toBe(Number(shortOf('CP23')));
  });

  it('CP24 · saponifying 8.8 g of ester yields 8.2 g of salt', () => {
    const moles = 8.8 / molarMass('C4H8O2');
    expect(moles).toBeCloseTo(0.1, 10);
    const saltMass = moles * molarMass('C2H3O2Na'); // CH3COONa
    expect(saltMass).toBeCloseTo(parseVn(shortOf('CP24')), 10);
  });

  it('CP25 · the standard emf is 1.1 V', () => {
    const emf = STANDARD_POTENTIALS['Cu2+/Cu'] - STANDARD_POTENTIALS['Zn2+/Zn'];
    expect(emf).toBeCloseTo(parseVn(shortOf('CP25')), 10);
  });

  it('CP26 · Faraday gives 3.2 g of copper', () => {
    const mass = (ATOMIC_MASSES.Cu * 5 * 1930) / (2 * FARADAY);
    expect(mass).toBeCloseTo(parseVn(shortOf('CP26')), 10);
  });

  it('CP27 · 56000 / 28 gives 2000 mắt xích', () => {
    expect(56000 / molarMass('C2H4')).toBe(Number(shortOf('CP27')));
  });

  it('CP28 · one mole of mắt xích gives one mole of glucose', () => {
    const moles = 162 / molarMass('C6H10O5');
    expect(moles).toBeCloseTo(1, 10);
    expect(moles * molarMass('C6H12O6')).toBeCloseTo(Number(shortOf('CP28')), 10);
  });

  it('CP28 · hydrolysis gains mass, since each unit takes up a water', () => {
    expect(molarMass('C6H12O6') - molarMass('C6H10O5')).toBe(molarMass('H2O'));
  });
});
