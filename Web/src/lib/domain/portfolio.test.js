import { describe, it, expect } from 'vitest';
import {
  clearPortfolioConfirmation,
  confirmPortfolio,
  isPortfolioConfirmed,
  normalisePortfolio,
  normalisePortfolios,
  readPortfolioConfirmation
} from './portfolio';

const unconfirmed = () => ({
  studentId: 'HS002',
  studentName: 'Lê Mai Chi',
  extracurricularAchievements: ['Giải Nhì học sinh giỏi Toán cấp Tỉnh'],
  bghConfirmation: null,
  isPublic: false
});

/** A hồ sơ as releases before this module persisted it into localStorage. */
const legacySigned = () => ({
  studentId: 'HS001',
  studentName: 'Nguyễn Hoàng Nam',
  extracurricularAchievements: ['Đạt giải nhất cuộc thi Tin học trẻ thành phố'],
  blockchainSignature: {
    signedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
    date: '2026-06-02',
    hash: '8f3c7e2b1a9c8f7d6e5d4c3b2a1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a'
  },
  isPublic: true
});

describe('readPortfolioConfirmation', () => {
  it('returns null while nobody has confirmed the hồ sơ', () => {
    expect(readPortfolioConfirmation(unconfirmed())).toBeNull();
    expect(readPortfolioConfirmation({})).toBeNull();
    expect(readPortfolioConfirmation(null)).toBeNull();
    expect(readPortfolioConfirmation(undefined)).toBeNull();
  });

  it('reads who confirmed it and when', () => {
    const { portfolio } = confirmPortfolio(unconfirmed(), {
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    });

    expect(readPortfolioConfirmation(portfolio)).toEqual({
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    });
  });

  it('reads a hồ sơ persisted by an earlier release without crashing', () => {
    expect(readPortfolioConfirmation(legacySigned())).toEqual({
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-02'
    });
  });
});

describe('normalisePortfolio', () => {
  it('carries the person and date of an old signature over, and drops the hash', () => {
    const migrated = normalisePortfolio(legacySigned());

    expect(migrated.bghConfirmation).toEqual({
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-02'
    });
    // The hash authenticated nothing, so keeping it would keep the claim alive.
    expect(migrated).not.toHaveProperty('blockchainSignature');
    expect(JSON.stringify(migrated)).not.toContain('8f3c7e2b');
  });

  it('leaves the rest of the hồ sơ untouched', () => {
    const migrated = normalisePortfolio(legacySigned());

    expect(migrated.studentId).toBe('HS001');
    expect(migrated.extracurricularAchievements).toEqual([
      'Đạt giải nhất cuộc thi Tin học trẻ thành phố'
    ]);
    expect(migrated.isPublic).toBe(true);
  });

  it('gives an unsigned legacy record an explicit null confirmation', () => {
    const migrated = normalisePortfolio({ studentId: 'HS003', blockchainSignature: null });

    expect(migrated.bghConfirmation).toBeNull();
    expect(migrated).not.toHaveProperty('blockchainSignature');
  });

  it('repairs a missing achievements list rather than letting a screen map over undefined', () => {
    expect(normalisePortfolio({ studentId: 'HS004' }).extracurricularAchievements).toEqual([]);
  });

  it('normalises a whole stored list, and reads a corrupt store as empty', () => {
    const list = normalisePortfolios([legacySigned(), unconfirmed()]);
    expect(list.map((p) => Boolean(p.bghConfirmation))).toEqual([true, false]);

    expect(normalisePortfolios(null)).toEqual([]);
    expect(normalisePortfolios({ studentId: 'HS001' })).toEqual([]);
  });
});

describe('confirmPortfolio', () => {
  it('records the confirmation without inventing anything else', () => {
    const { portfolio, errors } = confirmPortfolio(unconfirmed(), {
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    });

    expect(errors).toEqual([]);
    expect(portfolio.bghConfirmation).toEqual({
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    });
    expect(Object.keys(portfolio.bghConfirmation)).toEqual(['confirmedBy', 'confirmedAt']);
  });

  it('is repeatable: the same hồ sơ and the same day give the same record', () => {
    const first = confirmPortfolio(unconfirmed(), {
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    }).portfolio;
    const second = confirmPortfolio(unconfirmed(), {
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    }).portfolio;

    expect(first.bghConfirmation).toEqual(second.bghConfirmation);
  });

  it('refuses to re-confirm a locked hồ sơ instead of restamping it', () => {
    const { portfolio } = confirmPortfolio(unconfirmed(), {
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    });

    const again = confirmPortfolio(portfolio, {
      confirmedBy: 'Phó hiệu trưởng Trần Thị Lan',
      confirmedAt: '2026-06-10'
    });

    expect(again.errors).toContain('Hồ sơ đã được xác nhận và khoá.');
    expect(again.portfolio.bghConfirmation.confirmedBy).toBe('Hiệu trưởng Nguyễn Văn Hùng');
    expect(again.portfolio.bghConfirmation.confirmedAt).toBe('2026-06-03');
  });

  it('refuses a hồ sơ locked by an earlier release too', () => {
    const again = confirmPortfolio(legacySigned(), {
      confirmedBy: 'Phó hiệu trưởng Trần Thị Lan',
      confirmedAt: '2026-06-10'
    });

    expect(again.errors).toContain('Hồ sơ đã được xác nhận và khoá.');
  });

  it('refuses an anonymous confirmation', () => {
    expect(
      confirmPortfolio(unconfirmed(), { confirmedBy: '   ', confirmedAt: '2026-06-03' }).errors
    ).toContain('Thiếu tên người xác nhận.');
    expect(confirmPortfolio(unconfirmed(), { confirmedAt: '2026-06-03' }).errors).toContain(
      'Thiếu tên người xác nhận.'
    );
  });

  it('refuses a date that is not a real calendar day', () => {
    const errors = confirmPortfolio(unconfirmed(), {
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-02-30'
    }).errors;

    expect(errors).toContain('Ngày xác nhận không hợp lệ (định dạng YYYY-MM-DD).');
  });

  it('leaves the original hồ sơ alone', () => {
    const original = unconfirmed();
    confirmPortfolio(original, {
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    });

    expect(original.bghConfirmation).toBeNull();
  });
});

describe('clearPortfolioConfirmation', () => {
  it('sends an edited hồ sơ back for confirmation', () => {
    const { portfolio } = confirmPortfolio(unconfirmed(), {
      confirmedBy: 'Hiệu trưởng Nguyễn Văn Hùng',
      confirmedAt: '2026-06-03'
    });

    expect(isPortfolioConfirmed(clearPortfolioConfirmation(portfolio))).toBe(false);
  });

  it('clears a lock inherited from an earlier release, hash and all', () => {
    const cleared = clearPortfolioConfirmation(legacySigned());

    expect(isPortfolioConfirmed(cleared)).toBe(false);
    expect(cleared).not.toHaveProperty('blockchainSignature');
  });
});
