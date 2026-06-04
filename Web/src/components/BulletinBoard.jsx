import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Megaphone, Plus, AlertTriangle, BookOpen, DollarSign, Calendar,
  Check, Clock, ChevronDown, ChevronUp, X, Send
} from 'lucide-react';

const PRIORITY_CONFIG = {
  urgent: { label: 'Khẩn cấp', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  high:   { label: 'Quan trọng', color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  medium: { label: 'Thông thường', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
};

const TYPE_CONFIG = {
  academic: { label: 'Học vụ', icon: BookOpen, color: '#6366f1' },
  finance:  { label: 'Tài chính', icon: DollarSign, color: '#10b981' },
  event:    { label: 'Sự kiện', icon: Calendar, color: '#f59e0b' },
  urgent:   { label: 'Khẩn cấp', icon: AlertTriangle, color: '#ef4444' },
};

export default function BulletinBoard() {
  const { bulletins, addBulletin, confirmBulletinRead, currentRole, userSession, selectedStudentId } = useContext(AppContext);
  const [showCompose, setShowCompose] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', type: 'academic', priority: 'medium', targetRoles: ['all'] });

  // Determine current user ID
  const getCurrentUserId = () => {
    if (currentRole === 'admin') return 'admin';
    if (currentRole === 'teacher') return userSession?.userId || 'T01';
    if (currentRole === 'student') return selectedStudentId || 'HS001';
    if (currentRole === 'parent') return `parent_${selectedStudentId || 'HS001'}`;
    return 'unknown';
  };

  const userId = getCurrentUserId();

  // Filter bulletins for this role
  const visibleBulletins = (bulletins || []).filter(b => {
    if (filterType !== 'all' && b.type !== filterType) return false;
    if (b.targetRoles.includes('all') || b.targetRoles.includes(currentRole)) return true;
    return false;
  });

  const unreadCount = visibleBulletins.filter(b => !b.readBy?.includes(userId)).length;

  const handleReadToggle = (bulletinId) => {
    setExpanded(expanded === bulletinId ? null : bulletinId);
    confirmBulletinRead(userId, bulletinId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    addBulletin({
      ...form,
      authorId: userId,
      authorName: currentRole === 'admin' ? 'Ban Giám Hiệu' : (userSession?.displayName || 'Giáo viên'),
    });
    setForm({ title: '', content: '', type: 'academic', priority: 'medium', targetRoles: ['all'] });
    setShowCompose(false);
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Megaphone size={22} color="#6366f1" />
            Bảng Tin Trường
            {unreadCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px' }}>
                {unreadCount} chưa đọc
              </span>
            )}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Thông báo chính thức từ Ban Giám Hiệu và Giáo viên
          </p>
        </div>
        {(currentRole === 'admin' || currentRole === 'teacher') && (
          <button className="btn btn-primary" onClick={() => setShowCompose(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Đăng thông báo
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', 'Tất cả'], ['academic', 'Học vụ'], ['finance', 'Tài chính'], ['event', 'Sự kiện'], ['urgent', 'Khẩn cấp']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterType(val)}
            className={`btn ${filterType === val ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 20 }}
          >{label}</button>
        ))}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 560,
            boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Soạn thông báo mới</h3>
              <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Tiêu đề *</label>
                <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tiêu đề thông báo..." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Loại</label>
                  <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="academic">Học vụ</option>
                    <option value="finance">Tài chính</option>
                    <option value="event">Sự kiện</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Mức độ</label>
                  <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="medium">Thông thường</option>
                    <option value="high">Quan trọng</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Gửi tới</label>
                <select className="form-control" value={form.targetRoles[0]} onChange={e => setForm(f => ({ ...f, targetRoles: [e.target.value] }))}>
                  <option value="all">Tất cả</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="student">Học sinh</option>
                  <option value="parent">Phụ huynh</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Nội dung *</label>
                <textarea className="form-control" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Nội dung thông báo chi tiết..." required style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompose(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} /> Đăng thông báo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulletin list */}
      {visibleBulletins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Megaphone size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
          <p>Chưa có thông báo nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleBulletins.map(b => {
            const typeConfig = TYPE_CONFIG[b.type] || TYPE_CONFIG.academic;
            const priorConfig = PRIORITY_CONFIG[b.priority] || PRIORITY_CONFIG.medium;
            const Icon = typeConfig.icon;
            const isRead = b.readBy?.includes(userId);
            const isExp = expanded === b.id;

            return (
              <div
                key={b.id}
                style={{
                  border: `1px solid ${isRead ? 'rgba(0,0,0,0.06)' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 16, overflow: 'hidden',
                  background: isRead ? 'rgba(255,255,255,0.5)' : 'rgba(99,102,241,0.02)',
                  transition: 'all 0.2s',
                  boxShadow: isRead ? 'none' : '0 2px 12px rgba(99,102,241,0.06)',
                }}
              >
                {/* Header row */}
                <div
                  onClick={() => handleReadToggle(b.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', cursor: 'pointer' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${typeConfig.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={typeConfig.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: isRead ? 600 : 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{b.title}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: priorConfig.bg, color: priorConfig.color }}>{priorConfig.label}</span>
                      {!isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                      <span>{b.authorName}</span>
                      <span>•</span>
                      <span>{new Date(b.date).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <span>{b.readBy?.length || 0} đã đọc</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                    {isRead ? <Check size={16} color="#10b981" /> : <Clock size={16} />}
                    {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExp && (
                  <div style={{ padding: '0 18px 18px 72px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ paddingTop: 14, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {b.content}
                    </div>
                    {b.readBy?.length > 0 && currentRole === 'admin' && (
                      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 10, fontSize: '0.77rem', color: 'var(--text-secondary)' }}>
                        ✓ Đã đọc bởi: {b.readBy.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
