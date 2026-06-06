import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Star } from 'lucide-react';

export default function EvaluationsTab({ student }) {
  const { teachers, teacherEvaluations, submitTeacherEvaluation } = useContext(AppContext);
  const [evalTeacherId, setEvalTeacherId] = useState(teachers && teachers.length > 0 ? teachers[0].id : '');
  const [evalRating, setEvalRating] = useState(5);
  const [evalComment, setEvalComment] = useState('');

  const myEvaluations = teacherEvaluations ? teacherEvaluations.filter(e => e.raterRole === 'student' && e.raterName === student.name) : [];

  const handleEvaluationSubmit = (e) => {
    e.preventDefault();
    const finalTeacherId = evalTeacherId || (teachers && teachers.length > 0 ? teachers[0].id : '');
    if (!finalTeacherId || !evalComment.trim()) return;

    submitTeacherEvaluation(finalTeacherId, evalRating, evalComment, 'student', student.name);
    setEvalComment('');
    alert('Cảm ơn ý kiến của bạn! Đánh giá chất lượng giảng dạy đã được gửi trực tuyến tới Ban Giám Hiệu.');
  };

  return (
    <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
      {/* Survey Submission form */}
      <div>
        <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
          <Star size={18} color="var(--accent-primary)" />
          <span>Khảo sát Chất lượng Giảng dạy kì II</span>
        </h2>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Ý kiến phản hồi từ học sinh sẽ giúp các thầy cô nâng cao chất lượng bài học bộ môn. Đơn khảo sát sẽ được bảo mật và gửi trực tiếp tới Ban Giám Hiệu.
        </p>

        <form onSubmit={handleEvaluationSubmit}>
          <div className="form-group">
            <label className="form-label">Chọn Giáo viên bộ môn</label>
            <select
              className="form-control"
              value={evalTeacherId}
              onChange={e => setEvalTeacherId(e.target.value)}
              style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
            >
              {teachers && teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Đánh giá sao chất lượng bài giảng (1 - 5 sao)</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEvalRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <Star
                    size={28}
                    fill={evalRating >= star ? '#eab308' : 'none'}
                    color={evalRating >= star ? '#eab308' : '#cbd5e1'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nhận xét chi tiết (Ưu điểm, Góp ý phương pháp dạy...)</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Em muốn đóng góp ý kiến về việc giảng giải lý thuyết, giao bài tập về nhà hoặc không khí học tập trên lớp..."
              value={evalComment}
              onChange={e => setEvalComment(e.target.value)}
              required
              style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b', fontSize: '0.85rem' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            Gửi đơn khảo sát chất lượng giảng dạy
          </button>
        </form>
      </div>

      {/* Evaluations submitted history */}
      <div>
        <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Lịch sử đánh giá ({myEvaluations.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myEvaluations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
              Em chưa gửi phiếu đánh giá nào trong kì học này.
            </p>
          ) : (
            myEvaluations.map(item => (
              <div key={item.id} style={{ padding: '14px', border: '1px solid var(--border-card)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{item.teacherName}</strong>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={12}
                        fill={item.rating >= s ? '#eab308' : 'none'}
                        color={item.rating >= s ? '#eab308' : '#cbd5e1'}
                      />
                    ))}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{item.comment}"
                </p>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>{item.date}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
