import { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../../context/AppContext';
import StreakWidget from './StreakWidget';
import {
  Plus, Star, Trophy, CheckCircle, Heart, Calendar,
  ChevronRight, BookOpen, BarChart3, ClipboardList, Clock, Bell, TrendingUp, X
} from 'lucide-react';

const SUBJECT_KEYS = ['Math', 'Literature', 'Physics', 'English'];
const SUBJECT_META = {
  Math: { name: 'Toán', color: 'blue' },
  Literature: { name: 'Ngữ văn', color: 'pink' },
  Physics: { name: 'Vật lý', color: 'violet' },
  English: { name: 'Tiếng Anh', color: 'mint' },
};

const PERIODS = [
  { time: '07:00', subject: 'Chào cờ', room: 'Sân trường', color: 'amber' },
  { time: '07:50', subject: 'Toán', room: 'P.201 · Cô Hoa', color: 'blue' },
  { time: '08:40', subject: 'Tiếng Anh', room: 'P.305 · Thầy Phúc', color: 'mint' },
  { time: '09:45', subject: 'Vật lý', room: 'P.Lab 2 · Thầy Dũng', color: 'violet' },
  { time: '10:35', subject: 'Ngữ văn', room: 'P.201 · Cô Lan', color: 'pink' },
  { time: '14:00', subject: 'Thể dục', room: 'Nhà thi đấu · Thầy Hải', color: 'lime' },
];

const BADGES = [
  { name: 'Chuyên cần', ico: '🎯', color: 'blue', got: true },
  { name: 'Top 3 lớp', ico: '🏆', color: 'amber', got: true },
  { name: 'Mọt sách', ico: '📚', color: 'violet', got: true },
  { name: 'Streak 7', ico: '🔥', color: 'orange', got: true },
  { name: 'Siêu Toán', ico: '🧮', color: 'mint', got: false },
  { name: 'Nhà vô địch', ico: '👑', color: 'pink', got: false },
];

function bulletinTag(b) {
  if (b.priority === 'urgent' || b.priority === 'high') return { label: 'Khẩn', color: 'coral' };
  if (b.type === 'event' || b.type === 'activity') return { label: 'Hoạt động', color: 'mint' };
  if (b.type === 'finance') return { label: 'Học phí', color: 'amber' };
  if (b.type === 'academic') return { label: 'Học vụ', color: 'blue' };
  return { label: 'Thông báo', color: 'violet' };
}
const dmy = (s) => { if (!s) return ''; const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1}`; };

function Stat({ icon: Icon, color, val, label, sub, trend, delay }) {
  return (
    <div className={`card stat animate ${delay}`}>
      <div className="stat-top">
        <div className={`chip-ico bg-${color} t-${color}`}><Icon size={22} /></div>
        {trend != null && (
          <span className="stat-trend" style={{ color: trend >= 0 ? '#166534' : '#b91c1c' }}>
            <TrendingUp size={14} style={{ transform: trend >= 0 ? 'none' : 'scaleY(-1)' }} /> {trend > 0 ? `+${trend}` : trend}
          </span>
        )}
      </div>
      <div>
        <div className="stat-val">{val}</div>
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

function formatDue(dateStr) {
  if (!dateStr) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return { label: 'Hôm nay, 23:59', urgent: true };
  if (diff === 1) return { label: 'Ngày mai', urgent: false };
  if (diff < 0) return { label: 'Quá hạn', urgent: true };
  const wd = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
  return { label: `${wd}, ${d.getDate()}/${d.getMonth() + 1}`, urgent: false };
}

function loadStudentNotes(studentId) {
  if (!studentId) return [];
  const saved = localStorage.getItem(`student_notes_${studentId}`);
  return saved ? JSON.parse(saved) : [];
}

export default function OverviewTab({ student, setActiveTab }) {
  const { attendanceLogs, conductLogs, deadlines, bulletins, setStudentSubTab, t } = useContext(AppContext);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState(() => loadStudentNotes(student?.id));

  const grades = student?.grades || {};
  const gradeVals = SUBJECT_KEYS.map(k => grades[k]).filter(v => typeof v === 'number');
  const gpa = gradeVals.length ? (gradeVals.reduce((a, b) => a + b, 0) / gradeVals.length).toFixed(1) : '—';

  const myAttendance = attendanceLogs ? attendanceLogs.filter(l => l.studentId === student.id) : [];
  const attendancePct = myAttendance.length
    ? Math.round((myAttendance.filter(l => l.status !== 'absent').length / myAttendance.length) * 100)
    : 98;

  const studentConductLogs = conductLogs ? conductLogs.filter(l => l.studentId === student.id) : [];
  const conductScore = 100 + studentConductLogs.reduce((acc, c) => acc + c.points, 0);
  const conductGrade = conductScore >= 90 ? t('Tốt', 'Good') : conductScore >= 70 ? t('Khá', 'Fair') : conductScore >= 50 ? t('TB', 'Average') : t('Yếu', 'Poor');

  const myDeadlines = (deadlines || [])
    .filter(d => !d.done && (d.classTarget === student.class || d.classTarget === 'personal'))
    .slice(0, 4);

  const news = (bulletins || [])
    .filter(b => !b.targetRoles || b.targetRoles.includes('student') || b.targetRoles.includes('all'))
    .slice(0, 2);
  const firstName = (student?.name || 'bạn').trim().split(' ').pop();
  const openStudentSubTab = (tab) => {
    setStudentSubTab(tab);
    setActiveTab && setActiveTab('dashboard');
  };
  const saveQuickNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    const nextNotes = [
      {
        id: `NOTE-${Date.now()}`,
        text: noteInput.trim(),
        createdAt: new Date().toISOString(),
      },
      ...notes,
    ].slice(0, 10);
    setNotes(nextNotes);
    localStorage.setItem(`student_notes_${student.id}`, JSON.stringify(nextNotes));
    setNoteInput('');
    setShowNoteModal(false);
  };
  const deleteQuickNote = (noteId) => {
    const nextNotes = notes.filter(note => note.id !== noteId);
    setNotes(nextNotes);
    localStorage.setItem(`student_notes_${student.id}`, JSON.stringify(nextNotes));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="page-title">{t(`Chào ${firstName}, sẵn sàng học chưa? 🚀`, `Hello ${firstName}, ready to learn? 🚀`)}</h2>
          <p className="page-sub">
            {t('Hôm nay bạn có ', 'Today you have ')}<b style={{ color: 'var(--accent-ink)' }}>{myDeadlines.length} {t('bài tập', 'assignments')}</b> {t('đến hạn và ', 'due and ')}<b style={{ color: 'var(--accent-ink)' }}>{PERIODS.length} {t('tiết học', 'periods')}</b>.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNoteModal(true)}><Plus size={18} /> {t('Ghi chú mới', 'New Note')}</button>
      </div>

      {/* Stats */}
      <div className="ds-grid cols-4" style={{ marginBottom: 20 }}>
        <Stat icon={Star} color="blue" val={gpa} label={t('Điểm trung bình', 'GPA Score')} sub={t('Học kỳ này', 'This Semester')} trend={0.3} delay="d1" />
        <Stat icon={Trophy} color="amber" val="#3" label={t('Hạng trong lớp', 'Class Rank')} sub={t('trên 42 bạn', 'out of 42')} trend={1} delay="d2" />
        <Stat icon={CheckCircle} color="mint" val={`${attendancePct}%`} label={t('Chuyên cần', 'Attendance')} sub={t('Tuyệt vời!', 'Great!')} delay="d3" />
        <Stat icon={Heart} color="pink" val={conductGrade} label={t('Hạnh kiểm', 'Conduct')} sub={t('Học kỳ II', 'Semester II')} delay="d4" />
      </div>

      <div className="ds-grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        {/* Left */}
        <div className="col" style={{ gap: 20 }}>
          {/* Timetable */}
          <SectionCard title={t('Lịch học hôm nay', 'Today Schedule')} icon={Calendar} delay="d3"
            action={<button className="btn btn-soft btn-sm" onClick={() => setActiveTab && setActiveTab('calendar')}>{t('Cả tuần', 'Full Week')} <ChevronRight size={15} /></button>}>
            <div className="col" style={{ gap: 9 }}>
              {PERIODS.map((p, i) => (
                <div className="tt-period" key={i} style={{ borderLeftColor: `var(--${p.color})` }}>
                  <div style={{ minWidth: 52 }}><span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{p.time}</span></div>
                  <div className={`chip-ico bg-${p.color} t-${p.color}`} style={{ width: 38, height: 38 }}><BookOpen size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{p.subject}</div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{p.room}</div>
                  </div>
                  {i === 1 && <Pill color="blue" dot>{t('Sắp tới', 'Upcoming')}</Pill>}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Subject grades */}
          <SectionCard title={t('Điểm các môn', 'Subject Grades')} icon={BarChart3} delay="d4"
            action={<button className="btn btn-soft btn-sm" onClick={() => openStudentSubTab('competency_heatmap')}>{t('Chi tiết', 'Details')}</button>}>
            <div className="ds-grid cols-2" style={{ gap: 14 }}>
              {SUBJECT_KEYS.filter(k => typeof grades[k] === 'number').map((k) => {
                const m = SUBJECT_META[k];
                return (
                  <div key={k} className="flex items-center gap-12" style={{ padding: '4px 2px' }}>
                    <div className={`chip-ico bg-${m.color} t-${m.color}`} style={{ width: 40, height: 40 }}><BookOpen size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div className="flex between" style={{ marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{m.name}</span>
                        <span className={`t-${m.color}`} style={{ fontWeight: 800, fontSize: '0.88rem' }}>{grades[k].toFixed(1)}</span>
                      </div>
                      <Bar value={grades[k]} color={m.color} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right */}
        <div className="col" style={{ gap: 20 }}>
          <StreakWidget />
          {notes.length > 0 && (
            <SectionCard title={t('Ghi chú học tập', 'Study Notes')} icon={Plus} delay="d2">
              <div className="col" style={{ gap: 8 }}>
                {notes.slice(0, 3).map(note => (
                  <div key={note.id} className="row" style={{ alignItems: 'flex-start', padding: 10, border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.4 }}>{note.text}</div>
                      <div className="muted" style={{ fontSize: '0.72rem', marginTop: 4 }}>{new Date(note.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <button className="icon-btn" onClick={() => deleteQuickNote(note.id)} aria-label="Xóa ghi chú"><X size={15} /></button>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {/* Assignments */}
          <SectionCard title={t('Bài tập sắp đến hạn', 'Upcoming Assignments')} icon={ClipboardList} delay="d3">
            <div className="col" style={{ gap: 8 }}>
              {myDeadlines.length === 0 && <div className="muted" style={{ fontSize: '0.85rem', padding: '8px 2px' }}>{t('Không có bài tập nào sắp đến hạn 🎉', 'No upcoming assignments 🎉')}</div>}
              {myDeadlines.map((a, i) => {
                const due = formatDue(a.date);
                const color = ['blue', 'amber', 'mint', 'orange'][i % 4];
                return (
                  <div className="row" key={a.id || i} style={{ padding: 11, border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                    <div className={`chip-ico bg-${color} t-${color}`} style={{ width: 40, height: 40 }}><ClipboardList size={18} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
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
          <SectionCard title={t('Huy hiệu', 'Badges')} icon={Trophy} delay="d4">
            <div className="ds-grid cols-3" style={{ gap: 10 }}>
              {BADGES.map((b, i) => (
                <div className={`badge-tile bg-${b.color} ${b.got ? '' : 'locked'}`} key={i}>
                  <div className="bt-ico" style={{ background: '#fff', fontSize: 26 }}>{b.ico}</div>
                  <span className={`t-${b.color}`} style={{ fontSize: '0.74rem', fontWeight: 700 }}>{b.name}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Announcements */}
          <SectionCard title={t('Bảng tin', 'Bulletin News')} icon={Bell} delay="d5">
            <div className="col" style={{ gap: 12 }}>
              {news.length === 0 && <div className="muted" style={{ fontSize: '0.85rem' }}>{t('Chưa có thông báo mới.', 'No new announcements.')}</div>}
              {news.map((a, i) => {
                const tag = bulletinTag(a);
                return (
                  <div key={a.id || i}>
                    <div className="flex items-center gap-8" style={{ marginBottom: 5 }}>
                      <Pill color={tag.color}>{tag.label}</Pill>
                      <span className="muted" style={{ fontSize: '0.74rem' }}>{dmy(a.date)}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.4 }}>{a.title}</div>
                    {i === 0 && news.length > 1 && <div style={{ height: 1, background: 'var(--line)', marginTop: 12 }} />}
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
              <button className="icon-btn" onClick={() => setShowNoteModal(false)} aria-label="Đóng"><X size={18} /></button>
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
