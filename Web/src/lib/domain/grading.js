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
 * Whether enough subjects carry a mark for the bands to mean anything.
 *
 * Every band in Điều 9 khoản 2 is phrased "... trong đó có ít nhất 06 môn",
 * so the rule presupposes a full timetable. Applied to a partial set it does
 * not report a weaker result — it reports Chưa đạt, because the six-subject
 * clause can never be satisfied. A student with straight tens across four
 * subjects would be labelled failing. Callers must check this before showing
 * a band to anyone.
 */
export function canClassifyLearning(subjectAverages) {
  return (subjectAverages || []).filter(Number.isFinite).length >= MIN_SUBJECTS_AT_HIGHLIGHT;
}

/**
 * Xếp loại kết quả học tập — Điều 9 khoản 2.
 *
 * Returns null when the bands cannot lawfully be applied — no subject graded,
 * or fewer than the six the clause requires. Null means "không xếp loại được",
 * never "Chưa đạt"; conflating the two mislabels good students as failing.
 *
 * @param {number[]} subjectAverages ĐTBmhk (or ĐTBmcn) of every graded subject.
 * @param {{ commentOnlyFailures?: number }} options Number of comment-assessed
 *   subjects marked Chưa đạt; those subjects carry no number of their own.
 */
export function classifyLearning(subjectAverages, { commentOnlyFailures = 0 } = {}) {
  const averages = (subjectAverages || []).filter(Number.isFinite);
  if (!canClassifyLearning(averages)) return null;

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
 * Classifies, and says why when it cannot.
 *
 * The report card needs the distinction: "chưa xếp loại được vì mới có 4/6
 * môn" is a statement about the school's records, while "Chưa đạt" is a
 * statement about the student. Showing the second in place of the first would
 * tell a parent their child is failing because of a gap in the gradebook.
 *
 * @returns {{ band: string|null, gradedSubjects: number, requiredSubjects: number,
 *   sufficient: boolean, reason: string|null }}
 */
export function explainLearningBand(subjectAverages, options = {}) {
  const averages = (subjectAverages || []).filter(Number.isFinite);
  const sufficient = canClassifyLearning(averages);

  let reason = null;
  if (averages.length === 0) {
    reason = 'Chưa có môn nào đủ điểm để tính điểm trung bình môn.';
  } else if (!sufficient) {
    reason =
      `Mới có ${averages.length}/${MIN_SUBJECTS_AT_HIGHLIGHT} môn đủ điểm. ` +
      'Thông tư 22 xếp loại dựa trên ít nhất 6 môn, nên chưa đủ căn cứ xếp loại.';
  }

  return {
    band: sufficient ? classifyLearning(averages, options) : null,
    gradedSubjects: averages.length,
    requiredSubjects: MIN_SUBJECTS_AT_HIGHLIGHT,
    sufficient,
    reason
  };
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
 * Normalises whatever is stored for a subject into the TT22 assessment record
 * `{ regular: number[], midterm, final }`.
 *
 * Two older shapes exist in saved data and both must survive the upgrade:
 *   - `{ oral, quiz15m, test1Period, semester }` — the fixed four-column layout,
 *     which mapped 1-tiết to ĐĐGgk and học kỳ to ĐĐGck.
 *   - a bare number, written when a single average was typed straight in. There
 *     is no way to recover the individual marks behind it, so it is kept as the
 *     final assessment and the rest left blank rather than fabricated.
 *
 * @param {number} regularSlots How many ĐĐGtx the subject requires.
 */
export function toAssessmentRecord(stored, regularSlots = 2) {
  const blank = { regular: Array.from({ length: regularSlots }, () => null), midterm: null, final: null };
  if (stored === null || stored === undefined) return blank;

  if (typeof stored === 'number') {
    return { ...blank, final: validateScore(stored).value };
  }

  if (Array.isArray(stored.regular)) {
    const regular = Array.from({ length: regularSlots }, (_, i) =>
      i < stored.regular.length ? validateScore(stored.regular[i]).value : null
    );
    return { regular, midterm: validateScore(stored.midterm).value, final: validateScore(stored.final).value };
  }

  const legacy = [stored.oral, stored.quiz15m];
  const regular = Array.from({ length: regularSlots }, (_, i) =>
    i < legacy.length ? validateScore(legacy[i]).value : null
  );
  return {
    regular,
    midterm: validateScore(stored.test1Period).value,
    final: validateScore(stored.semester).value
  };
}

/**
 * Checks a whole subject record before it is saved.
 *
 * A partially-filled record is accepted — teachers enter marks across a term,
 * not in one sitting — but an out-of-range mark never is.
 *
 * @returns {{ valid: boolean, errors: string[], complete: boolean }}
 */
export function validateAssessmentRecord({ regular = [], midterm, final } = {}) {
  const errors = [];

  regular.forEach((score, index) => {
    const result = validateScore(score);
    if (!result.valid) errors.push(`Điểm thường xuyên ${index + 1}: ${result.error}`);
  });

  const midtermResult = validateScore(midterm);
  if (!midtermResult.valid) errors.push(`Điểm giữa kỳ: ${midtermResult.error}`);

  const finalResult = validateScore(final);
  if (!finalResult.valid) errors.push(`Điểm cuối kỳ: ${finalResult.error}`);

  const complete = computeSemesterAverage({ regular, midterm, final }) !== null;
  return { valid: errors.length === 0, errors, complete };
}

/**
 * Builds a report card: per-subject averages for both semesters and the year,
 * plus the band each of those three columns supports.
 *
 * Bands come back as explanations rather than bare strings so the report card
 * can distinguish "chưa xếp loại được" from "Chưa đạt" — see explainLearningBand.
 *
 * @param {{ semester1?: Record<string, number>, semester2?: Record<string, number> }} marks
 * @param {string[]} subjectKeys Subjects to report, in display order.
 */
export function summariseTranscript({ semester1 = {}, semester2 = {} } = {}, subjectKeys = []) {
  const keys = subjectKeys.length > 0
    ? subjectKeys
    : [...new Set([...Object.keys(semester1), ...Object.keys(semester2)])];

  const subjects = keys.map((key) => {
    const first = Number.isFinite(semester1[key]) ? semester1[key] : null;
    const second = Number.isFinite(semester2[key]) ? semester2[key] : null;
    return { key, semester1: first, semester2: second, year: computeYearAverage(first, second) };
  });

  const column = (field) => subjects.map((subject) => subject[field]).filter(Number.isFinite);

  return {
    subjects,
    bands: {
      semester1: explainLearningBand(column('semester1')),
      semester2: explainLearningBand(column('semester2')),
      year: explainLearningBand(column('year'))
    }
  };
}

/**
 * Applies a saved assessment record to a student, returning a new student.
 *
 * `grades[subject]` is derived, never typed: it is the ĐTBmhk the marks
 * produce. While the record is incomplete no lawful average exists, and the
 * previously recorded one is left untouched — marks arrive across a term, and
 * students carried over from an older system have an average on file with no
 * component marks behind it. Clearing that because this term's entry is still
 * in progress would destroy a figure the school cannot recover.
 *
 * @returns {{ student: object, average: number|null, errors: string[] }}
 */
export function applySubjectRecord(student, subject, record) {
  const check = validateAssessmentRecord(record);
  if (!check.valid) return { student, average: null, errors: check.errors };

  const average = computeSemesterAverage(record);

  return {
    student: {
      ...student,
      grades: average === null ? student.grades : { ...student.grades, [subject]: average },
      gradesDetailed: { ...(student.gradesDetailed || {}), [subject]: record }
    },
    average,
    errors: []
  };
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
