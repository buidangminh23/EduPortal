import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, LoaderCircle } from 'lucide-react';
import { completeSchoolSignIn, readSchoolToken, scrubUrl } from '../lib/schoolSso';
import { SCHOOL } from '../config/school';

/**
 * The half-second between the school's website and this one.
 *
 * On success nothing here is ever read: the auth listener in AuthContext sees
 * the new session and App swaps this screen for a dashboard. So the only shape
 * worth designing is the failure — a teacher standing in front of a screen
 * that did not let them in, who needs to know whether to click again or call
 * the office.
 */
export default function SchoolSsoScreen() {
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    // Strict mode runs effects twice in development. The note is single-use, so
    // the second run would spend a note already spent and report a replay to a
    // teacher who did nothing wrong.
    if (started.current) return;
    started.current = true;

    const token = readSchoolToken();

    completeSchoolSignIn(token).then(result => {
      // Cleared on both paths. A failed note is worthless, but it still names
      // the teacher, and a URL outlives the tab it was opened in.
      scrubUrl();
      if (!result.ok) setError(result);
    });
  }, []);

  if (!error) {
    return (
      <main style={pageStyle}>
        <div style={{ display: 'grid', placeItems: 'center', gap: 14 }}>
          <LoaderCircle size={30} color="#0f766e" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0, color: '#475569' }}>Đang đưa bạn vào EduPortal…</p>
        </div>
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <AlertTriangle size={22} color="#b45309" />
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Chưa vào được EduPortal</h1>
        </div>

        <p style={{ margin: '0 0 20px', lineHeight: 1.6, color: '#475569' }}>{error.message}</p>

        {error.canRetry && SCHOOL.website ? (
          <a href={SCHOOL.website} style={linkButtonStyle}>
            <ArrowLeft size={16} />
            Quay lại website trường
          </a>
        ) : null}

        {!error.canRetry ? (
          <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6, color: '#64748b' }}>
            Đây là lỗi cấu hình, không phải do thao tác của thầy cô. Báo quản trị viên
            của trường để kiểm tra lại kết nối giữa hai hệ thống.
          </p>
        ) : null}
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: '#f8fafc',
  color: '#0f172a',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif'
};

const cardStyle = {
  maxWidth: 520,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: '28px 30px',
  boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
};

const linkButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: 9,
  background: '#0f766e',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 500
};
