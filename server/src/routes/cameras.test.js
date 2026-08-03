import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { createCameraRouter } from './cameras.js';
import { parseCameraRegistry } from '../lib/cameraRegistry.js';
import { createEventStore } from '../lib/cameraEvents.js';

const SECRET = 'test-ticket-secret';
const EVENT_KEY = 'test-event-key';

const CAMERAS = parseCameraRegistry([
  { id: 'san-truong', name: 'Sân trường', location: 'Khu A', source: 'rtsp://admin:1234@10.0.0.5:554/ch1' },
  { id: 'cong-chinh', name: 'Cổng chính', source: 'rtsp://admin:1234@10.0.0.6:554/ch1' },
  { id: 'kho-cu', name: 'Kho cũ', source: 'rtsp://admin:1234@10.0.0.7:554/ch1', enabled: false }
]);

/** Stands in for Supabase: the token is simply the role we want to test. */
const viewerResolver = {
  isConfigured: true,
  async resolve(token) {
    if (!token || token === 'invalid') return null;
    return { id: `user-${token}`, role: token };
  }
};

const recorded = [];
let baseUrl;
let server;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', createCameraRouter({
    cameras: CAMERAS,
    relayUrl: 'http://10.0.0.2:8889',
    ticketSecret: SECRET,
    eventKey: EVENT_KEY,
    viewerResolver,
    accessLog: { record: entry => recorded.push(entry) },
    eventStore: createEventStore()
  }));

  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise(resolve => server.close(resolve)));

const call = (path, { role, ...init } = {}) => fetch(`${baseUrl}${path}`, {
  ...init,
  headers: {
    ...(role ? { Authorization: `Bearer ${role}` } : {}),
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...init.headers
  }
});

async function ticketFor(cameraId, role = 'admin') {
  const response = await call(`/api/cameras/${cameraId}/ticket`, { method: 'POST', role });
  const body = await response.json();
  return new URL(body.url).searchParams.get('ticket');
}

