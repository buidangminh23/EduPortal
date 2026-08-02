import { AlertTriangle } from 'lucide-react';

/**
 * Shown instead of the app when it has been given neither a database nor
 * permission to be a demo.
 *
 * Refusing to start is the point. The alternative — quietly becoming a
 * simulator — is how a school could have been handed a login screen that
 * accepted any password and stored its marks in one browser. A build that
 * cannot say which of the two it is has no business showing a login screen at
 * all.
 */
export default function UnconfiguredScreen() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 560,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '28px 30px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <AlertTriangle size={22} color="#b45309" />
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>EduPortal chưa được cấu hình</h1>
        </div>

        <p style={{ margin: '0 0 18px', lineHeight: 1.6, color: '#475569' }}>
          Bản dựng này không biết mình đang chạy thật hay chạy demo, nên nó dừng lại
          thay vì đoán. Chọn một trong hai:
        </p>

        <h2 style={{ fontSize: '0.9rem', margin: '0 0 6px' }}>Chạy thật</h2>
        <pre style={preStyle}>
{`VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>`}
        </pre>

        <h2 style={{ fontSize: '0.9rem', margin: '16px 0 6px' }}>Chạy demo</h2>
        <pre style={preStyle}>VITE_DEMO_MODE=true</pre>

        <p style={{ margin: '18px 0 0', lineHeight: 1.6, fontSize: '0.88rem', color: '#64748b' }}>
          Bản demo không có tài khoản và không lưu gì ra ngoài trình duyệt. Đừng bật
          nó cho một trường đang dùng thật.
        </p>
      </div>
    </main>
  );
}

const preStyle = {
  margin: 0,
  padding: '10px 12px',
  background: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: '0.82rem',
  lineHeight: 1.6,
  overflowX: 'auto'
};
