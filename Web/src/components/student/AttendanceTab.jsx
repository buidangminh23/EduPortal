import { useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { Clock } from 'lucide-react';
import {
  ATTENDANCE_LABEL,
  ATTENDANCE_STATUS,
  resolveAttendanceStatus,
  summariseAttendance
} from '../../lib/domain/attendance';

const BADGE_CLASS = {
  [ATTENDANCE_STATUS.PRESENT]: 'badge-success',
  [ATTENDANCE_STATUS.LATE]: 'badge-warning',
  [ATTENDANCE_STATUS.EXCUSED]: 'badge-secondary',
  [ATTENDANCE_STATUS.UNEXCUSED]: 'badge-danger'
};

const STAT_CARDS = [
  { key: 'present', label: 'Buổi có mặt', background: '#ecfdf5', color: '#047857' },
  { key: 'late', label: 'Buổi đi muộn', background: '#fffbeb', color: '#b45309' },
  { key: 'excused', label: 'Nghỉ có phép', background: '#f8fafc', color: '#475569' },
  { key: 'unexcused', label: 'Nghỉ không phép', background: '#fef2f2', color: '#b91c1c' }
];

const formatDate = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');

export default function AttendanceTab({ student }) {
  const { attendanceLogs, leaveRequests } = useContext(AppContext);

  const myLeave = useMemo(
    () => (leaveRequests || []).filter((request) => request.studentId === student.id),
    [leaveRequests, student.id]
  );

  const myRecords = useMemo(
    () =>
      (attendanceLogs || [])
        .filter((log) => log.studentId === student.id)
        .sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [attendanceLogs, student.id]
  );

  const summary = useMemo(
    () => summariseAttendance(myRecords, myLeave),
    [myRecords, myLeave]
  );

  return (
    <div className="glass-panel animate-fade">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="var(--accent-secondary)" />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Nhật ký điểm danh chuyên cần</h2>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Lớp học: <strong>{student.class}</strong>
          {summary.rate !== null && (
            <>
              {' '}• Tỉ lệ chuyên cần: <strong>{summary.rate}%</strong>
            </>
          )}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            style={{
              padding: '16px',
              background: card.background,
              borderRadius: '10px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>
              {summary[card.key]}
            </div>
            <div style={{ fontSize: '0.8rem', color: card.color, fontWeight: 600 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {myRecords.length === 0 ? (
        <p
          style={{
            margin: 0,
            padding: '28px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}
        >
          Chưa có buổi điểm danh nào được ghi nhận.
        </p>
      ) : (
        <table className="premium-table">
          <thead>
            <tr>
              <th scope="col">Ngày</th>
              <th scope="col">Giờ ghi nhận</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {myRecords.map((log) => {
              // Recomputed per row so an absence flips to "có phép" the moment
              // the matching leave request is approved.
              const status = resolveAttendanceStatus(log, myLeave);
              return (
                <tr key={log.id}>
                  <td>{formatDate(log.date)}</td>
                  <td style={{ fontWeight: 600 }}>{log.checkInTime || '—'}</td>
                  <td>
                    <span className={`badge ${BADGE_CLASS[status] || 'badge-secondary'}`}>
                      {ATTENDANCE_LABEL[status] || status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {status === ATTENDANCE_STATUS.EXCUSED
                      ? 'Có đơn xin nghỉ đã được duyệt'
                      : log.note || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
