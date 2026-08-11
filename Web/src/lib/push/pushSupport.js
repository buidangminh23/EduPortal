/**
 * Thiết bị này có nhận được thông báo đẩy không, và nếu chưa thì vướng ở đâu.
 *
 * Đây là nút thắt của cả hướng thay nhóm lớp: một kênh liên lạc mà người nhận
 * không biết có tin mới thì không phải kênh liên lạc. Và trên iPhone — phần lớn
 * phụ huynh thành phố — web push chỉ chạy khi trang đã được **thêm vào màn hình
 * chính**. Không ai tự làm việc đó, nên phải hỏi đúng lúc và hướng dẫn đúng máy.
 *
 * Các hàm ở đây nhận tham số thay vì tự đọc `window`, để chẩn đoán được cho mọi
 * loại máy trong test thay vì chỉ máy đang chạy.
 */

/** Bản iOS đầu tiên cho phép web push, và chỉ khi đã cài lên màn hình chính. */
export const IOS_PUSH_MIN_VERSION = 16.4;

export const READINESS = {
  READY: 'ready',                 // bật được ngay
  NEED_PERMISSION: 'need-permission',
  NEED_INSTALL: 'need-install',   // iOS: phải thêm vào màn hình chính trước
  DENIED: 'denied',               // người dùng đã từ chối, phải vào cài đặt máy
  IOS_TOO_OLD: 'ios-too-old',
  UNSUPPORTED: 'unsupported',
  GRANTED: 'granted'              // đã bật rồi
};

/**
 * Đoán hệ điều hành từ chuỗi trình duyệt.
 *
 * iPad từ iPadOS 13 tự khai là "Macintosh", nên phải nhìn thêm cảm ứng — không
 * thì mọi iPad đều bị xếp vào máy tính và nhận hướng dẫn sai.
 */
