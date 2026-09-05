import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { renderStatusChip } from '../components/orderStatus.js';
import { createSkeleton } from '../components/skeletonLoader.js';
import { requireAuth } from '../lib/auth-guard.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';
import { queueFlash } from '../lib/flash.js';
import { formatINR, formatOrderDateTime, formatShortOrderId } from '../lib/format.js';
import { showErrorToast } from '../lib/toast.js';
import { getOrderById } from '../services/orderService.js';

const CHECK_ICON = new URL('../../assets/icons/check.svg', import.meta.url).href;
const ORDERS_PATH = '/pages/orders.html';

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  hero: document.querySelector('[data-confirmation-hero]'),
  icon: document.querySelector('[data-confirmation-icon]'),
  ref: document.querySelector('[data-order-ref]'),
  date: document.querySelector('[data-order-date]'),
  chip: document.querySelector('[data-order-chip]'),
  skeleton: document.querySelector('[data-confirmation-skeleton]'),
  content: document.querySelector('[data-confirmation-content]'),
  statePanel: document.querySelector('[data-confirmation-state]'),
  items: document.querySelector('[data-confirmation-items]'),
  total: document.querySelector('[data-order-total]'),
  viewOrder: document.querySelector('[data-view-order]'),
  shippingName: document.querySelector('[data-shipping-name]'),
  shippingAddress: document.querySelector('[data-shipping-address]'),
  shippingPhone: document.querySelector('[data-shipping-phone]'),
};

const state = {
  user: null,
};

/**
 * Queues a friendly toast and sends the shopper to Order History — the
 * single path for missing/invalid/foreign order ids.
 */
function redirectToOrders() {
  queueFlash({
    type: 'info',
    title: 'Order not found',
    message: 'We could not open that order confirmation. Your orders are listed here.',
    durationMs: 5200,
  });
  window.location.replace(ORDERS_PATH);
}

/**
 * Renders block skeletons while the order loads.
 */
function renderSkeleton() {
  refs.skeleton.hidden = false;
  refs.skeleton.replaceChildren();

  const info = document.createElement('div');
  info.className = 'cart-skeleton__body';
  info.append(
    createSkeleton({ variant: 'media', className: 'confirmation-skeleton__badge' }),
    createSkeleton({ variant: 'text-lg', width: 52 }),
    createSkeleton({ variant: 'text', width: 38 }),
    createSkeleton({ variant: 'text', width: 84 }),
    createSkeleton({ variant: 'text', width: 72 }),
  );
  refs.skeleton.append(info);
}

/**
 * Renders a designed error panel with Retry.
 * @param {string} message - User-safe message.
 */
function renderErrorState(message) {
  refs.skeleton.hidden = true;
  refs.hero.hidden = true;
  refs.content.hidden = true;
  refs.statePanel.hidden = false;
  refs.statePanel.replaceChildren();

  const panel = document.createElement('div');
  panel.className = 'panel-state';

  const heading = document.createElement('h3');
  heading.textContent = 'Could not load your confirmation';

  const copy = document.createElement('p');
  copy.textContent = message;

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'button button--ghost button--small';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => {
    loadOrder();
  });

  panel.append(heading, copy, retry);
  refs.statePanel.append(panel);
}

/**
 * Renders one snapshot item row (frozen name/unit/quantity/total).
 * @param {object} item - order_items row.
 * @returns {HTMLElement} Item row.
 */
function renderSnapshotItem(item) {
  const row = document.createElement('article');
  row.className = 'order-item-row';

  const body = document.createElement('div');
  body.className = 'order-item-row__body';

  const name = document.createElement('strong');
  name.className = 'order-item-row__name';
  name.textContent = item.product_name_snapshot || 'Material';

  const meta = document.createElement('span');
  meta.className = 'order-item-row__meta';
  meta.textContent = `${formatINR(item.unit_price)} × ${Math.max(1, Number(item.quantity) || 1)}`;

  body.append(name, meta);

  const total = document.createElement('strong');
  total.className = 'order-item-row__total';
  total.textContent = formatINR(item.line_total);

  row.append(body, total);
  return row;
}

/**
 * Fills the confirmation view with the just-placed order.
 * @param {object} order - Order joined with snapshot items.
 */
function renderOrder(order) {
  const reference = formatShortOrderId(order.id);

  document.title = `Order ${reference} Confirmed | Dominal Technology`;

  const checkIcon = document.createElement('img');
  checkIcon.src = CHECK_ICON;
  checkIcon.alt = '';
  checkIcon.setAttribute('aria-hidden', 'true');
  refs.icon.replaceChildren(checkIcon);

  refs.ref.textContent = reference;
  refs.date.textContent = formatOrderDateTime(order.created_at) || 'just now';
  refs.chip.replaceChildren(renderStatusChip(order.status));

  refs.items.replaceChildren();
  const items = Array.isArray(order.order_items) ? order.order_items : [];

  items.forEach((item) => {
    refs.items.append(renderSnapshotItem(item));
  });

  refs.total.textContent = formatINR(order.total_amount);
  refs.viewOrder.href = `/pages/order-detail.html?orderId=${encodeURIComponent(order.id)}`;

  refs.shippingName.textContent = order.shipping_name || '—';
  refs.shippingAddress.textContent = order.shipping_address || '—';
  refs.shippingPhone.textContent = order.shipping_phone || '—';

  refs.skeleton.hidden = true;
  refs.statePanel.hidden = true;
  refs.hero.hidden = false;
  refs.content.hidden = false;
}

/**
 * Loads the order named by ?orderId= and routes to the right view.
 */
async function loadOrder() {
  const orderId = new URLSearchParams(window.location.search).get('orderId');

  if (!orderId) {
    redirectToOrders();
    return;
  }

  refs.hero.hidden = true;
  refs.content.hidden = true;
  refs.statePanel.hidden = true;
  renderSkeleton();

  try {
    const result = await getOrderById(orderId, state.user.id);
    refs.skeleton.hidden = true;

    if (!result.ok) {
      const message = result.error || 'Could not load your confirmation.';
      renderErrorState(message);
      showErrorToast(message);
      return;
    }

    if (!result.data) {
      redirectToOrders();
      return;
    }

    renderOrder(result.data);
  } catch (error) {
    refs.skeleton.hidden = true;
    const message = error?.message || 'Could not load your confirmation.';
    renderErrorState(message);
    showErrorToast(message);
  }
}

/**
 * Boots Order Confirmation behind the auth gate.
 */
async function bootConfirmation() {
  if (!refs.header || !refs.bottomNav || !refs.hero || !refs.items) {
    throw new Error('Order confirmation page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});

  const auth = await requireAuth();

  if (!auth) {
    return;
  }

  state.user = auth.user;
  await loadOrder();
}

bootConfirmation();
