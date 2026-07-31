import { describe, it, expect } from 'vitest';
import { filterPII } from './piiFilter';

describe('filterPII', () => {
  it('redacts email addresses', () => {
    expect(filterPII('liên hệ minh@example.com nhé')).toBe('liên hệ [EMAIL_REDACTED] nhé');
  });

  it('redacts Vietnamese mobile numbers in both 0 and +84 form', () => {
    expect(filterPII('gọi 0384741350')).toBe('gọi [PHONE_REDACTED]');
    expect(filterPII('gọi +84384741350')).toBe('gọi [PHONE_REDACTED]');
  });

  it('redacts student IDs', () => {
    expect(filterPII('HS001 nộp bài')).toBe('[STUDENT_ID] nộp bài');
    expect(filterPII('hs1234 vắng')).toBe('[STUDENT_ID] vắng');
  });

  it('redacts class IDs', () => {
    expect(filterPII('lớp 12A1 họp')).toBe('lớp [CLASS_REDACTED] họp');
    expect(filterPII('lớp 10B nghỉ')).toBe('lớp [CLASS_REDACTED] nghỉ');
  });

  it('redacts several kinds of PII in one string', () => {
    const out = filterPII('HS001 lớp 12A1, mail a@b.com, sđt 0384741350');
    expect(out).toContain('[STUDENT_ID]');
    expect(out).toContain('[CLASS_REDACTED]');
    expect(out).toContain('[EMAIL_REDACTED]');
    expect(out).toContain('[PHONE_REDACTED]');
    expect(out).not.toContain('0384741350');
  });

  it('returns an empty string for empty and nullish input', () => {
    expect(filterPII('')).toBe('');
    expect(filterPII(null)).toBe('');
    expect(filterPII(undefined)).toBe('');
  });

  it('leaves text without PII untouched', () => {
    expect(filterPII('bài tập về nhà trang 42')).toBe('bài tập về nhà trang 42');
  });

  // Characterisation test, NOT an endorsement. The phone pattern is
  // /(?:0|\+84)[3|5|7|8|9][0-9]{8}/ — inside a character class the "|" is a literal
  // character, not alternation, so "0|" followed by 8 digits also matches.
  // This documents today's behaviour so a fix to the regex shows up as a
  // deliberate change here rather than an unnoticed side effect.
  it('currently also matches a literal pipe where a digit is expected (known regex quirk)', () => {
    expect(filterPII('0|12345678')).toBe('[PHONE_REDACTED]');
  });
});
