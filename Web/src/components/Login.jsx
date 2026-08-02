import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Shield, GraduationCap, User, Users, ArrowRight, ArrowLeft, Settings, AlertTriangle, Eye } from 'lucide-react';
import { isDemoMode, isRealMode, describeMode } from '../lib/appMode';
import { demoSessionFor } from '../lib/demoSession';
import { SCHOOL } from '../config/school';

const ROLES = [
  { id: 'student', label: 'Học sinh', sub: 'Lớp & điểm số', icon: User, color: 'blue' },
  { id: 'teacher_subject', label: 'GV Bộ môn', sub: 'Soạn bài & Kho đề', icon: GraduationCap, color: 'mint' },
  { id: 'teacher_homeroom', label: 'GV Chủ nhiệm', sub: 'Quản lý lớp & HS', icon: Users, color: 'teal' },
  { id: 'parent', label: 'Phụ huynh', sub: 'Theo dõi con', icon: Users, color: 'orange' },
  { id: 'admin', label: 'BGH', sub: 'Quản trị trường', icon: Shield, color: 'violet' },
];


/**
 * Turns an auth failure into something the person in front of the screen can
 * act on. A teacher who cannot sign in needs to know whether to retype their
 * password or call the office — "Failed to fetch" tells them neither.
 */
function readableAuthError(error) {
  const raw = (error?.message || '').toLowerCase();
  if (raw.includes('failed to fetch') || raw.includes('network')) {
    return 'Không kết nối được tới máy chủ. Kiểm tra mạng, hoặc báo quản trị viên nếu mạng vẫn bình thường.';
  }
  if (raw.includes('invalid login') || raw.includes('invalid credentials')) {
    return 'Email hoặc mật khẩu không đúng.';
  }
  if (raw.includes('email not confirmed')) {
    return 'Tài khoản chưa xác nhận email. Kiểm tra hộp thư hoặc liên hệ quản trị viên.';
  }
  return error?.message || 'Không đăng nhập được.';
}

