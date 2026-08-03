import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildDraft,
  saveDraft,
  readDraft,
  clearDraft,
  draftKey,
  describeRemaining,
  DRAFT_STATUS,
  DRAFT_VERSION,
  MAX_DRAFT_AGE_MS
} from './examDraft';

/** Stands in for localStorage, and can be made to fail like a full one. */
function memoryStorage({ failOnWrite = false } = {}) {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      if (failOnWrite) throw new Error('QuotaExceededError');
      map.set(key, value);
    },
    removeItem: (key) => map.delete(key)
  };
}

const EXAM = {
  id: 'A00_full',
  title: 'Đề thi thử khối A00',
  duration: 50,
  questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }]
};

const NOW = Date.parse('2026-08-03T07:00:00.000Z');
const sit = (over = {}) => buildDraft({
  exam: EXAM,
  answers: { q1: 'A' },
  secondsLeft: 1800,
  questionIndex: 1,
  startedAt: NOW,
  now: NOW,
  ...over
});

let storage;
beforeEach(() => { storage = memoryStorage(); });

describe('saveDraft / readDraft', () => {
  it('hands the paper back with the answers still on it', () => {
    saveDraft('HS001', sit(), storage);
    const found = readDraft('HS001', { now: NOW + 1000, storage });

    expect(found.status).toBe(DRAFT_STATUS.RESUMABLE);
    expect(found.draft.answers).toEqual({ q1: 'A' });
    expect(found.draft.questionIndex).toBe(1);
    expect(found.draft.exam.id).toBe('A00_full');
  });

  it('keeps one draft per student', () => {
    saveDraft('HS001', sit(), storage);
    saveDraft('HS002', sit({ answers: { q1: 'B' } }), storage);

    expect(readDraft('HS001', { now: NOW, storage }).draft.answers).toEqual({ q1: 'A' });
    expect(readDraft('HS002', { now: NOW, storage }).draft.answers).toEqual({ q1: 'B' });
    expect(draftKey('HS001')).not.toBe(draftKey('HS002'));
  });

  it('reports nothing when the student has no paper open', () => {
    expect(readDraft('HS001', { now: NOW, storage })).toEqual({ status: DRAFT_STATUS.NONE });
  });
});

describe('the clock', () => {
  it('charges the student the minutes their machine was down', () => {
    saveDraft('HS001', sit({ secondsLeft: 1800 }), storage);
    const found = readDraft('HS001', { now: NOW + 300_000, storage }); // 5 phút

    expect(found.secondsLeft).toBe(1500);
  });

  it('does not stop the clock just because the tab was closed', () => {
    saveDraft('HS001', sit({ secondsLeft: 600 }), storage);
    const found = readDraft('HS001', { now: NOW + 60_000, storage });

    expect(found.secondsLeft).toBeLessThan(600);
  });

  it('submits what was written rather than discarding a paper whose time ran out while away', () => {
    saveDraft('HS001', sit({ secondsLeft: 120, answers: { q1: 'A', q2: 'C' } }), storage);
    const found = readDraft('HS001', { now: NOW + 600_000, storage });

    expect(found.status).toBe(DRAFT_STATUS.TIME_UP);
    expect(found.secondsLeft).toBe(0);
    expect(found.draft.answers).toEqual({ q1: 'A', q2: 'C' });
  });

  it('counts how many times the paper was interrupted', () => {
    saveDraft('HS001', sit({ interruptions: 0 }), storage);
    const first = readDraft('HS001', { now: NOW + 1000, storage });
    expect(first.interruptions).toBe(1);

    saveDraft('HS001', sit({ interruptions: first.interruptions }), storage);
    expect(readDraft('HS001', { now: NOW + 2000, storage }).interruptions).toBe(2);
  });
});

describe('drafts that must not come back', () => {
  it('drops one from a previous day', () => {
    saveDraft('HS001', sit(), storage);
    const found = readDraft('HS001', { now: NOW + MAX_DRAFT_AGE_MS + 1000, storage });

    expect(found.status).toBe(DRAFT_STATUS.STALE);
    expect(storage.map.size).toBe(0);
  });

  it('drops one written by an older version of the app', () => {
    storage.setItem(draftKey('HS001'), JSON.stringify({ ...sit(), version: DRAFT_VERSION + 1 }));

    expect(readDraft('HS001', { now: NOW, storage }).status).toBe(DRAFT_STATUS.NONE);
  });

  it('drops corrupt json instead of crashing the exam screen', () => {
    storage.setItem(draftKey('HS001'), '{not json');

    expect(readDraft('HS001', { now: NOW, storage }).status).toBe(DRAFT_STATUS.NONE);
    expect(storage.map.size).toBe(0);
  });

  it('drops a draft with no questions, which could not be sat anyway', () => {
    storage.setItem(draftKey('HS001'), JSON.stringify(sit({ exam: { ...EXAM, questions: [] } })));

    expect(readDraft('HS001', { now: NOW, storage }).status).toBe(DRAFT_STATUS.NONE);
  });
});

describe('when the browser refuses to store', () => {
  it('says so instead of throwing into the middle of an exam', () => {
    const full = memoryStorage({ failOnWrite: true });

    expect(saveDraft('HS001', sit(), full)).toBe(false);
  });

  it('reads as "no draft" rather than crashing when storage is unreadable', () => {
    const broken = { getItem() { throw new Error('blocked'); }, setItem() {}, removeItem() {} };

    expect(readDraft('HS001', { now: NOW, storage: broken })).toEqual({ status: DRAFT_STATUS.NONE });
  });
});

describe('clearDraft', () => {
  it('removes the paper once it has been handed in', () => {
    saveDraft('HS001', sit(), storage);
    clearDraft('HS001', storage);

    expect(readDraft('HS001', { now: NOW, storage }).status).toBe(DRAFT_STATUS.NONE);
  });
});

describe('describeRemaining', () => {
  it('reads like a person said it', () => {
    expect(describeRemaining(750)).toBe('12 phút 30 giây');
    expect(describeRemaining(600)).toBe('10 phút');
    expect(describeRemaining(45)).toBe('45 giây');
    expect(describeRemaining(-5)).toBe('0 giây');
  });
});
