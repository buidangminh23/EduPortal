import { useContext, useMemo, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, UserCheck, GraduationCap, Users, CalendarDays, Activity, Sparkles, LogOut } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';

export default function Navbar({ setActiveTab }) {
  const {
    currentRole,
    selectedStudentId,
    students,
    userSession,
    assignments,
    deadlines,
    notifications,
    teacherLeaveRequests,
    leaveRequests,
    logout,
  } = useContext(AppContext);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const todayLabel = useMemo(() => (
    new Date().toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  ), []);

  const getRoleIcon = () => {
    switch (currentRole) {
      case 'admin': return <Shield size={16} color="var(--accent-primary)" />;
      case 'teacher': return <GraduationCap size={16} color="var(--accent-secondary)" />;
      case 'student': return <UserCheck size={16} color="var(--accent-info)" />;
      case 'parent': return <Users size={16} color="var(--accent-warning)" />;
      default: return null;
    }
  };

  const getRoleLabel = () => {
    if (currentRole === 'admin') return 'Ban Giám Hiệu';
    if (currentRole === 'teacher') return 'Giáo Viên Bộ Môn';
    if (currentRole === 'student') return 'Cổng Học Sinh';
    if (currentRole === 'parent') return 'Cổng Phụ Huynh';
    return '';
  };

  const getGreeting = () => {
    if (currentRole === 'admin') return 'Trung tâm điều hành nhà trường';
    if (currentRole === 'teacher') return 'Không gian nghiệp vụ giáo viên';
    if (currentRole === 'student') return 'Không gian học tập cá nhân';
    if (currentRole === 'parent') return 'Theo dõi và đồng hành cùng con';
    return 'EduPortal';
  };

  const activeStudent = students?.find(s => s.id === selectedStudentId) || students?.[0];
  const unread = notifications
    ? notifications.filter(n => !n.read && (n.targetRole === 'all' || n.targetRole === currentRole)).length
    : 0;
  const pendingWork = useMemo(() => {
    if (currentRole === 'teacher') {
      return (assignments?.filter(a => a.teacherId === 'T01').length ?? 0)
        + (leaveRequests?.filter(l => l.status === 'pending').length ?? 0);
    }
    if (currentRole === 'student') {
      return deadlines?.filter(d => !d.done && (d.classTarget === activeStudent?.class || d.classTarget === 'personal')).length ?? 0;
    }
    if (currentRole === 'parent') {
      return assignments?.filter(a => a.classTarget === activeStudent?.class).length ?? 0;
    }
    return teacherLeaveRequests?.filter(r => r.status === 'pending').length ?? 0;
  }, [activeStudent?.class, assignments, currentRole, deadlines, leaveRequests, teacherLeaveRequests]);

  return (
    <header className="navbar">
      <div className="navbar-identity">
        <div className="navbar-role-icon">{getRoleIcon()}</div>
        <div>
          <h1 className="display navbar-title">
            {getRoleLabel()}
          </h1>
          <p className="navbar-subtitle">
            {getGreeting()}
          </p>
        </div>
      </div>

      <div className="navbar-metrics no-print">
        <div className="nav-metric">
          <CalendarDays size={14} />
          <span>{todayLabel}</span>
        </div>
        <div className="nav-metric">
          <Activity size={14} />
          <span>{pendingWork} việc</span>
        </div>
        <div className="nav-metric">
          <Sparkles size={14} />
          <span>{unread} mới</span>
        </div>
      </div>

      <div className="role-switcher-container">
        {/* Global Search */}
        <GlobalSearch onNavigate={setActiveTab} />

        {/* Parent accounts are locked to their linked child profile. */}
        {currentRole === 'parent' && (
          <div className="parent-student-switcher parent-student-lock" title="Tài khoản phụ huynh chỉ xem được hồ sơ con mình">
            <span>Con đang theo dõi:</span>
            <strong>{activeStudent?.name || 'Chưa liên kết'}</strong>
            {activeStudent?.class && <small>{activeStudent.class}</small>}
          </div>
        )}

        {/* Notification Bell */}
        <NotificationCenter setActiveTab={setActiveTab} />

        {userSession && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="account-chip"
              style={{
                cursor: 'pointer',
                border: showUserDropdown ? '1px solid var(--accent)' : '1px solid var(--line)',
                boxShadow: showUserDropdown ? '0 0 0 2px rgba(79, 70, 229, 0.15)' : 'none',
                fontFamily: 'inherit',
              }}
              title="Tài khoản cá nhân"
            >
              {userSession.avatarUrl ? (
                <img 
                  src={userSession.avatarUrl} 
                  alt={userSession.displayName || userSession.username}
                  style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <UserCheck size={14} />
              )}
              <span>{userSession.displayName || userSession.username}</span>
            </button>
            {showUserDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'var(--surface, #fff)',
                  border: '1px solid var(--border-card, #cbd5e1)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
                  padding: '6px',
                  zIndex: 100,
                  minWidth: '155px'
                }}
                className="animate-fade"
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line, #f1f5f9)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>Vai trò</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                    {currentRole === 'admin' ? 'Ban Giám Hiệu' : currentRole === 'teacher' ? 'Giáo Viên' : currentRole === 'student' ? 'Học Sinh' : 'Phụ Huynh'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--accent-danger, #ef4444)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
