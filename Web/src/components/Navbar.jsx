import { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, UserCheck, GraduationCap, Users, CalendarDays, Activity, Sparkles } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';

export default function Navbar({ setActiveTab }) {
  const {
    currentRole,
    selectedStudentId,
    setSelectedStudentId,
    students,
    userSession,
    assignments,
    deadlines,
    notifications,
    teacherLeaveRequests,
    leaveRequests,
  } = useContext(AppContext);

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

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];
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

        {/* If Parent role, show dropdown to choose which Student profile to view */}
        {currentRole === 'parent' && (
          <div className="parent-student-switcher">
            <span>Xem hồ sơ:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="form-control"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
              ))}
            </select>
          </div>
        )}

        {/* Notification Bell */}
        <NotificationCenter setActiveTab={setActiveTab} />

        {userSession && (
          <div className="account-chip">
            <UserCheck size={14} />
            <span>{userSession.username}</span>
          </div>
        )}
      </div>
    </header>
  );
}
