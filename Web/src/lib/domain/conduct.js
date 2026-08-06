/**
 * Kết quả rèn luyện — Thông tư 22/2021/TT-BGDĐT Điều 8.
 *
 * Điều 8 khoản 1 điểm c leaves this judgement to the giáo viên chủ nhiệm: they
 * follow the student through the year, weigh what the subject teachers and the
 * family report, have the student self-assess, and only then choose a mức.
 * Nothing in this file computes that choice, because the circular gives nothing
 * to compute with — Điều 8 describes evidence, never arithmetic. A mức derived
 * from the school's điểm thi đua tally is the school's own invention; it may
 * inform the teacher, but it cannot be written into a học bạ as theirs.
 *
 * The one part the circular settles by rule is the năm học result, which Điều 8
 * khoản 2 điểm b derives from the two semesters. That is the only calculation
 * here.
 *
 * The four mức are the same four words as kết quả học tập, so this module
 * reuses LEARNING_BAND rather than declaring its own set. classifyTitle
 * compares a conduct band against LEARNING_BAND.GOOD; a parallel enum would
 * spell the same word and still fail that comparison, quietly denying every
 * danh hiệu in the school.
 */

import { LEARNING_BAND } from './grading';

/** The four mức, in the order Điều 8 khoản 2 lists them. */
export const CONDUCT_BANDS = [
  LEARNING_BAND.GOOD,
  LEARNING_BAND.FAIR,
  LEARNING_BAND.PASS,
  LEARNING_BAND.FAIL
];

/** Kết quả rèn luyện is assessed per học kỳ — Điều 8 khoản 2 điểm a. */
export const CONDUCT_SEMESTERS = ['semester1', 'semester2'];

/**
 * Ranks the mức so that "từ mức Khá trở lên", the phrasing Điều 8 khoản 2 điểm
 * b uses, can be written once instead of as a list of names at every branch.
 */
const RANK = {
  [LEARNING_BAND.FAIL]: 0,
  [LEARNING_BAND.PASS]: 1,
  [LEARNING_BAND.FAIR]: 2,
  [LEARNING_BAND.GOOD]: 3
};

/** Whether a stored conduct value is one the circular recognises. */
export function isValidConductBand(value) {
  return value === null || value === undefined || CONDUCT_BANDS.includes(value);
}

function isSemesterKey(semester) {
  return CONDUCT_SEMESTERS.includes(semester);
}

/**
 * The mức the giáo viên chủ nhiệm recorded for one semester, or null when they
 * have not assessed it.
 *
 * Null is the point of this function. Kết quả rèn luyện exists only once a
 * teacher has entered it, so every caller must be able to tell "chưa đánh giá"
 * apart from a real mức. A screen that substitutes a default prints a verdict
 * on a child that no teacher ever reached.
 *
 * @param {'semester1'|'semester2'} semester
 * @returns {string|null} one of LEARNING_BAND, or null when unassessed
 */
export function readConductBand(student, semester) {
  if (!isSemesterKey(semester)) return null;
  const band = student?.conductResults?.[semester];
  return CONDUCT_BANDS.includes(band) ? band : null;
}

/**
 * Kết quả rèn luyện cả năm học — Điều 8 khoản 2 điểm b.
 *
 * The clause takes học kỳ II as the base and lets học kỳ I move it by at most
 * one mức:
 *   - Tốt: HKII Tốt, HKI từ Khá trở lên.
 *   - Khá: HKII Khá và HKI từ Đạt trở lên; HKII Đạt và HKI Tốt; HKII Tốt và
 *     HKI Đạt hoặc Chưa đạt.
 *   - Đạt: HKII Đạt và HKI Khá, Đạt hoặc Chưa đạt; HKII Khá và HKI Chưa đạt.
 *   - Chưa đạt: các trường hợp còn lại.
 *
 * Returns null while either semester is unassessed. The year is a function of
 * both, so with one missing there is no result to state — and stating one
 * anyway would put a mức on the học bạ that the second semester might overturn.
 */
export function conductBandForYear(semester1Band, semester2Band) {
  if (!CONDUCT_BANDS.includes(semester1Band)) return null;
  if (!CONDUCT_BANDS.includes(semester2Band)) return null;

  const first = RANK[semester1Band];

  if (semester2Band === LEARNING_BAND.GOOD) {
    return first >= RANK[LEARNING_BAND.FAIR] ? LEARNING_BAND.GOOD : LEARNING_BAND.FAIR;
  }
  if (semester2Band === LEARNING_BAND.FAIR) {
    return first >= RANK[LEARNING_BAND.PASS] ? LEARNING_BAND.FAIR : LEARNING_BAND.PASS;
  }
  if (semester2Band === LEARNING_BAND.PASS) {
    return semester1Band === LEARNING_BAND.GOOD ? LEARNING_BAND.FAIR : LEARNING_BAND.PASS;
  }
  return LEARNING_BAND.FAIL;
}

/** Kết quả rèn luyện cả năm for a student, or null while a semester is missing. */
export function readConductYearBand(student) {
  return conductBandForYear(
    readConductBand(student, 'semester1'),
    readConductBand(student, 'semester2')
  );
}

/**
 * Records the giáo viên chủ nhiệm's assessment for one semester, returning a
 * new student. Passing null clears the entry, which is how a mistake is undone.
 *
 * @param {'semester1'|'semester2'} semester
 * @param {string|null} band One of LEARNING_BAND, or null to clear.
 * @returns {{ student: object, errors: string[] }}
 */
export function applyConductResult(student, semester, band) {
  if (!isSemesterKey(semester)) {
    return { student, errors: ['Học kỳ không hợp lệ.'] };
  }
  if (!isValidConductBand(band)) {
    return {
      student,
      errors: [`Kết quả rèn luyện phải là một trong: ${CONDUCT_BANDS.join(', ')}.`]
    };
  }

  return {
    student: {
      ...student,
      conductResults: { ...(student.conductResults || {}), [semester]: band ?? null }
    },
    errors: []
  };
}
