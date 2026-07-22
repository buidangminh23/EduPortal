import { useContext, useMemo, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, UserCheck, GraduationCap, Users, CalendarDays, Activity, Sparkles, LogOut, BookOpen, Languages } from 'lucide-react';
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
    language,
    toggleLanguage,
    t
  } = useContext(AppContext);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const activeStudent = students?.find(s => s.id === selectedStudentId) || students?.[0];

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
    new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  ), [language]);

  const getRoleIcon = () => {
    switch (currentRole) {
      case 'admin': return <Shield size={16} color="var(--accent-primary)" />;
      case 'teacher_subject': return <BookOpen size={16} color="var(--accent-secondary)" />;
      case 'teacher_homeroom': return <GraduationCap size={16} color="var(--accent-secondary)" />;
      case 'teacher': return <GraduationCap size={16} color="var(--accent-secondary)" />;
      case 'student': return <UserCheck size={16} color="var(--accent-info)" />;
      case 'parent': return <Users size={16} color="var(--accent-warning)" />;
      default: return null;
    }
  };

  const getRoleLabel = () => {
    if (currentRole === 'admin') return t('Ban Giám Hiệu', 'School Board');
    if (currentRole === 'teacher_subject') return t('Giáo Viên Bộ Môn', 'Subject Teacher');
    if (currentRole === 'teacher_homeroom') return t('Giáo Viên Chủ Nhiệm', 'Homeroom Teacher');
    if (currentRole === 'teacher') return t('Giáo Viên Bộ Môn', 'Subject Teacher');
    if (currentRole === 'student') return t('Cổng Học Sinh', 'Student Portal');
    if (currentRole === 'parent') return t('Cổng Phụ Huynh', 'Parent Portal');
    return '';
  };

  const getProfileSub = () => {
    if (currentRole === 'admin') return t('Ban Giám Hiệu', 'School Board');
    if (currentRole === 'teacher_subject') return t('Môn Toán - Khối 12', 'Math Teacher - Grade 12');
    if (currentRole === 'teacher_homeroom') return t('Môn Toán - Lớp 12A1', 'Math Teacher - Class 12A1');
    if (currentRole === 'teacher') return t('Môn Toán - Lớp 12A1', 'Math Teacher - Class 12A1');
    if (currentRole === 'student') return t(`Học sinh - Lớp ${activeStudent?.class || '12A1'}`, `Student - Class ${activeStudent?.class || '12A1'}`);
    if (currentRole === 'parent') return t(`Phụ huynh lớp ${activeStudent?.class || '12A1'}`, `Parent of Class ${activeStudent?.class || '12A1'}`);
    return 'EduPortal';
  };

  const getGreeting = () => {
    if (currentRole === 'admin') return t('Trung tâm điều hành nhà trường', 'School Management Center');
    if (currentRole === 'teacher_subject') return t('Không gian giảng dạy & soạn giáo án', 'Teaching & Lesson Planning Workspace');
    if (currentRole === 'teacher_homeroom') return t('Quản lý nề nếp & đồng hành cùng lớp', 'Homeroom Management Workspace');
    if (currentRole === 'teacher') return t('Không gian nghiệp vụ giáo viên', 'Teacher Professional Workspace');
    if (currentRole === 'student') return t('Không gian học tập cá nhân', 'Personal Learning Workspace');
    if (currentRole === 'parent') return t('Theo dõi và đồng hành cùng con', 'Parent Monitoring Portal');
    return 'EduPortal';
  };

  const unread = notifications
    ? notifications.filter(n => !n.read && (n.targetRole === 'all' || n.targetRole === currentRole)).length
    : 0;
  const pendingWork = useMemo(() => {
    if (currentRole?.startsWith('teacher')) {
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
          <span>{pendingWork} {t('việc', 'tasks')}</span>
        </div>
        <div className="nav-metric">
          <Sparkles size={14} />
          <span>{unread} {t('mới', 'new')}</span>
        </div>
      </div>

      <div className="role-switcher-container">
        {/* Global Search */}
        <GlobalSearch onNavigate={setActiveTab} />

        {/* Language Switcher Toggle */}
        <button
          onClick={toggleLanguage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid #cbd5e1',
            background: 'white',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#334155',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          title={language === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}
        >
          <Languages size={16} color="var(--accent-primary, #6366f1)" />
          <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
        </button>

        {/* Parent accounts are locked to their linked child profile. */}
        {currentRole === 'parent' && (
          <div className="parent-student-switcher parent-student-lock" title="Tài khoản phụ huynh chỉ xem được hồ sơ con mình">
            <span>{t('Con đang theo dõi:', 'Child:')}</span>
            <strong>{activeStudent?.name || t('Chưa liên kết', 'Unlinked')}</strong>
            {activeStudent?.class && <small>{activeStudent.class}</small>}
          </div>
        )}

        {/* Notification Bell */}
        <NotificationCenter setActiveTab={setActiveTab} />

        {userSession && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '5px 14px 5px 6px',
                borderRadius: '24px',
                background: 'rgba(241, 245, 249, 0.85)',
                border: showUserDropdown ? '1.5px solid var(--accent)' : '1px solid rgba(203, 213, 225, 0.6)',
                boxShadow: showUserDropdown ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
              title="Tài khoản cá nhân"
            >
              {userSession.avatarUrl ? (
                <img 
                  src={userSession.avatarUrl} 
                  alt={userSession.displayName || userSession.username}
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                  {(userSession.displayName || userSession.username).charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: 'hidden', lineHeight: 1.25 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary, #1e293b)', whiteSpace: 'nowrap' }}>
                  {userSession.displayName || userSession.username}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary, #64748b)', whiteSpace: 'nowrap' }}>
                  {getProfileSub()}
                </div>
              </div>
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
                    {currentRole === 'admin' ? 'Ban Giám Hiệu' : currentRole === 'teacher_subject' ? 'GV Bộ Môn' : currentRole === 'teacher_homeroom' ? 'GV Chủ Nhiệm' : currentRole === 'teacher' ? 'Giáo Viên' : currentRole === 'student' ? 'Học Sinh' : 'Phụ Huynh'}
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
