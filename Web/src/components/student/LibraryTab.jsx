import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { BookOpen, Brain } from 'lucide-react';
import SmartFlashcard from '../SmartFlashcard';

const QUIZ_QUESTIONS = [
  { id: 1, q: 'Tích phân xác định ∫[0, 1] x dx có giá trị bằng:', a: '1/2', b: '1', c: '2', d: '0', ans: 'a' },
  { id: 2, q: 'Hiện tượng cộng hưởng xảy ra trong mạch RLC nối tiếp khi:', a: 'ZL > ZC', b: 'ZL < ZC', c: 'ZL = ZC', d: 'R = ZL', ans: 'c' },
  { id: 3, q: 'Tác giả của tác phẩm truyện ngắn danh tiếng "Vợ nhặt" là ai?', a: 'Tô Hoài', b: 'Kim Lân', c: 'Nam Cao', d: 'Nguyễn Tuân', ans: 'b' },
  { id: 4, q: 'Trong tiếng Anh, từ nào mang ý nghĩa là "người hướng dẫn/cố vấn"?', a: 'Mentor', b: 'Classmate', c: 'Principal', d: 'Schoolyard', ans: 'a' },
  { id: 5, q: 'Biểu thức tính tổng trở Z của mạch RLC nối tiếp là:', a: 'Z = R + ZL + ZC', b: 'Z = R + ZL - ZC', c: 'Z = sqrt(R² + (ZL - ZC)²)', d: 'Z = R² + (ZL - ZC)²', ans: 'c' }
];

export default function LibraryTab({ student }) {
  const { learningResources } = useContext(AppContext);
  const [activeQuizStep, setActiveQuizStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);

  const handleQuizSubmit = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.ans) {
        score++;
      }
    });
    setQuizScore(score);
    setActiveQuizStep(2);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizScore(0);
    setActiveQuizStep(1);
  };

  return (
    <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>

      {/* Digital resources & Quiz section */}
      <div>
        <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
          <BookOpen size={18} color="var(--accent-primary)" />
          <span>Học liệu số & Ôn tập ôn thi</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {learningResources && learningResources.map((res) => (
            <div id={res.id} key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
              <div>
                <span className="badge badge-info" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>{res.subject}</span>
                <h5 style={{ margin: 0, fontWeight: 700 }}>{res.title}</h5>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đăng bởi: {res.teacherName} • Ngày {res.dateUploaded.split('-').reverse().join('/')}</span>
              </div>
              <button onClick={() => alert('Bắt đầu tải tài liệu về máy...')} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}>
                Tải về
              </button>
            </div>
          ))}
        </div>

        {/* Quick Practice Quiz Card */}
        <div style={{ padding: '18px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.08)', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Brain size={18} color="var(--accent-primary)" />
            <span>Trắc nghiệm nhanh ôn luyện 5 câu</span>
          </h4>

          {activeQuizStep === 0 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Hãy kiểm tra nhanh kiến thức Toán học, Vật lý và Ngữ văn để rèn luyện tư duy làm bài trắc nghiệm.
              </p>
              <button onClick={() => setActiveQuizStep(1)} className="btn btn-primary">
                Bắt đầu làm bài
              </button>
            </div>
          )}

          {activeQuizStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {QUIZ_QUESTIONS.map((q) => (
                <div key={q.id} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 600 }}>Câu {q.id}: {q.q}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { key: 'a', label: q.a },
                      { key: 'b', label: q.b },
                      { key: 'c', label: q.c },
                      { key: 'd', label: q.d }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          borderRadius: '8px',
                          border: selectedAnswers[q.id] === opt.key ? '1.5px solid var(--accent-primary)' : '1px solid #cbd5e1',
                          background: selectedAnswers[q.id] === opt.key ? 'rgba(99, 102, 241, 0.05)' : 'white',
                          color: '#334155'
                        }}
                      >
                        <strong>{opt.key.toUpperCase()}.</strong> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={handleQuizSubmit} className="btn btn-primary" style={{ marginTop: '10px' }}>
                Nộp bài trắc nghiệm
              </button>
            </div>
          )}

          {activeQuizStep === 2 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <span className="badge badge-success" style={{ fontSize: '1.5rem', padding: '10px 24px', borderRadius: '30px', marginBottom: '14px' }}>
                Kết quả: {quizScore}/5 câu đúng
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {quizScore === 5 ? '🎉 Xuất sắc! Em đã trả lời đúng tất cả câu hỏi.' : quizScore >= 3 ? 'Khá tốt! Hãy cố gắng ôn luyện thêm để đạt điểm tuyệt đối.' : 'Em cần ôn tập thêm học liệu ở trên nhé.'}
              </p>
              <button onClick={handleResetQuiz} className="btn btn-secondary" style={{ marginTop: '12px' }}>
                Làm lại bài trắc nghiệm
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Flashcard 3D section */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <SmartFlashcard studentId={student.id} />
      </div>

    </div>
  );
}
