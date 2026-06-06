import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Award } from 'lucide-react';

export default function ConductTab({ student }) {
  const { conductLogs } = useContext(AppContext);
  const studentConductLogs = conductLogs ? conductLogs.filter(l => l.studentId === student.id) : [];
  const conductScore = 100 + studentConductLogs.reduce((acc, curr) => acc + curr.points, 0);
  const conductGrade = conductScore >= 90 ? 'Tốt' : conductScore >= 70 ? 'Khá' : conductScore >= 50 ? 'Trung bình' : 'Yếu';

  return (
    <div className="glass-panel animate-fade">
      <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
        <Award size={18} color="var(--accent-secondary)" />
        <span>Điểm Rèn Luyện & Thi Đua Lớp {student.class}</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '30px', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ĐIỂM HIỆN TẠI</span>
          <h2 style={{ fontSize: '3rem', margin: '8px 0', color: 'var(--accent-secondary)' }}>{conductScore}</h2>
          <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>Xếp loại: {conductGrade}</span>
        </div>

        <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          <strong>Quy chế điểm rèn luyện:</strong>
          <ul>
            <li>Điểm khởi điểm mặc định đầu học kì là 100 điểm.</li>
            <li>Học sinh được cộng điểm thưởng (+5, +10) khi có thành tích thi đua, hăng hái phát biểu xây dựng bài học hoặc tích cực tham gia phong trào CLB.</li>
            <li>Học sinh bị trừ điểm (-5, -10) khi vi phạm nội quy, đi muộn hoặc làm việc riêng trong giờ học.</li>
            <li>Xếp loại rèn luyện: Xuất sắc & Tốt (từ 90 điểm trở lên), Khá (từ 70-89 điểm), Trung bình (50-69 điểm).</li>
          </ul>
        </div>
      </div>

      <h4 style={{ marginBottom: '14px', fontWeight: 700 }}>Nhật ký thi đua học đường</h4>
      <table className="premium-table">
        <thead>
          <tr>
            <th>Ngày ghi nhận</th>
            <th>Nội dung rèn luyện</th>
            <th>Điểm cộng/trừ</th>
            <th>Giáo viên ghi nhận</th>
          </tr>
        </thead>
        <tbody>
          {studentConductLogs.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Không có lịch sử cộng/trừ điểm rèn luyện nào.</td>
            </tr>
          ) : (
            studentConductLogs.map(log => (
              <tr key={log.id}>
                <td>{log.date}</td>
                <td style={{ fontWeight: 600 }}>{log.reason}</td>
                <td>
                  <span className={`badge ${log.points > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                    {log.points > 0 ? `+${log.points}` : log.points} điểm
                  </span>
                </td>
                <td>{log.teacherName}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
