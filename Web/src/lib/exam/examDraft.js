/**
 * Keeps a paper alive across a crash.
 *
 * Exams are sat in the school's computer room, where a machine freezing, a
 * student hitting F5, or the power blinking are all ordinary events. Until now
 * the answers lived only in React state, so any of those wiped forty minutes
 * of work with nothing to recover. The draft below is written to the browser
 * after every answer, and read back when the tab opens again.
 *
 * The clock is deducted by wall time, not paused. Pausing would let a student
 * close the tab, think, and come back with the timer untouched; deducting
 * costs an interrupted student exactly the minutes their machine was down,
 * which is the honest reading of what happened. How many times a paper was
 * interrupted is recorded and travels with the result, so an invigilator can
 * see a reboot rather than guess at it.
 */

import { safeStorage } from '../safeStorage';

/** Bumped when the stored shape changes, so old drafts are ignored, not misread. */
export const DRAFT_VERSION = 1;

/**
 * Older than this and a draft is not a paper somebody is sitting — it is
 * yesterday's abandoned attempt, and offering to resume it would be confusing.
 */
export const MAX_DRAFT_AGE_MS = 12 * 60 * 60 * 1000;

export const DRAFT_STATUS = {
  NONE: 'none',
  STALE: 'stale',
  RESUMABLE: 'resumable',
  TIME_UP: 'time_up'
};

export const draftKey = (studentId) => `mock_exam_draft:${studentId || 'anon'}`;

/**
 * @param {object} args
 * @param {object} args.exam The exam being sat, stored whole: single-subject
 *   papers are derived from a block exam at start time and cannot be looked up
 *   again from an id alone.
 */
export function buildDraft({ exam, answers, secondsLeft, questionIndex = 0, startedAt, interruptions = 0, now = Date.now() }) {
  return {
    version: DRAFT_VERSION,
    exam,
    answers: answers || {},
    secondsLeft: Math.max(0, Math.floor(secondsLeft)),
    questionIndex,
    startedAt: startedAt || now,
    savedAt: now,
    interruptions
  };
}

export function saveDraft(studentId, draft, storage = safeStorage) {
  try {
    storage.setItem(draftKey(studentId), JSON.stringify(draft));
    return true;
  } catch {
    // A full quota must not take the exam down with it. The student keeps
    // working from memory in the tab; only the safety net is missing.
    return false;
  }
}

export function clearDraft(studentId, storage = safeStorage) {
  try {
    storage.removeItem(draftKey(studentId));
  } catch {
    // Nothing to do: a draft we cannot delete is one the age check will drop.
  }
}

function parse(raw) {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw);
    if (draft?.version !== DRAFT_VERSION) return null;
    if (!draft.exam?.questions?.length) return null;
    if (typeof draft.secondsLeft !== 'number' || !Number.isFinite(draft.secondsLeft)) return null;
    if (typeof draft.savedAt !== 'number') return null;
    return { ...draft, answers: draft.answers && typeof draft.answers === 'object' ? draft.answers : {} };
  } catch {
    return null;
  }
}

/**
 * @returns {{ status: string, draft?: object, secondsLeft?: number, interruptions?: number, awayMs?: number }}
 *   `TIME_UP` means the clock ran out while the machine was off: the saved
 *   answers are still the student's work and should be submitted, not thrown
 *   away for the sake of a deadline they were not at the keyboard for.
 */
export function readDraft(studentId, { now = Date.now(), storage = safeStorage } = {}) {
  let raw;
  try {
    raw = storage.getItem(draftKey(studentId));
  } catch {
    return { status: DRAFT_STATUS.NONE };
  }

  const draft = parse(raw);
  if (!draft) {
    if (raw) clearDraft(studentId, storage);
    return { status: DRAFT_STATUS.NONE };
  }

  const awayMs = Math.max(0, now - draft.savedAt);
  if (now - draft.startedAt > MAX_DRAFT_AGE_MS) {
    clearDraft(studentId, storage);
    return { status: DRAFT_STATUS.STALE };
  }

  const secondsLeft = Math.max(0, draft.secondsLeft - Math.floor(awayMs / 1000));
  const interruptions = draft.interruptions + 1;

  return {
    status: secondsLeft > 0 ? DRAFT_STATUS.RESUMABLE : DRAFT_STATUS.TIME_UP,
    draft,
    secondsLeft,
    interruptions,
    awayMs
  };
}

/** "12 phút 30 giây" — for the sentence offering the paper back. */
export function describeRemaining(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  if (minutes === 0) return `${rest} giây`;
  return rest === 0 ? `${minutes} phút` : `${minutes} phút ${rest} giây`;
}
