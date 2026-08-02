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
const DEMO_SCHOOL_SHORT_NAME = 'THPT Nguyễn Du';
const DEMO_SCHOOL_DOMAIN = 'school.edu.vn';

const read = (value, fallback) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed === '' ? fallback : trimmed;
};

const name = read(env.VITE_SCHOOL_NAME, DEMO_SCHOOL_NAME);

export const SCHOOL = {
  name,
  city: read(env.VITE_SCHOOL_CITY, 'HA NOI'),

  /**
   * What fits in a header beside the logo. When only the full name is set,
   * dropping the leading "Trường" gives something usable without asking the
   * deployer for a second variable they will forget.
   */
  shortName: read(
    env.VITE_SCHOOL_SHORT_NAME,
    name === DEMO_SCHOOL_NAME ? DEMO_SCHOOL_SHORT_NAME : name.replace(/^Trường\s+/i, '')
  ),

  /**
   * The school's own domain. Used to build addresses that look like the
   * school's instead of a placeholder — never to decide access, which is
   * Supabase's job. A domain in a string is not a credential.
   */
  domain: read(env.VITE_SCHOOL_DOMAIN, DEMO_SCHOOL_DOMAIN),

  /** The school's existing public site, if any. Empty means "no link". */
  website: read(env.VITE_SCHOOL_WEBSITE, ''),

  /**
   * How to reach the school. Published on the public homepage, so a wrong
   * value sends parents to another institution — the demo footer carried a
   * Ho Chi Minh City address and an 028 phone number, which is the wrong city
   * for most schools that would ever see it. Empty means "do not show this
   * line" rather than "show a placeholder".
   */
  address: read(env.VITE_SCHOOL_ADDRESS, ''),
  phone: read(env.VITE_SCHOOL_PHONE, ''),
  email: read(env.VITE_SCHOOL_EMAIL, ''),

  /** One sentence about the school, shown in the footer. */
  tagline: read(env.VITE_SCHOOL_TAGLINE, ''),

  /** True while the school identity is still the built-in demo one. */
  isDemoSchool: read(env.VITE_SCHOOL_NAME, '') === ''
};

/** Builds an address at the school's domain: `emailAt('triet.nm')`. */
export function emailAt(localPart) {
  return `${localPart}@${SCHOOL.domain}`;
}

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
