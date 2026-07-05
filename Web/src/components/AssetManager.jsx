import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Layers, Calendar, User, CheckCircle, Clock, X, Send } from 'lucide-react';

const PERIODS = ['Tiết 1-2', 'Tiết 3-4', 'Tiết 5-6', 'Tiết 7-8', 'Cả ngày'];

const ASSET_TYPE_ICON = {
  room:      '🏫',
  lab:       '🔬',
  equipment: '📽️',
  outdoor:   '⚽',
};

const ASSET_TYPE_LABEL = {
  room:      'Phòng học',
  lab:       'Phòng thí nghiệm',
  equipment: 'Thiết bị',
  outdoor:   'Sân bãi',
};

export default function AssetManager() {
  const { schoolAssets, bookAsset, approveAssetBooking, currentRole, userSession, teachers } = useContext(AppContext);
  const [selectedType, setSelectedType] = useState('all');
  const [bookingModal, setBookingModal] = useState(null); // assetId
  const [hoveredAsset, setHoveredAsset] = useState(null);
  const [form, setForm] = useState({ date: '', period: '', purpose: '' });

  const myTeacher = teachers?.find(t => t.id === (userSession?.userId || 'T01')) || teachers?.[0];

  const filtered = (schoolAssets || []).filter(a => selectedType === 'all' || a.type === selectedType);

  const handleBook = (e) => {
    e.preventDefault();
    if (!form.date || !form.period || !form.purpose.trim()) return;
    bookAsset(bookingModal, {
      teacherId: myTeacher?.id || 'T01',
      teacherName: myTeacher?.name || 'Giáo viên',
      date: form.date,
      period: form.period,
      purpose: form.purpose,
    });
    setForm({ date: '', period: '', purpose: '' });
    setBookingModal(null);
    alert('Đã gửi yêu cầu đặt tài sản! Chờ BGH phê duyệt.');
  };

  const getAssetStatus = (asset) => {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = asset.bookings.filter(b => b.date === today && b.approved);
    return todayBookings.length > 0 ? 'busy' : 'available';
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={22} color="#6366f1" /> Quản lý Tài Sản Trường
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Đặt lịch sử dụng phòng học, thiết bị và cơ sở vật chất nhà trường
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['all', 'Tất cả'], ['room', '🏫 Phòng học'], ['lab', '🔬 Phòng TN'], ['equipment', '📽️ Thiết bị'], ['outdoor', '⚽ Sân bãi']].map(([val, label]) => (
            <button key={val} onClick={() => setSelectedType(val)} className={`btn ${selectedType === val ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 20 }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Tổng tài sản', value: schoolAssets?.length || 0, color: '#6366f1' },
          { label: 'Có thể đặt', value: (schoolAssets || []).filter(a => getAssetStatus(a) === 'available').length, color: '#10b981' },
          { label: 'Đang sử dụng', value: (schoolAssets || []).filter(a => getAssetStatus(a) === 'busy').length, color: '#f59e0b' },
          { label: 'Chờ duyệt', value: (schoolAssets || []).reduce((sum, a) => sum + a.bookings.filter(b => !b.approved).length, 0), color: '#ef4444' },
        ].map(stat => (
          <div key={stat.label} style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}20`, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 2D School Map Panel */}
      <div className="glass-panel" style={{ padding: 20, marginBottom: 24, background: 'rgba(255, 255, 255, 0.65)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          🗺️ Sơ đồ Mặt bằng & Trạng thái Phòng/Thiết bị Trực quan (2D Campus Map)
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Nhấp chuột trực tiếp vào phòng trên sơ đồ để xem thông tin nhanh hoặc đăng ký lịch sử dụng (chỉ dành cho giáo viên).
        </p>

        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 800 240" style={{ width: '100%', height: 'auto', background: '#18181b', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {/* Background grids */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* School Corridor / Hallway */}
            <rect x="20" y="110" width="760" height="15" fill="rgba(255, 255, 255, 0.07)" rx="4" />
            <text x="380" y="121" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="2">HÀNH LANG TẦNG 1 & DÃY LỚP HỌC</text>

            {[
              { id: 'SA01', name: 'Phòng Máy tính 101', x: 20, y: 20, w: 140, h: 75, type: 'room' },
              { id: 'SA02', name: 'Phòng Lab Vật lý', x: 180, y: 20, w: 140, h: 75, type: 'lab' },
              { id: 'SA06', name: 'Phòng Lab Hóa học', x: 340, y: 20, w: 140, h: 75, type: 'lab' },
              { id: 'SA05', name: 'Hội trường lớn', x: 500, y: 20, w: 280, h: 75, type: 'room' },
              { id: 'SA04', name: 'Sân bóng đá', x: 20, y: 140, w: 460, h: 80, type: 'outdoor' },
              { id: 'SA03', name: 'Kho thiết bị (Máy chiếu)', x: 500, y: 140, w: 280, h: 80, type: 'equipment' },
            ].map(zone => {
              const asset = schoolAssets?.find(a => a.id === zone.id);
              if (!asset) return null;
              const isBusy = getAssetStatus(asset) === 'busy';
              const fillBg = isBusy ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
              const strokeColor = isBusy ? '#ef4444' : '#10b981';
              const isHovered = hoveredAsset === zone.id;

              return (
                <g 
                  key={zone.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredAsset(zone.id)}
                  onMouseLeave={() => setHoveredAsset(null)}
                  onClick={() => {
                    if (currentRole === 'teacher') {
                      setBookingModal(zone.id);
                    } else {
                      alert(`Tài sản: ${asset.name}\nĐịa điểm: ${asset.location}\nSức chứa: ${asset.capacity} người\nTrạng thái: ${isBusy ? 'Đang bận' : 'Sẵn sàng sử dụng'}`);
                    }
                  }}
                >
                  <rect 
                    x={zone.x} 
                    y={zone.y} 
                    width={zone.w} 
                    height={zone.h} 
                    fill={isHovered ? (isBusy ? 'rgba(239, 68, 68, 0.28)' : 'rgba(16, 185, 129, 0.28)') : fillBg}
                    stroke={strokeColor} 
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    rx={8}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  <text 
                    x={zone.x + zone.w / 2} 
                    y={zone.y + zone.h / 2 - 2} 
                    fill="#f8fafc" 
                    fontSize="11" 
                    fontWeight="700" 
                    textAnchor="middle"
                  >
                    {zone.name}
                  </text>
                  <text 
                    x={zone.x + zone.w / 2} 
                    y={zone.y + zone.h / 2 + 13} 
                    fill={strokeColor} 
                    fontSize="9" 
                    fontWeight="600" 
                    textAnchor="middle"
                  >
                    {isBusy ? '⚡ ĐANG DÙNG' : '✓ TRỐNG'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Asset cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
        {filtered.map(asset => {
          const statusNow = getAssetStatus(asset);
          const todayBookings = asset.bookings.filter(b => b.date === new Date().toISOString().split('T')[0]);
          const pendingCount = asset.bookings.filter(b => !b.approved).length;
          return (
            <div key={asset.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, background: 'rgba(255,255,255,0.65)', overflow: 'hidden', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.5rem' }}>{ASSET_TYPE_ICON[asset.type] || '🏢'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{asset.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ASSET_TYPE_LABEL[asset.type]} • {asset.location}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                    background: statusNow === 'available' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: statusNow === 'available' ? '#10b981' : '#f59e0b',
                  }}>
                    {statusNow === 'available' ? '✓ Trống' : '⚡ Đang dùng'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  <span>👥 Sức chứa: {asset.capacity}</span>
                  {pendingCount > 0 && (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>⏳ {pendingCount} chờ duyệt</span>
                  )}
                </div>

                {/* Today's bookings */}
                {todayBookings.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>📅 Hôm nay:</p>
                    {todayBookings.slice(0, 2).map(b => (
                      <div key={b.id} style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{b.period} — {b.teacherName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {b.approved ? <CheckCircle size={12} color="#10b981" /> : <Clock size={12} color="#f59e0b" />}
                          {!b.approved && currentRole === 'admin' && (
                            <button onClick={() => approveAssetBooking(asset.id, b.id)} style={{ background: '#10b981', border: 'none', borderRadius: 6, padding: '2px 6px', fontSize: '0.65rem', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Duyệt</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {currentRole === 'teacher' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setBookingModal(asset.id)}
                    style={{ width: '100%', fontSize: '0.8rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Calendar size={14} /> Đặt lịch
                  </button>
                )}
              </div>

              {/* All bookings for admin */}
              {currentRole === 'admin' && asset.bookings.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.015)' }}>
                  {asset.bookings.slice(0, 3).map(b => (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.75rem' }}>
                      <User size={11} color="var(--text-muted)" />
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{b.teacherName} • {b.date} • {b.period}</span>
                      {b.approved
                        ? <CheckCircle size={13} color="#10b981" />
                        : <button onClick={() => approveAssetBooking(asset.id, b.id)} style={{ background: '#6366f1', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Duyệt</button>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Booking form modal */}
      {bookingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>Đặt lịch: {schoolAssets?.find(a => a.id === bookingModal)?.name}</h3>
              <button onClick={() => setBookingModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ngày sử dụng *</label>
                <input type="date" className="form-control" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Tiết học *</label>
                <select className="form-control" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} required>
                  <option value="">-- Chọn tiết --</option>
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mục đích sử dụng *</label>
                <textarea className="form-control" rows={3} value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="VD: Học sinh làm bài kiểm tra trực tuyến môn Toán..." required style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBookingModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} /> Gửi yêu cầu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
