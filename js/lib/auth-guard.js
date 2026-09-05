import { getSession, signOut, subscribeToAuthChanges } from '../services/authService.js';

/**
 * Returns the current auth snapshot in a UI-friendly shape.
 * @returns {Promise<{session: object | null, user: object | null, error?: string}>} Auth snapshot.
 */
export async function getAuthSnapshot() {
  const result = await getSession();

  if (!result.ok) {
    return { session: null, user: null, error: result.error };
  }

  const session = result.data?.session ?? null;
  return {
    session,
    user: session?.user ?? null,
  };
}

/**
 * Watches initial and future auth state changes for shared UI such as the header.
 * @param {(state: {session: object | null, user: object | null}) => void} callback - State callback.
 * @returns {() => void} Unsubscribe function.
 */
export function watchAuthState(callback) {
  let active = true;

  getAuthSnapshot().then((state) => {
    if (active) {
      callback(state);
    }
  });

  const subscription = subscribeToAuthChanges((state) => {
    if (active) {
      callback(state);
    }
  });

  return () => {
    active = false;
    subscription?.unsubscribe?.();
  };
}

/**
 * Signs out the current customer through the shared auth service.
 * @returns {Promise<{ok: boolean, error?: string}>} Logout result.
 */
export async function logoutCurrentUser() {
  return signOut();
}

/**
 * Protects an authenticated-only page and redirects anonymous users to login.
 * @param {Object} [options] - Guard options.
 * @param {string} [options.loginPath] - Login page path.
 * @returns {Promise<{session: object, user: object} | null>} Session payload, or null after redirect.
 */
export async function requireAuth({ loginPath = '/pages/login.html' } = {}) {
  const { session, user } = await getAuthSnapshot();

  if (session && user) {
    return { session, user };
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const target = `${loginPath}?next=${encodeURIComponent(currentPath)}`;
  window.location.assign(target);
  return null;
}

/**
 * Returns a safe local redirect target from the next query parameter.
 * @param {string} fallback - Fallback path when next is missing or unsafe.
 * @returns {string} Safe local path.
 */
export function getSafeNextPath(fallback = '/') {
  const next = new URLSearchParams(window.location.search).get('next');

  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }

  return next;
}

/**
 * Builds a local page URL while preserving an optional next query parameter.
 * @param {string} path - Target path.
 * @returns {string} URL with next preserved.
 */
export function withPreservedNext(path) {
  const next = new URLSearchParams(window.location.search).get('next');

  if (!next) {
    return path;
  }

  return `${path}?next=${encodeURIComponent(next)}`;
}
