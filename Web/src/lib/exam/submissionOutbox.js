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

/**
 * How long the outbox waits before trying a failed paper again.
 *
 * The first retry comes after a couple of seconds and each further failure
 * doubles the wait, up to five minutes — a server that is refusing everything
 * is not helped by being asked more often. Half of every wait is drawn at
 * random: a hall full of machines failed at the same moment for the same
 * reason, and if they all came back in step they would rebuild the spike that
 * knocked them over.
 */
export const RETRY_BASE_MS = 2_000;
export const RETRY_CEILING_MS = 5 * 60 * 1_000;

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
 * How long to wait before the next automatic attempt.
 *
 * @param {number} attempts Failures the paper has already had.
 * @param {() => number} random Injectable so a test can pin the jitter.
 */
export function retryDelay(attempts, random = Math.random) {
  const steady = Math.min(RETRY_BASE_MS * 2 ** Math.max(attempts, 0), RETRY_CEILING_MS);
  return Math.round(steady / 2 + random() * (steady / 2));
}

/**
 * When the outbox should try again, or null when it should not try at all.
 *
 * Null covers both an empty queue and one holding nothing but papers that have
 * used up their attempts, so the caller sets no timer rather than waking every
 * few seconds to find nothing to do. The wait is timed from the paper that has
 * been tried least, so a freshly queued one is not made to serve the sentence
 * of the one that has been failing all morning.
 */
export function nextRetryDelay(storage = safeStorage, random = Math.random) {
  const waiting = readRaw(storage).filter((item) => item.attempts < MAX_ATTEMPTS);
  if (waiting.length === 0) return null;

  return retryDelay(Math.min(...waiting.map((item) => item.attempts)), random);
}

/**
 * The flush currently running, and whether another was asked for while it ran.
 *
 * All four triggers can fire together — the app mounts, the browser announces
 * it is online, a paper is handed in, a student presses the retry button — and
 * two flushes reading the same snapshot would each find the same pending paper
 * and each send it. Module state rather than per-call, because the thing being
 * guarded is the queue in storage, which is shared by every caller.
 */
let inFlight = null;
let followUpRequested = false;

/**
 * Try to send everything waiting.
 *
 * A call that arrives while a flush is running does not start a second walk of
 * the queue: it asks the one already running to go round again when it is
 * done, and gets that same promise back. So a paper handed in mid-flight is
 * still sent, and however many callers arrived meanwhile it is one extra pass
 * rather than one per caller. `send` and `storage` are taken from whichever
 * call started the flush; in this app there is only one of each.
 *
 * @param {(result: object) => Promise<unknown>} send Usually the repository.
 * @returns {Promise<{ sent: number, failed: number, remaining: number }>}
 */
export function flushOutbox(send, { storage = safeStorage } = {}) {
  if (inFlight) {
    followUpRequested = true;
    return inFlight;
  }

  followUpRequested = false;

  // Deferred by one turn on purpose. `send` runs synchronously up to its own
  // first await, so calling drain here would let it send a paper — and let
  // anything it triggers call back in here — before this assignment had
  // happened, which is the guard being open at the one moment it matters.
  //
  // The slot is only cleared by the run that still owns it. Clearing it
  // unconditionally lets a run that settles late wipe the marker belonging to
  // the run after it, and the next caller — often `send` itself, handing in a
  // second paper — then finds the guard open and starts a second walk of the
  // same queue. Two walks write each other's stale snapshots back, so the
  // paper each has just sent reappears, and the outbox sends it for as long as
  // that lasts.
  const run = Promise.resolve()
    .then(() => drain(send, storage))
    .finally(() => { if (inFlight === run) inFlight = null; });

  inFlight = run;
  return run;
}

async function drain(send, storage) {
  let total = await sendPending(send, storage);

  while (followUpRequested) {
    followUpRequested = false;
    const again = await sendPending(send, storage);
    total = {
      sent: total.sent + again.sent,
      failed: total.failed + again.failed,
      remaining: again.remaining
    };
  }

  return total;
}

async function sendPending(send, storage) {
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
