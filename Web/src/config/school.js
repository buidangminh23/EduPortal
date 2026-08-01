/**
 * School identity and the bank account tuition is collected into.
 *
 * These are deployment facts, not code: a school sets them once through
 * environment variables. The fallbacks below are clearly-marked demo values so
 * the app still runs out of the box — `isDemoBankAccount` lets the UI say so
 * out loud rather than inviting anyone to transfer money into a placeholder.
 */

const env = import.meta.env || {};

/** Napas BIN of the demo receiving bank (Vietcombank). */
const DEMO_BANK_BIN = '970436';
const DEMO_ACCOUNT_NUMBER = '0011000123456';
const DEMO_ACCOUNT_NAME = 'TRUONG THPT NGUYEN DU';
const DEMO_SCHOOL_NAME = 'Trường THPT Nguyễn Du';

export const SCHOOL = {
  name: env.VITE_SCHOOL_NAME || DEMO_SCHOOL_NAME,
  city: env.VITE_SCHOOL_CITY || 'HA NOI'
};

export const BANK_ACCOUNT = {
  bin: env.VITE_SCHOOL_BANK_BIN || DEMO_BANK_BIN,
  accountNumber: env.VITE_SCHOOL_BANK_ACCOUNT || DEMO_ACCOUNT_NUMBER,
  accountName: env.VITE_SCHOOL_BANK_ACCOUNT_NAME || DEMO_ACCOUNT_NAME
};

/**
 * True while any part of the receiving account is still the built-in demo
 * value. A QR built on demo details is structurally valid and will scan, but
 * it points at an account the school does not own.
 */
export const isDemoBankAccount =
  !env.VITE_SCHOOL_BANK_BIN ||
  !env.VITE_SCHOOL_BANK_ACCOUNT ||
  !env.VITE_SCHOOL_BANK_ACCOUNT_NAME;
