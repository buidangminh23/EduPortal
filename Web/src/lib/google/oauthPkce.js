/**
 * Đăng nhập Google theo luồng Authorization Code kèm PKCE.
 *
 * Vì sao PKCE chứ không phải luồng đơn giản hơn: EduPortal chạy trong trình
 * duyệt, nên mọi thứ nó biết thì người dùng cũng đọc được bằng DevTools. Không
 * có chỗ nào giấu được client secret. PKCE giải đúng bài toán đó — ứng dụng tự
 * sinh một chuỗi bí mật cho mỗi lần đăng nhập, gửi đi bản băm của nó trước, rồi
 * mới đưa bản gốc khi đổi mã lấy phiếu. Ai chặn được mã giữa đường cũng không
 * đổi được, vì họ không có chuỗi gốc.
 *
 * Luồng ngầm (implicit) cũ hơn thì không cần secret nhưng trả token thẳng trên
 * thanh địa chỉ — token đi vào lịch sử trình duyệt và log máy chủ. Google đã
 * ngừng khuyến nghị nó, và ở đây token mở ra điểm số của học sinh.
 *
 * Phiếu truy cập KHÔNG được cất vào localStorage: bất kỳ đoạn mã nào chạy trong
 * trang cũng đọc được chỗ đó, kể cả mã của một thư viện bị chèn độc. Chỗ cất là
 * sessionStorage, mất khi đóng tab, đúng vòng đời của một lần làm việc.
 */

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/** Chỗ giữ tạm giữa lúc chuyển sang Google và lúc quay về. */
const VERIFIER_KEY = 'google_pkce_verifier';
const STATE_KEY = 'google_pkce_state';

/** Quyền xin của Google Classroom — đọc, và chỉ đọc. */
export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails'
];

/**
 * Chuỗi ngẫu nhiên an toàn, dạng base64url.
 *
 * Dùng crypto.getRandomValues chứ không phải Math.random: Math.random đoán
 * trước được, và ở đây chuỗi này là thứ duy nhất ngăn người khác đổi mã lấy
 * phiếu truy cập vào điểm của học sinh.
 */
export function randomUrlSafe(byteLength = 32, cryptoObj = globalThis.crypto) {
  const bytes = new Uint8Array(byteLength);
  cryptoObj.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** Base64url theo RFC 4648 §5: không dấu chèn, thay + và / cho an toàn trên URL. */
export function base64UrlEncode(bytes) {
  let binary = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Bản băm của chuỗi bí mật, để gửi đi trước.
 *
 * S256 chứ không phải "plain". Với plain thì chuỗi gốc đi thẳng trên URL và
 * PKCE mất sạch tác dụng; Google vẫn chấp nhận plain nên sai ở đây không có
 * thông báo lỗi nào, chỉ có một lớp bảo vệ lặng lẽ biến mất.
 */
export async function deriveChallenge(verifier, subtle = globalThis.crypto?.subtle) {
  const data = new TextEncoder().encode(verifier);
  const digest = await subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Dựng địa chỉ đưa người dùng sang Google.
 *
 * `prompt=consent` và `access_type=offline` cố tình KHÔNG bật: chúng dùng để xin
 * refresh token, thứ chỉ an toàn khi có máy chủ giữ. Trong trình duyệt, một
 * refresh token nằm lay lắt là chìa khoá dài hạn vào dữ liệu lớp học.
 */
export function buildAuthUrl({ clientId, redirectUri, state, codeChallenge, scopes = CLASSROOM_SCOPES, loginHint }) {
  if (!clientId) throw new Error('Thiếu Client ID của Google.');
  if (!redirectUri) throw new Error('Thiếu địa chỉ quay về.');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    include_granted_scopes: 'true'
  });

  if (loginHint) params.set('login_hint', loginHint);
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Bắt đầu đăng nhập: sinh bí mật, cất lại, trả về địa chỉ cần chuyển tới.
 *
 * Không tự chuyển trang ở đây — bên gọi quyết định lúc nào chuyển, và như vậy
 * hàm này kiểm được mà không cần trình duyệt thật.
 */
export async function beginSignIn({ clientId, redirectUri, storage = globalThis.sessionStorage, scopes }) {
  const verifier = randomUrlSafe(32);
  const state = randomUrlSafe(16);
  const codeChallenge = await deriveChallenge(verifier);

  storage.setItem(VERIFIER_KEY, verifier);
  storage.setItem(STATE_KEY, state);

  return {
    url: buildAuthUrl({ clientId, redirectUri, state, codeChallenge, scopes }),
    state
  };
}

/**
 * Đọc kết quả Google trả về trên thanh địa chỉ.
 *
 * @returns {{ status: 'none'|'error'|'ok', code?: string, error?: string }}
 */
export function readCallback(search) {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const error = params.get('error');
  const code = params.get('code');
  const state = params.get('state');

  if (error) {
    return {
      status: 'error',
      error: error === 'access_denied'
        ? 'Bạn đã từ chối cấp quyền, nên EduPortal không đọc được lớp học trên Google Classroom.'
        : `Google trả về lỗi: ${error}.`
    };
  }
  if (!code) return { status: 'none' };
  return { status: 'ok', code, state };
}

/**
 * Kiểm tra tham số state của lần quay về có đúng lần mình gửi đi không.
 *
 * Bỏ bước này thì kẻ tấn công dụ được người dùng bấm vào một liên kết mang mã
 * của tài khoản khác, và EduPortal sẽ lặng lẽ nối tài khoản đó vào phiên của
 * giáo viên. So sánh xong thì xoá, để một mã đã dùng không dùng lại được.
 */
export function verifyState(returnedState, storage = globalThis.sessionStorage) {
  const expected = storage.getItem(STATE_KEY);
  storage.removeItem(STATE_KEY);

  if (!expected) return { ok: false, reason: 'Không tìm thấy dấu vết của lần đăng nhập này — hãy bấm đăng nhập lại.' };
  if (expected !== returnedState) return { ok: false, reason: 'Thông tin quay về không khớp với lần đăng nhập vừa rồi. Đã huỷ để an toàn.' };
  return { ok: true, reason: null };
}

/** Lấy và xoá chuỗi bí mật đã cất. Một lần đăng nhập chỉ dùng nó một lần. */
export function takeVerifier(storage = globalThis.sessionStorage) {
  const verifier = storage.getItem(VERIFIER_KEY);
  storage.removeItem(VERIFIER_KEY);
  return verifier;
}

/**
 * Đổi mã lấy phiếu truy cập.
 *
 * Không gửi client_secret: client kiểu này ở Google được xếp là "public", và
 * chính chuỗi verifier đóng vai trò chứng minh. Gửi secret từ trình duyệt vừa
 * thừa vừa là cách làm lộ nó.
 */
export async function exchangeCode({ clientId, redirectUri, code, verifier, fetchImpl = globalThis.fetch }) {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });

  const res = await fetchImpl(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = data.error_description || data.error || `HTTP ${res.status}`;
    return { ok: false, error: `Không đổi được mã đăng nhập: ${detail}`, token: null };
  }
  if (!data.access_token) {
    return { ok: false, error: 'Google không trả về phiếu truy cập.', token: null };
  }

  return {
    ok: true,
    error: null,
    token: {
      accessToken: data.access_token,
      // Trừ hao 60 giây so với hạn Google báo. Một phiếu hết hạn giữa chừng
      // làm hỏng đúng thao tác đang chạy, còn xin lại sớm một phút thì không
      // ai để ý.
      expiresAt: Date.now() + Math.max(0, (Number(data.expires_in) || 0) - 60) * 1000,
      scope: data.scope || '',
      tokenType: data.token_type || 'Bearer'
    }
  };
}

