import { describe, it, expect } from 'vitest';
import { expandAbbreviations, normalizeVietnameseText, tokenizeText } from './normalize';

describe('expandAbbreviations', () => {
  it('expands standalone chat shorthand', () => {
    expect(expandAbbreviations('ko hieu bai')).toBe('không hieu bai');
    expect(expandAbbreviations('lam ntn vay')).toBe('lam như thế nào vay');
    expect(expandAbbreviations('tp nay cua tg nao')).toBe('tác phẩm nay cua tác giả nao');
  });

  // Regression: `\b` treats an accented letter as a word boundary, so the old
  // `\bk\b` rule rewrote the "k" inside "kết" and every keyword lookup built on
  // this text silently matched the wrong thing.
  it.each([
    ['kết thúc', 'kết thúc'],
    ['kỳ thi sắp tới', 'kỳ thi sắp tới'],
    ['kỹ năng học tập', 'kỹ năng học tập'],
    ['em kể thầy nghe', 'em kể thầy nghe'],
    ['điểm kém', 'điểm kém']
  ])('leaves the Vietnamese word %j alone', (input, expected) => {
    expect(expandAbbreviations(input)).toBe(expected);
  });

  it('still expands the shorthand when it stands alone', () => {
    expect(expandAbbreviations('k biet lam')).toBe('không biet lam');
    expect(expandAbbreviations('bai nay k kho')).toBe('bai nay không kho');
  });

  it('does not touch shorthand glued to another word', () => {
    expect(expandAbbreviations('kmeo')).toBe('kmeo');
    expect(expandAbbreviations('tphcm')).toBe('tphcm');
  });

  it('handles empty input', () => {
    expect(expandAbbreviations('')).toBe('');
    expect(expandAbbreviations(null)).toBe('');
  });
});

describe('normalizeVietnameseText', () => {
  it('strips diacritics', () => {
    expect(normalizeVietnameseText('Áp lực thi cử')).toBe('ap luc thi cu');
  });

  // "đ" is a distinct letter that NFD does not decompose, so it used to survive
  // normalisation and never matched what a student types without diacritics.
  it.each([
    ['em định tự tử', 'em dinh tu tu'],
    ['đau đầu quá', 'dau dau qua'],
    ['không đủ thời gian', 'khong du thoi gian'],
    ['Đại học Bách khoa', 'dai hoc bach khoa']
  ])('folds đ to d in %j', (input, expected) => {
    expect(normalizeVietnameseText(input)).toBe(expected);
  });

  it('keeps multi-word phrases intact after cleaning', () => {
    expect(normalizeVietnameseText('em muốn kết thúc tất cả')).toBe('em muon ket thuc tat ca');
  });

  it('turns punctuation into separators', () => {
    expect(normalizeVietnameseText('mệt quá!!! không ngủ được...')).toBe('met qua khong ngu duoc');
  });

  it('handles empty input', () => {
    expect(normalizeVietnameseText('')).toBe('');
    expect(normalizeVietnameseText(null)).toBe('');
  });
});

describe('tokenizeText', () => {
  it('produces unigrams and bigrams', () => {
    const { unigrams, bigrams } = tokenizeText('phương pháp học tập hiệu quả');

    expect(unigrams.length).toBeGreaterThan(0);
    expect(bigrams.some(b => b.includes(' '))).toBe(true);
  });

  it('returns empty structures for empty input', () => {
    expect(tokenizeText('')).toEqual({ unigrams: [], bigrams: [], rawTokens: [] });
  });
});
