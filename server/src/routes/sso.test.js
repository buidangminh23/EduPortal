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

/**
 * Records what the route asked Supabase for, and answers as Supabase would.
 *
 * `account` stands in for a row in `auth.users` that already holds the address
 * — the ordinary returning teacher when it carries their code, and the
 * squatter who signed up through the public anon key when it does not.
 * `profile` stands in for the `profiles` row, so a role already set inside
 * EduPortal can be watched for changes.
 */
function createSupabaseDouble({ account = null, profile = null, school = { id: 'school-uuid-1' } } = {}) {
  const calls = [];
  let user = account;
  let profileRow = profile;

  const fetchImpl = async (url, init = {}) => {
    const [rawPath] = url.replace(/^https?:\/\/[^/]+/, '').split('#');
    const path = rawPath;
    calls.push({ path, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null });

    const reply = (status, body) => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body)
    });

    if (path === '/auth/v1/admin/users' && init.method === 'POST') {
      if (user) return reply(422, { error_code: 'email_exists', msg: 'Email already registered' });
      const sent = JSON.parse(init.body);
      user = {
        id: 'user-uuid-1',
        email: sent.email,
        app_metadata: sent.app_metadata || {},
        user_metadata: sent.user_metadata || {}
      };
      return reply(200, { id: user.id });
    }

    // GoTrue's admin listing: `filter` is a partial match on the address.
    if (path.startsWith('/auth/v1/admin/users?')) {
      const filter = new URLSearchParams(path.split('?')[1]).get('filter') || '';
      const users = user && user.email.includes(filter) ? [user] : [];
      return reply(200, { users });
    }

    if (path === '/auth/v1/admin/generate_link') {
      return reply(200, {
        user: { id: user?.id || 'user-uuid-1' },
        properties: { hashed_token: 'one-time-hash' }
      });
    }

    if (path.startsWith('/rest/v1/schools')) {
      return reply(200, school ? [school] : []);
    }

    if (path.startsWith('/rest/v1/profiles')) {
      if (init.method === 'POST') {
        profileRow = JSON.parse(init.body);
        return reply(201, null);
      }
      if (init.method === 'PATCH') {
        profileRow = { ...profileRow, ...JSON.parse(init.body) };
        return reply(204, null);
      }
      return reply(200, profileRow ? [{ id: profileRow.id }] : []);
    }

    return reply(404, {});
  };

  return { fetchImpl, calls, profileNow: () => profileRow };
}

