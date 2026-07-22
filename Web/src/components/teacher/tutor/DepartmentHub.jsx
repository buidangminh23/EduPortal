import { useState } from 'react';
import { Users, CheckCircle, Plus } from 'lucide-react';

export default function DepartmentHub({ groupEntries = [], onApproveGroupEntry }) {
  const [proposedTopic, setProposedTopic] = useState('');
  const [proposedContent, setProposedContent] = useState('');

  const handlePropose = (e) => {
    e.preventDefault();
    if (!proposedTopic || !proposedContent) return;
    onApproveGroupEntry({
      id: 'GE' + Date.now(),
      topic: proposedTopic,
      content: proposedContent,
      layer: 'group',
      status: 'published'
    });
    setProposedTopic('');
    setProposedContent('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={18} style={{ color: 'var(--accent)' }} /> QUẢN LÝ TỔ BỘ MÔN (Department Knowledge Hub)
          </h4>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Xây dựng kho kiến thức chung cho cả khối theo Thông tư 32/2020/TT-BGDĐT.
          </span>
        </div>
      </div>

      {/* Propose entry form */}
      <form onSubmit={handlePropose} className="card p-16 flex flex-col gap-12">
        <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Đề xuất tri thức dùng chung cho Tổ bộ môn</h5>
        <input
          className="input"
          value={proposedTopic}
          onChange={e => setProposedTopic(e.target.value)}
          placeholder="Tên chuyên đề / bài học..."
          style={{ height: 36, fontSize: 13 }}
          required
        />
        <textarea
          className="input"
          value={proposedContent}
          onChange={e => setProposedContent(e.target.value)}
          placeholder="Nội dung kiến thức / công thức dùng chung..."
          style={{ minHeight: 70, fontSize: 13 }}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
          <Plus size={14} /> Gửi Đề Xuất Cho Tổ Trưởng
        </button>
      </form>

      {/* Group entries list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groupEntries.map(ge => (
          <div key={ge.id} className="card p-16 flex between items-center">
            <div>
              <strong style={{ fontSize: 14 }}>{ge.topic}</strong>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>{ge.content}</div>
            </div>
            <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: 'var(--mint)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={13} /> Tổ duyệt
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
