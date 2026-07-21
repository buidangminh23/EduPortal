import { useState } from 'react';
import { HelpCircle, Check, ArrowRight, Plus } from 'lucide-react';

export default function ReviewQueue({ queue = [], onReTeach }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [correctionTopic, setCorrectionTopic] = useState('');
  const [correctionContent, setCorrectionContent] = useState('');
  const [correctionTriggers, setCorrectionTriggers] = useState('');

  const handleStartReTeach = (item) => {
    setSelectedItem(item);
    setCorrectionTopic(item.question || '');
    setCorrectionTriggers(item.question ? item.question.toLowerCase() : '');
    setCorrectionContent('');
  };

  const handleConfirmReTeach = (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    onReTeach(selectedItem.id, {
      topic: correctionTopic,
      content: correctionContent,
      triggers: correctionTriggers.split(',').map(t => t.trim()).filter(Boolean)
    });

    setSelectedItem(null);
    setCorrectionTopic('');
    setCorrectionContent('');
    setCorrectionTriggers('');
  };

  if (selectedItem) {
    return (
      <form onSubmit={handleConfirmReTeach} className="card animate-fade" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
            Dạy Lại Gia Sư Cho Câu Hỏi Của Học Sinh
          </h4>
          <button 
            type="button" 
            onClick={() => setSelectedItem(null)} 
            className="btn btn-secondary" 
            style={{ padding: '4px 10px', fontSize: 12, height: 'auto' }}
          >
            Hủy
          </button>
        </div>

        <div style={{ padding: 12, background: 'rgba(59,130,246,0.06)', borderRadius: 8, fontSize: 13 }}>
          <strong>Câu hỏi của học sinh:</strong> "{selectedItem.question}"
        </div>

        <div className="field">
          <label style={{ fontSize: 12, fontWeight: 600 }}>Tên Chủ đề mới</label>
          <input
            className="input"
            value={correctionTopic}
            onChange={e => setCorrectionTopic(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label style={{ fontSize: 12, fontWeight: 600 }}>Từ khóa kích hoạt (Triggers)</label>
          <input
            className="input"
            value={correctionTriggers}
            onChange={e => setCorrectionTriggers(e.target.value)}
            placeholder="Từ khóa phân cách bằng dấu phẩy..."
            required
          />
        </div>

        <div className="field">
          <label style={{ fontSize: 12, fontWeight: 600 }}>Câu trả lời / Lời giải chuẩn</label>
          <textarea
            className="input"
            value={correctionContent}
            onChange={e => setCorrectionContent(e.target.value)}
            placeholder="Soạn câu trả lời chuẩn để gia sư học..."
            style={{ minHeight: 100 }}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Check size={16} /> Lưu & Dạy Lại Gia Sư
        </button>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>HÀNG ĐỢI DUYỆT (Review Queue)</h4>
        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', fontWeight: 600 }}>
          {queue.length} câu cần xử lý
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <HelpCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 13.5 }}>Hiện chưa có câu hỏi nào bị rơi ra ngoài phạm vi tri thức.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {queue.map(item => (
            <div key={item.id} className="card flex between items-center p-16" style={{ gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{item.question}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Học sinh: {item.studentName || 'Học sinh lớp 12A1'} · Thời gian: {item.time || 'Vừa xong'}
                </div>
              </div>
              <button
                onClick={() => handleStartReTeach(item)}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4, height: 'auto', flexShrink: 0 }}
              >
                <Plus size={14} /> Dạy lại <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
