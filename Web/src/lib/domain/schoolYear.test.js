import { describe, it, expect } from 'vitest';
import {
  SCHOOL_YEAR_START_MONTH,
  currentSchoolYear,
  isValidSchoolYear,
  schoolYearOf
} from './schoolYear';

/**
 * Every case is written out as a date and the năm học a teacher would file it
 * under, both spelled in full. Recomputing the expectation from the module's
 * own rule would only prove the module agrees with itself, and would keep
 * agreeing after the rule was changed by mistake.
 */
const DATE_TO_SCHOOL_YEAR = [
  // ── The năm học that opens in September 2025 ────────────────────────────
  ['2025-09-01', '2025-2026'], // first day of the năm học
  ['2025-09-05', '2025-2026'], // khai giảng
  ['2025-10-20', '2025-2026'],
  ['2025-11-20', '2025-2026'],
  ['2025-12-31', '2025-2026'], // học kỳ I straddles the new year: last day of 2025…
  ['2026-01-01', '2025-2026'], // …and the first of 2026 is still the same năm học
  ['2026-01-15', '2025-2026'],
  ['2026-03-26', '2025-2026'],
  ['2026-05-25', '2025-2026'],
  ['2026-06-03', '2025-2026'], // the day the bundled demo dataset describes
  ['2026-07-31', '2025-2026'], // summer: the năm học that is ending
  ['2026-08-01', '2025-2026'], // rèn luyện trong hè, Điều 13 khoản 3
  ['2026-08-31', '2025-2026'], // the last day before the boundary

  // ── The next năm học ───────────────────────────────────────────────────
  ['2026-09-01', '2026-2027'], // the first day on the other side of it
  ['2026-12-31', '2026-2027'],
  ['2027-01-01', '2026-2027'],
  ['2027-08-31', '2026-2027'],

  // ── Leap days, which the boundary must not stumble over ────────────────
  ['2024-02-29', '2023-2024'],
  ['2028-02-29', '2027-2028'],

  // ── The same boundary in other years, so nothing is special about 2025 ──
  ['2022-08-31', '2021-2022'],
  ['2022-09-01', '2022-2023'],
  ['2030-08-31', '2029-2030'],
  ['2030-09-01', '2030-2031']
];

/** The table's date as a Date built from local calendar parts. */
const localDateOf = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

describe('SCHOOL_YEAR_START_MONTH', () => {
  it('is September', () => {
    // Asserted as a literal, not read back from the module's own arithmetic.
    // A school on a different calendar changes this line and the table above
    // together; changing one alone should turn this suite red.
    expect(SCHOOL_YEAR_START_MONTH).toBe(9);
  });
});

describe('schoolYearOf', () => {
  it.each(DATE_TO_SCHOOL_YEAR)('files %s under năm học %s', (iso, expected) => {
    expect(schoolYearOf(iso)).toBe(expected);
  });

  it.each(DATE_TO_SCHOOL_YEAR)('files the Date for %s under năm học %s', (iso, expected) => {
    expect(schoolYearOf(localDateOf(iso))).toBe(expected);
  });

  it('produces năm học it would itself accept as stored values', () => {
    DATE_TO_SCHOOL_YEAR.forEach(([, expected]) => {
      expect(isValidSchoolYear(expected)).toBe(true);
    });
  });

  describe('the boundary the whole feature turns on', () => {
    it('gives 31 August to the năm học that is ending', () => {
      expect(schoolYearOf('2026-08-31')).toBe('2025-2026');
    });

    it('gives 1 September to the năm học that is beginning', () => {
      expect(schoolYearOf('2026-09-01')).toBe('2026-2027');
    });

    it('splits the two adjacent days, so no day belongs to both or neither', () => {
      // A mark entered on the last day of the hè retake window and one entered
      // on the first day of the new năm học must not share a row: the pair
      // (student, subject, semester, school_year) is what keeps lớp 11 from
      // overwriting lớp 10.
      expect(schoolYearOf('2026-08-31')).not.toBe(schoolYearOf('2026-09-01'));
    });

    it('holds at the very edges of those two days, not just at midday', () => {
      expect(schoolYearOf(new Date(2026, 7, 31, 23, 59, 59, 999))).toBe('2025-2026');
      expect(schoolYearOf(new Date(2026, 8, 1, 0, 0, 0, 0))).toBe('2026-2027');
    });
  });

  describe('reading a date the way the school reads it', () => {
    it('reads a YYYY-MM-DD string as the local day it names', () => {
      // `new Date('2026-09-01')` is UTC midnight, which is 31 August in every
      // timezone west of Greenwich — and 31 August is the previous năm học.
      // The string path must not depend on where the machine is.
      expect(schoolYearOf('2026-09-01')).toBe(schoolYearOf(new Date(2026, 8, 1)));
    });

    it('reads a Date by its local calendar fields', () => {
      expect(schoolYearOf(new Date(2026, 8, 1, 6, 30))).toBe('2026-2027');
      expect(schoolYearOf(new Date(2026, 7, 31, 18, 45))).toBe('2025-2026');
    });
  });

  describe('refusing rather than guessing', () => {
    it('refuses a date that does not exist', () => {
      expect(schoolYearOf('2026-02-30')).toBeNull();
      expect(schoolYearOf('2023-02-29')).toBeNull();
      expect(schoolYearOf('2026-13-01')).toBeNull();
    });

    it('refuses a date that is not written YYYY-MM-DD', () => {
      expect(schoolYearOf('01/09/2026')).toBeNull();
      expect(schoolYearOf('2026-9-1')).toBeNull();
      expect(schoolYearOf('2026-09')).toBeNull();
    });

    it('refuses a timestamp, whose time zone it cannot know', () => {
      // Accepting the date part would file a UTC instant under a local day.
      expect(schoolYearOf('2026-09-01T00:30:00Z')).toBeNull();
    });

    it('refuses an invalid Date object', () => {
      expect(schoolYearOf(new Date('không phải ngày'))).toBeNull();
    });

    it('refuses nothing at all, rather than filing it under this year', () => {
      expect(schoolYearOf(null)).toBeNull();
      expect(schoolYearOf(undefined)).toBeNull();
      expect(schoolYearOf('')).toBeNull();
      expect(schoolYearOf(2026)).toBeNull();
      expect(schoolYearOf({ year: 2026 })).toBeNull();
    });
  });
});

