import { describe, it, expect, vi } from 'vitest';
import { createViewerResolver, tokenFromHeader } from './viewerIdentity.js';

const config = { supabaseUrl: 'https://project.supabase.co', anonKey: 'anon-key' };

/** Supabase answering /auth/v1/user then /rest/v1/profiles. */
function supabaseReturning({ user = { id: 'user-1' }, profiles = [{ role: 'admin' }] } = {}) {
  return vi.fn(async (url) => ({
    ok: true,
    json: async () => (String(url).includes('/auth/v1/user') ? user : profiles)
  }));
}

describe('tokenFromHeader', () => {
  it('reads a bearer token, however it was cased or spaced', () => {
    expect(tokenFromHeader('Bearer abc.def')).toBe('abc.def');
    expect(tokenFromHeader('bearer   abc.def  ')).toBe('abc.def');
  });

  it('returns null for anything else', () => {
    for (const value of [null, undefined, '', 'abc.def', 'Basic abc']) {
      expect(tokenFromHeader(value)).toBeNull();
    }
  });
});

describe('createViewerResolver', () => {
  it('reports the role Supabase says the token belongs to', async () => {
    const resolver = createViewerResolver({ ...config, fetchImpl: supabaseReturning() });

    await expect(resolver.resolve('token')).resolves.toEqual({ id: 'user-1', role: 'admin' });
  });

  it('sends the caller\'s own token, never a service key', async () => {
    const fetchImpl = supabaseReturning();
    await createViewerResolver({ ...config, fetchImpl }).resolve('caller-token');

    for (const [, init] of fetchImpl.mock.calls) {
      expect(init.headers.Authorization).toBe('Bearer caller-token');
    }
  });

  it('refuses a token Supabase rejects', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, json: async () => ({}) }));

    await expect(createViewerResolver({ ...config, fetchImpl }).resolve('token')).resolves.toBeNull();
  });

  it('refuses a profile with no role rather than guessing one', async () => {
    const fetchImpl = supabaseReturning({ profiles: [{}] });

    await expect(createViewerResolver({ ...config, fetchImpl }).resolve('token')).resolves.toBeNull();
  });

  it('refuses when Supabase cannot be reached — nobody watches, rather than everybody', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('ENOTFOUND'); });

    await expect(createViewerResolver({ ...config, fetchImpl }).resolve('token')).resolves.toBeNull();
  });

  it('refuses everything when Supabase was never configured', async () => {
    const resolver = createViewerResolver({ fetchImpl: supabaseReturning() });

    expect(resolver.isConfigured).toBe(false);
    await expect(resolver.resolve('token')).resolves.toBeNull();
  });

  it('does not ask Supabase again for the same token within the cache window', async () => {
    const fetchImpl = supabaseReturning();
    const resolver = createViewerResolver({ ...config, fetchImpl, cacheTtlMs: 60_000 });

    await resolver.resolve('token');
    await resolver.resolve('token');

    expect(fetchImpl).toHaveBeenCalledTimes(2); // one round trip, two requests
  });

  it('asks again once the cache window passes', async () => {
    const fetchImpl = supabaseReturning();
    let clock = 0;
    const resolver = createViewerResolver({ ...config, fetchImpl, cacheTtlMs: 1_000, now: () => clock });

    await resolver.resolve('token');
    clock = 5_000;
    await resolver.resolve('token');

    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });
});
