import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import aiRouter from './routes/ai.js';
import { createCameraRouterFromEnv } from './routes/cameras.js';
import { createSchoolSsoRouterFromEnv } from './routes/sso.js';
import { attachSignaling } from './signaling.js';

const PORT = process.env.PORT || 8080;

/**
 * How far back through `X-Forwarded-For` the real caller is.
 *
 * Behind the Cloudflare Tunnel or reverse proxy SELF-HOST.md sets up, every
 * request reaches this process from the same upstream address. Left at the
 * Express default, `req.ip` is that address for everybody: the SSO rate limit
 * becomes one bucket the whole staff shares — so one attacker hammering the
 * door locks out every teacher behind it — and the access log answers "who
 * came through here?" with the name of the proxy.
 *
 * The opposite mistake is worse. `trust proxy: true` believes any
 * `X-Forwarded-For` from anyone, so a caller writes its own address, gets a
 * fresh bucket per forged value, and the log records fiction. There is no
 * value of this variable that means "trust every header": name the number of
 * proxies in front of this server, or name the proxies.
 *
 * @param {string | undefined} value  A hop count (`1`), or a comma-separated
 *   list of proxy addresses / subnet names (`loopback, 10.0.0.0/8`). Empty
 *   means no proxy, and `req.ip` is the socket peer.
 */
function trustProxySetting(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return false;

  const hops = Number(raw);
  if (Number.isInteger(hops) && hops >= 0) return hops;

  if (/^(true|all|\*)$/i.test(raw)) {
    throw new Error(
      `TRUST_PROXY=${raw} sẽ tin mọi X-Forwarded-For, kể cả header do chính người gọi đặt: ` +
      'giới hạn số lần thử và nhật ký truy cập đều mất tác dụng. ' +
      'Đặt số lượng proxy đứng trước (ví dụ TRUST_PROXY=1) hoặc địa chỉ proxy cụ thể.'
    );
  }

  return raw.split(',').map(entry => entry.trim()).filter(Boolean);
}

const app = express();
// Thrown, not warned: a server that silently mis-attributes every request is
// worse than one that will not start. Express compiles this immediately, so a
// nonsense address fails here rather than on the first teacher's request.
app.set('trust proxy', trustProxySetting(process.env.TRUST_PROXY));
app.use(cors());
app.use(express.json({ limit: '25mb' })); // audioBase64 có thể lớn

app.get('/health', (_req, res) => res.json({ ok: true, service: 'eduportal-server' }));
app.use('/api', aiRouter);
app.use('/api', createCameraRouterFromEnv());
app.use('/api', createSchoolSsoRouterFromEnv());

const server = http.createServer(app);

// WebRTC signaling qua WebSocket tại đường /rtc?room=<id>
const wss = new WebSocketServer({ server, path: '/rtc' });
attachSignaling(wss);

server.listen(PORT, () => {
  console.log(`EduPortal server đang chạy: http://localhost:${PORT}`);
  console.log(`  • AI REST:   POST /api/transcribe · POST /api/summarize`);
  console.log(`  • Signaling: ws://localhost:${PORT}/rtc?room=<id>`);
  console.log(`  • Camera:    GET /api/cameras · POST /api/cameras/:id/ticket · POST /api/camera-events`);
  console.log(`  • SSO:       POST /api/sso/school (${process.env.SCHOOL_SSO_SECRET ? 'đã bật' : 'chưa cấu hình'})`);
  console.log(`  • Proxy:     trust proxy = ${JSON.stringify(app.get('trust proxy'))}${process.env.TRUST_PROXY ? '' : ' (chưa đặt TRUST_PROXY — dùng địa chỉ kết nối trực tiếp)'}`);
});
