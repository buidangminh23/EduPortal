/**
 * Append-only record of who watched which camera, and when.
 *
 * A school camera points at children, so the question "who has been watching
 * this?" has to have an answer that is not "nobody knows". One line per
 * viewing, written where the school can read it with `tail`, and never
 * rewritten from here — a log this process can edit is a log that proves
 * nothing.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function formatEntry(entry) {
  return `${JSON.stringify(entry)}\n`;
}

export function createAccessLog({ filePath, onError = console.error } = {}) {
  let ready = false;

  const ensureDirectory = () => {
    if (ready || !filePath) return;
    mkdirSync(dirname(filePath), { recursive: true });
    ready = true;
  };

  /**
   * @param {{ action: string, cameraId?: string, viewerId?: string,
   *           viewId?: string, ip?: string, outcome: 'allowed' | 'denied',
   *           reason?: string }} entry
   */
  function record(entry) {
    const line = formatEntry({ at: new Date().toISOString(), ...entry });

    if (!filePath) {
      // Without a path the log still has to be visible somewhere, or turning it
      // off would be indistinguishable from it working.
      console.log(`[camera] ${line.trim()}`);
      return;
    }

    try {
      ensureDirectory();
      appendFileSync(filePath, line, 'utf8');
    } catch (err) {
      onError('Không ghi được nhật ký xem camera:', err);
    }
  }

  return { record };
}
