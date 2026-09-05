import { getCartCount } from '../services/cartService.js';
import { watchAuthState } from './auth-guard.js';

/*
  Keeps the header cart badge truthful across every page. Page controllers
  bind once after rendering the header; cart mutations call
  notifyCartChanged() so the badge refreshes without a page reload.
*/

let badgeControls = null;
let currentUserId = '';
let latestRequestId = 0;

/**
 * Fetches the current unit count and pushes it into the bound badge.
 * Stale responses are ignored so rapid mutations never render old counts.
 */
async function pushCartCount() {
  const requestId = ++latestRequestId;

  if (!badgeControls) {
    return;
  }

  if (!currentUserId) {
    badgeControls.setCartCount(0);
    return;
  }

  try {
    const result = await getCartCount(currentUserId);

    if (requestId !== latestRequestId) {
      return;
    }

    badgeControls.setCartCount(result.ok ? result.count : 0);
  } catch (error) {
    if (requestId === latestRequestId) {
      badgeControls.setCartCount(0);
    }
  }
}

/**
 * Binds one rendered header to the signed-in customer's cart count.
 * @param {{setCartCount: (count: number) => void}} headerControls - Return value of renderHeader.
 * @returns {() => void} Unsubscribe function for the auth watcher.
 */
export function bindHeaderCartBadge(headerControls) {
  badgeControls = headerControls && typeof headerControls.setCartCount === 'function'
    ? headerControls
    : null;

  return watchAuthState(({ user }) => {
    currentUserId = user?.id || '';
    pushCartCount();
  });
}

/**
 * Call after any cart mutation (add/update/remove) to refresh the badge.
 */
export function notifyCartChanged() {
  pushCartCount();
}
