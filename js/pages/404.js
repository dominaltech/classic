import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';

/**
 * Boots the 404 fallback page — shared chrome only, no data fetching.
 */
function bootNotFound() {
  const header = document.querySelector('#app-header');
  const bottomNav = document.querySelector('#app-bottom-nav');

  if (!header || !bottomNav) {
    throw new Error('404 page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(header, {}));
  renderBottomNav(bottomNav, {});
}

bootNotFound();
