import { describe, it, expect, vi } from 'vitest';
import {
  randomUrlSafe, base64UrlEncode, deriveChallenge, buildAuthUrl, beginSignIn,
  readCallback, verifyState, takeVerifier, exchangeCode, isTokenValid, callbackUrl,
  saveToken, loadToken, clearToken, completeSignIn,
  CLASSROOM_SCOPES
} from './oauthPkce';

/** sessionStorage giả, đủ dùng cho các hàm ở đây. */
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data
  };
}

describe('base64UrlEncode', () => {
  it('không để lại ký tự cần mã hoá lại trên URL', () => {
    const out = base64UrlEncode(new Uint8Array([251, 255, 191, 0, 1, 2]));
    expect(out).not.toMatch(/[+/=]/);
  });

  it('mã hoá đúng theo base64url', () => {
    expect(base64UrlEncode(new Uint8Array([104, 101, 108, 108, 111]))).toBe('aGVsbG8');
  });
});

describe('randomUrlSafe', () => {
  it('dùng nguồn ngẫu nhiên của trình duyệt, không dùng Math.random', () => {
    const spy = vi.fn((arr) => { arr.fill(7); return arr; });
    const out = randomUrlSafe(8, { getRandomValues: spy });
    expect(spy).toHaveBeenCalled();
    expect(out).not.toMatch(/[+/=]/);
  });

  it('hai lần gọi cho hai chuỗi khác nhau', () => {
    expect(randomUrlSafe(32)).not.toBe(randomUrlSafe(32));
  });

  it('đủ dài theo yêu cầu của PKCE (verifier tối thiểu 43 ký tự)', () => {
    expect(randomUrlSafe(32).length).toBeGreaterThanOrEqual(43);
  });
});

describe('deriveChallenge', () => {
  it('băm bằng SHA-256, không dùng plain', async () => {
    const subtle = { digest: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer) };
    await deriveChallenge('abc', subtle);
    expect(subtle.digest).toHaveBeenCalledWith('SHA-256', expect.anything());
  });

  it('cùng một verifier luôn cho cùng một challenge', async () => {
    const a = await deriveChallenge('cung-mot-chuoi');
    const b = await deriveChallenge('cung-mot-chuoi');
    expect(a).toBe(b);
  });

  it('challenge khác verifier — nếu bằng nhau nghĩa là chưa băm', async () => {
    const verifier = 'chuoi-bi-mat-cua-lan-dang-nhap-nay';
    expect(await deriveChallenge(verifier)).not.toBe(verifier);
  });
});

