import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Paperclip, CheckSquare, Sparkles } from 'lucide-react';

export default function AssignmentsTab({ student }) {
  const { assignments, submissions: allSubmissions, submitAssignment } = useContext(AppContext);
  const [submissionTexts, setSubmissionTexts] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({}); // { [assignmentId]: { [qIdx]: answer } }

  const myAssignments = assignments ? assignments.filter(a => a.classTarget === student.class) : [];

  const handleSubSubmit = (assignmentId) => {
    const text = submissionTexts[assignmentId];
    if (!text || !text.trim()) {
      alert('Vui lòng nhập nội dung câu trả lời/bài làm trước khi nộp!');
      return;
    }
    submitAssignment(assignmentId, student.id, text);
    setSubmissionTexts(prev => ({ ...prev, [assignmentId]: '' }));
    alert('Đã nộp bài làm thành công! Hệ thống sẽ cập nhật trạng thái chấm điểm của giáo viên bộ môn.');
  };

  const handleQuizSubmit = (assignment, questions) => {
    const answers = quizAnswers[assignment.id] || {};
    if (Object.keys(answers).length < questions.length) {
      alert('Vui lòng trả lời đầy đủ tất cả các câu hỏi trắc nghiệm trước khi nộp!');
      return;
    }
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctKey) {
        correctCount++;
      }
    });
    const finalScore = parseFloat(((correctCount / questions.length) * 10).toFixed(1));
    const submissionText = `Kết quả trắc nghiệm AI: Đúng ${correctCount}/${questions.length} câu. Chi tiết: ` + 
      questions.map((q, idx) => `Câu ${idx+1}: ${answers[idx] === q.correctKey ? 'Đúng' : 'Sai'} (Chọn ${answers[idx]}, Đáp án ${q.correctKey})`).join('; ');

    submitAssignment(assignment.id, student.id, submissionText, finalScore);
    alert(`Đã nộp bài trắc nghiệm thành công! Hệ thống AI đã tự động chấm điểm bài làm của bạn: ${finalScore}/10 điểm.`);
  };

  const handleSelectAnswer = (assignmentId, qIdx, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || {}),
        [qIdx]: answer
      }
    }));
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Danh sách Bài Tập Về Nhà được giao</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Hãy hoàn thành đúng hạn các bài tập tự luận/trắc nghiệm từ giáo viên bộ môn.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {myAssignments.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Chưa có bài tập nào được giao cho lớp {student.class}.
          </div>
        ) : (
          myAssignments.map(assignment => {
            const sub = allSubmissions.find(s => s.assignmentId === assignment.id && s.studentId === student.id);
            const isSubmitted = !!sub;
            const isGraded = isSubmitted && sub.status === 'graded';
            const score = isGraded ? sub.grade : null;
            const feedback = isGraded ? sub.feedback : '';
            const subText = submissionTexts[assignment.id] || '';
            const isQuiz = !!assignment.questions && assignment.questions.length > 0;
            const activeAnswers = quizAnswers[assignment.id] || {};

            return (
              <div
                key={assignment.id}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: 'white',
                  border: isGraded ? '1.5px solid rgba(16, 185, 129, 0.25)' : isSubmitted ? '1.5px solid rgba(59, 130, 246, 0.25)' : '1px solid var(--border-card)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
                className="animate-fade"
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {isQuiz && <Sparkles size={12} />} {assignment.subject} • {assignment.teacherName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hạn: {assignment.deadline}</span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>
                    {assignment.title}
                  </h3>

                  <p style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    background: 'rgba(0,0,0,0.01)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.02)',
                    margin: '8px 0 16px 0',
                    whiteSpace: 'pre-line'
                  }}>
                    {assignment.content}
                  </p>

                  {assignment.fileName && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '16px', 
                      padding: '8px 12px', 
                      background: 'rgba(99, 102, 241, 0.05)', 
                      border: '1px solid rgba(99, 102, 241, 0.15)', 
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 600
                    }}>
                      <Paperclip size={14} />
                      <span>Tệp đính kèm: <strong style={{ textDecoration: 'underline', cursor: 'pointer' }}>{assignment.fileName}</strong></span>
                    </div>
                  )}

                  {/* Submission status & Details */}
                  {isGraded ? (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{score}</span>
                        <div style={{ fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>Đã chấm điểm (thang 10)</div>
                          <div style={{ color: 'var(--text-muted)' }}>Bài nộp hoàn thành thành công</div>
                        </div>
                      </div>
                      {feedback && (
                        <p style={{ fontSize: '0.85rem', padding: '8px 12px', background: 'rgba(0, 0, 0, 0.01)', borderLeft: '3px solid var(--accent-secondary)', borderRadius: '0 8px 8px 0', fontStyle: 'italic', margin: '4px 0', color: 'var(--text-secondary)' }}>
                          <strong>Lời phê:</strong> "{feedback}"
                        </p>
                      )}
                      {sub.submissionText && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                          <strong>Chi tiết bài làm:</strong> {sub.submissionText}
                        </div>
                      )}
                    </div>
                  ) : isSubmitted ? (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                        <span>Đã nộp bài làm</span>
                        <span>{sub.submittedAt}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Đang chờ thầy/cô xem xét chấm điểm...</span>
                    </div>
                  ) : isQuiz ? (
                    /* AI Interactive Quiz Render Mode */
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>
                        <Sparkles size={14} />
                        <span>Bài kiểm tra trắc nghiệm tự động bằng AI</span>
                      </div>
                      
                      {assignment.questions.map((q, idx) => (
                        <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Câu {idx + 1}: {q.question}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {q.options.map((opt, oIdx) => {
                              const optKey = opt.trim().substring(0, 1); // Extract 'A', 'B', 'C', 'D'
                              const isSelected = activeAnswers[idx] === optKey;
                              return (
                                <label key={oIdx} style={{ 
                                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: `1px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`, 
                                  background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'white', cursor: 'pointer', fontSize: '0.82rem', margin: 0, transition: 'all 0.15s ease' 
                                }}>
                                  <input 
                                    type="radio" 
                                    name={`q-${assignment.id}-${idx}`} 
                                    checked={isSelected}
                                    onChange={() => handleSelectAnswer(assignment.id, idx, optKey)}
                                    style={{ accentColor: '#6366f1' }}
                                  />
                                  <span style={{ color: isSelected ? '#4f46e5' : '#475569', fontWeight: isSelected ? 600 : 500 }}>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleQuizSubmit(assignment, assignment.questions)}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '10px 0', fontSize: '0.85rem', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
                      >
                        <CheckSquare size={16} /> Nộp bài trắc nghiệm AI
                      </button>
                    </div>
                  ) : (
                    /* Standard Homework text mode */
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-danger)', fontWeight: 600, marginBottom: '6px' }}>
                        <span>🔴 Chưa nộp bài làm</span>
                      </div>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Nhập nội dung bài giải hoặc văn bản nộp bài..."
                        value={subText}
                        onChange={e => setSubmissionTexts(prev => ({ ...prev, [assignment.id]: e.target.value }))}
                        style={{ fontSize: '0.85rem', resize: 'none', background: 'white', borderColor: 'var(--border-card)', color: '#1e293b' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSubSubmit(assignment.id)}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '8px 0', fontSize: '0.85rem', marginTop: '8px' }}
                      >
                        Nộp bài tập trực tuyến
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
