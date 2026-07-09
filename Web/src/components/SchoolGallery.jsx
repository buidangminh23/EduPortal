import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Camera, Image as ImageIcon, Heart, Calendar, Plus, X, ArrowLeft, ArrowRight } from 'lucide-react';

const mockAlbums = [
  { id: 'AL01', title: 'Lễ Khai Giảng 2025-2026', date: '2025-09-05', tag: 'Sự kiện', emoji: '🎓', photoCount: 6, color: '#4f46e5' },
  { id: 'AL02', title: 'Hội Trại Mùa Xuân 2026', date: '2026-01-20', tag: 'Sự kiện', emoji: '⛺', photoCount: 8, color: '#059669' },
  { id: 'AL03', title: 'Ngày Hội Hướng Nghiệp 2026', date: '2026-04-15', tag: 'Học thuật', emoji: '🎯', photoCount: 5, color: '#0891b2' },
  { id: 'AL04', title: 'Cuộc Thi Thể Thao Học Đường', date: '2026-03-10', tag: 'Thể thao', emoji: '⚽', photoCount: 7, color: '#dc2626' },
  { id: 'AL05', title: 'Lễ Tri Ân Thầy Cô 20/11', date: '2025-11-20', tag: 'Văn nghệ', emoji: '🌸', photoCount: 4, color: '#db2777' },
  { id: 'AL06', title: 'CLB Robotics – Demo Day', date: '2026-05-15', tag: 'CLB', emoji: '🤖', photoCount: 6, color: '#7c3aed' },
];

