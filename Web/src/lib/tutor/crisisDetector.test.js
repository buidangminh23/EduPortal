import { describe, it, expect } from 'vitest';
import { detectMentalHealthCrisis, getCrisisInterventionMessage } from './crisisDetector';

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
    expect(getCrisisInterventionMessage().message).toContain('1800 1567');
  });

  it('points the student at the wellness section', () => {
    expect(getCrisisInterventionMessage().message).toContain('Góc Tâm Lý & Wellness');
  });
});
