/**
 * The note the school's website hands a teacher on their way over here.
 *
 * The school already knows who its teachers are — it has been checking their
 * passwords for years. Rebuilding that list here would mean two lists that
 * drift apart, and a teacher who leaves in March still holding a key in June.
 * So the school signs a short note saying "this is teacher GV001", and this
 * module decides whether to believe it.
 *
 * The note is a plain HS256 JWT, because the school's side is PHP and every
 * PHP shop can already produce one. Nothing here is Supabase-specific: this
 * file only answers "did the school really write this, and is it still valid".
 *
 * What makes the note safe to accept is not that it is hard to read — it is
 * signed, not encrypted, and anyone can read it — but that it is hard to
 * forge, expires in a minute, and cannot be used twice.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/** A note is meant to be walked across a redirect, not saved for later. */
export const DEFAULT_MAX_AGE_SECONDS = 60;

/**
 * Clocks on two machines are never identical. A minute of slack accepts a
 * school server that runs slightly fast without accepting a note minted
 * yesterday.
 */
const CLOCK_SKEW_SECONDS = 60;

/** How long a spent note is remembered, so it cannot be replayed. */
const REPLAY_MEMORY_MS = 10 * 60_000;

const decodeSegment = (segment) => {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

/**
 * Remembers the id of every note already spent.
 *
 * Kept in memory on purpose: notes live 60 seconds, so this never needs to
 * outlive the process. Two server instances behind a load balancer would each
 * keep their own set — a note could then be spent once per instance. If this
 * ever runs on more than one instance, move the set to Redis rather than
 * hoping nobody notices.
 */
export function createReplayGuard({ memoryMs = REPLAY_MEMORY_MS, now = () => Date.now() } = {}) {
  const seen = new Map();

  const forget = () => {
    const cutoff = now();
    for (const [id, expiresAt] of seen) {
      if (expiresAt <= cutoff) seen.delete(id);
    }
  };

  return {
    /** @returns {boolean} true the first time an id is offered, false after. */
    claim(id) {
      forget();
      if (seen.has(id)) return false;
      seen.set(id, now() + memoryMs);
      return true;
    },
    get size() {
      forget();
      return seen.size;
    }
  };
}

/**
 * @returns {{ ok: true, teacher: { code: string, email: string, name: string, role: string } }
 *          | { ok: false, reason: string }}
 */
export function verifySchoolToken(token, {
  secret,
  issuer,
  audience = 'eduportal',
  allowedRoles = ['teacher', 'admin'],
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS,
  replayGuard,
  now = Date.now()
} = {}) {
  if (!secret) return { ok: false, reason: 'not_configured' };
  if (typeof token !== 'string' || token.length > 4096) return { ok: false, reason: 'malformed' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };

  const [headerPart, payloadPart, signature] = parts;
  const header = decodeSegment(headerPart);

  // The algorithm is dictated here, never read from the token. A token is
  // input from a stranger; letting it name its own algorithm is how "alg":
  // "none" gets accepted, and how an HMAC secret gets used as an RSA public
  // key. The school was told to send HS256, so only HS256 is verified.
  if (header?.alg !== 'HS256') return { ok: false, reason: 'algorithm' };

  const expected = createHmac('sha256', secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest('base64url');

  // Byte-by-byte in constant time: a comparison that returns early on the
  // first wrong character leaks how much of a forgery was right, one request
  // at a time.
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return { ok: false, reason: 'signature' };
  }

  const claims = decodeSegment(payloadPart);
  if (!claims) return { ok: false, reason: 'malformed' };

  // Who vouched, and who they vouched to. Without the audience check, a note
  // the school mints for some other service would open a session here too.
  if (issuer && claims.iss !== issuer) return { ok: false, reason: 'issuer' };
  if (audience && claims.aud !== audience) return { ok: false, reason: 'audience' };

  const nowSeconds = Math.floor(now / 1000);

  const exp = Number(claims.exp);
  if (!Number.isFinite(exp)) return { ok: false, reason: 'malformed' };
  if (exp < nowSeconds - CLOCK_SKEW_SECONDS) return { ok: false, reason: 'expired' };

  // An expiry the school set generously — a year out, say — would turn a note
  // into a permanent key. The lifetime this side is willing to honour is
  // decided this side.
  const iat = Number(claims.iat);
  if (!Number.isFinite(iat)) return { ok: false, reason: 'malformed' };
  if (iat > nowSeconds + CLOCK_SKEW_SECONDS) return { ok: false, reason: 'not_yet_valid' };
  if (nowSeconds - iat > maxAgeSeconds + CLOCK_SKEW_SECONDS) return { ok: false, reason: 'expired' };

  const code = typeof claims.sub === 'string' ? claims.sub.trim() : '';
  const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
  const name = typeof claims.name === 'string' ? claims.name.trim() : '';
  const role = typeof claims.role === 'string' ? claims.role.trim() : '';

  if (!code) return { ok: false, reason: 'missing_subject' };
  if (!email || !email.includes('@')) return { ok: false, reason: 'missing_email' };

  // An unrecognised role is refused rather than quietly downgraded to the
  // least privilege. A school that starts sending 'principal' should get a
  // clear failure and a conversation, not a head teacher who silently sees a
  // teacher's screen.
  if (!allowedRoles.includes(role)) return { ok: false, reason: 'role' };

  // Single use. Checked last, so a malformed or forged note never burns a
  // legitimate id, and so the cost of remembering is only paid for notes that
  // were going to be accepted anyway.
  const jti = typeof claims.jti === 'string' ? claims.jti : '';
  if (replayGuard) {
    if (!jti) return { ok: false, reason: 'missing_jti' };
    if (!replayGuard.claim(jti)) return { ok: false, reason: 'replayed' };
  }

  return { ok: true, teacher: { code, email, name: name || email, role } };
}

/** What the person in front of the screen is told. Reasons stay in the log. */
export const REFUSAL_MESSAGE = {
  not_configured: 'Chưa cấu hình liên kết với website trường. Báo quản trị viên.',
  expired: 'Liên kết đăng nhập đã hết hạn. Quay lại website trường và bấm lại.',
  replayed: 'Liên kết này đã được dùng. Quay lại website trường và bấm lại.',
  role: 'Tài khoản này chưa được cấp quyền vào EduPortal.'
};

export function messageFor(reason) {
  // Everything else — bad signature, wrong issuer, malformed — gets one
  // sentence. Telling a forger which part of the forgery failed is telling
  // them what to fix.
  return REFUSAL_MESSAGE[reason] || 'Liên kết đăng nhập không hợp lệ.';
}
