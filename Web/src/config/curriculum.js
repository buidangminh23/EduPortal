/**
 * The subjects the gradebook covers, and how many lessons a year each carries.
 *
 * The lesson count is not decoration: Thông tư 22/2021/TT-BGDĐT Điều 6 sets the
 * number of regular assessments (ĐĐGtx) from it — 2 up to 35 lessons, 3 up to
 * 70, 4 beyond. Getting the count wrong changes the divisor in every average,
 * so it belongs in one declared place rather than hardcoded into a form.
 *
 * Hours follow the GDPT 2018 allocation for upper secondary. A school on a
 * different plan edits this table.
 */

import { requiredRegularAssessments } from '../lib/domain/grading';

export const SUBJECTS = [
  { key: 'Math', name: 'Toán học', lessonsPerYear: 105 },
  { key: 'Literature', name: 'Ngữ văn', lessonsPerYear: 105 },
  { key: 'Physics', name: 'Vật lý', lessonsPerYear: 70 },
  { key: 'English', name: 'Tiếng Anh', lessonsPerYear: 105 }
];

const BY_KEY = new Map(SUBJECTS.map((subject) => [subject.key, subject]));

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
  return requiredRegularAssessments(subject ? subject.lessonsPerYear : 105);
}
