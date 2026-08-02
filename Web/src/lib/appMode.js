/**
 * Decides whether this build talks to a real database or is a demo.
 *
 * The old rule was "no Supabase URL means demo". That is fail-open: a typo in a
 * Vercel environment variable, or a forgotten one, silently turned a school's
 * deployment into a fake that accepted any password and stored marks in the
 * visitor's browser. Nothing on screen said so.
 *
 * So demo is now something you ask for. Three outcomes, no others:
 *
 *   real          Supabase is configured. Only Supabase can authenticate.
 *   demo          Supabase is absent AND VITE_DEMO_MODE=true was set on purpose.
 *   unconfigured  Neither. The app refuses to start rather than pretend.
 *
 * `.env.development` sets the flag, so `npm run dev` is always a demo. A
 * production build has to be told, which is the point: the person deploying
 * makes the choice explicitly, once, in writing.
 */

export const APP_MODE = {
  REAL: 'real',
  DEMO: 'demo',
  UNCONFIGURED: 'unconfigured'
};

// Values that look set but aren't. The scaffold placeholders are here because a
// half-filled .env is the most likely way to end up with a broken deployment.
const NOT_A_VALUE = new Set([
  '',
  'undefined',
  'null',
  'your_supabase_project_url_here',
  'your_supabase_anon_key_here'
]);

const isUsable = (value) => typeof value === 'string' && !NOT_A_VALUE.has(value.trim());

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabase = isUsable(supabaseUrl) && isUsable(supabaseAnonKey);
const demoRequested = String(import.meta.env.VITE_DEMO_MODE ?? '').trim().toLowerCase() === 'true';

export const appMode = hasSupabase
  ? APP_MODE.REAL
  : demoRequested
    ? APP_MODE.DEMO
    : APP_MODE.UNCONFIGURED;

export const isRealMode = appMode === APP_MODE.REAL;
export const isDemoMode = appMode === APP_MODE.DEMO;
export const isUnconfigured = appMode === APP_MODE.UNCONFIGURED;

/** What to tell whoever is looking at the screen. Plain language, no jargon. */
export function describeMode() {
  if (isRealMode) {
    return {
      mode: APP_MODE.REAL,
      title: 'Đang kết nối cơ sở dữ liệu',
      detail: 'Đăng nhập bằng tài khoản nhà trường cấp. Dữ liệu lưu tập trung, phân quyền theo vai trò.'
    };
  }
  if (isDemoMode) {
    return {
      mode: APP_MODE.DEMO,
      title: 'Bản demo — không phải hệ thống thật',
      detail: 'Không có tài khoản, không có mật khẩu. Mọi số liệu là dữ liệu mẫu và chỉ nằm trong trình duyệt này.'
    };
  }
  return {
    mode: APP_MODE.UNCONFIGURED,
    title: 'Chưa cấu hình',
    detail: 'Đặt VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY để chạy thật, hoặc VITE_DEMO_MODE=true để chạy bản demo.'
  };
}
