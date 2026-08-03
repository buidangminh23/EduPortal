/**
 * Who may open the camera wall, and why not.
 *
 * The check lives here rather than inside the component so it can be read and
 * tested on its own — but it is not the check that matters. Hiding a button
 * hides nothing: the server decides, against Supabase, on every request. This
 * exists so the head teacher sees a sentence instead of an empty panel, and so
 * a demo build cannot end up pointed at a real school's cameras.
 */

import { APP_MODE } from '../appMode';

/** Ban Giám Hiệu. Matches CAMERA_ALLOWED_ROLES on the server. */
export const CAMERA_ROLES = ['admin'];

export const CAMERA_DENIAL = {
  ROLE: 'role',
  DEMO: 'demo',
  UNCONFIGURED: 'unconfigured',
  NO_SERVER: 'no_server'
};

/**
 * @param {{ role?: string, appMode?: string, serverUrl?: string }} context
 * @returns {{ allowed: boolean, reason: string | null }}
 */
export function cameraAccess({ role, appMode, serverUrl } = {}) {
  // The build is checked before the role, because on a demo the role means
  // nothing — anybody can pick "Ban Giám Hiệu" from a menu, so "you are not
  // the head teacher" would be both false and beside the point. What the
  // person needs to read is that this build has no cameras behind it.
  if (appMode === APP_MODE.DEMO) return { allowed: false, reason: CAMERA_DENIAL.DEMO };
  if (appMode !== APP_MODE.REAL) return { allowed: false, reason: CAMERA_DENIAL.UNCONFIGURED };

  if (!CAMERA_ROLES.includes(role)) return { allowed: false, reason: CAMERA_DENIAL.ROLE };
  if (!serverUrl) return { allowed: false, reason: CAMERA_DENIAL.NO_SERVER };

  return { allowed: true, reason: null };
}

/** True when the menu entry should exist at all. */
export function showsCameraTab(role) {
  return CAMERA_ROLES.includes(role);
}
