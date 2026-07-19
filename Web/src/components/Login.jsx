import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, GraduationCap, User, Users, Key, ArrowRight, ArrowLeft, Settings } from 'lucide-react';

const ROLES = [
  { id: 'student', label: 'Học sinh', sub: 'Lớp & điểm số', icon: User, color: 'blue' },
  { id: 'teacher', label: 'Giáo viên', sub: 'Lớp giảng dạy', icon: GraduationCap, color: 'mint' },
  { id: 'parent', label: 'Phụ huynh', sub: 'Theo dõi con', icon: Users, color: 'orange' },
  { id: 'admin', label: 'BGH', sub: 'Quản trị trường', icon: Shield, color: 'violet' },
];

const QUICK_CREDS = {
  admin: { username: 'hieutruong', password: atob('YWRtaW4xMjM=') },
  teacher: { username: 'minhtriet', password: atob('dGVhY2hlcjEyMw==') },
  student: { username: 'hoangnam', password: atob('c3R1ZGVudDEyMw==') },
  parent: { username: 'phuhuynh_nam', password: atob('cGFyZW50MTIz') },
};

export default function Login({ onBack }) {
  const { setCurrentRole } = useContext(AppContext);
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState(QUICK_CREDS.student.username);
  const [password, setPassword] = useState(QUICK_CREDS.student.password);

  const [clientId, setClientId] = useState(() => localStorage.getItem('google_client_id') || '1038930467776-vd2j31eocbe2c5skgl2i3635m47g3k27.apps.googleusercontent.com');
  const [showConfig, setShowConfig] = useState(false);
  const [configClientId, setConfigClientId] = useState(clientId);
  const googleBtnRef = useRef(null);

  const saveClientId = (newId) => {
    localStorage.setItem('google_client_id', newId);
    setClientId(newId);
    alert('Đã lưu cấu hình Google Client ID thành công! Trang web sẽ tải lại.');
    window.location.reload();
  };

  const handleGoogleLogin = useCallback((response) => {
    try {
      const token = response.credential;
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      if (payload && payload.email) {
        const googleEmail = payload.email;
        const googleName = payload.name;
        const googlePicture = payload.picture;
        const shortUsername = googleEmail.split('@')[0];

        const session = {
          username: shortUsername,
          email: googleEmail,
          role: role,
          displayName: googleName,
          avatarUrl: googlePicture,
          class: role === 'student' || role === 'parent' ? '12A1' : null,
          studentId: role === 'student' || role === 'parent' ? 'HS001' : null,
          parentName: role === 'parent' ? googleName : null,
          parentId: role === 'parent' ? 'parent_HS001' : null
        };
        
        localStorage.setItem('userSession', JSON.stringify(session));
        setCurrentRole(role);
        window.location.reload();
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      alert('Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại!');
    }
  }, [role, setCurrentRole]);

  useEffect(() => {
    let script = document.getElementById('google-gsi-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initGoogle = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin
        });
        
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 360,
            text: 'signin_with'
          });
        }
      }
    };

    script.addEventListener('load', initGoogle);
    
    if (window.google && window.google.accounts) {
      initGoogle();
    }

    return () => {
      script.removeEventListener('load', initGoogle);
    };
  }, [clientId, role, handleGoogleLogin]);

  const handleQuickLogin = (selectedRole) => {
    setRole(selectedRole);
    const creds = QUICK_CREDS[selectedRole];
    if (creds) {
      setUsername(creds.username);
      setPassword(creds.password);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    let authorized = false;
    const creds = QUICK_CREDS[role];
    if (creds && username === creds.username && password === creds.password) authorized = true;
    else if (username === role) authorized = true;

    if (authorized) {
      const session = {
        username,
        role,
        displayName: role === 'admin' ? 'Hiệu trưởng BGH' :
                     role === 'teacher' ? 'Thầy Nguyễn Minh Triết' :
                     role === 'student' ? 'Nguyễn Hoàng Nam' : 'PH. Nguyễn Văn Hùng',
        class: role === 'student' || role === 'parent' ? '12A1' : null,
        studentId: role === 'student' || role === 'parent' ? 'HS001' : null,
        parentName: role === 'parent' ? 'Nguyễn Văn Hùng' : null,
        parentId: role === 'parent' ? 'parent_HS001' : null
      };
      localStorage.setItem('userSession', JSON.stringify(session));
      setCurrentRole(role);
      window.location.reload();
    } else {
      alert('Tên đăng nhập hoặc mật khẩu không chính xác! Hãy chọn một thẻ vai trò để điền nhanh.');
    }
  };

  const sel = ROLES.find(r => r.id === role) || ROLES[0];

  return (
    <main className="login-wrap" data-role={role}>
      {/* Art side */}
      <div className="login-art">
        <div className="blob" style={{ width: 220, height: 220, background: '#fff', top: 60, right: -40 }} />
        <div className="blob" style={{ width: 140, height: 140, background: '#ffd166', bottom: 120, left: -30 }} />

        <div className="flex items-center gap-12" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', backdropFilter: 'blur(4px)' }}>
            <GraduationCap size={26} />
          </div>
          <span className="display" style={{ fontSize: '1.6rem' }}>EduPortal</span>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="display" style={{ fontSize: '3rem', lineHeight: 1.1, marginBottom: 18 }}>
            Học vui hơn,<br />quản lý dễ hơn.
          </div>
          <p style={{ fontSize: '1.05rem', opacity: .92, maxWidth: 400, lineHeight: 1.6 }}>
            Cổng thông tin kết nối học sinh, giáo viên, phụ huynh và nhà trường — tất cả trong một nơi.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
            {[['1.842', 'Học sinh'], ['128', 'Giáo viên'], ['96.8%', 'Chuyên cần']].map(([n, l]) => (
              <div key={l}>
                <div className="display" style={{ fontSize: '1.8rem' }}>{n}</div>
                <div style={{ fontSize: '0.82rem', opacity: .85 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', opacity: .7, position: 'relative', zIndex: 2 }}>© 2026 EduPortal · Trường THPT Nguyễn Du</div>
      </div>

      {/* Form side */}
      <div className="login-form-side" data-role={role}>
        <div className="login-card animate-pop">
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-c, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.88rem',
                fontWeight: 600,
                marginBottom: 16,
                padding: 0
              }}
            >
              <ArrowLeft size={16} /> Quay lại trang chủ
            </button>
          )}
          <h1 className="display" style={{ fontSize: '2rem' }}>Chào mừng trở lại 👋</h1>
          <p className="soft" style={{ marginTop: 8, marginBottom: 22 }}>Chọn vai trò và đăng nhập để tiếp tục.</p>

          <div className="role-grid" style={{ marginBottom: 22 }}>
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`role-opt ${role === r.id ? 'sel' : ''}`}
                  style={{ '--ro-c': `var(--${r.color})` }}
                  onClick={() => handleQuickLogin(r.id)}
                >
                  <span className="ro-ico" style={{ background: `var(--${r.color})` }}><Icon size={20} /></span>
                  <span><span className="ro-t">{r.label}</span><br /><span className="ro-s">{r.sub}</span></span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLoginSubmit}>
            <div className="field">
              <label htmlFor="login-username">Tài khoản</label>
              <input
                id="login-username"
                className="input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản..."
                required
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Mật khẩu</label>
              <input
                id="login-password"
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                required
              />
            </div>

            <div className="flex between items-center" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
              <label className="flex items-center gap-6 soft" style={{ cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập
              </label>
              <a style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>Quên mật khẩu?</a>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 50 }}>
              Đăng nhập với vai trò {sel.label} <ArrowRight size={18} />
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.18)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-c, #64748b)' }}>hoặc đăng nhập bằng</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.18)' }} />
          </div>

          {/* Google Sign-in Button Container */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 18 }}>
            <div ref={googleBtnRef} style={{ width: '100%' }} />
          </div>

          <div style={{ marginTop: 18, fontSize: '0.78rem', color: 'var(--muted-c)', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
            <Key size={11} />
            <span>Demo: <code>{username}</code> / <code>{password}</code></span>
          </div>

          {/* Google Client ID config panel */}
          <div style={{ marginTop: 16, borderTop: '1px dashed rgba(148,163,184,0.2)', paddingTop: 14 }}>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                margin: '0 auto'
              }}
            >
              <Settings size={12} />
              {showConfig ? 'Ẩn cấu hình Google Client ID' : 'Cấu hình Google Client ID'}
            </button>
            
            {showConfig && (
              <div style={{ marginTop: 10, padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 10, border: '1px solid rgba(148,163,184,0.1)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12, borderBottom: '1px dashed rgba(148,163,184,0.15)', paddingBottom: 8 }}>
                  <strong style={{ color: 'var(--accent)' }}>Cách tạo Google Client ID hoạt động:</strong>
                  <ol style={{ margin: '6px 0 0 14px', padding: 0 }}>
                    <li>Truy cập <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>Google Cloud Console</a>.</li>
                    <li>Tạo dự án mới hoặc chọn dự án hiện có.</li>
                    <li>Vào mục <strong>APIs & Services</strong> &gt; <strong>Credentials</strong>.</li>
                    <li>Bấm <strong>Create Credentials</strong> &gt; <strong>OAuth client ID</strong>.</li>
                    <li>Chọn loại ứng dụng là <strong>Web application</strong>.</li>
                    <li>Thêm mục <strong>Authorized JavaScript origins</strong>:
                      <ul style={{ margin: '2px 0 0 12px', padding: 0, listStyle: 'disc' }}>
                        <li><code>http://localhost:5173</code> (cho chạy local)</li>
                        <li><code>https://edu-portal-bay.vercel.app</code> (cho Vercel của bạn)</li>
                      </ul>
                    </li>
                    <li>Bấm <strong>Create</strong>, copy mã Client ID thu được dán vào ô dưới:</li>
                  </ol>
                </div>

                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Google OAuth Client ID
                </label>
                <input
                  type="text"
                  value={configClientId}
                  onChange={e => setConfigClientId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 11.5,
                    border: '1.5px solid rgba(148,163,184,0.3)',
                    borderRadius: 6,
                    outline: 'none',
                    marginBottom: 8,
                    background: '#fff'
                  }}
                  placeholder="Nhập Client ID của bạn..."
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => saveClientId(configClientId)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '5px', fontSize: 11, height: 'auto', borderRadius: 6, border: 'none' }}
                  >
                    Lưu & Tải lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfigClientId('1038930467776-vd2j31eocbe2c5skgl2i3635m47g3k27.apps.googleusercontent.com');
                      saveClientId('1038930467776-vd2j31eocbe2c5skgl2i3635m47g3k27.apps.googleusercontent.com');
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '5px', fontSize: 11, height: 'auto', borderRadius: 6, border: '1px solid var(--line)' }}
                  >
                    Khôi phục mặc định
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
