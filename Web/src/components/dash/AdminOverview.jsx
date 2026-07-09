import { useContext } from 'react';
import { Users, GraduationCap, CheckCircle, Star, BarChart3, Bell, Clock, Calendar, Wallet, Edit3, AlertTriangle, LayoutGrid } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { Stat, SectionCard, Bar } from './DashUI';

const SCHOOL_STATS = [
  { icon: Users, label: 'Tổng học sinh', val: '1.842', sub: '+64 năm nay', color: 'blue', trend: 3.6 },
  { icon: GraduationCap, label: 'Giáo viên', val: '128', sub: '12 tổ bộ môn', color: 'mint', trend: 2 },
  { icon: CheckCircle, label: 'Tỉ lệ chuyên cần', val: '96.8%', sub: 'Tuần này', color: 'violet', trend: 0.4 },
  { icon: Star, label: 'GPA toàn trường', val: '7.9', sub: 'Học kỳ II', color: 'orange', trend: 0.2 },
];

const GRADE_DIST = [
  { label: 'Khối 10', value: 7.8, students: 624, color: 'blue' },
  { label: 'Khối 11', value: 8.1, students: 598, color: 'violet' },
  { label: 'Khối 12', value: 8.4, students: 620, color: 'mint' },
];

const ACTIVITY = [
  { who: 'Cô Phạm Lan', action: 'đã nhập điểm KT 1 tiết lớp 11A3', time: '5 phút trước', icon: Edit3, color: 'blue' },
  { who: 'Phòng đào tạo', action: 'cập nhật thời khóa biểu tuần 38', time: '40 phút trước', icon: Calendar, color: 'violet' },
  { who: 'Thầy Trần Hải', action: 'điểm danh vắng 3 HS lớp 10A1', time: '1 giờ trước', icon: AlertTriangle, color: 'coral' },
  { who: 'Hệ thống', action: 'sao lưu dữ liệu định kỳ thành công', time: '3 giờ trước', icon: CheckCircle, color: 'mint' },
];

const QUICK = [
  { label: 'Quản lý HS', icon: GraduationCap, color: 'blue', action: 'students' },
  { label: 'Quản lý GV', icon: Users, color: 'mint', action: 'teachers' },
  { label: 'Thời khóa biểu', icon: Calendar, color: 'violet', action: 'timetable' },
  { label: 'Thu học phí', icon: Wallet, color: 'orange', action: 'finance' },
];

const ATTENDANCE = [['Khối 10', 95.6, 'blue'], ['Khối 11', 96.9, 'violet'], ['Khối 12', 98.0, 'mint']];

const NEWS = [
  { title: 'Lịch thi học kỳ II năm học 2025–2026', tagColor: 'coral', time: '2 giờ trước' },
  { title: 'Đăng ký CLB học kỳ hè', tagColor: 'mint', time: 'Hôm qua' },
  { title: 'Nghỉ lễ & lịch học bù', tagColor: 'violet', time: '3 ngày trước' },
];

