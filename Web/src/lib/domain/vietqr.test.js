import { describe, it, expect } from 'vitest';
import {
  buildVietQrPayload,
  buildTuitionPurpose,
  crc16,
  findBankByBin,
  isValidPayload,
  parseTlv,
  toAscii,
  tlv,
  MAX_PURPOSE_LENGTH,
  SERVICE_TO_ACCOUNT
} from './vietqr';

const VALID = {
  bin: '970436',
  accountNumber: '1234567890',
  accountName: 'TRUONG THPT NGUYEN DU',
  amount: 2500000,
  purpose: 'HS001 F01'
};

describe('crc16 (CCITT-FALSE)', () => {
  // Check vectors published for CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF.
  it('matches the standard check vector for "123456789"', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('returns the init value for an empty string', () => {
    expect(crc16('')).toBe('FFFF');
  });

  it('always returns four uppercase hex digits', () => {
    expect(crc16('A')).toMatch(/^[0-9A-F]{4}$/);
    expect(crc16('EduPortal')).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe('tlv', () => {
  it('zero-pads the length to two digits', () => {
    expect(tlv('00', '01')).toBe('000201');
    expect(tlv('58', 'VN')).toBe('5802VN');
  });

  it('rejects values longer than the EMVCo 99-character limit', () => {
    expect(() => tlv('62', 'x'.repeat(100))).toThrow(/99/);
  });
});

describe('toAscii', () => {
  it('strips Vietnamese diacritics', () => {
    expect(toAscii('Nguyễn Hoàng Nam')).toBe('Nguyen Hoang Nam');
    expect(toAscii('Trường THPT Nguyễn Du')).toBe('Truong THPT Nguyen Du');
  });

  it('maps đ and Đ, which have no Unicode decomposition', () => {
    expect(toAscii('đường')).toBe('duong');
    expect(toAscii('Đại học')).toBe('Dai hoc');
  });

  it('drops emoji and collapses whitespace', () => {
    expect(toAscii('Hoc  phi 🏦 thang 6')).toBe('Hoc phi thang 6');
  });

  it('returns an empty string for nullish input', () => {
    expect(toAscii(null)).toBe('');
    expect(toAscii(undefined)).toBe('');
  });
});

describe('buildVietQrPayload', () => {
  it('produces a payload whose CRC verifies', () => {
    const { payload, errors } = buildVietQrPayload(VALID);
    expect(errors).toEqual([]);
    expect(isValidPayload(payload)).toBe(true);
  });

  it('starts with the EMVCo payload format indicator', () => {
    const { payload } = buildVietQrPayload(VALID);
    expect(payload.startsWith('000201')).toBe(true);
  });

  it('nests the Napas GUID, BIN and account under tag 38', () => {
    const { payload } = buildVietQrPayload(VALID);
    const merchant = parseTlv(payload)['38'];
    const merchantFields = parseTlv(merchant);

    expect(merchantFields['00']).toBe('A000000727');
    expect(merchantFields['02']).toBe(SERVICE_TO_ACCOUNT);

    const beneficiary = parseTlv(merchantFields['01']);
    expect(beneficiary['00']).toBe('970436');
    expect(beneficiary['01']).toBe('1234567890');
  });

  it('marks the QR as one-time and locks the amount when one is given', () => {
    const fields = parseTlv(buildVietQrPayload(VALID).payload);
    expect(fields['01']).toBe('12');
    expect(fields['54']).toBe('2500000');
    expect(fields['53']).toBe('704');
    expect(fields['58']).toBe('VN');
  });

  it('marks the QR as reusable and omits the amount when none is given', () => {
    const { payload } = buildVietQrPayload({ ...VALID, amount: undefined });
    const fields = parseTlv(payload);
    expect(fields['01']).toBe('11');
    expect(fields['54']).toBeUndefined();
    expect(isValidPayload(payload)).toBe(true);
  });

  it('carries the transfer memo in tag 62 sub-tag 08', () => {
    const fields = parseTlv(buildVietQrPayload(VALID).payload);
    expect(parseTlv(fields['62'])['08']).toBe('HS001 F01');
  });

  it('folds a Vietnamese account name to ASCII', () => {
    const { payload } = buildVietQrPayload({ ...VALID, accountName: 'Trường THPT Nguyễn Du' });
    expect(parseTlv(payload)['59']).toBe('Truong THPT Nguyen Du');
  });

  it('changes the checksum when any field changes', () => {
    const a = buildVietQrPayload(VALID).payload;
    const b = buildVietQrPayload({ ...VALID, amount: 2500001 }).payload;
    expect(a.slice(-4)).not.toBe(b.slice(-4));
  });

  it('is deterministic for identical input', () => {
    expect(buildVietQrPayload(VALID).payload).toBe(buildVietQrPayload(VALID).payload);
  });
});

describe('buildVietQrPayload validation', () => {
  const expectRejected = (overrides, pattern) => {
    const { payload, errors } = buildVietQrPayload({ ...VALID, ...overrides });
    expect(payload).toBe('');
    expect(errors.join(' ')).toMatch(pattern);
  };

  it('rejects a BIN that is not six digits', () => {
    expectRejected({ bin: '97043' }, /6 chữ số/);
    expectRejected({ bin: 'VCB' }, /6 chữ số/);
  });

  it('rejects a malformed account number', () => {
    expectRejected({ accountNumber: '12' }, /Số tài khoản/);
    expectRejected({ accountNumber: '1234-5678' }, /Số tài khoản/);
  });

  it('rejects non-integer or negative amounts', () => {
    expectRejected({ amount: 2500000.5 }, /số nguyên dương/);
    expectRejected({ amount: -1 }, /số nguyên dương/);
  });

  it('rejects a memo longer than banks accept', () => {
    expectRejected({ purpose: 'X'.repeat(MAX_PURPOSE_LENGTH + 1) }, /tối đa/);
  });

  it('reports every problem at once instead of only the first', () => {
    const { errors } = buildVietQrPayload({ ...VALID, bin: 'x', accountNumber: '1' });
    expect(errors.length).toBe(2);
  });
});

describe('isValidPayload', () => {
  it('rejects a payload whose content was tampered with', () => {
    const { payload } = buildVietQrPayload(VALID);
    const tampered = payload.replace('2500000', '2500001');
    expect(isValidPayload(tampered)).toBe(false);
  });

  it('rejects non-payload input', () => {
    expect(isValidPayload('')).toBe(false);
    expect(isValidPayload(null)).toBe(false);
    expect(isValidPayload('not a qr payload')).toBe(false);
  });
});

describe('findBankByBin', () => {
  it('resolves a known Napas BIN', () => {
    expect(findBankByBin('970436').shortName).toBe('Vietcombank');
    expect(findBankByBin('970418').shortName).toBe('BIDV');
  });

  it('returns null for an unknown BIN', () => {
    expect(findBankByBin('123456')).toBeNull();
  });
});

describe('buildTuitionPurpose', () => {
  it('produces the same memo for the same invoice every time', () => {
    expect(buildTuitionPurpose('HS001', 'F01')).toBe('HS001 F01');
  });

  it('stays inside the memo length limit', () => {
    const memo = buildTuitionPurpose('HS001', 'HOCPHI-THANG-06-2026-LOP-12A1');
    expect(memo.length).toBeLessThanOrEqual(MAX_PURPOSE_LENGTH);
  });
});
