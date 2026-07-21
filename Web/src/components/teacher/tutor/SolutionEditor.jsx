import { Plus, Trash2 } from 'lucide-react';

export default function SolutionEditor({ solutions = [], onChange }) {
  // If no solutions, we can initialize a blank one or let it be empty
  const addSolution = () => {
    const newSol = {
      problem: '',
      answer: '',
      answer_locked: true,
      steps: [{ n: 1, content: '', hint: '' }]
    };
    onChange([...solutions, newSol]);
  };

  const removeSolution = (index) => {
    onChange(solutions.filter((_, idx) => idx !== index));
  };

  const updateSolution = (index, field, value) => {
    onChange(solutions.map((sol, idx) => {
      if (idx === index) {
        return { ...sol, [field]: value };
      }
      return sol;
    }));
  };

  const addStep = (solIndex) => {
    onChange(solutions.map((sol, idx) => {
      if (idx === solIndex) {
        const nextN = sol.steps.length + 1;
        return {
          ...sol,
          steps: [...sol.steps, { n: nextN, content: '', hint: '' }]
        };
      }
      return sol;
    }));
  };

  const removeStep = (solIndex, stepIndex) => {
    onChange(solutions.map((sol, idx) => {
      if (idx === solIndex) {
        const nextSteps = sol.steps
          .filter((_, sIdx) => sIdx !== stepIndex)
          .map((step, newIdx) => ({ ...step, n: newIdx + 1 }));
        return { ...sol, steps: nextSteps };
      }
      return sol;
    }));
  };

  const updateStep = (solIndex, stepIndex, field, value) => {
    onChange(solutions.map((sol, idx) => {
      if (idx === solIndex) {
        const nextSteps = sol.steps.map((step, sIdx) => {
          if (sIdx === stepIndex) {
            return { ...step, [field]: value };
          }
          return step;
        });
        return { ...sol, steps: nextSteps };
      }
      return sol;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
          BÀI TẬP VÀ LỜI GIẢI MẪU THEO BƯỚC
        </h4>
        <button
          type="button"
          onClick={addSolution}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, height: 'auto' }}
        >
          <Plus size={14} /> Thêm Bài Giải Mẫu
        </button>
      </div>

      {solutions.length === 0 && (
        <div style={{ padding: '16px 20px', border: '1.5px dashed rgba(148,163,184,0.18)', borderRadius: 10, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
          Chưa có bài giải mẫu. Bấm nút phía trên để thêm bài giải giúp gia sư dạy hiệu quả hơn.
        </div>
      )}

      {solutions.map((sol, solIdx) => (
        <div 
          key={solIdx} 
          style={{ 
            padding: 18, 
            borderRadius: 12, 
            border: '1px solid rgba(148,163,184,0.2)', 
            background: 'rgba(0,0,0,0.01)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>Mẫu #{solIdx + 1}</span>
            <button
              type="button"
              onClick={() => removeSolution(solIdx)}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 4 }}
              title="Xóa bài giải mẫu này"
            >
              <Trash2 size={15} /> <span style={{ fontSize: 12 }}>Xóa mẫu</span>
            </button>
          </div>

          {/* Problem field */}
          <div className="field" style={{ margin: 0 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Đề bài</label>
            <textarea
              className="input"
              value={sol.problem}
              onChange={e => updateSolution(solIdx, 'problem', e.target.value)}
              placeholder="Ví dụ: Tính tích phân từ 1 đến e của x ln(x) dx..."
              style={{ minHeight: 60, fontSize: 13 }}
              required
            />
          </div>

          {/* Steps section */}
          <div style={{ marginTop: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Các bước giải & Gợi ý cho học sinh:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sol.steps.map((step, stepIdx) => (
                <div 
                  key={stepIdx} 
                  style={{ 
                    display: 'flex', 
                    gap: 10, 
                    alignItems: 'flex-start',
                    background: '#fff', 
                    padding: 10, 
                    borderRadius: 8, 
                    border: '1px solid rgba(148,163,184,0.12)' 
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 6 }}>
                    {step.n}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      className="input"
                      value={step.content}
                      onChange={e => updateStep(solIdx, stepIdx, 'content', e.target.value)}
                      placeholder={`Bước ${step.n}: Nội dung lời giải (ví dụ: Đặt u = ln(x))`}
                      style={{ height: 36, fontSize: 12.5 }}
                      required
                    />
                    <input
                      className="input"
                      value={step.hint}
                      onChange={e => updateStep(solIdx, stepIdx, 'hint', e.target.value)}
                      placeholder={`Gợi ý khi học sinh bí (ví dụ: Hãy nghĩ xem nên chọn u là hàm nào?)`}
                      style={{ height: 32, fontSize: 12, opacity: 0.85 }}
                    />
                  </div>
                  {sol.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(solIdx, stepIdx)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, marginTop: 6 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addStep(solIdx)}
              className="btn"
              style={{ 
                marginTop: 10, 
                padding: '5px 12px', 
                fontSize: 11.5, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 5,
                background: 'transparent',
                border: '1px dashed rgba(148,163,184,0.3)',
                height: 'auto'
              }}
            >
              <Plus size={13} /> Thêm Bước Giải tiếp theo
            </button>
          </div>

          {/* Final Answer field */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end', marginTop: 6 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Đáp án cuối</label>
              <input
                className="input"
                value={sol.answer}
                onChange={e => updateSolution(solIdx, 'answer', e.target.value)}
                placeholder="Ví dụ: (e^2 + 1)/4"
                style={{ height: 36, fontSize: 13 }}
                required
              />
            </div>
            <label className="flex items-center gap-6" style={{ cursor: 'pointer', paddingBottom: 10, fontSize: 12.5 }}>
              <input
                type="checkbox"
                checked={sol.answer_locked}
                onChange={e => updateSolution(solIdx, 'answer_locked', e.target.checked)}
              />
              <span>Ẩn đáp án đối với HS</span>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
