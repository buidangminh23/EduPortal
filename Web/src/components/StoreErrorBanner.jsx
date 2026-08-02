import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { AlertTriangle } from 'lucide-react';

/**
 * Tells the user when a change did not reach storage.
 *
 * Writes are sent in the background so typing never stalls, which means a
 * failure is invisible by default: the mark sits on screen looking saved. A
 * teacher who closes the tab believing the column is entered would find it
 * blank the next morning, with no way to know which entries were lost. This
 * banner is the only signal that happened, so it stays until dismissed rather
 * than fading like a toast.
 */
export default function StoreErrorBanner() {
  const { storeError } = useContext(AppContext) || {};
  if (!storeError) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        margin: '0 0 16px',
        borderRadius: 10,
        border: '1px solid #fca5a5',
        background: '#fef2f2',
        color: '#991b1b'
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.5 }}>
        <strong>Chưa lưu được: {storeError.what}.</strong>
        <div style={{ marginTop: 2, opacity: 0.85 }}>
          {storeError.message} — số liệu vẫn đang hiển thị nhưng chưa ghi vào hệ thống.
          Kiểm tra kết nối rồi nhập lại.
        </div>
      </div>
    </div>
  );
}
