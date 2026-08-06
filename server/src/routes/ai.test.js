/**
 * These endpoints spend the school's own GPU, and until this suite existed they
 * spent it for anybody who could reach the port. The cases below are the ones
 * that were open: no token at all, a pupil's token, and a server that cannot
 * check either.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { createAiRouter, DEFAULT_ALLOWED_ROLES } from './ai.js';

/** Stands in for Supabase: the token is simply the role we want to test. */
const viewerResolver = {
  isConfigured: true,
  async resolve(token) {
    if (!token || token === 'invalid') return null;
    return { id: `user-${token}`, role: token };
  }
};

function serve(router) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

const post = (baseUrl, path, { token, body = {} } = {}) =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

describe('ai router — who may spend the school model time', () => {
  let baseUrl;
  let server;

  beforeAll(async () => {
    ({ server, baseUrl } = await serve(createAiRouter({ viewerResolver })));
  });

  afterAll(() => new Promise(resolve => server.close(resolve)));

  for (const path of ['/api/transcribe', '/api/summarize']) {
    it(`${path} refuses a caller with no token`, async () => {
      const res = await post(baseUrl, path);
      expect(res.status).toBe(401);
    });

    it(`${path} refuses a token Supabase does not recognise`, async () => {
      const res = await post(baseUrl, path, { token: 'invalid' });
      expect(res.status).toBe(401);
    });

    it(`${path} refuses a pupil`, async () => {
      const res = await post(baseUrl, path, { token: 'student' });
      expect(res.status).toBe(403);
    });

    it(`${path} refuses a parent`, async () => {
      const res = await post(baseUrl, path, { token: 'parent' });
      expect(res.status).toBe(403);
    });

    it(`${path} lets a teacher through`, async () => {
      const res = await post(baseUrl, path, { token: 'teacher', body: { transcript: 'xin chào' } });
      expect(res.status).toBe(200);
    });

    it(`${path} lets an admin through`, async () => {
      const res = await post(baseUrl, path, { token: 'admin', body: { transcript: 'xin chào' } });
      expect(res.status).toBe(200);
    });
  }

  it('names teacher and admin as the default audience, and nobody else', () => {
    expect(DEFAULT_ALLOWED_ROLES).toEqual(['teacher', 'admin']);
    expect(DEFAULT_ALLOWED_ROLES).not.toContain('student');
    expect(DEFAULT_ALLOWED_ROLES).not.toContain('parent');
  });
});

describe('ai router — a server that cannot check identity', () => {
  let baseUrl;
  let server;

  beforeAll(async () => {
    ({ server, baseUrl } = await serve(
      createAiRouter({ viewerResolver: { isConfigured: false, async resolve() { return null; } } })
    ));
  });

  afterAll(() => new Promise(resolve => server.close(resolve)));

  // Falling open here would mean an unconfigured server is a more useful server
  // to a stranger than a configured one.
  it('refuses everybody rather than falling open', async () => {
    const res = await post(baseUrl, '/api/summarize', { token: 'admin' });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('ai_not_configured');
  });
});

describe('ai router — a school that widens the audience', () => {
  let baseUrl;
  let server;

  beforeAll(async () => {
    ({ server, baseUrl } = await serve(
      createAiRouter({ viewerResolver, allowedRoles: ['admin'] })
    ));
  });

  afterAll(() => new Promise(resolve => server.close(resolve)));

  it('honours AI_ALLOWED_ROLES rather than the default', async () => {
    expect((await post(baseUrl, '/api/summarize', { token: 'teacher' })).status).toBe(403);
    expect((await post(baseUrl, '/api/summarize', { token: 'admin', body: { transcript: 'x' } })).status).toBe(200);
  });
});
