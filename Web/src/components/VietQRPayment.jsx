import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { QrCode, CreditCard, CheckCircle, X, Smartphone } from 'lucide-react';

const BANKS = [
  { name: 'Vietcombank', code: '970436', color: '#007C3E', logo: '🏦' },
  { name: 'VietinBank', code: '970415', color: '#C8102E', logo: '🏧' },
  { name: 'BIDV', code: '970418', color: '#003087', logo: '💳' },
  { name: 'Techcombank', code: '970407', color: '#EF3829', logo: '🔴' },
  { name: 'MB Bank', code: '970422', color: '#00417E', logo: '🔵' },
];

// Simple QR-like visual (SVG pattern simulating a QR code)
function MockQRCode({ studentName }) {
  const seed = studentName?.charCodeAt(0) || 1;
  const cells = 21;
  const grid = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (__, col) => {
      // Fixed finder patterns in corners
      if ((row < 7 && col < 7) || (row < 7 && col >= cells - 7) || (row >= cells - 7 && col < 7)) return 1;
      // Random data cells (deterministic from seed)
      return ((row * cells + col + seed * 7) % 3 === 0) ? 1 : 0;
    })
  );

  return (
    <svg width={168} height={168} viewBox={`0 0 ${cells} ${cells}`} style={{ border: '8px solid white', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', background: 'white' }}>
      {grid.map((row, r) => row.map((cell, c) => cell ? (
        <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1e293b" />
      ) : null))}
    </svg>
  );
}

export default function VietQRPayment({ studentId, feeItem, onClose, onSuccess }) {
  const { processPayment, students } = useContext(AppContext);
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);
  const [step, setStep] = useState('qr'); // qr | confirming | success
  const [confirming, setConfirming] = useState(false);

  const student = students?.find(s => s.id === studentId) || students?.[0];
  const fee = feeItem;
  if (!fee || !student) return null;

  const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  const accountNo = `${selectedBank.code}${student.id.replace('HS', '0000')}`;
  const content = `${student.id} HOCPHI ${fee.name.replace(/\s+/g, '').slice(0, 15).toUpperCase()}`;

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      processPayment(studentId, fee.id);
      setStep('success');
      setConfirming(false);
    }, 1800);
  };

  if (step === 'success') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={36} color="#10b981" />
          </div>
          <h3 style={{ margin: '0 0 8px', color: '#10b981' }}>Thanh toán thành công!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 6px' }}>{fee.name}</p>
          <p style={{ fontWeight: 800, fontSize: '1.4rem', color: '#10b981', margin: '0 0 20px' }}>{fmtVND(fee.amount)}</p>
          <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div>📅 {new Date().toLocaleString('vi-VN')}</div>
            <div>🏦 {selectedBank.name} • {accountNo}</div>
            <div>📝 {content}</div>
          </div>
          <button className="btn btn-primary" onClick={() => { onSuccess && onSuccess(); onClose && onClose(); }} style={{ width: '100%' }}>
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 0, maxWidth: 480, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={22} color="white" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Thanh toán VietQR</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="white" />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Fee info */}
          <div style={{ background: 'rgba(99,102,241,0.05)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>Khoản thanh toán</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{fee.name}</div>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#6366f1' }}>{fmtVND(fee.amount)}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Học sinh: {student.name} • {student.class}</div>
          </div>

          {/* Bank selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Chọn ngân hàng nhận</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BANKS.map(b => (
                <button
                  key={b.code}
                  onClick={() => setSelectedBank(b)}
                  style={{
                    padding: '6px 12px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${selectedBank.code === b.code ? b.color : 'rgba(0,0,0,0.08)'}`,
                    background: selectedBank.code === b.code ? `${b.color}12` : 'transparent',
                    color: selectedBank.code === b.code ? b.color : 'var(--text-secondary)',
                  }}
                >
                  {b.logo} {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* QR Code area */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
            <MockQRCode studentName={student.name} />
            <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Ngân hàng</span><br /><strong>{selectedBank.logo} {selectedBank.name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Số tài khoản</span><br /><strong style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{accountNo}</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Số tiền</span><br /><strong style={{ color: '#6366f1' }}>{fmtVND(fee.amount)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Nội dung CK</span><br /><strong style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{content}</strong></div>
            </div>
          </div>

          {/* Instruction */}
          <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, fontSize: '0.78rem', color: '#92400e', display: 'flex', gap: 8 }}>
            <Smartphone size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Mở ứng dụng ngân hàng → Quét mã QR bên trái, hoặc chuyển khoản thủ công với thông tin trên. Sau đó nhấn "Xác nhận đã chuyển".</span>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={confirming}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.95rem', padding: '12px' }}
          >
            {confirming ? (
              <><span style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Đang xử lý...</>
            ) : (
              <><CreditCard size={16} />Xác nhận đã chuyển khoản</>
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  );
}