export function detectPlatform(userAgent = '', maxTouchPoints = 0) {
  const ua = String(userAgent);
  if (/iPhone|iPod/.test(ua)) return 'ios';
  if (/iPad/.test(ua)) return 'ios';
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Số hiệu bản iOS, ví dụ 17.2. Trả null khi không đọc được.
 */
export function iosVersion(userAgent = '') {
  const m = String(userAgent).match(/OS (\d+)[_.](\d+)/);
  if (!m) return null;
  return Number.parseFloat(`${m[1]}.${m[2]}`);
}

/**
 * Trang đang chạy như một ứng dụng đã cài, hay vẫn trong tab trình duyệt.
 *
 * Safari trên iOS không hiểu `display-mode: standalone` như các trình duyệt
 * khác nên phải hỏi thêm `navigator.standalone` — thiếu nhánh này thì iPhone đã
 * cài vẫn bị coi là chưa cài, và người dùng được bảo đi cài lại lần nữa.
 */
export function isStandalone({ matchMedia, navigatorStandalone } = {}) {
  if (navigatorStandalone === true) return true;
  if (typeof matchMedia === 'function') {
    try {
      return matchMedia('(display-mode: standalone)').matches === true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Kết luận: bật thông báo được chưa, và nếu chưa thì phải làm gì.
 *
 * @param {object} env
 * @param {string}  env.userAgent
 * @param {number}  [env.maxTouchPoints]
 * @param {boolean} env.hasServiceWorker  Trình duyệt có Service Worker không.
 * @param {boolean} env.hasPushManager    Có PushManager không.
 * @param {boolean} env.hasNotification   Có Notification API không.
 * @param {string}  env.permission        'default' | 'granted' | 'denied'
 * @param {boolean} env.standalone        Đang chạy như ứng dụng đã cài.
 * @returns {{ status: string, canEnableNow: boolean, reason: string, action: string }}
 */
export function describePushReadiness(env = {}) {
  const {
    userAgent = '', maxTouchPoints = 0,
    hasServiceWorker = false, hasPushManager = false, hasNotification = false,
    permission = 'default', standalone = false
  } = env;

  const platform = detectPlatform(userAgent, maxTouchPoints);

  // iOS xét trước mọi thứ khác: trong tab Safari chưa cài, PushManager không tồn
  // tại, nên nếu xét "trình duyệt không hỗ trợ" trước thì người dùng iPhone nhận
  // thông báo "máy bạn không dùng được" — sai, và họ sẽ bỏ luôn.
  if (platform === 'ios') {
    const version = iosVersion(userAgent);
    if (version !== null && version < IOS_PUSH_MIN_VERSION) {
      return {
        status: READINESS.IOS_TOO_OLD,
        canEnableNow: false,
        reason: `iPhone và iPad chỉ nhận được thông báo từ iOS ${IOS_PUSH_MIN_VERSION} trở lên. Máy này đang dùng iOS ${version}.`,
        action: 'Cập nhật iOS trong Cài đặt → Cài đặt chung → Cập nhật phần mềm, rồi quay lại đây.'
      };
    }
    if (!standalone) {
      return {
        status: READINESS.NEED_INSTALL,
        canEnableNow: false,
        reason: 'Trên iPhone và iPad, thông báo chỉ hoạt động khi EduPortal đã được thêm vào màn hình chính.',
        action: 'Mở bằng Safari, bấm nút Chia sẻ ở thanh dưới, chọn "Thêm vào MH chính", rồi mở EduPortal từ biểu tượng vừa tạo.'
      };
    }
  }

  if (!hasServiceWorker || !hasPushManager || !hasNotification) {
    return {
      status: READINESS.UNSUPPORTED,
      canEnableNow: false,
      reason: 'Trình duyệt này chưa hỗ trợ thông báo đẩy.',
      action: 'Dùng Chrome hoặc Safari bản mới, hoặc mở EduPortal trên điện thoại khác.'
    };
  }

  if (permission === 'granted') {
    return {
      status: READINESS.GRANTED,
      canEnableNow: false,
      reason: 'Máy này đã bật thông báo.',
      action: 'Không cần làm gì thêm.'
    };
  }

  if (permission === 'denied') {
    return {
      status: READINESS.DENIED,
      canEnableNow: false,
      reason: 'Thông báo đang bị chặn cho trang này.',
      action: platform === 'android'
        ? 'Vào Cài đặt trình duyệt → Cài đặt trang web → Thông báo, tìm EduPortal và chuyển sang Cho phép.'
        : 'Mở phần cài đặt trang web của trình duyệt, tìm EduPortal và cho phép hiện thông báo.'
    };
  }

  return {
    status: READINESS.NEED_PERMISSION,
    canEnableNow: true,
    reason: 'Máy này nhận được thông báo, chỉ cần bật.',
    action: 'Bấm "Bật thông báo" rồi chọn Cho phép ở hộp thoại của trình duyệt.'
  };
}

/** Đọc môi trường thật của trình duyệt đang chạy, để đưa vào describePushReadiness. */
export function readBrowserEnv(win = typeof window === 'undefined' ? undefined : window) {
  if (!win) return { userAgent: '', hasServiceWorker: false, hasPushManager: false, hasNotification: false };

  const nav = win.navigator || {};
  return {
    userAgent: nav.userAgent || '',
    maxTouchPoints: nav.maxTouchPoints || 0,
    hasServiceWorker: 'serviceWorker' in nav,
    hasPushManager: 'PushManager' in win,
    hasNotification: 'Notification' in win,
    permission: 'Notification' in win ? win.Notification.permission : 'default',
    standalone: isStandalone({
      matchMedia: win.matchMedia ? win.matchMedia.bind(win) : undefined,
      navigatorStandalone: nav.standalone
    })
  };
}

/**
 * Đổi khoá VAPID dạng base64url sang mảng byte mà PushManager đòi hỏi.
 *
 * Để sẵn ở đây vì phần đăng ký nhận đẩy cần nó ngay khi máy chủ có khoá; hàm
 * thuần nên kiểm được mà không cần trình duyệt.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Xin quyền hiện thông báo.
 *
 * Chỉ gọi khi người dùng vừa bấm một nút: trình duyệt chặn lời xin quyền không
 * đi kèm thao tác, và một lần bị từ chối thì không hỏi lại được nữa — người
 * dùng phải tự vào cài đặt máy, việc mà gần như không ai làm.
 */
export async function requestPermission(win = typeof window === 'undefined' ? undefined : window) {
  if (!win || !('Notification' in win)) return 'unsupported';
  try {
    return await win.Notification.requestPermission();
  } catch {
    return 'denied';
  }
}
