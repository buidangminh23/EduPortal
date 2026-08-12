import { useEffect, useRef, useState } from 'react';
import { completeSignIn, callbackUrl } from '../lib/google/oauthPkce';

/**
 * Màn hình chớp nhoáng khi Google trả người dùng về.
 *
 * Google gọi lại địa chỉ `/oauth/google` kèm mã đổi phiếu trên thanh địa chỉ.
 * EduPortal không dùng bộ định tuyến nên App bắt đường dẫn này ở lúc khởi động
 * và dựng thẳng màn hình này.
 *
 * Hai điều bắt buộc phải làm ở đây, không được bỏ:
 *
 * 1. Đổi mã lấy phiếu **đúng một lần**. Mã của Google dùng một lần là hết; React
 *    ở chế độ kiểm tra chạy effect hai lượt, lượt thứ hai sẽ nhận lỗi
 *    "invalid_grant" và xoá mất kết quả của lượt đầu. Vì thế có chốt `done`.
 * 2. Xoá mã khỏi thanh địa chỉ ngay sau khi đổi xong. Để nguyên thì mã nằm trong
 *    lịch sử trình duyệt và trong mọi ảnh chụp màn hình người dùng gửi đi.
 */
export default function GoogleOauthCallback() {
  const [state, setState] = useState({ phase: 'working', error: null });
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    // Client ID không cần ở đây nữa: bước đổi mã chạy trên máy chủ, nơi giữ cả
    // client id lẫn secret.
    completeSignIn({ search: window.location.search, redirectUri: callbackUrl() })
      .then((out) => {
        window.history.replaceState({}, '', '/');
        if (out.status === 'ok') {
          setState({ phase: 'ok', error: null });
          window.location.replace('/');
        } else {
          setState({ phase: 'error', error: out.error });
        }
      })
      .catch((e) => {
        window.history.replaceState({}, '', '/');
        setState({ phase: 'error', error: e.message });
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', maxWidth: 520 }}>
        <h2 style={{ marginTop: 0 }}>Đang kết nối Google Classroom</h2>
        {state.phase === 'working' && <p style={{ marginBottom: 0 }}>Đang xác thực, chờ một chút…</p>}
        {state.phase === 'ok' && <p style={{ marginBottom: 0 }}>Xong. Đang quay lại EduPortal…</p>}
        {state.phase === 'error' && (
          <>
            <p><strong>Không kết nối được:</strong> {state.error}</p>
            <a className="btn btn-primary" href="/">Quay lại EduPortal</a>
          </>
        )}
      </div>
    </div>
  );
}
