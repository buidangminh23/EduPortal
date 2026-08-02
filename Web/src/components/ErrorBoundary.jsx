import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('EduPortal Production UI Exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-gradient, linear-gradient(135deg, #0f172a 0%, #1e293b 100%))',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 12px',
              fontFamily: "'Outfit', sans-serif"
            }}>
              Đã xảy ra lỗi hiển thị
            </h2>

            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              lineHeight: 1.6,
              margin: '0 0 24px'
            }}>
              Hệ thống EduPortal đã ghi nhận sự cố giao diện này. Bạn có thể thử tải lại trang hoặc quay lại trang chủ.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <pre style={{
                textAlign: 'left',
                background: 'rgba(15, 23, 42, 0.9)',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f87171',
                overflowX: 'auto',
                marginBottom: '24px',
                border: '1px solid rgba(248, 113, 113, 0.2)'
              }}>
                {this.state.error.toString()}
              </pre>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                <RefreshCw size={16} /> Tải lại trang
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e2e8f0',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} /> Thử lại giao diện
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
