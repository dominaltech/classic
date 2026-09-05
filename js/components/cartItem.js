/*
  Reusable cart line-item row renderer — image, name, unit price,
  quantity stepper, line total, and remove action. Pure DOM rendering;
  cart page controllers own all data calls and optimistic updates.
*/

import { formatINR } from '../lib/format.js';
import { createQuantitySelector } from './quantitySelector.js';

const PLACEHOLDER_IMAGE = new URL('../../assets/images/product-placeholder.svg', import.meta.url).href;

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
 * Picks the first product image by display_order.
 * @param {object} product - Joined product row.
 * @returns {object | null} Primary image row or null.
 */
function primaryImage(product) {
  const images = Array.isArray(product?.product_images) ? [...product.product_images] : [];
  images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  return images[0] || null;
}

/**
 * Renders one cart line item.
 * @param {object} item - Cart row ({ id, quantity, product_id, products }).
 * @param {Object} handlers - Row handlers.
 * @param {(item: object, quantity: number) => void} handlers.onQuantityChange - Committed quantity change.
 * @param {(item: object) => void} handlers.onRemove - Remove request.
 * @returns {{element: HTMLElement, setQuantity: (q: number) => void, setBusy: (busy: boolean) => void}} Row handle.
 */
export function renderCartItemRow(item, { onQuantityChange, onRemove } = {}) {
  const product = item.products || {};
  const productName = product.name || 'Unavailable material';
  const productHref = product.id ? `/pages/product.html?id=${encodeURIComponent(product.id)}` : '';
  const isUnavailable = !product.is_active;
  const stock = Math.max(0, Number(product.stock_quantity) || 0);
  const unitPriceCents = Math.max(0, Math.round(Number(product.price) * 100) || 0);
  const quantity = Math.max(1, Number.parseInt(item.quantity, 10) || 1);

  const row = document.createElement('article');
  row.className = 'cart-row';
  row.dataset.cartItemId = item.id;

  /* Media ----------------------------------------------------------------- */
  const media = document.createElement(productHref ? 'a' : 'div');
  media.className = 'cart-row__media';

  if (productHref) {
    media.href = productHref;
    media.setAttribute('aria-label', `View ${productName}`);
  }

  const image = primaryImage(product);
  const img = document.createElement('img');
  img.src = safeImageUrl(image?.image_url);
  img.alt = image?.alt_text || productName;
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

  /* Body ------------------------------------------------------------------- */
  const body = document.createElement('div');
  body.className = 'cart-row__body';

  const topRow = document.createElement('div');
  topRow.className = 'cart-row__top';

  const title = document.createElement(productHref ? 'a' : 'span');
  title.className = 'cart-row__title';
  title.textContent = productName;

  if (productHref) {
    title.href = productHref;
  }

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'button button--ghost button--small cart-row__remove';
  removeButton.textContent = 'Remove';
  removeButton.setAttribute('aria-label', `Remove ${productName} from cart`);
  removeButton.addEventListener('click', () => {
    if (typeof onRemove === 'function') {
      onRemove(item);
    }
  });

  topRow.append(title, removeButton);

  const priceLine = document.createElement('p');
  priceLine.className = 'cart-row__price';
  priceLine.textContent = `${formatINR(unitPriceCents / 100)} each`;

  const hint = document.createElement('p');
  hint.className = 'cart-row__hint';
  hint.hidden = true;

  const controls = document.createElement('div');
  controls.className = 'cart-row__controls';

  const lineTotal = document.createElement('strong');
  lineTotal.className = 'cart-row__total';

  let quantitySelector = null;

  if (isUnavailable) {
    hint.textContent = 'This material is no longer available — remove it to continue.';
    hint.hidden = false;
  } else {
    quantitySelector = createQuantitySelector({
      min: 1,
      max: Math.max(1, stock),
      value: quantity,
      label: `Quantity for ${productName}`,
      onChange: (nextQuantity) => {
        updateLineTotal(nextQuantity);

        if (typeof onQuantityChange === 'function') {
          onQuantityChange(item, nextQuantity);
        }
      },
    });
    controls.append(quantitySelector.element);
  }

  /**
   * Recomputes the visible line-total from unit price × quantity using
   * integer cents so floats never drift.
   * @param {number} qty - Quantity to price.
   */
  function updateLineTotal(qty) {
    const safeQty = Math.max(1, Number.parseInt(qty, 10) || 1);
    lineTotal.textContent = formatINR((unitPriceCents * safeQty) / 100);
  }

  updateLineTotal(quantity);
  controls.append(lineTotal);

  if (isUnavailable) {
    lineTotal.textContent = '—';
  }

  body.append(topRow, priceLine, hint, controls);
  row.append(media, body);

  return {
    element: row,
    /**
     * Restores a quantity after a failed sync (rollback path).
     * @param {number} restoredQuantity - Server-truth quantity.
     */
    setQuantity(restoredQuantity) {
      if (quantitySelector) {
        quantitySelector.setValue(restoredQuantity);
      }
      updateLineTotal(restoredQuantity);
    },
    /**
     * Freezes/unfreezes row controls while a server call runs.
     * @param {boolean} busy - True while a request is in flight.
     */
    setBusy(busy) {
      const isBusy = Boolean(busy);
      removeButton.disabled = isBusy;

      if (quantitySelector) {
        quantitySelector.setDisabled(isBusy);
      }
    },
  };
}
