import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { LayoutGrid, Sparkles, BookOpen, Brain } from 'lucide-react';

const HEATMAP_TOPICS = [
  { x: 0, y: 0, w: 180, h: 90, topic: 'Hàm số & Đồ thị', sub: 'Toán', score: 85, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Thành thạo khảo sát hàm số, tương giao đồ thị và tiệm cận.' },
  { x: 190, y: 0, w: 180, h: 90, topic: 'Số phức', sub: 'Toán', score: 92, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Hiểu rất sâu phần biểu diễn hình học số phức và tìm min-max cực trị.' },
  { x: 380, y: 0, w: 220, h: 90, topic: 'Dao động cơ học', sub: 'Vật lý', score: 90, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Làm tốt các bài tập con lắc lò xo ghép, con lắc đơn chịu tác động lực lạ.' },

  { x: 0, y: 100, w: 220, h: 100, topic: 'Nghị luận xã hội', sub: 'Ngữ văn', score: 85, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Có vốn từ phong phú, cấu trúc bài viết nghị luận xã hội chặt chẽ.' },
  { x: 230, y: 100, w: 170, h: 100, topic: 'Hình học Oxyz', sub: 'Toán', score: 72, color: '#f59e0b', grad: 'url(#yellowGrad)', desc: 'Nắm chắc kiến thức tọa độ phẳng nhưng lúng túng khi giải cực trị khoảng cách Oxyz.', resourceId: 'R01' },
  { x: 410, y: 100, w: 190, h: 100, topic: 'Hạt nhân nguyên tử', sub: 'Vật lý', score: 80, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Nắm vững công thức tính năng lượng liên kết và định luật phóng xạ.' },

  { x: 0, y: 210, w: 230, h: 90, topic: 'Tích phân & Đạo hàm', sub: 'Toán', score: 45, color: '#ef4444', grad: 'url(#redGrad)', desc: 'Gặp khó khăn ở các bài toán tích phân lượng giác và phương pháp tích phân từng phần nâng cao.', resourceId: 'R01' },
  { x: 240, y: 210, w: 180, h: 90, topic: 'Văn học hiện thực', sub: 'Ngữ văn', score: 50, color: '#f59e0b', grad: 'url(#yellowGrad)', desc: 'Bài phân tích giá trị hiện thực và nhân đạo tác phẩm Vợ Nhặt còn sơ sài, thiếu dẫn chứng.', resourceId: 'R02' },
  { x: 430, y: 210, w: 170, h: 90, topic: 'Thơ ca kháng chiến', sub: 'Ngữ văn', score: 78, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Cảm nhận thơ ca tốt, cần liên hệ mở rộng thêm bối cảnh lịch sử tác phẩm.' }
];

export default function CompetencyHeatmapTab({ setSubTab }) {
  const { learningResources } = useContext(AppContext);
  const [selectedTopic, setSelectedTopic] = useState(null);

  return (
    <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
      <div>
        <h2 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
          <LayoutGrid size={18} color="var(--accent-primary)" />
          <span>Bản đồ nhiệt Năng lực Học tập AI</span>
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Bản đồ trực quan hóa năng lực của bạn trong từng chủ đề học tập. Hãy nhấn vào khối màu để xem chi tiết chẩn đoán lộ trình học và gợi ý tài liệu ôn thi.
        </p>

        {/* Interactive SVG Heatmap/Treemap */}
        <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '12px', display: 'flex', justifyContent: 'center' }}>
          <svg width="100%" height="320" viewBox="0 0 600 310" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {HEATMAP_TOPICS.map((item, idx) => {
              const isSelected = selectedTopic && selectedTopic.topic === item.topic;
              return (
                <g key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedTopic(item)}>
                  <rect
                    x={item.x}
                    y={item.y}
                    width={item.w}
                    height={item.h}
                    rx="8"
                    fill={item.grad}
                    stroke={isSelected ? '#1e293b' : 'white'}
                    strokeWidth={isSelected ? 3.5 : 1}
                    style={{ transition: 'all 0.2s', opacity: selectedTopic ? (isSelected ? 1 : 0.7) : 0.95 }}
                  />
                  <text x={item.x + 12} y={item.y + 26} fill="white" fontSize="10.5" fontWeight="bold">{item.sub}</text>
                  <text x={item.x + 12} y={item.y + 44} fill="white" fontSize="11" fontWeight="700" style={{ letterSpacing: '-0.3px' }}>{item.topic}</text>
                  <rect x={item.x + 12} y={item.y + item.h - 26} width="40" height="15" rx="4" fill="rgba(255,255,255,0.25)" />
                  <text x={item.x + 32} y={item.y + item.h - 15} fill="white" fontSize="9.5" fontWeight="bold" textAnchor="middle">{item.score}%</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Color guide */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '14px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></div><span>{'Tốt (>=80%)'}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '3px' }}></div><span>Khá / Trung bình (50-79%)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }}></div><span>{'Yếu / Hổng kiến thức (<50%)'}</span></div>
        </div>
      </div>

      {/* Diagnosis & Action panel */}
      <div>
        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-card)', background: 'white', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {selectedTopic ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between', flex: 1 }}>
              <div>
                <span className="badge" style={{ background: selectedTopic.score >= 80 ? 'rgba(16, 185, 129, 0.1)' : selectedTopic.score >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedTopic.color, fontWeight: 700 }}>
                  Môn {selectedTopic.sub} • {selectedTopic.score >= 80 ? 'Thành thạo' : selectedTopic.score >= 50 ? 'Cần củng cố' : 'Lỗ hổng lớn'}
                </span>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '10px 0 6px 0', color: 'var(--text-primary)' }}>{selectedTopic.topic}</h3>

                <div style={{ borderLeft: `3px solid ${selectedTopic.color}`, paddingLeft: '12px', margin: '14px 0', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  <strong>Chẩn đoán của AI:</strong>
                  <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>"{selectedTopic.desc}"</p>
                </div>

                <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.03)', border: '1px solid rgba(79, 70, 229, 0.08)', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                    <Sparkles size={14} />
                    <span>Lộ trình ôn tập gợi ý:</span>
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <li>Đọc và làm theo tài liệu đính kèm.</li>
                    <li>Luyện tập 3-5 thẻ Flashcards liên quan.</li>
                    <li>Làm quiz trắc nghiệm nhanh 5 câu để kiểm tra lại.</li>
                  </ol>
                </div>
              </div>

              {selectedTopic.resourceId ? (() => {
                const linkedRes = learningResources && learningResources.find(r => r.id === selectedTopic.resourceId);
                return (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <BookOpen size={14} />
                      <span>Học liệu liên kết: {linkedRes ? linkedRes.title : 'Tài liệu ôn tập Toán/Văn'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSubTab('library');
                        setTimeout(() => {
                          const el = document.getElementById(selectedTopic.resourceId);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                            el.style.boxShadow = '0 0 15px var(--accent-primary)';
                            setTimeout(() => { el.style.boxShadow = ''; }, 2000);
                          }
                        }, 100);
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <BookOpen size={16} />
                      <span>Mở tài liệu ôn tập ngay</span>
                    </button>
                  </div>
                );
              })() : (
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={() => setSubTab('library')}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    Mở thư mục Học liệu & Flashcards
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 10px' }}>
              <Brain size={44} strokeWidth={1.2} style={{ marginBottom: '14px', color: 'var(--accent-primary)' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Vui lòng chọn một khối kiến thức trên Bản đồ năng lực học tập để xem chẩn đoán AI.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
