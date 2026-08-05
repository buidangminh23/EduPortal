/**
 * What EduPortal keeps on the device, and what it refuses to keep.
 *
 * A school with one contended access point is offline far more often than it
 * is down. Without a worker the app cannot even open: index.html and the
 * bundles have to come off the network first, so a dropped wifi is a white
 * screen. With one, the shell is already on the phone and the app opens to its
 * own explanation instead of the browser's dinosaur.
 *
 * The line drawn here is between code and data. Code is safe to keep — Vite
 * stamps a content hash into every bundle name, so a cached
 * /assets/index.a1b2c3d4.js is that exact file forever and can be served
 * without asking anyone. Data is not safe to keep. This app carries marks,
 * attendance, exam papers and fees; handing a teacher Tuesday's class list
 * with nothing on screen saying it is Tuesday's is worse than telling them the
 * network is down. So no authenticated response is ever stored. The only thing
 * the worker does for a Supabase read is give up quickly: an access point that
 * completes the handshake but carries no traffic will otherwise hold a fetch
 * open for minutes, and the app has offline states of its own that it cannot
 * show while it is still waiting.
 *
 * Writes are never touched. A handed-in paper, a saved mark, a login — those
 * are POSTs, and the fetch handler returns before it has looked at them. Same
 * for the school's own server behind VITE_SERVER_URL: camera video and EduMeet
 * signalling are live by definition and go straight to the wire.
 *
 * The worker also waits its turn. It deliberately does not call skipWaiting. A
 * new build taking over mid-session would swap the caches underneath a page
 * whose chunks are already on screen, and the page most likely to be on screen
 * is a student halfway through an exam. The new worker installs, sits, and
 * takes over the next time the app is opened with no tab still holding the old
 * one — by which point index.html has been revalidated anyway, because Vercel
 * serves it must-revalidate.
 */

const CACHE_PREFIX = 'eduportal-';
const CACHE_VERSION = 'v1';
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const ASSET_CACHE = `${CACHE_PREFIX}asset-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([SHELL_CACHE, ASSET_CACHE]);

// Every SPA route is served this same document by the Vercel rewrite, so the
// shell is stored under one key rather than once per URL a student happens to
// have open.
const SHELL_URL = '/index.html';

const STATIC_PATHS = new Set([
  '/favicon.svg',
  '/icons.svg',
  '/icon-maskable.svg',
  '/site.webmanifest'
]);

const PRECACHE = [SHELL_URL, '/favicon.svg', '/icon-maskable.svg', '/site.webmanifest'];

/**
 * Long enough that a slow-but-working 3G tether still answers, short enough
 * that a student stops staring at a spinner and sees the app's own message.
 */
const SUPABASE_READ_TIMEOUT_MS = 8000;

// A worker cannot read import.meta.env, so the two origins it has to treat
// differently arrive as query parameters on its own script URL. Absent either
// one, the rule below simply does not fire and those requests behave as if
// there were no worker at all — the safe direction to fail in.
const config = new URL(self.location.href).searchParams;
const SUPABASE_ORIGIN = config.get('supabase');
const BACKEND_ORIGIN = config.get('backend');

const OFFLINE_PAGE = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Không có kết nối mạng — EduPortal</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #f8fafc;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  .card {
    width: 100%;
    max-width: 460px;
    padding: 36px;
    text-align: center;
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .badge {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
  }
  h1 { margin: 0 0 12px; font-size: 22px; font-weight: 700; }
  p { margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6; }
  button {
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #ffffff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 1 23 23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <path d="M12 20h.01"/>
      </svg>
    </div>
    <h1>Không có kết nối mạng</h1>
    <p>Thiết bị chưa vào được mạng nên EduPortal chưa tải được nội dung. Kiểm tra wifi hoặc dữ liệu di động rồi thử lại.</p>
    <button id="retry" type="button">Thử lại</button>
  </div>
  <script>
    document.getElementById('retry').addEventListener('click', function () { location.reload(); });
    window.addEventListener('online', function () { location.reload(); });
  </script>
</body>
</html>`;

/** The school's own Node server, wherever it happens to be reachable. */
function isSchoolServer(url) {
  if (BACKEND_ORIGIN && url.origin === BACKEND_ORIGIN) return true;
  // EduMeet falls back to this page's origin when VITE_SERVER_URL is unset, so
  // /api/ on our own host is the relay too, not something to cache.
  return url.origin === self.location.origin && url.pathname.startsWith('/api/');
}

/**
 * A read of school data — and only a read. Auth, realtime, storage and every
 * write are left entirely alone.
 */
function isSupabaseRead(url) {
  return Boolean(SUPABASE_ORIGIN)
    && url.origin === SUPABASE_ORIGIN
    && url.pathname.startsWith('/rest/v1/');
}

/**
 * Pass the request through, but stop waiting after a bounded time and answer
 * with an error the app can render. Nothing is read from or written to a cache
 * here: a stale mark shown as a current one is the failure this avoids.
 */
async function readWithTimeout(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_READ_TIMEOUT_MS);

  try {
    return await fetch(request, { signal: controller.signal });
  } catch {
    return new Response(
      JSON.stringify({ message: 'Không có kết nối tới máy chủ dữ liệu.', code: 'sw_offline' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Safe only because the filename carries the hash of the contents. */
async function cacheFirst(event) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;

  const response = await fetch(event.request);
  if (response.ok && response.type === 'basic') {
    event.waitUntil(cache.put(event.request, response.clone()));
  }
  return response;
}

/**
 * Answer from the cache immediately, refresh it in the background.
 *
 * @returns {Promise<Response|null>} null when nothing was cached and the
 *   network did not answer either — the caller decides what to show.
 */
async function staleWhileRevalidate(event, cacheKey) {
  const cache = await caches.open(SHELL_CACHE);
  // The shell goes in under a navigation request and comes back out under a
  // bare path, so any Vary the CDN attached would make the two look like
  // different entries. There is only ever one index.html, so ignoring Vary
  // cannot serve the wrong variant — it only stops a cached app from being
  // missed and the offline page shown over the top of it.
  const cached = await cache.match(cacheKey, { ignoreVary: true });

  const network = fetch(event.request)
    .then((response) => {
      // A redirect stored under the shell key cannot later be replayed for a
      // navigation, so it is fetched but never kept.
      if (response.ok && response.type === 'basic' && !response.redirected) {
        return cache.put(cacheKey, response.clone()).then(() => response);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }

  return network;
}

function offlinePage() {
  return new Response(OFFLINE_PAGE, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => Promise.all(
      // One missing file must not cost the whole install; the runtime handlers
      // fill any gap on first use.
      PRECACHE.map((path) => cache.add(new Request(path, { cache: 'reload' })).catch(() => null))
    ))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.has(name))
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isSchoolServer(url)) return;

  if (isSupabaseRead(url)) {
    event.respondWith(readWithTimeout(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      staleWhileRevalidate(event, SHELL_URL).then((response) => response || offlinePage())
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(event));
    return;
  }

  if (STATIC_PATHS.has(url.pathname)) {
    event.respondWith(
      staleWhileRevalidate(event, request)
        .then((response) => response || new Response(null, { status: 504 }))
    );
  }
});
