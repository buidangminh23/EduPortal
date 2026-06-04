import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { BookOpen, ThumbsUp, ThumbsDown, Plus, X, Users, Star, Send } from 'lucide-react';

const DIFFICULTY_CONFIG = {
  'Dễ':       { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  'Trung bình':{ color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'Khó':      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const SUBJECTS = ['Toán học', 'Ngữ văn', 'Vật lý', 'Hóa học', 'Tiếng Anh', 'Sinh học', 'Lịch sử', 'Địa lý'];

export default function ExamRepository() {
  const { communityExams, addToRepository, voteExam, currentRole, userSession } = useContext(AppContext);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [sortBy, setSortBy] = useState('votes');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', subject: 'Toán học', grade: '12', difficulty: 'Trung bình', questionCount: '', description: '' });
  const [voted, setVoted] = useState({});

  const filtered = (communityExams || [])
    .filter(e => filterSubject === 'all' || e.subject === filterSubject)
    .filter(e => filterDiff === 'all' || e.difficulty === filterDiff)
    .sort((a, b) => {
      if (sortBy === 'votes') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      if (sortBy === 'usage') return b.usedCount - a.usedCount;
      if (sortBy === 'newest') return b.date.localeCompare(a.date);
      return 0;
    });

  const handleVote = (id, type) => {
    if (voted[id]) return;
    voteExam(id, type);
    setVoted(v => ({ ...v, [id]: type }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    addToRepository({
      ...form,
      questionCount: parseInt(form.questionCount) || 10,
      authorId: userSession?.userId || 'T01',
      authorName: userSession?.displayName || 'Giáo viên',
    });
    setForm({ title: '', subject: 'Toán học', grade: '12', difficulty: 'Trung bình', questionCount: '', description: '' });
    setShowAdd(false);
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={22} color="#6366f1" /> Kho Đề Thi Cộng Đồng
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Tổng hợp {filtered.length} đề thi từ giáo viên — chia sẻ & bình chọn
          </p>
        </div>
        {currentRole === 'teacher' && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Đóng góp đề thi
          </button>
        )}
      </div>

      {/* Filters & Sort */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-control" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}>
          <option value="all">Tất cả môn</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-control" value={filterDiff} onChange={e => setFilterDiff(e.target.value)} style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}>
          <option value="all">Tất cả độ khó</option>
          {['Dễ', 'Trung bình', 'Khó'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {[['votes', '⭐ Bình chọn'], ['usage', '📊 Nhiều dùng'], ['newest', '🕒 Mới nhất']].map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)} className={`btn ${sortBy === val ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Add form modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 540, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Đóng góp đề thi mới</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Tên đề thi *</label>
                <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Đề Toán luyện thi THPT 2026 — Chuyên đề Hàm số" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Môn học</label>
                  <select className="form-control" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Khối lớp</label>
                  <select className="form-control" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
                    <option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Độ khó</label>
                  <select className="form-control" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="Dễ">Dễ</option><option value="Trung bình">Trung bình</option><option value="Khó">Khó</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Số câu hỏi</label>
                <input className="form-control" type="number" min={1} max={100} value={form.questionCount} onChange={e => setForm(f => ({ ...f, questionCount: e.target.value }))} placeholder="20" />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mô tả nội dung *</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn gọn nội dung, phạm vi kiến thức..." required style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} /> Đóng góp</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
        {filtered.map(exam => {
          const dc = DIFFICULTY_CONFIG[exam.difficulty] || DIFFICULTY_CONFIG['Trung bình'];
          const netVotes = exam.upvotes - exam.downvotes;
          const myVote = voted[exam.id];
          return (
            <div key={exam.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '18px', background: 'rgba(255,255,255,0.6)', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>{exam.title}</h4>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: dc.bg, color: dc.color, flexShrink: 0 }}>{exam.difficulty}</span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{exam.description}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12, flexWrap: 'wrap' }}>
                <span>📚 {exam.subject}</span>
                <span>🎓 Lớp {exam.grade}</span>
                <span>❓ {exam.questionCount} câu</span>
                <span><Users size={11} style={{ verticalAlign: 'middle' }} /> {exam.usedCount} lượt dùng</span>
                <span>GV: {exam.authorName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleVote(exam.id, 'up')}
                    disabled={!!myVote}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20,
                      border: `1px solid ${myVote === 'up' ? '#10b981' : 'rgba(0,0,0,0.1)'}`,
                      background: myVote === 'up' ? 'rgba(16,185,129,0.1)' : 'transparent',
                      cursor: myVote ? 'default' : 'pointer', fontSize: '0.78rem', fontWeight: 600,
                      color: myVote === 'up' ? '#10b981' : 'var(--text-secondary)',
                    }}
                  >
                    <ThumbsUp size={13} /> {exam.upvotes}
                  </button>
                  <button
                    onClick={() => handleVote(exam.id, 'down')}
                    disabled={!!myVote}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20,
                      border: `1px solid ${myVote === 'down' ? '#ef4444' : 'rgba(0,0,0,0.1)'}`,
                      background: myVote === 'down' ? 'rgba(239,68,68,0.1)' : 'transparent',
                      cursor: myVote ? 'default' : 'pointer', fontSize: '0.78rem', fontWeight: 600,
                      color: myVote === 'down' ? '#ef4444' : 'var(--text-secondary)',
                    }}
                  >
                    <ThumbsDown size={13} /> {exam.downvotes}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
                  <Star size={13} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ fontWeight: 700, color: netVotes > 0 ? '#10b981' : 'var(--text-muted)' }}>+{netVotes}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <BookOpen size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p>Không tìm thấy đề thi phù hợp.</p>
        </div>
      )}
    </div>
  );
}
