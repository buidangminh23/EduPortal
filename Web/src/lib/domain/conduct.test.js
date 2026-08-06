import { describe, it, expect } from 'vitest';
import {
  CONDUCT_BANDS,
  CONDUCT_SEMESTERS,
  applyConductResult,
  conductBandForYear,
  isValidConductBand,
  readConductBand,
  readConductYearBand
} from './conduct';
import { LEARNING_BAND, TITLE, classifyTitle } from './grading';

const { GOOD, FAIR, PASS, FAIL } = LEARNING_BAND;

/** A student carrying the two semester mức given. */
const studentWith = (semester1, semester2) => ({
  id: 'HS001',
  name: 'Nguyễn Hoàng Nam',
  conductResults: { semester1, semester2 }
});

describe('CONDUCT_BANDS', () => {
  it('is exactly the four mức of Điều 8 khoản 2, sharing the learning enum', () => {
    expect(CONDUCT_BANDS).toEqual([GOOD, FAIR, PASS, FAIL]);
  });

  it('holds nothing the danh hiệu rule would fail to recognise', () => {
    // classifyTitle compares the conduct band to LEARNING_BAND.GOOD by value.
    // A separate enum spelling "Tốt" its own way would break every danh hiệu.
    const awarded = classifyTitle({
      learningBand: GOOD,
      conductBand: CONDUCT_BANDS[0],
      yearAverages: [8, 8, 8, 8, 8, 8]
    });
    expect(awarded).toBe(TITLE.GOOD);
  });
});

describe('isValidConductBand', () => {
  it('accepts the four mức', () => {
    CONDUCT_BANDS.forEach((band) => expect(isValidConductBand(band)).toBe(true));
  });

  it('accepts nothing recorded yet', () => {
    expect(isValidConductBand(null)).toBe(true);
    expect(isValidConductBand(undefined)).toBe(true);
  });

  it('rejects the school-invented labels that used to reach report cards', () => {
    expect(isValidConductBand('Cần cố gắng')).toBe(false);
    expect(isValidConductBand('Trung bình')).toBe(false);
    expect(isValidConductBand('Yếu')).toBe(false);
  });
});

describe('readConductBand', () => {
  it('returns the mức the teacher recorded', () => {
    const student = studentWith(GOOD, FAIR);
    expect(readConductBand(student, 'semester1')).toBe(GOOD);
    expect(readConductBand(student, 'semester2')).toBe(FAIR);
  });

  it('returns null rather than a default when nobody has assessed the semester', () => {
    expect(readConductBand(studentWith(null, null), 'semester1')).toBeNull();
    expect(readConductBand({ id: 'HS002' }, 'semester2')).toBeNull();
    expect(readConductBand(null, 'semester1')).toBeNull();
    expect(readConductBand(undefined, 'semester1')).toBeNull();
  });

  it('returns null for a stored value outside the four mức', () => {
    const legacy = { conductResults: { semester1: 'Cần cố gắng' } };
    expect(readConductBand(legacy, 'semester1')).toBeNull();
  });

  it('returns null for a semester key that does not exist', () => {
    expect(readConductBand(studentWith(GOOD, GOOD), 'semester3')).toBeNull();
    expect(readConductBand(studentWith(GOOD, GOOD), 'year')).toBeNull();
  });
});

describe('conductBandForYear', () => {
  // Every cell of Điều 8 khoản 2 điểm b, written out rather than derived, so
  // the table can be read against the circular line by line.
  const cases = [
    [GOOD, GOOD, GOOD],
    [GOOD, FAIR, FAIR],
    [GOOD, PASS, FAIR],
    [GOOD, FAIL, FAIL],
    [FAIR, GOOD, GOOD],
    [FAIR, FAIR, FAIR],
    [FAIR, PASS, PASS],
    [FAIR, FAIL, FAIL],
    [PASS, GOOD, FAIR],
    [PASS, FAIR, FAIR],
    [PASS, PASS, PASS],
    [PASS, FAIL, FAIL],
    [FAIL, GOOD, FAIR],
    [FAIL, FAIR, PASS],
    [FAIL, PASS, PASS],
    [FAIL, FAIL, FAIL]
  ];

  it.each(cases)('HKI %s + HKII %s gives %s cả năm', (first, second, expected) => {
    expect(conductBandForYear(first, second)).toBe(expected);
  });

  it('covers all sixteen combinations of the two semesters', () => {
    expect(cases).toHaveLength(CONDUCT_BANDS.length * CONDUCT_BANDS.length);
  });

  it('never lets a strong first semester carry a failed second one', () => {
    expect(conductBandForYear(GOOD, FAIL)).toBe(FAIL);
  });

  it('has no year result while either semester is unassessed', () => {
    expect(conductBandForYear(null, GOOD)).toBeNull();
    expect(conductBandForYear(GOOD, null)).toBeNull();
    expect(conductBandForYear(null, null)).toBeNull();
    expect(conductBandForYear(undefined, undefined)).toBeNull();
  });

  it('has no year result for a value outside the four mức', () => {
    expect(conductBandForYear('Cần cố gắng', GOOD)).toBeNull();
  });
});

