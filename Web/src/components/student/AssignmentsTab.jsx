import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';

export default function AssignmentsTab({ student }) {
  const { assignments, submissions: allSubmissions, submitAssignment } = useContext(AppContext);
  const [submissionTexts, setSubmissionTexts] = useState({});

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
                    <span className="badge badge-info">{assignment.subject} • {assignment.teacherName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hạn: {assignment.deadline}</span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>
                    {assignment.title}
                  </h4>

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
                    </div>
                  ) : isSubmitted ? (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                        <span>Đã nộp bài làm</span>
                        <span>{sub.submittedAt}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Đang chờ thầy/cô xem xét chấm điểm...</span>
                    </div>
                  ) : (
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
