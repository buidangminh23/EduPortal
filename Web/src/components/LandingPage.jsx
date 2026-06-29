import { useState } from 'react';
import { GraduationCap, Award, BookOpen, Users, ArrowRight, Sparkles, Video, MessageSquare } from 'lucide-react';

const mockFeatures = [
  { id: 1, title: 'AI Gia Sư 24/7', desc: 'Hỏi đáp bài tập, tự ôn luyện lý thuyết mọi môn học với trợ lý ảo thông minh.', icon: Sparkles, color: 'var(--amber)' },
  { id: 2, title: 'EduMeet trực tuyến', desc: 'Phòng học trực tuyến chất lượng cao tích hợp bảng trắng tương tác realtime.', icon: Video, color: 'var(--blue)' },
  { id: 3, title: 'Sổ đầu bài số', desc: 'Ghi chép và đánh giá giờ dạy số hóa nhanh chóng, thuận tiện cho BGH và GV.', icon: BookOpen, color: 'var(--mint)' },
  { id: 4, title: 'Sơ đồ chỗ ngồi thông minh', desc: 'Sắp xếp vị trí học sinh tự động, ngẫu nhiên hoặc theo điểm thi chỉ trong 1 click.', icon: Users, color: 'var(--violet)' },
  { id: 5, title: 'Bầu chọn ban cán sự', desc: 'Bỏ phiếu bầu cử ban cán sự lớp ẩn danh, trung thực, công khai kết quả tự động.', icon: Award, color: 'var(--pink)' },
  { id: 6, title: 'Chat nhóm lớp phân môn', desc: 'Không gian thảo luận, trao đổi bài học theo từng lớp học và phân môn có GV điều phối.', icon: MessageSquare, color: 'var(--orange)' },
];

const mockNews = [
  {
    id: 'N1',
    title: 'Thông báo lịch thi học kỳ II năm học 2025 - 2026',
    date: '2026-06-05',
    summary: 'Chi tiết phòng thi, sơ đồ bàn thi và nội quy phòng kiểm tra dành cho học sinh cả 3 khối...',
    detail: 'Nhà trường công bố lịch thi học kỳ II, sơ đồ phòng thi và nội quy kiểm tra. Phụ huynh và học sinh đăng nhập hệ thống để xem lịch cá nhân, môn thi, phòng thi và các mốc nhắc việc quan trọng.'
  },
  {
    id: 'N2',
    title: 'Học sinh Nguyễn Du xuất sắc đạt giải Nhất kì thi Tin học trẻ',
    date: '2026-05-28',
    summary: 'Chúc mừng em Nguyễn Hoàng Nam lớp 12A1 đã đạt giải Nhất trong kì thi Tin học trẻ cấp tỉnh vừa qua...',
    detail: 'Thành tích của em Nguyễn Hoàng Nam là kết quả từ quá trình tự học, tham gia câu lạc bộ công nghệ và được giáo viên bộ môn hỗ trợ liên tục qua hệ thống học liệu số.'
  },
  {
    id: 'N3',
    title: 'Ngày hội hướng nghiệp và tuyển sinh Đại học năm 2026',
    date: '2026-04-18',
    summary: 'Hơn 20 trường Đại học top đầu cả nước đã tham gia ngày hội tư vấn chọn ngành, chọn nghề tại sân trường...',
    detail: 'Sự kiện cung cấp thông tin tuyển sinh, tư vấn chọn ngành và các phiên trò chuyện cùng cựu học sinh. Học sinh có thể đăng nhập để lưu ngành quan tâm và nhận gợi ý định hướng cá nhân.'
  },
];

