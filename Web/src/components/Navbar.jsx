import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, UserCheck, GraduationCap, Users } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';

export default function Navbar({ setActiveTab }) {
  const { currentRole, selectedStudentId, setSelectedStudentId, students, userSession } = useContext(AppContext);

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

  return (
    <header className="navbar">
      <div>
        <h2 className="display" style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
          {getRoleIcon()}
          <span>{getRoleLabel()}</span>
        </h2>
      </div>

      <div className="role-switcher-container" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Global Search */}
        <GlobalSearch onNavigate={setActiveTab} />

        {/* If Parent role, show dropdown to choose which Student profile to view */}
        {currentRole === 'parent' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Xem hồ sơ học sinh:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="form-control"
              style={{ padding: '6px 12px', width: 'auto', fontSize: '0.85rem', background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
              ))}
            </select>
          </div>
        )}

        {/* Notification Bell */}
        <NotificationCenter setActiveTab={setActiveTab} />

        {/* Display Current User Session Name */}
        {userSession && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '0.85rem', 
            background: 'var(--accent-primary-glow)', 
            padding: '6px 14px', 
            borderRadius: '99px',
            color: 'var(--accent-primary)',
            fontWeight: 600,
            border: '1px solid var(--accent-soft)'
          }}>
            <UserCheck size={14} />
            <span>Tài khoản: {userSession.username}</span>
          </div>
        )}
      </div>
    </header>
  );
}
