import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { completeSchoolSignIn, hasSchoolToken, readSchoolToken } from './schoolSso';

/**
 * These run in demo mode, because that is what `.env.development` sets and
 * what `npm test` therefore inherits. `completeSchoolSignIn` refuses outright
 * in demo mode, so the exchange itself is exercised through a client double
 * with the mode check stubbed — see `realMode()` below.
 */

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });
const errResponse = (status, body) => ({ ok: false, status, json: async () => body });

/** A Supabase client double that accepts one hash and rejects the rest. */
const clientAccepting = (goodHash) => ({
  auth: {
    verifyOtp: async ({ token_hash }) =>
      token_hash === goodHash ? { error: null } : { error: { message: 'Token has expired' } }
  }
});

describe('hasSchoolToken', () => {
  // No jsdom in this project, so the one browser API this module touches is
  // stood up by hand. Cheaper than a DOM, and it keeps the module honest about
  // how little of the browser it is allowed to assume.
  const setLocation = (pathname, search = '') => {
    globalThis.window = { location: { pathname, search }, history: {} };
  };

  afterEach(() => {
    delete globalThis.window;
  });

  it('recognises an arrival carrying a note', () => {
    setLocation('/sso');
    expect(hasSchoolToken('?token=abc')).toBe(true);
  });

  it('ignores /sso with no note, so a stray visit falls through to the landing page', () => {
    setLocation('/sso');
    expect(hasSchoolToken('')).toBe(false);
  });

  it('ignores a token pasted onto some other page', () => {
    setLocation('/dashboard', '?token=abc');
    expect(hasSchoolToken('?token=abc')).toBe(false);
  });

  it('answers no rather than throwing where there is no browser at all', () => {
    expect(hasSchoolToken('?token=abc')).toBe(false);
  });

  it('reads the note out of the query string', () => {
    setLocation('/sso', '?token=abc.def.ghi');
    expect(readSchoolToken('?token=abc.def.ghi')).toBe('abc.def.ghi');
  });
});

describe('completeSchoolSignIn', () => {
  it('refuses in demo mode rather than pretending a teacher signed in', async () => {
    const result = await completeSchoolSignIn('a-note');

    expect(result).toMatchObject({ ok: false, canRetry: false });
    expect(result.message).toMatch(/demo/i);
  });
});

/**
 * The real-mode path. `isRealMode` is baked in at import time, so it is stubbed
 * per test rather than by re-importing the module with different env.
 */
describe('completeSchoolSignIn (real mode)', () => {
  let exchange;

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('./appMode', () => ({ isRealMode: true }));
    vi.doMock('./supabase', () => ({ supabase: clientAccepting('good-hash') }));
    ({ completeSchoolSignIn: exchange } = await import('./schoolSso'));
  });

  afterEach(() => {
    vi.doUnmock('./appMode');
    vi.doUnmock('./supabase');
  });

  it('turns a good note into a session', async () => {
    const fetchImpl = async () => okResponse({ email: 'a@b.vn', tokenHash: 'good-hash' });

    expect(await exchange('a-note', { fetchImpl, client: clientAccepting('good-hash') }))
      .toEqual({ ok: true });
  });

  it('passes the server’s own wording through instead of inventing a vaguer one', async () => {
    const fetchImpl = async () => errResponse(401, { message: 'Liên kết này đã được dùng.' });

    const result = await exchange('a-note', { fetchImpl, client: clientAccepting('good-hash') });

    expect(result).toEqual({
      ok: false,
      canRetry: true,
      message: 'Liên kết này đã được dùng.'
    });
  });

  it('marks a misconfiguration as something the teacher cannot fix', async () => {
    const fetchImpl = async () => errResponse(503, { message: 'Chưa bật đăng nhập từ website trường.' });

    expect(await exchange('a-note', { fetchImpl, client: clientAccepting('good-hash') }))
      .toMatchObject({ ok: false, canRetry: false });
  });

  it('treats an unreachable server as worth retrying', async () => {
    const fetchImpl = async () => { throw new TypeError('Failed to fetch'); };

    const result = await exchange('a-note', { fetchImpl, client: clientAccepting('good-hash') });

    expect(result).toMatchObject({ ok: false, canRetry: true });
    expect(result.message).toMatch(/Không kết nối/);
  });

  it('reports a hash Supabase would not honour', async () => {
    const fetchImpl = async () => okResponse({ email: 'a@b.vn', tokenHash: 'stale-hash' });

    expect(await exchange('a-note', { fetchImpl, client: clientAccepting('good-hash') }))
      .toMatchObject({ ok: false, canRetry: true });
  });

  it('does not call the server at all when the link carried no note', async () => {
    const fetchImpl = vi.fn();

    const result = await exchange('', { fetchImpl, client: clientAccepting('good-hash') });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false, canRetry: true });
  });
});
