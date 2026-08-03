import { describe, it, expect } from 'vitest';
import {
  computeRiasecProfile,
  profileFromStoredScores,
  getCareerGuidance,
  toStorageScores,
  summariseProfile,
  traitDistance,
  pairKey
} from './riasec';
import { RIASEC_QUESTIONS, TRAIT_ORDER, MAX_TRAIT_SCORE, CAREER_PAIRS } from './riasecContent';

/** Answer every question, with the listed traits pushed to the top of the scale. */
function answersFavouring(traits, { high = 5, low = 1 } = {}) {
  return RIASEC_QUESTIONS.reduce((acc, q) => ({
    ...acc,
    [q.id]: traits.includes(q.trait) ? high : low
  }), {});
}

describe('inventory shape', () => {
  it('asks the same number of questions about every trait', () => {
    const counts = RIASEC_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.trait]: (acc[q.trait] || 0) + 1 }), {});
    const values = TRAIT_ORDER.map(t => counts[t]);

    expect(new Set(values).size).toBe(1);
    expect(values[0]).toBeGreaterThanOrEqual(4);
  });

  it('has no duplicate question ids', () => {
    const ids = RIASEC_QUESTIONS.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('computeRiasecProfile', () => {
  it('ranks the favoured traits first', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'A']));

    expect(profile.topTraits.slice(0, 2).sort()).toEqual(['A', 'I']);
    expect(profile.hollandCode).toHaveLength(3);
  });

  // The whole point of the rewrite: this scale has to match what AiAdvisorTab
  // writes, or every radar chart reading `careerTestScores` renders wrong.
  it('publishes scores on the shared 0–10 scale', () => {
    const profile = computeRiasecProfile(answersFavouring(['R']));

    expect(profile.scores.R).toBe(MAX_TRAIT_SCORE);
    expect(profile.scores.I).toBe(2); // an all-1 trait maps to 2, not 0
    Object.values(profile.scores).forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(MAX_TRAIT_SCORE);
    });
  });

  it('reports percent as interest from 0 to 100', () => {
    const profile = computeRiasecProfile(answersFavouring(['S']));

    expect(profile.percent.S).toBe(100);
    expect(profile.percent.R).toBe(0);
  });

  it('tracks completion', () => {
    const partial = computeRiasecProfile({ q01: 5, q02: 4 });

    expect(partial.answeredCount).toBe(2);
    expect(partial.isComplete).toBe(false);
    expect(computeRiasecProfile(answersFavouring(['R'])).isComplete).toBe(true);
  });

  it('treats unanswered traits as neutral rather than as dislike', () => {
    const partial = computeRiasecProfile({ q01: 5 });

    // Only R was answered; the rest sit at the midpoint of the scale.
    expect(partial.scores.I).toBe(6);
  });

  it('ignores out-of-range and non-numeric answers', () => {
    const profile = computeRiasecProfile({ q01: 99, q02: -3, q03: 'nhiều', q04: 5 });

    expect(profile.answeredCount).toBe(1);
    expect(profile.scores.S).toBe(MAX_TRAIT_SCORE);
  });

  it('is stable for the same answers', () => {
    const answers = answersFavouring(['E', 'C']);
    expect(computeRiasecProfile(answers).hollandCode).toBe(computeRiasecProfile(answers).hollandCode);
  });

  it('breaks ties on the canonical trait order', () => {
    const allEqual = RIASEC_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 3 }), {});
    expect(computeRiasecProfile(allEqual).hollandCode).toBe('RIA');
  });

  it('handles empty input without throwing', () => {
    const profile = computeRiasecProfile();
    expect(profile.answeredCount).toBe(0);
    expect(profile.isComplete).toBe(false);
  });
});

