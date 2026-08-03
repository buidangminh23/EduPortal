/**
 * Turns a RIASEC profile into a shortlist this particular student could act on.
 *
 * The Holland code on its own only says what a student is drawn to. It cannot
 * say whether the majors behind that code are within reach, which is the
 * question a Year 12 student is actually asking. This module answers it by
 * scoring every major in the university list on two axes at once:
 *
 *   interest  — how well the major's Holland traits match the survey result
 *   academic  — the student's own marks in that major's exam block, against
 *               last year's cut-off
 *
 * A major only appears if it touches one of the student's three strongest
 * traits, so the shortlist always follows the survey rather than quietly
 * turning into a ranking of whatever is easiest to get into.
 */

import { BLOCKS, SUBJECT_NAMES } from '../../data/mockExamsData';
import { UNIVERSITY_DB } from '../../data/universitiesData';

export const MAX_SUBJECT_SCORE = 10;

/** Three subjects at 10 marks each — the scale every cut-off is quoted on. */
export const MAX_BLOCK_SCORE = 30;

/**
 * Weight of a mock paper against a term mark for the same subject.
 *
 * Mock papers are sat under exam conditions and marked to the national scheme,
 * so they predict the real sitting better than a term average that includes
 * homework and class tests — but a single paper is noisy, hence not 100%.
 */
const MOCK_WEIGHT = 0.6;

/** Margin (in marks, out of 30) between the estimate and the cut-off. */
const REACH_BANDS = [
  { id: 'safe', min: 1, label: 'Trong tầm', note: 'Điểm hiện tại của em đã vượt chuẩn năm ngoái.' },
  { id: 'close', min: -1, label: 'Sát ngưỡng', note: 'Chỉ còn chênh dưới 1 điểm — giữ phong độ là tới.' },
  { id: 'stretch', min: -3, label: 'Cần cố gắng', note: 'Còn thiếu vài điểm, đủ thời gian để bù nếu bắt đầu sớm.' },
  { id: 'far', min: -Infinity, label: 'Thử thách lớn', note: 'Khoảng cách còn xa; nên có thêm nguyện vọng an toàn.' }
];

const UNKNOWN_REACH = { id: 'unknown', label: 'Chưa đủ dữ liệu', note: 'Chưa có điểm của khối này để so với điểm chuẩn.' };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round1 = (value) => Math.round(value * 10) / 10;

/**
 * One 0–10 figure per subject, merging term marks with the latest mock paper.
 *
 * @param {object} args
 * @param {Record<string, number>} args.grades `student.grades`, subject key → mark.
 * @param {Array} args.mockExamHistory Rows written by the mock exam tab.
 * @param {string|null} args.studentId Rows for anybody else are ignored.
 */
export function subjectStrengths({ grades = {}, mockExamHistory = [], studentId = null } = {}) {
  const latestMock = {};

  for (const attempt of mockExamHistory || []) {
    if (studentId && attempt?.studentId && attempt.studentId !== studentId) continue;

    for (const [subject, item] of Object.entries(attempt?.subjectBreakdown || {})) {
      const score = Number(item?.subjectScore);
      if (!Number.isFinite(score)) continue;

      const date = String(attempt?.date || '');
      const previous = latestMock[subject];
      // ISO dates compare correctly as strings, and an undated row loses to a
      // dated one rather than overwriting it.
      if (!previous || date > previous.date) latestMock[subject] = { score, date };
    }
  }

  const strengths = {};
  const subjects = new Set([...Object.keys(grades || {}), ...Object.keys(latestMock)]);

  for (const subject of subjects) {
    const grade = Number(grades?.[subject]);
    const mock = latestMock[subject]?.score;
    const hasGrade = Number.isFinite(grade);
    const hasMock = Number.isFinite(mock);
    if (!hasGrade && !hasMock) continue;

    const blended = hasGrade && hasMock
      ? mock * MOCK_WEIGHT + grade * (1 - MOCK_WEIGHT)
      : (hasMock ? mock : grade);

    strengths[subject] = {
      subject,
      name: SUBJECT_NAMES[subject] || subject,
      score: round1(clamp(blended, 0, MAX_SUBJECT_SCORE)),
      fromMock: hasMock,
      fromGrades: hasGrade
    };
  }

  return strengths;
}

