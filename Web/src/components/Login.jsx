import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Shield, 
  GraduationCap, 
  User, 
  Users, 
  Lock, 
  Key, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Login() {
  const { setCurrentRole } = useContext(AppContext);
  const [role, setRole] = useState('admin'); // admin, teacher, student, parent
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState(atob('MTIzNDU2'));

  // Quick credentials mapping
  const handleQuickLogin = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
      setUsername('hieutruong');
      setPassword(atob('YWRtaW4xMjM='));
    } else if (selectedRole === 'teacher') {
      setUsername('minhtriet');
      setPassword(atob('dGVhY2hlcjEyMw=='));
    } else if (selectedRole === 'student') {
      setUsername('hoangnam');
      setPassword(atob('c3R1ZGVudDEyMw=='));
    } else if (selectedRole === 'parent') {
      setUsername('phuhuynh_nam');
      setPassword(atob('cGFyZW50MTIz'));
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    
    // Simple mock authorization check
    let authorized = false;
    if (role === 'admin' && username === 'hieutruong' && password === atob('YWRtaW4xMjM=')) authorized = true;
    else if (role === 'teacher' && username === 'minhtriet' && password === atob('dGVhY2hlcjEyMw==')) authorized = true;
    else if (role === 'student' && username === 'hoangnam' && password === atob('c3R1ZGVudDEyMw==')) authorized = true;
    else if (role === 'parent' && username === 'phuhuynh_nam' && password === atob('cGFyZW50MTIz')) authorized = true;
    
    // For convenience, also allow typing 'admin' for admin, etc.
    else if (username === role) authorized = true;

    if (authorized) {
      // Store user session
      const session = {
        username,
        role,
        displayName: role === 'admin' ? 'Hiệu trưởng BGH' : 
                     role === 'teacher' ? 'Thầy Nguyễn Minh Triết' : 
                     role === 'student' ? 'Nguyễn Hoàng Nam' : 'PH. Nguyễn Văn Hùng',
        class: role === 'student' || role === 'parent' ? '12A1' : null
      };
      
      localStorage.setItem('userSession', JSON.stringify(session));
      setCurrentRole(role);
      // Reload page to apply session changes cleanly
      window.location.reload();
    } else {
      alert('Tên đăng nhập hoặc mật khẩu không chính xác! Hãy thử click vào các thẻ Đăng nhập nhanh bên dưới.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at top right, rgba(167, 139, 250, 0.15), transparent), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.15), transparent), #f8fafc',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      overflowY: 'auto'
    }}>
      <div className="glass-panel animate-fade" style={{
        width: '100%',
        maxWidth: '540px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 20px 40px -15px rgba(109, 40, 217, 0.1)',
        padding: '40px',
        borderRadius: '24px'
      }}>
        {/* Branding header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)'
          }}>
            <GraduationCap size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', color: '#1e293b', fontWeight: 800 }}>EduPortal</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px' }}>Cổng thông tin quản lý và học tập số thế hệ mới</p>
        </div>

        {/* Role Selector Grid */}
        <div style={{ marginBottom: '24px' }}>
          <span className="form-label" style={{ textAlign: 'center', marginBottom: '12px' }}>Chọn vai trò đăng nhập</span>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { id: 'admin', label: 'BGH', icon: Shield, col: '#6366f1' },
              { id: 'teacher', label: 'Giáo viên', icon: GraduationCap, col: '#10b981' },
              { id: 'student', label: 'Học sinh', icon: User, col: '#0ea5e9' },
              { id: 'parent', label: 'Phụ huynh', icon: Users, col: '#f59e0b' }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setRole(item.id); handleQuickLogin(item.id); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 6px',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${item.col}` : '1px solid #e2e8f0',
                    background: isSelected ? `${item.col}08` : 'white',
                    color: isSelected ? '#1e293b' : '#64748b',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <Icon size={20} color={isSelected ? item.col : '#94a3b8'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input credentials Form */}
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label">Tên tài khoản</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tên tài khoản..."
              style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                className="form-control" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b', paddingRight: '40px' }}
                required 
              />
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', right: '14px', top: '14px' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              height: '48px', 
              fontSize: '1rem', 
              fontWeight: 600, 
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              boxShadow: '0 10px 20px -8px rgba(99, 102, 241, 0.4)',
              gap: '6px'
            }}
          >
            <span>Đăng nhập hệ thống</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Fast Credentials Helper box */}
        <div style={{ 
          marginTop: '28px', 
          padding: '16px', 
          background: 'rgba(99, 102, 241, 0.04)', 
          borderRadius: '16px', 
          border: '1px dashed rgba(99, 102, 241, 0.2)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5', marginBottom: '10px' }}>
            <Sparkles size={12} />
            <span>CLICKS ĐĂNG NHẬP NHANH DEMO:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: 'admin', label: 'BGH' },
              { id: 'teacher', label: 'Giáo viên' },
              { id: 'student', label: 'Học sinh' },
              { id: 'parent', label: 'Phụ huynh' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleQuickLogin(item.id)}
                type="button"
                className="btn btn-secondary"
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '0.75rem', 
                  background: 'white', 
                  borderColor: role === item.id ? '#4f46e5' : '#cbd5e1',
                  color: '#4f46e5',
                  fontWeight: 600
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Key size={10} />
            <span>Tài khoản: <code>{username}</code> / Mật khẩu: <code>{password}</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