export default function LandingPage({ onLogin }) {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showAllNews, setShowAllNews] = useState(false);

  const closeDialog = () => {
    setSelectedFeature(null);
    setSelectedNews(null);
    setShowAllNews(false);
  };

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', width: '100%' }}>
      {/* Navbar Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 40px', 
        background: 'var(--surface)', 
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)', color: '#fff', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EduPortal</span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>THPT Nguyễn Du</div>
          </div>
        </div>
        
        <button className="btn btn-primary" onClick={onLogin}>
          Đăng nhập hệ thống
        </button>
      </header>

      {/* Hero Section */}
      <section style={{ 
        padding: '80px 40px', 
        background: 'linear-gradient(135deg, rgba(79,70,229,0.05) 0%, rgba(129,140,248,0.08) 100%)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow decorative items */}
        <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(79,70,229,0.08)', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(129,140,248,0.08)', filter: 'blur(60px)' }}></div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span className="badge badge-info" style={{ marginBottom: '16px', background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontSize: '0.85rem', padding: '6px 12px' }}>
            🎉 Hệ thống quản lý trường học thế hệ mới
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)', marginBottom: '20px' }}>
            Chào Mừng Đến Với Cổng Thông Tin <br/>
            <span style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Trường THPT Nguyễn Du</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '30px' }}>
            Nền tảng số kết nối toàn diện nhà trường, giáo viên, phụ huynh và học sinh. Tối ưu dạy và học, quản lý lớp học bằng trợ lý AI hiện đại.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={onLogin}>
              <span>Trải nghiệm ngay</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '40px 40px', background: 'var(--surface)' }}>
        <div style={{ 
          maxWidth: '1100px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '24px',
          textAlign: 'center' 
        }}>
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-ink)' }}>1200+</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>Học sinh đang theo học</div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-ink)' }}>85+</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>Giáo viên đạt chuẩn</div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-ink)' }}>20+</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>Năm truyền thống thành lập</div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-ink)' }}>97%</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>Tỉ lệ đỗ Tốt nghiệp & Đại học</div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tính năng nổi bật trên hệ thống số</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Trải nghiệm bộ công cụ quản lý trường học chuyên nghiệp nhất.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {mockFeatures.map(f => {
            const Icon = f.icon;
            return (
              <button
                type="button"
                key={f.id} 
                className="glass-panel" 
                aria-label={`Xem tính năng ${f.title}`}
                onClick={() => setSelectedFeature(f)}
                style={{ 
                  borderRadius: '20px', 
                  padding: '24px', 
                  border: '1px solid rgba(0,0,0,0.06)',
                  background: 'var(--surface)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  color: 'inherit'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--sh-pop)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ background: f.color + '20', color: f.color, borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 700 }}>{f.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{f.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* News Section */}
      <section style={{ padding: '80px 40px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Tin Tức & Hoạt Động Mới Nhất</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '6px', margin: 0 }}>Cập nhật các thông báo và sự kiện giáo dục của nhà trường.</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowAllNews(true)}>Xem tất cả tin tức</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {mockNews.map(n => (
              <div 
                key={n.id}
                style={{ 
                  background: 'var(--bg-app)', 
                  borderRadius: '16px', 
                  padding: '24px', 
                  border: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{n.date}</span>
                  <h3 style={{ margin: '8px 0 12px 0', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4, color: 'var(--text-primary)' }}>{n.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{n.summary}</p>
                </div>
                
                <button 
                  onClick={() => setSelectedNews(n)}
                  style={{ 
                    marginTop: '20px', 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--accent-ink)', 
                    fontWeight: 600, 
                    fontSize: '0.88rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <span>Chi tiết bài viết</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(selectedFeature || selectedNews || showAllNews) && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(29,33,56,0.48)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div style={{
            width: '100%',
            maxWidth: showAllNews ? '760px' : '520px',
            maxHeight: '86vh',
            overflowY: 'auto',
            background: 'var(--surface)',
            borderRadius: '20px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
            border: '1px solid rgba(255,255,255,0.65)',
            padding: '26px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
              <div>
                <div style={{ color: 'var(--accent-ink)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  {selectedFeature ? 'Tính năng nổi bật' : 'Tin tức nhà trường'}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.45rem', color: 'var(--text-primary)' }}>
                  {selectedFeature?.title || selectedNews?.title || 'Tất cả tin tức'}
                </h2>
              </div>
              <button className="icon-btn" onClick={closeDialog} aria-label="Đóng">×</button>
            </div>

            {selectedFeature && (
              <>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 22px' }}>{selectedFeature.desc}</p>
                <div style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', borderRadius: '14px', padding: '14px 16px', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '22px' }}>
                  Đăng nhập để dùng trực tiếp tính năng này trong đúng vai trò học sinh, phụ huynh, giáo viên hoặc BGH.
                </div>
                <button className="btn btn-primary" onClick={onLogin} style={{ width: '100%' }}>
                  Đăng nhập để trải nghiệm
                  <ArrowRight size={16} />
                </button>
              </>
            )}

            {selectedNews && (
              <>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{selectedNews.date}</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 14px' }}>{selectedNews.summary.replace('...', '.')}</p>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>{selectedNews.detail}</p>
              </>
            )}

            {showAllNews && (
              <div style={{ display: 'grid', gap: '12px' }}>
                {mockNews.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setShowAllNews(false);
                      setSelectedNews(n);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'var(--bg-app)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '14px',
                      padding: '16px',
                      cursor: 'pointer',
                      color: 'inherit'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{n.date}</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>{n.title}</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.summary}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ 
        background: 'var(--ink)', 
        color: 'rgba(255,255,255,0.7)', 
        padding: '50px 40px 30px 40px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '40px',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#fff' }}>
              <GraduationCap size={24} />
              <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>THPT Nguyễn Du</span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
              Trường Trung học phổ thông Nguyễn Du. Kiến tạo tương lai số học đường, phát triển toàn diện tài năng của học sinh.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Liên hệ hành chính</h4>
            <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span>📍 Địa chỉ: 123 Đường Nguyễn Du, Quận 1, TP. Hồ Chí Minh</span>
              <span>📞 Điện thoại: (028) 38.123.456</span>
              <span>✉️ Email: contact@nguyendu.edu.vn</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Hệ thống liên kết</h4>
            <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span>• Sở Giáo dục và Đào tạo TP.HCM</span>
              <span>• Bộ Giáo dục và Đào tạo Việt Nam</span>
              <span>• Cổng thông tin thi THPT Quốc Gia</span>
            </div>
          </div>
        </div>

        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          paddingTop: '20px', 
          textAlign: 'center', 
          fontSize: '0.8rem' 
        }}>
          © {new Date().getFullYear()} Trường THPT Nguyễn Du. Bảo lưu mọi quyền. Phát triển bởi EduPortal.
        </div>
      </footer>
    </div>
  );
}