export default function AdminOverview({
  onOpenStudents,
  onOpenTeachers,
  onOpenTimetable,
  onOpenJournal,
  onOpenFinance,
  onOpenAnnouncements,
  onOpenMockExams,
}) {
  const { students, teachers, attendanceLogs, bulletins } = useContext(AppContext);

  const downloadCsv = (filename, rows) => {
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    const totalFees = (students || []).reduce((sum, student) => (
      sum + (student.feeStatus || []).reduce((feeSum, fee) => feeSum + (fee.paid ? fee.amount : 0), 0)
    ), 0);
    const rows = [
      ['Chi so', 'Gia tri'],
      ['Tong hoc sinh', students?.length || 0],
      ['Tong giao vien', teachers?.length || 0],
      ['Luot diem danh', attendanceLogs?.length || 0],
      ['Thong bao da phat hanh', bulletins?.length || 0],
      ['Tong hoc phi da thu', totalFees],
    ];
    downloadCsv(`bao-cao-eduportal-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleQuickAction = (action) => {
    if (action === 'students') onOpenStudents && onOpenStudents();
    if (action === 'teachers') onOpenTeachers && onOpenTeachers();
    if (action === 'timetable') onOpenTimetable && onOpenTimetable();
    if (action === 'finance') onOpenFinance && onOpenFinance();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="page-title">Tổng quan nhà trường 🏫</h2>
          <p className="page-sub">Trường THPT Nguyễn Du · Năm học 2025–2026 · Học kỳ II</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost" onClick={handleExportReport}><BarChart3 size={17} /> Xuất báo cáo</button>
          <button className="btn btn-primary" onClick={onOpenAnnouncements}><Bell size={17} /> Gửi thông báo</button>
        </div>
      </div>

      <div className="ds-grid cols-4" style={{ marginBottom: 20 }}>
        {SCHOOL_STATS.map((st, i) => (
          <Stat key={i} icon={st.icon} color={st.color} val={st.val} label={st.label} sub={st.sub} trend={st.trend} delay={`d${i + 1}`} />
        ))}
      </div>

      <div className="ds-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="col" style={{ gap: 20 }}>
          <SectionCard title="Sĩ số & GPA theo khối" icon={BarChart3} delay="d2" action={<button className="btn btn-soft btn-sm" onClick={onOpenMockExams}>Năm học 2025–2026</button>}>
            <div className="flex" style={{ gap: 20, alignItems: 'flex-end', height: 210, padding: '10px 0' }}>
              {GRADE_DIST.map((g, i) => (
                <div key={i} className="col" style={{ flex: 1, alignItems: 'center', gap: 10, height: '100%', justifyContent: 'flex-end' }}>
                  <span className={`t-${g.color}`} style={{ fontWeight: 800 }}>{g.value}</span>
                  <div style={{ width: '60%', maxWidth: 70, height: `${g.value / 10 * 100}%`, borderRadius: '12px 12px 0 0', background: `var(--${g.color})` }} />
                  <div className="center" style={{ gap: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{g.label}</span>
                    <span className="muted" style={{ fontSize: '0.74rem' }}>{g.students} HS</span>
                  </div>
                </div>
              ))}
              <div className="col center" style={{ flex: 1, gap: 10, height: '100%', justifyContent: 'flex-end', borderLeft: '1px dashed var(--line-strong)' }}>
                <span className="display t-violet" style={{ fontSize: '1.6rem' }}>7.9</span>
                <span className="muted" style={{ fontSize: '0.74rem', fontWeight: 700, textAlign: 'center' }}>GPA<br />toàn trường</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Hoạt động gần đây" icon={Clock} delay="d3" action={<button className="btn btn-soft btn-sm" onClick={onOpenJournal}>Nhật ký</button>}>
            <div className="col" style={{ gap: 4 }}>
              {ACTIVITY.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div className="row" key={i}>
                    <div className={`chip-ico bg-${a.color} t-${a.color}`} style={{ width: 40, height: 40 }}><Icon size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}><b>{a.who}</b> {a.action}</div>
                      <div className="muted" style={{ fontSize: '0.76rem' }}>{a.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="col" style={{ gap: 20 }}>
          <SectionCard title="Truy cập nhanh" icon={LayoutGrid} delay="d2">
            <div className="ds-grid cols-2" style={{ gap: 12 }}>
              {QUICK.map((q, i) => {
                const Icon = q.icon;
                return (
                  <button key={i} onClick={() => handleQuickAction(q.action)} className={`badge-tile bg-${q.color}`} style={{ cursor: 'pointer', border: 'none' }}>
                    <div className={`bt-ico t-${q.color}`} style={{ background: '#fff' }}><Icon size={24} /></div>
                    <span className={`t-${q.color}`} style={{ fontSize: '0.8rem', fontWeight: 700 }}>{q.label}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Tỉ lệ chuyên cần theo khối" icon={CheckCircle} delay="d3">
            <div className="col" style={{ gap: 16, paddingTop: 4 }}>
              {ATTENDANCE.map(([l, v, col]) => (
                <div key={l}>
                  <div className="flex between" style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{l}</span>
                    <span className={`t-${col}`} style={{ fontWeight: 800 }}>{v}%</span>
                  </div>
                  <Bar value={v} max={100} color={col} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Thông báo mới nhất" icon={Bell} delay="d4">
            <div className="col" style={{ gap: 12 }}>
              {NEWS.map((a, i) => (
                <div key={i} className="flex gap-12">
                  <div className={`chip-ico bg-${a.tagColor} t-${a.tagColor}`} style={{ width: 36, height: 36 }}><Bell size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.4 }}>{a.title}</div>
                    <div className="muted" style={{ fontSize: '0.74rem', marginTop: 2 }}>{a.time}</div>
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
