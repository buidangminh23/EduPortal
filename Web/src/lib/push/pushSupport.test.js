import { describe, it, expect } from 'vitest';
import {
  detectPlatform, iosVersion, isStandalone, describePushReadiness,
  urlBase64ToUint8Array, READINESS, IOS_PUSH_MIN_VERSION
} from './pushSupport';

const UA = {
  iphone17: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Version/17.2 Mobile Safari/604.1',
  iphone15: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 Version/15.6 Mobile Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 13; SM-A536E) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'
};

const full = { hasServiceWorker: true, hasPushManager: true, hasNotification: true, permission: 'default' };

describe('detectPlatform', () => {
  it('nhận ra iPhone và Android', () => {
    expect(detectPlatform(UA.iphone17)).toBe('ios');
    expect(detectPlatform(UA.android)).toBe('android');
    expect(detectPlatform(UA.desktop)).toBe('desktop');
  });

  it('iPad khai là Macintosh vẫn phải nhận ra là iOS', () => {
    // iPadOS 13 trở đi tự khai Macintosh; chỉ có số điểm chạm phân biệt được.
    expect(detectPlatform(UA.ipad, 5)).toBe('ios');
    expect(detectPlatform(UA.ipad, 0)).toBe('desktop');
  });
});

describe('iosVersion', () => {
  it('đọc được số hiệu bản iOS', () => {
    expect(iosVersion(UA.iphone17)).toBe(17.2);
    expect(iosVersion(UA.iphone15)).toBe(15.6);
  });

  it('trả null khi không phải iOS', () => {
    expect(iosVersion(UA.android)).toBeNull();
  });
});

describe('isStandalone', () => {
  it('nhận ra ứng dụng đã cài trên Safari iOS', () => {
    expect(isStandalone({ navigatorStandalone: true })).toBe(true);
  });

  it('nhận ra qua display-mode ở các trình duyệt khác', () => {
    expect(isStandalone({ matchMedia: () => ({ matches: true }) })).toBe(true);
    expect(isStandalone({ matchMedia: () => ({ matches: false }) })).toBe(false);
  });

  it('không nổ khi matchMedia ném lỗi', () => {
    expect(isStandalone({ matchMedia: () => { throw new Error('x'); } })).toBe(false);
  });

  it('thiếu thông tin thì coi như chưa cài', () => {
    expect(isStandalone({})).toBe(false);
  });
});

describe('describePushReadiness', () => {
  it('Android đã cấp quyền thì báo đã bật', () => {
    const r = describePushReadiness({ ...full, userAgent: UA.android, permission: 'granted' });
    expect(r.status).toBe(READINESS.GRANTED);
    expect(r.canEnableNow).toBe(false);
  });

  it('Android chưa hỏi thì bật được ngay', () => {
    const r = describePushReadiness({ ...full, userAgent: UA.android });
    expect(r.status).toBe(READINESS.NEED_PERMISSION);
    expect(r.canEnableNow).toBe(true);
  });

  it('bị chặn thì hướng dẫn vào cài đặt, không mời bấm nút nữa', () => {
    const r = describePushReadiness({ ...full, userAgent: UA.android, permission: 'denied' });
    expect(r.status).toBe(READINESS.DENIED);
    expect(r.canEnableNow).toBe(false);
    expect(r.action).toMatch(/Cài đặt/);
  });

  it('iPhone trong tab Safari phải được bảo cài lên màn hình chính trước', () => {
    // Chính là ca quyết định của cả hướng này: trong tab, PushManager không tồn
    // tại, nên nếu xét "không hỗ trợ" trước thì người dùng iPhone bị đuổi đi.
    const r = describePushReadiness({
      userAgent: UA.iphone17, standalone: false,
      hasServiceWorker: true, hasPushManager: false, hasNotification: false, permission: 'default'
    });
    expect(r.status).toBe(READINESS.NEED_INSTALL);
    expect(r.action).toMatch(/Thêm vào MH chính/);
  });

  it('iPhone đã cài lên màn hình chính thì bật được', () => {
    const r = describePushReadiness({ ...full, userAgent: UA.iphone17, standalone: true });
    expect(r.status).toBe(READINESS.NEED_PERMISSION);
    expect(r.canEnableNow).toBe(true);
  });

  it(`iOS cũ hơn ${IOS_PUSH_MIN_VERSION} thì nói thẳng là phải cập nhật máy`, () => {
    const r = describePushReadiness({ ...full, userAgent: UA.iphone15, standalone: true });
    expect(r.status).toBe(READINESS.IOS_TOO_OLD);
    expect(r.reason).toContain('15.6');
  });

  it('iOS cũ bị chặn ngay cả khi đã cài, vì cài không cứu được bản cũ', () => {
    const r = describePushReadiness({ ...full, userAgent: UA.iphone15, standalone: false });
    expect(r.status).toBe(READINESS.IOS_TOO_OLD);
  });

  it('trình duyệt cũ trên máy tính thì báo không hỗ trợ', () => {
    const r = describePushReadiness({
      userAgent: UA.desktop, hasServiceWorker: false, hasPushManager: false, hasNotification: false
    });
    expect(r.status).toBe(READINESS.UNSUPPORTED);
  });

  it('luôn trả về đủ bốn trường để màn hình không hiện ô trống', () => {
    const cases = [
      { ...full, userAgent: UA.android },
      { ...full, userAgent: UA.iphone17, standalone: false },
      { ...full, userAgent: UA.iphone15 },
      { userAgent: UA.desktop },
      { ...full, userAgent: UA.android, permission: 'denied' }
    ];
    cases.forEach((env) => {
      const r = describePushReadiness(env);
      expect(typeof r.status).toBe('string');
      expect(typeof r.canEnableNow).toBe('boolean');
      expect(r.reason.length).toBeGreaterThan(0);
      expect(r.action.length).toBeGreaterThan(0);
    });
  });
});

describe('urlBase64ToUint8Array', () => {
  it('đổi khoá base64url thành byte', () => {
    // "hello" ở dạng base64url, không có dấu chèn thêm
    const out = urlBase64ToUint8Array('aGVsbG8');
    expect(Array.from(out)).toEqual([104, 101, 108, 108, 111]);
  });

  it('xử lý được ký tự - và _ của base64url', () => {
    // '-_-_' là base64url hợp lệ, tương đương '+/+/' ở base64 thường.
    const out = urlBase64ToUint8Array('-_-_');
    expect(Array.from(out)).toEqual([251, 255, 191]);
  });

  it('thêm dấu chèn cho chuỗi thiếu, đúng như khoá VAPID thật', () => {
    // Khoá VAPID công khai dài 87 ký tự, tức 87 % 4 === 3 và cần một dấu '='.
    const key = 'B'.repeat(87);
    expect(urlBase64ToUint8Array(key).length).toBe(65);
  });
});