/** An account already registered under the teacher's address. */
const accountHolding = (appMetadata) => ({
  id: 'user-uuid-1',
  email: 'a.nv@c3phucthinh.edu.vn',
  app_metadata: appMetadata,
  user_metadata: {}
});

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

  it('writes the role into profiles when it provisions the account', async () => {
    await start(mount());
    await post(schoolNote());

    const write = supabase.calls.find(c => c.path.startsWith('/rest/v1/profiles') && c.method === 'POST');
    expect(write.body).toMatchObject({
      id: 'user-uuid-1',
      role: 'teacher',
      school_id: 'school-uuid-1'
    });
    await stop();
  });

  it("binds the account to the school's teacher code where the user cannot edit it", async () => {
    await start(mount());
    await post(schoolNote());

    const create = supabase.calls.find(c => c.path === '/auth/v1/admin/users' && c.method === 'POST');
    expect(create.body.app_metadata).toEqual({ teacher_code: 'GV001' });
    // user_metadata is what `auth.updateUser()` writes, so a code kept there
    // would be a binding the account holder could rewrite at will.
    expect(create.body.user_metadata).not.toHaveProperty('teacher_code');
    await stop();
  });

  it('treats a second sign-in as normal rather than a failed account creation', async () => {
    supabase = createSupabaseDouble({
      account: accountHolding({ teacher_code: 'GV001' }),
      profile: { id: 'user-uuid-1', role: 'teacher' }
    });
    await start(mount());

    const response = await post(schoolNote());

    expect(response.status).toBe(200);
    expect(recorded.at(-1)).toMatchObject({ outcome: 'allowed', reason: 'returning' });
    await stop();
  });

  it('leaves the role of an account that already exists alone', async () => {
    // The school demoted this head teacher inside EduPortal. Their next login
    // must not hand the role back, whatever the school's website still thinks.
    supabase = createSupabaseDouble({
      account: accountHolding({ teacher_code: 'GV001' }),
      profile: { id: 'user-uuid-1', role: 'admin', full_name: 'Cũ' }
    });
    await start(mount());

    const response = await post(schoolNote({ role: 'teacher' }));

    expect(response.status).toBe(200);
    expect(supabase.profileNow().role).toBe('admin');
    expect(supabase.profileNow().full_name).toBe('Nguyễn Văn A');
    expect(supabase.calls.some(c => c.path.startsWith('/rest/v1/profiles') && c.body && 'role' in c.body)).toBe(false);
    await stop();
  });

  it('refuses a note asking for a role above the ceiling this deployment grants', async () => {
    await start(mount());
    const response = await post(schoolNote({ role: 'admin' }));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe('role_not_allowed');
    expect(recorded.at(-1)).toMatchObject({ outcome: 'denied', reason: 'role_not_allowed:admin' });
    // Refused before anything was created: no account, no session, no profile.
    expect(supabase.calls).toEqual([]);
    await stop();
  });

  it('lets a deployment widen the ceiling on purpose', async () => {
    await start(mount({ allowedRoles: ['teacher', 'admin'] }));
    const response = await post(schoolNote({ role: 'admin' }));

    expect(response.status).toBe(200);
    await stop();
  });

  it('refuses an email outside the school domain', async () => {
    await start(mount());
    const response = await post(schoolNote({ email: 'a.nv@gmail.com' }));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe('email_domain');
    expect(recorded.at(-1)).toMatchObject({ outcome: 'denied', reason: 'email_domain' });
    expect(supabase.calls).toEqual([]);
    await stop();
  });

  it('refuses an account that holds the address but carries no teacher code', async () => {
    // The attack the review found: register the head teacher's address through
    // the public anon key, wait, and collect their session and their role.
    supabase = createSupabaseDouble({ account: accountHolding({}) });
    await start(mount());

    const response = await post(schoolNote());

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe('teacher_code_unbound');
    expect(recorded.at(-1)).toMatchObject({ outcome: 'denied', reason: 'teacher_code_unbound' });
    expect(supabase.calls.some(c => c.path === '/auth/v1/admin/generate_link')).toBe(false);
    await stop();
  });

  it('refuses an account bound to a different teacher code', async () => {
    supabase = createSupabaseDouble({ account: accountHolding({ teacher_code: 'GV999' }) });
    await start(mount());

    const response = await post(schoolNote());

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe('teacher_code_mismatch');
    expect(supabase.calls.some(c => c.path === '/auth/v1/admin/generate_link')).toBe(false);
    await stop();
  });

  it('refuses rather than pretending a code sits in user_metadata counts', async () => {
    // Exactly where the old version wrote it, and exactly where the account
    // holder can write it themselves.
    supabase = createSupabaseDouble({
      account: { ...accountHolding({}), user_metadata: { teacher_code: 'GV001' } }
    });
    await start(mount());

    expect((await post(schoolNote())).status).toBe(403);
    await stop();
  });

  it('refuses when no schools row matches, instead of a session into an empty app', async () => {
    supabase = createSupabaseDouble({ school: null });
    await start(mount());

    const response = await post(schoolNote());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe('school_not_found');
    expect(body.message).toMatch(/schools/);
    expect(recorded.at(-1)).toMatchObject({ outcome: 'denied', reason: 'school_not_found' });
    // Nothing was created for a school this deployment cannot place.
    expect(supabase.calls.some(c => c.path === '/auth/v1/admin/users')).toBe(false);
    await stop();
  });

  it('refuses to serve at all when the issuer was never configured', async () => {
    await start(mount({ issuer: '' }));
    const response = await post(schoolNote());

    expect(response.status).toBe(503);
    expect((await response.json()).error).toBe('sso_not_configured');
    await stop();
  });

  it('refuses to serve at all when the school domain was never configured', async () => {
    await start(mount({ schoolDomain: '' }));

    expect((await post(schoolNote())).status).toBe(503);
    await stop();
  });

  it('does not mistake a whitespace-only domain for a configured one', async () => {
    // `Boolean('  ')` is true, so a stray space in the .env would otherwise
    // have satisfied the gate and left the domain check matching nothing.
    await start(mount({ schoolDomain: '   ' }));

    expect((await post(schoolNote())).status).toBe(503);
    await stop();
  });

  it('writes every refusal to the durable log, naming who was refused', async () => {
    await start(mount());
    await post(schoolNote({ role: 'admin' }));

    expect(recorded.at(-1)).toMatchObject({
      action: '/sso/school',
      outcome: 'denied',
      teacherCode: 'GV001'
    });
    await stop();
  });

  it('records provisioning as its own line, so a new account is traceable', async () => {
    await start(mount());
    await post(schoolNote());

    expect(recorded.find(entry => entry.action === '/sso/school/provision')).toMatchObject({
      outcome: 'allowed',
      reason: 'role:teacher',
      viewerId: 'user-uuid-1',
      teacherCode: 'GV001'
    });
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

  it('refuses a blank issuer instead of quietly dropping the issuer check', () => {
    // The old reading of a blank issuer was "no issuer to check against, so
    // accept whoever signed it" — one check short, and nothing said so.
    const other = schoolNote({ iss: 'someone-else.edu.vn' });

    expect(verifySchoolToken(other, { ...base, issuer: '' })).toEqual({ ok: false, reason: 'not_configured' });
    expect(verifySchoolToken(schoolNote(), { ...base, issuer: '' })).toEqual({ ok: false, reason: 'not_configured' });
  });
});