// Generate mock photos per album using CSS gradient shades
const albumPhotos = {
  AL01: [
    { id: 'P01_1', title: 'Chào cờ khai giảng', emoji: '🇻🇳', desc: 'Toàn trường nghiêm trang làm lễ chào cờ đầu năm học mới.' },
    { id: 'P01_2', title: 'Thầy Hiệu trưởng phát biểu', emoji: '🗣️', desc: 'Thầy Hiệu trưởng đọc diễn văn khai giảng và chúc mừng năm học mới.' },
    { id: 'P01_3', title: 'Học sinh lớp 10 mới nhập trường', emoji: '🎒', desc: 'Chào đón các em học sinh khối 10 gia nhập đại gia đình Nguyễn Du.' },
    { id: 'P01_4', title: 'Tiết mục văn nghệ chào mừng', emoji: '💃', desc: 'Tiết mục múa đặc sắc do CLB văn nghệ biểu diễn.' },
    { id: 'P01_5', title: 'Tiếng trống khai trường', emoji: '🥁', desc: 'Tiếng trống giòn giã vang lên báo hiệu một năm học mới bắt đầu.' },
    { id: 'P01_6', title: 'Thả bóng bay ước mơ', emoji: '🎈', desc: 'Học sinh thả những quả bóng bay chứa đựng ước mơ lên bầu trời xanh.' }
  ],
  AL02: [
    { id: 'P02_1', title: 'Dựng trại khối 12', emoji: '⛺', desc: 'Các chi đoàn khối 12 tất bật chuẩn bị cổng trại.' },
    { id: 'P02_2', title: 'Gian hàng ẩm thực lớp 12A1', emoji: '🍢', desc: 'Gian hàng ẩm thực nhộn nhịp với các món ăn vặt tự làm.' },
    { id: 'P02_3', title: 'Kéo co kịch tính', emoji: '🎗️', desc: 'Trận chung kết kéo co nam nữ giữa 12A1 và 12A2.' },
    { id: 'P02_4', title: 'Lửa trại đêm xuân', emoji: '🔥', desc: 'Khoảnh khắc đốt lửa trại bùng cháy trong tiếng reo hò của học sinh.' },
    { id: 'P02_5', title: 'Giao lưu văn nghệ đêm nhạc', emoji: '🎸', desc: 'Ban nhạc học sinh trình diễn các bài hát trẻ trung sôi động.' },
    { id: 'P02_6', title: 'Trò chơi dân gian nhảy bao bố', emoji: '🎽', desc: 'Tiếng cười rộn rã tại khu vực trò chơi nhảy bao bố.' },
    { id: 'P02_7', title: 'Chụp ảnh lưu niệm tập thể lớp', emoji: '📸', desc: 'Lớp 11A1 lưu lại khoảnh khắc rạng rỡ bên cổng trại.' },
    { id: 'P02_8', title: 'Thu dọn trại sạch sẽ', emoji: '🧹', desc: 'Tinh thần tự giác bảo vệ môi trường sau khi hội trại kết thúc.' }
  ],
  AL03: [
    { id: 'P03_1', title: 'Gian tư vấn Đại học Bách Khoa', emoji: '⚙️', desc: 'Học sinh tìm hiểu thông tin tuyển sinh của Đại học Bách Khoa.' },
    { id: 'P03_2', title: 'Trải nghiệm kính thực tế ảo', emoji: '🕶️', desc: 'Học sinh trải nghiệm công nghệ tại gian hàng CNTT.' },
    { id: 'P03_3', title: 'Diễn giả chia sẻ kinh nghiệm hướng nghiệp', emoji: '🎤', desc: 'Buổi chia sẻ kỹ năng chọn ngành chọn nghề phù hợp bản thân.' },
    { id: 'P03_4', title: 'Học sinh đặt câu hỏi trực tiếp', emoji: '❓', desc: 'Các thắc mắc về cơ hội việc làm được giải đáp trực tiếp.' },
    { id: 'P03_5', title: 'Tặng quà lưu niệm cho diễn giả', emoji: '🎁', desc: 'Đại diện BGH tặng hoa cảm ơn các chuyên gia tư vấn.' }
  ],
  AL04: [
    { id: 'P04_1', title: 'Khai mạc giải bóng đá nam', emoji: '⚽', desc: 'Trận đấu khai mạc kịch tính giữa liên quân 12 và 11.' },
    { id: 'P04_2', title: 'Cú đập bóng uy lực', emoji: '🏐', desc: 'Pha bóng đẹp mắt trong trận chung kết bóng chuyền nữ.' },
    { id: 'P04_3', title: 'Vận động viên điền kinh bứt tốc', emoji: '🏃', desc: 'Cuộc đua chung kết chạy cự ly 100m nam.' },
    { id: 'P04_4', title: 'Ném bóng rổ chuẩn xác', emoji: '🏀', desc: 'Pha ghi điểm 3 điểm xuất thần của cầu thủ 12A1.' },
    { id: 'P04_5', title: 'Cổ động viên cuồng nhiệt', emoji: '📣', desc: 'Không khí sôi động trên khán đài nhà thi đấu.' },
    { id: 'P04_6', title: 'Lễ trao huy chương vàng', emoji: '🥇', desc: 'Đại diện ban tổ chức trao huy chương cho các cá nhân xuất sắc.' },
    { id: 'P04_7', title: 'Nụ cười chiến thắng', emoji: '🏆', desc: 'Đội bóng đá lớp 12A1 chụp ảnh ăn mừng chức vô địch.' }
  ],
  AL05: [
    { id: 'P05_1', title: 'Dâng hoa lên các thầy cô', emoji: '💐', desc: 'Đại diện học sinh kính dâng những đóa hoa tươi thắm tri ân thầy cô.' },
    { id: 'P05_2', title: 'Lời tri ân xúc động của học sinh', emoji: '📝', desc: 'Học sinh lớp 12 phát biểu tri ân sau 3 năm học tập dưới mái trường.' },
    { id: 'P05_3', title: 'Thầy cô hát tặng học sinh', emoji: '🎵', desc: 'Tiết mục đặc biệt ca múa nhạc của tập thể giáo viên nhà trường.' },
    { id: 'P05_4', title: 'Lưu bút tuổi học trò', emoji: '✍️', desc: 'Các em học sinh viết lưu bút và ký tên lên áo đồng phục.' }
  ],
  AL06: [
    { id: 'P06_1', title: 'Trưng bày robot dò đường', emoji: '🤖', desc: 'Các đội thi thuyết trình về sản phẩm robot dò tìm đường đi.' },
    { id: 'P06_2', title: 'Lập trình robot tại chỗ', emoji: '💻', desc: 'Thành viên CLB hiệu chỉnh code điều khiển robot vượt chướng ngại vật.' },
    { id: 'P06_3', title: 'Trận đấu robot sumo nảy lửa', emoji: '🥊', desc: 'Cuộc đối đầu kịch tính giữa hai robot sumo trên sa bàn.' },
    { id: 'P06_4', title: 'Ban giám khảo đánh giá sản phẩm', emoji: '📝', desc: 'Các thầy cô tổ Vật lý - Tin học chấm điểm các mô hình sáng tạo.' },
    { id: 'P06_5', title: 'Khách mời học sinh THCS trải nghiệm', emoji: '🧒', desc: 'Các em học sinh THCS tham quan trải nghiệm điều khiển cánh tay robot.' },
    { id: 'P06_6', title: 'Chụp ảnh lưu niệm ban tổ chức', emoji: '📸', desc: 'Tập thể CLB Robotics rạng rỡ kết thúc ngày hội Demo Day.' }
  ]
};