describe('buildAuthUrl', () => {
  const base = {
    clientId: 'abc.apps.googleusercontent.com',
    redirectUri: 'https://edu-portal-bay.vercel.app/oauth/google',
    state: 'st4te',
    codeChallenge: 'ch4llenge'
  };

  it('khai báo phương thức băm S256', () => {
    const url = new URL(buildAuthUrl(base));
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe('ch4llenge');
  });

  it('xin mã, không xin token thẳng trên thanh địa chỉ', () => {
    const url = new URL(buildAuthUrl(base));
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('không xin refresh token — trình duyệt không phải chỗ giữ nó', () => {
    const url = new URL(buildAuthUrl(base));
    expect(url.searchParams.get('access_type')).toBeNull();
    expect(url.searchParams.get('prompt')).toBeNull();
  });

  it('chỉ xin bốn quyền đọc của Classroom', () => {
    const url = new URL(buildAuthUrl(base));
    const scopes = url.searchParams.get('scope').split(' ');
    expect(scopes).toEqual(CLASSROOM_SCOPES);
    expect(scopes.every((s) => s.includes('readonly') || s.includes('profile.emails'))).toBe(true);
  });

  it('báo lỗi rõ ràng khi thiếu Client ID', () => {
    expect(() => buildAuthUrl({ ...base, clientId: '' })).toThrow(/Client ID/);
  });
});

describe('beginSignIn', () => {
  it('cất verifier và state lại để lát nữa đối chiếu', async () => {
    const storage = fakeStorage();
    const out = await beginSignIn({
      clientId: 'abc.apps.googleusercontent.com',
      redirectUri: 'http://localhost:5173/oauth/google',
      storage
    });
    expect(storage.getItem('google_pkce_verifier')).toBeTruthy();
    expect(storage.getItem('google_pkce_state')).toBe(out.state);
  });

  it('không đưa verifier lên URL — chỉ challenge được đi', async () => {
    const storage = fakeStorage();
    const { url } = await beginSignIn({
      clientId: 'abc.apps.googleusercontent.com',
      redirectUri: 'http://localhost:5173/oauth/google',
      storage
    });
    const verifier = storage.getItem('google_pkce_verifier');
    expect(url).not.toContain(verifier);
  });
});

describe('readCallback', () => {
  it('đọc được mã trả về', () => {
    expect(readCallback('?code=abc&state=xyz')).toMatchObject({ status: 'ok', code: 'abc', state: 'xyz' });
  });

  it('nói bằng tiếng người khi người dùng bấm từ chối', () => {
    const out = readCallback('?error=access_denied');
    expect(out.status).toBe('error');
    expect(out.error).toMatch(/từ chối/);
  });

  it('không có gì trên URL thì không coi là lỗi', () => {
    expect(readCallback('').status).toBe('none');
    expect(readCallback('?foo=bar').status).toBe('none');
  });
});

describe('verifyState', () => {
  it('khớp thì cho qua', () => {
    const storage = fakeStorage({ google_pkce_state: 'st4te' });
    expect(verifyState('st4te', storage).ok).toBe(true);
  });

  it('lệch thì chặn — đây là lá chắn chống ghép nhầm tài khoản', () => {
    const storage = fakeStorage({ google_pkce_state: 'st4te' });
    const out = verifyState('cua-ke-khac', storage);
    expect(out.ok).toBe(false);
    expect(out.reason).toMatch(/không khớp/i);
  });

  it('xoá state sau khi dùng, để một lần quay về không dùng lại được', () => {
    const storage = fakeStorage({ google_pkce_state: 'st4te' });
    verifyState('st4te', storage);
    expect(storage.getItem('google_pkce_state')).toBeNull();
  });

  it('không có state đã lưu thì từ chối, không mặc định cho qua', () => {
    expect(verifyState('bat-ky', fakeStorage()).ok).toBe(false);
  });
});

describe('takeVerifier', () => {
  it('lấy xong là xoá', () => {
    const storage = fakeStorage({ google_pkce_verifier: 'v3rifier' });
    expect(takeVerifier(storage)).toBe('v3rifier');
    expect(storage.getItem('google_pkce_verifier')).toBeNull();
  });
});

describe('exchangeCode', () => {
  const args = {
    redirectUri: 'http://localhost:5173/oauth/google',
    code: 'ma-tra-ve',
    verifier: 'chuoi-bi-mat'
  };

  it('gửi mã tới máy chủ của EduPortal, không gọi thẳng Google', async () => {
    // Client OAuth "Web application" của Google luôn đòi client_secret ở bước
    // này. Gọi thẳng từ trình duyệt là cách chắc chắn nhận "client_secret is
    // missing" — đúng lỗi đã gặp trên production.
    const fetchImpl = vi.fn(async () => ({
      ok: true, json: async () => ({ access_token: 'tk', expires_in: 3600, token_type: 'Bearer' })
    }));
    await exchangeCode({ ...args, fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/google/token');
    expect(String(url)).not.toMatch(/googleapis\.com/);
    expect(JSON.parse(init.body)).toEqual({
      code: 'ma-tra-ve',
      codeVerifier: 'chuoi-bi-mat',
      redirectUri: 'http://localhost:5173/oauth/google'
    });
  });

  it('không đính client secret vào lời gọi từ trình duyệt', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ access_token: 'tk' }) }));
    await exchangeCode({ ...args, fetchImpl });
    expect(fetchImpl.mock.calls[0][1].body).not.toMatch(/secret/i);
  });

  it('tính sẵn thời điểm hết hạn, trừ hao một phút', async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => ({ access_token: 'tk', expires_in: 3600 }) });
    const before = Date.now();
    const { token } = await exchangeCode({ ...args, fetchImpl });
    expect(token.expiresAt).toBeGreaterThan(before + 3500 * 1000);
    expect(token.expiresAt).toBeLessThanOrEqual(before + 3540 * 1000 + 50);
  });

  it('trả lỗi đọc được khi máy chủ từ chối', async () => {
    const fetchImpl = async () => ({ ok: false, status: 400, json: async () => ({ error: 'Bad Request' }) });
    const out = await exchangeCode({ ...args, fetchImpl });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/Bad Request/);
  });

  it('phản hồi 200 mà thiếu token vẫn phải coi là thất bại', async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => ({}) });
    const out = await exchangeCode({ ...args, fetchImpl });
    expect(out.ok).toBe(false);
    expect(out.token).toBeNull();
  });
});

