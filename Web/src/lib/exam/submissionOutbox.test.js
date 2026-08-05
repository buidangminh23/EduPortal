import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueue,
  listOutbox,
  flushOutbox,
  removeFromOutbox,
  clearOutbox,
  pendingCount,
  stuckCount,
  retryDelay,
  nextRetryDelay,
  OUTBOX_KEY,
  MAX_ATTEMPTS,
  RETRY_BASE_MS,
  RETRY_CEILING_MS
} from './submissionOutbox';

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

const paper = (over = {}) => ({ studentId: 'HS001', examId: 'A00', score: 24.5, ...over });

let storage;
beforeEach(() => { storage = memoryStorage(); });

describe('enqueue', () => {
  it('keeps the paper so a failed send is not a lost paper', () => {
    enqueue(paper(), { storage });

    expect(listOutbox(storage)).toHaveLength(1);
    expect(listOutbox(storage)[0].result.score).toBe(24.5);
  });

  it('gives every paper its own id', () => {
    const a = enqueue(paper(), { storage });
    const b = enqueue(paper(), { storage });

    expect(a.localId).not.toBe(b.localId);
  });

  it('stamps the id onto the paper so the stored row matches the one on screen', () => {
    const queued = enqueue(paper(), { storage });

    expect(queued.result.localId).toBe(queued.localId);
    expect(listOutbox(storage)[0].result.localId).toBe(queued.localId);
  });

  it('queues a second sitting beside the first rather than replacing it', () => {
    enqueue(paper({ examId: 'A00' }), { storage });
    enqueue(paper({ examId: 'A00' }), { storage });

    expect(listOutbox(storage)).toHaveLength(2);
  });
});

describe('flushOutbox', () => {
  it('sends what is waiting and empties the queue', async () => {
    enqueue(paper(), { storage });
    enqueue(paper({ score: 18 }), { storage });
    const send = vi.fn(async () => ({ id: 'row' }));

    const result = await flushOutbox(send, { storage });

    expect(send).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ sent: 2, failed: 0, remaining: 0 });
    expect(listOutbox(storage)).toHaveLength(0);
  });

  it('keeps a paper the server refused, and counts the attempt', async () => {
    enqueue(paper(), { storage });
    const send = vi.fn(async () => { throw new Error('mạng lỗi'); });

    const result = await flushOutbox(send, { storage });

    expect(result).toMatchObject({ sent: 0, failed: 1, remaining: 1 });
    expect(listOutbox(storage)[0].attempts).toBe(1);
    expect(listOutbox(storage)[0].lastError).toBe('mạng lỗi');
  });

  it('sends the survivors even when one paper fails', async () => {
    enqueue(paper({ examId: 'good-1' }), { storage });
    enqueue(paper({ examId: 'bad' }), { storage });
    enqueue(paper({ examId: 'good-2' }), { storage });

    const send = vi.fn(async (result) => {
      if (result.examId === 'bad') throw new Error('từ chối');
    });

    const outcome = await flushOutbox(send, { storage });

    expect(outcome).toMatchObject({ sent: 2, failed: 1 });
    expect(listOutbox(storage).map(i => i.result.examId)).toEqual(['bad']);
  });

  it('does not lose a paper handed in while the flush was running', async () => {
    enqueue(paper({ examId: 'first' }), { storage });

    const send = vi.fn(async () => {
      // The student in the next seat hands in mid-flight.
      enqueue(paper({ examId: 'second' }), { storage });
    });

    await flushOutbox(send, { storage });

    expect(listOutbox(storage).map(i => i.result.examId)).toEqual(['second']);
  });

  it('stops retrying a paper that has failed too many times, but keeps it', async () => {
    enqueue(paper(), { storage });
    const send = vi.fn(async () => { throw new Error('vẫn lỗi'); });

    for (let i = 0; i < MAX_ATTEMPTS + 3; i++) await flushOutbox(send, { storage });

    expect(send).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(listOutbox(storage)).toHaveLength(1);
    expect(stuckCount(storage)).toBe(1);
    expect(pendingCount(storage)).toBe(0);
  });

  it('does nothing, quietly, when there is nothing to send', async () => {
    const send = vi.fn();

    await expect(flushOutbox(send, { storage })).resolves.toMatchObject({ sent: 0, remaining: 0 });
    expect(send).not.toHaveBeenCalled();
  });
});

