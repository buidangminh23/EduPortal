import { Compass, BookOpen, GraduationCap, Award, HelpCircle } from 'lucide-react';

const PRESET_ICONS = {
  'Gợi mở từng bước': Compass,
  'Mẫu rồi luyện': BookOpen,
  'Chắc lý thuyết trước': GraduationCap,
  'Ôn thi tốc độ': Award
};

export default function PresetPicker({ 
  presets = [], 
  selectedPresetId, 
  onSelectPreset, 
  tone, 
  onChangeTone, 
  status, 
  version = 1,
  onPublish 
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
      {/* Configuration Status Card */}
      <div 
        className="card animate-fade" 
        style={{ 
          padding: 20, 
          background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(5,150,105,0.05) 100%)', 
          border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span 
              style={{ 
                padding: '4px 10px', 
                borderRadius: 20, 
                fontSize: 12, 
                fontWeight: 700, 
                background: status === 'published' ? 'var(--mint)' : '#94a3b8',
                color: '#fff' 
              }}
            >
              {status === 'published' ? 'Đã Xuất Bản' : 'Bản Nháp'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Phiên bản: <strong>v{version}</strong></span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Gia sư sẽ áp dụng phương pháp đã chọn ngay sau khi bạn bấm xuất bản.
          </p>
        </div>
        <button 
          onClick={onPublish}
          className="btn btn-primary"
          style={{ padding: '10px 20px', borderRadius: 8, height: 'auto' }}
        >
          {status === 'published' ? 'Cập nhật Xuất bản' : 'Xuất bản Gia sư'}
        </button>
      </div>

      {/* Presets Grid */}
      <div>
        <h3 className="display" style={{ fontSize: '1.25rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          1. Chọn Phương Pháp Giảng Dạy
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {presets.map(p => {
            const IconComponent = PRESET_ICONS[p.name] || HelpCircle;
            const isSelected = p.id === selectedPresetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPreset(p.id)}
                style={{
                  textAlign: 'left',
                  padding: 20,
                  borderRadius: 12,
                  background: isSelected ? 'var(--bg-card, #fff)' : 'rgba(0,0,0,0.01)',
                  border: isSelected ? '2px solid var(--accent, #3b82f6)' : '1px solid rgba(148,163,184,0.18)',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 10px 25px -5px rgba(59,130,246,0.15)' : 'none',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div 
                    style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 10, 
                      background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.1)', 
                      color: isSelected ? 'var(--accent, #3b82f6)' : 'var(--text-secondary)',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{p.name}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {p.description}
                </p>
                {p.guardrails && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {p.guardrails.map(g => (
                      <span 
                        key={g} 
                        style={{ 
                          fontSize: 10, 
                          padding: '2px 6px', 
                          background: 'rgba(0,0,0,0.04)', 
                          borderRadius: 4, 
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace'
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone Picker */}
      <div>
        <h3 className="display" style={{ fontSize: '1.25rem', marginBottom: 14 }}>
          2. Chọn Giọng Điệu Gia Sư
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { id: 'than_mat', label: 'Thân mật & Động viên', desc: 'Sử dụng từ ngữ gần gũi, ấm áp, khuyến khích tối đa.' },
            { id: 'trung_tinh', label: 'Trung tính & Sư phạm', desc: 'Phong cách chuẩn mực giáo khoa, nghiêm túc vừa phải.' },
            { id: 'nghiem_tuc', label: 'Nghiêm túc & Trọng tâm', desc: 'Tập trung thẳng vào vấn đề lý thuyết và bài tập.' }
          ].map(t => {
            const isSelected = t.id === tone;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTone(t.id)}
                style={{
                  flex: '1 1 200px',
                  padding: 16,
                  borderRadius: 10,
                  background: isSelected ? 'var(--bg-card, #fff)' : 'rgba(0,0,0,0.01)',
                  border: isSelected ? '1.5px solid var(--accent, #3b82f6)' : '1px solid rgba(148,163,184,0.18)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
