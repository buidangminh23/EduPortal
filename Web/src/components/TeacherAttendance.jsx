import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Clock, CheckCircle, AlertCircle, Fingerprint, Shield } from 'lucide-react';

export default function TeacherAttendance() {
  const { teacherAttendance, checkInTeacher, currentRole, userSession, teachers } = useContext(AppContext);
  const [pinInput, setPinInput] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('all');

  const myTeacher = teachers?.find(t => t.id === (userSession?.userId || 'T01')) || teachers?.[0];
  const today = new Date().toISOString().split('T')[0];

  const alreadyCheckedToday = (teacherAttendance || []).some(
    a => a.teacherId === myTeacher?.id && a.date === today
  );

  const handleCheckIn = () => {
    if (!pinInput || pinInput.length < 4) return;
    checkInTeacher(myTeacher?.id || 'T01', myTeacher?.name || 'Giáo viên');
    setCheckedIn(true);
    setPinInput('');
    setTimeout(() => setCheckedIn(false), 3000);
  };

  // Stats per teacher
  const buildStats = (teacherId) => {
    const logs = (teacherAttendance || []).filter(l => l.teacherId === teacherId);
    const total = logs.length;
    const ontime = logs.filter(l => l.status === 'ontime').length;
    const late = logs.filter(l => l.status === 'late').length;
    return { total, ontime, late, pct: total ? Math.round((ontime / total) * 100) : 0 };
  };

  const filteredLogs = (teacherAttendance || [])
    .filter(l => filterTeacher === 'all' || l.teacherId === filterTeacher)
    .sort((a, b) => (b.date + b.checkInTime).localeCompare(a.date + a.checkInTime));

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={22} color="#6366f1" /> Chấm Công Giáo Viên
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Theo dõi giờ vào lớp và tỉ lệ đúng giờ
          </p>
        </div>
      </div>

      {/* Teacher check-in panel */}
      {currentRole === 'teacher' && (
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.04))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Fingerprint size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Check-in Hôm nay — {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</h3>
          </div>

          {alreadyCheckedToday ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={20} color="#10b981" />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#10b981' }}>Đã điểm danh thành công!</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#065f46' }}>
                  Giờ vào: {(teacherAttendance || []).find(a => a.teacherId === myTeacher?.id && a.date === today)?.checkInTime}
                </p>
              </div>
            </div>
          ) : checkedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={20} color="#10b981" />
              <p style={{ margin: 0, fontWeight: 700, color: '#10b981' }}>✅ Check-in thành công! Chào mừng {myTeacher?.name}.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Shield size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Nhập mã PIN 4 số"
                  className="form-control"
                  style={{ paddingLeft: 34, width: 180, fontFamily: 'monospace', letterSpacing: 4, fontSize: '1.1rem' }}
                  onKeyDown={e => e.key === 'Enter' && handleCheckIn()}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCheckIn}
                disabled={pinInput.length < 4}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px' }}
              >
                <Fingerprint size={16} /> Check-in
              </button>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                (Demo: nhập bất kỳ 4 số)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Teacher stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {(teachers || []).map(t => {
          const stats = buildStats(t.id);
          return (
            <div key={t.id} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', transition: 'all 0.15s' }}
              onClick={() => setFilterTeacher(filterTeacher === t.id ? 'all' : t.id)}
              style={{
                background: filterTeacher === t.id ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.7)',
                borderRadius: 14, padding: '14px 16px',
                border: `1px solid ${filterTeacher === t.id ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.07)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>{t.subject}</div>
              {/* Progress bar */}
              <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${stats.pct}%`, background: stats.pct >= 90 ? '#10b981' : stats.pct >= 70 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: '#10b981', fontWeight: 600 }}>✓ {stats.ontime} đúng giờ</span>
                {stats.late > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠ {stats.late} muộn</span>}
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{stats.pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance log table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Lịch sử điểm danh {filterTeacher !== 'all' && `— ${teachers?.find(t => t.id === filterTeacher)?.name}`}</h3>
          {filterTeacher !== 'all' && (
            <button onClick={() => setFilterTeacher('all')} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>Xem tất cả</button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Giáo viên</th>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Trạng thái</th>
                <th>Mã PIN</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 20).map(log => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.teacherName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(log.date).toLocaleDateString('vi-VN')}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{log.checkInTime}</td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                      background: log.status === 'ontime' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: log.status === 'ontime' ? '#10b981' : '#ef4444',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      {log.status === 'ontime' ? <><CheckCircle size={11} /> Đúng giờ</> : <><AlertCircle size={11} /> Muộn</>}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{log.pin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
            <Clock size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
            <p style={{ fontSize: '0.85rem' }}>Chưa có dữ liệu điểm danh.</p>
          </div>
        )}
      </div>
    </div>
  );
}
