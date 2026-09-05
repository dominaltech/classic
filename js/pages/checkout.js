import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { createSkeleton } from '../components/skeletonLoader.js';
import { requireAuth } from '../lib/auth-guard.js';
import { bindHeaderCartBadge, notifyCartChanged } from '../lib/cart-badge.js';
import { consumeFlash } from '../lib/flash.js';
import { formatINR } from '../lib/format.js';
import { setLoading } from '../lib/loading.js';
import { guardProfileOrRedirect } from '../lib/profile-guard.js';
import { showErrorToast, showInfoToast, showSuccessToast } from '../lib/toast.js';
import { getCartItems } from '../services/cartService.js';
import { createOrder } from '../services/orderService.js';

const PLACEHOLDER_IMAGE = new URL('../../assets/images/product-placeholder.svg', import.meta.url).href;

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  status: document.querySelector('[data-checkout-status]'),
  skeleton: document.querySelector('[data-checkout-skeleton]'),
  content: document.querySelector('[data-checkout-content]'),
  statePanel: document.querySelector('[data-checkout-state]'),
  shippingName: document.querySelector('[data-shipping-name]'),
  shippingAddress: document.querySelector('[data-shipping-address]'),
  shippingPhone: document.querySelector('[data-shipping-phone]'),
  items: document.querySelector('[data-checkout-items]'),
  subtotalLabel: document.querySelector('[data-checkout-subtotal-label]'),
  subtotal: document.querySelector('[data-checkout-subtotal]'),
  placeOrder: document.querySelector('[data-place-order]'),
};

/*
  Checkout state: the signed-in user, their verified complete profile
  (shipping snapshot source), and the review items (from the cart read).
*/
const state = {
  user: null,
  profile: null,
  items: [],
  placing: false,
};

/**
 * Shows a queued one-time message after cross-page redirects.
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
 * Accepts only safe absolute/site-relative image URLs.
 * @param {*} value - Raw image url.
 * @returns {string} Safe image url.
 */
function safeImageUrl(value) {
  const clean = String(value || '').trim();

  if (/^https?:\/\//i.test(clean) || clean.startsWith('/')) {
    return clean;
  }

  return PLACEHOLDER_IMAGE;
}

/**
 * Order total in integer paise across purchasable review items.
 * @returns {number} Total in paise.
 */
function computeTotalCents() {
  return state.items
    .filter((item) => item.products?.is_active)
    .reduce((sum, item) => {
      const priceCents = Math.max(0, Math.round(Number(item.products.price) * 100) || 0);
      return sum + priceCents * Math.max(0, Number(item.quantity) || 0);
    }, 0);
}

/**
 * Purchasable unit count for the summary label.
 * @returns {number} Unit count.
 */
function purchasableUnits() {
  return state.items
    .filter((item) => item.products?.is_active)
    .reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
}

/**
 * Renders the review loading skeleton.
 */
