/**
 * End-to-end proof that the tuition QR is actually scannable.
 *
 * The unit tests check that the payload is well-formed; this one encodes it the
 * same way the UI does, then decodes the resulting image with an independent
 * QR reader (jsQR — the decoder, not the encoder) and asserts the bytes come
 * back unchanged. That is the difference between "we believe it scans" and
 * "a scanner read it".
 */
import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { buildVietQrPayload, isValidPayload, parseTlv } from './vietqr';

/** Scale each QR module up so the decoder has enough pixels to lock onto. */
const SCALE = 4;
/** Quiet zone required by the QR spec, in modules. */
const QUIET_ZONE = 4;

/**
 * Paints a QR module matrix into an RGBA buffer.
 *
 * Building the pixels by hand keeps this test free of `canvas`, which needs
 * native binaries and would make the suite unrunnable on a fresh checkout.
 */
function renderToRgba(qr) {
  const modules = qr.modules;
  const size = modules.size;
  const side = (size + QUIET_ZONE * 2) * SCALE;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!modules.get(row, col)) continue;
      const originX = (col + QUIET_ZONE) * SCALE;
      const originY = (row + QUIET_ZONE) * SCALE;

      for (let dy = 0; dy < SCALE; dy += 1) {
        for (let dx = 0; dx < SCALE; dx += 1) {
          const offset = ((originY + dy) * side + originX + dx) * 4;
          pixels[offset] = 0;
          pixels[offset + 1] = 0;
          pixels[offset + 2] = 0;
        }
      }
    }
  }

  return { pixels, side };
}

function scan(payload) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' });
  const { pixels, side } = renderToRgba(qr);
  return jsQR(pixels, side, side);
}

const invoice = {
  bin: '970436',
  accountNumber: '0011000123456',
  accountName: 'TRUONG THPT NGUYEN DU',
  amount: 2_500_000,
  purpose: 'HS001 F01',
  city: 'HA NOI'
};

describe('tuition QR round-trip', () => {
  it('decodes back to the exact payload that was encoded', () => {
    const { payload } = buildVietQrPayload(invoice);
    const decoded = scan(payload);

    expect(decoded).not.toBeNull();
    expect(decoded.data).toBe(payload);
  });

  it('survives the round-trip with its checksum intact', () => {
    const { payload } = buildVietQrPayload(invoice);
    expect(isValidPayload(scan(payload).data)).toBe(true);
  });

  it('carries the amount and memo a bank app will prefill', () => {
    const { payload } = buildVietQrPayload(invoice);
    const fields = parseTlv(scan(payload).data);

    expect(fields['54']).toBe('2500000');
    expect(parseTlv(fields['62'])['08']).toBe('HS001 F01');
  });

  it('scans at the largest amount a school invoice allows', () => {
    const { payload } = buildVietQrPayload({ ...invoice, amount: 999_999_999 });
    expect(scan(payload).data).toBe(payload);
  });

  it('scans a reusable QR with no amount locked in', () => {
    const { payload } = buildVietQrPayload({ ...invoice, amount: undefined });
    expect(scan(payload).data).toBe(payload);
  });
});
