import { useState } from 'react';
import { MessageSquare, BarChart3, BookOpen, ArrowUp, ArrowDown, CheckCircle, Check, Clock, Wallet, Bus, User, Phone, X } from 'lucide-react';
import { SectionCard, Pill, Bar, Avatar } from './DashUI';
import { LEARNING_BAND, summariseTranscript } from '../../lib/domain/grading';
import { COMMENT_SUBJECTS, subjectName } from '../../config/curriculum';

const CHILD = { name: 'Nguyễn Minh An', classroom: '10A2', studentId: 'HS24-1042', avatar: 'https://i.pravatar.cc/120?img=12', gpa: 8.6, conduct: 'Tốt', rank: 3, attendance: 98 };

const SUBJECTS = [
  { name: 'Toán', grade: 9.2, color: 'blue', trend: 0.4 },
  { name: 'Ngữ văn', grade: 7.8, color: 'pink', trend: -0.2 },
  { name: 'Tiếng Anh', grade: 8.9, color: 'mint', trend: 0.6 },
  { name: 'Vật lý', grade: 8.4, color: 'violet', trend: 0.1 },
  { name: 'Hóa học', grade: 8.0, color: 'orange', trend: 0.3 },
  { name: 'Sinh học', grade: 8.7, color: 'lime', trend: 0 },
  { name: 'Lịch sử', grade: 9.0, color: 'amber', trend: 0.5 },
  { name: 'Địa lý', grade: 8.3, color: 'sky', trend: -0.1 },
];

const TUITION = [
  { label: 'Học phí kỳ II', amount: '4.500.000đ', status: 'Đã đóng', color: 'mint', date: '05/02/2026' },
  { label: 'Quỹ lớp', amount: '300.000đ', status: 'Chưa đóng', color: 'coral', date: 'Hạn 15/6' },
  { label: 'Bảo hiểm y tế', amount: '680.000đ', status: 'Đã đóng', color: 'mint', date: '12/09/2025' },
];

const WEEK = [
  { d: 'T2', status: 'present' }, { d: 'T3', status: 'present' }, { d: 'T4', status: 'present' },
  { d: 'T5', status: 'late' }, { d: 'T6', status: 'present' }, { d: 'T7', status: 'present' },
];
const ATT_MAP = { present: ['mint', 'Có mặt'], late: ['amber', 'Đi muộn'], absent: ['coral', 'Vắng'] };

const BAND_COLOR = {
  [LEARNING_BAND.GOOD]: '#10b981',
  [LEARNING_BAND.FAIR]: '#3b82f6',
  [LEARNING_BAND.PASS]: '#f59e0b',
  [LEARNING_BAND.FAIL]: '#ef4444'
};

const formatMark = (value) => (typeof value === 'string' ? value : Number.isFinite(value) ? value.toFixed(1) : '—');

/**
 * One classification line.
 *
 * When the gradebook does not hold enough subjects the row states that, rather
 * than printing a band. Thông tư 22 needs at least six subjects, so applying it
 * to a partial record would report Chưa đạt for a student with straight tens.
 */
function BandRow({ label, result }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: 130 }}>{label}</span>
      {result.band ? (
        <strong style={{ color: BAND_COLOR[result.band], fontSize: '0.95rem' }}>{result.band}</strong>
      ) : (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Chưa xếp loại — {result.reason}
        </span>
      )}
    </div>
  );
}

