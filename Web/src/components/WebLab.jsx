import { useState } from 'react';
import PhysicsLab from './PhysicsLab';
import ChemistryLab from './ChemistryLab';
import { Beaker, Zap, ArrowLeft } from 'lucide-react';

export default function WebLab() {
  const [selectedLab, setSelectedLab] = useState(null); // null, 'physics', 'chemistry'

  if (selectedLab === 'physics') {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button 
            onClick={() => setSelectedLab(null)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Quay lại danh mục
          </button>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={20} /> Phòng Thí Nghiệm Vật Lý Ảo
          </h3>
        </div>
        <PhysicsLab />
      </div>
    );
  }

  if (selectedLab === 'chemistry') {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button 
            onClick={() => setSelectedLab(null)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Quay lại danh mục
          </button>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Beaker size={20} /> Phòng Thí Nghiệm Hóa Học Ảo
          </h3>
        </div>
        <ChemistryLab />
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 900, margin: '20px auto', padding: '36px 24px', textAlign: 'center' }}>
      <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b', fontWeight: 800 }}>
        🧪 Phòng Thí Nghiệm Học Vụ Ảo
      </h2>
      <p style={{ margin: '8px 0 36px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Không gian thực hành mô phỏng kỹ thuật số có công thức, điều khiển tham số, quan sát trực quan và nhật ký kết quả cho từng học sinh.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 750, margin: '0 auto' }}>
        {/* Physics card */}
        <div 
          onClick={() => setSelectedLab('physics')}
          className="glass-panel"
          style={{
            padding: 30,
            cursor: 'pointer',
            border: '2px solid rgba(99, 102, 241, 0.08)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(99,102,241,0.02) 100%)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            borderRadius: 24,
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(99,102,241,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.08)';
            e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0,0,0,0.05)';
          }}
        >
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex', alignItems: 'center', justifyContext: 'center', color: 'var(--accent-primary)',
            justifyContent: 'center'
          }}>
            <Zap size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>Vật Lý Học Ảo</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            8 thí nghiệm: RLC, ném xiên, con lắc, thấu kính, rơi tự do, định luật Ôm, giao thoa sóng và cảm ứng điện từ Faraday-Lenz.
          </p>
        </div>

        {/* Chemistry card */}
        <div 
          onClick={() => setSelectedLab('chemistry')}
          className="glass-panel"
          style={{
            padding: 30,
            cursor: 'pointer',
            border: '2px solid rgba(16, 185, 129, 0.08)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(16,185,129,0.02) 100%)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            borderRadius: 24,
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = 'var(--accent-secondary)';
            e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(16,185,129,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.08)';
            e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0,0,0,0.05)';
          }}
        >
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex', alignItems: 'center', justifyContext: 'center', color: 'var(--accent-secondary)',
            justifyContent: 'center'
          }}>
            <Beaker size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>Hóa Học Ảo</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            8 thí nghiệm: trao đổi ion, dãy kim loại, chỉ thị pH, phản ứng cháy, điện phân, chuẩn độ, cân bằng hóa học và tốc độ phản ứng.
          </p>
        </div>
      </div>
    </div>
  );
}
