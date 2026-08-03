/**
 * Who is asking, according to Supabase — not according to the browser.
 *
 * The web app knows perfectly well which role it is showing, but a request
 * that says "I am the head teacher" is just a string somebody typed. So the
 * access token that comes with the request is checked against Supabase, and
 * the role is read from the `profiles` row that token can reach. A stolen tab,
 * a curl command and a modified bundle all fail the same way.
 *
 * Both calls use the caller's own token, so this process never holds a service
 * key: the worst it can do on the school's behalf is read the row the caller
 * could already read.
 */

/** How long a verified identity is trusted before asking Supabase again. */
const CACHE_TTL_MS = 60_000;

const BEARER = /^Bearer\s+(.+)$/i;

export function tokenFromHeader(headerValue) {
  const match = BEARER.exec(String(headerValue || '').trim());
  return match ? match[1].trim() : null;
}

export function createViewerResolver({
  supabaseUrl,
  anonKey,
  fetchImpl = globalThis.fetch,
  cacheTtlMs = CACHE_TTL_MS,
  now = () => Date.now()
} = {}) {
  const cache = new Map();

  const isConfigured = Boolean(supabaseUrl && anonKey);

  async function ask(path, token) {
    const response = await fetchImpl(`${supabaseUrl.replace(/\/$/, '')}${path}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    if (!response.ok) return null;
    return response.json();
  }

  /**
   * @returns {Promise<{ id: string, role: string } | null>} null when the token
   *   is missing, expired, rejected, or belongs to a profile with no role.
   */
  async function resolve(token) {
    if (!isConfigured) return null;
    if (!token) return null;

    const cached = cache.get(token);
    if (cached && cached.expiresAt > now()) return cached.viewer;

    try {
      const user = await ask('/auth/v1/user', token);
      if (!user?.id) return null;

      const rows = await ask(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, token);
      const role = Array.isArray(rows) ? rows[0]?.role : null;
      if (!role) return null;

      const viewer = { id: user.id, role };
      cache.set(token, { viewer, expiresAt: now() + cacheTtlMs });
      return viewer;
    } catch {
      // A relay that cannot reach Supabase refuses rather than falls back to
      // trusting the caller: the failure mode of a camera system has to be
      // "nobody watches", not "everybody does".
      return null;
    }
  }

  return { resolve, isConfigured };
}