describe('differentiation and consistency', () => {
  it('flags a flat profile so it is not read as a recommendation', () => {
    const allEqual = RIASEC_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 4 }), {});
    const profile = computeRiasecProfile(allEqual);

    expect(profile.differentiation).toBe(0);
    expect(profile.isFlat).toBe(true);
    expect(getCareerGuidance(profile).caveat).toContain('cân bằng');
  });

  it('does not flag a clearly separated profile', () => {
    const profile = computeRiasecProfile(answersFavouring(['I']));

    expect(profile.differentiation).toBeGreaterThan(50);
    expect(profile.isFlat).toBe(false);
  });

  it('rates adjacent hexagon neighbours as consistent', () => {
    // R and I sit next to each other on the Holland hexagon.
    const profile = computeRiasecProfile(answersFavouring(['R', 'I']));
    expect(profile.consistency.level).toBe('high');
  });

  it('rates opposite traits as inconsistent', () => {
    // R and S are three steps apart — opposite corners.
    const profile = computeRiasecProfile(answersFavouring(['R', 'S']));
    expect(profile.consistency.level).toBe('low');
  });

  it('measures hexagon distance symmetrically', () => {
    expect(traitDistance('R', 'I')).toBe(1);
    expect(traitDistance('I', 'R')).toBe(1);
    expect(traitDistance('R', 'S')).toBe(3);
    expect(traitDistance('R', 'C')).toBe(1); // wraps around the hexagon
  });

  it('rates confidence higher for a finished, well-separated survey', () => {
    const finished = computeRiasecProfile(answersFavouring(['I', 'A']));
    const partial = computeRiasecProfile({ q02: 5, q03: 5 });

    expect(finished.confidence).toBeGreaterThan(partial.confidence);
    expect(finished.confidence).toBeLessThanOrEqual(100);
  });
});

describe('getCareerGuidance', () => {
  it('covers every possible top-two pairing', () => {
    for (const a of TRAIT_ORDER) {
      for (const b of TRAIT_ORDER) {
        if (a === b) continue;
        expect(CAREER_PAIRS[pairKey(a, b)], `missing pair ${a}${b}`).toBeDefined();
      }
    }
  });

  it('is order-insensitive', () => {
    expect(pairKey('A', 'I')).toBe(pairKey('I', 'A'));
  });

  it('returns majors, jobs and exam blocks', () => {
    const guidance = getCareerGuidance(computeRiasecProfile(answersFavouring(['I', 'S'])));

    expect(guidance.majors.length).toBeGreaterThan(0);
    expect(guidance.jobs.length).toBeGreaterThan(0);
    expect(guidance.blocks.length).toBeGreaterThan(0);
  });

  it('adds the third trait as extra options without dropping the main list', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'S']));
    const guidance = getCareerGuidance(profile);

    guidance.alsoConsider.forEach(major => {
      expect(guidance.majors).not.toContain(major);
    });
  });

  it('returns null for a missing profile', () => {
    expect(getCareerGuidance(null)).toBeNull();
  });
});

describe('storage round-trip', () => {
  it('writes only trait keys, since other screens iterate the row blindly', () => {
    const row = toStorageScores(computeRiasecProfile(answersFavouring(['E'])));
    expect(Object.keys(row).sort()).toEqual([...TRAIT_ORDER].sort());
  });

  it('rebuilds a readable profile from a stored row', () => {
    const stored = { studentId: 'S001', R: 4, I: 9, A: 7, S: 3, E: 5, C: 2 };
    const profile = profileFromStoredScores(stored);

    expect(profile.hollandCode.startsWith('IA')).toBe(true);
    expect(profile.fromStorage).toBe(true);
  });

  it('survives a legacy row written on the old 0–5 scale', () => {
    const legacy = { studentId: 'S002', R: 5, I: 3, A: 2, S: 1, E: 4, C: 3 };
    const profile = profileFromStoredScores(legacy);

    expect(profile.topTraits[0]).toBe('R');
    expect(profile.percent.R).toBeLessThanOrEqual(100);
  });

  it('returns null when there is nothing stored', () => {
    expect(profileFromStoredScores(null)).toBeNull();
    expect(profileFromStoredScores({ studentId: 'S003' })).toBeNull();
  });
});

describe('summariseProfile', () => {
  it('names the Holland code and the top trait', () => {
    const summary = summariseProfile(computeRiasecProfile(answersFavouring(['A', 'S'])));

    expect(summary).toContain('Holland');
    expect(summary).toMatch(/Nghệ thuật|Xã hội/);
  });

  it('says so when there is no profile', () => {
    expect(summariseProfile(null)).toContain('chưa hoàn thành');
  });
});