describe('currentSchoolYear', () => {
  it.each(DATE_TO_SCHOOL_YEAR)('stamps a record written on %s as %s', (iso, expected) => {
    expect(currentSchoolYear(iso)).toBe(expected);
  });

  it('falls back to the clock, and what the clock gives is storable', () => {
    // The value cannot be asserted without freezing time, but it can be held to
    // the shape every column and uniqueness constraint expects.
    expect(isValidSchoolYear(currentSchoolYear())).toBe(true);
  });

  it('agrees with schoolYearOf, so a stamped write and a filtered read match', () => {
    // The write stamps with currentSchoolYear and the query filters with
    // schoolYearOf. If the two ever disagreed, a teacher would enter a mark and
    // then not find it.
    DATE_TO_SCHOOL_YEAR.forEach(([iso]) => {
      expect(currentSchoolYear(iso)).toBe(schoolYearOf(iso));
    });
  });

  it('refuses a date it cannot read, the same as schoolYearOf', () => {
    expect(currentSchoolYear('hôm nay')).toBeNull();
    expect(currentSchoolYear(null)).toBeNull();
  });
});

describe('isValidSchoolYear', () => {
  it('accepts a năm học written the one way this app writes it', () => {
    expect(isValidSchoolYear('2025-2026')).toBe(true);
    expect(isValidSchoolYear('2026-2027')).toBe(true);
    expect(isValidSchoolYear('1999-2000')).toBe(true); // the century rolls over
  });

  it('rejects a span longer than one year', () => {
    expect(isValidSchoolYear('2025-2027')).toBe(false);
    expect(isValidSchoolYear('2020-2026')).toBe(false);
  });

  it('rejects a span that runs backwards', () => {
    expect(isValidSchoolYear('2026-2025')).toBe(false);
    expect(isValidSchoolYear('2026-2024')).toBe(false);
  });

  it('rejects the same year twice', () => {
    expect(isValidSchoolYear('2026-2026')).toBe(false);
  });

  it('rejects the display spellings the UI already uses', () => {
    // These appear in bản tin and on the calendar. If one were ever stored it
    // would not collide with '2025-2026' in the uniqueness constraint, and the
    // same pupil would carry two rows for one môn, one học kỳ.
    expect(isValidSchoolYear('2025 - 2026')).toBe(false);
    expect(isValidSchoolYear('2025–2026')).toBe(false); // en dash
    expect(isValidSchoolYear('Năm học 2025-2026')).toBe(false);
    expect(isValidSchoolYear(' 2025-2026')).toBe(false);
    expect(isValidSchoolYear('2025-2026 ')).toBe(false);
    expect(isValidSchoolYear('2025-2026\n')).toBe(false);
  });

  it('rejects two-digit and other short forms', () => {
    expect(isValidSchoolYear('25-26')).toBe(false);
    expect(isValidSchoolYear('2025-26')).toBe(false);
    expect(isValidSchoolYear('2025')).toBe(false);
  });

  it('rejects a year that is a number rather than a name', () => {
    // school_year is TEXT. A number here would be a caller that decided to do
    // arithmetic on a name.
    expect(isValidSchoolYear(2025)).toBe(false);
    expect(isValidSchoolYear(20252026)).toBe(false);
  });

  it('rejects nothing recorded, because the column is NOT NULL', () => {
    expect(isValidSchoolYear(null)).toBe(false);
    expect(isValidSchoolYear(undefined)).toBe(false);
    expect(isValidSchoolYear('')).toBe(false);
  });
});
