/**
 * Structure of the THPT graduation exam papers, as sat from 2025 onward.
 *
 * The paper changed shape with the first GDPT 2018 cohort: candidates take four
 * subjects (Toán and Ngữ văn compulsory, plus two chosen), and the multiple-
 * choice papers carry three parts rather than one.
 *
 *   Phần I  — trắc nghiệm nhiều lựa chọn, 0,25đ mỗi câu
 *   Phần II — trắc nghiệm đúng/sai, 4 ý mỗi câu, chấm theo thang từng phần
 *   Phần III— trắc nghiệm trả lời ngắn
 *
 * Weights matter: one đúng/sai question is worth a full point, four times a
 * multiple-choice question. Scoring every question as one raw mark — which is
 * what this app used to do — quietly devalues the hardest part of the paper.
 *
 * Each subject's parts multiply out to exactly 10 điểm, and a test asserts it.
 * That invariant is the cheapest guard against a mistyped count or weight.
 *
 * VERIFY BEFORE PRODUCTION USE: transcribed from the published exam structure,
 * not from a school's own copy of the đề minh hoạ. Confirm against the current
 * năm học's announcement before presenting a paper as official.
 */

export const QUESTION_TYPE = {
  /** Nhiều lựa chọn: one of four options. */
  MULTIPLE_CHOICE: 'single',
  /** Đúng/sai: four statements, each judged true or false. */
  TRUE_FALSE: 'tf',
  /** Trả lời ngắn: the candidate writes a value. */
  SHORT_ANSWER: 'short'
};

export const PART_LABEL = {
  [QUESTION_TYPE.MULTIPLE_CHOICE]: 'Phần I — Trắc nghiệm nhiều lựa chọn',
  [QUESTION_TYPE.TRUE_FALSE]: 'Phần II — Trắc nghiệm đúng/sai',
  [QUESTION_TYPE.SHORT_ANSWER]: 'Phần III — Trắc nghiệm trả lời ngắn'
};

/** Điểm tối đa một bài thi. */
export const MAX_SUBJECT_SCORE = 10;

/**
 * Điểm mỗi câu đúng/sai theo số ý trả lời đúng.
 * Index = số ý đúng, nên phần tử 0 là 0 điểm.
 */
export const TRUE_FALSE_POINTS = [0, 0.1, 0.25, 0.5, 1.0];

/** Papers answered in prose, which this app cannot auto-mark. */
const ESSAY = 'essay';
const MULTIPLE_CHOICE_PAPER = 'mcq';

const mcqPaper = (durationMinutes, parts) => ({
  mode: MULTIPLE_CHOICE_PAPER,
  durationMinutes,
  parts
});

/** Toán: 12 nhiều lựa chọn + 4 đúng/sai + 6 trả lời ngắn. */
const MATH_PARTS = [
  { type: QUESTION_TYPE.MULTIPLE_CHOICE, count: 12, pointsEach: 0.25 },
  { type: QUESTION_TYPE.TRUE_FALSE, count: 4, pointsEach: 1.0 },
  { type: QUESTION_TYPE.SHORT_ANSWER, count: 6, pointsEach: 0.5 }
];

/** Lí, Hoá, Sinh: 18 nhiều lựa chọn + 4 đúng/sai + 6 trả lời ngắn. */
const SCIENCE_PARTS = [
  { type: QUESTION_TYPE.MULTIPLE_CHOICE, count: 18, pointsEach: 0.25 },
  { type: QUESTION_TYPE.TRUE_FALSE, count: 4, pointsEach: 1.0 },
  { type: QUESTION_TYPE.SHORT_ANSWER, count: 6, pointsEach: 0.25 }
];

/** Sử, Địa, GDKT&PL, Tin học, Công nghệ: 24 nhiều lựa chọn + 4 đúng/sai. */
const SOCIAL_PARTS = [
  { type: QUESTION_TYPE.MULTIPLE_CHOICE, count: 24, pointsEach: 0.25 },
  { type: QUESTION_TYPE.TRUE_FALSE, count: 4, pointsEach: 1.0 }
];

/** Ngoại ngữ: 40 câu nhiều lựa chọn. */
const LANGUAGE_PARTS = [
  { type: QUESTION_TYPE.MULTIPLE_CHOICE, count: 40, pointsEach: 0.25 }
];

export const EXAM_FORMATS = {
  Math: mcqPaper(90, MATH_PARTS),
  Physics: mcqPaper(50, SCIENCE_PARTS),
  Chemistry: mcqPaper(50, SCIENCE_PARTS),
  Biology: mcqPaper(50, SCIENCE_PARTS),
  History: mcqPaper(50, SOCIAL_PARTS),
  Geography: mcqPaper(50, SOCIAL_PARTS),
  EconomicsLaw: mcqPaper(50, SOCIAL_PARTS),
  Informatics: mcqPaper(50, SOCIAL_PARTS),
  Technology: mcqPaper(50, SOCIAL_PARTS),
  English: mcqPaper(50, LANGUAGE_PARTS),

  // Ngữ văn is sat entirely as tự luận. It is listed so the app can say so
  // rather than silently offering a multiple-choice paper that does not exist.
  Literature: { mode: ESSAY, durationMinutes: 120, parts: [] }
};

/** The two subjects every candidate sits. */
export const COMPULSORY_EXAM_SUBJECTS = ['Literature', 'Math'];

/** How many subjects a candidate chooses on top of the compulsory two. */
export const CHOSEN_EXAM_SUBJECT_COUNT = 2;

export function examFormatFor(subject) {
  return EXAM_FORMATS[subject] || null;
}

/** Whether the paper is answered in prose, so this app cannot auto-mark it. */
export function isEssayPaper(subject) {
  return examFormatFor(subject)?.mode === ESSAY;
}

/** Points a subject's paper is worth in total — 10 for a well-formed format. */
export function formatTotalPoints(format) {
  if (!format) return 0;
  return format.parts.reduce((sum, part) => sum + part.count * part.pointsEach, 0);
}

/** How many questions a full paper carries. */
export function formatQuestionCount(format) {
  if (!format) return 0;
  return format.parts.reduce((sum, part) => sum + part.count, 0);
}

/** Points one question of this type is worth in this subject's paper. */
export function pointsForQuestion(subject, type) {
  const part = examFormatFor(subject)?.parts.find((p) => p.type === type);
  return part ? part.pointsEach : 0;
}

/**
 * Points earned on a đúng/sai question, from how many of its four statements
 * the candidate judged correctly. Scaled to the subject's per-question weight
 * so the published 0,1 / 0,25 / 0,5 / 1,0 scale stays intact where a question
 * is worth a full point.
 */
export function trueFalsePoints(correctStatements, questionPoints = 1.0) {
  const index = Math.max(0, Math.min(TRUE_FALSE_POINTS.length - 1, correctStatements));
  return TRUE_FALSE_POINTS[index] * questionPoints;
}
