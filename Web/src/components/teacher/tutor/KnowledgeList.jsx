import { useState } from 'react';
import { Search, Edit, Trash2, Tag, Book, Plus, RefreshCw } from 'lucide-react';

export default function KnowledgeList({ 
  entries = [], 
  onEdit, 
  onDelete, 
  onAdd, 
  onGenerateFromExisting,
  isGenerating
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter(e => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      e.topic.toLowerCase().includes(query) ||
      (e.triggers || []).some(t => t.toLowerCase().includes(query)) ||
      (e.source_ref || '').toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search and Action Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
            <Search size={16} />
          </span>
          <input
            className="input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo chủ đề, từ khóa kích hoạt, nguồn tài liệu..."
            style={{ paddingLeft: 38, height: 40 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onGenerateFromExisting}
            disabled={isGenerating}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, height: 'auto' }}
            title="Tự động trích xuất các từ khóa từ Flashcard & Bài tập của bạn"
          >
            <RefreshCw size={15} className={isGenerating ? 'spin' : ''} /> 
            {isGenerating ? 'Đang trích xuất...' : 'Sinh từ học liệu'}
          </button>
          <button
            onClick={onAdd}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, height: 'auto' }}
          >
            <Plus size={16} /> Thêm Kiến Thức
          </button>
        </div>
      </div>

      {/* Grid List */}
      {filteredEntries.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Book size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 14.5 }}>
            {searchQuery ? 'Không tìm thấy kiến thức nào khớp với từ khóa tìm kiếm.' : 'Chưa có kiến thức bộ môn nào được soạn.'}
          </p>
          {!searchQuery && (
            <p style={{ margin: '8px 0 0 0', fontSize: 12.5 }}>
              Hãy bấm "Thêm Kiến Thức" hoặc "Sinh từ học liệu" để bắt đầu huấn luyện gia sư của bạn.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {filteredEntries.map(e => (
            <div 
              key={e.id} 
              className="card animate-fade" 
              style={{ 
                padding: 16, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
                borderLeft: e.status === 'published' ? '4px solid var(--mint)' : '4px solid #94a3b8',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Topic Title and Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {e.topic}
                  </h4>
                  <span 
                    style={{ 
                      fontSize: 11, 
                      padding: '2px 8px', 
                      borderRadius: 12, 
                      background: e.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)', 
                      color: e.status === 'published' ? 'var(--mint)' : '#64748b',
                      fontWeight: 600
                    }}
                  >
                    {e.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                  <span 
                    style={{ 
                      fontSize: 11, 
                      padding: '2px 8px', 
                      borderRadius: 12, 
                      background: 'rgba(59,130,246,0.06)', 
                      color: 'var(--accent)',
                      fontWeight: 600
                    }}
                  >
                    {e.solutions?.length || 0} bài giải mẫu
                  </span>
                </div>

                {/* Core description preview */}
                <p 
                  style={{ 
                    margin: 0, 
                    fontSize: 13, 
                    color: 'var(--text-secondary)',
                    maxHeight: 40,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace'
                  }}
                >
                  {e.content}
                </p>

                {/* Triggers list */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Tag size={12} style={{ color: 'var(--text-secondary)' }} />
                  {e.triggers && e.triggers.map(t => (
                    <span 
                      key={t} 
                      style={{ 
                        fontSize: 11, 
                        padding: '2px 6px', 
                        background: 'rgba(0,0,0,0.03)', 
                        borderRadius: 4, 
                        color: 'var(--text-secondary)' 
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {e.source_ref && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginLeft: 'auto', fontStyle: 'italic' }}>
                      Nguồn: {e.source_ref}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => onEdit(e)}
                  className="btn btn-secondary"
                  style={{ width: 34, height: 34, padding: 0, display: 'grid', placeItems: 'center', borderRadius: 8 }}
                  title="Sửa kiến thức"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => onDelete(e.id)}
                  className="btn"
                  style={{ width: 34, height: 34, padding: 0, display: 'grid', placeItems: 'center', borderRadius: 8, borderColor: '#fecaca', color: '#ef4444' }}
                  title="Xóa kiến thức"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
