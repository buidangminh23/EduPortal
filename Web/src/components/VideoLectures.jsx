import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Play, 
  FileText, 
  ArrowLeft, 
  Save, 
  CheckCircle,
  Clock
} from 'lucide-react';

export default function VideoLectures() {
  const { videoLessons } = useContext(AppContext);
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Lecture notes state, mapped by videoId
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('lecture_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeNoteText, setActiveNoteText] = useState('');

  // Update note text when active video changes
  useEffect(() => {
    if (activeVideo) {
      const timer = setTimeout(() => {
        setActiveNoteText(notes[activeVideo.id] || '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeVideo, notes]);

  const saveNote = () => {
    if (!activeVideo) return;
    const updatedNotes = {
      ...notes,
      [activeVideo.id]: activeNoteText
    };
    setNotes(updatedNotes);
    localStorage.setItem('lecture_notes', JSON.stringify(updatedNotes));
    alert('Đã lưu ghi chú bài giảng thành công!');
  };

  return (
    <div className="animate-fade">
      {activeVideo ? (
        // Active video player and note pad layout
        <div>
          <button 
            onClick={() => setActiveVideo(null)} 
            className="btn btn-secondary" 
            style={{ marginBottom: '20px', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>Quay lại thư viện</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
            {/* Player Container */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-card)', marginBottom: '16px' }}>
                <video 
                  src={activeVideo.videoUrl} 
                  controls 
                  autoPlay
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-info">{activeVideo.subject}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> Duration: {activeVideo.duration}
                </span>
              </div>
              
              <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{activeVideo.title}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Giảng viên: {activeVideo.teacher}</p>
            </div>

            {/* Note taking panel */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '1.25rem' }}>
                  <FileText size={18} color="var(--accent-primary)" />
                  <span>Sổ Ghi Chép Bài Giảng</span>
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Ghi chú lại những kiến thức quan trọng khi nghe thầy cô giảng bài. Hệ thống tự động lưu trữ cục bộ.
                </p>

                <textarea
                  className="form-control"
                  rows="14"
                  value={activeNoteText}
                  onChange={e => setActiveNoteText(e.target.value)}
                  placeholder="Ghi chú công thức, nội dung chính tại đây..."
                  style={{ 
                    resize: 'none', 
                    background: 'rgba(0, 0, 0, 0.3)',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    lineHeight: 1.6
                  }}
                ></textarea>
              </div>

              <button 
                onClick={saveNote}
                className="btn btn-primary"
                style={{ width: '100%', gap: '8px', marginTop: '16px' }}
              >
                <Save size={16} />
                <span>Lưu Ghi Chép</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Grid Library view
        <div>
          <div style={{ marginBottom: '28px' }}>
            <h1>Thư Viện Bài Giảng Trực Tuyến</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Truy cập kho video bài giảng bổ trợ ôn thi THPT Quốc gia chất lượng cao.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {videoLessons.map(lesson => {
              const hasNotes = !!notes[lesson.id];
              return (
                <div 
                  key={lesson.id} 
                  className="glass-panel glass-panel-hover" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    height: '280px'
                  }}
                >
                  <div>
                    {/* Header bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span className="badge badge-info">{lesson.subject}</span>
                      {hasNotes && (
                        <span className="badge badge-success" style={{ gap: '2px', padding: '2px 8px', fontSize: '0.7rem' }}>
                          <CheckCircle size={10} /> Đã có ghi chú
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 style={{ fontSize: '1.15rem', marginBottom: '8px', lineHeight: 1.4 }}>{lesson.title}</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giảng viên: {lesson.teacher}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--border-card)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {lesson.duration}
                    </span>
                    <button 
                      onClick={() => setActiveVideo(lesson)} 
                      className="btn btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '4px' }}
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Học ngay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
