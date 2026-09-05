import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { ORDER_STATUS_LABELS, normalizeStatus, renderStatusChip } from '../components/orderStatus.js';
import { createSkeleton } from '../components/skeletonLoader.js';
import { requireAuth } from '../lib/auth-guard.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';
import { queueFlash } from '../lib/flash.js';
import { formatINR, formatOrderDateTime, formatShortOrderId } from '../lib/format.js';
import { showErrorToast } from '../lib/toast.js';
import { getOrderById } from '../services/orderService.js';

const ORDERS_PATH = '/pages/orders.html';

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  breadcrumbCurrent: document.querySelector('[data-breadcrumb-current]'),
  title: document.querySelector('[data-order-title]'),
  placed: document.querySelector('[data-order-placed]'),
  chip: document.querySelector('[data-order-chip]'),
  skeleton: document.querySelector('[data-order-skeleton]'),
  content: document.querySelector('[data-order-content]'),
  statePanel: document.querySelector('[data-order-state]'),
  timeline: document.querySelector('[data-timeline]'),
  items: document.querySelector('[data-order-items]'),
  subtotal: document.querySelector('[data-order-subtotal]'),
  total: document.querySelector('[data-order-total]'),
  shippingName: document.querySelector('[data-shipping-name]'),
  shippingAddress: document.querySelector('[data-shipping-address]'),
  shippingPhone: document.querySelector('[data-shipping-phone]'),
};

const state = {
  user: null,
};

/**
 * Queues a friendly toast and sends the shopper back to Order History —
 * the single path for missing/invalid/foreign order ids.
 */
function redirectToOrders() {
  queueFlash({
    type: 'info',
    title: 'Order not found',
    message: 'That order is unavailable or the link has changed. Your orders are listed here.',
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
    createSkeleton({ variant: 'text', width: 34 }),
    createSkeleton({ variant: 'text', width: 52 }),
    createSkeleton({ variant: 'text', width: 86 }),
    createSkeleton({ variant: 'text', width: 78 }),
    createSkeleton({ variant: 'text', width: 64 }),
  );
  refs.skeleton.append(info);
}

/**
 * Renders a designed error panel with Retry (load failures never blank).
 * @param {string} message - User-safe message.
 */
function renderErrorState(message) {
  refs.skeleton.hidden = true;
  refs.content.hidden = true;
  refs.statePanel.hidden = false;
  refs.statePanel.replaceChildren();

  const panel = document.createElement('div');
  panel.className = 'panel-state';

  const heading = document.createElement('h3');
  heading.textContent = 'Could not load this order';

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
 * Renders one timeline row; the newest history row is the current state.
 * @param {object} entry - order_status_history row.
 * @param {boolean} isCurrent - True for the latest entry.
 * @returns {HTMLElement} Timeline row.
 */
function renderTimelineItem(entry, isCurrent) {
  const item = document.createElement('li');
  item.className = `order-timeline__item${isCurrent ? ' order-timeline__item--current' : ''}`;

  const marker = document.createElement('span');
  marker.className = 'order-timeline__marker';
  marker.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'order-timeline__content';

  const label = document.createElement('strong');
  label.textContent = ORDER_STATUS_LABELS[normalizeStatus(entry.status)];

  const time = document.createElement('span');
  time.className = 'order-timeline__time';
  time.textContent = formatOrderDateTime(entry.changed_at) || 'Time unavailable';

  content.append(label, time);

  const noteText = String(entry.note || '').trim();

  if (noteText) {
    const note = document.createElement('p');
    note.className = 'order-timeline__note';
    note.textContent = noteText;
    content.append(note);
  }

  item.append(marker, content);
  return item;
}

/**
 * Renders one snapshot item row (name/unit/quantity/total are frozen at order time).
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
 * Fills the page with the loaded order (everything from snapshot columns).
 * @param {object} order - Order joined with items + chronological history.
 */
function renderOrder(order) {
  const reference = formatShortOrderId(order.id);

  document.title = `Order ${reference} | Dominal Technology`;
  refs.breadcrumbCurrent.textContent = reference;
  refs.title.textContent = `Order ${reference}`;
  refs.placed.textContent = `Placed on ${formatOrderDateTime(order.created_at) || 'unknown date'}`;

  refs.chip.replaceChildren(renderStatusChip(order.status));

  /* Timeline — chronological history, newest entry marked current. */
  refs.timeline.replaceChildren();
  const history = Array.isArray(order.order_status_history) ? order.order_status_history : [];

  history.forEach((entry, index) => {
    refs.timeline.append(renderTimelineItem(entry, index === history.length - 1));
  });

  refs.items.replaceChildren();
  const items = Array.isArray(order.order_items) ? order.order_items : [];

  items.forEach((item) => {
    refs.items.append(renderSnapshotItem(item));
  });

  refs.subtotal.textContent = formatINR(order.subtotal_amount);
  refs.total.textContent = formatINR(order.total_amount);

  refs.shippingName.textContent = order.shipping_name || '—';
  refs.shippingAddress.textContent = order.shipping_address || '—';
  refs.shippingPhone.textContent = order.shipping_phone || '—';

  refs.skeleton.hidden = true;
  refs.statePanel.hidden = true;
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

  refs.content.hidden = true;
  refs.statePanel.hidden = true;
  renderSkeleton();

  try {
    const result = await getOrderById(orderId, state.user.id);
    refs.skeleton.hidden = true;

    if (!result.ok) {
      const message = result.error || 'Could not load this order.';
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
    const message = error?.message || 'Could not load this order.';
    renderErrorState(message);
    showErrorToast(message);
  }
}

/**
 * Boots Order Detail behind the auth gate. No status-change controls exist
 * on this page by design — customers only READ their order state.
 */
async function bootOrderDetail() {
  if (!refs.header || !refs.bottomNav || !refs.timeline || !refs.items) {
    throw new Error('Order detail page mount nodes are missing.');
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

bootOrderDetail();
