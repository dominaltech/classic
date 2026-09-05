import { requireAuth } from './auth-guard.js';
import { queueFlash } from './flash.js';
import { getProfile } from '../services/profileService.js';

/**
 * Single source of truth for whether a customer profile is complete enough to buy.
 * @param {object | null | undefined} profile - Profile row.
 * @returns {boolean} True when all required fields are present.
 */
export function isProfileComplete(profile) {
  if (!profile) {
    return false;
  }

  return Boolean(
    String(profile.name || '').trim()
      && String(profile.address || '').trim()
      && String(profile.phone || '').trim(),
  );
}

/**
 * Enforces the profile-completion gate for Add to Cart, Buy Now, and Checkout callers.
 * @param {Object} [options] - Guard options.
 * @param {string} [options.profilePath] - Profile page path.
 * @param {string} [options.returnTo] - Explicit safe local path to return to after completion.
 * @returns {Promise<{auth: {session: object, user: object}, profile: object} | null>} Auth/profile payload when complete, otherwise null.
 */
export async function guardProfileOrRedirect({ profilePath = '/pages/profile.html', returnTo } = {}) {
  const auth = await requireAuth();

  if (!auth) {
    return null;
  }

  const result = await getProfile(auth.user.id);

  if (!result.ok) {
    return { auth, profile: null, error: result.error };
  }

  const profile = result.data;

  if (isProfileComplete(profile)) {
    return { auth, profile };
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const safeReturnTo = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
    ? returnTo
    : currentPath;

  queueFlash({
    type: 'info',
    title: 'Complete your profile',
    message: 'Add your name, address, and phone number before continuing.',
    durationMs: 5200,
  });

  if (window.location.pathname !== profilePath) {
    window.location.assign(`${profilePath}?next=${encodeURIComponent(safeReturnTo)}&incomplete=1`);
  }

  return null;
}
