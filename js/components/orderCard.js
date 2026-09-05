/*
  Reusable order-history card: short id, placed date, status chip,
  total, item count, and a whole-card link to Order Detail.
  Pure DOM rendering; all data comes from the owning controller.
*/

import { formatINR, formatOrderDateTime, formatShortOrderId } from '../lib/format.js';
import { renderStatusChip } from './orderStatus.js';

const CHEVRON_ICON = new URL('../../assets/icons/chevron.svg', import.meta.url).href;

/**
 * Renders one order-history row card.
 * @param {object} order - Order row ({ id, status, total_amount, created_at, itemUnits, itemKinds }).
 * @returns {HTMLElement} Card element.
 */
export function renderOrderCard(order) {
  const detailHref = `/pages/order-detail.html?orderId=${encodeURIComponent(order.id)}`;
  const reference = formatShortOrderId(order.id);
  const placedAt = formatOrderDateTime(order.created_at);
  const units = Math.max(0, Number(order.itemUnits) || 0);
  const kinds = Math.max(0, Number(order.itemKinds) || 0);

  const card = document.createElement('article');
  card.className = 'order-card';

  const link = document.createElement('a');
  link.className = 'order-card__link';
  link.href = detailHref;
  link.setAttribute('aria-label', `View details of order ${reference}`);

  /* Left block: reference + placed date */
  const identity = document.createElement('div');
  identity.className = 'order-card__identity';

  const ref = document.createElement('strong');
  ref.className = 'order-card__ref';
  ref.textContent = reference;

  const date = document.createElement('span');
  date.className = 'order-card__date';
  date.textContent = placedAt || 'Date unavailable';

  identity.append(ref, date);

  /* Middle: status chip */
  const chip = renderStatusChip(order.status);

  /* Right block: total + item count */
  const totals = document.createElement('div');
  totals.className = 'order-card__totals';

  const total = document.createElement('strong');
  total.className = 'order-card__total';
  total.textContent = formatINR(order.total_amount);

  const items = document.createElement('span');
  items.className = 'order-card__items';
  items.textContent = kinds > 0
    ? `${units} ${units === 1 ? 'item' : 'items'}`
    : 'No items';

  totals.append(total, items);

  const chevron = document.createElement('img');
  chevron.className = 'order-card__chevron';
  chevron.src = CHEVRON_ICON;
  chevron.alt = '';
  chevron.setAttribute('aria-hidden', 'true');

  link.append(identity, chip, totals, chevron);
  card.append(link);

  return card;
}
