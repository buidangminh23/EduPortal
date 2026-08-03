import { describe, it, expect } from 'vitest';
import { detectMentalHealthCrisis, getCrisisInterventionMessage } from './crisisDetector';
import { SUPPORT_HOTLINES } from '../../config/school';
import { SUPPORT_CONTACTS } from '../counseling/riskAssessment';

describe('detectMentalHealthCrisis', () => {
  it.each([
    'tự tử',
    'chết đi',
    'bế tắc quá',
    'muốn chết',
    'áp lực quá không chịu nổi',
    'trầm cảm',
    'tự hại',
    'không muốn sống',
  ])('flags the crisis keyword %j', (keyword) => {
    expect(detectMentalHealthCrisis(keyword)).toBe(true);
  });

  it('finds a keyword embedded in a longer sentence', () => {
    expect(detectMentalHealthCrisis('dạo này em thấy bế tắc quá thầy ạ')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(detectMentalHealthCrisis('MUỐN CHẾT')).toBe(true);
    expect(detectMentalHealthCrisis('Trầm Cảm')).toBe(true);
  });

  it('does not flag ordinary study talk', () => {
    expect(detectMentalHealthCrisis('em muốn ôn thi môn Toán')).toBe(false);
    expect(detectMentalHealthCrisis('bài này khó quá')).toBe(false);
  });

  it('handles empty and nullish input without throwing', () => {
    expect(detectMentalHealthCrisis('')).toBe(false);
    expect(detectMentalHealthCrisis(null)).toBe(false);
    expect(detectMentalHealthCrisis(undefined)).toBe(false);
  });
});

describe('getCrisisInterventionMessage', () => {
  it('marks the response as a crisis', () => {
    expect(getCrisisInterventionMessage().isCrisis).toBe(true);
  });

  // The hotline is the whole point of the intervention: if it is ever dropped or
  // mistyped during an edit, this test fails instead of shipping silently.
  it('includes the school counselling hotline', () => {
    expect(getCrisisInterventionMessage().message).toContain(SUPPORT_HOTLINES.counselling);
  });

  it('includes the national child protection line', () => {
    expect(getCrisisInterventionMessage().message).toContain(SUPPORT_HOTLINES.childProtection);
  });

  // A student in distress must not see a different number depending on which
  // screen they happened to open. These two paths were written months apart and
  // had already drifted once.
  it('prints the same numbers as the counselling tab', () => {
    expect(SUPPORT_CONTACTS.schoolHotline).toBe(SUPPORT_HOTLINES.counselling);
    expect(SUPPORT_CONTACTS.childProtectionHotline).toBe(SUPPORT_HOTLINES.childProtection);
  });

  it('points the student at the wellness section', () => {
    expect(getCrisisInterventionMessage().message).toContain('Góc Tâm Lý & Wellness');
  });
});
