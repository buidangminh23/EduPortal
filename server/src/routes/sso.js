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
 * Two things this route deliberately does not do:
 *
 *   - It never sends the service key to the browser. The browser receives a
 *     single-use hash tied to one email; the key stays in this process.
 *   - It never trusts the note for anything beyond identity. Roles land in
 *     `profiles`, and what a role may read is still decided by row-level
 *     security in Postgres, not by this file.
 */

import { Router } from 'express';
import { verifySchoolToken, createReplayGuard, messageFor } from '../lib/schoolToken.js';
import { createAccessLog } from '../lib/accessLog.js';

/** Enough for a teacher who fumbles the link; far short of guessing a signature. */
const DEFAULT_RATE_LIMIT = { max: 20, windowMs: 60_000 };

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

  const configured = Boolean(secret && supabaseUrl && serviceRoleKey);
  const base = supabaseUrl.replace(/\/$/, '');

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
    if (!schoolDomain) return null;
    const query = `/rest/v1/schools?domain=eq.${encodeURIComponent(schoolDomain)}&select=id&limit=1`;
    const { ok, body } = await callSupabase(query);
    return ok && Array.isArray(body) && body[0]?.id ? body[0].id : null;
  }

  /**
   * Creates the account on first arrival; says nothing on later ones.
   *
   * `email_confirm` is set because the school already confirmed this address
   * when it hired the person — sending a confirmation mail to a teacher who
   * just typed their password on the school's own site would be asking them to
   * prove something twice.
   */
  async function ensureAccount(teacher) {
    const { ok, status, body } = await callSupabase('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: teacher.email,
        email_confirm: true,
        user_metadata: { full_name: teacher.name, teacher_code: teacher.code }
      })
    });

    if (ok) return { created: true, id: body?.id || null };

    // 422 with an "already registered" code is the expected path for every
    // sign-in after the first, not an error worth failing on.
    const alreadyThere =
      status === 422 &&
      /already|exist|registered/i.test(`${body?.error_code || ''} ${body?.msg || body?.message || ''}`);

    if (alreadyThere) return { created: false, id: null };

    return { failed: true, status, body };
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
   * Writes the role down where row-level security can see it.
   *
   * The note said "admin", but nothing in Postgres has read that note. Until
   * this row exists the account can sign in and see nothing at all, which is
   * the right way round: an account with no profile is harmless.
   */
  async function syncProfile({ userId, teacher, schoolId }) {
    if (!userId) return { skipped: true };

    const row = {
      id: userId,
      role: teacher.role,
      full_name: teacher.name,
      ...(schoolId ? { school_id: schoolId } : {})
    };

    const { ok, status, body } = await callSupabase('/rest/v1/profiles', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row)
    });

    return ok ? { ok: true } : { failed: true, status, body };
  }

  router.post('/sso/school', async (req, res) => {
    if (!configured) {
      return res.status(503).json({
        error: 'sso_not_configured',
        message: 'Chưa bật đăng nhập từ website trường (SCHOOL_SSO_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).'
      });
    }

    if (!allow(req.ip || 'unknown')) {
      log.record({ action: '/sso/school', outcome: 'denied', reason: 'rate_limited', ip: req.ip });
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
      log.record({ action: '/sso/school', outcome: 'denied', reason: check.reason, ip: req.ip });
      return res.status(401).json({ error: 'invalid_token', message: messageFor(check.reason) });
    }

    const { teacher } = check;

    try {
      const account = await ensureAccount(teacher);
      if (account.failed) {
        log.record({ action: '/sso/school', outcome: 'error', reason: `create:${account.status}`, ip: req.ip });
        return res.status(502).json({ error: 'account_failed', message: 'Không tạo được tài khoản. Báo quản trị viên.' });
      }

      const session = await issueSessionHash(teacher.email);
      if (session.failed || !session.tokenHash) {
        log.record({ action: '/sso/school', outcome: 'error', reason: `link:${session.status ?? 'empty'}`, ip: req.ip });
        return res.status(502).json({ error: 'session_failed', message: 'Không mở được phiên đăng nhập. Báo quản trị viên.' });
      }

      const schoolId = await findSchoolId();
      const profile = await syncProfile({
        userId: session.userId || account.id,
        teacher,
        schoolId
      });

      // A failed profile write is logged and allowed through: the account is
      // real and the session is valid, and an admin can repair a row. Refusing
      // here would lock out a teacher for a reason they cannot act on.
      if (profile.failed) {
        log.record({ action: '/sso/school', outcome: 'degraded', reason: `profile:${profile.status}`, viewerId: session.userId, ip: req.ip });
      }

      log.record({
        action: '/sso/school',
        outcome: 'allowed',
        reason: account.created ? 'first_sign_in' : 'returning',
        viewerId: session.userId,
        ip: req.ip
      });

      return res.json({ email: teacher.email, tokenHash: session.tokenHash });
    } catch (error) {
      log.record({ action: '/sso/school', outcome: 'error', reason: 'upstream', ip: req.ip });
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
    supabaseUrl: env.SUPABASE_URL || '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || ''
  });
}