export default function ParentOverview({ childName, childClass, student, onSubTabChange, onMainTabChange }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const subjectKeyMap = {
    'Toán': 'Math',
    'Ngữ văn': 'Literature',
    'Vật lý': 'Physics',
    'Tiếng Anh': 'English',
  };
  // Report every subject the student actually holds a result for, not a fixed
  // four. The bands in Thông tư 22 count across the whole timetable, so
  // classifying over a hardcoded subset would understate a full record the
  // moment the school adds a subject.
  //
  // Every nhận xét subject is listed even before it is assessed, so a parent
  // can see what is still outstanding rather than wondering why Giáo dục thể
  // chất is missing from the học bạ.
  const commentResults = Object.fromEntries(
    COMMENT_SUBJECTS.map(subject => [subject.key, student?.commentResults?.[subject.key] || {}])
  );
  const transcript = summariseTranscript({
    semester1: student?.gradesSem1,
    semester2: student?.grades,
    comments: commentResults
  });
  const gradeValues = student?.grades ? Object.values(student.grades).filter(v => typeof v === 'number') : [];
  const calculatedGpa = gradeValues.length
    ? Number((gradeValues.reduce((sum, score) => sum + score, 0) / gradeValues.length).toFixed(1))
    : CHILD.gpa;
  const c = {
    ...CHILD,
    ...(childName ? { name: childName } : {}),
    ...(childClass ? { classroom: childClass } : {}),
    ...(student ? {
      name: student.name,
      classroom: student.class,
      studentId: student.id,
      avatar: student.avatarUrl || CHILD.avatar,
      gpa: calculatedGpa,
    } : {}),
  };
  const firstName = c.name.trim().split(' ').pop();
  const subjects = SUBJECTS.map(subject => {
    const gradeKey = subjectKeyMap[subject.name];
    return gradeKey && student?.grades?.[gradeKey]
      ? { ...subject, grade: student.grades[gradeKey] }
      : subject;
  });
  const unpaidCount = student?.feeStatus?.filter(fee => !fee.paid).length || 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="page-title">Theo dõi bé {firstName} 🧡</h2>
          <p className="page-sub">Tổng quan tình hình học tập của con tại trường.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onSubTabChange && onSubTabChange('qa')}><MessageSquare size={17} /> Nhắn giáo viên chủ nhiệm</button>
      </div>

      <div className="card animate d1" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', background: 'linear-gradient(120deg, var(--accent-soft), var(--surface))' }}>
        <Avatar src={c.avatar} name={c.name} size={66} />
        <div>
          <div className="display" style={{ fontSize: '1.5rem' }}>{c.name}</div>
          <div className="soft" style={{ fontWeight: 600 }}>Lớp {c.classroom} · Mã HS {c.studentId}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="flex gap-16 wrap">
          {[['GPA', c.gpa, 'orange'], ['Hạng', '#' + c.rank, 'amber'], ['Hạnh kiểm', c.conduct, 'mint'], ['Chuyên cần', c.attendance + '%', 'blue']].map(([l, v, col]) => (
            <div key={l} className="center" style={{ padding: '4px 14px' }}>
              <div className={`display t-${col}`} style={{ fontSize: '1.7rem' }}>{v}</div>
              <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="col" style={{ gap: 20 }}>
          <SectionCard title="Điểm các môn của con" icon={BarChart3} delay="d2" action={<button className="btn btn-soft btn-sm" onClick={() => setShowTranscript(true)}>Xem học bạ</button>}>
            <div className="ds-grid cols-2" style={{ gap: 14 }}>
              {subjects.map((sub, i) => (
                <div key={i} className="flex items-center gap-12">
                  <div className={`chip-ico bg-${sub.color} t-${sub.color}`} style={{ width: 38, height: 38 }}><BookOpen size={17} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="flex between" style={{ marginBottom: 5 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{sub.name}</span>
                      <span className="flex items-center gap-6">
                        <span className={`t-${sub.color}`} style={{ fontWeight: 800, fontSize: '0.86rem' }}>{sub.grade}</span>
                        {sub.trend !== 0 && (sub.trend > 0
                          ? <ArrowUp size={13} style={{ color: 'var(--mint)' }} />
                          : <ArrowDown size={13} style={{ color: 'var(--coral)' }} />)}
                      </span>
                    </div>
                    <Bar value={sub.grade} color={sub.color} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Chuyên cần gần đây" icon={CheckCircle} delay="d3">
            <div className="flex gap-8 wrap">
              {WEEK.map((w, i) => {
                const [col, label] = ATT_MAP[w.status];
                return (
                  <div key={i} className={`center bg-${col}`} style={{ flex: 1, minWidth: 80, padding: '14px 8px', borderRadius: 'var(--r-md)', gap: 6 }}>
                    <span className="muted" style={{ fontSize: '0.74rem', fontWeight: 700 }}>{w.d}</span>
                    <div className={`t-${col}`}>{w.status === 'present' ? <Check size={22} /> : <Clock size={22} />}</div>
                    <span className={`t-${col}`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="col" style={{ gap: 20 }}>
          <SectionCard title="Học phí & khoản thu" icon={Wallet} delay="d2">
            <div className="col" style={{ gap: 10 }}>
              {TUITION.map((tt, i) => (
                <div key={i} className="flex between items-center" style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{tt.label}</div>
                    <div className="muted" style={{ fontSize: '0.76rem' }}>{tt.date}</div>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{tt.amount}</span>
                    <Pill color={tt.color}>{tt.status}</Pill>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => onSubTabChange && onSubTabChange(unpaidCount > 0 ? 'fees' : 'wallet')} style={{ width: '100%', marginTop: 12 }}>
              {unpaidCount > 0 ? `Thanh toán ${unpaidCount} khoản còn lại` : 'Xem ví điện tử'}
            </button>
          </SectionCard>

          <SectionCard title="Xe đưa đón" icon={Bus} delay="d3">
            <div className="flex items-center gap-12" style={{ padding: 12, borderRadius: 'var(--r-md)', background: 'var(--mint-soft)' }}>
              <div className="chip-ico bg-mint t-mint" style={{ width: 46, height: 46 }}><Bus size={22} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Tuyến 04 · Đang trên đường về</div>
                <div className="t-mint" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Dự kiến đến điểm đón trong 12 phút</div>
              </div>
            </div>
            <div className="row mt-8">
              <div className="chip-ico bg-blue t-blue" style={{ width: 38, height: 38 }}><User size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Tài xế: Chú Bình</div>
                <div className="muted" style={{ fontSize: '0.76rem' }}>Biển số 29B-123.45</div>
              </div>
              <a className="icon-btn" href="tel:0909123456" aria-label="Gọi điện cho tài xế" title="Gọi điện cho tài xế"><Phone size={17} /></a>
            </div>
            <button className="btn btn-soft btn-sm" onClick={() => onMainTabChange && onMainTabChange('bus_tracker')} style={{ width: '100%', marginTop: 12 }}>
              Xem vị trí xe
            </button>
          </SectionCard>

          <SectionCard title="Tin từ giáo viên" icon={MessageSquare} delay="d4">
            <div className="flex gap-12">
              <Avatar src="https://i.pravatar.cc/120?img=45" name="Cô Hoa" size={42} />
              <div className="col" style={{ gap: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cô Hoa (CN lớp {c.classroom})</span>
                <div style={{ background: 'var(--bg)', padding: '10px 13px', borderRadius: '4px 16px 16px 16px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {firstName} tiến bộ rõ ở môn Toán tuần này. Phụ huynh nhắc con chuẩn bị bài thuyết trình Lịch sử nhé ạ! 😊
                </div>
                <span className="muted" style={{ fontSize: '0.74rem' }}>2 giờ trước</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
      {showTranscript && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white', maxWidth: 560 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Học bạ nhanh của {c.name}</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Lớp {c.classroom} · Mã học sinh {c.studentId}</p>
              </div>
              <button onClick={() => setShowTranscript(false)} className="icon-btn" aria-label="Đóng học bạ"><X size={18} /></button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th scope="col">Môn học</th>
                    <th scope="col">HK I</th>
                    <th scope="col">HK II</th>
                    <th scope="col">Cả năm</th>
                  </tr>
                </thead>
                <tbody>
                  {transcript.subjects.map(row => (
                    <tr key={row.key}>
                      <td style={{ fontWeight: 700 }}>{subjectName(row.key)}</td>
                      <td>{formatMark(row.semester1)}</td>
                      <td>{formatMark(row.semester2)}</td>
                      <td style={{ fontWeight: 700 }}>{formatMark(row.year)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <BandRow label="Xếp loại HK I" result={transcript.bands.semester1} />
              <BandRow label="Xếp loại HK II" result={transcript.bands.semester2} />
              <BandRow label="Xếp loại cả năm" result={transcript.bands.year} />
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Xếp loại theo Thông tư 22/2021/TT-BGDĐT, Điều 9 khoản 2.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowTranscript(false)} style={{ width: '100%', marginTop: 16 }}>Đã xem</button>
          </div>
        </div>
      )}
    </div>
  );
}
