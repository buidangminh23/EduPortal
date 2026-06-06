import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Clock } from 'lucide-react';

export default function AttendanceTab({ student }) {
  const { attendanceLogs } = useContext(AppContext);
  const myAttendance = attendanceLogs ? attendanceLogs.filter(l => l.studentId === student.id) : [];

  return (
    <div className="glass-panel animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="var(--accent-secondary)" />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Nhật ký điểm danh chuyên cần</h2>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lớp học: <strong>{student.class}</strong></span>
      </div>

      {/* Quick numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>{myAttendance.filter(l => l.status === 'present').length + 3}</div>
          <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>Ngày đi học đúng giờ</div>
        </div>
        <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>{myAttendance.filter(l => l.status === 'late').length}</div>
          <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>Ngày đi học muộn</div>
        </div>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#64748b' }}>{myAttendance.filter(l => l.status === 'absent').length}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ngày xin phép nghỉ</div>
        </div>
      </div>

      <table className="premium-table">
        <thead>
          <tr>
            <th>Ngày tháng</th>
            <th>Giờ Check-in</th>
            <th>Cổng trường</th>
            <th>Trạng thái chuyên cần</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>01/06/2026</td>
            <td style={{ fontWeight: 600 }}>07:12 AM</td>
            <td>Cổng A (Quét thẻ)</td>
            <td><span className="badge badge-success">Có mặt</span></td>
            <td style={{ color: 'var(--text-muted)' }}>Đúng giờ chào cờ</td>
          </tr>
          <tr>
            <td>02/06/2026</td>
            <td style={{ fontWeight: 600 }}>07:18 AM</td>
            <td>Cổng A (Quét thẻ)</td>
            <td><span className="badge badge-success">Có mặt</span></td>
            <td style={{ color: 'var(--text-muted)' }}>Đúng giờ học</td>
          </tr>
          {myAttendance.map((log) => (
            <tr key={log.id}>
              <td>{log.date.split('-').reverse().join('/')}</td>
              <td style={{ fontWeight: 600 }}>{log.checkInTime} AM</td>
              <td>Cổng B (Nhận diện camera)</td>
              <td>
                <span className={`badge ${log.status === 'present' ? 'badge-success' : log.status === 'late' ? 'badge-danger' : 'badge-secondary'}`}>
                  {log.status === 'present' ? 'Có mặt' : log.status === 'late' ? 'Đi muộn' : 'Nghỉ học'}
                </span>
              </td>
              <td>{log.status === 'late' ? 'Đi muộn sau 07:30' : 'Đã ghi nhận điểm danh'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
