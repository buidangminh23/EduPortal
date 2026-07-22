import { useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../context/AppContext';
import { SYSTEM_BLOCK_EXAMS, SUBJECT_NAMES } from '../data/mockExamsData';
import { decodeHtmlEntities } from '../lib/tutor/formatText';
import {
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
  Users,
  Star,
  Send,
  Eye,
  PlayCircle,
  Download,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const DIFFICULTY_CONFIG = {
  'Dễ': { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  'Trung bình': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'Khó': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const SUBJECTS = ['Toán học', 'Ngữ văn', 'Vật lý', 'Hóa học', 'Tiếng Anh', 'Sinh học', 'Lịch sử', 'Địa lý'];
const SUBJECT_KEY_BY_NAME = Object.fromEntries(Object.entries(SUBJECT_NAMES).map(([key, name]) => [name, key]));

const stripHtml = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

export default function ExamRepository() {
  const {
    communityExams,
    addToRepository,
    voteExam,
    markCommunityExamUsed,
    currentRole,
    userSession,
  } = useContext(AppContext);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [sortBy, setSortBy] = useState('votes');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', subject: 'Toán học', grade: '12', difficulty: 'Trung bình', questionCount: '', description: '' });
  const [voted, setVoted] = useState({});
  const [activeExam, setActiveExam] = useState(null);
  const [examMode, setExamMode] = useState('preview');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [usedLogged, setUsedLogged] = useState({});

  const questionBank = useMemo(() => {
    const map = new Map();
    SYSTEM_BLOCK_EXAMS.flatMap(exam => exam.questions).forEach(question => {
      if (!map.has(question.subject)) map.set(question.subject, []);
      if (!map.get(question.subject).some(item => item.id === question.id)) {
        map.get(question.subject).push(question);
      }
    });
    return map;
  }, []);

  const filtered = (communityExams || [])
    .filter(e => filterSubject === 'all' || e.subject === filterSubject)
    .filter(e => filterDiff === 'all' || e.difficulty === filterDiff)
    .sort((a, b) => {
      if (sortBy === 'votes') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      if (sortBy === 'usage') return b.usedCount - a.usedCount;
      if (sortBy === 'newest') return b.date.localeCompare(a.date);
      return 0;
    });

  const buildQuestions = (exam) => {
    const subjectKey = SUBJECT_KEY_BY_NAME[exam.subject] || 'Math';
    const pool = questionBank.get(subjectKey) || questionBank.get('Math') || [];
    const requestedCount = Math.max(1, Math.min(parseInt(exam.questionCount, 10) || pool.length || 1, 60));

    return Array.from({ length: requestedCount }, (_, index) => {
      const base = pool[index % pool.length];
      return {
        ...base,
        id: `${exam.id}_${base.id}_${index + 1}`,
        displayNumber: index + 1,
      };
    });
  };

  const logUsedOnce = (examId) => {
    if (usedLogged[examId]) return;
    markCommunityExamUsed(examId);
    setUsedLogged(prev => ({ ...prev, [examId]: true }));
  };

  const openExam = (exam, mode) => {
    setActiveExam({ ...exam, questions: buildQuestions(exam) });
    setExamMode(mode);
    setAnswers({});
    setSubmitted(false);
    logUsedOnce(exam.id);
  };

  const closeExam = () => {
    setActiveExam(null);
    setAnswers({});
    setSubmitted(false);
    setExamMode('preview');
  };

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

  const selectAnswer = (questionId, optionKey) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const calculateResult = () => {
    if (!activeExam) return { correct: 0, score: 0 };
    const correct = activeExam.questions.filter(question => answers[question.id] === question.correctKey).length;
    return {
      correct,
      score: Number(((correct / activeExam.questions.length) * 10).toFixed(1)),
    };
  };

  const handleSubmitExam = () => {
    if (!activeExam) return;
    const unanswered = activeExam.questions.length - Object.keys(answers).length;
    if (unanswered > 0 && !window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Vẫn nộp bài?`)) return;
    setSubmitted(true);
    setExamMode('result');
  };

  const downloadAnswerKey = (exam) => {
    const questions = buildQuestions(exam);
    const lines = [
      `EduPortal - Dap an de thi cong dong`,
      `De: ${exam.title}`,
      `Mon: ${exam.subject} - Lop ${exam.grade}`,
      `Do kho: ${exam.difficulty}`,
      '',
      ...questions.map(question => (
        `Cau ${question.displayNumber}: ${question.correctKey} - ${stripHtml(question.explanation)}`
      )),
    ];
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exam.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'dap-an-de-thi'}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    logUsedOnce(exam.id);
  };

  const result = calculateResult();

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={22} color="#6366f1" /> Kho Đề Thi Cộng Đồng
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Tổng hợp {filtered.length} đề thi từ giáo viên - xem đề, làm bài và tải đáp án
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['votes', 'Bình chọn'], ['usage', 'Nhiều dùng'], ['newest', 'Mới nhất']].map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)} className={`btn ${sortBy === val ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Add form modal */}
      {showAdd && createPortal((
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: '#fff', maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Đóng góp đề thi mới</h3>
              <button onClick={() => setShowAdd(false)} className="icon-btn" aria-label="Đóng form đóng góp"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Tên đề thi *</label>
                <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Đề Toán luyện thi THPT 2026 - Chuyên đề Hàm số" required style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Môn học</label>
                  <select className="form-control" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Khối lớp</label>
                  <select className="form-control" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }}>
                    <option value="10">Lớp 10</option><option value="11">Lớp 11</option><option value="12">Lớp 12</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Độ khó</label>
                  <select className="form-control" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }}>
                    <option value="Dễ">Dễ</option><option value="Trung bình">Trung bình</option><option value="Khó">Khó</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Số câu hỏi</label>
                <input className="form-control" type="number" min={1} max={60} value={form.questionCount} onChange={e => setForm(f => ({ ...f, questionCount: e.target.value }))} placeholder="20" style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mô tả nội dung *</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn gọn nội dung, phạm vi kiến thức..." required style={{ resize: 'vertical', background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} /> Đóng góp</button>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}

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
                <span>{exam.subject}</span>
                <span>Lớp {exam.grade}</span>
                <span>{exam.questionCount} câu</span>
                <span><Users size={11} style={{ verticalAlign: 'middle' }} /> {exam.usedCount} lượt dùng</span>
                <span>GV: {exam.authorName}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <button onClick={() => openExam(exam, 'preview')} className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '0.78rem', gap: 5 }}><Eye size={14} /> Xem đề</button>
                <button onClick={() => openExam(exam, 'taking')} className="btn btn-primary" style={{ padding: '7px 12px', fontSize: '0.78rem', gap: 5 }}><PlayCircle size={14} /> Làm bài</button>
                <button onClick={() => downloadAnswerKey(exam)} className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '0.78rem', gap: 5 }}><Download size={14} /> Tải đáp án</button>
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

      {activeExam && createPortal((
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white', maxWidth: 920 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#111827' }}>{activeExam.title}</h3>
                <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {activeExam.subject} - Lớp {activeExam.grade} - {activeExam.questions.length} câu - {activeExam.difficulty}
                </p>
              </div>
              <button className="icon-btn" onClick={closeExam} aria-label="Đóng đề thi"><X size={18} /></button>
            </div>

            {examMode === 'result' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontWeight: 800 }}><CheckCircle size={18} /> Điểm số</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#065f46', marginTop: 4 }}>{result.score}/10</div>
                </div>
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4f46e5', fontWeight: 800 }}><AlertCircle size={18} /> Kết quả</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#312e81', marginTop: 8 }}>
                    Đúng {result.correct}/{activeExam.questions.length} câu
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '58vh', overflowY: 'auto', paddingRight: 4 }}>
              {activeExam.questions.map((question) => {
                const answered = answers[question.id];
                const isCorrect = answered === question.correctKey;
                const showAnswer = examMode === 'preview' || examMode === 'result';
                return (
                  <div key={question.id} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: '#fff' }}>
                    <div style={{ fontWeight: 800, color: '#111827', marginBottom: 10, lineHeight: 1.5 }}>
                      Câu {question.displayNumber}: <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(question.question) }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {question.options.map(option => {
                        const selected = answered === option.key;
                        const correct = question.correctKey === option.key;
                        const highlight = showAnswer && correct;
                        const wrong = examMode === 'result' && selected && !correct;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => selectAnswer(question.id, option.key)}
                            disabled={examMode !== 'taking' || submitted}
                            style={{
                              textAlign: 'left',
                              padding: '9px 11px',
                              borderRadius: 10,
                              border: highlight ? '1.5px solid #10b981' : wrong ? '1.5px solid #ef4444' : selected ? '1.5px solid #6366f1' : '1px solid #d1d5db',
                              background: highlight ? 'rgba(16,185,129,0.08)' : wrong ? 'rgba(239,68,68,0.08)' : selected ? 'rgba(99,102,241,0.08)' : 'white',
                              color: '#1f2937',
                              cursor: examMode === 'taking' && !submitted ? 'pointer' : 'default',
                              lineHeight: 1.45,
                            }}
                          >
                            <strong>{option.key}.</strong> <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(option.text) }} />
                          </button>
                        );
                      })}
                    </div>
                    {showAnswer && (
                      <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: '#f8fafc', fontSize: '0.82rem', color: '#334155', lineHeight: 1.55 }}>
                        <strong>Đáp án đúng: {question.correctKey}</strong>
                        {examMode === 'result' && (
                          <span style={{ color: isCorrect ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {' '}({isCorrect ? 'Bạn trả lời đúng' : `Bạn chọn ${answered || 'chưa chọn'}`})
                          </span>
                        )}
                        <div style={{ marginTop: 5 }} dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(question.explanation) }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700 }}>
                {examMode === 'taking'
                  ? `Đã trả lời ${Object.keys(answers).length}/${activeExam.questions.length} câu`
                  : 'Có thể xem đề, tải đáp án hoặc chuyển sang làm bài ngay.'}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => downloadAnswerKey(activeExam)}><Download size={15} /> Tải đáp án</button>
                {examMode !== 'taking' && <button className="btn btn-primary" onClick={() => { setAnswers({}); setSubmitted(false); setExamMode('taking'); }}><PlayCircle size={15} /> Làm bài</button>}
                {examMode === 'taking' && <button className="btn btn-primary" onClick={handleSubmitExam}><CheckCircle size={15} /> Nộp bài</button>}
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
