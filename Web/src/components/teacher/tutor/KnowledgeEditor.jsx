import { useState } from 'react';
import SolutionEditor from './SolutionEditor';
import { ArrowLeft, Save } from 'lucide-react';

export default function KnowledgeEditor({ entry, teacherSubject, onSave, onCancel }) {
  const [topic, setTopic] = useState(entry?.topic || '');
  const [triggersText, setTriggersText] = useState(entry?.triggers ? entry.triggers.join(', ') : '');
  const [content, setContent] = useState(entry?.content || '');
  const [sourceRef, setSourceRef] = useState(entry?.source_ref || '');
  const [status, setStatus] = useState(entry?.status || 'draft');
  const [solutions, setSolutions] = useState(entry?.solutions || []);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Parse triggers text
    const triggers = triggersText
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const savedEntry = {
      ...(entry || {}),
      layer: 'teacher',
      subject: teacherSubject || 'Toán học',
      topic,
      triggers,
      content,
      source_ref: sourceRef,
      status
    };

    onSave(savedEntry, solutions);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(148,163,184,0.12)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: 4
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="display" style={{ fontSize: '1.4rem', margin: 0 }}>
            {entry ? 'Chỉnh Sửa Kiến Thức' : 'Thêm Mới Kiến Thức'}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: 13.5, height: 'auto' }}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, height: 'auto' }}
          >
            <Save size={16} /> Lưu Lại
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Side: General Info */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px dashed rgba(148,163,184,0.15)', paddingBottom: 8 }}>
            THÔNG TIN KHÁI NIỆM & LÝ THUYẾT
          </h4>

          {/* Topic Title */}
          <div className="field">
            <label htmlFor="edit-topic">Tên chủ đề / Khái niệm</label>
            <input
              id="edit-topic"
              className="input"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ví dụ: Tích phân từng phần"
              required
            />
          </div>

          {/* Triggers */}
          <div className="field">
            <label htmlFor="edit-triggers">Từ khóa kích hoạt (Triggers)</label>
            <input
              id="edit-triggers"
              className="input"
              value={triggersText}
              onChange={e => setTriggersText(e.target.value)}
              placeholder="Ví dụ: tich phan tung phan, nguyen ham tung phan, tung phan"
              required
            />
            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
              Nhập các từ khóa phân tách bằng dấu phẩy. Gia sư sẽ truy xuất mục này khi HS nhắn trùng từ khóa.
            </span>
          </div>

          {/* Core Content */}
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label htmlFor="edit-content">Nội dung cốt lõi / Công thức lý thuyết</label>
              <span style={{ fontSize: 11, color: 'var(--accent)' }}>Hỗ trợ công thức LaTeX: $$x^2$$</span>
            </div>
            <textarea
              id="edit-content"
              className="input"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Ví dụ: Công thức từng phần: \int u dv = u v - \int v du..."
              style={{ minHeight: 140, fontFamily: 'monospace', fontSize: 13 }}
              required
            />
          </div>

          {/* Reference Source */}
          <div className="field">
            <label htmlFor="edit-source">Nguồn tài liệu tham khảo</label>
            <input
              id="edit-source"
              className="input"
              value={sourceRef}
              onChange={e => setSourceRef(e.target.value)}
              placeholder="Ví dụ: SGK Cánh Diều Lớp 12 - Chương 3 Bài 2"
            />
          </div>

          {/* Status */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Trạng thái lưu trữ:</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label className="flex items-center gap-6" style={{ cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                />
                <span>Bản nháp</span>
              </label>
              <label className="flex items-center gap-6" style={{ cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === 'published'}
                  onChange={() => setStatus('published')}
                />
                <span>Xuất bản</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Worked Solutions */}
        <div className="card" style={{ padding: 20 }}>
          <SolutionEditor solutions={solutions} onChange={setSolutions} />
        </div>
      </div>
    </form>
  );
}
