/**
 * The subject list a school teaches, following the upper-secondary programme
 * currently in force — Chương trình GDPT 2018, named for the year it was issued
 * rather than the year it is taught. It reached lớp 12 in 2024-2025 and is what
 * students sit today; there is no later programme to follow.
 *
 * Two fields carry legal weight and are not cosmetic:
 *
 *   `lessonsPerYear` — Thông tư 22/2021/TT-BGDĐT Điều 6 khoản 1 sets the number
 *   of regular assessments (ĐĐGtx) from it: 2 up to 35 tiết, 3 up to 70, 4
 *   beyond. That count is the divisor in every semester average, so a wrong
 *   figure here quietly changes every mark in the school.
 *
 *   `assessment` — Điều 5 splits subjects into those graded with marks and
 *   those graded by nhận xét only (Đạt / Chưa đạt). A comment-assessed subject
 *   has no average, so it never enters the ĐTB or the band arithmetic; it can
 *   only block a band by being marked Chưa đạt.
 *
 * Hours below are the 35-week allocation for upper secondary. A school running
 * a different plan — or a different Ngoại ngữ 1 — edits this table, and nothing
 * else has to change.
 *
 * VERIFY BEFORE PRODUCTION USE: these figures are transcribed from the
 * programme, not read out of a school's own decision. Confirm them against the
 * school's kế hoạch giáo dục before any real report card is issued.
 */

import { requiredRegularAssessments } from '../lib/domain/grading';

/** How a subject is graded — Thông tư 22 Điều 5. */
export const ASSESSMENT = {
  /** Nhận xét kết hợp điểm số: carries a numeric average. */
  SCORE: 'score',
  /** Nhận xét only: Đạt / Chưa đạt, no number. */
  COMMENT: 'comment'
};

/** Whether every student takes the subject, or chooses it. */
export const TRACK = {
  COMPULSORY: 'compulsory',
  ELECTIVE: 'elective'
};

export const SUBJECTS = [
  // ── Môn học bắt buộc ────────────────────────────────────────────────────
  { key: 'Literature', name: 'Ngữ văn', lessonsPerYear: 105, assessment: ASSESSMENT.SCORE, track: TRACK.COMPULSORY },
  { key: 'Math', name: 'Toán', lessonsPerYear: 105, assessment: ASSESSMENT.SCORE, track: TRACK.COMPULSORY },
  { key: 'English', name: 'Tiếng Anh (Ngoại ngữ 1)', lessonsPerYear: 105, assessment: ASSESSMENT.SCORE, track: TRACK.COMPULSORY },
  { key: 'History', name: 'Lịch sử', lessonsPerYear: 52, assessment: ASSESSMENT.SCORE, track: TRACK.COMPULSORY },
  { key: 'DefenceEducation', name: 'Giáo dục quốc phòng và an ninh', lessonsPerYear: 35, assessment: ASSESSMENT.SCORE, track: TRACK.COMPULSORY },
  { key: 'PhysicalEducation', name: 'Giáo dục thể chất', lessonsPerYear: 70, assessment: ASSESSMENT.COMMENT, track: TRACK.COMPULSORY },
  { key: 'ExperientialActivities', name: 'Hoạt động trải nghiệm, hướng nghiệp', lessonsPerYear: 105, assessment: ASSESSMENT.COMMENT, track: TRACK.COMPULSORY },
  { key: 'LocalContent', name: 'Nội dung giáo dục của địa phương', lessonsPerYear: 35, assessment: ASSESSMENT.COMMENT, track: TRACK.COMPULSORY },

  // ── Môn học lựa chọn (học sinh chọn 4) ──────────────────────────────────
  { key: 'Geography', name: 'Địa lí', lessonsPerYear: 70, assessment: ASSESSMENT.SCORE, track: TRACK.ELECTIVE },
  { key: 'EconomicsLaw', name: 'Giáo dục kinh tế và pháp luật', lessonsPerYear: 70, assessment: ASSESSMENT.SCORE, track: TRACK.ELECTIVE },
  { key: 'Physics', name: 'Vật lí', lessonsPerYear: 70, assessment: ASSESSMENT.SCORE, track: TRACK.ELECTIVE },
  { key: 'Chemistry', name: 'Hoá học', lessonsPerYear: 70, assessment: ASSESSMENT.SCORE, track: TRACK.ELECTIVE },
  { key: 'Biology', name: 'Sinh học', lessonsPerYear: 70, assessment: ASSESSMENT.SCORE, track: TRACK.ELECTIVE },
  { key: 'Technology', name: 'Công nghệ', lessonsPerYear: 70, assessment: ASSESSMENT.SCORE, track: TRACK.ELECTIVE },
  { key: 'Informatics', name: 'Tin học', lessonsPerYear: 70, assessment: ASSESSMENT.SCORE, track: TRACK.ELECTIVE },
  { key: 'Music', name: 'Âm nhạc', lessonsPerYear: 70, assessment: ASSESSMENT.COMMENT, track: TRACK.ELECTIVE },
  { key: 'FineArts', name: 'Mĩ thuật', lessonsPerYear: 70, assessment: ASSESSMENT.COMMENT, track: TRACK.ELECTIVE }
];

const BY_KEY = new Map(SUBJECTS.map((subject) => [subject.key, subject]));

/** Fallback hours for a subject not in the table, used only to size the form. */
const DEFAULT_LESSONS_PER_YEAR = 70;

export function findSubject(key) {
  return BY_KEY.get(key) || null;
}

/** Vietnamese name of a subject, falling back to its key for unknown subjects. */
export function subjectName(key) {
  return BY_KEY.get(key)?.name || key;
}

/** How many ĐĐGtx this subject requires — Điều 6 khoản 1. */
export function regularSlotsFor(key) {
  const subject = BY_KEY.get(key);
  return requiredRegularAssessments(subject ? subject.lessonsPerYear : DEFAULT_LESSONS_PER_YEAR);
}

/** Whether the subject is graded with marks at all — Điều 5. */
export function isScored(key) {
  return (BY_KEY.get(key)?.assessment ?? ASSESSMENT.SCORE) === ASSESSMENT.SCORE;
}

/**
 * Subjects a teacher enters numbers for.
 *
 * Comment-assessed subjects are excluded: they take Đạt / Chưa đạt, and a
 * numeric form would invite a mark the circular does not recognise.
 */
export const SCORED_SUBJECTS = SUBJECTS.filter((subject) => subject.assessment === ASSESSMENT.SCORE);

/** Subjects recorded as Đạt / Chưa đạt. Entering these is not built yet. */
export const COMMENT_SUBJECTS = SUBJECTS.filter((subject) => subject.assessment === ASSESSMENT.COMMENT);
