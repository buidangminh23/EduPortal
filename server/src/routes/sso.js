/**
 * The door between the school's website and this app.
 *
 *   school site ──note──▶ this route ──▶ Supabase ──session──▶ browser
 *
 * A teacher who is already signed in on the school's website should not have
 * to sign in again here. The school signs a note (see lib/schoolToken.js);
 * this route checks it, makes sure a matching Supabase account exists, and
 * hands the browser a one-time hash it can exchange for a real session.
 *
 * What the note buys, and what it does not:
 *
 *   - It never sends the service key to the browser. The browser receives a
 *     single-use hash tied to one email; the key stays in this process.
 *   - A valid signature proves the school wrote the note. It does not prove the
 *     email in it belongs to the account that already holds that email, so an
 *     account is bound to the school's teacher code at creation and that
 *     binding is checked on every later arrival. An email alone opens nothing.
 *   - Writing a role into `profiles` *is* granting it: `auth_role()` in
 *     migration 005 reads that column, so row-level security decides nothing
 *     this file has not already decided. Hence the ceiling on which roles a
 *     note may ask for, and hence a role being set once, at provisioning, and
 *     never re-asserted by a later sign-in.
 */

import { Router } from 'express';
import { verifySchoolToken, createReplayGuard, messageFor } from '../lib/schoolToken.js';
import { createAccessLog } from '../lib/accessLog.js';

/** Enough for a teacher who fumbles the link; far short of guessing a signature. */
const DEFAULT_RATE_LIMIT = { max: 20, windowMs: 60_000 };

/**
 * The highest role a note may ask for. Deliberately not `admin`.
 *
 * An admin in EduPortal reads the live camera wall — children's faces — so the
 * question "who may become an admin?" cannot have the answer "whoever holds
 * the school's signing secret, or whoever can edit the school's website". A
 * head teacher's account is promoted inside EduPortal, by a person, once.
 */
const DEFAULT_ALLOWED_ROLES = ['teacher'];

/**
 * Counts attempts per caller so a forged note cannot be retried in a loop.
 *
 * The signature is HMAC-SHA256 and will not fall to twenty guesses a minute,
 * or to twenty billion. The limit is here to keep a broken redirect loop from
 * hammering Supabase, and to make a determined forger visible in the log
 * rather than silent.
 */
function createRateLimiter({ max, windowMs, now = () => Date.now() }) {
  const hits = new Map();

  return function allow(key) {
    const current = now();
    const window = hits.get(key);

    if (!window || window.resetAt <= current) {
      hits.set(key, { count: 1, resetAt: current + windowMs });
      return true;
    }
    window.count += 1;
    return window.count <= max;
  };
}

