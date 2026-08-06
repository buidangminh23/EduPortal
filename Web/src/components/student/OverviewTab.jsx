import { useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown, ArrowUp, BarChart3, Bell, BookOpen, Calendar, CheckCircle,
  ChevronRight, ClipboardList, Clock, Heart, Plus, Star, Trophy, X
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { BADGE_DEFS } from '../../lib/badges';
import { COMMENT_SUBJECTS, subjectName } from '../../config/curriculum';
import { summariseAttendance } from '../../lib/domain/attendance';
import { readConductBand } from '../../lib/domain/conduct';
import { COMMENT_RESULT, summariseTranscript } from '../../lib/domain/grading';
import { daysBetween, isValidIsoDate, todayIso } from '../../lib/domain/dates';

/**
 * This is the page a pupil opens about themselves, so every figure on it has to
 * come off a record the school actually keeps. The tiles that stood here before
 * did not: hạng #3 trên 42 bạn, chuyên cần 98%, a hạnh kiểm derived from an
 * invented 100-point scale, a badge wall that told every child in the school
 * they had earned "Top 3 lớp", and six timetabled periods with rooms and
 * teachers nobody had entered.
 *
 * There is no class rank anywhere on this screen now, and not only because
 * nothing computes one. Thông tư 22 assesses a pupil against the mức Tốt / Khá /
 * Đạt / Chưa đạt, not against their classmates, and it dropped the old xếp thứ
 * precisely so a child is not handed a position in a queue. If the school later
 * decides it wants ranking, that is the school's decision to make and to
 * publish — it is not a default an app should invent.
 */

/**
 * Marks in `student.grades` belong to học kỳ II, and every figure here says so.
 *
 * The store keeps học kỳ I in `gradesSem1` and writes each new mark into
 * `grades`; there is no term selector to change that. An unlabelled result reads
 * as cả năm, and the year is not settled until học kỳ II closes.
 */
const CURRENT_SEMESTER = 'semester2';

/**
 * Cycled over the subject rows and the lesson list so they can be told apart.
 * Carries no meaning, and every name here has both a `bg-`/`t-` helper class and
 * a `--` token behind it — `lime`, which the old timetable used, has only the
 * token, so that row drew an unstyled chip.
 */
const SUBJECT_COLORS = ['blue', 'pink', 'violet', 'mint', 'orange', 'amber', 'sky'];

/**
 * The exact day strings `timetableSlots` stores, indexed by `Date#getDay()`.
 *
 * `generateSmartTimetable` writes 'Thứ 2'…'Thứ 6', so today's lessons are found
 * by comparing these labels. Any other spelling silently matches nothing and
 * would empty a pupil's day; TeacherOverview reads the same table for the same
 * reason.
 */
const TIMETABLE_DAY_LABEL = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/** How much of each list the overview shows before handing over to its own page. */
const DEADLINES_SHOWN = 4;
const BULLETINS_SHOWN = 2;
const NOTES_SHOWN = 3;
const NOTES_KEPT = 10;

const formatDayMonth = (iso) => (isValidIsoDate(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');

/** Weekday of a stored date, read in UTC so no timezone can shift the day. */
function weekdayOf(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function bulletinTag(bulletin, t) {
  if (bulletin.priority === 'urgent' || bulletin.priority === 'high') return { label: t('Khẩn', 'Urgent'), color: 'coral' };
  if (bulletin.type === 'event' || bulletin.type === 'activity') return { label: t('Hoạt động', 'Activity'), color: 'mint' };
  if (bulletin.type === 'finance') return { label: t('Học phí', 'Tuition'), color: 'amber' };
  if (bulletin.type === 'academic') return { label: t('Học vụ', 'Academic'), color: 'blue' };
  return { label: t('Thông báo', 'Announcement'), color: 'violet' };
}

/**
 * How far off a deadline is, counted in whole calendar days.
 *
 * A deadline carries a date and nothing else, so this says a date and nothing
 * else. The line used to read "Hôm nay, 23:59"; no cut-off time is recorded
 * anywhere, and a pupil works to the hour they are shown.
 */
function formatDue(dateStr, t) {
  const diff = daysBetween(todayIso(), dateStr);
  if (diff === null) return { label: t('Chưa có hạn', 'No due date'), urgent: false };
  if (diff < 0) return { label: t(`Quá hạn ${-diff} ngày`, `${-diff} days overdue`), urgent: true };
  if (diff === 0) return { label: t('Hôm nay', 'Today'), urgent: true };
  if (diff === 1) return { label: t('Ngày mai', 'Tomorrow'), urgent: false };

  const weekday = weekdayOf(dateStr);
  const label = t(
    ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][weekday],
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekday]
  );
  return { label: `${label}, ${formatDayMonth(dateStr)}`, urgent: false };
}

/**
 * Quick notes are the pupil's own scratchpad, held in this browser alone.
 *
 * Storage can be unavailable — private browsing, a locked-down machine, a render
 * with no browser at all — and the overview has to survive that. Losing a
 * scratchpad is a small thing; a screen that throws instead of showing today's
 * timetable is not. Whatever comes back is checked for shape as well as for
 * parse errors: an entry left by an older release, or by anything else writing
 * this key, parses cleanly and then takes the whole page down at `.map`.
 */
function readNotes(studentId) {
  if (!studentId) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(`student_notes_${studentId}`));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function writeNotes(studentId, notes) {
  try {
    localStorage.setItem(`student_notes_${studentId}`, JSON.stringify(notes));
  } catch {
    /* The note stays in this session; nothing else on the page depends on it. */
  }
}

/**
 * One headline figure about this pupil.
 *
 * A figure the school has not recorded is printed as the sentence saying so, in
 * the muted style of an absent value, never as a number. There is no trend arrow
 * on any of these: nothing in the app computes a trend for a xếp loại, and the
 * +0.3 and +1 that used to sit here measured nothing at all.
 */
function Stat({ icon: Icon, color, val, empty, label, sub, delay }) {
  return (
    <div className={`card stat animate ${delay}`}>
      <div className="stat-top">
        <div className={`chip-ico bg-${color} t-${color}`}><Icon size={22} /></div>
      </div>
      <div>
        {val
          ? <div className="stat-val">{val}</div>
          : <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>{empty}</div>}
        <div className="stat-label" style={{ marginTop: 4 }}>{label}</div>
      </div>
      <div className="muted" style={{ fontSize: '0.8rem' }}>{sub}</div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, action, delay, children }) {
  return (
    <div className={`card animate ${delay}`}>
      <div className="card-head">
        <div className="card-title"><Icon size={19} className="t-accent" /> {title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Pill({ color, dot, children }) {
  return <span className={`pill bg-${color} t-${color}`}>{dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: 'currentColor' }} />}{children}</span>;
}

function Bar({ value, color }) {
  return <div className="bar"><i style={{ width: `${Math.min(100, value * 10)}%`, background: `var(--${color})` }} /></div>;
}

/** What a card says when the school has recorded nothing for this pupil yet. */
function EmptyNote({ children }) {
  return (
    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{children}</p>
  );
}

/**
 * One badge, and the line saying what the verdict is made of.
 *
 * Earned or locked is decided by the rule in `lib/badges.js`, the only badge
 * list in the app. The list that used to live in this file hardcoded `got: true`
 * on four of six, so every pupil in the school was told they had earned Top 3
 * lớp and a seven-day streak.
 */
function BadgeTile({ badge }) {
  const Icon = badge.icon;
  return (
    <div
      className={`badge-tile ${badge.earned ? '' : 'locked'}`}
      style={{ background: badge.earned ? `${badge.color}14` : 'var(--bg)', gap: 6 }}
    >
      <div className="bt-ico" style={{ background: '#fff' }}><Icon size={22} color={badge.color} /></div>
      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: badge.earned ? badge.color : 'var(--text-muted)' }}>
        {badge.label}
      </span>
      {badge.note && (
        <span className="muted" style={{ fontSize: '0.68rem', lineHeight: 1.35 }}>{badge.note}</span>
      )}
    </div>
  );
}

/** Runs one badge rule over this pupil; a rule that throws awards nothing. */
function readBadge(badge, student, attendanceLogs, clubApplications) {
  const run = (rule) => {
    if (!rule) return null;
    try {
      return rule(student, attendanceLogs, clubApplications);
    } catch {
      return null;
    }
  };

  return {
    id: badge.id,
    label: badge.label,
    icon: badge.icon,
    color: badge.color,
    earned: run(badge.check) === true,
    note: run(badge.note) || badge.desc
  };
}

export default function OverviewTab({ student, setActiveTab }) {
  const {
    attendanceLogs, leaveRequests, clubApplications, deadlines, bulletins,
    timetableSlots, setStudentSubTab, t
  } = useContext(AppContext);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  /**
   * The scratchpad belongs to whoever the page is about right now.
   *
   * `selectedStudentId` opens on a default and is corrected to the signed-in
   * pupil after the first paint, so this component is handed a second pupil
   * without ever being remounted. A list loaded once at mount would leave that
   * pupil reading someone else's notes, and the next save would file the other
   * child's writing under their id. The owner is therefore stored beside the
   * list, and a list that belongs to somebody else is not used at all.
   */
  const [saved, setSaved] = useState(() => ({ ownerId: student?.id, items: readNotes(student?.id) }));
  const notes = useMemo(
    () => (saved.ownerId === student?.id ? saved.items : readNotes(student?.id)),
    [saved, student?.id]
  );

  /**
   * Kết quả học tập, read the way the học bạ reads it.
   *
   * Every subject the pupil holds a result for is counted, not a hardcoded four:
   * a pupil strong in Hoá học was previously counted by nobody. There is no ĐTB
   * across subjects on this page either — Thông tư 22 defines an average within
   * a subject (Điều 9 khoản 1) and a xếp loại across at least six of them (Điều
   * 9 khoản 2), and nothing in between. The single number that stood here was
   * neither, and a pupil reads it as their result.
   *
   * Every nhận xét subject is listed even before it is assessed, so a pupil can
   * see what is still outstanding rather than wonder where Giáo dục thể chất
   * went.
   */
  const transcript = useMemo(() => {
    const comments = Object.fromEntries(
      COMMENT_SUBJECTS.map(subject => [subject.key, student?.commentResults?.[subject.key] || {}])
    );
    return summariseTranscript({
      semester1: student?.gradesSem1,
      semester2: student?.grades,
      comments
    });
  }, [student?.gradesSem1, student?.grades, student?.commentResults]);

  /**
   * Chuyên cần, off the register, by the same domain rule the pupil's own
   * attendance page and their parent's page use.
   *
   * The old sum counted every status except 'absent', a status this domain has
   * never had, so an unexcused absence counted as attendance and a truant pupil
   * read a high figure. With nothing recorded `rate` is null, which is shown as
   * "Chưa điểm danh" — the 98% that used to stand in for it was invented to look
   * healthy.
   */
  const attendance = useMemo(() => {
    const records = (attendanceLogs || []).filter(log => log.studentId === student?.id);
    const leaves = (leaveRequests || []).filter(request => request.studentId === student?.id);
    return summariseAttendance(records, leaves);
  }, [attendanceLogs, leaveRequests, student?.id]);

  /**
   * Today's lessons, from the class timetable the school entered.
   *
   * The timetable stores a lesson number and the school's bell schedule is not
   * in this app, so a tiết is shown as a tiết. The clock times printed here
   * before — 07:50, 09:45 — were invented, as were the rooms and the teachers
   * beside them ("P.201 · Cô Hoa"), and a pupil reads all three as where to be
   * when.
   */
  const todayLessons = useMemo(() => {
    const todayLabel = TIMETABLE_DAY_LABEL[new Date().getDay()];
    return (timetableSlots || [])
      .filter(slot => slot.classTarget && slot.classTarget === student?.class && slot.dayOfWeek === todayLabel)
      .sort((a, b) => (a.period || 0) - (b.period || 0));
  }, [timetableSlots, student?.class]);

  const badges = useMemo(
    () => BADGE_DEFS.map(badge => readBadge(badge, student, attendanceLogs, clubApplications)),
    [student, attendanceLogs, clubApplications]
  );
  const earnedCount = badges.filter(badge => badge.earned).length;

  /**
   * Subject rows for học kỳ II, with the trend beside them.
   *
   * An arrow is drawn only where both học kỳ carry a mark, because the trend *is*
   * their difference — this is the one comparison the store can answer, and the
   * decorative +0.3 that used to sit on the GPA tile answered nothing.
   */
  const subjectRows = transcript.subjects.map((row, index) => ({
    key: row.key,
    kind: row.kind,
    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    mark: row.kind === 'score' ? row.semester2 : null,
    result: row.kind === 'comment' ? row.semester2 : null,
    trend: row.kind === 'score' && Number.isFinite(row.semester1) && Number.isFinite(row.semester2)
      ? Number((row.semester2 - row.semester1).toFixed(1))
      : null
  }));

  // Sorted by the date each record carries, so "sắp đến hạn" is true of the
  // order as well as of the card.
  const myDeadlines = (deadlines || [])
    .filter(item => !item.done && (item.classTarget === student?.class || item.classTarget === 'personal'))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const dueToday = myDeadlines.filter(item => item.date === todayIso()).length;

  const news = (bulletins || [])
    .filter(item => !item.targetRoles || item.targetRoles.includes('student') || item.targetRoles.includes('all'))
    .slice(0, BULLETINS_SHOWN);

  const learning = transcript.bands[CURRENT_SEMESTER];
  const conductBand = readConductBand(student, CURRENT_SEMESTER);
  const firstName = (student?.name || '').trim().split(' ').pop();

  // Left empty when nothing is timetabled: the card below already says so, and
  // saying it twice on one screen reads as two separate facts.
  const lessonLine = todayLessons.length === 0
    ? ''
    : t(`Hôm nay lớp bạn có ${todayLessons.length} tiết theo thời khoá biểu.`, `Your class has ${todayLessons.length} timetabled lessons today.`);
  const deadlineLine = myDeadlines.length === 0
    ? t('Chưa có mục nào trong lịch của lớp.', 'Nothing is on your class schedule yet.')
    : t(
      `${dueToday} mục đến hạn hôm nay, ${myDeadlines.length} mục chưa hoàn thành.`,
      `${dueToday} due today, ${myDeadlines.length} still open.`
    );

  const openStudentSubTab = (tab) => {
    setStudentSubTab(tab);
    setActiveTab && setActiveTab('dashboard');
  };

  /** Held and stored against the pupil the list was just built for. */
  const rememberNotes = (nextNotes) => {
    setSaved({ ownerId: student?.id, items: nextNotes });
    writeNotes(student?.id, nextNotes);
  };

  const saveQuickNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    rememberNotes([
      {
        id: `NOTE-${Date.now()}`,
        text: noteInput.trim(),
        createdAt: new Date().toISOString(),
      },
      ...notes,
    ].slice(0, NOTES_KEPT));
    setNoteInput('');
    setShowNoteModal(false);
  };

  const deleteQuickNote = (noteId) => {
    rememberNotes(notes.filter(note => note.id !== noteId));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="page-title">
            {firstName
              ? t(`Chào ${firstName}, sẵn sàng học chưa? 🚀`, `Hello ${firstName}, ready to learn? 🚀`)
              : t('Chào bạn, sẵn sàng học chưa? 🚀', 'Hello, ready to learn? 🚀')}
          </h2>
          <p className="page-sub">{[lessonLine, deadlineLine].filter(Boolean).join(' ')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNoteModal(true)}><Plus size={18} /> {t('Ghi chú mới', 'New Note')}</button>
      </div>

      {/* Stats */}
      <div className="ds-grid cols-3" style={{ marginBottom: 20 }}>
        <Stat
          icon={Star}
          color="blue"
          val={learning.band}
          empty={t('Chưa xếp loại', 'Not classified yet')}
          label={t('Kết quả học tập HK II', 'Learning Result, Sem. II')}
          sub={learning.band
            ? t(`Trên ${learning.gradedSubjects} môn đã có điểm`, `Across ${learning.gradedSubjects} graded subjects`)
            : t(
              `Mới có ${learning.gradedSubjects}/${learning.requiredSubjects} môn đủ điểm`,
              `Only ${learning.gradedSubjects}/${learning.requiredSubjects} subjects graded`
            )}
          delay="d1"
        />
        <Stat
          icon={CheckCircle}
          color="mint"
          val={attendance.rate === null ? null : `${attendance.rate}%`}
          empty={t('Chưa điểm danh', 'No register yet')}
          label={t('Chuyên cần', 'Attendance')}
          sub={attendance.total === 0
            ? t('Chưa có buổi điểm danh nào', 'No sessions recorded yet')
            : t(`Trên ${attendance.total} buổi đã ghi nhận`, `Across ${attendance.total} recorded sessions`)}
          delay="d2"
        />
        {/* Kết quả rèn luyện is the form teacher's judgement — Thông tư 22 Điều 8
            gives nothing to compute it from, so this tile only ever reports what
            they entered. The 100-point tally it used to be derived from banded
            pupils as "TB" and "Yếu", two mức that cannot appear on a học bạ. */}
        <Stat
          icon={Heart}
          color="pink"
          val={conductBand}
          empty={t('Chưa đánh giá', 'Not assessed yet')}
          label={t('Kết quả rèn luyện HK II', 'Conduct Result, Sem. II')}
          sub={t('Do giáo viên chủ nhiệm đánh giá', 'Assessed by your form teacher')}
          delay="d3"
        />
      </div>

      <div className="ds-grid ds-split">
        {/* Left */}
        <div className="col" style={{ gap: 20 }}>
          {/* Timetable */}
          <SectionCard title={t('Lịch học hôm nay', 'Today Schedule')} icon={Calendar} delay="d3"
            action={<button className="btn btn-soft btn-sm" onClick={() => setActiveTab && setActiveTab('calendar')}>{t('Cả tuần', 'Full Week')} <ChevronRight size={15} /></button>}>
            {todayLessons.length === 0 ? (
              <EmptyNote>{t('Hôm nay thời khoá biểu chưa xếp tiết nào cho lớp bạn.', 'The timetable has no lessons for your class today.')}</EmptyNote>
            ) : (
              <div className="col" style={{ gap: 9 }}>
                {todayLessons.map((slot, index) => (
                  <div className="tt-period" key={slot.id || index} style={{ borderLeftColor: `var(--${SUBJECT_COLORS[index % SUBJECT_COLORS.length]})` }}>
                    <div style={{ minWidth: 58 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{t(`Tiết ${slot.period}`, `Period ${slot.period}`)}</span>
                    </div>
                    <div className={`chip-ico bg-${SUBJECT_COLORS[index % SUBJECT_COLORS.length]} t-${SUBJECT_COLORS[index % SUBJECT_COLORS.length]}`} style={{ width: 38, height: 38 }}><BookOpen size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{slot.subject}</div>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        {[slot.room, slot.teacherName].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Subject results */}
          <SectionCard title={t('Kết quả các môn (HK II)', 'Subject Results (Sem. II)')} icon={BarChart3} delay="d4"
            action={<button className="btn btn-soft btn-sm" onClick={() => openStudentSubTab('competency_heatmap')}>{t('Chi tiết', 'Details')}</button>}>
            {subjectRows.length === 0 ? (
              <EmptyNote>{t('Chưa có môn nào được nhập kết quả.', 'No subject has a result recorded yet.')}</EmptyNote>
            ) : (
              <div className="ds-grid cols-2" style={{ gap: 14 }}>
                {subjectRows.map((row) => (
                  <div key={row.key} className="flex items-center gap-12" style={{ padding: '4px 2px' }}>
                    <div className={`chip-ico bg-${row.color} t-${row.color}`} style={{ width: 40, height: 40 }}><BookOpen size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div className="flex between" style={{ marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{subjectName(row.key)}</span>
                        {row.kind === 'score' ? (
                          Number.isFinite(row.mark) ? (
                            <span className="flex items-center gap-6">
                              <span className={`t-${row.color}`} style={{ fontWeight: 800, fontSize: '0.88rem' }}>{row.mark.toFixed(1)}</span>
                              {row.trend !== null && row.trend !== 0 && (row.trend > 0
                                ? <ArrowUp size={13} style={{ color: 'var(--mint)' }} aria-label={t(`Tăng ${row.trend} so với HK I`, `Up ${row.trend} from semester I`)} />
                                : <ArrowDown size={13} style={{ color: 'var(--coral)' }} aria-label={t(`Giảm ${Math.abs(row.trend)} so với HK I`, `Down ${Math.abs(row.trend)} from semester I`)} />)}
                            </span>
                          ) : (
                            <span className="muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>{t('Chưa có điểm', 'No mark yet')}</span>
                          )
                        ) : (
                          row.result
                            ? <Pill color={row.result === COMMENT_RESULT.PASS ? 'mint' : 'coral'}>{row.result}</Pill>
                            : <span className="muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>{t('Chưa đánh giá', 'Not assessed yet')}</span>
                        )}
                      </div>
                      {row.kind === 'score' && Number.isFinite(row.mark) && <Bar value={row.mark} color={row.color} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right */}
        <div className="col" style={{ gap: 20 }}>
          {notes.length > 0 && (
            <SectionCard title={t('Ghi chú học tập', 'Study Notes')} icon={Plus} delay="d2">
              <div className="col" style={{ gap: 8 }}>
                {notes.slice(0, NOTES_SHOWN).map(note => (
                  <div key={note.id} className="row" style={{ alignItems: 'flex-start', padding: 10, border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.4 }}>{note.text}</div>
                      <div className="muted" style={{ fontSize: '0.72rem', marginTop: 4 }}>{new Date(note.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <button className="icon-btn" onClick={() => deleteQuickNote(note.id)} aria-label={t('Xóa ghi chú', 'Delete note')}><X size={15} /></button>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Deadlines */}
          <SectionCard title={t('Sắp đến hạn', 'Coming Up')} icon={ClipboardList} delay="d3">
            <div className="col" style={{ gap: 8 }}>
              {myDeadlines.length === 0 && <EmptyNote>{t('Chưa có mục nào trong lịch của lớp 🎉', 'Nothing on your class schedule yet 🎉')}</EmptyNote>}
              {myDeadlines.slice(0, DEADLINES_SHOWN).map((item, index) => {
                const due = formatDue(item.date, t);
                const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
                return (
                  <div className="row" key={item.id || index} style={{ padding: 11, border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                    <div className={`chip-ico bg-${color} t-${color}`} style={{ width: 40, height: 40 }}><ClipboardList size={18} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(item.title)}</div>
                      <div className={`flex items-center gap-6 ${due.urgent ? 't-coral' : 'muted'}`} style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: 2 }}>
                        <Clock size={13} /> {due.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => openStudentSubTab('assignments')}>{t('Xem tất cả bài tập', 'View All Assignments')}</button>
          </SectionCard>

          {/* Badges */}
          <SectionCard
            title={t('Huy hiệu', 'Badges')}
            icon={Trophy}
            delay="d4"
            action={<Pill color="amber">{earnedCount}/{badges.length}</Pill>}
          >
            <div className="ds-grid cols-2" style={{ gap: 10 }}>
              {badges.map(badge => <BadgeTile key={badge.id} badge={badge} />)}
            </div>
          </SectionCard>

          {/* Announcements */}
          <SectionCard title={t('Bảng tin', 'Bulletin News')} icon={Bell} delay="d5">
            <div className="col" style={{ gap: 12 }}>
              {news.length === 0 && <EmptyNote>{t('Nhà trường chưa phát hành thông báo nào.', 'The school has issued no announcements.')}</EmptyNote>}
              {news.map((item, index) => {
                const tag = bulletinTag(item, t);
                return (
                  <div key={item.id || index}>
                    <div className="flex items-center gap-8" style={{ marginBottom: 5 }}>
                      <Pill color={tag.color}>{tag.label}</Pill>
                      <span className="muted" style={{ fontSize: '0.74rem' }}>{formatDayMonth(item.date)}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.4 }}>{t(item.title)}</div>
                    {index === 0 && news.length > 1 && <div style={{ height: 1, background: 'var(--line)', marginTop: 12 }} />}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      {showNoteModal && createPortal((
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white', maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{t('Ghi chú học tập mới', 'New Study Note')}</h3>
              <button className="icon-btn" onClick={() => setShowNoteModal(false)} aria-label={t('Đóng', 'Close')}><X size={18} /></button>
            </div>
            <form onSubmit={saveQuickNote}>
              <div className="form-group">
                <label className="form-label">{t('Nội dung ghi chú', 'Note Content')}</label>
                <textarea
                  className="form-control"
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder={t('Ví dụ: Ôn lại giao thoa sóng trước tiết Vật lý...', 'e.g. Review wave interference before Physics class...')}
                  rows={4}
                  required
                  style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1', resize: 'vertical' }}
                />
              </div>
              <p className="muted" style={{ fontSize: '0.74rem', margin: '0 0 12px' }}>
                {/* Said plainly, because a pupil revising for an exam will
                    otherwise assume the school keeps this for them. */}
                {t('Ghi chú chỉ lưu trên trình duyệt này, nhà trường không nhận được.', 'Notes are kept in this browser only; the school does not receive them.')}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNoteModal(false)} style={{ flex: 1 }}>{t('Hủy', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t('Lưu ghi chú', 'Save Note')}</button>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
