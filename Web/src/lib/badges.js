/**
 * The badges a student can earn, and the rules that award them.
 *
 * These are shown on a student's own achievements page, beside their academic
 * awards and often in front of whoever is standing next to the screen, so
 * everything here must be something the student themselves earns. A badge for
 * "đóng đủ học phí" used to sit in this list; it published whether a family had
 * paid, so a child from a hộ nghèo household was shown a locked badge telling
 * them they were not a công dân gương mẫu. Money owed by a parent is not a
 * pupil's achievement and does not belong on this page in any form.
 *
 * Subject excellence is deliberately one badge covering every scored subject
 * rather than a named badge per subject. The old list honoured Tiếng Anh, Toán
 * and Vật lí but not Hoá học or Sinh học, so a student strong in Hoá could not
 * earn anything their classmate strong in Lý could. Reading the subject list
 * from `config/curriculum.js` means a school that changes its electives changes
 * nothing here.
 *
 * Each rule carries an optional `note`, a short line saying what the verdict is
 * made of — which marks earned it, how much of the term is on record. A locked
 * badge that cannot say why it is locked is the thing that turns a bảng vinh
 * danh into an argument.
 */

import { Trophy, Star, Zap, Flame, Clock, Heart } from 'lucide-react';
import { ATTENDANCE_STATUS } from './domain/attendance';
import { isScored, subjectName } from '../config/curriculum';

/** The mark that earns recognition, the same in every scored subject. */
export const SUBJECT_EXCELLENCE_MARK = 9.0;

/**
 * How much of a term must be on record before an attendance badge means
 * anything.
 *
 * Three recorded days used to be enough for "Chuyên Cần", so a class that had
 * only just started taking attendance produced badges outranking a student
 * present all term. The floor is derived rather than picked, so a school on a
 * different calendar edits the figures it is built from.
 *
 * VERIFY BEFORE PRODUCTION USE: these are the common upper-secondary figures,
 * not a decision this school has made. Confirm the term length and how large a
 * share of it earns a diligence badge before any bảng vinh danh is printed.
 */
export const CHECK_INS_PER_WEEK = 5;
export const WEEKS_PER_TERM = 17; // 35 teaching weeks a year, split across two terms
export const SESSIONS_PER_TERM = CHECK_INS_PER_WEEK * WEEKS_PER_TERM;

/** At least half a term on record before diligence or punctuality is judged. */
export const TERM_SHARE_REQUIRED = 0.5;
export const MIN_SESSIONS = Math.ceil(SESSIONS_PER_TERM * TERM_SHARE_REQUIRED);

/**
 * Statuses that still count as the student having turned up — the same pair
 * `domain/attendance` counts as attended. Arriving late is a punctuality
 * matter, which "Đúng Giờ Vàng" answers for; it is not an absence.
 */
const ATTENDED = [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE];

/** The student's own check-ins. */
const sessionsOf = (student, attendanceLogs) =>
  (attendanceLogs || []).filter((log) => log.studentId === student.id);

/** Marks the student holds in subjects that carry a number at all — Điều 5. */
const scoredMarks = (student) =>
  Object.entries(student.grades || {}).filter(
    ([key, mark]) => isScored(key) && typeof mark === 'number'
  );

const formatMark = ([key, mark]) => `${subjectName(key)} ${mark.toFixed(1)}`;

/** Says how far along the record is, so a locked badge is never a mystery. */
function attendanceNote(sessions, failing) {
  if (sessions.length < MIN_SESSIONS) {
    return `Mới ghi nhận ${sessions.length}/${MIN_SESSIONS} buổi`;
  }
  const label = `trên ${sessions.length} buổi đã ghi nhận`;
  return failing.length === 0 ? `Trọn vẹn ${label}` : `${failing.length} buổi ${label}`;
}

export const BADGE_DEFS = [
  { id: 'top_gpa',       label: 'Học Bá',           icon: Trophy,   color: '#f59e0b', desc: 'ĐTB HK2 từ 9.0 trở lên',       check: (s) => { const v = Object.values(s.grades||{}); return v.length && v.reduce((a,b)=>a+b,0)/v.length >= 9.0; } },
  { id: 'improver',      label: 'Tiến Bộ Vượt Bậc', icon: Zap,      color: '#6366f1', desc: 'ĐTB tăng ít nhất 0.5 so với HK1', check: (s) => { const v1=Object.values(s.gradesSem1||{}), v2=Object.values(s.grades||{}); if(!v1.length||!v2.length) return false; return v2.reduce((a,b)=>a+b,0)/v2.length - v1.reduce((a,b)=>a+b,0)/v1.length >= 0.5; } },
  {
    id: 'top_subject', label: 'Xuất Sắc Môn Học', icon: Star, color: '#0891b2',
    desc: `Đạt từ ${SUBJECT_EXCELLENCE_MARK.toFixed(1)} ở ít nhất một môn tính điểm`,
    check: (s) => scoredMarks(s).some(([, mark]) => mark >= SUBJECT_EXCELLENCE_MARK),
    note: (s) => {
      const marks = scoredMarks(s);
      if (!marks.length) return 'Chưa có điểm môn nào';
      const excellent = marks.filter(([, mark]) => mark >= SUBJECT_EXCELLENCE_MARK);
      if (excellent.length) return excellent.map(formatMark).join(' · ');
      return `Cao nhất: ${formatMark(marks.reduce((a, b) => (b[1] > a[1] ? b : a)))}`;
    }
  },
  {
    id: 'full_attend', label: 'Chuyên Cần', icon: Flame, color: '#ef4444',
    desc: `Không vắng buổi nào, tính trên ít nhất ${MIN_SESSIONS} buổi đã điểm danh`,
    check: (s, al) => {
      const sessions = sessionsOf(s, al);
      return sessions.length >= MIN_SESSIONS && sessions.every((l) => ATTENDED.includes(l.status));
    },
    note: (s, al) => {
      const sessions = sessionsOf(s, al);
      return attendanceNote(sessions, sessions.filter((l) => !ATTENDED.includes(l.status)));
    }
  },
  {
    id: 'on_time', label: 'Đúng Giờ Vàng', icon: Clock, color: '#10b981',
    desc: `Không đi muộn buổi nào, tính trên ít nhất ${MIN_SESSIONS} buổi đã điểm danh`,
    check: (s, al) => {
      const sessions = sessionsOf(s, al);
      return sessions.length >= MIN_SESSIONS
        && sessions.every((l) => l.status !== ATTENDANCE_STATUS.LATE);
    },
    note: (s, al) => {
      const sessions = sessionsOf(s, al);
      return attendanceNote(sessions, sessions.filter((l) => l.status === ATTENDANCE_STATUS.LATE));
    }
  },
  { id: 'club_member',   label: 'Hoạt Động CLB',     icon: Heart,    color: '#ec4899', desc: 'Tham gia câu lạc bộ trường',     check: (s, al, ca) => (ca||[]).some(a=>a.studentId===s.id && a.status==='approved') },
];
