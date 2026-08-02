/**
 * Picks where records live, once, at startup.
 *
 * Supplying a Supabase project is what switches the app off the browser store:
 * with `VITE_SUPABASE_URL` set the repository talks to Postgres, without it the
 * demo keeps working exactly as before. Nothing above this module names either
 * adapter, so the switch stays an env var rather than an edit.
 *
 * The school id is needed on writes to stamp the tenant. It comes from the
 * signed-in profile rather than configuration, because one deployment may
 * eventually serve more than one school and a hardcoded id would silently file
 * records under the wrong one.
 */

import { supabase, isMockMode } from '../supabase';
import { createSupabaseAdapter, localAdapter } from './repository';

/** True while records are kept in the browser rather than a database. */
export const isBrowserStore = isMockMode;

let cached = null;
let cachedSchoolId = null;

/**
 * The repository for the current session.
 *
 * @param {string|null} schoolId Tenant of the signed-in user. Ignored by the
 *   browser store, required by Postgres for inserts.
 */
export function getRepository(schoolId = null) {
  if (isMockMode) return localAdapter;

  // Rebuilt when the tenant changes, which happens on sign-in and on switching
  // accounts. Caching matters because a new adapter per render would defeat
  // any memoisation above it.
  if (!cached || cachedSchoolId !== schoolId) {
    cached = createSupabaseAdapter(supabase, schoolId);
    cachedSchoolId = schoolId;
  }
  return cached;
}

/** Drops the cached adapter. Called on sign-out so the next user starts clean. */
export function resetRepository() {
  cached = null;
  cachedSchoolId = null;
}

/**
 * Where the app is reading and writing, for the demo banner to state plainly.
 * A school looking at a pilot should be able to tell at a glance whether what
 * they are seeing is stored anywhere.
 */
export function describeStore() {
  return isMockMode
    ? {
        kind: 'browser',
        label: 'Dữ liệu demo — lưu trong trình duyệt này',
        detail: 'Nhập trên máy này thì máy khác không thấy, xoá bộ nhớ trình duyệt là mất.'
      }
    : {
        kind: 'database',
        label: 'Đang kết nối cơ sở dữ liệu',
        detail: 'Dữ liệu lưu tập trung, phân quyền theo vai trò.'
      };
}
