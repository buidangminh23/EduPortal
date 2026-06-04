import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { BookOpen, Plus, Layers, Brain, RotateCw } from 'lucide-react';

// SM-2 algorithm quality levels
const QUALITY_LABELS = [
  { q: 0, label: 'Không nhớ', color: '#ef4444', emoji: '❌' },
  { q: 1, label: 'Nhớ mờ nhạt', color: '#f97316', emoji: '😕' },
  { q: 2, label: 'Nhớ nhưng khó', color: '#f59e0b', emoji: '😐' },
  { q: 3, label: 'Nhớ sau do dự', color: '#84cc16', emoji: '🙂' },
  { q: 4, label: 'Nhớ tốt', color: '#10b981', emoji: '😊' },
  { q: 5, label: 'Thuộc hoàn toàn', color: '#0891b2', emoji: '🎯' },
];

// Simple SM-2 interval calculator
function calcNextReview(card, quality) {
  let { easeFactor = 2.5, interval = 1, repetitions = 0 } = card;
  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  return { easeFactor, interval, repetitions, nextReview: nextDate.toISOString().split('T')[0] };
}

export default function SmartFlashcard({ studentId }) {
  const { flashcards = [], selectedStudentId } = useContext(AppContext);
  const sid = studentId || selectedStudentId || 'HS001';

  // Local SRS state
  const [cards, setCards] = useState(() =>
    (flashcards || []).filter(f => f.studentId === sid).map(f => ({
      ...f,
      easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: null, lastQuality: null,
    }))
  );
  const [newForm, setNewForm] = useState({ front: '', back: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState('list'); // list | study
  const [studyIdx, setStudyIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyDone, setStudyDone] = useState(false);

  // Due cards = cards with nextReview <= today or no nextReview
  const today = new Date().toISOString().split('T')[0];
  const dueCards = cards.filter(c => !c.nextReview || c.nextReview <= today);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newForm.front.trim() || !newForm.back.trim()) return;
    const id = 'FC_' + Date.now();
    setCards(prev => [...prev, { id, studentId: sid, ...newForm, easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: null, lastQuality: null }]);
    setNewForm({ front: '', back: '' });
    setShowAdd(false);
  };

  const startStudy = () => {
    if (dueCards.length === 0) return;
    setMode('study');
    setStudyIdx(0);
    setFlipped(false);
    setStudyDone(false);
  };

  const handleRate = (quality) => {
    const card = dueCards[studyIdx];
    const updated = calcNextReview(card, quality);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, ...updated, lastQuality: quality } : c));
    if (studyIdx + 1 >= dueCards.length) {
      setStudyDone(true);
    } else {
      setStudyIdx(i => i + 1);
      setFlipped(false);
    }
  };

  const currentCard = dueCards[studyIdx];

  if (mode === 'study') {
    if (studyDone || dueCards.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
          <h3 style={{ margin: '0 0 8px' }}>Học xong hôm nay!</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px' }}>Bạn đã ôn tập {dueCards.length} thẻ. Hẹn gặp lại ngày mai!</p>
          <button className="btn btn-primary" onClick={() => { setMode('list'); setStudyDone(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RotateCw size={14} /> Về danh sách
          </button>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 0' }}>
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <span>{studyIdx + 1} / {dueCards.length} thẻ</span>
          <button onClick={() => setMode('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem' }}>✕ Dừng</button>
        </div>
        <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((studyIdx) / dueCards.length) * 100}%`, background: '#6366f1', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setFlipped(!flipped)}
          style={{
            minHeight: 220, border: '2px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '32px 28px',
            background: flipped ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))' : 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.3s', position: 'relative',
            boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
            userSelect: 'none',
          }}
        >
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.06em' }}>
              {flipped ? '✅ Mặt sau (đáp án)' : '❓ Mặt trước'}
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
              {flipped ? currentCard.back : currentCard.front}
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: 12, right: 14, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {flipped ? 'Đang xem đáp án' : '👆 Nhấn để lật thẻ'}
          </div>
        </div>

        {/* Rating buttons — show only after flip */}
        {flipped && (
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {QUALITY_LABELS.map(ql => (
              <button
                key={ql.q}
                onClick={() => handleRate(ql.q)}
                style={{
                  padding: '10px 6px', borderRadius: 12, border: `1px solid ${ql.color}30`,
                  background: `${ql.color}08`, cursor: 'pointer', transition: 'all 0.15s',
                  textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: ql.color,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${ql.color}15`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${ql.color}08`; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: 3 }}>{ql.emoji}</div>
                {ql.label}
                <div style={{ fontSize: '0.65rem', marginTop: 2, color: 'var(--text-muted)' }}>
                  +{ql.q <= 2 ? 1 : ql.q <= 3 ? 3 : ql.q <= 4 ? 7 : 14}d
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={18} color="#6366f1" />
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Flashcard SM-2</h3>
          {dueCards.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px' }}>
              {dueCards.length} cần ôn
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {dueCards.length > 0 && (
            <button className="btn btn-primary" onClick={startStudy} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '7px 16px' }}>
              <BookOpen size={14} /> Ôn tập ({dueCards.length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '7px 16px' }}>
            <Plus size={14} /> Thêm thẻ
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mặt trước *</label>
                <textarea className="form-control" rows={3} value={newForm.front} onChange={e => setNewForm(f => ({ ...f, front: e.target.value }))} placeholder="Câu hỏi / Khái niệm..." required style={{ resize: 'vertical', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mặt sau (đáp án) *</label>
                <textarea className="form-control" rows={3} value={newForm.back} onChange={e => setNewForm(f => ({ ...f, back: e.target.value }))} placeholder="Câu trả lời / Giải thích..." required style={{ resize: 'vertical', fontSize: '0.85rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowAdd(false); setNewForm({ front: '', back: '' }); }} style={{ fontSize: '0.82rem' }}>Hủy</button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={13} /> Thêm thẻ</button>
            </div>
          </form>
        </div>
      )}

      {/* Card grid */}
      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
          <Layers size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
          <p style={{ fontSize: '0.82rem' }}>Chưa có flashcard nào. Nhấn "Thêm thẻ" để bắt đầu!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {cards.map(card => {
            const isDue = !card.nextReview || card.nextReview <= today;
            return (
              <div key={card.id} style={{ border: `1px solid ${isDue ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 12, padding: '14px 14px', background: isDue ? 'rgba(99,102,241,0.03)' : 'rgba(255,255,255,0.6)' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{card.front}</p>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{card.back.slice(0, 80)}{card.back.length > 80 ? '...' : ''}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                  {isDue
                    ? <span style={{ color: '#6366f1', fontWeight: 700 }}>📚 Cần ôn hôm nay</span>
                    : <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Ôn lại: {card.nextReview}</span>
                  }
                  <span style={{ color: 'var(--text-muted)' }}>Lần: {card.repetitions}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
