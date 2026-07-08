import { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, X, Users, GraduationCap, FileText, Bell, BookOpen, ChevronRight, Compass } from 'lucide-react';

const TYPE_ICON = {
  student:    Users,
  teacher:    GraduationCap,
  assignment: FileText,
  bulletin:   Bell,
  resource:   BookOpen,
  command:    Compass,
};

const TYPE_COLOR = {
  student:    '#6366f1',
  teacher:    '#10b981',
  assignment: '#f59e0b',
  bulletin:   '#8b5cf6',
  resource:   '#0891b2',
  command:    '#14c4a0',
};

const TYPE_LABEL = {
  student:    'Học sinh',
  teacher:    'Giáo viên',
  assignment: 'Bài tập',
  bulletin:   'Thông báo',
  resource:   'Học liệu',
  command:    'Điều hướng nhanh',
};

const COMMANDS_BY_ROLE = {
  admin: [
    { id: 'cmd-admin-dashboard', title: 'Mở tổng quan BGH', subtitle: 'Điều hành nhà trường', tab: 'dashboard' },
    { id: 'cmd-admin-students', title: 'Quản lý học sinh', subtitle: 'Hồ sơ và phân lớp', tab: 'students' },
    { id: 'cmd-admin-risk', title: 'Phân tích nguy cơ AI', subtitle: 'Theo dõi học sinh cần hỗ trợ', tab: 'ai_risk' },
  ],
  teacher: [
    { id: 'cmd-teacher-dashboard', title: 'Mở tổng quan lớp học', subtitle: 'Điểm, bài tập và lịch dạy', tab: 'dashboard' },
    { id: 'cmd-teacher-seating', title: 'Mở sơ đồ chỗ ngồi', subtitle: 'Kéo thả, khóa ghế, xếp nhanh', tab: 'seating_chart' },
    { id: 'cmd-teacher-meet', title: 'Vào phòng EduMeet', subtitle: 'Dạy học trực tuyến', tab: 'meet' },
  ],
  student: [
    { id: 'cmd-student-dashboard', title: 'Mở bảng học tập', subtitle: 'Deadline, bài tập và điểm số', tab: 'dashboard' },
    { id: 'cmd-student-tutor', title: 'Mở AI Tutor', subtitle: 'Hỏi bài và ôn tập nhanh', tab: 'tutor' },
    { id: 'cmd-student-exam', title: 'Mở kho đề thi', subtitle: 'Luyện đề và tài liệu', tab: 'exam_repository' },
  ],
  parent: [
    { id: 'cmd-parent-dashboard', title: 'Mở bảng điểm của con', subtitle: 'Theo dõi học tập', tab: 'dashboard' },
    { id: 'cmd-parent-chat', title: 'Nhắn tin giáo viên', subtitle: 'Trao đổi với chủ nhiệm', tab: 'chat' },
    { id: 'cmd-parent-meeting', title: 'Đặt lịch gặp mặt', subtitle: 'Chọn khung giờ phù hợp', tab: 'meeting_booking' },
  ],
};

export default function GlobalSearch({ onNavigate }) {
  const { globalSearch, currentRole } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const handleOpenSearch = () => {
    setOpen(true);
    setQuery('');
    setResults([]);
    setSelected(0);
  };

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenSearch();
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleQueryChange = (val) => {
    setQuery(val);
    if (globalSearch) {
      const normalized = val.toLowerCase().trim();
      const commandResults = (COMMANDS_BY_ROLE[currentRole] ?? [])
        .filter(cmd => `${cmd.title} ${cmd.subtitle}`.toLowerCase().includes(normalized))
        .map(cmd => ({ ...cmd, type: 'command' }));
      const r = [...commandResults, ...globalSearch(val)];
      setResults(r.slice(0, 24));
    } else {
      setResults([]);
    }
    setSelected(0);
  };


  // Arrow key navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) {
      handleSelect(results[selected]);
    }
  };

  const handleSelect = (result) => {
    setOpen(false);
    if (onNavigate) onNavigate(result.tab);
  };

  if (!open) {
    return (
      <button
        onClick={handleOpenSearch}
        title="Tìm kiếm (Ctrl+K)"
        className="global-search-trigger"
      >
        <Search size={14} />
        <span>Tìm kiếm...</span>
        <kbd style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 4, padding: '1px 5px', fontSize: '0.7rem', fontFamily: 'monospace' }}>Ctrl K</kbd>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '10vh',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div ref={modalRef} style={{
        width: '100%', maxWidth: 580,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.2), 0 4px 20px rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.12)',
        overflow: 'hidden',
        animation: 'scaleIn 0.12s ease',
      }}>
        <style>{`@keyframes scaleIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }`}</style>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <Search size={18} color="#6366f1" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm học sinh, giáo viên, thông báo, bài tập..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: '1rem', color: 'var(--text-primary)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} aria-label="Xóa tìm kiếm">
              <X size={16} />
            </button>
          )}
          <kbd onClick={() => setOpen(false)} style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.06)', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {query.length < 2 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={28} style={{ opacity: 0.25, marginBottom: 8 }} />
              <p style={{ fontSize: '0.85rem' }}>Nhập ít nhất 2 ký tự để tìm kiếm</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.85rem' }}>Không tìm thấy kết quả cho "<strong>{query}</strong>"</p>
            </div>
          ) : (
            <>
              {/* Group by type */}
              {['command','student','teacher','assignment','bulletin','resource'].map(type => {
                const group = results.filter(r => r.type === type);
                if (!group.length) return null;
                const Icon = TYPE_ICON[type] || FileText;
                const color = TYPE_COLOR[type] || '#6366f1';
                return (
                  <div key={type}>
                    <div style={{ padding: '8px 18px 4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {TYPE_LABEL[type]}
                    </div>
                    {group.map((r) => {
                      const globalIdx = results.indexOf(r);
                      const isSelected = globalIdx === selected;
                      return (
                        <div
                          key={r.id}
                          onClick={() => handleSelect(r)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
                            cursor: 'pointer', transition: 'background 0.1s',
                            background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                            borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                          }}
                          onMouseEnter={() => setSelected(globalIdx)}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color={color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{r.title}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.subtitle}</p>
                          </div>
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 16, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span><kbd style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>↑↓</kbd> Điều hướng</span>
          <span><kbd style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>Enter</kbd> Chọn</span>
          <span><kbd style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>Esc</kbd> Đóng</span>
        </div>
      </div>
    </div>
  );
}
