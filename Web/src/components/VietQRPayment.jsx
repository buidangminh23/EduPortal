import { useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { AppContext } from '../context/AppContext';
import { QrCode, Clock, X, Smartphone, AlertTriangle, Copy, Check } from 'lucide-react';
import { buildVietQrPayload, buildTuitionPurpose, findBankByBin } from '../lib/domain/vietqr';
import { formatVnd } from '../lib/domain/fees';
import { BANK_ACCOUNT, SCHOOL, isDemoBankAccount } from '../config/school';

const PAYMENT_MODAL_Z_INDEX = 10000;
const QR_PIXEL_SIZE = 232;

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: PAYMENT_MODAL_Z_INDEX,
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16
};

const cardStyle = {
  background: '#fff',
  borderRadius: 24,
  width: '100%',
  boxShadow: '0 32px 80px rgba(0,0,0,0.2)'
};

/**
 * Renders a real, scannable QR for the given EMVCo payload.
 *
 * Encoding is delegated to `qrcode` rather than hand-rolled: a Reed-Solomon
 * mistake produces an image that looks like a QR and silently fails to scan.
 */
function VietQrImage({ payload }) {
  // The rendered image is stored together with the payload it was built from.
  // Encoding is async, so without that pairing a changed amount would keep the
  // previous QR on screen for a frame — on a payment screen that is money going
  // to the wrong invoice.
  const [rendered, setRendered] = useState({ payload: '', url: '', error: '' });

  useEffect(() => {
    if (!payload) return undefined;
    let cancelled = false;

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: QR_PIXEL_SIZE,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then((url) => {
        if (!cancelled) setRendered({ payload, url, error: '' });
      })
      .catch(() => {
        if (!cancelled) setRendered({ payload, url: '', error: 'Không dựng được mã QR.' });
      });

    return () => {
      cancelled = true;
    };
  }, [payload]);

  const isCurrent = Boolean(payload) && rendered.payload === payload;
  const error = isCurrent ? rendered.error : '';
  const dataUrl = isCurrent ? rendered.url : '';

  if (error) {
    return (
      <div
        role="alert"
        style={{
          width: QR_PIXEL_SIZE,
          height: QR_PIXEL_SIZE,
          display: 'grid',
          placeItems: 'center',
          background: '#fef2f2',
          borderRadius: 12,
          color: '#991b1b',
          fontSize: '0.82rem',
          textAlign: 'center',
          padding: 16
        }}
      >
        {error}
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        style={{
          width: QR_PIXEL_SIZE,
          height: QR_PIXEL_SIZE,
          background: 'rgba(15,23,42,0.04)',
          borderRadius: 12
        }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      width={QR_PIXEL_SIZE}
      height={QR_PIXEL_SIZE}
      alt="Mã VietQR để chuyển khoản học phí"
      style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', background: '#fff' }}
    />
  );
}

function CopyableRow({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is unavailable over plain HTTP or without permission; the
      // value stays selectable on screen, so this is not worth surfacing.
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{label}</div>
        <strong
          style={{
            fontFamily: mono ? 'monospace' : 'inherit',
            fontSize: '0.86rem',
            wordBreak: 'break-all'
          }}
        >
          {value}
        </strong>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Sao chép ${label}`}
        style={{
          flexShrink: 0,
          border: 'none',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: 8,
          padding: 6,
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#6366f1" />}
      </button>
    </div>
  );
}

function DeclaredReceipt({ fee, purpose, onDone }) {
  return (
    <div style={{ ...cardStyle, maxWidth: 400, textAlign: 'center', padding: 40 }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.12)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 16px'
        }}
      >
        <Clock size={34} color="#f59e0b" />
      </div>
      <h3 style={{ margin: '0 0 8px' }}>Đã ghi nhận báo chuyển khoản</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 6px' }}>{fee.name}</p>
      <p style={{ fontWeight: 800, fontSize: '1.35rem', margin: '0 0 16px' }}>{formatVnd(fee.amount)}</p>
      <div
        style={{
          background: 'rgba(245,158,11,0.08)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: '0.82rem',
          color: '#92400e',
          textAlign: 'left'
        }}
      >
        Nhà trường sẽ đối chiếu với sao kê ngân hàng rồi xác nhận. Khoản thu chuyển sang trạng thái{' '}
        <strong>Đã thanh toán</strong> sau khi đối soát xong. Giữ lại biên lai chuyển khoản với nội
        dung <strong>{purpose}</strong>.
      </div>
      <button className="btn btn-primary" onClick={onDone} style={{ width: '100%' }}>
        Đóng
      </button>
    </div>
  );
}

export default function VietQRPayment({ studentId, feeItem, onClose, onSuccess }) {
  const { declareFeeTransfer, students } = useContext(AppContext);
  const [declared, setDeclared] = useState(false);

  const student = students?.find((s) => s.id === studentId) || students?.[0];
  const fee = feeItem;

  const purpose = useMemo(
    () => (student && fee ? buildTuitionPurpose(student.id, fee.id) : ''),
    [student, fee]
  );

  const { payload, errors } = useMemo(() => {
    if (!student || !fee) return { payload: '', errors: [] };
    return buildVietQrPayload({
      bin: BANK_ACCOUNT.bin,
      accountNumber: BANK_ACCOUNT.accountNumber,
      accountName: BANK_ACCOUNT.accountName,
      amount: fee.amount,
      purpose,
      city: SCHOOL.city
    });
  }, [student, fee, purpose]);

  const portalTarget = typeof document === 'undefined' ? null : document.body;
  if (!fee || !student || !portalTarget) return null;

  const bank = findBankByBin(BANK_ACCOUNT.bin);

  const finish = () => {
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  if (declared) {
    return createPortal(
      <div style={overlayStyle}>
        <DeclaredReceipt fee={fee} purpose={purpose} onDone={finish} />
      </div>,
      portalTarget
    );
  }

  const handleDeclare = () => {
    declareFeeTransfer(studentId, fee.id, purpose);
    setDeclared(true);
  };

  return createPortal(
    <div style={overlayStyle}>
      <div style={{ ...cardStyle, maxWidth: 500, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={22} color="white" />
            <span style={{ color: 'white', fontWeight: 700 }}>Chuyển khoản VietQR</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={14} color="white" />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {isDemoBankAccount && (
            <div
              role="alert"
              style={{
                display: 'flex',
                gap: 8,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 18,
                fontSize: '0.8rem',
                color: '#991b1b'
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>Tài khoản demo.</strong> Mã QR dưới đây đúng chuẩn VietQR và quét được, nhưng
                trỏ tới số tài khoản mẫu — đừng chuyển tiền thật. Nhà trường cấu hình tài khoản thật
                qua biến môi trường <code>VITE_SCHOOL_BANK_*</code>.
              </span>
            </div>
          )}

          {errors.length > 0 && (
            <div
              role="alert"
              style={{
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 18,
                fontSize: '0.8rem',
                color: '#991b1b'
              }}
            >
              Không tạo được mã QR: {errors.join(' ')}
            </div>
          )}

          <div
            style={{
              background: 'rgba(99,102,241,0.05)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 18
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Khoản thu</div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{fee.name}</div>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#6366f1' }}>
              {formatVnd(fee.amount)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {student.name} • {student.class}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
              marginBottom: 18,
              flexWrap: 'wrap'
            }}
          >
            <VietQrImage payload={payload} />
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CopyableRow
                label="Ngân hàng"
                value={bank ? bank.shortName : BANK_ACCOUNT.bin}
                mono={false}
              />
              <CopyableRow label="Số tài khoản" value={BANK_ACCOUNT.accountNumber} />
              <CopyableRow label="Chủ tài khoản" value={BANK_ACCOUNT.accountName} mono={false} />
              <CopyableRow label="Nội dung chuyển khoản" value={purpose} />
            </div>
          </div>

          <div
            style={{
              background: 'rgba(99,102,241,0.06)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 18,
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: 8
            }}
          >
            <Smartphone size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Mở app ngân hàng, quét mã QR — số tiền và nội dung được điền sẵn. Giữ nguyên nội dung
              chuyển khoản để nhà trường đối soát đúng khoản thu.
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleDeclare}
            disabled={!payload}
            style={{ width: '100%', padding: 12, fontSize: '0.95rem' }}
          >
            Tôi đã chuyển khoản
          </button>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}
          >
            Nút này gửi báo cho nhà trường đối soát, chưa phải xác nhận đã thu tiền.
          </p>
        </div>
      </div>
    </div>,
    portalTarget
  );
}
