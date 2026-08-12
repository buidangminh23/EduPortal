/**
 * Đổi mã đăng nhập Google lấy phiếu truy cập.
 *
 * Vì sao phải có bước này chứ không gọi thẳng Google từ trình duyệt: client
 * OAuth loại "Web application" của Google **luôn** đòi client_secret ở bước đổi
 * mã. PKCE không thay được — nó chỉ thay secret cho client Android/iOS/Desktop.
 * Gọi thẳng từ trình duyệt sẽ nhận đúng câu "client_secret is missing".
 *
 * Nên secret sống ở đây, trong biến môi trường của Vercel, và không bao giờ đi
 * vào gói JavaScript mà trình duyệt tải về.
 *
 * Hàm này KHÔNG xin quyền offline, nên Google không cấp phiếu gia hạn. Đó là cố
 * ý: phiếu gia hạn sống hàng tháng và cần một nơi cất an toàn — trường chưa có
 * cơ sở dữ liệu cho việc đó, mà ném nó về trình duyệt thì còn tệ hơn thứ ta vừa
 * tránh. Phiếu truy cập sống khoảng một giờ; hết hạn thì giáo viên bấm kết nối
 * lại, mất vài giây.
 */

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/**
 * Địa chỉ quay về do trình duyệt gửi lên, nên phải soi.
 *
 * Google vẫn kiểm lần nữa — nó chỉ nhận địa chỉ đã khai trong Cloud Console và
 * đúng cái đã dùng lúc xin mã — nhưng chặn ngay ở đây thì endpoint này không
 * thành cầu trung chuyển cho người lạ gọi Google bằng danh nghĩa của trường.
 */
export function isAllowedRedirect(value, requestHost) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.pathname !== '/oauth/google') return false;

  // Máy của người đang lập trình: chấp nhận, và chỉ mình nó được dùng http.
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;

  // Còn lại phải là https và đúng tên miền mà lời gọi này đi vào. Google có
  // kiểm lần nữa — nó chỉ nhận địa chỉ đã khai trong Cloud Console — nhưng chặn
  // ngay ở đây thì endpoint không thành cầu để người lạ gọi Google bằng danh
  // nghĩa của trường, và một tên miền lạ bị trả lời ngay thay vì đi một vòng.
  return url.protocol === 'https:' && Boolean(requestHost) && url.host === requestHost;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Chỉ nhận POST.' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Nói rõ thiếu cái gì, nhưng không nói giá trị của cái đang có.
    return res.status(500).json({
      error: 'Máy chủ chưa được khai báo GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET.'
    });
  }

  const { code, codeVerifier, redirectUri } = await readJsonBody(req);

  if (!code || !codeVerifier || !redirectUri) {
    return res.status(400).json({ error: 'Thiếu mã đăng nhập, dấu vết PKCE hoặc địa chỉ quay về.' });
  }
  if (!isAllowedRedirect(redirectUri, req.headers && req.headers.host)) {
    return res.status(400).json({ error: 'Địa chỉ quay về không hợp lệ.' });
  }

  let googleRes;
  let data;
  try {
    googleRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }).toString()
    });
    data = await googleRes.json().catch(() => ({}));
  } catch (e) {
    return res.status(502).json({ error: `Không gọi được Google: ${e.message}` });
  }

  if (!googleRes.ok) {
    // Chuyển tiếp lời giải thích của Google, không chuyển tiếp cả gói trả về:
    // trong đó có thể lẫn thứ không nên cho trình duyệt thấy.
    const detail = data.error_description || data.error || `HTTP ${googleRes.status}`;
    return res.status(googleRes.status).json({ error: String(detail) });
  }

  if (!data.access_token) {
    return res.status(502).json({ error: 'Google không trả về phiếu truy cập.' });
  }

  // Liệt kê đúng những trường được phép ra ngoài. Nếu một ngày nào đó có ai
  // thêm access_type=offline vào lúc xin mã, phiếu gia hạn cũng không lọt ra
  // theo đường này.
  return res.status(200).json({
    access_token: data.access_token,
    expires_in: Number(data.expires_in) || 0,
    scope: data.scope || '',
    token_type: data.token_type || 'Bearer'
  });
};
