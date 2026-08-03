import { describe, it, expect } from 'vitest';
import { normaliseEvent, createEventStore, InvalidEventError, EVENT_LEVELS } from './cameraEvents.js';

const cameraIds = ['san-truong', 'cong-chinh'];
const valid = { cameraId: 'san-truong', label: 'Có người trèo tường', level: 'alert', confidence: 0.82 };

describe('normaliseEvent', () => {
  it('keeps what the wall needs and stamps when it arrived', () => {
    const now = Date.parse('2026-08-03T07:00:00.000Z');
    const event = normaliseEvent(valid, { cameraIds, now });

    expect(event).toMatchObject({ cameraId: 'san-truong', label: 'Có người trèo tường', level: 'alert', confidence: 0.82 });
    expect(event.at).toBe('2026-08-03T07:00:00.000Z');
    expect(event.receivedAt).toBe('2026-08-03T07:00:00.000Z');
  });

  it('defaults to the mildest level', () => {
    expect(normaliseEvent({ ...valid, level: undefined }, { cameraIds }).level).toBe('info');
  });

  it('rejects an event about a camera the school does not have', () => {
    expect(() => normaliseEvent({ ...valid, cameraId: 'nha-hang-xom' }, { cameraIds }))
      .toThrow(InvalidEventError);
  });

  it('rejects a level the wall cannot colour', () => {
    expect(() => normaliseEvent({ ...valid, level: 'catastrophe' }, { cameraIds })).toThrow(/level/);
    for (const level of EVENT_LEVELS) {
      expect(normaliseEvent({ ...valid, level }, { cameraIds }).level).toBe(level);
    }
  });

  it('rejects a confidence outside 0..1', () => {
    expect(() => normaliseEvent({ ...valid, confidence: 82 }, { cameraIds })).toThrow(/confidence/);
    expect(() => normaliseEvent({ ...valid, confidence: -1 }, { cameraIds })).toThrow(/confidence/);
  });

  it('rejects an empty label rather than showing a blank alert', () => {
    expect(() => normaliseEvent({ ...valid, label: '  ' }, { cameraIds })).toThrow(/label/);
  });

  it('rejects a timestamp it cannot read', () => {
    expect(() => normaliseEvent({ ...valid, at: 'hôm qua' }, { cameraIds })).toThrow(/at/);
  });

  it('accepts any camera when the registry is empty, so a school can test before wiring', () => {
    expect(normaliseEvent(valid, { cameraIds: [] }).cameraId).toBe('san-truong');
  });
});

describe('createEventStore', () => {
  const at = (seconds) => new Date(Date.parse('2026-08-03T07:00:00.000Z') + seconds * 1000).toISOString();

  it('returns the newest first', () => {
    const store = createEventStore();
    store.append({ ...valid, at: at(0) });
    store.append({ ...valid, label: 'Mới hơn', at: at(10) });

    expect(store.list()[0].label).toBe('Mới hơn');
  });

  it('forgets the oldest instead of growing without limit', () => {
    const store = createEventStore({ max: 3 });
    for (let i = 0; i < 10; i++) store.append({ ...valid, label: `#${i}`, at: at(i) });

    expect(store.size).toBe(3);
    expect(store.list().map(e => e.label)).toEqual(['#9', '#8', '#7']);
  });

  it('can hand back only what arrived after a given moment', () => {
    const store = createEventStore();
    store.append({ ...valid, label: 'cũ', at: at(0) });
    store.append({ ...valid, label: 'mới', at: at(60) });

    expect(store.list({ since: at(30) }).map(e => e.label)).toEqual(['mới']);
  });

  it('ignores an unreadable "since" rather than returning nothing', () => {
    const store = createEventStore();
    store.append({ ...valid, at: at(0) });

    expect(store.list({ since: 'hôm qua' })).toHaveLength(1);
  });
});