const tags = ['Tất cả', 'Sự kiện', 'Học thuật', 'Thể thao', 'Văn nghệ', 'CLB'];

export default function SchoolGallery() {
  const { schoolAlbums, setSchoolAlbums } = useContext(AppContext);
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [likes, setLikes] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    albumTitle: '',
    photoTitle: '',
    description: '',
    tag: 'Sự kiện',
    emoji: '📷',
  });

  const albums = schoolAlbums || mockAlbums;

  const filteredAlbums = albums.filter(al => {
    return selectedTag === 'Tất cả' || al.tag === selectedTag;
  });

  const currentPhotos = selectedAlbum ? (selectedAlbum.photos || albumPhotos[selectedAlbum.id] || []) : [];

  const handleLike = (photoId, e) => {
    e.stopPropagation();
    setLikes(prev => ({
      ...prev,
      [photoId]: (prev[photoId] || 0) + 1
    }));
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (activePhotoIndex !== null && activePhotoIndex < currentPhotos.length - 1) {
      setActivePhotoIndex(activePhotoIndex + 1);
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (activePhotoIndex !== null && activePhotoIndex > 0) {
      setActivePhotoIndex(activePhotoIndex - 1);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.albumTitle.trim() || !uploadForm.photoTitle.trim()) return;
    const albumId = `AL${Date.now()}`;
    const photo = {
      id: `P${Date.now()}`,
      title: uploadForm.photoTitle.trim(),
      emoji: uploadForm.emoji || '📷',
      desc: uploadForm.description.trim() || 'Ảnh mới được đăng lên album sự kiện của trường.',
    };
    const newAlbum = {
      id: albumId,
      title: uploadForm.albumTitle.trim(),
      date: new Date().toISOString().slice(0, 10),
      tag: uploadForm.tag,
      emoji: uploadForm.emoji || '📷',
      photoCount: 1,
      color: '#4f46e5',
      photos: [photo],
    };
    setSchoolAlbums(prev => [newAlbum, ...(prev || [])]);
    setSelectedTag('Tất cả');
    setUploadForm({
      albumTitle: '',
      photoTitle: '',
      description: '',
      tag: 'Sự kiện',
      emoji: '📷',
    });
    setShowUploadModal(false);
  };

  return (
    <div className="glass-panel animate-fade" style={{ padding: '24px' }}>
      {!selectedAlbum ? (
        <>
          {/* Main Album Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-ink)' }}>
                <Camera size={24} />
                <span>Album Ảnh Sự Kiện Trường</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Lưu giữ những khoảnh khắc đẹp trong các hoạt động của học sinh THPT Nguyễn Du.
              </p>
            </div>
            
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} />
              <span>Đăng ảnh mới</span>
            </button>
          </div>

          {/* Tag Filter */}
          <div className="tabs-container" style={{ marginBottom: '24px' }}>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`tab-btn ${selectedTag === tag ? 'active' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Grid of Albums */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredAlbums.map(al => (
              <div 
                key={al.id}
                onClick={() => setSelectedAlbum(al)}
                className="glass-panel"
                style={{ 
                  cursor: 'pointer', 
                  borderRadius: '18px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  padding: 0
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
                {/* Gradient cover card with emoji */}
                <div style={{ 
                  height: '160px', 
                  background: `linear-gradient(135deg, ${al.color}88 0%, ${al.color}dd 100%)`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '4rem',
                  position: 'relative'
                }}>
                  <span>{al.emoji}</span>
                  <span className="badge badge-info" style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.25)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {al.tag}
                  </span>
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{al.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {al.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ImageIcon size={12} /> {al.photoCount} ảnh
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Album Detail view */}
          <div style={{ marginBottom: '24px' }}>
            <button 
              onClick={() => setSelectedAlbum(null)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Quay lại danh sách album
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>{selectedAlbum.emoji}</span>
              <div>
                <h2 style={{ margin: 0 }}>{selectedAlbum.title}</h2>
                <span className="badge badge-info" style={{ marginRight: '8px' }}>{selectedAlbum.tag}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ngày tạo: {selectedAlbum.date}</span>
              </div>
            </div>
          </div>

          {/* Photos Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {currentPhotos.map((p, index) => (
              <div
                key={p.id}
                onClick={() => setActivePhotoIndex(index)}
                className="glass-panel"
                style={{ 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  border: '1px solid rgba(0,0,0,0.06)',
                  padding: 0,
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* Photo body */}
                <div style={{ 
                  height: '140px', 
                  background: `linear-gradient(135deg, ${selectedAlbum.color}15 0%, ${selectedAlbum.color}45 100%)`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '3rem',
                  borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                  {p.emoji}
                </div>
                
                {/* Photo footer info */}
                <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleLike(p.id, e)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: likes[p.id] ? '#ef4444' : 'var(--text-secondary)',
                      cursor: 'pointer' 
                    }}
                  >
                    <Heart size={14} fill={likes[p.id] ? '#ef4444' : 'transparent'} />
                    <span style={{ fontSize: '0.8rem' }}>{likes[p.id] || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Lightbox / Overlay Modal */}
          {activePhotoIndex !== null && (
            <div 
              className="modal-overlay" 
              onClick={() => setActivePhotoIndex(null)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', zIndex: 1000 }}
            >
              <div 
                className="modal-content animate-fade" 
                onClick={e => e.stopPropagation()}
                style={{ 
                  background: 'var(--surface)', 
                  maxWidth: '650px', 
                  width: '90%', 
                  padding: '24px', 
                  borderRadius: '24px', 
                  position: 'relative' 
                }}
              >
                {/* Close btn */}
                <button 
                  onClick={() => setActivePhotoIndex(null)}
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>

                {/* Big Preview Div */}
                <div style={{ 
                  height: '280px', 
                  borderRadius: '16px', 
                  background: `linear-gradient(135deg, ${selectedAlbum.color}25 0%, ${selectedAlbum.color}55 100%)`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '6.5rem',
                  marginBottom: '20px',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
                }}>
                  {currentPhotos[activePhotoIndex].emoji}
                </div>

                {/* Info & Caption */}
                <h3 style={{ margin: '0 0 6px 0' }}>{currentPhotos[activePhotoIndex].title}</h3>
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                  {currentPhotos[activePhotoIndex].desc}
                </p>

                {/* Action Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={(e) => handleLike(currentPhotos[activePhotoIndex].id, e)}
                    className="btn btn-secondary"
                    style={{ gap: '6px', color: likes[currentPhotos[activePhotoIndex].id] ? '#ef4444' : 'var(--text-primary)' }}
                  >
                    <Heart size={16} fill={likes[currentPhotos[activePhotoIndex].id] ? '#ef4444' : 'transparent'} />
                    <span>Yêu thích ({likes[currentPhotos[activePhotoIndex].id] || 0})</span>
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handlePrevPhoto} 
                      disabled={activePhotoIndex === 0}
                      className="btn btn-secondary"
                      style={{ padding: '8px', minWidth: '40px', borderRadius: '50%' }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button 
                      onClick={handleNextPhoto} 
                      disabled={activePhotoIndex === currentPhotos.length - 1}
                      className="btn btn-secondary"
                      style={{ padding: '8px', minWidth: '40px', borderRadius: '50%' }}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Đăng ảnh sự kiện mới</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tạo album nhanh và thêm ảnh đầu tiên.</p>
              </div>
              <button className="icon-btn" onClick={() => setShowUploadModal(false)} aria-label="Đóng"><X size={18} /></button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label className="form-label">Tên album</label>
                <input
                  className="form-control"
                  value={uploadForm.albumTitle}
                  onChange={e => setUploadForm(prev => ({ ...prev, albumTitle: e.target.value }))}
                  placeholder="Ví dụ: Hội thao tháng 7"
                  required
                  style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Chủ đề</label>
                  <select
                    className="form-control"
                    value={uploadForm.tag}
                    onChange={e => setUploadForm(prev => ({ ...prev, tag: e.target.value }))}
                    style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }}
                  >
                    {tags.filter(tag => tag !== 'Tất cả').map(tag => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Biểu tượng</label>
                  <input
                    className="form-control"
                    value={uploadForm.emoji}
                    onChange={e => setUploadForm(prev => ({ ...prev, emoji: e.target.value.slice(0, 2) }))}
                    style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1', textAlign: 'center' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tên ảnh</label>
                <input
                  className="form-control"
                  value={uploadForm.photoTitle}
                  onChange={e => setUploadForm(prev => ({ ...prev, photoTitle: e.target.value }))}
                  placeholder="Ví dụ: Khoảnh khắc trao giải"
                  required
                  style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-control"
                  value={uploadForm.description}
                  onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về khoảnh khắc này..."
                  rows={3}
                  style={{ background: 'white', color: '#1e293b', borderColor: '#cbd5e1', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)} style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Đăng ảnh</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
