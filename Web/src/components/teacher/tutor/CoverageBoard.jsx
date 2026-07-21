import { Activity, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';

export default function CoverageBoard({ entries = [], queue = [] }) {
  const totalEntries = entries.length;
  const publishedEntries = entries.filter(e => e.status === 'published').length;
  const pendingReview = queue.length;
  const coveragePercent = totalEntries > 0 ? Math.round((publishedEntries / totalEntries) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Activity size={18} style={{ color: 'var(--accent)' }} /> BẢNG ĐO ĐỘ PHỦ TRI THỨC (Knowledge Coverage)
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card p-16" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
            <BookOpen size={16} /> Tổng số khái niệm
          </div>
          <div className="display" style={{ fontSize: '1.8rem', marginTop: 8 }}>{totalEntries}</div>
        </div>

        <div className="card p-16" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--mint)', fontSize: 13, fontWeight: 600 }}>
            <CheckCircle size={16} /> Đã xuất bản
          </div>
          <div className="display" style={{ fontSize: '1.8rem', marginTop: 8 }}>{publishedEntries} ({coveragePercent}%)</div>
        </div>

        <div className="card p-16" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
            <AlertTriangle size={16} /> Cần duyệt lại (Queue)
          </div>
          <div className="display" style={{ fontSize: '1.8rem', marginTop: 8 }}>{pendingReview}</div>
        </div>
      </div>
    </div>
  );
}