/** Phiếu còn dùng được không. Thiếu phiếu cũng trả false, để bên gọi chỉ hỏi một câu. */
export function isTokenValid(token, now = Date.now()) {
  return Boolean(token && token.accessToken && token.expiresAt > now);
}

/**
 * Địa chỉ quay về, dựng từ chính origin đang chạy.
 *
 * Viết cứng địa chỉ sẽ hỏng khi chạy ở máy khác hoặc trên bản xem thử; lấy từ
 * `location.origin` thì luôn khớp với origin đã khai ở Google Cloud.
 */
export function callbackUrl(origin = globalThis.location?.origin || '') {
  return `${origin}/oauth/google`;
}

/** Nơi cất phiếu truy cập trong phiên làm việc. */
const TOKEN_KEY = 'google_access_token';

/** Cất phiếu. sessionStorage chứ không localStorage — xem ghi chú đầu tệp. */
export function saveToken(token, storage = globalThis.sessionStorage) {
  storage.setItem(TOKEN_KEY, JSON.stringify(token));
}

/**
 * Lấy phiếu còn hạn.
 *
 * Phiếu hết hạn bị xoá ngay tại đây thay vì trả về cho bên gọi tự kiểm: mỗi chỗ
 * quên kiểm là một lần giao diện báo "đã kết nối" trong khi mọi lệnh gọi đều
 * trả 401.
 */
export function loadToken(storage = globalThis.sessionStorage, now = Date.now()) {
  try {
    const raw = storage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw);
    if (!isTokenValid(token, now)) {
      storage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    storage.removeItem(TOKEN_KEY);
    return null;
  }
}

/** Ngắt kết nối: quên phiếu ở phía EduPortal. */
export function clearToken(storage = globalThis.sessionStorage) {
  storage.removeItem(TOKEN_KEY);
}

/**
 * Hoàn tất đăng nhập từ những gì Google để lại trên thanh địa chỉ.
 *
 * Gom cả ba bước — đối chiếu state, lấy lại chuỗi bí mật, đổi mã lấy phiếu — vào
 * một chỗ, vì bỏ sót bước nào cũng là lỗ hổng chứ không phải phiền toái. Trả về
 * kết quả thay vì tự chuyển trang, để kiểm được mà không cần trình duyệt thật.
 *
 * @returns {{ status:'none'|'error'|'ok', token?:object, error?:string }}
 */
export async function completeSignIn({
  search, clientId, redirectUri,
  storage = globalThis.sessionStorage, fetchImpl = globalThis.fetch
} = {}) {
  const callback = readCallback(search);
  if (callback.status !== 'ok') return callback;

  const state = verifyState(callback.state, storage);
  if (!state.ok) return { status: 'error', error: state.reason };

  const verifier = takeVerifier(storage);
  if (!verifier) {
    return { status: 'error', error: 'Thiếu dấu vết của lần đăng nhập này — hãy bấm kết nối lại.' };
  }

  const exchanged = await exchangeCode({ clientId, redirectUri, code: callback.code, verifier, fetchImpl });
  if (!exchanged.ok) return { status: 'error', error: exchanged.error };

  saveToken(exchanged.token, storage);
  return { status: 'ok', token: exchanged.token };
}
