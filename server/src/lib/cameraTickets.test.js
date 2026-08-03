import { describe, it, expect } from 'vitest';
import { issueTicket, verifyTicket } from './cameraTickets.js';

const SECRET = 'a-secret-that-only-the-school-machine-holds';
const base = { cameraId: 'san-truong', viewerId: 'user-1', secret: SECRET };

describe('issueTicket', () => {
  it('names the camera and the viewer it was issued for', () => {
    const { ticket } = issueTicket(base);
    const check = verifyTicket(ticket, { secret: SECRET });

    expect(check).toMatchObject({ ok: true, cameraId: 'san-truong', viewerId: 'user-1' });
  });

  it('gives every viewing its own id so the log can tell them apart', () => {
    const first = issueTicket(base);
    const second = issueTicket(base);

    expect(first.viewId).not.toBe(second.viewId);
  });

  it('refuses to sign without a secret', () => {
    expect(() => issueTicket({ ...base, secret: '' })).toThrow(/CAMERA_TICKET_SECRET/);
  });

  it('refuses to sign without a viewer to hold responsible', () => {
    expect(() => issueTicket({ ...base, viewerId: '' })).toThrow();
  });
});

describe('verifyTicket', () => {
  it('rejects a ticket signed with another secret', () => {
    const { ticket } = issueTicket({ ...base, secret: 'someone-elses-secret' });

    expect(verifyTicket(ticket, { secret: SECRET })).toEqual({ ok: false, reason: 'signature' });
  });

  it('rejects a ticket whose camera was swapped after signing', () => {
    const { ticket } = issueTicket(base);
    const parts = ticket.split('.');
    parts[0] = Buffer.from('phong-hoc-12a1').toString('base64url');

    expect(verifyTicket(parts.join('.'), { secret: SECRET })).toEqual({ ok: false, reason: 'signature' });
  });

  it('rejects a ticket whose expiry was pushed out', () => {
    const { ticket } = issueTicket(base);
    const parts = ticket.split('.');
    parts[2] = String(Number(parts[2]) + 86_400);

    expect(verifyTicket(parts.join('.'), { secret: SECRET })).toEqual({ ok: false, reason: 'signature' });
  });

  it('expires', () => {
    const now = Date.now();
    const { ticket } = issueTicket({ ...base, ttlSeconds: 60, now });

    expect(verifyTicket(ticket, { secret: SECRET, now: now + 59_000 }).ok).toBe(true);
    expect(verifyTicket(ticket, { secret: SECRET, now: now + 61_000 })).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects nonsense without throwing', () => {
    for (const value of [null, undefined, '', 'abc', 'a.b.c.d.e', 42]) {
      expect(verifyTicket(value, { secret: SECRET }).ok).toBe(false);
    }
  });
});