/**
 * Predicted total for one exam block, out of 30.
 *
 * A subject with no marks is filled with the mean of the subjects we do know —
 * those of the block first, and failing that the student's other subjects —
 * and flagged `estimated`, so a student who has never sat Chemistry still gets
 * a usable figure, clearly labelled as a guess rather than a measurement.
 *
 * Filling the gap matters as much as showing it: leaving an unknown block
 * unscored would let a major we cannot assess outrank one we can, which reads
 * to the student as the safer choice when it is only the less examined one.
 * Returns null when the student has no marks at all.
 */
export function estimateBlockScore(strengths = {}, blockKey) {
  const block = BLOCKS[blockKey];
  if (!block) return null;

  const known = block.subjects.filter(subject => strengths[subject]);
  const basis = known.length > 0 ? known : Object.keys(strengths);
  if (basis.length === 0) return null;

  const knownMean = basis.reduce((total, subject) => total + strengths[subject].score, 0) / basis.length;

  const subjects = block.subjects.map(subject => ({
    subject,
    name: SUBJECT_NAMES[subject] || subject,
    score: strengths[subject] ? strengths[subject].score : round1(knownMean),
    estimated: !strengths[subject]
  }));

  return {
    blockKey,
    blockName: block.name,
    score: round1(subjects.reduce((total, item) => total + item.score, 0)),
    subjects,
    knownCount: known.length,
    totalCount: block.subjects.length,
    isComplete: known.length === block.subjects.length
  };
}

/** Exam blocks the student is strongest in, best first. */
export function rankBlocks(strengths = {}, blockKeys = Object.keys(BLOCKS)) {
  return blockKeys
    .map(key => estimateBlockScore(strengths, key))
    .filter(Boolean)
    .sort((a, b) => (b.score - a.score) || (b.knownCount - a.knownCount));
}

function reachFor(margin) {
  if (margin === null) return UNKNOWN_REACH;
  return REACH_BANDS.find(band => margin >= band.min) || REACH_BANDS[REACH_BANDS.length - 1];
}

