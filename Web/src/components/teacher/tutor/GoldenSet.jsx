import { useState } from 'react';
import { runGoldenEvaluation } from '../../../lib/tutor/evalRunner';
import { Award, Play, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function GoldenSet({ tests = [], entries = [], onAddTest }) {
  const [newQuestion, setNewQuestion] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [evalResult, setEvalResult] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newQuestion || !newExpected) return;
    onAddTest({
      id: 'GT' + Date.now(),
      question: newQuestion,
      expected_behavior: newExpected
    });
    setNewQuestion('');
    setNewExpected('');
  };

  const handleRunEval = () => {
    const res = runGoldenEvaluation(tests, entries);
    setEvalResult(res);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Run button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={18} style={{ color: 'var(--accent)' }} /> BỘ ĐỀ VÀNG KIỂM THỬ (Golden Test Set)
          </h4>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Ngăn chặn gia sư hỏng tri thức khi xuất bản phiên bản mới.
          </span>
        </div>
        <button
          onClick={handleRunEval}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, height: 'auto' }}
        >
          <Play size={15} /> Chạy Kiểm Thử Bộ Đề Vàng
        </button>
      </div>

      {/* Eval Results Banner */}
      {evalResult && (
        <div 
          className="card animate-fade"
          style={{ 
            padding: 16, 
            background: evalResult.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            border: evalResult.passed ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {evalResult.passed ? <CheckCircle color="var(--mint)" size={22} /> : <XCircle color="#ef4444" size={22} />}
            <div>
              <strong style={{ fontSize: 14 }}>
                {evalResult.passed ? 'Tất cả bài test ĐẠT (Pass 100%)' : `Phát hiện lỗi hồi quy (${evalResult.passCount}/${evalResult.totalCount} Pass)`}
              </strong>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Điểm đánh giá: {evalResult.score}/100</div>
            </div>
          </div>
        </div>
      )}

      {/* Form Add Test Case */}
      <form onSubmit={handleAdd} className="card" style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
        <div className="field" style={{ margin: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Câu hỏi test mẫu</label>
          <input
            className="input"
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="Ví dụ: Tính tích phân từng phần..."
            style={{ height: 36, fontSize: 12.5 }}
            required
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Hành vi / Nội dung kỳ vọng</label>
          <input
            className="input"
            value={newExpected}
            onChange={e => setNewExpected(e.target.value)}
            placeholder="Ví dụ: Phải trả về công thức u dv = uv - v du"
            style={{ height: 36, fontSize: 12.5 }}
            required
          />
        </div>
        <button type="submit" className="btn btn-secondary" style={{ padding: '0 14px', height: 36, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> Thêm Test Case
        </button>
      </form>

      {/* Test cases list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tests.map(t => {
          const res = evalResult?.results?.find(r => r.testId === t.id);
          return (
            <div key={t.id} className="card p-12 flex between items-center" style={{ fontSize: 13 }}>
              <div>
                <strong>{t.question}</strong>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Kỳ vọng: {t.expected_behavior}</div>
              </div>
              {res && (
                <span style={{ fontSize: 12, fontWeight: 700, color: res.passed ? 'var(--mint)' : '#ef4444' }}>
                  {res.passed ? '✓ PASSED' : '✗ FAILED'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