describe('readConductYearBand', () => {
  it('derives the year from both recorded semesters', () => {
    expect(readConductYearBand(studentWith(FAIR, GOOD))).toBe(GOOD);
    expect(readConductYearBand(studentWith(FAIL, FAIR))).toBe(PASS);
  });

  it('is null while semester II is still open', () => {
    expect(readConductYearBand(studentWith(GOOD, null))).toBeNull();
  });

  it('is null for a student nobody has assessed', () => {
    expect(readConductYearBand({ id: 'HS009' })).toBeNull();
  });
});

describe('applyConductResult', () => {
  it('records a mức for one semester', () => {
    const { student, errors } = applyConductResult({ id: 'HS001' }, 'semester1', GOOD);
    expect(errors).toEqual([]);
    expect(readConductBand(student, 'semester1')).toBe(GOOD);
  });

  it('leaves the other semester alone', () => {
    const { student } = applyConductResult(studentWith(FAIR, null), 'semester2', PASS);
    expect(readConductBand(student, 'semester1')).toBe(FAIR);
    expect(readConductBand(student, 'semester2')).toBe(PASS);
  });

  it('clears an entry when passed null, so a mistake can be undone', () => {
    const { student, errors } = applyConductResult(studentWith(GOOD, GOOD), 'semester1', null);
    expect(errors).toEqual([]);
    expect(readConductBand(student, 'semester1')).toBeNull();
    expect(readConductYearBand(student)).toBeNull();
  });

  it('keeps the rest of the student record', () => {
    const before = { id: 'HS001', name: 'Nguyễn Hoàng Nam', grades: { Math: 8.5 } };
    const { student } = applyConductResult(before, 'semester2', FAIR);
    expect(student.name).toBe('Nguyễn Hoàng Nam');
    expect(student.grades).toEqual({ Math: 8.5 });
  });

  it('does not mutate the student it was given', () => {
    const before = studentWith(GOOD, null);
    applyConductResult(before, 'semester2', FAIL);
    expect(before.conductResults.semester2).toBeNull();
  });

  it('rejects a band outside the four mức and changes nothing', () => {
    const before = studentWith(GOOD, null);
    const { student, errors } = applyConductResult(before, 'semester2', 'Cần cố gắng');
    expect(errors).toHaveLength(1);
    expect(student).toBe(before);
  });

  it('rejects an unknown semester and changes nothing', () => {
    const before = studentWith(GOOD, FAIR);
    const { student, errors } = applyConductResult(before, 'semester3', GOOD);
    expect(errors).toEqual(['Học kỳ không hợp lệ.']);
    expect(student).toBe(before);
  });

  it('accepts every semester key the module publishes', () => {
    CONDUCT_SEMESTERS.forEach((semester) => {
      expect(applyConductResult({}, semester, PASS).errors).toEqual([]);
    });
  });
});

describe('the danh hiệu that conduct finally unlocks', () => {
  const straightNines = Array.from({ length: 6 }, () => 9.2);

  it('awards Xuất sắc once the GVCN records Tốt for both semesters', () => {
    let student = { id: 'HS001' };
    student = applyConductResult(student, 'semester1', GOOD).student;
    student = applyConductResult(student, 'semester2', GOOD).student;

    expect(classifyTitle({
      learningBand: GOOD,
      conductBand: readConductYearBand(student),
      yearAverages: straightNines
    })).toBe(TITLE.EXCELLENT);
  });

  it('awards nothing while the conduct result is still unassessed', () => {
    expect(classifyTitle({
      learningBand: GOOD,
      conductBand: readConductYearBand({ id: 'HS001' }),
      yearAverages: straightNines
    })).toBeNull();
  });
});
