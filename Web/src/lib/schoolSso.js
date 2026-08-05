/**
 * The receiving end of the walk over from the school's website.
 *
 * A teacher signs in there, the school signs a short-lived note, and the
 * browser arrives here carrying it in the query string. This module turns that
 * note into a real Supabase session and then gets rid of it.
 *
 * Split out of the screen that shows it so the awkward parts — a note that
 * expired, a note already spent, a server that is not configured — can be
 * tested without rendering anything.
 */

import { supabase } from './supabase';
import { isRealMode } from './appMode';

/** The query parameter the school's redirect appends. */
export const TOKEN_PARAM = 'token';

const SERVER_URL = (import.meta.env.VITE_SERVER_URL || '').replace(/\/$/, '');

/**
 * True when this page load is an arrival from the school's website.
 *
 * Read from the URL rather than from a router, because this app has no
 * router — App.jsx decides what to render from state, so the arrival has to
 * announce itself before any of that runs.
 */
export function hasSchoolToken(search) {
  // Guarded rather than assumed: this module is imported by App.jsx, so a
  // build step or a test runner without a DOM would otherwise fail at import
  // time instead of simply answering "no, this is not an SSO arrival".
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(search ?? window.location.search);
  const path = window.location.pathname;

  return (path === '/sso' || path === '/sso/') && Boolean(params.get(TOKEN_PARAM));
}

export function readSchoolToken(search) {
  if (search === undefined && typeof window === 'undefined') return '';
  return new URLSearchParams(search ?? window.location.search).get(TOKEN_PARAM) || '';
}

/**
 * Takes the note out of the address bar.
 *
 * It has already been spent by the time this runs, so what is left is litter
 * rather than a key — but litter that sits in browser history, in the referrer
 * header of the next request, and in any screenshot of the address bar. A
 * teacher on a shared staffroom computer should not leave it there.
 */
export function scrubUrl() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Exchanges the school's note for a Supabase session.
 *
 * @returns {Promise<{ ok: true } | { ok: false, message: string, canRetry: boolean }>}
 *   `canRetry` distinguishes "go back and click again" — an expired or spent
 *   note, which the teacher can fix themselves — from a misconfiguration,
 *   which they cannot.
 */
export async function completeSchoolSignIn(token, { fetchImpl = fetch, client = supabase } = {}) {
  if (!isRealMode) {
    return {
      ok: false,
      canRetry: false,
      message: 'Bản demo không nhận đăng nhập từ website trường.'
    };
  }

  if (!token) {
    return { ok: false, canRetry: true, message: 'Liên kết thiếu mã đăng nhập.' };
  }

  let response;
  try {
    response = await fetchImpl(`${SERVER_URL}/api/sso/school`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
  } catch {
    return {
      ok: false,
      canRetry: true,
      message: 'Không kết nối được máy chủ EduPortal. Kiểm tra mạng rồi thử lại.'
    };
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    // The server already phrased this for the person reading it, and it knows
    // things this side does not — whether the signature was wrong, whether the
    // note was spent. Passing its sentence through beats inventing a vaguer one.
    return {
      ok: false,
      canRetry: response.status === 401 || response.status === 429,
      message: body?.message || 'Không đăng nhập được từ website trường.'
    };
  }

  const tokenHash = body?.tokenHash;
  if (!tokenHash) {
    return { ok: false, canRetry: false, message: 'Máy chủ không trả về phiên đăng nhập.' };
  }

  // Supabase, not this app, decides whether the hash is good. What comes back
  // is a session written into storage by the client library, which the auth
  // listener in AuthContext picks up on its own.
  const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });

  if (error) {
    return {
      ok: false,
      canRetry: true,
      message: 'Phiên đăng nhập đã hết hạn. Quay lại website trường và bấm lại.'
    };
  }

  return { ok: true };
}
