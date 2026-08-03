/**
 * Papers waiting to reach the database.
 *
 * A thousand students hand in within the same two minutes, over a school
 * network, to a server in the next room. Most of the time that is instant.
 * The rest of the time — a switch hiccups, wifi drops, the server is busy —
 * a paper that was only ever sent once is a paper nobody can mark.
 *
 * So handing in writes to this outbox first, in the browser, and the send is
 * retried until the database confirms it. The student sees their result
 * immediately either way: the marking already happened on their machine, and
 * the outbox is about the record, not the score.
 */

import { safeStorage } from '../safeStorage';

export const OUTBOX_KEY = 'mock_exam_outbox';

/**
 * After this many failures a paper stops being retried automatically.
 *
 * Not because it should be dropped — it stays in the outbox and stays visible
 * — but because a paper that has failed ten times is failing for a reason no
 * eleventh attempt will fix, and hammering a struggling server with a thousand
 * of them makes the outage worse.
 */
export const MAX_ATTEMPTS = 10;

function readRaw(storage) {
  try {
    const raw = storage.getItem(OUTBOX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(storage, items) {
  try {
    storage.setItem(OUTBOX_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export const listOutbox = (storage = safeStorage) => readRaw(storage);

export const pendingCount = (storage = safeStorage) =>
  readRaw(storage).filter((item) => item.attempts < MAX_ATTEMPTS).length;

export const stuckCount = (storage = safeStorage) =>
  readRaw(storage).filter((item) => item.attempts >= MAX_ATTEMPTS).length;

/**
 * @returns {object} The queued item, carrying the localId the screens use as a
 *   key until the database gives it a real one.
 */
export function enqueue(result, { storage = safeStorage, now = Date.now() } = {}) {
  const localId = `local-${now}-${Math.random().toString(36).slice(2, 8)}`;
  const item = {
    localId,
    // Stamped onto the paper as well, so the row the browser store writes and
    // the row the screen is already showing carry the same id and a reload
    // does not display one sitting twice.
    result: { ...result, localId },
    attempts: 0,
    lastError: null,
    queuedAt: new Date(now).toISOString()
  };

  write(storage, [...readRaw(storage), item]);
  return item;
}

export function removeFromOutbox(localId, storage = safeStorage) {
  write(storage, readRaw(storage).filter((item) => item.localId !== localId));
}

/**
 * Try to send everything waiting.
 *
 * @param {(result: object) => Promise<unknown>} send Usually the repository.
 * @returns {Promise<{ sent: number, failed: number, remaining: number }>}
 */
export async function flushOutbox(send, { storage = safeStorage } = {}) {
  const items = readRaw(storage);
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    if (item.attempts >= MAX_ATTEMPTS) continue;

    try {
      await send(item.result);
      // Re-read on every step: the student may have handed in another paper
      // while this one was in flight, and writing back a stale list would
      // throw that one away.
      write(storage, readRaw(storage).filter((row) => row.localId !== item.localId));
      sent += 1;
    } catch (error) {
      failed += 1;
      write(storage, readRaw(storage).map((row) => (
        row.localId === item.localId
          ? { ...row, attempts: row.attempts + 1, lastError: error?.message || 'Lỗi không rõ.' }
          : row
      )));
    }
  }

  return { sent, failed, remaining: readRaw(storage).length };
}

/** Wipes the outbox. Only for tests and for a support person who has decided. */
export function clearOutbox(storage = safeStorage) {
  write(storage, []);
}
