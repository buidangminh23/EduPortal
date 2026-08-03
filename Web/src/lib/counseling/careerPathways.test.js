import { describe, it, expect } from 'vitest';
import {
  subjectStrengths,
  estimateBlockScore,
  rankBlocks,
  recommendPathways,
  nextSteps,
  MAX_BLOCK_SCORE
} from './careerPathways';
import { computeRiasecProfile } from './riasec';
import { RIASEC_QUESTIONS } from './riasecContent';
import { UNIVERSITY_DB } from '../../data/universitiesData';

function answersFavouring(traits, { high = 5, low = 1 } = {}) {
  return RIASEC_QUESTIONS.reduce((acc, q) => ({
    ...acc,
    [q.id]: traits.includes(q.trait) ? high : low
  }), {});
}

const mockAttempt = (date, breakdown, studentId = 'HS001') => ({
  studentId,
  date,
  block: 'A00',
  subjectBreakdown: Object.entries(breakdown).reduce(
    (acc, [subject, subjectScore]) => ({ ...acc, [subject]: { subjectScore } }),
    {}
  )
});

describe('subjectStrengths', () => {
  it('uses the term mark when there is no mock paper', () => {
    const strengths = subjectStrengths({ grades: { Math: 8.5 } });

    expect(strengths.Math.score).toBe(8.5);
    expect(strengths.Math.fromMock).toBe(false);
  });

  it('leans on the mock paper but does not ignore the term mark', () => {
    const strengths = subjectStrengths({
      grades: { Math: 5 },
      mockExamHistory: [mockAttempt('2026-05-01', { Math: 10 })],
      studentId: 'HS001'
    });

    expect(strengths.Math.score).toBe(8);
    expect(strengths.Math.fromMock).toBe(true);
    expect(strengths.Math.fromGrades).toBe(true);
  });

  it('keeps the most recent mock paper when a subject was sat twice', () => {
    const strengths = subjectStrengths({
      mockExamHistory: [
        mockAttempt('2026-01-10', { Physics: 4 }),
        mockAttempt('2026-05-20', { Physics: 9 })
      ]
    });

    expect(strengths.Physics.score).toBe(9);
  });

  it('ignores rows belonging to another student', () => {
    const strengths = subjectStrengths({
      mockExamHistory: [mockAttempt('2026-05-20', { Physics: 9 }, 'HS999')],
      studentId: 'HS001'
    });

    expect(strengths.Physics).toBeUndefined();
  });

  it('returns nothing rather than zeroes when there is no data at all', () => {
    expect(subjectStrengths({})).toEqual({});
  });
});

describe('estimateBlockScore', () => {
  it('adds the three subjects of the block onto the 30 point scale', () => {
    const strengths = subjectStrengths({ grades: { Math: 8, Physics: 9, Chemistry: 7 } });
    const estimate = estimateBlockScore(strengths, 'A00');

    expect(estimate.score).toBe(24);
    expect(estimate.isComplete).toBe(true);
    expect(estimate.score).toBeLessThanOrEqual(MAX_BLOCK_SCORE);
  });

  it('fills an unmarked subject with the mean of the known ones and says so', () => {
    const strengths = subjectStrengths({ grades: { Math: 8, Physics: 6 } });
    const estimate = estimateBlockScore(strengths, 'A00');

    const chemistry = estimate.subjects.find(item => item.subject === 'Chemistry');
    expect(chemistry.score).toBe(7);
    expect(chemistry.estimated).toBe(true);
    expect(estimate.isComplete).toBe(false);
    expect(estimate.knownCount).toBe(2);
  });

  it('falls back to the student\'s other subjects when the block itself is unmarked', () => {
    const strengths = subjectStrengths({ grades: { Literature: 9, English: 7 } });
    const estimate = estimateBlockScore(strengths, 'A00');

    expect(estimate.score).toBe(24);
    expect(estimate.knownCount).toBe(0);
    expect(estimate.subjects.every(item => item.estimated)).toBe(true);
  });

  it('returns null when the student has no marks at all, or the block is unknown', () => {
    expect(estimateBlockScore({}, 'A00')).toBeNull();
    expect(estimateBlockScore(subjectStrengths({ grades: { Math: 9 } }), 'ZZ9')).toBeNull();
  });
});

describe('rankBlocks', () => {
  it('puts the student\'s strongest block first', () => {
    const strengths = subjectStrengths({
      grades: { Math: 6, Physics: 5, Literature: 9.5, History: 9.5, Geography: 9.5 }
    });

    expect(rankBlocks(strengths)[0].blockKey).toBe('C00');
  });
});