/** Mean interest across the traits a major is associated with, 0–100. */
function interestFor(profile, traits = []) {
  if (!profile || traits.length === 0) return 50;

  const values = traits
    .map(trait => profile.percent?.[trait])
    .filter(value => Number.isFinite(value));

  if (values.length === 0) return 50;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

/**
 * Majors worth looking at, best fit first.
 *
 * @param {object} args
 * @param {object} args.profile Result of `computeRiasecProfile`.
 * @param {object} args.strengths Result of `subjectStrengths`.
 * @param {number} args.limit How many majors to return.
 * @param {number} args.maxPerSchool Keeps one school from filling the list.
 */
export function recommendPathways({
  profile,
  strengths = {},
  universities = UNIVERSITY_DB,
  limit = 5,
  maxPerSchool = 1
} = {}) {
  if (!profile) return [];

  const topTraits = profile.topTraits || [];

  const scored = universities
    .filter(uni => (uni.riasecMatches || []).some(trait => topTraits.includes(trait)))
    .map(uni => {
      const estimate = estimateBlockScore(strengths, uni.group);
      const margin = estimate ? round1(estimate.score - uni.cutoff) : null;
      const interest = interestFor(profile, uni.riasecMatches);
      // ±2.5 marks around the cut-off covers the whole believable range of
      // "will I get in", so that is what the 0–100 academic axis is scaled to.
      const academic = margin === null ? 50 : Math.round(clamp(50 + margin * 20, 0, 100));

      return {
        id: uni.id,
        school: uni.name,
        code: uni.code,
        major: uni.major,
        city: uni.city,
        fee: uni.fee,
        desc: uni.desc,
        blockKey: uni.group,
        cutoff: uni.cutoff,
        traits: uni.riasecMatches || [],
        estimate,
        margin,
        interest,
        academic,
        reach: reachFor(margin),
        fit: Math.round(interest * 0.55 + academic * 0.45)
      };
    })
    .sort((a, b) => (b.fit - a.fit) || (b.interest - a.interest) || a.cutoff - b.cutoff);

  const perSchool = {};
  const shortlist = [];

  for (const item of scored) {
    const seen = perSchool[item.school] || 0;
    if (seen >= maxPerSchool) continue;

    perSchool[item.school] = seen + 1;
    shortlist.push(item);
    if (shortlist.length >= limit) break;
  }

  // Ranking on reachability alone would hand back a list of things the student
  // can already get into and quietly drop every ambition from view. If nothing
  // in the shortlist is a stretch, the last slot goes to the best-fitting major
  // that is currently out of reach — labelled as the target it is.
  const hasStretch = shortlist.some(item => item.margin !== null && item.margin < 0);
  if (!hasStretch && shortlist.length > 0) {
    const aspiration = scored.find(item =>
      item.margin !== null &&
      item.margin < 0 &&
      !shortlist.some(picked => picked.school === item.school)
    );
    if (aspiration) shortlist[shortlist.length - 1] = { ...aspiration, aspirational: true };
  }

  return shortlist;
}

/**
 * What to do this term, phrased so it can be checked off.
 *
 * Every line is derived from a number already on screen — the gap to a cut-off,
 * a subject with no marks, a flat profile — so the student can see where the
 * advice came from instead of being told to "study harder".
 */
export function nextSteps({ profile, strengths = {}, pathways = [] } = {}) {
  const steps = [];
  const target = pathways[0];
  // The gap advice belongs to the best major still out of reach, which is not
  // always the first row: once the top choice is safe, the useful number is
  // what stands between the student and the one they have to work for.
  const gapTarget = pathways.find(item => item?.estimate && item.margin !== null && item.margin < 0);

  if (gapTarget) {
    const gap = Math.abs(gapTarget.margin);
    // Only a subject with a real mark behind it can be pointed at: telling a
    // student to lift a figure we invented for them is advice about nothing.
    const marked = gapTarget.estimate.subjects.filter(item => !item.estimated);
    const weakest = [...(marked.length > 0 ? marked : gapTarget.estimate.subjects)]
      .sort((a, b) => a.score - b.score)[0];
    const room = round1(MAX_SUBJECT_SCORE - weakest.score);

    // One subject can only carry the gap if it has that much headroom left.
    // Past that, saying "kéo môn này lên" would be arithmetic the student
    // cannot actually perform, so the advice spreads across the block instead.
    steps.push(gap <= room
      ? {
        id: 'close-gap',
        text: `Còn thiếu ${gap} điểm để chạm chuẩn ${gapTarget.major} (${gapTarget.cutoff}) khối ${gapTarget.blockKey}. Kéo ${weakest.name} từ ${weakest.score} lên ${round1(weakest.score + gap)} là đủ.`
      }
      : {
        id: 'close-gap',
        text: `Còn thiếu ${gap} điểm để chạm chuẩn ${gapTarget.major} (${gapTarget.cutoff}) — nhiều hơn phần một môn gánh được. Cả ba môn khối ${gapTarget.blockKey} cần lên trung bình ${round1(gap / gapTarget.estimate.subjects.length)} điểm, bắt đầu từ ${weakest.name} (${weakest.score}).`
      });
  }

  const missing = target?.estimate?.subjects.filter(item => item.estimated) || [];
  if (missing.length > 0) {
    steps.push({
      id: 'missing-marks',
      text: `Chưa có điểm ${missing.map(item => item.name).join(', ')}. Làm một đề thi thử khối ${target.blockKey} ở mục Thi Thử Đại Học để bản đồ này bám sát thực lực hơn.`
    });
  }

  if (profile?.isFlat) {
    const top = profile.ranked?.[0];
    steps.push({
      id: 'flat-profile',
      text: `Sáu nhóm của em còn sát nhau nên danh sách trên mới là hướng để thử. Tham gia một CLB hoặc dự án thuộc nhóm ${top?.trait} · ${top?.name} trong 4–6 tuần rồi làm lại khảo sát.`
    });
  }

  const strongest = rankBlocks(strengths)[0];
  if (strongest && strongest.blockKey !== target?.blockKey) {
    steps.push({
      id: 'strong-block',
      text: `Khối mạnh nhất của em đang là ${strongest.blockKey} (${strongest.score}/${MAX_BLOCK_SCORE}). Nếu muốn chắc suất, hãy thêm một nguyện vọng xét bằng khối này.`
    });
  }

  return steps;
}
