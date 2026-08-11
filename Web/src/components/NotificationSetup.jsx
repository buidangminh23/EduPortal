import { useCallback, useEffect, useState } from 'react';
import {
  describePushReadiness, readBrowserEnv, requestPermission, READINESS
} from '../lib/push/pushSupport';

/**
 * Bật thông báo trên máy đang dùng.
 *
 * Màn hình này tồn tại vì một lý do rất cụ thể: trên iPhone, thông báo chỉ chạy
 * khi trang đã được thêm vào màn hình chính, và không ai tự làm việc đó. Không
 * có bước này thì mọi tin nhắn gửi qua EduPortal đều nằm im cho tới lần người
 * dùng nhớ ra mà mở app — tức là không bao giờ, và nhóm lớp trên Zalo tiếp tục
 * là nơi mọi việc thật sự diễn ra.
 *
 * Nguyên tắc trình bày: mỗi máy chỉ thấy đúng một việc cần làm tiếp theo. Liệt
 * kê mọi trường hợp có thể xảy ra sẽ khiến người đọc phải tự đoán mình thuộc ca
 * nào, và họ sẽ đóng trang.
 */

const TONE = {
  [READINESS.GRANTED]: { color: '#0a7c42', label: 'Đã bật' },
  [READINESS.NEED_PERMISSION]: { color: '#1F4E79', label: 'Bật được ngay' },
  [READINESS.NEED_INSTALL]: { color: '#8a6d00', label: 'Cần thêm một bước' },
  [READINESS.IOS_TOO_OLD]: { color: '#8a6d00', label: 'Máy cần cập nhật' },
  [READINESS.DENIED]: { color: '#b00020', label: 'Đang bị chặn' },
  [READINESS.UNSUPPORTED]: { color: '#b00020', label: 'Không dùng được' }
};

const IOS_STEPS = [
  'Mở EduPortal bằng trình duyệt Safari (không phải Chrome hay ứng dụng khác).',
  'Bấm nút Chia sẻ — hình vuông có mũi tên đi lên, ở thanh dưới màn hình.',
  'Kéo xuống, chọn "Thêm vào MH chính".',
  'Bấm Thêm ở góc trên bên phải.',
  'Đóng Safari, mở EduPortal từ biểu tượng vừa hiện trên màn hình chính.',
  'Quay lại trang này và bấm "Bật thông báo".'
];

export default function NotificationSetup() {
  const [readiness, setReadiness] = useState(() => describePushReadiness(readBrowserEnv()));
  const [busy, setBusy] = useState(false);
  const [justAsked, setJustAsked] = useState(false);

  const refresh = useCallback(() => {
    setReadiness(describePushReadiness(readBrowserEnv()));
  }, []);

  // Người dùng có thể đi đổi cài đặt máy rồi quay lại tab này. Đọc lại khi tab
  // được nhìn tới, để họ không phải tải lại trang mới thấy trạng thái mới.
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    const outcome = await requestPermission();
    setBusy(false);
    setJustAsked(true);
    refresh();

    if (outcome === 'granted' && 'Notification' in window) {
      // Gửi ngay một thông báo thử. Người vừa bấm cho phép cần thấy kết quả
      // của việc mình vừa làm, nếu không họ không biết đã xong hay chưa.
      try {
        const reg = await navigator.serviceWorker?.ready;
        if (reg) {
          reg.showNotification('EduPortal đã bật thông báo', {
            body: 'Từ giờ nhà trường nhắn tin, máy này sẽ báo cho bạn.',
            icon: '/icon-192.png',
            tag: 'eduportal-test'
          });
        }
      } catch {
        // Không hiện được thông báo thử thì trạng thái ở trên vẫn đúng.
      }
    }
  };

  const tone = TONE[readiness.status] || TONE[READINESS.UNSUPPORTED];

  return (
    <div className="animate-fade">
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Thông báo trên máy này</h2>
        <p style={{ opacity: 0.85 }}>
          Bật thông báo để biết ngay khi giáo viên nhắn tin, nhà trường gửi thông báo hoặc có điểm mới —
          không phải mở ứng dụng lên xem mới biết.
        </p>

        <div
          style={{
            borderLeft: `4px solid ${tone.color}`,
            background: 'rgba(0,0,0,.03)',
            padding: '1rem 1.25rem',
            borderRadius: 6
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: tone.color }}>{tone.label}</p>
          <p style={{ margin: '.5rem 0 0' }}>{readiness.reason}</p>
          {readiness.status !== READINESS.GRANTED && (
            <p style={{ margin: '.5rem 0 0' }}><strong>Cần làm:</strong> {readiness.action}</p>
          )}
        </div>

        {readiness.canEnableNow && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={enable}
            disabled={busy}
          >
            {busy ? 'Đang hỏi quyền…' : 'Bật thông báo'}
          </button>
        )}

        {justAsked && readiness.status === READINESS.DENIED && (
          <p style={{ marginTop: '1rem', color: '#b00020' }}>
            Trình duyệt đã ghi nhận lựa chọn từ chối, và sẽ không hỏi lại. Phải mở phần cài đặt
            trang web của trình duyệt để cho phép thủ công.
          </p>
        )}
      </div>

      {readiness.status === READINESS.NEED_INSTALL && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Thêm EduPortal vào màn hình chính</h3>
          <p style={{ opacity: 0.85 }}>
            Làm một lần, sau đó EduPortal mở như một ứng dụng bình thường và nhận được thông báo.
          </p>
          <ol style={{ lineHeight: 1.9, paddingLeft: '1.2rem' }}>
            {IOS_STEPS.map((step, i) => <li key={`s-${i}`}>{step}</li>)}
          </ol>
          <button type="button" className="btn btn-secondary" onClick={refresh}>
            Tôi đã cài xong — kiểm tra lại
          </button>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginTop: 0 }}>Thông báo hiển thị những gì</h3>
        <p style={{ marginBottom: 0 }}>
          Thông báo chỉ báo rằng có việc cần xem, ví dụ <em>“Giáo viên chủ nhiệm vừa nhắn tin”</em>.
          Điểm số, tên học sinh và nội dung trao đổi <strong>không nằm trong thông báo</strong> —
          thông báo hiện cả khi máy đang khoá, nên ai cầm điện thoại cũng đọc được. Muốn xem nội dung
          thì phải mở máy và đăng nhập.
        </p>
      </div>
    </div>
  );
}
