/**
 * Gradebook rules for Vietnamese lower- and upper-secondary schools.
 *
 * Encodes Thông tư 22/2021/TT-BGDĐT (đánh giá học sinh THCS, THPT):
 *   - Điều 6: how many regular assessments a subject requires
 *   - Điều 9 khoản 1: the semester and year average formulas
 *   - Điều 9 khoản 2: the Tốt / Khá / Đạt / Chưa đạt bands
 *   - Điều 15: the Học sinh Giỏi / Xuất sắc titles
 *
 * Every threshold below is a legal figure, not a product decision, so each one
 * is a named constant traceable back to its clause.
 */

export const SCORE_MIN = 0;
export const SCORE_MAX = 10;

/** Weight of the mid-term assessment (ĐĐGgk) — Điều 9 khoản 1. */
const MIDTERM_WEIGHT = 2;
/** Weight of the end-of-term assessment (ĐĐGck) — Điều 9 khoản 1. */
const FINAL_WEIGHT = 3;
/** Semester 2 counts double in the year average — Điều 9 khoản 1. */
const SEMESTER_2_WEIGHT = 2;

/** Số ĐĐGtx theo số tiết/năm học — Điều 6 khoản 1. */
const REGULAR_ASSESSMENT_TIERS = [
  { maxLessonsPerYear: 35, count: 2 },
  { maxLessonsPerYear: 70, count: 3 },
  { maxLessonsPerYear: Infinity, count: 4 }
];

/** Ngưỡng xếp loại kết quả học tập — Điều 9 khoản 2. */
const BAND_THRESHOLDS = {
  GOOD_ALL: 6.5,
  GOOD_HIGHLIGHT: 8.0,
  FAIR_ALL: 5.0,
  FAIR_HIGHLIGHT: 6.5,
  PASS_AT_LEAST: 5.0,
  PASS_FLOOR: 3.5
};

/** "ít nhất 06 (sáu) môn học" xuất hiện ở cả ba mức — Điều 9 khoản 2. */
const MIN_SUBJECTS_AT_HIGHLIGHT = 6;

/** ĐTBmcn ≥ 9,0 cho ít nhất 6 môn để đạt Học sinh Xuất sắc — Điều 15. */
const EXCELLENT_SUBJECT_THRESHOLD = 9.0;

export const LEARNING_BAND = {
  GOOD: 'Tốt',
  FAIR: 'Khá',
  PASS: 'Đạt',
  FAIL: 'Chưa đạt'
};

export const TITLE = {
  EXCELLENT: 'Học sinh Xuất sắc',
  GOOD: 'Học sinh Giỏi'
};

/**
 * Rounds to one decimal place, half away from zero.
 *
 * The epsilon guards against binary representation making a value such as
 * 8.25 land just below the midpoint and round down, which would understate a
 * student's mark.
 */