export default function Login({ onBack }) {
  const { setUserSession } = useContext(AppContext);
  const { signInWithPassword, signInWithGoogleToken } = useAuth();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const mode = describeMode();


  // Whose Google project sign-ins go through. This was a personal OAuth client
  // hardcoded here, which for a school would have meant routing their staff's
  // Google identities through somebody else's project. It is deployment
  // configuration; the localStorage override stays as a way to try a different
  // client without a rebuild.
  const [clientId, setClientId] = useState(
    () => localStorage.getItem('google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );
  const [showConfig, setShowConfig] = useState(false);
  const [configClientId, setConfigClientId] = useState(clientId);
  const googleBtnRef = useRef(null);

  const saveClientId = (newId) => {
    localStorage.setItem('google_client_id', newId);
    setClientId(newId);
    alert('Đã lưu cấu hình Google Client ID thành công! Trang web sẽ tải lại.');
    window.location.reload();
  };

  /**
   * Signs in with Google, by asking Supabase to check the token.
   *
   * The previous version base64-decoded the credential in the browser and
   * trusted whatever came out, taking the role from the tile the visitor had
   * clicked. A Google credential is a signed assertion; reading it without
   * checking the signature means anyone who can type into a console is an
   * administrator. Verification has to happen where the signing keys are, so
   * the raw token goes to Supabase and the answer comes back from there.
   */
  const handleGoogleLogin = useCallback(async (response) => {
    setLoginError('');
    setSubmitting(true);
    const { error } = await signInWithGoogleToken(response?.credential);
    setSubmitting(false);
    if (error) setLoginError(readableAuthError(error));
  }, [signInWithGoogleToken]);

  useEffect(() => {
    // Nothing to sign in to in the demo, so the button is not offered there.
    if (!isRealMode) return undefined;
    // Without a client id, initialising Google would only produce a broken
    // button and a console error. A deployment that has not set one simply
    // does not offer Google sign-in.
    if (!clientId) return undefined;

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

  const handleRolePick = (selectedRole) => {
    setRole(selectedRole);
    setLoginError('');
  };

  /**
   * Starts a session, or refuses to.
   *
   * What this replaced: the form attempted a real sign-in only when the typed
   * name contained an "@", ignored the result if it failed, and then built a
   * session out of the typed name and the role tile the visitor had clicked —
   * writing it to storage and reloading. Any password worked. So did no
   * password, and so did an account that did not exist. The login screen was
   * scenery.
   *
   * There are now two paths and neither invents anything: in the demo you
   * choose a viewpoint, and in a real deployment Supabase decides. A failure
   * stays a failure, and is shown.
   */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (isDemoMode) {
      localStorage.removeItem('eduportal_logged_out');
      setUserSession(demoSessionFor(role));
      return;
    }

    setSubmitting(true);
    const { error } = await signInWithPassword(email.trim(), password);
    setSubmitting(false);

    if (error) {
      setLoginError(readableAuthError(error));
      return;
    }

    // No reload: AuthContext is subscribed to the auth state and the app
    // re-renders once the profile arrives. Reloading here used to race that,
    // which is part of why a fabricated session was needed to make the screen
    // change at all.
    localStorage.removeItem('eduportal_logged_out');
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

        <div style={{ fontSize: '0.8rem', opacity: .7, position: 'relative', zIndex: 2 }}>© 2026 EduPortal · {SCHOOL.name}</div>
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
          <p className="soft" style={{ marginTop: 8, marginBottom: 22 }}>
            {isDemoMode ? 'Chọn vai trò để xem thử sản phẩm.' : 'Đăng nhập bằng tài khoản nhà trường cấp.'}
          </p>

          <div className="role-grid" style={{ marginBottom: 22 }}>
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`role-opt ${role === r.id ? 'sel' : ''}`}
                  style={{ '--ro-c': `var(--${r.color})` }}
                  onClick={() => handleRolePick(r.id)}
                >
                  <span className="ro-ico" style={{ background: `var(--${r.color})` }}><Icon size={20} /></span>
                  <span><span className="ro-t">{r.label}</span><br /><span className="ro-s">{r.sub}</span></span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLoginSubmit}>
            {isDemoMode ? (
              <div
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '12px 14px', marginBottom: 18, borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(148,163,184,0.08)'
                }}
              >
                <Eye size={16} style={{ flexShrink: 0, marginTop: 2, opacity: 0.7 }} />
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <strong>{mode.title}</strong>
                  <div style={{ marginTop: 2, opacity: 0.85 }}>{mode.detail}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="login-email">Email nhà trường cấp</label>
                  <input
                    id="login-email"
                    className="input"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ten.ho@school.edu.vn"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="login-password">Mật khẩu</label>
                  <input
                    id="login-password"
                    className="input"
                    type="password"
                    autoComplete="current-password"
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
              </>
            )}

            {loginError && (
              <div
                role="alert"
                style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '10px 12px', marginBottom: 16, borderRadius: 10,
                  border: '1px solid #fca5a5', background: '#fef2f2', color: '#991b1b',
                  fontSize: '0.85rem', lineHeight: 1.5
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{loginError}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 50 }} disabled={submitting}>
              {isDemoMode
                ? <>Xem thử với vai trò {sel.label} <ArrowRight size={18} /></>
                : <>{submitting ? 'Đang kiểm tra...' : 'Đăng nhập'} <ArrowRight size={18} /></>}
            </button>
          </form>

          {isRealMode && clientId && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.18)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-c, #64748b)' }}>hoặc đăng nhập bằng</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.18)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 18 }}>
                <div ref={googleBtnRef} style={{ width: '100%' }} />
              </div>
            </>
          )}

          {isRealMode && (
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
                          <li><code>{window.location.origin}</code> (chính trang này)</li>
                          <li><code>http://localhost:5173</code> (khi chạy máy cá nhân)</li>
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
                        // Clearing the override falls back to whatever this
                        // deployment was configured with, rather than to a
                        // client id belonging to whoever wrote the code.
                        localStorage.removeItem('google_client_id');
                        setConfigClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
                        window.location.reload();
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '5px', fontSize: 11, height: 'auto', borderRadius: 6, border: '1px solid var(--line)' }}
                    >
                      Dùng cấu hình của hệ thống
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
