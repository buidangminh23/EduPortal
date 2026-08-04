import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import { createHmac } from 'node:crypto';
import { createSchoolSsoRouter } from './sso.js';
import { verifySchoolToken, createReplayGuard } from '../lib/schoolToken.js';

const SECRET = 'a-secret-the-school-and-this-server-share';
const ISSUER = 'c3phucthinh.edu.vn';

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

/** Stands in for the school's PHP: signs the same shape Laravel would send. */
function schoolNote(claims = {}, { secret = SECRET, header = { alg: 'HS256', typ: 'JWT' } } = {}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER,
    aud: 'eduportal',
    sub: 'GV001',
    email: 'a.nv@c3phucthinh.edu.vn',
    name: 'Nguyễn Văn A',
    role: 'teacher',
    iat: nowSeconds,
    exp: nowSeconds + 60,
    jti: `note-${Math.random().toString(36).slice(2)}`,
    ...claims
  };

  const head = b64(header);
  const body = b64(payload);
  const signature = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${signature}`;
}

/** Records what the route asked Supabase for, and answers as Supabase would. */
function createSupabaseDouble({ userExists = false } = {}) {
  const calls = [];
  let exists = userExists;

  const fetchImpl = async (url, init = {}) => {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    calls.push({ path, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null });

    const reply = (status, body) => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body)
    });

    if (path === '/auth/v1/admin/users' && init.method === 'POST') {
      if (exists) return reply(422, { error_code: 'email_exists', msg: 'Email already registered' });
      exists = true;
      return reply(200, { id: 'user-uuid-1' });
    }

    if (path === '/auth/v1/admin/generate_link') {
      return reply(200, {
        user: { id: 'user-uuid-1' },
        properties: { hashed_token: 'one-time-hash' }
      });
    }

    if (path.startsWith('/rest/v1/schools')) {
      return reply(200, [{ id: 'school-uuid-1' }]);
    }

    if (path.startsWith('/rest/v1/profiles')) {
      return reply(201, null);
    }

    return reply(404, {});
  };

  return { fetchImpl, calls };
}

let server;
let baseUrl;
let supabase;
let recorded;

function mount(overrides = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api', createSchoolSsoRouter({
    secret: SECRET,
    issuer: ISSUER,
    schoolDomain: 'c3phucthinh.edu.vn',
    supabaseUrl: 'https://project.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: supabase.fetchImpl,
    accessLog: { record: entry => recorded.push(entry) },
    ...overrides
  }));
  return app;
}

const post = (token, url = baseUrl) => fetch(`${url}/api/sso/school`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
});

beforeEach(() => {
  supabase = createSupabaseDouble();
  recorded = [];
});

describe('POST /api/sso/school', () => {
  beforeAll(() => {});
  afterAll(() => new Promise(resolve => (server ? server.close(resolve) : resolve())));

  const start = (app) => new Promise(resolve => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  const stop = () => new Promise(resolve => (server ? server.close(resolve) : resolve()));

  it('lets a teacher the school vouched for through, and hands back a one-time hash', async () => {
    await start(mount());
    const response = await post(schoolNote());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ email: 'a.nv@c3phucthinh.edu.vn', tokenHash: 'one-time-hash' });
    await stop();
  });

  it('never sends the service key to the browser', async () => {
    await start(mount());
    const body = await (await post(schoolNote())).text();

    expect(body).not.toContain('service-role-key');
    await stop();
  });

  it('writes the role into profiles, where row-level security can read it', async () => {
    await start(mount());
    await post(schoolNote({ role: 'admin' }));

    const write = supabase.calls.find(c => c.path.startsWith('/rest/v1/profiles'));
    expect(write.body).toMatchObject({
      id: 'user-uuid-1',
      role: 'admin',
      school_id: 'school-uuid-1'
    });
    await stop();
  });

  it('treats a second sign-in as normal rather than a failed account creation', async () => {
    supabase = createSupabaseDouble({ userExists: true });
    await start(mount());

    const response = await post(schoolNote());

    expect(response.status).toBe(200);
    expect(recorded.at(-1)).toMatchObject({ outcome: 'allowed', reason: 'returning' });
    await stop();
  });

  it('refuses a note signed with a secret the school does not hold', async () => {
    await start(mount());
    const response = await post(schoolNote({}, { secret: 'someone-elses-secret' }));

    expect(response.status).toBe(401);
    expect(recorded.at(-1)).toMatchObject({ outcome: 'denied', reason: 'signature' });
    await stop();
  });

  it('refuses the same note twice', async () => {
    await start(mount());
    const note = schoolNote();

    const first = await post(note);
    const second = await post(note);

    expect(first.status).toBe(200);
    expect(second.status).toBe(401);
    expect(recorded.at(-1)).toMatchObject({ reason: 'replayed' });
    await stop();
  });

  it('tells a teacher with a stale link to go back and click again', async () => {
    await start(mount());
    const stale = Math.floor(Date.now() / 1000) - 3600;
    const response = await post(schoolNote({ iat: stale, exp: stale + 60 }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toMatch(/hết hạn/);
    await stop();
  });

  it('says it is unconfigured rather than pretending to work', async () => {
    await start(mount({ secret: '' }));
    const response = await post(schoolNote());

    expect(response.status).toBe(503);
    await stop();
  });

  it('stops a caller retrying forged notes in a loop', async () => {
    await start(mount({ rateLimit: { max: 3, windowMs: 60_000 } }));

    const codes = [];
    for (let i = 0; i < 5; i += 1) {
      codes.push((await post(schoolNote({}, { secret: 'wrong' }))).status);
    }

    expect(codes).toEqual([401, 401, 401, 429, 429]);
    await stop();
  });
});

describe('verifySchoolToken', () => {
  const base = { secret: SECRET, issuer: ISSUER };

  it('refuses a note that names its own algorithm as none', () => {
    // The classic forgery: strip the signature and claim none was needed.
    const header = b64({ alg: 'none', typ: 'JWT' });
    const payload = b64({ iss: ISSUER, aud: 'eduportal', sub: 'GV001', email: 'x@y.vn', role: 'teacher' });

    expect(verifySchoolToken(`${header}.${payload}.`, base)).toEqual({ ok: false, reason: 'algorithm' });
  });

  it('refuses a note minted for a different service', () => {
    expect(verifySchoolToken(schoolNote({ aud: 'another-app' }), base)).toEqual({ ok: false, reason: 'audience' });
  });

  it('refuses a note from an issuer this deployment does not know', () => {
    expect(verifySchoolToken(schoolNote({ iss: 'someone-else.edu.vn' }), base)).toEqual({ ok: false, reason: 'issuer' });
  });

  it('refuses a lifetime the school set longer than this side honours', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const yearLong = schoolNote({ iat: nowSeconds - 86_400, exp: nowSeconds + 31_536_000 });

    expect(verifySchoolToken(yearLong, base)).toEqual({ ok: false, reason: 'expired' });
  });

  it('refuses a role nobody agreed on instead of guessing a safe one', () => {
    expect(verifySchoolToken(schoolNote({ role: 'principal' }), base)).toEqual({ ok: false, reason: 'role' });
  });

  it('refuses a body edited after signing', () => {
    const [head, , signature] = schoolNote().split('.');
    const swapped = b64({ iss: ISSUER, aud: 'eduportal', sub: 'GV999', email: 'boss@x.vn', role: 'admin' });

    expect(verifySchoolToken(`${head}.${swapped}.${signature}`, base)).toEqual({ ok: false, reason: 'signature' });
  });

  it('does not burn a note id when the signature was already wrong', () => {
    const guard = createReplayGuard();
    const note = schoolNote();

    verifySchoolToken(note, { ...base, secret: 'wrong-secret', replayGuard: guard });
    const second = verifySchoolToken(note, { ...base, replayGuard: guard });

    expect(second.ok).toBe(true);
  });

  it('reports missing configuration rather than accepting anything', () => {
    expect(verifySchoolToken(schoolNote(), { ...base, secret: '' })).toEqual({ ok: false, reason: 'not_configured' });
  });
});