describe('isTokenValid', () => {
  it('còn hạn thì dùng được', () => {
    expect(isTokenValid({ accessToken: 'tk', expiresAt: 2000 }, 1000)).toBe(true);
  });

  it('hết hạn hoặc không có thì không', () => {
    expect(isTokenValid({ accessToken: 'tk', expiresAt: 500 }, 1000)).toBe(false);
    expect(isTokenValid(null)).toBe(false);
    expect(isTokenValid({ expiresAt: 9e15 })).toBe(false);
  });
});

describe('callbackUrl', () => {
  it('dựng từ origin đang chạy, khớp với địa chỉ đã khai ở Google Cloud', () => {
    expect(callbackUrl('http://localhost:5173')).toBe('http://localhost:5173/oauth/google');
    expect(callbackUrl('https://edu-portal-bay.vercel.app')).toBe('https://edu-portal-bay.vercel.app/oauth/google');
  });
});

describe('loadToken / saveToken / clearToken', () => {
  it('phiếu còn hạn thì lấy lại được', () => {
    const storage = fakeStorage();
    saveToken({ accessToken: 'tk', expiresAt: 5000 }, storage);
    expect(loadToken(storage, 1000)).toMatchObject({ accessToken: 'tk' });
  });

  it('phiếu hết hạn bị xoá luôn, không trả về cho bên gọi tự kiểm', () => {
    const storage = fakeStorage();
    saveToken({ accessToken: 'tk', expiresAt: 500 }, storage);
    expect(loadToken(storage, 1000)).toBeNull();
    expect(storage.getItem('google_access_token')).toBeNull();
  });

  it('dữ liệu hỏng thì dọn đi thay vì làm sập màn hình', () => {
    const storage = fakeStorage({ google_access_token: '{khong-phai-json' });
    expect(loadToken(storage)).toBeNull();
    expect(storage.getItem('google_access_token')).toBeNull();
  });

  it('ngắt kết nối thì quên phiếu', () => {
    const storage = fakeStorage();
    saveToken({ accessToken: 'tk', expiresAt: 9e15 }, storage);
    clearToken(storage);
    expect(loadToken(storage)).toBeNull();
  });
});

describe('completeSignIn', () => {
  const args = {
    clientId: 'abc.apps.googleusercontent.com',
    redirectUri: 'http://localhost:5173/oauth/google'
  };

  it('đi trọn ba bước rồi cất phiếu', async () => {
    const storage = fakeStorage({ google_pkce_state: 'st', google_pkce_verifier: 'vf' });
    const fetchImpl = async () => ({ ok: true, json: async () => ({ access_token: 'tk', expires_in: 3600 }) });

    const out = await completeSignIn({ ...args, search: '?code=abc&state=st', storage, fetchImpl });
    expect(out.status).toBe('ok');
    expect(loadToken(storage)).toMatchObject({ accessToken: 'tk' });
  });

  it('state lệch thì dừng, và tuyệt đối không gọi sang Google đổi mã', async () => {
    const storage = fakeStorage({ google_pkce_state: 'st', google_pkce_verifier: 'vf' });
    const fetchImpl = vi.fn();
    const out = await completeSignIn({ ...args, search: '?code=abc&state=cua-ke-khac', storage, fetchImpl });
    expect(out.status).toBe('error');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('mất chuỗi bí mật thì báo lỗi thay vì đổi mã trần', async () => {
    const storage = fakeStorage({ google_pkce_state: 'st' });
    const fetchImpl = vi.fn();
    const out = await completeSignIn({ ...args, search: '?code=abc&state=st', storage, fetchImpl });
    expect(out.status).toBe('error');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('URL không mang gì thì im lặng, không coi là lỗi', async () => {
    const out = await completeSignIn({ ...args, search: '', storage: fakeStorage() });
    expect(out.status).toBe('none');
  });

  it('không cất phiếu khi Google từ chối đổi mã', async () => {
    const storage = fakeStorage({ google_pkce_state: 'st', google_pkce_verifier: 'vf' });
    const fetchImpl = async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) });
    const out = await completeSignIn({ ...args, search: '?code=abc&state=st', storage, fetchImpl });
    expect(out.status).toBe('error');
    expect(loadToken(storage)).toBeNull();
  });
});
