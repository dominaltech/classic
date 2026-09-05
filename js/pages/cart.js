import { renderBottomNav } from '../components/bottomNav.js';
import { renderCartItemRow } from '../components/cartItem.js';
import { renderHeader } from '../components/header.js';
import { createSkeleton } from '../components/skeletonLoader.js';
import { requireAuth } from '../lib/auth-guard.js';
import { bindHeaderCartBadge, notifyCartChanged } from '../lib/cart-badge.js';
import { debounce } from '../lib/debounce.js';
import { consumeFlash } from '../lib/flash.js';
import { formatINR } from '../lib/format.js';
import { guardProfileOrRedirect } from '../lib/profile-guard.js';
import { showErrorToast, showInfoToast, showSuccessToast } from '../lib/toast.js';
import { getCartItems, removeCartItem, updateCartItemQuantity } from '../services/cartService.js';

const QUANTITY_SYNC_DEBOUNCE_MS = 400;

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  status: document.querySelector('[data-cart-status]'),
  skeleton: document.querySelector('[data-cart-skeleton]'),
  list: document.querySelector('[data-cart-items]'),
  statePanel: document.querySelector('[data-cart-state]'),
  summary: document.querySelector('[data-cart-summary]'),
  subtotalLabel: document.querySelector('[data-subtotal-label]'),
  subtotal: document.querySelector('[data-subtotal]'),
  checkout: document.querySelector('[data-checkout]'),
};

const state = {
  user: null,
  items: [],
  loading: false,
};

/* itemId -> rendered row handle, and itemId -> debounced server syncer. */
const rowHandles = new Map();
const pendingSyncs = new Map();

/**
 * Shows a queued one-time message after cross-page redirects
 * (e.g. landing here as the login/profile `next` target).
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
 * Item units that count toward the badge/subtotal (unavailable rows are excluded).
 * @returns {number} Purchasable unit count.
 */
function purchasableUnits() {
  return state.items
    .filter((item) => item.products?.is_active)
    .reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
}

/**
 * Cart subtotal in integer cents across purchasable rows only.
 * @returns {number} Subtotal in paise.
 */
function computeSubtotalCents() {
  return state.items
    .filter((item) => item.products?.is_active)
    .reduce((sum, item) => {
      const priceCents = Math.max(0, Math.round(Number(item.products.price) * 100) || 0);
      return sum + priceCents * Math.max(0, Number(item.quantity) || 0);
    }, 0);
}

/**
 * Re-renders the status line, subtotal, and checkout enablement from state.
 */
function updateSummary() {
  const totalRows = state.items.length;
  const units = purchasableUnits();
  const subtotalCents = computeSubtotalCents();

  refs.status.textContent = totalRows === 0
    ? 'Cart is empty'
    : `${totalRows} ${totalRows === 1 ? 'item' : 'items'} in your cart`;

  const hasItems = totalRows > 0;
  refs.summary.hidden = !hasItems;
  refs.subtotalLabel.textContent = `Subtotal (${units} ${units === 1 ? 'item' : 'items'})`;
  refs.subtotal.textContent = formatINR(subtotalCents / 100);
  refs.checkout.disabled = units === 0;
}

/**
 * Renders the row-shaped loading skeleton while the cart loads.
 */
function renderSkeleton() {
  refs.skeleton.hidden = false;
  refs.skeleton.replaceChildren();

  for (let index = 0; index < 3; index += 1) {
    const row = document.createElement('div');
    row.className = 'cart-skeleton__row';
    row.setAttribute('aria-hidden', 'true');

    const media = createSkeleton({ variant: 'media', className: 'cart-skeleton__media' });
    const body = document.createElement('div');
    body.className = 'cart-skeleton__body';
    body.append(
      createSkeleton({ variant: 'text', width: 72 }),
      createSkeleton({ variant: 'text', width: 40 }),
      createSkeleton({ variant: 'text', width: 56 }),
    );

    row.append(media, body);
    refs.skeleton.append(row);
  }
}

/**
 * Renders a designed full-region state (empty cart / load error).
 * @param {Object} input - Panel input.
 * @param {string} input.title - Panel heading.
 * @param {string} input.message - Panel message.
 * @param {string} input.actionLabel - Action button label.
 * @param {Function} input.handleAction - Action handler.
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

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'button button--ghost button--small';
  action.textContent = actionLabel;
  action.addEventListener('click', handleAction);

  panel.append(heading, copy, action);
  refs.statePanel.append(panel);
}

/**
 * Optimistic quantity handler: UI + subtotal update instantly, server sync
 * is debounced per row, and failures roll back to the last server truth.
 * @param {object} item - Cart row under edit.
 * @param {number} quantity - New optimistic quantity.
 */
