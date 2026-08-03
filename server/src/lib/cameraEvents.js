/**
 * The seam an AI layer plugs into.
 *
 * Nothing in this repository looks at a picture. Whatever does — a model on
 * the same machine, a vendor's box, a script — posts what it saw here, and the
 * head teacher's wall shows it. Keeping the contract this small is the point:
 * the analyser can be replaced entirely without a line of the web app moving.
 */

/** Severities the wall knows how to colour. Anything else is rejected. */
export const EVENT_LEVELS = ['info', 'warning', 'alert'];

const MAX_LABEL = 120;
const MAX_NOTE = 500;

export class InvalidEventError extends Error {}

/**
 * @param {object} raw Body posted by the analyser.
 * @param {{ cameraIds: string[], now?: number }} context
 */
export function normaliseEvent(raw, { cameraIds = [], now = Date.now() } = {}) {
  const cameraId = String(raw?.cameraId || '').trim();
  if (!cameraId) throw new InvalidEventError('Thiếu "cameraId".');
  if (cameraIds.length > 0 && !cameraIds.includes(cameraId)) {
    throw new InvalidEventError(`Không có camera "${cameraId}" trong danh sách của trường.`);
  }

  const label = String(raw?.label || '').trim();
  if (!label) throw new InvalidEventError('Thiếu "label" — mô tả ngắn điều AI nhìn thấy.');
  if (label.length > MAX_LABEL) throw new InvalidEventError(`"label" dài quá ${MAX_LABEL} ký tự.`);

  const level = String(raw?.level || 'info').trim();
  if (!EVENT_LEVELS.includes(level)) {
    throw new InvalidEventError(`"level" phải là một trong: ${EVENT_LEVELS.join(', ')}.`);
  }

  const confidence = raw?.confidence === undefined ? null : Number(raw.confidence);
  if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) {
    throw new InvalidEventError('"confidence" phải là số từ 0 đến 1.');
  }

  const at = raw?.at ? Date.parse(raw.at) : now;
  if (!Number.isFinite(at)) throw new InvalidEventError('"at" không phải mốc thời gian ISO hợp lệ.');

  const note = String(raw?.note || '').trim().slice(0, MAX_NOTE) || null;

  return {
    cameraId,
    label,
    level,
    confidence,
    note,
    at: new Date(at).toISOString(),
    receivedAt: new Date(now).toISOString()
  };
}

/**
 * Recent events, newest first.
 *
 * Held in memory on purpose: these are notifications, not records. Anything
 * worth keeping — an incident, a clip — belongs in the recorder, and storing a
 * running commentary of what children did all day would be a liability the
 * school did not ask for.
 */
export function createEventStore({ max = 200 } = {}) {
  let events = [];

  return {
    append(event) {
      events = [event, ...events].slice(0, max);
      return event;
    },
    list({ since = null, limit = 50 } = {}) {
      const cutoff = since ? Date.parse(since) : null;
      const usable = Number.isFinite(cutoff) ? events.filter(e => Date.parse(e.at) > cutoff) : events;
      return usable.slice(0, limit);
    },
    get size() {
      return events.length;
    },
    clear() {
      events = [];
    }
  };
}
