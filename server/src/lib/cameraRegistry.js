/**
 * The school's camera list, read from a file on the school's own machine.
 *
 * Stream addresses never leave this process. An `rtsp://user:pass@…` URL is a
 * key to the building: shipped to the browser it would sit in a JavaScript
 * bundle that anybody can read, and no amount of hiding the button changes
 * that. The browser is told a camera's id, name and where it points; the
 * address stays here and is only ever handed to the relay.
 */

import { readFileSync } from 'node:fs';

const SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/;

/** Fields the web app is allowed to see. */
export function publicView(camera) {
  return {
    id: camera.id,
    name: camera.name,
    location: camera.location,
    streamPath: camera.streamPath
  };
}

/**
 * Validate and normalise a parsed camera file.
 *
 * Throws on the first bad entry rather than skipping it. A camera silently
 * dropped for a typo is a camera the head teacher believes they are watching.
 */
export function parseCameraRegistry(raw) {
  const list = Array.isArray(raw) ? raw : raw?.cameras;
  if (!Array.isArray(list)) {
    throw new Error('Tệp camera phải là một mảng, hoặc một object có khoá "cameras".');
  }

  const seen = new Set();

  return list.map((entry, index) => {
    const at = `camera #${index + 1}`;
    const id = String(entry?.id || '').trim();
    const name = String(entry?.name || '').trim();
    const source = String(entry?.source || '').trim();

    if (!SLUG.test(id)) {
      throw new Error(`${at}: "id" phải là chữ thường/số/gạch ngang, ví dụ "san-truong".`);
    }
    if (seen.has(id)) throw new Error(`${at}: trùng id "${id}".`);
    seen.add(id);

    if (!name) throw new Error(`${at} (${id}): thiếu "name" để hiện trên màn hình.`);
    if (!source) throw new Error(`${at} (${id}): thiếu "source" (địa chỉ rtsp:// của camera).`);

    // The relay path is derived, not configured: two cameras sharing a path
    // would silently show the same picture under two names.
    return {
      id,
      name,
      location: String(entry?.location || '').trim() || null,
      source,
      streamPath: `cam-${id}`,
      enabled: entry?.enabled !== false
    };
  });
}

export function loadCameraRegistry(filePath) {
  if (!filePath) return [];

  let text;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  return parseCameraRegistry(JSON.parse(text));
}

export function findCamera(cameras, id) {
  return cameras.find(camera => camera.id === id && camera.enabled) || null;
}
