/**
 * Camera routes: the school's live wall, for the head teacher's account only.
 *
 * Shape of the thing, because it is easy to get lost between three processes:
 *
 *   camera (rtsp) ─▶ relay (MediaMTX) ─▶ browser (WebRTC)
 *                       │
 *                       └── asks this server "is this ticket allowed?"
 *
 * This server never touches video. It decides who may watch, hands out
 * short-lived tickets, writes down every viewing, and holds the postbox an AI
 * layer drops its findings into.
 */

import { Router } from 'express';
import { loadCameraRegistry, findCamera, publicView } from '../lib/cameraRegistry.js';
import { issueTicket, verifyTicket, DEFAULT_TTL_SECONDS } from '../lib/cameraTickets.js';
import { createViewerResolver, tokenFromHeader } from '../lib/viewerIdentity.js';
import { createEventStore, normaliseEvent, InvalidEventError } from '../lib/cameraEvents.js';
import { createAccessLog } from '../lib/accessLog.js';

/** Ban Giám Hiệu. Widening this is a decision, so it is spelled out. */
const DEFAULT_ALLOWED_ROLES = ['admin'];

export function createCameraRouter({
  cameras = [],
  relayUrl = '',
  ticketSecret = '',
  ticketTtlSeconds = DEFAULT_TTL_SECONDS,
  eventKey = '',
  allowedRoles = DEFAULT_ALLOWED_ROLES,
  viewerResolver,
  accessLog,
  eventStore = createEventStore()
} = {}) {
  const router = Router();
  const log = accessLog || createAccessLog({});
  const enabled = cameras.filter(camera => camera.enabled);
  const cameraIds = enabled.map(camera => camera.id);

  const configured = Boolean(relayUrl && ticketSecret && viewerResolver?.isConfigured);

  /** Rejects anybody who is not, per Supabase, one of the allowed roles. */
  async function requireViewer(req, res, next) {
    if (!configured) {
      return res.status(503).json({
        error: 'camera_not_configured',
        message: 'Máy chủ chưa cấu hình camera (CAMERA_RELAY_URL, CAMERA_TICKET_SECRET, SUPABASE_URL).'
      });
    }

    const viewer = await viewerResolver.resolve(tokenFromHeader(req.get('authorization')));
    if (!viewer) {
      log.record({ action: req.path, outcome: 'denied', reason: 'unauthenticated', ip: req.ip });
      return res.status(401).json({ error: 'unauthenticated' });
    }
    if (!allowedRoles.includes(viewer.role)) {
      log.record({ action: req.path, outcome: 'denied', reason: `role:${viewer.role}`, viewerId: viewer.id, ip: req.ip });
      return res.status(403).json({ error: 'forbidden', message: 'Chỉ tài khoản Ban Giám Hiệu xem được camera.' });
    }

    req.viewer = viewer;
    return next();
  }

  router.get('/cameras', requireViewer, (_req, res) => {
    res.json({ relayUrl, cameras: enabled.map(publicView) });
  });

  router.post('/cameras/:id/ticket', requireViewer, (req, res) => {
    const camera = findCamera(enabled, req.params.id);
    if (!camera) return res.status(404).json({ error: 'camera_not_found' });

    const { ticket, expiresAt, viewId } = issueTicket({
      cameraId: camera.id,
      viewerId: req.viewer.id,
      secret: ticketSecret,
      ttlSeconds: ticketTtlSeconds
    });

    log.record({
      action: 'ticket',
      cameraId: camera.id,
      viewerId: req.viewer.id,
      viewId,
      ip: req.ip,
      outcome: 'allowed'
    });

    res.json({
      // WHEP: plain WebRTC, no player library, and under a second behind. The
      // ticket rides in the query string because that is what the relay hands
      // back to us when it asks.
      url: `${relayUrl.replace(/\/$/, '')}/${camera.streamPath}/whep?ticket=${encodeURIComponent(ticket)}`,
      expiresAt,
      viewId
    });
  });

  /**
   * The relay's authorisation hook. Called by MediaMTX, not by a browser.
   * 200 means "send pictures"; anything else means the viewer sees nothing.
   */
  router.post('/cameras/authorize', (req, res) => {
    const { action, path: streamPath, query, ip } = req.body || {};

    // Publishing is how the camera itself pushes in. Only the relay's own
    // configuration should ever do that, never a ticket holder.
    if (action && action !== 'read') {
      log.record({ action: 'relay-publish', outcome: 'denied', reason: `action:${action}`, ip });
      return res.status(403).end();
    }

    const ticket = new URLSearchParams(String(query || '')).get('ticket');
    const check = verifyTicket(ticket, { secret: ticketSecret });
    if (!check.ok) {
      log.record({ action: 'relay-read', outcome: 'denied', reason: check.reason, ip });
      return res.status(401).end();
    }

    const camera = findCamera(enabled, check.cameraId);
    if (!camera || (streamPath && camera.streamPath !== streamPath)) {
      // A valid ticket for one camera must not open another one.
      log.record({
        action: 'relay-read',
        outcome: 'denied',
        reason: 'path_mismatch',
        cameraId: check.cameraId,
        viewerId: check.viewerId,
        ip
      });
      return res.status(403).end();
    }

    log.record({
      action: 'watch',
      cameraId: camera.id,
      viewerId: check.viewerId,
      viewId: check.viewId,
      ip,
      outcome: 'allowed'
    });
    return res.status(200).end();
  });

  router.post('/camera-events', (req, res) => {
    if (!eventKey || req.get('x-camera-event-key') !== eventKey) {
      return res.status(401).json({ error: 'bad_event_key' });
    }

    try {
      const event = eventStore.append(normaliseEvent(req.body, { cameraIds }));
      return res.status(201).json(event);
    } catch (err) {
      if (err instanceof InvalidEventError) {
        return res.status(400).json({ error: 'invalid_event', message: err.message });
      }
      throw err;
    }
  });

  router.get('/camera-events', requireViewer, (req, res) => {
    res.json({ events: eventStore.list({ since: req.query.since, limit: Number(req.query.limit) || 50 }) });
  });

  return router;
}

/** Wiring from environment variables, for `index.js`. */
export function createCameraRouterFromEnv(env = process.env) {
  const cameras = loadCameraRegistry(env.CAMERA_CONFIG_FILE);

  return createCameraRouter({
    cameras,
    relayUrl: env.CAMERA_RELAY_URL || '',
    ticketSecret: env.CAMERA_TICKET_SECRET || '',
    ticketTtlSeconds: Number(env.CAMERA_TICKET_TTL_SECONDS) || DEFAULT_TTL_SECONDS,
    eventKey: env.CAMERA_EVENT_KEY || '',
    allowedRoles: (env.CAMERA_ALLOWED_ROLES || 'admin').split(',').map(role => role.trim()).filter(Boolean),
    viewerResolver: createViewerResolver({
      supabaseUrl: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY
    }),
    accessLog: createAccessLog({ filePath: env.CAMERA_ACCESS_LOG })
  });
}
