/**
 * Short-lived tickets that let one person watch one camera.
 *
 * The relay is a separate process and cannot know who is asking; it only sees
 * a playback request. So the web app asks this server for a ticket, and the
 * relay hands that ticket back here before it starts sending pictures.
 *
 * A ticket names the camera and the viewer and expires in minutes, which is
 * what makes the access log worth keeping: a line saying somebody watched the
 * playground at 14:02 means that person, not whoever later found the URL in a
 * browser history.
 */

import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';

export const DEFAULT_TTL_SECONDS = 120;

/** Long enough that guessing is hopeless, short enough to sit in a URL. */
const SIGNATURE_BYTES = 32;

const b64url = (input) => Buffer.from(input).toString('base64url');

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url').slice(0, SIGNATURE_BYTES * 2);
}

/**
 * @returns {{ ticket: string, expiresAt: number, viewId: string }}
 */
export function issueTicket({ cameraId, viewerId, secret, ttlSeconds = DEFAULT_TTL_SECONDS, now = Date.now() }) {
  if (!cameraId || !viewerId) throw new Error('Ticket cần cả cameraId lẫn viewerId.');
  if (!secret) throw new Error('Thiếu CAMERA_TICKET_SECRET — không ký được vé xem camera.');

  const expiresAt = Math.floor(now / 1000) + ttlSeconds;
  // The view id ties the ticket to one line in the access log, so a stream the
  // relay is still serving can be traced back to the request that opened it.
  const viewId = randomUUID();
  const payload = [b64url(cameraId), b64url(viewerId), expiresAt, viewId].join('.');

  return { ticket: `${payload}.${sign(payload, secret)}`, expiresAt, viewId };
}

/**
 * @returns {{ ok: true, cameraId: string, viewerId: string, viewId: string, expiresAt: number }
 *          | { ok: false, reason: 'malformed' | 'signature' | 'expired' }}
 */
export function verifyTicket(ticket, { secret, now = Date.now() } = {}) {
  if (typeof ticket !== 'string') return { ok: false, reason: 'malformed' };

  const parts = ticket.split('.');
  if (parts.length !== 5) return { ok: false, reason: 'malformed' };

  const [cameraPart, viewerPart, expiresPart, viewId, signature] = parts;
  const payload = [cameraPart, viewerPart, expiresPart, viewId].join('.');
  const expected = sign(payload, secret || '');

  // Compared byte by byte in constant time: a comparison that stops at the
  // first difference tells an attacker how much of a guess was right.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'signature' };

  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: 'malformed' };
  if (expiresAt < Math.floor(now / 1000)) return { ok: false, reason: 'expired' };

  return {
    ok: true,
    cameraId: Buffer.from(cameraPart, 'base64url').toString('utf8'),
    viewerId: Buffer.from(viewerPart, 'base64url').toString('utf8'),
    viewId,
    expiresAt
  };
}
