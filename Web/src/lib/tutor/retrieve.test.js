/**
 * What this guards is not a scoring formula, it is an answer reaching a pupil.
 * Both defects below were live: one handed a child the wrong lesson, the other
 * refused a lesson the app was holding.
 */

import { describe, it, expect } from 'vitest';
import { retrieveBestEntry, matchEntryWithQuery } from './retrieve';
import { GDPT2018_BASE_KNOWLEDGE as KB } from '../../data/gdpt2018BaseKnowledge';

const topicFor = (q) => retrieveBestEntry(q, KB).entry?.topic ?? null;

describe('retrieval — the two that reached a pupil', () => {
  it('refuses a topic the store does not hold, instead of answering with a neighbour', () => {
    // `phuong trinh logarit` covered two of three tokens and won at 0.556.
    for (const q of ['phương trình bậc hai', 'giải phương trình bậc hai', 'công thức nghiệm phương trình bậc 2']) {
      expect(topicFor(q), q).toBeNull();
    }
  });

  it('finds a lesson whose name is entirely stop-words', () => {
    // `tich` and `phan` were both on the stop list, so "tích phân" filtered to
    // nothing and the integral lesson was unreachable.
    expect(topicFor('tích phân')).toBe('Tích phân và Nguyên hàm');
    expect(topicFor('nguyên hàm')).toBe('Tích phân và Nguyên hàm');
    expect(topicFor('cho em hỏi cách giải bài tập tích phân lớp 12 ạ')).toBe('Tích phân và Nguyên hàm');
  });

  it('does not let "bậc" reach the Việt Bắc poem', () => {
    // Vietnamese strips to the same ASCII: "bậc" and "Bắc" are both `bac`. With
    // `viet` on the stop list, all that was left of the trigger `viet bac` was
    // `bac`, so a maths question scored against a poem.
    const vietBac = KB.find(e => /Việt Bắc/.test(e.topic));
    expect(vietBac, 'the Việt Bắc lesson should exist').toBeTruthy();
    expect(matchEntryWithQuery('phương trình bậc hai', vietBac)).toBe(0);
    expect(matchEntryWithQuery('Việt Bắc', vietBac)).toBeGreaterThan(0);
  });
});

describe('retrieval — the questions that must keep working', () => {
  it.each([
    ['logarit', /Logarit/],
    ['phương trình logarit', /Logarit/],
    ['điều kiện xác định logarit', /Logarit/],
    ['đạo hàm', /Đạo hàm/],
    ['dao động điều hòa', /Dao động/],
    ['định lý Pitago', /Pitago/],
    ['thì hiện tại hoàn thành', /Hiện tại Hoàn thành/],
    ['phân tích tác phẩm Chí Phèo', /Chí Phèo/]
  ])('%s finds its lesson', (query, expected) => {
    expect(topicFor(query)).toMatch(expected);
  });

  it('says nothing rather than something, when asked nothing it knows', () => {
    expect(topicFor('hôm nay trời đẹp quá')).toBeNull();
    expect(topicFor('')).toBeNull();
    expect(topicFor('   ')).toBeNull();
  });
});

describe('matchEntryWithQuery — the gate itself', () => {
  const entry = { triggers: ['phuong trinh logarit', 'logarit'] };

  it('scores zero when the question never names the subject', () => {
    expect(matchEntryWithQuery('phương trình bậc hai', entry)).toBe(0);
  });

  it('scores when the question names it, however much else it says', () => {
    expect(matchEntryWithQuery('logarit', entry)).toBeGreaterThan(0);
    expect(matchEntryWithQuery('điều kiện xác định của logarit là gì', entry)).toBeGreaterThan(0);
  });

  it('prefers the trigger that accounts for more of the question', () => {
    const short = { triggers: ['logarit'] };
    const long = { triggers: ['phuong trinh logarit'] };
    const q = 'phương trình logarit';
    expect(matchEntryWithQuery(q, long)).toBeGreaterThan(matchEntryWithQuery(q, short));
  });

  it('survives an entry with no triggers', () => {
    expect(matchEntryWithQuery('logarit', {})).toBe(0);
    expect(matchEntryWithQuery('logarit', { triggers: [] })).toBe(0);
  });
});