export function roundGrade(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/** How many regular assessments (ĐĐGtx) a subject needs — Điều 6 khoản 1. */
export function requiredRegularAssessments(lessonsPerYear) {
  const tier = REGULAR_ASSESSMENT_TIERS.find((t) => lessonsPerYear <= t.maxLessonsPerYear);
  return tier.count;
}

/**
 * Validates a single mark before it is stored.
 *
 * @returns {{ valid: boolean, error: string|null, value: number|null }}
 */
export function validateScore(input) {
  if (input === '' || input === null || input === undefined) {
    return { valid: true, error: null, value: null };
  }

  const value = typeof input === 'number' ? input : Number.parseFloat(String(input).replace(',', '.'));

  if (!Number.isFinite(value)) {
    return { valid: false, error: 'Điểm phải là một số.', value: null };
  }
  if (value < SCORE_MIN || value > SCORE_MAX) {
    return { valid: false, error: `Điểm phải nằm trong khoảng ${SCORE_MIN}–${SCORE_MAX}.`, value: null };
  }
  if (Math.round(value * 10) !== value * 10) {
    return { valid: false, error: 'Điểm chỉ được có tối đa 1 chữ số thập phân.', value: null };
  }

  return { valid: true, error: null, value };
}

function collectValidScores(scores) {
  return (scores || [])
    .map((score) => validateScore(score))
    .filter((result) => result.valid && result.value !== null)
    .map((result) => result.value);
}

/**
 * ĐTBmhk = (ΣĐĐGtx + 2·ĐĐGgk + 3·ĐĐGck) / (số ĐĐGtx + 5)  — Điều 9 khoản 1.
 *
 * Returns null while any component is missing: a partial semester has no
 * lawful average, and showing one would mislead parents.
 *
 * @param {{ regular?: number[], midterm?: number, final?: number }} marks
 */
export function computeSemesterAverage({ regular, midterm, final } = {}) {
  const regularScores = collectValidScores(regular);
  const midtermResult = validateScore(midterm);
  const finalResult = validateScore(final);

  if (regularScores.length === 0) return null;
  if (!midtermResult.valid || midtermResult.value === null) return null;
  if (!finalResult.valid || finalResult.value === null) return null;

  const weightedTotal =
    regularScores.reduce((sum, score) => sum + score, 0) +
    MIDTERM_WEIGHT * midtermResult.value +
    FINAL_WEIGHT * finalResult.value;

  const divisor = regularScores.length + MIDTERM_WEIGHT + FINAL_WEIGHT;
  return roundGrade(weightedTotal / divisor);
}

/**
 * ĐTBmcn = (ĐTBmhkI + 2·ĐTBmhkII) / 3 — Điều 9 khoản 1.
 */
export function computeYearAverage(semester1Average, semester2Average) {
  if (!Number.isFinite(semester1Average) || !Number.isFinite(semester2Average)) return null;
  return roundGrade(
    (semester1Average + SEMESTER_2_WEIGHT * semester2Average) / (1 + SEMESTER_2_WEIGHT)
  );
}

function countAtLeast(averages, threshold) {
  return averages.filter((average) => average >= threshold).length;
}

/**
 * Xếp loại kết quả học tập — Điều 9 khoản 2.
 *
 * @param {number[]} subjectAverages ĐTBmhk (or ĐTBmcn) of every graded subject.
 * @param {{ commentOnlyFailures?: number }} options Number of comment-assessed
 *   subjects marked Chưa đạt; those subjects carry no number of their own.
 */
export function classifyLearning(subjectAverages, { commentOnlyFailures = 0 } = {}) {
  const averages = (subjectAverages || []).filter(Number.isFinite);
  if (averages.length === 0) return null;

  const lowest = Math.min(...averages);

  if (
    commentOnlyFailures === 0 &&
    lowest >= BAND_THRESHOLDS.GOOD_ALL &&
    countAtLeast(averages, BAND_THRESHOLDS.GOOD_HIGHLIGHT) >= MIN_SUBJECTS_AT_HIGHLIGHT
  ) {
    return LEARNING_BAND.GOOD;
  }

  if (
    commentOnlyFailures === 0 &&
    lowest >= BAND_THRESHOLDS.FAIR_ALL &&
    countAtLeast(averages, BAND_THRESHOLDS.FAIR_HIGHLIGHT) >= MIN_SUBJECTS_AT_HIGHLIGHT
  ) {
    return LEARNING_BAND.FAIR;
  }

  if (
    commentOnlyFailures <= 1 &&
    lowest >= BAND_THRESHOLDS.PASS_FLOOR &&
    countAtLeast(averages, BAND_THRESHOLDS.PASS_AT_LEAST) >= MIN_SUBJECTS_AT_HIGHLIGHT
  ) {
    return LEARNING_BAND.PASS;
  }

  return LEARNING_BAND.FAIL;
}

/**
 * Danh hiệu cuối năm — Điều 15. Returns null when the student earns neither.
 *
 * @param {{ learningBand: string, conductBand: string, yearAverages: number[] }} record
 */
export function classifyTitle({ learningBand, conductBand, yearAverages = [] }) {
  const bothGood = learningBand === LEARNING_BAND.GOOD && conductBand === LEARNING_BAND.GOOD;
  if (!bothGood) return null;

  const excellentSubjects = countAtLeast(
    yearAverages.filter(Number.isFinite),
    EXCELLENT_SUBJECT_THRESHOLD
  );
  return excellentSubjects >= MIN_SUBJECTS_AT_HIGHLIGHT ? TITLE.EXCELLENT : TITLE.GOOD;
}

/**
 * Explains a semester average so a teacher can check the arithmetic without
 * opening the circular. Returns null when the average cannot be computed.
 */
export function explainSemesterAverage({ regular, midterm, final } = {}) {
  const average = computeSemesterAverage({ regular, midterm, final });
  if (average === null) return null;

  const regularScores = collectValidScores(regular);
  const terms = [
    ...regularScores.map(String),
    `${MIDTERM_WEIGHT}×${validateScore(midterm).value}`,
    `${FINAL_WEIGHT}×${validateScore(final).value}`
  ];

  return {
    average,
    divisor: regularScores.length + MIDTERM_WEIGHT + FINAL_WEIGHT,
    formula: `(${terms.join(' + ')}) / ${regularScores.length + MIDTERM_WEIGHT + FINAL_WEIGHT}`,
    basis: 'Thông tư 22/2021/TT-BGDĐT, Điều 9 khoản 1'
  };
}
