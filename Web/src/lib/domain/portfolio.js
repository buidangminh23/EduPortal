/**
 * Ban Giám hiệu confirmation on a student's hồ sơ thành tích.
 *
 * What this records is a confirmation, not a chữ ký số. A chữ ký số under Nghị
 * định 130/2018/NĐ-CP and Luật Giao dịch điện tử 2023 is produced with a
 * certificate issued by a licensed CA and held on a token or an HSM; a browser
 * has no access to one and cannot make one. The version this replaces built a
 * 64-character hex string from `Date.now()`, `Math.random()` and a literal, then
 * displayed it as a blockchain hash: confirming the same hồ sơ twice produced
 * two different values, neither derived from the record it claimed to
 * authenticate. Hashing the record properly would not fix it either — a digest
 * says what the content was, never who approved it.
 *
 * So this stores the fact the school actually has: which member of the Ban Giám
 * hiệu confirmed the hồ sơ, on which date, after which the entry is locked. The
 * official học bạ still carries the school's own signature and seal; nothing
 * here substitutes for that.
 */

import { isValidIsoDate } from './dates';

/**
 * Reads the confirmation on a hồ sơ, or null when nobody has confirmed it.
 *
 * Records written before this module carry `blockchainSignature`, both in the
 * seed data and in every browser that has already run the app, so those are
 * read here as well: the person and the date in them are real facts about a
 * confirmation that did happen. The hash is dropped rather than migrated — it
 * authenticated nothing, and carrying it forward would keep the claim alive.
 *
 * @returns {{ confirmedBy: string, confirmedAt: string }|null}
 */
export function readPortfolioConfirmation(portfolio) {
  const current = portfolio?.bghConfirmation;
  if (current?.confirmedBy) {
    return { confirmedBy: current.confirmedBy, confirmedAt: current.confirmedAt ?? null };
  }

  const legacy = portfolio?.blockchainSignature;
  if (legacy?.signedBy) {
    return { confirmedBy: legacy.signedBy, confirmedAt: legacy.date ?? null };
  }

  return null;
}

/** Whether the Ban Giám hiệu has confirmed this hồ sơ, which locks it. */
export function isPortfolioConfirmed(portfolio) {
  return readPortfolioConfirmation(portfolio) !== null;
}

/** Strips the field an earlier release wrote, so nothing reads it back later. */
function withoutLegacySignature(portfolio) {
  const next = { ...portfolio };
  delete next.blockchainSignature;
  return next;
}

/**
 * Rewrites a stored hồ sơ into the current shape, so the rest of the app only
 * ever sees one field. Applied when state is loaded, which is the one place a
 * `blockchainSignature` from a previous release can still arrive.
 */
export function normalisePortfolio(portfolio) {
  if (!portfolio || typeof portfolio !== 'object') return portfolio;

  return {
    ...withoutLegacySignature(portfolio),
    extracurricularAchievements: Array.isArray(portfolio.extracurricularAchievements)
      ? portfolio.extracurricularAchievements
      : [],
    bghConfirmation: readPortfolioConfirmation(portfolio)
  };
}

/** Rewrites a whole stored list; anything that is not a list becomes one. */
export function normalisePortfolios(portfolios) {
  return Array.isArray(portfolios) ? portfolios.map(normalisePortfolio) : [];
}

/**
 * Records that the Ban Giám hiệu confirmed the hồ sơ, returning a new object.
 *
 * A confirmed hồ sơ is refused rather than overwritten: the lock is the whole
 * point of confirming, and silently re-stamping it with a later date would let
 * the record be changed after the fact without anyone seeing.
 *
 * @param {{ confirmedBy: string, confirmedAt: string }} confirmation
 * @returns {{ portfolio: object, errors: string[] }}
 */
export function confirmPortfolio(portfolio, { confirmedBy, confirmedAt } = {}) {
  const errors = [];

  if (!String(confirmedBy || '').trim()) {
    errors.push('Thiếu tên người xác nhận.');
  }
  if (!isValidIsoDate(confirmedAt)) {
    errors.push('Ngày xác nhận không hợp lệ (định dạng YYYY-MM-DD).');
  }
  if (isPortfolioConfirmed(portfolio)) {
    errors.push('Hồ sơ đã được xác nhận và khoá.');
  }

  if (errors.length > 0) return { portfolio, errors };

  return {
    portfolio: {
      ...withoutLegacySignature(portfolio),
      bghConfirmation: { confirmedBy: String(confirmedBy).trim(), confirmedAt }
    },
    errors: []
  };
}

/**
 * Drops the confirmation, returning a new hồ sơ.
 *
 * Called whenever the achievements change: the Ban Giám hiệu confirmed the list
 * as it stood, so a hồ sơ that has been edited since is no longer the one they
 * saw and has to go back for confirmation. A lock inherited from an earlier
 * release is released with it — leaving `blockchainSignature` in place would
 * keep the hồ sơ reading as confirmed no matter what was edited.
 */
export function clearPortfolioConfirmation(portfolio) {
  return { ...withoutLegacySignature(portfolio), bghConfirmation: null };
}