function handleQuantityChange(item, quantity) {
  item.quantity = quantity;
  updateSummary();

  if (!pendingSyncs.has(item.id)) {
    pendingSyncs.set(item.id, debounce(async () => {
      const result = await updateCartItemQuantity(item.id, state.user.id, item.quantity);

      if (!result.ok) {
        item.quantity = item.serverQuantity;
        rowHandles.get(item.id)?.setQuantity(item.serverQuantity);
        updateSummary();
        showErrorToast(result.error || 'Could not update the quantity.');
        return;
      }

      item.serverQuantity = result.data?.quantity ?? item.quantity;
      item.quantity = item.serverQuantity;
      updateSummary();
      notifyCartChanged();
    }, QUANTITY_SYNC_DEBOUNCE_MS));
  }

  pendingSyncs.get(item.id)();
}

/**
 * Optimistic removal handler: the row disappears immediately and a failed
 * delete restores the exact previous cart with a toast.
 * @param {object} item - Cart row to remove.
 */
async function handleRemoveItem(item) {
  pendingSyncs.get(item.id)?.cancel?.();

  const snapshot = state.items.slice();
  state.items = state.items.filter((row) => row.id !== item.id);
  renderCartRows();

  const result = await removeCartItem(item.id, state.user.id);

  if (!result.ok) {
    state.items = snapshot;
    renderCartRows();
    showErrorToast(result.error || 'Could not remove this item.');
    return;
  }

  showSuccessToast(`${item.products?.name || 'Item'} removed from your cart.`, { title: 'Removed' });
  notifyCartChanged();
}

/**
 * Renders all cart rows (or the empty state) from state.
 */
function renderCartRows() {
  refs.skeleton.hidden = true;
  refs.list.replaceChildren();
  rowHandles.clear();

  if (state.items.length === 0) {
    renderPanelState({
      title: 'Your cart is empty',
      message: 'Materials you add will show up here. Browse the catalog to find fabrics you love.',
      actionLabel: 'Browse catalog',
      handleAction: () => {
        window.location.assign('/pages/listing.html');
      },
    });
    updateSummary();
    return;
  }

  refs.statePanel.hidden = true;
  refs.statePanel.replaceChildren();

  state.items.forEach((item) => {
    const handle = renderCartItemRow(item, {
      onQuantityChange: handleQuantityChange,
      onRemove: handleRemoveItem,
    });
    rowHandles.set(item.id, handle);
    refs.list.append(handle.element);
  });

  updateSummary();
}

/**
 * Loads the cart from Supabase and renders it (initial load + retries).
 */
async function loadCart() {
  state.loading = true;
  refs.summary.hidden = true;
  refs.statePanel.hidden = true;
  renderSkeleton();

  try {
    const result = await getCartItems(state.user.id);
    state.loading = false;

    if (!result.ok) {
      const message = result.error || 'Could not load your cart.';
      refs.skeleton.hidden = true;
      renderPanelState({
        title: 'Could not load your cart',
        message,
        actionLabel: 'Retry',
        handleAction: loadCart,
      });
      showErrorToast(message);
      refs.status.textContent = 'Cart unavailable';
      return;
    }

    state.items = (result.data || []).map((item) => ({
      ...item,
      serverQuantity: Math.max(1, Number(item.quantity) || 1),
    }));

    renderCartRows();
  } catch (error) {
    state.loading = false;
    const message = error?.message || 'Could not load your cart.';
    refs.skeleton.hidden = true;
    renderPanelState({
      title: 'Could not load your cart',
      message,
      actionLabel: 'Retry',
      handleAction: loadCart,
    });
    showErrorToast(message);
    refs.status.textContent = 'Cart unavailable';
  }
}

/**
 * Proceed to Checkout — Phase 4 profile gate always runs first.
 * The actual review screen arrives in Phase 9.
 */
async function handleCheckout() {
  refs.checkout.disabled = true;

  try {
    const gate = await guardProfileOrRedirect({ returnTo: '/pages/cart.html' });

    if (!gate) {
      /* Guard redirected to Login or Profile. */
      return;
    }

    if (!gate.profile) {
      showErrorToast(gate.error || 'Could not verify your profile. Please try again.');
      refs.checkout.disabled = false;
      return;
    }

    /* Profile gate passed — move to the checkout review (Phase 9). */
    window.location.assign('/pages/checkout.html');
  } catch (error) {
    showErrorToast(error?.message || 'Something went wrong. Please try again.');
    refs.checkout.disabled = purchasableUnits() === 0;
  }
}

/**
 * Boots the Cart page behind the auth gate.
 */
async function bootCart() {
  if (!refs.header || !refs.bottomNav || !refs.list) {
    throw new Error('Cart page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});
  showStoredFlash();

  refs.checkout.addEventListener('click', handleCheckout);

  const auth = await requireAuth();

  if (!auth) {
    /* Anonymous users are redirected to Login by the guard. */
    return;
  }

  state.user = auth.user;
  await loadCart();
}

bootCart();
