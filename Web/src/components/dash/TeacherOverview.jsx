import { Users, ClipboardList, BarChart3, CheckCircle, Star, ChevronRight, Calendar, Edit3, Plus } from 'lucide-react';
import { Stat, SectionCard, Pill, Bar, Avatar } from './DashUI';

const AV = (n) => `https://i.pravatar.cc/120?img=${n}`;

const CLASSES = [
  { name: '10A2', students: 42, avgGrade: 8.1, attendance: 97, pending: 12, color: 'blue' },
  { name: '10A5', students: 40, avgGrade: 7.6, attendance: 95, pending: 8, color: 'violet' },
  { name: '11A1', students: 44, avgGrade: 8.4, attendance: 99, pending: 23, color: 'mint' },
];

const TO_GRADE = [
  { student: 'Lê Hoàng Nam', cls: '10A2', task: 'Bài tập chương 3', avatar: AV(33) },
  { student: 'Phạm Thuý Vy', cls: '11A1', task: 'Kiểm tra 15 phút', avatar: AV(48) },
  { student: 'Đỗ Gia Bảo', cls: '10A5', task: 'Bài tập chương 3', avatar: AV(15) },
  { student: 'Vũ Khánh Linh', cls: '10A2', task: 'Đề cương ôn tập', avatar: AV(20) },
];

const SCHEDULE = [
  { time: '07:50', cls: '10A2', topic: 'Hàm số bậc hai', color: 'blue' },
  { time: '09:45', cls: '11A1', topic: 'Tổ hợp – xác suất', color: 'mint' },
  { time: '14:00', cls: '10A5', topic: 'Ôn tập chương 3', color: 'violet' },
];

export default function TeacherOverview({ teacherName, onEnterGradesClick, onAssignHomeworkClick }) {
  const honorMatch = teacherName && teacherName.match(/^(Thầy|Cô)/i);
  const honor = honorMatch && honorMatch[1].toLowerCase() === 'thầy' ? 'Thầy' : 'Cô';
  const shortName = teacherName ? teacherName.replace(/^(Thầy|Cô)\s+/i, '').split(' ').pop() : 'Hoa';

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Chào {honor.toLowerCase()} {shortName} {honor === 'Thầy' ? '🌟' : '🌷'}</h1>
          <p className="page-sub">{honor} đang phụ trách <b style={{ color: 'var(--accent)' }}>3 lớp</b> · <b style={{ color: 'var(--accent)' }}>43 bài</b> cần chấm hôm nay.</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost" onClick={onEnterGradesClick}><Edit3 size={17} /> Nhập điểm</button>
          <button className="btn btn-primary" onClick={onAssignHomeworkClick}><Plus size={18} /> Giao bài tập</button>
        </div>
      </div>

      <div className="ds-grid cols-4" style={{ marginBottom: 20 }}>
        <Stat icon={Users} color="mint" val="126" label="Tổng học sinh" sub="3 lớp phụ trách" delay="d1" />
        <Stat icon={ClipboardList} color="orange" val="43" label="Bài cần chấm" sub="Ưu tiên hôm nay" delay="d2" />
        <Stat icon={BarChart3} color="blue" val="8.0" label="GPA trung bình" sub="Cả 3 lớp" trend={0.2} delay="d3" />
        <Stat icon={CheckCircle} color="violet" val="97%" label="Chuyên cần" sub="Tuần này" trend={0.5} delay="d4" />
      </div>

      <div className="ds-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="col" style={{ gap: 20 }}>
          <SectionCard title="Lớp của tôi" icon={Users} delay="d2" action={<button className="btn btn-soft btn-sm">Quản lý lớp</button>}>
            <div className="col" style={{ gap: 12 }}>
              {CLASSES.map((c) => (
                <div key={c.name} className="flex items-center gap-16" style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
                  <div className={`chip-ico bg-${c.color} t-${c.color}`} style={{ width: 52, height: 52, fontFamily: 'Fredoka', fontWeight: 600, fontSize: '1.05rem' }}>{c.name}</div>
                  <div style={{ flex: 1 }}>
                    <div className="flex between items-center">
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>Lớp {c.name}</span>
                      {c.pending > 0 && <Pill color="orange">{c.pending} bài chờ chấm</Pill>}
                    </div>
                    <div className="flex gap-16 muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 8 }}>
                      <span className="flex items-center gap-6"><Users size={14} /> {c.students} HS</span>
                      <span className="flex items-center gap-6"><Star size={14} /> GPA {c.avgGrade}</span>
                      <span className="flex items-center gap-6"><CheckCircle size={14} /> {c.attendance}% chuyên cần</span>
                    </div>
                  </div>
                  <button className="icon-btn"><ChevronRight size={18} /></button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="So sánh điểm trung bình các lớp" icon={BarChart3} delay="d3">
            <div className="col" style={{ gap: 18, paddingTop: 4 }}>
              {CLASSES.map((c) => (
                <div key={c.name}>
                  <div className="flex between" style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Lớp {c.name}</span>
                    <span className={`t-${c.color}`} style={{ fontWeight: 800 }}>{c.avgGrade}</span>
                  </div>
                  <Bar value={c.avgGrade} color={c.color} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="col" style={{ gap: 20 }}>
          <SectionCard title="Hàng đợi chấm bài" icon={ClipboardList} delay="d3" action={<Pill color="orange">43</Pill>}>
            <div className="col" style={{ gap: 6 }}>
              {TO_GRADE.map((g, i) => (
                <div className="row" key={i}>
                  <Avatar src={g.avatar} name={g.student} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{g.student}</div>
                    <div className="muted" style={{ fontSize: '0.78rem' }}>{g.task} · Lớp {g.cls}</div>
                  </div>
                  <button className="btn btn-soft btn-sm">Chấm</button>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 10 }}>Xem tất cả 43 bài</button>
          </SectionCard>

          <SectionCard title="Lịch dạy hôm nay" icon={Calendar} delay="d4">
            <div className="col" style={{ gap: 8 }}>
              {SCHEDULE.map((p, i) => (
                <div className="tt-period" key={i} style={{ borderLeftColor: `var(--${p.color})` }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', minWidth: 48 }}>{p.time}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Lớp {p.cls}</div>
                    <div className="muted" style={{ fontSize: '0.78rem' }}>{p.topic}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
