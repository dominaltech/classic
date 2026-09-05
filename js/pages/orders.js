import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { renderOrderCard } from '../components/orderCard.js';
import { createSkeleton } from '../components/skeletonLoader.js';
import { requireAuth } from '../lib/auth-guard.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';
import { consumeFlash } from '../lib/flash.js';
import { createPaginationState } from '../lib/pagination.js';
import { showErrorToast, showInfoToast, showSuccessToast } from '../lib/toast.js';
import { getOrders } from '../services/orderService.js';

const PAGE_SIZE = 10;

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  status: document.querySelector('[data-orders-status]'),
  skeleton: document.querySelector('[data-orders-skeleton]'),
  list: document.querySelector('[data-orders-list]'),
  statePanel: document.querySelector('[data-orders-state]'),
  pagination: document.querySelector('[data-pagination]'),
  paginationStatus: document.querySelector('[data-pagination-status]'),
  prevPage: document.querySelector('[data-prev-page]'),
  nextPage: document.querySelector('[data-next-page]'),
};

const state = {
  user: null,
  page: 1,
  loading: false,
};

/**
 * Shows a queued one-time message after cross-page redirects
 * (e.g. Order Confirmation sending shoppers here on an invalid id).
 */
function showStoredFlash() {
  const flash = consumeFlash();

  if (!flash) {
    return;
  }

  const options = { title: flash.title, durationMs: flash.durationMs };

  if (flash.type === 'success') {
    showSuccessToast(flash.message, options);
  } else if (flash.type === 'error') {
    showErrorToast(flash.message, options);
  } else {
    showInfoToast(flash.message, options);
  }
}

/**
 * Mirrors the page number into the address bar (shareable history views).
 */
function syncUrl() {
  const params = new URLSearchParams();

  if (state.page > 1) {
    params.set('page', String(state.page));
  }

  const query = params.toString();
  const target = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  const current = `${window.location.pathname}${window.location.search}`;

  if (target !== current) {
    window.history.pushState({}, '', target);
  }
}

/**
 * Renders row-shaped skeletons while orders load.
 */
function renderSkeleton() {
  refs.skeleton.hidden = false;
  refs.skeleton.replaceChildren();

  for (let index = 0; index < 4; index += 1) {
    const row = document.createElement('div');
    row.className = 'order-skeleton__row';
    row.setAttribute('aria-hidden', 'true');
    row.append(
      createSkeleton({ variant: 'text', width: 38 }),
      createSkeleton({ variant: 'text', width: 24 }),
      createSkeleton({ variant: 'text', width: 30 }),
    );
    refs.skeleton.append(row);
  }
}

/**
 * Renders a designed full-region panel (empty history / load error).
 * @param {Object} input - Panel input.
 */
function renderPanelState({ title, message, actionLabel, handleAction }) {
  refs.list.replaceChildren();
  refs.statePanel.hidden = false;
  refs.statePanel.replaceChildren();

  const panel = document.createElement('div');
  panel.className = 'panel-state';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const copy = document.createElement('p');
  copy.textContent = message;

  panel.append(heading, copy);

  if (actionLabel && handleAction) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'button button--ghost button--small';
    action.textContent = actionLabel;
    action.addEventListener('click', handleAction);
    panel.append(action);
  }

  refs.statePanel.append(panel);
}

/**
 * Loads the current page of orders and renders every state of the view.
 */
async function loadOrders() {
  if (state.loading) {
    return;
  }

  state.loading = true;
  refs.pagination.hidden = true;
  refs.statePanel.hidden = true;
  renderSkeleton();

  try {
    const result = await getOrders(state.user.id, { page: state.page, pageSize: PAGE_SIZE });
    state.loading = false;
    refs.skeleton.hidden = true;

    if (!result.ok) {
      const message = result.error || 'Could not load your orders.';
      refs.status.textContent = 'Orders unavailable';
      renderPanelState({
        title: 'Could not load your orders',
        message,
        actionLabel: 'Retry',
        handleAction: loadOrders,
      });
      showErrorToast(message);
      return;
    }

    const pagination = createPaginationState({
      totalItems: result.count,
      pageSize: PAGE_SIZE,
      page: state.page,
    });

    state.page = pagination.page;
    syncUrl();

    const orders = result.data || [];
    refs.list.replaceChildren();

    if (orders.length === 0) {
      refs.status.textContent = 'No orders yet';
      refs.pagination.hidden = true;
      renderPanelState({
        title: 'No orders yet',
        message: 'Materials you order will appear here with live status tracking. Start by browsing the catalog.',
        actionLabel: 'Browse catalog',
        handleAction: () => {
          window.location.assign('/pages/listing.html');
        },
      });
      return;
    }

    refs.statePanel.hidden = true;
    orders.forEach((order) => {
      refs.list.append(renderOrderCard(order));
    });

    refs.status.textContent = `${pagination.totalItems} ${pagination.totalItems === 1 ? 'order' : 'orders'} placed`;
    refs.pagination.hidden = pagination.totalItems <= PAGE_SIZE;
    refs.paginationStatus.textContent = `Page ${pagination.page} of ${pagination.pageCount}`;
    refs.prevPage.disabled = state.loading || !pagination.hasPrev;
    refs.nextPage.disabled = state.loading || !pagination.hasNext;
  } catch (error) {
    state.loading = false;
    refs.skeleton.hidden = true;
    const message = error?.message || 'Could not load your orders.';
    refs.status.textContent = 'Orders unavailable';
    renderPanelState({
      title: 'Could not load your orders',
      message,
      actionLabel: 'Retry',
      handleAction: loadOrders,
    });
    showErrorToast(message);
  }
}

/**
 * Restores the page number when travelling with browser back/forward.
 */
function handlePopState() {
  state.page = Math.max(1, Number(new URLSearchParams(window.location.search).get('page')) || 1);
  loadOrders();
}

/**
 * Boots Order History behind the auth gate.
 */
async function bootOrders() {
  if (!refs.header || !refs.bottomNav || !refs.list) {
    throw new Error('Orders page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});
  showStoredFlash();

  refs.prevPage.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      loadOrders();
    }
  });

  refs.nextPage.addEventListener('click', () => {
    state.page += 1;
    loadOrders();
  });

  window.addEventListener('popstate', handlePopState);

  const auth = await requireAuth();

  if (!auth) {
    return;
  }

  state.user = auth.user;
  state.page = Math.max(1, Number(new URLSearchParams(window.location.search).get('page')) || 1);
  await loadOrders();
}

bootOrders();