export function createSchoolSsoRouter({
  secret = '',
  issuer = '',
  audience = 'eduportal',
  schoolDomain = '',
  allowedRoles = DEFAULT_ALLOWED_ROLES,
  supabaseUrl = '',
  serviceRoleKey = '',
  fetchImpl = globalThis.fetch,
  accessLog,
  replayGuard = createReplayGuard(),
  rateLimit = DEFAULT_RATE_LIMIT,
  now = () => Date.now()
} = {}) {
  const router = Router();
  const log = accessLog || createAccessLog({});
  const allow = createRateLimiter({ ...rateLimit, now });

  // Every name in this gate is load-bearing, so every one of them is required.
  // `issuer` decides whose signature counts and `schoolDomain` decides which
  // addresses may walk in; left blank, each used to switch its own check off
  // while this flag still said "configured" and the door still served traffic.
  // An incomplete deployment answers 503, the way an unconfigured camera
  // server does, rather than running one check short in silence.
  const domain = schoolDomain.trim().replace(/^@/, '').toLowerCase();
  const configured = Boolean(secret && issuer && domain && supabaseUrl && serviceRoleKey);
  const base = supabaseUrl.replace(/\/$/, '');

  /** `@truong.edu.vn`, so the check below is a plain suffix on a lower-cased address. */
  const emailSuffix = `@${domain}`;

  const adminHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  async function callSupabase(path, init = {}) {
    const response = await fetchImpl(`${base}${path}`, {
      ...init,
      headers: { ...adminHeaders, ...(init.headers || {}) }
    });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    return { ok: response.ok, status: response.status, body };
  }

  /** The school this deployment belongs to, so a profile lands in the right one. */
  async function findSchoolId() {
    if (!domain) return null;
    const query = `/rest/v1/schools?domain=eq.${encodeURIComponent(domain)}&select=id&limit=1`;
    const { ok, body } = await callSupabase(query);
    return ok && Array.isArray(body) && body[0]?.id ? body[0].id : null;
  }

  /**
   * Creates the account on first arrival, stamped with the school's own id.
   *
   * `email_confirm` is set because the school already confirmed this address
   * when it hired the person — sending a confirmation mail to a teacher who
   * just typed their password on the school's own site would be asking them to
   * prove something twice.
   *
   * The teacher code goes in `app_metadata`, not `user_metadata`. The
   * difference is not cosmetic: `user_metadata` is what `auth.updateUser()`
   * writes, so any signed-in account can set its own — a binding the holder can
   * forge binds nothing. `app_metadata` is reachable only through the admin
   * API, which needs the service key this process is holding.
   */
  async function ensureAccount(teacher) {
    const { ok, status, body } = await callSupabase('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: teacher.email,
        email_confirm: true,
        app_metadata: { teacher_code: teacher.code },
        user_metadata: { full_name: teacher.name }
      })
    });

    if (ok) return { created: true, id: body?.id || null };

    // 422 with an "already registered" code is the expected path for every
    // sign-in after the first, not an error worth failing on. It is also what
    // an attacker who signed up through the public anon key first would
    // produce, so the caller checks the binding before going any further.
    const alreadyThere =
      status === 422 &&
      /already|exist|registered/i.test(`${body?.error_code || ''} ${body?.msg || body?.message || ''}`);

    if (alreadyThere) return { created: false, id: null };

    return { failed: true, status, body };
  }

  /**
   * The account already holding this address, or nothing.
   *
   * `filter` is a partial match on the email column, so the row is picked by
   * comparing the address in full rather than by taking the first one back:
   * a filter for `a.nv@…` also matches `a.nvx@…`.
   */
  async function findAccountByEmail(email) {
    const query = `/auth/v1/admin/users?per_page=200&filter=${encodeURIComponent(email)}`;
    const { ok, body } = await callSupabase(query);
    if (!ok) return { failed: true };

    const users = Array.isArray(body?.users) ? body.users : Array.isArray(body) ? body : null;
    if (!users) return { failed: true };

    const match = users.find(user => String(user?.email || '').toLowerCase() === email);
    return match ? { user: match } : { missing: true };
  }

  /**
   * Does the account holding this address belong to the teacher in the note?
   *
   * Supabase is configured with `enable_signup = true` and
   * `enable_confirmations = false`, and the anon key ships inside the browser
   * bundle. So anyone can register the head teacher's address without ever
   * reaching that mailbox, and sit on it. Matching on the address alone would
   * then hand the head teacher's session — and their role — to whoever got
   * there first. The school's teacher code is what actually decides, and an
   * account that carries no code, or someone else's, is refused rather than
   * adopted.
   */
  function checkBinding(user, teacher) {
    const stored = user?.app_metadata?.teacher_code;
    if (typeof stored !== 'string' || !stored.trim()) return { reason: 'teacher_code_unbound' };
    // Compared plainly, unlike the signature in schoolToken.js: a teacher code
    // is not a secret, and nobody reaches this line without a note the school
    // already signed, so there is no guess here for timing to narrow down.
    if (stored.trim() !== teacher.code) return { reason: 'teacher_code_mismatch' };
    return { ok: true };
  }

  /**
   * Mints the one-time hash the browser exchanges for a session.
   *
   * Returned instead of the full action link: the link carries a redirect
   * target and lands in browser history, while the hash is spent by the very
   * next call the app makes.
   */
  async function issueSessionHash(email) {
    const { ok, status, body } = await callSupabase('/auth/v1/admin/generate_link', {
      method: 'POST',
      body: JSON.stringify({ type: 'magiclink', email })
    });

    if (!ok) return { failed: true, status, body };

    const properties = body?.properties || body;
    return {
      tokenHash: properties?.hashed_token || null,
      userId: body?.user?.id || body?.id || null
    };
  }

  /**
   * Writes the profile, and writes the role exactly once.
   *
   * `auth_role()` in migration 005 is a read of `profiles.role`, so this column
   * is the permission — upserting it on every arrival meant the note decided
   * the role afresh each time. Two consequences, both bad: a head teacher the
   * school demoted inside EduPortal was promoted again by their next login,
   * and a school website that started sending a higher role would rewrite
   * every existing account on the way past.
   *
   * So the role is part of provisioning, not of signing in. A row that already
   * exists keeps the role it has; the name and school still follow the school's
   * records, because those are display, not permission.
   */
  async function syncProfile({ userId, teacher, schoolId }) {
    if (!userId) return { skipped: true };

    const where = `id=eq.${encodeURIComponent(userId)}`;
    const existing = await callSupabase(`/rest/v1/profiles?${where}&select=id&limit=1`);
    if (!existing.ok) return { failed: true, status: existing.status, body: existing.body };

    if (Array.isArray(existing.body) && existing.body.length > 0) {
      const { ok, status, body } = await callSupabase(`/rest/v1/profiles?${where}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ full_name: teacher.name, school_id: schoolId })
      });
      return ok ? { ok: true, roleWritten: false } : { failed: true, status, body };
    }

    const { ok, status, body } = await callSupabase('/rest/v1/profiles', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: userId,
        role: teacher.role,
        full_name: teacher.name,
        school_id: schoolId
      })
    });

    return ok ? { ok: true, roleWritten: true } : { failed: true, status, body };
  }

  router.post('/sso/school', async (req, res) => {
    if (!configured) {
      return res.status(503).json({
        error: 'sso_not_configured',
        message: 'Chưa bật đăng nhập từ website trường (SCHOOL_SSO_SECRET, SCHOOL_SSO_ISSUER, SCHOOL_DOMAIN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).'
      });
    }

    // Resolved once, so the bucket a caller is counted into and the address
    // written to the log are provably the same one. Behind the tunnel in
    // SELF-HOST.md this is only the caller's own address because index.js was
    // told how many proxies sit in front; see `trust proxy` there.
    const ip = req.ip || 'unknown';

    if (!allow(ip)) {
      log.record({ action: '/sso/school', outcome: 'denied', reason: 'rate_limited', ip });
      return res.status(429).json({ error: 'rate_limited', message: 'Thử lại sau một phút.' });
    }

    const check = verifySchoolToken(req.body?.token, {
      secret,
      issuer,
      audience,
      replayGuard,
      now: now()
    });

    if (!check.ok) {
      log.record({ action: '/sso/school', outcome: 'denied', reason: check.reason, ip });
      return res.status(401).json({ error: 'invalid_token', message: messageFor(check.reason) });
    }

    const { teacher } = check;
    /** Every line below can name who it refused, not just that it refused. */
    const who = { teacherCode: teacher.code };

    // The note is genuine. That settles who wrote it, not what it may ask for.
    if (!allowedRoles.includes(teacher.role)) {
      log.record({ action: '/sso/school', outcome: 'denied', reason: `role_not_allowed:${teacher.role}`, ...who, ip });
      return res.status(403).json({
        error: 'role_not_allowed',
        message: 'Website trường xin quyền cao hơn mức EduPortal cấp qua đăng nhập một lần. Báo quản trị viên.'
      });
    }

    // The signing secret says "a school wrote this", never "and only about its
    // own staff". Holding it must not be a way to mint a session for an address
    // outside the school at all.
    if (!teacher.email.endsWith(emailSuffix)) {
      log.record({ action: '/sso/school', outcome: 'denied', reason: 'email_domain', ...who, ip });
      return res.status(403).json({
        error: 'email_domain',
        message: `Email đăng nhập phải thuộc tên miền ${emailSuffix.slice(1)} của trường.`
      });
    }

    try {
      // Looked up before anything is created: a deployment whose school row is
      // missing should refuse, not scatter accounts that belong to no school.
      const schoolId = await findSchoolId();
      if (!schoolId) {
        log.record({ action: '/sso/school', outcome: 'denied', reason: 'school_not_found', ...who, ip });
        return res.status(503).json({
          error: 'school_not_found',
          message: `EduPortal chưa có dòng nào cho trường ${emailSuffix.slice(1)} trong bảng schools. Báo quản trị viên.`
        });
      }

      const account = await ensureAccount(teacher);
      if (account.failed) {
        log.record({ action: '/sso/school', outcome: 'error', reason: `create:${account.status}`, ...who, ip });
        return res.status(502).json({ error: 'account_failed', message: 'Không tạo được tài khoản. Báo quản trị viên.' });
      }

      if (account.created) {
        log.record({ action: '/sso/school/provision', outcome: 'allowed', reason: `role:${teacher.role}`, viewerId: account.id, ...who, ip });
      } else {
        // Someone already holds this address. Whether that is the same teacher
        // coming back or a stranger who registered it first is exactly what the
        // stored code answers, so nothing is issued until it has.
        const found = await findAccountByEmail(teacher.email);
        if (found.failed || found.missing) {
          // Supabase said the address is taken and then would not show us by
          // whom. Refuse: an unreadable binding is not a matching one.
          log.record({ action: '/sso/school', outcome: 'error', reason: 'account_unreadable', ...who, ip });
          return res.status(502).json({
            error: 'account_unreadable',
            message: 'Không đọc được tài khoản đang giữ email này. Báo quản trị viên.'
          });
        }

        const bound = checkBinding(found.user, teacher);
        if (!bound.ok) {
          log.record({ action: '/sso/school', outcome: 'denied', reason: bound.reason, viewerId: found.user.id, ...who, ip });
          return res.status(403).json({
            error: bound.reason,
            message: bound.reason === 'teacher_code_unbound'
              ? 'Email này đã có tài khoản EduPortal chưa gắn với mã giáo viên nào. Nhờ quản trị viên gắn mã rồi đăng nhập lại.'
              : 'Email này thuộc về một mã giáo viên khác. Báo quản trị viên.'
          });
        }
      }

      const session = await issueSessionHash(teacher.email);
      if (session.failed || !session.tokenHash) {
        log.record({ action: '/sso/school', outcome: 'error', reason: `link:${session.status ?? 'empty'}`, ...who, ip });
        return res.status(502).json({ error: 'session_failed', message: 'Không mở được phiên đăng nhập. Báo quản trị viên.' });
      }

      const profile = await syncProfile({
        userId: session.userId || account.id,
        teacher,
        schoolId
      });

      // A failed profile write is logged and allowed through: the account is
      // real and the session is valid, and an admin can repair a row. Refusing
      // here would lock out a teacher for a reason they cannot act on.
      if (profile.failed) {
        log.record({ action: '/sso/school', outcome: 'degraded', reason: `profile:${profile.status}`, viewerId: session.userId, ...who, ip });
      }

      log.record({
        action: '/sso/school',
        outcome: 'allowed',
        reason: account.created ? 'first_sign_in' : 'returning',
        viewerId: session.userId,
        ...who,
        ip
      });

      return res.json({ email: teacher.email, tokenHash: session.tokenHash });
    } catch (error) {
      log.record({ action: '/sso/school', outcome: 'error', reason: 'upstream', ...who, ip });
      console.error('SSO trường lỗi:', error?.message || error);
      return res.status(502).json({ error: 'upstream_failed', message: 'Không kết nối được máy chủ xác thực.' });
    }
  });

  router.get('/sso/school/status', (_req, res) => {
    res.json({ configured, issuer: configured ? issuer : null });
  });

  return router;
}

export function createSchoolSsoRouterFromEnv(env = process.env) {
  return createSchoolSsoRouter({
    secret: env.SCHOOL_SSO_SECRET || '',
    issuer: env.SCHOOL_SSO_ISSUER || '',
    schoolDomain: env.SCHOOL_DOMAIN || '',
    allowedRoles: (env.SCHOOL_SSO_ALLOWED_ROLES || 'teacher').split(',').map(role => role.trim()).filter(Boolean),
    supabaseUrl: env.SUPABASE_URL || '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    // The newest door into the school's data needs the same answer to "who
    // came through here?" that the camera wall already has — Decree 13/2023
    // does not ask only about video. A path here is a file the school can read
    // with `tail`; without one the lines exist only in this process's stdout,
    // which is to say only until it restarts.
    accessLog: createAccessLog({ filePath: env.SCHOOL_SSO_ACCESS_LOG })
  });
}
