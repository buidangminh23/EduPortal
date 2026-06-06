import { Brain, Sparkles } from 'lucide-react';

export default function AiAdvisorTab() {
  return (
    <div className="glass-panel animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Brain size={22} color="var(--accent-primary)" />
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Học vụ AI & Định hướng Lộ trình</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* SVG Learning Progress chart */}
        <div>
          <div style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.02)', border: '1px solid rgba(79, 70, 229, 0.08)', borderRadius: '12px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem' }}>Biểu đồ tiến độ học tập kì II</h4>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg width="100%" height="200" viewBox="0 0 400 200" style={{ overflow: 'visible' }}>
                {/* Gridlines */}
                <line x1="50" y1="30" x2="350" y2="30" stroke="#f1f5f9" strokeDasharray="3,3" />
                <line x1="50" y1="70" x2="350" y2="70" stroke="#f1f5f9" strokeDasharray="3,3" />
                <line x1="50" y1="110" x2="350" y2="110" stroke="#f1f5f9" strokeDasharray="3,3" />
                <line x1="50" y1="150" x2="350" y2="150" stroke="#f1f5f9" strokeDasharray="3,3" />

                {/* Axes */}
                <line x1="50" y1="30" x2="50" y2="170" stroke="#cbd5e1" />
                <line x1="50" y1="170" x2="350" y2="170" stroke="#cbd5e1" />

                {/* Y Labels (grades) */}
                <text x="35" y="35" fontSize="10" fill="#94a3b8" textAnchor="end">10.0</text>
                <text x="35" y="75" fontSize="10" fill="#94a3b8" textAnchor="end">8.0</text>
                <text x="35" y="115" fontSize="10" fill="#94a3b8" textAnchor="end">6.0</text>
                <text x="35" y="155" fontSize="10" fill="#94a3b8" textAnchor="end">4.0</text>

                {/* Data Line Path */}
                <path
                  d="M 80,78 L 160,70 L 240,66 L 320,60"
                  fill="none"
                  stroke="url(#gradient-line)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Nodes */}
                <circle cx="80" cy="78" r="5" fill="#818cf8" stroke="white" strokeWidth="1.5" />
                <circle cx="160" cy="70" r="5" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                <circle cx="240" cy="66" r="5" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
                <circle cx="320" cy="60" r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />

                {/* Nodes text grades */}
                <text x="80" y="93" fontSize="10" fontWeight="600" fill="#475569" textAnchor="middle">7.8</text>
                <text x="160" y="85" fontSize="10" fontWeight="600" fill="#475569" textAnchor="middle">8.0</text>
                <text x="240" y="81" fontSize="10" fontWeight="600" fill="#475569" textAnchor="middle">8.2</text>
                <text x="320" y="48" fontSize="10" fontWeight="700" fill="var(--accent-secondary)" textAnchor="middle">8.5</text>

                {/* X Labels (weeks) */}
                <text x="80" y="185" fontSize="10" fill="#94a3b8" textAnchor="middle">Tuần 32</text>
                <text x="160" y="185" fontSize="10" fill="#94a3b8" textAnchor="middle">Tuần 33</text>
                <text x="240" y="185" fontSize="10" fill="#94a3b8" textAnchor="middle">Tuần 34</text>
                <text x="320" y="185" fontSize="10" fill="#94a3b8" textAnchor="middle">Tuần 35</text>

                <defs>
                  <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Graduation mock AI prediction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
              <h5 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Tổ hợp xét tuyển A00</h5>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>26.5</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 30 điểm (Dự đoán)</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Toán: 8.8 • Lý: 9.2 • Hóa: 8.5</p>
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
              <h5 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Tổ hợp xét tuyển D01</h5>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>25.3</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 30 điểm (Dự đoán)</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Toán: 8.8 • Văn: 8.0 • Anh: 8.5</p>
            </div>
          </div>
        </div>

        {/* AI Recommendation panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <span>Định hướng của cố vấn học tập AI</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                <strong>Môn Toán học:</strong> Em đang tiến bộ rất vững vàng ở chuyên đề Hàm số và Tích phân. Tuy nhiên cần chú ý rà soát phần hình học không gian (đặc biệt các dạng toán tọa độ hóa Oxyz).
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5, borderTop: '1px dashed rgba(0,0,0,0.08)', paddingTop: '10px' }}>
                <strong>Môn Vật lý:</strong> Kết quả dự đoán đạt 9.2đ, đây là thế mạnh của em. Nên tập trung làm các đề thi thử tổng hợp để rèn tốc độ làm câu trắc nghiệm khó.
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5, borderTop: '1px dashed rgba(0,0,0,0.08)', paddingTop: '10px' }}>
                <strong>Môn Ngữ văn:</strong> Điểm số 7.8-8.0 ổn định, bài viết nghị luận có kết cấu tốt nhưng cần rèn luyện thêm liên hệ thực tế xã hội để tạo dấu ấn sâu sắc hơn.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
