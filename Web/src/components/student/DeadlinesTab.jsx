import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Calendar, CheckCircle, Trash2, Plus, Sparkles } from 'lucide-react';

export default function DeadlinesTab({ student }) {
  const { deadlines, addDeadline, toggleDeadlineDone, deleteDeadline } = useContext(AppContext);
  const [newDlTitle, setNewDlTitle] = useState('');
  const [newDlDate, setNewDlDate] = useState('');
  const [newDlPriority, setNewDlPriority] = useState('medium');

  const handleAddDeadline = (e) => {
    e.preventDefault();
    if (!newDlTitle || !newDlDate) return;
    addDeadline({ title: newDlTitle, date: newDlDate, priority: newDlPriority });
    setNewDlTitle('');
    setNewDlDate('');
  };

  const myDeadlines = deadlines ? deadlines.filter(d => d.classTarget === student.class || d.classTarget === 'personal') : [];
  myDeadlines.sort((a, b) => {
    if (a.done === b.done) {
      return new Date(a.date) - new Date(b.date);
    }
    return a.done ? 1 : -1;
  });

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '30px' }}>

        {/* Upcoming Deadlines List */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="var(--accent-primary)" /> Lịch thi & Deadline
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myDeadlines.map(dl => {
              const dlDate = new Date(dl.date);
              const isOverdue = dlDate < new Date(new Date().setHours(0,0,0,0)) && !dl.done;

              return (
                <div
                  key={dl.id}
                  className={`glass-panel-hover ${dl.done ? 'done' : ''}`}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${dl.done ? 'var(--text-muted)' : (isOverdue ? 'var(--accent-danger)' : dl.color || 'var(--accent-primary)')}`,
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    opacity: dl.done ? 0.6 : 1
                  }}
                >
                  <button
                    onClick={() => toggleDeadlineDone(dl.id)}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: dl.done ? 'var(--accent-success)' : 'var(--text-muted)',
                      marginTop: '2px'
                    }}
                  >
                    <CheckCircle size={20} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, textDecoration: dl.done ? 'line-through' : 'none', color: isOverdue ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                        {dl.title}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: isOverdue ? 'var(--accent-danger)' : 'var(--text-secondary)', fontWeight: 500 }}>
                        {dlDate.toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textDecoration: dl.done ? 'line-through' : 'none' }}>
                      {dl.desc || dl.subject}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 600,
                        background: dl.type === 'exam' ? 'rgba(239, 68, 68, 0.15)' : (dl.type === 'event' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)'),
                        color: dl.type === 'exam' ? '#ef4444' : (dl.type === 'event' ? '#10b981' : '#6366f1')
                      }}>
                        {dl.type === 'exam' ? 'KỲ THI' : (dl.type === 'event' ? 'SỰ KIỆN' : 'BÀI TẬP')}
                      </span>
                      {dl.priority === 'urgent' && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600 }}>GẤP</span>}
                      {dl.type === 'personal' && (
                        <button onClick={() => deleteDeadline(dl.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', marginLeft: 'auto' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {myDeadlines.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                <CheckCircle size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p>Tuyệt vời! Bạn không có deadline nào sắp tới.</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Personal Deadline */}
        <div>
          <div className="glass-panel" style={{ position: 'sticky', top: '90px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Plus size={20} color="var(--accent-primary)" /> Thêm mục tiêu cá nhân
            </h3>
            <form onSubmit={handleAddDeadline}>
              <div className="form-group">
                <label className="form-label">Tên công việc / Mục tiêu</label>
                <input
                  type="text"
                  className="form-control"
                  value={newDlTitle}
                  onChange={e => setNewDlTitle(e.target.value)}
                  placeholder="VD: Ôn tập 50 từ vựng Tiếng Anh..."
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày hoàn thành (Deadline)</label>
                <input
                  type="date"
                  className="form-control"
                  value={newDlDate}
                  onChange={e => setNewDlDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mức độ ưu tiên</label>
                <select
                  className="form-control"
                  value={newDlPriority}
                  onChange={e => setNewDlPriority(e.target.value)}
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Gấp, quan trọng</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <CheckCircle size={18} /> Thêm vào danh sách
              </button>
            </form>

            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--accent-primary-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.1)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Lời khuyên học tập
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Việc chia nhỏ các mục tiêu lớn thành những deadline ngắn hạn sẽ giúp não bộ giảm cảm giác quá tải và tiết ra nhiều Dopamine hơn mỗi khi bạn tick hoàn thành một việc!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