function renderSkeleton() {
  refs.content.hidden = true;
  refs.statePanel.hidden = true;
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
 * Renders a designed full-region panel (empty cart, load error, success).
 * @param {Object} input - Panel input.
 * @param {string} input.title - Panel heading.
 * @param {string} input.message - Panel message.
 * @param {string} input.actionLabel - Action button label.
 * @param {Function} input.handleAction - Action handler.
 */
function renderPanelState({ title, message, actionLabel, handleAction }) {
  refs.skeleton.hidden = true;
  refs.content.hidden = true;
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
 * Renders one read-only review row (no quantity/remove controls here).
 * @param {object} item - Cart row joined with product data.
 * @returns {HTMLElement} Review row element.
 */
function renderReviewRow(item) {
  const product = item.products || {};
  const productName = product.name || 'Unavailable material';
  const unitPriceCents = Math.max(0, Math.round(Number(product.price) * 100) || 0);
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const isUnavailable = !product.is_active;

  const row = document.createElement('article');
  row.className = 'cart-row';

  const productHref = product.id ? `/pages/product.html?id=${encodeURIComponent(product.id)}` : '';
  const media = document.createElement(productHref ? 'a' : 'div');
  media.className = 'cart-row__media';

  if (productHref) {
    media.href = productHref;
    media.setAttribute('aria-label', `View ${productName}`);
  }

  const images = Array.isArray(product.product_images) ? [...product.product_images] : [];
  images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const img = document.createElement('img');
  img.src = safeImageUrl(images[0]?.image_url);
  img.alt = images[0]?.alt_text || productName;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => {
    if (img.src !== PLACEHOLDER_IMAGE) {
      img.src = PLACEHOLDER_IMAGE;
    }
  });

  media.append(img);

  if (isUnavailable) {
    const badge = document.createElement('span');
    badge.className = 'product-badge';
    badge.textContent = 'Unavailable';
    media.append(badge);
  }

  const body = document.createElement('div');
  body.className = 'cart-row__body';

  const title = document.createElement(productHref ? 'a' : 'span');
  title.className = 'cart-row__title';
  title.textContent = productName;

  if (productHref) {
    title.href = productHref;
  }

  const priceLine = document.createElement('p');
  priceLine.className = 'cart-row__price';
  priceLine.textContent = isUnavailable
    ? 'This material is no longer available — remove it in your cart.'
    : `${formatINR(unitPriceCents / 100)} × ${quantity}`;

  const controls = document.createElement('div');
  controls.className = 'cart-row__controls';

  const lineTotal = document.createElement('strong');
  lineTotal.className = 'cart-row__total';
  lineTotal.textContent = isUnavailable ? '—' : formatINR((unitPriceCents * quantity) / 100);

  controls.append(lineTotal);
  body.append(title, priceLine, controls);
  row.append(media, body);

  return row;
}

/**
 * Renders the full review: shipping card, item rows, and the summary.
 */
function renderReview() {
  refs.skeleton.hidden = true;
  refs.statePanel.hidden = true;

  refs.shippingName.textContent = state.profile.name;
  refs.shippingAddress.textContent = state.profile.address;
  refs.shippingPhone.textContent = state.profile.phone;

  refs.items.replaceChildren();
  state.items.forEach((item) => {
    refs.items.append(renderReviewRow(item));
  });

  const units = purchasableUnits();
  const unavailableCount = state.items.filter((item) => !item.products?.is_active).length;

  refs.status.textContent = `Review ${state.items.length} ${state.items.length === 1 ? 'item' : 'items'}`;
  refs.subtotalLabel.textContent = `Total (${units} ${units === 1 ? 'item' : 'items'})`;
  refs.subtotal.textContent = formatINR(computeTotalCents() / 100);
  refs.placeOrder.disabled = units === 0;

  if (unavailableCount > 0) {
    showInfoToast('Some items are unavailable — remove them in your cart before placing the order.', {
      title: 'Review your cart',
      durationMs: 6000,
    });
  }

  refs.content.hidden = false;
}

/**
 * Loads the cart review (items + verified profile are already in state).
 */
async function loadReview() {
  renderSkeleton();

  try {
    const result = await getCartItems(state.user.id);

    if (!result.ok) {
      const message = result.error || 'Could not load your order review.';
      renderPanelState({
        title: 'Could not load checkout',
        message,
        actionLabel: 'Retry',
        handleAction: loadReview,
      });
      showErrorToast(message);
      refs.status.textContent = 'Checkout unavailable';
      return;
    }

    state.items = result.data || [];

    if (state.items.length === 0) {
      refs.status.textContent = 'Cart is empty';
      renderPanelState({
        title: 'Nothing to check out yet',
        message: 'Your cart is empty. Add materials from the catalog before placing an order.',
        actionLabel: 'Browse catalog',
        handleAction: () => {
          window.location.assign('/pages/listing.html');
        },
      });
      return;
    }

    renderReview();
  } catch (error) {
    const message = error?.message || 'Could not load your order review.';
    renderPanelState({
      title: 'Could not load checkout',
      message,
      actionLabel: 'Retry',
      handleAction: loadReview,
    });
    showErrorToast(message);
    refs.status.textContent = 'Checkout unavailable';
  }
}

/**
 * Places the order through the atomic RPC-backed service. The button is
 * busy-locked for the whole call so a double click can never double-order.
 */
async function handlePlaceOrder() {
  if (state.placing || purchasableUnits() === 0) {
    return;
  }

  state.placing = true;
  setLoading(refs.placeOrder, true, 'Placing order');

  try {
    const result = await createOrder(state.user.id);

    if (!result.ok) {
      showErrorToast(result.error || 'Could not place your order. Please try again.', {
        title: 'Order failed',
      });
      await loadReview();
      return;
    }

    /* Order is placed atomically — move to the confirmation screen (Phase 10). */
    notifyCartChanged();
    window.location.assign(`/pages/order-confirmation.html?orderId=${encodeURIComponent(result.data?.orderId || '')}`);
  } catch (error) {
    showErrorToast(error?.message || 'Could not place your order. Please try again.', {
      title: 'Order failed',
    });
    await loadReview();
  } finally {
    state.placing = false;
    setLoading(refs.placeOrder, false);
  }
}

/**
 * Boots Checkout behind the auth + profile-completion gates.
 */
async function bootCheckout() {
  if (!refs.header || !refs.bottomNav || !refs.items || !refs.placeOrder) {
    throw new Error('Checkout page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});
  showStoredFlash();

  refs.placeOrder.addEventListener('click', handlePlaceOrder);

  const auth = await requireAuth();

  if (!auth) {
    return;
  }

  const gate = await guardProfileOrRedirect({ returnTo: '/pages/checkout.html' });

  if (!gate) {
    /* Guard redirected to Login or Profile. */
    return;
  }

  if (!gate.profile) {
    renderPanelState({
      title: 'Could not verify your profile',
      message: gate.error || 'Please try again in a moment.',
      actionLabel: 'Retry',
      handleAction: bootCheckout,
    });
    return;
  }

  state.user = auth.user;
  state.profile = gate.profile;
  await loadReview();
}

bootCheckout();
