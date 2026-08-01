/**
 * localStorage that cannot throw.
 *
 * Safari in private mode, storage-partitioned iframes and users who have
 * blocked site data all make `localStorage` raise on access rather than return
 * null. Left unguarded that turns a routine save into a blank screen, so every
 * call site goes through this wrapper instead of touching `localStorage`.
 */
export const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      // Quota exceeded or storage denied. The in-memory state stays correct for
      // this session; only persistence across reloads is lost.
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  /** Keys currently stored, or an empty list when storage is unreachable. */
  keys() {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  }
};

export default safeStorage;
