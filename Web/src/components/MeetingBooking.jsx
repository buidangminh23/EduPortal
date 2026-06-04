import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Calendar, Clock, Plus, CheckCircle, XCircle, User, Send, X } from 'lucide-react';

const TIME_SLOTS = [
  '07:00 - 07:30', '07:30 - 08:00', '08:00 - 08:30', '08:30 - 09:00',
  '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30', '15:30 - 16:00',
  '16:00 - 16:30', '16:30 - 17:00',
];

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  confirmed: { label: 'Đã xác nhận', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  cancelled: { label: 'Đã từ chối', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function MeetingBooking() {
  const { meetingBookings, requestMeeting, confirmMeeting, cancelMeeting, currentRole, userSession, students, teachers, selectedStudentId } = useContext(AppContext);
  const [showBook, setShowBook] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ teacherId: '', date: '', timeSlot: '', reason: '' });
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);

  // Current user IDs
  const myTeacher = teachers?.find(t => t.id === (userSession?.userId || 'T01')) || teachers?.[0];
  const myStudent = students?.find(s => s.id === selectedStudentId) || students?.[0];

  // Filter bookings by role
  const myBookings = (meetingBookings || []).filter(b => {
    if (currentRole === 'teacher') return b.teacherId === (myTeacher?.id || 'T01');
    if (currentRole === 'parent') return b.studentId === (myStudent?.id || 'HS001');
    return true; // admin sees all
  }).filter(b => filterStatus === 'all' || b.status === filterStatus);

  const handleBook = (e) => {
    e.preventDefault();
    if (!form.teacherId || !form.date || !form.timeSlot || !form.reason.trim()) return;
    const teacher = teachers?.find(t => t.id === form.teacherId);
    requestMeeting({
      parentId: `parent_${myStudent?.id}`,
      parentName: myStudent?.parentName || 'Phụ huynh',
      studentId: myStudent?.id,
      studentName: myStudent?.name,
      teacherId: form.teacherId,
      teacherName: teacher?.name,
      date: form.date,
      timeSlot: form.timeSlot,
      reason: form.reason,
    });
    setForm({ teacherId: '', date: '', timeSlot: '', reason: '' });
    setShowBook(false);
  };

  const handleConfirm = (id) => {
    confirmMeeting(id, confirmNote);
    setConfirmingId(null);
    setConfirmNote('');
  };

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Calendar size={22} color="#6366f1" /> Lịch Hẹn Gặp Mặt
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {currentRole === 'parent' ? 'Đặt lịch gặp giáo viên chủ nhiệm hoặc bộ môn' : 'Quản lý yêu cầu gặp mặt từ phụ huynh'}
          </p>
        </div>
        {currentRole === 'parent' && (
          <button className="btn btn-primary" onClick={() => setShowBook(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Đặt lịch hẹn
          </button>
        )}
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['cancelled', 'Đã từ chối']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val)} className={`btn ${filterStatus === val ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 20 }}>{label}</button>
        ))}
      </div>

      {/* Booking form modal */}
      {showBook && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Đặt lịch hẹn gặp giáo viên</h3>
              <button onClick={() => setShowBook(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Giáo viên *</label>
                <select className="form-control" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} required>
                  <option value="">-- Chọn giáo viên --</option>
                  {(teachers || []).map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Ngày hẹn *</label>
                  <input type="date" className="form-control" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Khung giờ *</label>
                  <select className="form-control" value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))} required>
                    <option value="">-- Chọn giờ --</option>
                    {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Lý do gặp *</label>
                <textarea className="form-control" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Mô tả ngắn gọn lý do bạn muốn gặp giáo viên..." required style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBook(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} /> Gửi yêu cầu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm note modal */}
      {confirmingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5001, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 14px' }}>Xác nhận lịch hẹn</h3>
            <textarea className="form-control" rows={3} value={confirmNote} onChange={e => setConfirmNote(e.target.value)} placeholder="Ghi chú địa điểm gặp (tùy chọn)..." style={{ marginBottom: 14, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setConfirmingId(null); setConfirmNote(''); }}>Hủy</button>
              <button className="btn btn-primary" onClick={() => handleConfirm(confirmingId)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking cards */}
      {myBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <Calendar size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p>Chưa có lịch hẹn nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myBookings.map(b => {
            const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
            return (
              <div key={b.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '18px 20px', background: 'rgba(255,255,255,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#6366f1" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {currentRole === 'teacher' ? `PH: ${b.parentName}` : `GV: ${b.teacherName}`}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Học sinh: {b.studentName} • {b.studentId}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{formatDate(b.date)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} />{b.timeSlot}</span>
                      </div>
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        💬 {b.reason}
                      </div>
                      {b.note && (
                        <div style={{ marginTop: 6, padding: '6px 12px', background: 'rgba(16,185,129,0.06)', borderRadius: 8, fontSize: '0.8rem', color: '#059669' }}>
                          📍 {b.note}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                    <span style={{ fontSize: '0.77rem', fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                    {b.status === 'pending' && currentRole === 'teacher' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setConfirmingId(b.id)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle size={13} /> Xác nhận
                        </button>
                        <button onClick={() => cancelMeeting(b.id)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <XCircle size={13} /> Từ chối
                        </button>
                      </div>
                    )}
                    {b.status === 'pending' && currentRole === 'parent' && (
                      <button onClick={() => cancelMeeting(b.id)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                        Hủy yêu cầu
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
