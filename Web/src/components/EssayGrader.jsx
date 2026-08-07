import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  FileText, Sparkles, CheckCircle, AlertCircle, Award, PenTool, Check
} from 'lucide-react';
import { isTeacher as isTeacherRole } from '../lib/roles';

export default function EssayGrader() {
  const { currentRole, selectedStudentId, students, essaySubmissions, submitEssayForAiGrading, approveOrEditEssayGrade } = useContext(AppContext);
  
  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];
  const isStudent = currentRole === 'student';
  const isTeacher = isTeacherRole(currentRole) || currentRole === 'admin'; // admin can also grade

  // Student Form State
  const [subject, setSubject] = useState('English');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [gradingInProgress, setGradingInProgress] = useState(false);
  const [latestGradedEssay, setLatestGradedEssay] = useState(null);

  // Teacher Review State
  const [selectedEssayId, setSelectedEssayId] = useState(null);
  const [teacherScore, setTeacherScore] = useState('');
  const [teacherComment, setTeacherComment] = useState('');

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!student || !title.trim() || !content.trim()) return;

    setGradingInProgress(true);
    setLatestGradedEssay(null);

    // Simulate AI grading lag (1.5s)
    setTimeout(() => {
      const res = submitEssayForAiGrading(student.id, student.name, subject, title, content);
      setLatestGradedEssay(res);
      setGradingInProgress(false);
      setTitle('');
      setContent('');
      alert('Đã chấm nháp xong bài viết của bạn.');
    }, 1500);
  };

  const handleTeacherApprove = (e) => {
    e.preventDefault();
    if (!selectedEssayId || !teacherScore) return;

    approveOrEditEssayGrade(selectedEssayId, teacherScore, teacherComment);
    alert('Đã phê duyệt và lưu điểm chính thức cho học sinh!');
    setSelectedEssayId(null);
    setTeacherScore('');
    setTeacherComment('');
  };

  // Filter essays
  const studentEssays = essaySubmissions?.filter(es => es.studentId === student?.id) || [];
  const selectedEssay = essaySubmissions?.find(es => es.id === selectedEssayId);

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.4rem', color: '#1e293b' }}>
          📝 Chấm Bài Luận Tự Động
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Hệ thống phân tích ngữ pháp tiếng Anh & Nghị luận văn học kết hợp phê duyệt từ giáo viên bộ môn.
        </p>
      </div>

      {/* ── 1. STUDENT VIEW ── */}
      {isStudent && (
        <div className="ds-rail" style={{ '--rail': '340px', gap: 24 }}>
          {/* Submit form */}
          <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PenTool size={18} /> Soạn thảo bài tự luận mới
            </h4>

            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Môn học tự luận</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSubject('English')}
                    className={`btn ${subject === 'English' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    English (Writing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubject('Literature')}
                    className={`btn ${subject === 'Literature' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Ngữ văn (Nghị luận)
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Tiêu đề bài viết</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề hoặc đề bài luận..."
                  className="form-control"
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>Nội dung bài luận</label>
                  <span style={{ fontSize: '0.75rem', color: wordCount < 100 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {wordCount} từ (Yêu cầu &ge; 100 từ)
                  </span>
                </div>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)}
                  placeholder={
                    subject === 'English' 
                      ? "Write your English essay here. Example: 'In today's society, artificial intelligence plays an increasingly vital role...'"
                      : "Nhập nội dung bài văn nghị luận của bạn vào đây..."
                  }
                  className="form-control"
                  rows={8}
                  style={{ 
                    background: 'white', 
                    borderColor: '#cbd5e1', 
                    color: '#1e293b', 
                    fontSize: '0.9rem', 
                    lineHeight: '1.5',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={gradingInProgress || wordCount === 0}
                className="btn btn-primary"
                style={{ 
                  height: 44, 
                  fontSize: '0.9rem', 
                  gap: 8, 
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none',
                  boxShadow: '0 4px 12px -3px rgba(99, 102, 241, 0.3)'
                }}
              >
                <Sparkles size={16} /> 
                {gradingInProgress ? 'Đang phân tích bài viết...' : 'Chấm Điểm Nháp Tự Động'}
              </button>
            </form>
          </div>

          {/* Graded Output & History list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* LATEST AI GRADE */}
            {(latestGradedEssay || gradingInProgress) && (
              <div className="glass-panel" style={{ padding: 16, border: '1px solid rgba(99,102,241,0.15)', background: 'rgba(255,255,255,0.85)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} /> Kết quả AI vừa chấm nháp:
                </h4>
                
                {gradingInProgress ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 12 }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      border: '3px solid rgba(99,102,241,0.1)', 
                      borderTopColor: 'var(--accent-primary)', 
                      borderRadius: '50%',
                      animation: 'spin 0.8s infinite linear' 
                    }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mạng nơ-ron đang chạy kiểm thử ngữ pháp...</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', gap: 10, background: 'rgba(99,102,241,0.05)', padding: 10, borderRadius: 12, marginBottom: 12 }}>
                      <Award size={28} color="var(--accent-primary)" />
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Điểm số AI đánh giá</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{latestGradedEssay.aiEvaluation.score} / 10</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--accent-danger)', marginBottom: 4 }}>
                        <AlertCircle size={12} /> Phát hiện {latestGradedEssay.aiEvaluation.grammarErrorsCount} lỗi ngữ pháp/chính tả
                      </div>
                      <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {latestGradedEssay.aiEvaluation.suggestions.map((sug, idx) => (
                          <li key={idx}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MY ESSAYS HISTORY */}
            <div className="glass-panel" style={{ padding: 16, background: 'rgba(255,255,255,0.6)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} /> Bài luận đã nộp ({studentEssays.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 300 }}>
                {studentEssays.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '30px 10px' }}>
                    Chưa gửi bài luận nào.
                  </div>
                ) : (
                  studentEssays.map(es => (
                    <div 
                      key={es.id} 
                      style={{ 
                        padding: 10, 
                        borderRadius: 12, 
                        background: '#fff', 
                        border: '1px solid rgba(0,0,0,0.03)',
                        fontSize: '0.78rem' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: es.subject === 'English' ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                          {es.subject === 'English' ? '📝 Anh' : '📝 Văn'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{es.date}</span>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{es.title}</div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px dashed rgba(0,0,0,0.04)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          AI nháp: <strong style={{ color: 'var(--accent-primary)' }}>{es.aiEvaluation.score}</strong>
                        </span>
                        <span>
                          {es.teacherFeedback.approved ? (
                            <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <CheckCircle size={10} /> Đã duyệt: <strong>{es.teacherFeedback.score}đ</strong>
                            </span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontSize: '0.72rem', fontStyle: 'italic' }}>Chờ GV duyệt</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. TEACHER / ADMIN VIEW ── */}
      {isTeacher && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          {/* Submission list */}
          <div className="glass-panel" style={{ padding: 16, background: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480 }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} /> Danh sách bài luận học sinh nộp
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, maxHeight: 420 }}>
              {essaySubmissions?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '40px 10px' }}>
                  Chưa có bài luận nào được nộp trong hệ thống.
                </div>
              ) : (
                essaySubmissions?.map(es => {
                  const isSelected = selectedEssayId === es.id;
                  return (
                    <button
                      key={es.id}
                      onClick={() => {
                        setSelectedEssayId(es.id);
                        setTeacherScore(es.teacherFeedback.approved ? String(es.teacherFeedback.score) : String(es.aiEvaluation.score));
                        setTeacherComment(es.teacherFeedback.comment || '');
                      }}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: isSelected ? 'rgba(99,102,241,0.08)' : '#fff',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.04)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.72rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{es.studentName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{es.date}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{es.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.72rem', marginTop: 4 }}>
                        <span style={{ color: es.subject === 'English' ? 'var(--accent-primary)' : 'var(--accent-secondary)', fontWeight: 600 }}>
                          {es.subject === 'English' ? 'English' : 'Văn học'}
                        </span>
                        {es.teacherFeedback.approved ? (
                          <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CheckCircle size={10} /> {es.teacherFeedback.score}đ
                          </span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>AI: {es.aiEvaluation.score}đ (Chờ duyệt)</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Grading detail review form */}
          <div>
            {selectedEssay ? (
              <div className="glass-panel animate-fade" style={{ padding: 20, background: 'rgba(255,255,255,0.8)' }}>
                {/* Header detail */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 14, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>{selectedEssay.title}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Học sinh: <strong>{selectedEssay.studentName}</strong> (Mã: {selectedEssay.studentId}) | Ngày nộp: {selectedEssay.date}
                    </p>
                  </div>
                  <span className="badge badge-info">{selectedEssay.subject}</span>
                </div>

                {/* Essay text body */}
                <div style={{ 
                  background: '#fff', 
                  border: '1px solid rgba(0,0,0,0.06)', 
                  borderRadius: 14, 
                  padding: 16, 
                  fontSize: '0.9rem', 
                  lineHeight: '1.6', 
                  color: '#334155', 
                  maxHeight: 220, 
                  overflowY: 'auto',
                  marginBottom: 16,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedEssay.content}
                </div>

                {/* AI evaluation panel */}
                <div style={{ 
                  background: 'rgba(99,102,241,0.04)', 
                  border: '1px solid rgba(99,102,241,0.08)', 
                  borderRadius: 14, 
                  padding: 14,
                  marginBottom: 16
                }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} /> Điểm số đề xuất bởi trợ lý AI
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14 }}>
                    <div style={{ background: '#fff', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AI Điểm Nháp</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{selectedEssay.aiEvaluation.score}</div>
                    </div>
                    <div style={{ fontSize: '0.78rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <AlertCircle size={10} /> Phát hiện {selectedEssay.aiEvaluation.grammarErrorsCount} lỗi ngữ pháp/diễn đạt
                      </div>
                      <ul style={{ paddingLeft: 14, margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedEssay.aiEvaluation.suggestions.map((sug, idx) => (
                          <li key={idx}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Approval inputs */}
                <form onSubmit={handleTeacherApprove} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Điểm chính thức</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="10"
                        value={teacherScore}
                        onChange={e => setTeacherScore(e.target.value)}
                        className="form-control"
                        style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Lời phê & Phản hồi</label>
                      <input 
                        type="text" 
                        value={teacherComment}
                        onChange={e => setTeacherComment(e.target.value)}
                        placeholder="Thầy/Cô ghi nhận xét cho học sinh..."
                        className="form-control"
                        style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 10, marginTop: 4 }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedEssayId(null)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ 
                        padding: '8px 24px', 
                        fontSize: '0.85rem', 
                        gap: 6,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        boxShadow: '0 4px 12px -3px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Check size={16} /> Phê Duyệt Điểm & Lời Phê
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '80px 20px', 
                border: '1px dashed rgba(0,0,0,0.06)', 
                borderRadius: 16,
                color: 'var(--text-muted)' 
              }}>
                <FileText size={44} style={{ opacity: 0.4, marginBottom: 12 }} />
                Chọn một bài tự luận ở danh mục bên trái để chấm điểm và phản hồi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