describe('recommendPathways', () => {
  const strongScience = subjectStrengths({
    grades: { Math: 9.5, Physics: 9.5, Chemistry: 9.5, Biology: 9.5, English: 9.5, Literature: 9.5 }
  });

  it('only suggests majors that touch one of the top three traits', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'S']));
    const pathways = recommendPathways({ profile, strengths: strongScience });

    expect(pathways.length).toBeGreaterThan(0);
    for (const item of pathways) {
      expect(item.traits.some(trait => profile.topTraits.includes(trait))).toBe(true);
    }
  });

  it('ranks a reachable major above an out-of-reach one at equal interest', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'S']));
    const weak = subjectStrengths({ grades: { Math: 4, Chemistry: 4, Biology: 4 } });

    const [best] = recommendPathways({ profile, strengths: weak, limit: 3 });
    const medicine = UNIVERSITY_DB.find(uni => uni.id === 'UNI07');

    expect(best.cutoff).toBeLessThan(medicine.cutoff);
  });

  it('marks how far each major is from the cut-off', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'S']));
    const [best] = recommendPathways({ profile, strengths: strongScience });

    expect(best.margin).toBe(Math.round((best.estimate.score - best.cutoff) * 10) / 10);
    expect(['safe', 'close', 'stretch', 'far']).toContain(best.reach.id);
  });

  it('still ranks by interest when no marks are known', () => {
    const profile = computeRiasecProfile(answersFavouring(['A', 'E']));
    const pathways = recommendPathways({ profile, strengths: {} });

    expect(pathways.length).toBeGreaterThan(0);
    expect(pathways[0].margin).toBeNull();
    expect(pathways[0].reach.id).toBe('unknown');
  });

  it('gives up the last slot for a target to aim for when the rest are all safe', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'S']));
    const strengths = subjectStrengths({ grades: { Math: 8, Physics: 8, Chemistry: 8 } });
    const reachable = (id, cutoff) => ({
      id, name: `Trường ${id}`, code: id, city: 'Hà Nội', major: `Ngành ${id}`,
      group: 'A00', cutoff, fee: '', type: 'public', desc: '', riasecMatches: ['I']
    });

    const pathways = recommendPathways({
      profile,
      strengths,
      universities: [reachable('S1', 20), reachable('S2', 21), reachable('S3', 22), reachable('D1', 29)],
      limit: 3
    });

    const last = pathways[pathways.length - 1];
    expect(last.id).toBe('D1');
    expect(last.aspirational).toBe(true);
    expect(last.margin).toBeLessThan(0);
  });

  it('leaves a stretch option in the real list whenever one exists', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'S']));
    const solid = subjectStrengths({
      grades: { Math: 8, Physics: 8, Chemistry: 8, Biology: 8, English: 8, Literature: 8 }
    });
    const pathways = recommendPathways({ profile, strengths: solid, limit: 5 });

    expect(pathways.some(item => item.margin !== null && item.margin < 0)).toBe(true);
  });

  it('does not let one school fill the shortlist', () => {
    const profile = computeRiasecProfile(answersFavouring(['R', 'I']));
    const pathways = recommendPathways({ profile, strengths: strongScience, limit: 5 });
    const schools = pathways.map(item => item.school);

    expect(new Set(schools).size).toBe(schools.length);
  });

  it('returns nothing without a profile', () => {
    expect(recommendPathways({ profile: null })).toEqual([]);
  });
});

describe('nextSteps', () => {
  /** A first choice sitting `margin` marks below its cut-off. */
  const shortBy = (margin) => ({
    major: 'Y đa khoa',
    cutoff: 26,
    blockKey: 'B00',
    margin,
    estimate: {
      blockKey: 'B00',
      score: 26 + margin,
      knownCount: 3,
      totalCount: 3,
      isComplete: true,
      subjects: [
        { subject: 'Math', name: 'Toán học', score: 9, estimated: false },
        { subject: 'Chemistry', name: 'Hóa học', score: 8, estimated: false },
        { subject: 'Biology', name: 'Sinh học', score: 7.5, estimated: false }
      ]
    }
  });

  it('names the subject to lift and by how much when one subject can cover the gap', () => {
    const step = nextSteps({ pathways: [shortBy(-1.5)] }).find(item => item.id === 'close-gap');

    expect(step).toBeDefined();
    expect(step.text).toContain('Sinh học');
    expect(step.text).toContain('1.5 điểm');
    expect(step.text).toContain('lên 9');
  });

  it('picks a subject the student actually has marks for', () => {
    const step = nextSteps({
      pathways: [{
        ...shortBy(-1),
        estimate: {
          ...shortBy(-1).estimate,
          knownCount: 1,
          subjects: [
            { subject: 'Math', name: 'Toán học', score: 8.5, estimated: false },
            { subject: 'Chemistry', name: 'Hóa học', score: 8.5, estimated: true },
            { subject: 'Biology', name: 'Sinh học', score: 8.5, estimated: true }
          ]
        }
      }]
    }).find(item => item.id === 'close-gap');

    expect(step.text).toContain('Toán học');
    expect(step.text).not.toContain('Hóa học');
  });

  it('spreads the advice across the block when one subject cannot cover the gap', () => {
    const step = nextSteps({ pathways: [shortBy(-6)] }).find(item => item.id === 'close-gap');

    expect(step.text).toContain('Cả ba môn');
    expect(step.text).toContain('Sinh học');
    expect(step.text).not.toContain('là đủ');
  });

  it('says nothing about a gap that does not exist', () => {
    expect(nextSteps({ pathways: [{ ...shortBy(-1.5), margin: 2 }] }).some(step => step.id === 'close-gap')).toBe(false);
  });

  it('asks for a mock paper when a block subject has no marks', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'S']));
    const strengths = subjectStrengths({ grades: { Math: 8 } });
    const pathways = recommendPathways({ profile, strengths });

    const step = nextSteps({ profile, strengths, pathways }).find(item => item.id === 'missing-marks');

    expect(step).toBeDefined();
    expect(step.text).toContain('Thi Thử Đại Học');
  });

  it('flags a flat profile as something to test in real life', () => {
    const flat = computeRiasecProfile(
      RIASEC_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 3 }), {})
    );
    const pathways = recommendPathways({ profile: flat, strengths: {} });

    expect(nextSteps({ profile: flat, pathways }).some(step => step.id === 'flat-profile')).toBe(true);
  });

  it('says nothing about gaps when the first choice is already within reach', () => {
    const profile = computeRiasecProfile(answersFavouring(['I', 'S']));
    const strengths = subjectStrengths({
      grades: { Math: 10, Chemistry: 10, Biology: 10, Physics: 10, English: 10, Literature: 10 }
    });
    const pathways = recommendPathways({ profile, strengths });

    expect(nextSteps({ profile, strengths, pathways }).some(step => step.id === 'close-gap')).toBe(false);
  });
});
