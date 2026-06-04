import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Bell, Award, FileText, DollarSign, CheckCircle, Calendar, BellOff } from 'lucide-react';

const ICON_MAP = {
  grade:      Award,
  assignment: FileText,
  fee:        DollarSign,
  approval:   CheckCircle,
  bulletin:   Bell,
  meeting:    Calendar,
  check:      CheckCircle,
};

const TYPE_COLOR = {
  grade:      '#10b981',
  assignment: '#6366f1',
  fee:        '#f59e0b',
  approval:   '#0891b2',
  bulletin:   '#8b5cf6',
  meeting:    '#f97316',
  check:      '#10b981',
};

export default function NotificationCenter({ setActiveTab }) {
  const { notifications, markNotificationRead, markAllNotificationsRead, currentRole } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Filter notifications relevant to this role
  const myNotifs = notifications ? notifications.filter(n =>
    n.targetRole === 'all' || n.targetRole === currentRole
  ) : [];
  const unread = myNotifs.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = (notif) => {
    markNotificationRead(notif.id);
    if (notif.targetRole === 'admin' && setActiveTab) {
      if (notif.type === 'bulletin') setActiveTab('bulletin');
    }
    setOpen(false);
  };

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }); }
    catch { return d; }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', border: 'none', cursor: 'pointer',
          padding: '8px', borderRadius: '12px', color: 'var(--text-secondary)',
          transition: 'background 0.15s',
          background: open ? 'rgba(99,102,241,0.1)' : 'transparent',
        }}
        title="Thông báo"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            background: '#ef4444', color: '#fff',
            borderRadius: '99px', fontSize: '0.6rem', fontWeight: 700,
            minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1, border: '2px solid white',
          }}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 360, maxHeight: 520, overflowY: 'auto',
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '18px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(99,102,241,0.1)',
          zIndex: 1000,
          animation: 'slideDown 0.15s ease',
        }}>
          <style>{`
            @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
          `}</style>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px 12px', borderBottom: '1px solid rgba(99,102,241,0.08)',
            position: 'sticky', top: 0, background: 'rgba(255,255,255,0.98)', zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Thông báo</span>
              {unread > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px' }}>{unread} mới</span>
              )}
            </div>
            <button
              onClick={() => { markAllNotificationsRead(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}
            >Đọc tất cả</button>
          </div>

          {/* List */}
          {myNotifs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BellOff size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: '0.85rem' }}>Chưa có thông báo nào</p>
            </div>
          ) : (
            myNotifs.map(notif => {
              const Icon = ICON_MAP[notif.icon] || ICON_MAP[notif.type] || Bell;
              const color = TYPE_COLOR[notif.icon] || TYPE_COLOR[notif.type] || '#6366f1';
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 18px',
                    cursor: 'pointer', transition: 'background 0.12s',
                    background: notif.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(99,102,241,0.04)'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <p style={{ fontWeight: notif.read ? 500 : 700, fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                        {notif.title}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{formatDate(notif.date)}</span>
                    </div>
                    <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
                      {notif.body}
                    </p>
                  </div>
                  {!notif.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