describe('GET /api/cameras', () => {
  it('refuses a request with no token', async () => {
    expect((await call('/api/cameras')).status).toBe(401);
  });

  it('refuses a teacher, a student and a parent', async () => {
    for (const role of ['teacher', 'teacher_homeroom', 'student', 'parent']) {
      expect((await call('/api/cameras', { role })).status).toBe(403);
    }
  });

  it('lists cameras for Ban Giám Hiệu without ever sending an rtsp address', async () => {
    const response = await call('/api/cameras', { role: 'admin' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cameras.map(c => c.id)).toEqual(['san-truong', 'cong-chinh']);
    expect(JSON.stringify(body)).not.toContain('rtsp://');
  });

  it('writes down a refusal, not just the viewings', async () => {
    recorded.length = 0;
    await call('/api/cameras', { role: 'student' });

    expect(recorded.at(-1)).toMatchObject({ outcome: 'denied', reason: 'role:student' });
  });
});

describe('POST /api/cameras/:id/ticket', () => {
  it('hands back a playback url for the right relay path', async () => {
    const response = await call('/api/cameras/san-truong/ticket', { method: 'POST', role: 'admin' });
    const body = await response.json();

    expect(new URL(body.url).pathname).toBe('/cam-san-truong/whep');
    expect(body.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('records who asked for which camera', async () => {
    recorded.length = 0;
    await call('/api/cameras/san-truong/ticket', { method: 'POST', role: 'admin' });

    expect(recorded.at(-1)).toMatchObject({ action: 'ticket', cameraId: 'san-truong', viewerId: 'user-admin' });
  });

  it('has nothing to give for a camera that is switched off or absent', async () => {
    expect((await call('/api/cameras/kho-cu/ticket', { method: 'POST', role: 'admin' })).status).toBe(404);
    expect((await call('/api/cameras/khong-co/ticket', { method: 'POST', role: 'admin' })).status).toBe(404);
  });

  it('refuses to issue one to a teacher', async () => {
    expect((await call('/api/cameras/san-truong/ticket', { method: 'POST', role: 'teacher' })).status).toBe(403);
  });
});

describe('POST /api/cameras/authorize — the relay asking', () => {
  const authorize = (body) => call('/api/cameras/authorize', { method: 'POST', body: JSON.stringify(body) });

  it('lets a valid ticket through for its own camera', async () => {
    const ticket = await ticketFor('san-truong');
    const response = await authorize({ action: 'read', path: 'cam-san-truong', query: `ticket=${ticket}`, ip: '10.0.0.9' });

    expect(response.status).toBe(200);
    expect(recorded.at(-1)).toMatchObject({ action: 'watch', cameraId: 'san-truong', outcome: 'allowed' });
  });

  it('does not let a ticket for one camera open another', async () => {
    const ticket = await ticketFor('san-truong');
    const response = await authorize({ action: 'read', path: 'cam-cong-chinh', query: `ticket=${ticket}` });

    expect(response.status).toBe(403);
    expect(recorded.at(-1)).toMatchObject({ outcome: 'denied', reason: 'path_mismatch' });
  });

  it('turns away a request with no ticket, a forged one, or none at all', async () => {
    expect((await authorize({ action: 'read', path: 'cam-san-truong', query: '' })).status).toBe(401);
    expect((await authorize({ action: 'read', path: 'cam-san-truong', query: 'ticket=forged' })).status).toBe(401);
    expect((await authorize({})).status).toBe(401);
  });

  it('never authorises publishing, whatever ticket is presented', async () => {
    const ticket = await ticketFor('san-truong');
    const response = await authorize({ action: 'publish', path: 'cam-san-truong', query: `ticket=${ticket}` });

    expect(response.status).toBe(403);
  });
});

describe('camera events — the seam for an AI layer', () => {
  it('refuses a post without the shared key', async () => {
    const body = JSON.stringify({ cameraId: 'san-truong', label: 'Thử' });

    expect((await call('/api/camera-events', { method: 'POST', body })).status).toBe(401);
    expect((await call('/api/camera-events', { method: 'POST', body, headers: { 'x-camera-event-key': 'wrong' } })).status).toBe(401);
  });

  it('accepts a finding and shows it to Ban Giám Hiệu', async () => {
    const posted = await call('/api/camera-events', {
      method: 'POST',
      headers: { 'x-camera-event-key': EVENT_KEY },
      body: JSON.stringify({ cameraId: 'cong-chinh', label: 'Người lạ ở cổng', level: 'alert', confidence: 0.9 })
    });
    expect(posted.status).toBe(201);

    const listed = await (await call('/api/camera-events', { role: 'admin' })).json();
    expect(listed.events[0]).toMatchObject({ cameraId: 'cong-chinh', label: 'Người lạ ở cổng', level: 'alert' });
  });

  it('rejects a finding about a camera the school does not have', async () => {
    const response = await call('/api/camera-events', {
      method: 'POST',
      headers: { 'x-camera-event-key': EVENT_KEY },
      body: JSON.stringify({ cameraId: 'nha-hang-xom', label: 'Có người' })
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('invalid_event');
  });

  it('does not show the alert list to a teacher', async () => {
    expect((await call('/api/camera-events', { role: 'teacher' })).status).toBe(403);
  });
});

describe('an unconfigured server', () => {
  it('says so instead of pretending there are no cameras', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', createCameraRouter({ cameras: CAMERAS, viewerResolver }));

    const bare = app.listen(0);
    await new Promise(resolve => bare.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${bare.address().port}/api/cameras`, {
      headers: { Authorization: 'Bearer admin' }
    });

    expect(response.status).toBe(503);
    expect((await response.json()).error).toBe('camera_not_configured');
    await new Promise(resolve => bare.close(resolve));
  });
});