describe('two flushes at once', () => {
  it('sends a paper once when the mount flush and the online flush overlap', async () => {
    enqueue(paper({ examId: 'only' }), { storage });

    let answer;
    const serverReply = new Promise((resolve) => { answer = resolve; });
    const send = vi.fn(async () => { await serverReply; });

    const first = flushOutbox(send, { storage });
    const second = flushOutbox(send, { storage });
    answer();
    await Promise.all([first, second]);

    expect(send).toHaveBeenCalledTimes(1);
    expect(listOutbox(storage)).toHaveLength(0);
  });

  it('counts one paper as sent once, not once per caller', async () => {
    enqueue(paper(), { storage });

    let answer;
    const serverReply = new Promise((resolve) => { answer = resolve; });
    const send = vi.fn(async () => { await serverReply; });

    const first = flushOutbox(send, { storage });
    const second = flushOutbox(send, { storage });
    answer();
    const [outcome] = await Promise.all([first, second]);

    expect(outcome).toMatchObject({ sent: 1, failed: 0, remaining: 0 });
  });

  it('still sends a paper handed in mid-flush, on the pass that follows', async () => {
    enqueue(paper({ examId: 'first' }), { storage });

    const sent = [];
    const send = vi.fn(async (result) => {
      sent.push(result.examId);
      if (result.examId !== 'first') return;
      // What handing in during a flush actually does: queue, then ask for a
      // flush that finds one already running.
      enqueue(paper({ examId: 'second' }), { storage });
      flushOutbox(send, { storage });
    });

    const outcome = await flushOutbox(send, { storage });

    expect(sent).toEqual(['first', 'second']);
    expect(outcome).toMatchObject({ sent: 2, remaining: 0 });
    expect(listOutbox(storage)).toHaveLength(0);
  });

  it('lets the next flush start once the last one has finished', async () => {
    enqueue(paper({ examId: 'a' }), { storage });
    const send = vi.fn(async () => {});

    await flushOutbox(send, { storage });
    enqueue(paper({ examId: 'b' }), { storage });
    await flushOutbox(send, { storage });

    expect(send).toHaveBeenCalledTimes(2);
    expect(listOutbox(storage)).toHaveLength(0);
  });
});

describe('automatic retry', () => {
  const noJitter = () => 1;

  it('waits longer after each failure, up to a ceiling', () => {
    expect(retryDelay(0, noJitter)).toBe(RETRY_BASE_MS);
    expect(retryDelay(1, noJitter)).toBe(RETRY_BASE_MS * 2);
    expect(retryDelay(2, noJitter)).toBe(RETRY_BASE_MS * 4);
    expect(retryDelay(MAX_ATTEMPTS - 1, noJitter)).toBe(RETRY_CEILING_MS);
  });

  it('scatters the wait, so a hall of machines does not come back in step', () => {
    expect(retryDelay(0, () => 0)).toBe(RETRY_BASE_MS / 2);
    expect(retryDelay(0, () => 1)).toBe(RETRY_BASE_MS);
  });

  it('asks for no timer when there is nothing waiting', () => {
    expect(nextRetryDelay(storage)).toBeNull();
  });

  it('asks for no timer when everything left has used up its attempts', async () => {
    enqueue(paper(), { storage });
    const send = vi.fn(async () => { throw new Error('vẫn lỗi'); });

    for (let i = 0; i < MAX_ATTEMPTS; i++) await flushOutbox(send, { storage });

    expect(stuckCount(storage)).toBe(1);
    expect(nextRetryDelay(storage)).toBeNull();
  });

  it('times the next attempt from the paper that has been tried least', async () => {
    enqueue(paper({ examId: 'failing' }), { storage });
    const send = vi.fn(async () => { throw new Error('lỗi'); });
    await flushOutbox(send, { storage });
    await flushOutbox(send, { storage });

    expect(nextRetryDelay(storage, noJitter)).toBe(retryDelay(2, noJitter));

    enqueue(paper({ examId: 'fresh' }), { storage });

    expect(nextRetryDelay(storage, noJitter)).toBe(retryDelay(0, noJitter));
  });
});

describe('a browser that will not co-operate', () => {
  it('treats corrupt storage as an empty queue instead of crashing at hand-in', () => {
    storage.setItem(OUTBOX_KEY, '{not json');

    expect(listOutbox(storage)).toEqual([]);
  });

  it('does not throw when storage is full', () => {
    const full = memoryStorage({ failOnWrite: true });

    expect(() => enqueue(paper(), { storage: full })).not.toThrow();
  });
});

describe('removeFromOutbox / clearOutbox', () => {
  it('removes one without touching the rest', () => {
    const first = enqueue(paper({ examId: 'a' }), { storage });
    enqueue(paper({ examId: 'b' }), { storage });

    removeFromOutbox(first.localId, storage);

    expect(listOutbox(storage).map(i => i.result.examId)).toEqual(['b']);
  });

  it('empties everything when told to', () => {
    enqueue(paper(), { storage });
    clearOutbox(storage);

    expect(listOutbox(storage)).toEqual([]);
  });
});
