/**
 * Scoring engine for the RIASEC (Holland) career interest inventory.
 *
 * Beyond ranking the six traits it reports the two measures Holland's own model
 * treats as prerequisites for reading a result at all — differentiation (is one
 * interest actually stronger than the others?) and consistency (do the top two
 * sit next to each other on the hexagon?) — so a flat or contradictory profile
 * is labelled as such instead of being presented as a confident recommendation.
 */

import {
  RIASEC_QUESTIONS,
  RIASEC_TRAITS,
  TRAIT_ORDER,
  MAX_ANSWER,
  MAX_TRAIT_SCORE,
  CAREER_PAIRS,
  CAREER_SINGLE
} from './riasecContent';

/** Below this spread (on the 0–100 scale) the traits are too close to rank. */
const FLAT_PROFILE_THRESHOLD = 12;

/** Hexagon neighbours score higher than opposites; see `traitDistance`. */
const CONSISTENCY_BY_DISTANCE = {
  1: { level: 'high', label: 'Nhất quán cao', note: 'Hai nhóm mạnh nhất của em nằm cạnh nhau trên vòng Holland — các ngành phù hợp sẽ hội tụ về một hướng rõ ràng.' },
  2: { level: 'medium', label: 'Nhất quán vừa', note: 'Hai nhóm mạnh nhất khá gần nhau. Em có thể chọn ngành lai giữa hai hướng này.' },
  3: { level: 'low', label: 'Nhất quán thấp', note: 'Hai nhóm mạnh nhất nằm đối diện nhau — sở thích của em trải rộng. Nên thử trải nghiệm thực tế trước khi chốt ngành.' }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const roundTo1 = (value) => Math.round(value * 10) / 10;

/** Steps between two traits around the Holland hexagon (1 = adjacent, 3 = opposite). */
export function traitDistance(traitA, traitB) {
  const a = TRAIT_ORDER.indexOf(traitA);
  const b = TRAIT_ORDER.indexOf(traitB);
  if (a === -1 || b === -1) return 3;

  const gap = Math.abs(a - b);
  return Math.min(gap, TRAIT_ORDER.length - gap);
}

function emptyTraitMap(fill = 0) {
  return TRAIT_ORDER.reduce((acc, trait) => ({ ...acc, [trait]: fill }), {});
}

/**
 * Turn the mean of a trait's answers into the shared 0–10 storage scale.
 *
 * A mean of 1 ("không thích") maps to 2 and a mean of 5 maps to 10, which is
 * exactly what `AiAdvisorTab` produces by summing its two questions — the two
 * surveys therefore write interchangeable rows into `careerTestScores`.
 */
function meanToScore(mean) {
  return roundTo1((mean / MAX_ANSWER) * MAX_TRAIT_SCORE);
}

/** Interest as a 0–100% bar: 0% is "không thích", 100% is "rất thích". */
function meanToPercent(mean) {
  return Math.round(((mean - 1) / (MAX_ANSWER - 1)) * 100);
}

/**
 * Score a set of answers.
 *
 * @param {Record<string, number>} answers Question id → 1..5. Missing entries
 *   are simply not counted, so a partially finished survey still produces a
 *   readable preview rather than a profile skewed towards zero.
 */
export function computeRiasecProfile(answers = {}) {
  const sums = emptyTraitMap(0);
  const counts = emptyTraitMap(0);

  for (const question of RIASEC_QUESTIONS) {
    const value = Number(answers[question.id]);
    if (!Number.isFinite(value) || value < 1 || value > MAX_ANSWER) continue;

    sums[question.trait] += value;
    counts[question.trait] += 1;
  }

  const answeredCount = TRAIT_ORDER.reduce((total, trait) => total + counts[trait], 0);
  const scores = emptyTraitMap(0);
  const percent = emptyTraitMap(0);

  for (const trait of TRAIT_ORDER) {
    // An untouched trait sits at the neutral midpoint rather than at zero, so an
    // unfinished survey does not claim the student dislikes what they skipped.
    const mean = counts[trait] > 0 ? sums[trait] / counts[trait] : 3;
    scores[trait] = meanToScore(mean);
    percent[trait] = meanToPercent(mean);
  }

  return buildProfile({
    scores,
    percent,
    answeredCount,
    totalQuestions: RIASEC_QUESTIONS.length
  });
}

/**
 * Rebuild a profile from a stored `careerTestScores` row.
 *
 * Students who took the older twelve-question version still have a row on the
 * 0–10 scale and no answer sheet, and they should see the same Holland code and
 * guidance as everyone else rather than an empty result panel.
 */
export function profileFromStoredScores(stored) {
  if (!stored) return null;

  const scores = emptyTraitMap(0);
  const percent = emptyTraitMap(0);
  let hasAny = false;

  for (const trait of TRAIT_ORDER) {
    const value = Number(stored[trait]);
    if (!Number.isFinite(value)) continue;

    hasAny = true;
    const bounded = clamp(value, 0, MAX_TRAIT_SCORE);
    scores[trait] = roundTo1(bounded);
    percent[trait] = clamp(meanToPercent((bounded / MAX_TRAIT_SCORE) * MAX_ANSWER), 0, 100);
  }

  if (!hasAny) return null;

  return buildProfile({
    scores,
    percent,
    answeredCount: RIASEC_QUESTIONS.length,
    totalQuestions: RIASEC_QUESTIONS.length,
    fromStorage: true
  });
}

function buildProfile({ scores, percent, answeredCount, totalQuestions, fromStorage = false }) {
  // Ties break on the canonical R-I-A-S-E-C order so the same answers always
  // yield the same Holland code between renders.
  const ranked = TRAIT_ORDER
    .map(trait => ({
      trait,
      score: scores[trait],
      percent: percent[trait],
      ...RIASEC_TRAITS[trait]
    }))
    .sort((a, b) => (b.score - a.score) || (TRAIT_ORDER.indexOf(a.trait) - TRAIT_ORDER.indexOf(b.trait)));

  const highest = ranked[0].score;
  const lowest = ranked[ranked.length - 1].score;
  const differentiation = Math.round(((highest - lowest) / MAX_TRAIT_SCORE) * 100);
  const isFlat = differentiation < FLAT_PROFILE_THRESHOLD;

  const distance = traitDistance(ranked[0].trait, ranked[1].trait);
  const consistency = CONSISTENCY_BY_DISTANCE[distance] || CONSISTENCY_BY_DISTANCE[3];

  const completion = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
  // Confidence is mostly "did you finish?", with a smaller contribution from how
  // clearly the traits separate — a complete but flat survey is still weak
  // evidence for a career recommendation.
  const confidence = Math.round(clamp(completion * 70 + clamp(differentiation, 0, 30), 0, 100));

  return {
    scores,
    percent,
    ranked,
    hollandCode: ranked.slice(0, 3).map(item => item.trait).join(''),
    topTraits: ranked.slice(0, 3).map(item => item.trait),
    differentiation,
    isFlat,
    consistency,
    confidence,
    answeredCount,
    totalQuestions,
    isComplete: answeredCount >= totalQuestions,
    fromStorage
  };
}

/** Canonical two-letter key for `CAREER_PAIRS`, independent of rank order. */
export function pairKey(traitA, traitB) {
  return [traitA, traitB]
    .filter(Boolean)
    .sort((a, b) => TRAIT_ORDER.indexOf(a) - TRAIT_ORDER.indexOf(b))
    .join('');
}

/**
 * Majors, jobs, exam blocks and universities matching a profile's top two
 * traits, widened with the third trait's own suggestions.
 */
export function getCareerGuidance(profile) {
  if (!profile) return null;

  const [first, second, third] = profile.topTraits;
  const pair = CAREER_PAIRS[pairKey(first, second)];
  const fallback = CAREER_SINGLE[first];

  const base = pair || {
    label: RIASEC_TRAITS[first]?.name || 'Đa hướng',
    majors: fallback?.majors || [],
    jobs: fallback?.jobs || [],
    blocks: fallback?.blocks || [],
    unis: []
  };

  const thirdHint = CAREER_SINGLE[third];

  return {
    ...base,
    // The third letter widens the shortlist instead of replacing it: it is the
    // weakest of the three signals, so it only ever adds options.
    alsoConsider: thirdHint
      ? thirdHint.majors.filter(major => !base.majors.includes(major))
      : [],
    caveat: profile.isFlat
      ? 'Sáu nhóm của em đang khá cân bằng, nên hãy xem đây là gợi ý để thử chứ chưa phải kết luận. Trải nghiệm thực tế (CLB, dự án, thực tập ngắn) sẽ cho câu trả lời chính xác hơn bài trắc nghiệm.'
      : null
  };
}

/**
 * One-paragraph plain-text digest of a profile.
 *
 * The counsellor chat needs to talk about the result in a sentence, and having
 * one source for that wording keeps the chat and the result panel from drifting
 * apart as either is edited.
 */
export function summariseProfile(profile) {
  if (!profile) return 'Em chưa hoàn thành bài khảo sát RIASEC.';

  const [top1, top2] = profile.ranked;
  const guidance = getCareerGuidance(profile);

  const parts = [
    `Mã Holland của em là **${profile.hollandCode}** — nổi bật nhất là nhóm ${top1.emoji} **${top1.trait} · ${top1.name}** (${top1.percent}%), kế đến là ${top2.emoji} **${top2.trait} · ${top2.name}** (${top2.percent}%).`,
    `${top1.summary}`
  ];

  if (guidance?.majors?.length) {
    parts.push(`Nhóm ngành hợp gu em nhất: **${guidance.majors.slice(0, 3).join(', ')}**. Khối thi tham khảo: ${guidance.blocks.join(' · ')}.`);
  }

  if (profile.isFlat) {
    parts.push('Lưu ý: điểm sáu nhóm của em chênh nhau rất ít, nên kết quả này mang tính gợi mở hơn là kết luận.');
  }

  return parts.join('\n\n');
}

/**
 * The exact shape `saveCareerTest` expects.
 *
 * Other screens iterate the stored row with `Object.entries(...)` and assume
 * every key except `studentId` is a trait score, so extra metadata must not be
 * smuggled in here.
 */
export function toStorageScores(profile) {
  return TRAIT_ORDER.reduce((row, trait) => ({ ...row, [trait]: profile.scores[trait] }), {});
}

export { RIASEC_QUESTIONS, RIASEC_TRAITS, TRAIT_ORDER, MAX_ANSWER, MAX_TRAIT_SCORE };
