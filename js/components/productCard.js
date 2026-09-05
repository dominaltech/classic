import { formatINR, truncateText } from '../lib/format.js';

const PLACEHOLDER_IMAGE = new URL('../../assets/images/product-placeholder.svg', import.meta.url).href;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function primaryImage(product) {
  const images = Array.isArray(product.product_images) ? [...product.product_images] : [];
  images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  return images[0] || null;
}

function safeImageUrl(value) {
  const clean = String(value || '').trim();

  if (/^https?:\/\//i.test(clean) || clean.startsWith('/')) {
    return clean;
  }

  return PLACEHOLDER_IMAGE;
}

/**
 * Renders one reusable product card for Home, Listing, and future product surfaces.
 * @param {object} product - Product row joined with product_images.
 * @returns {HTMLElement} Product card element.
 */
export function renderProductCard(product) {
  const image = primaryImage(product);
  const href = `/pages/product.html?id=${encodeURIComponent(product.id)}`;
  const outOfStock = Number(product.stock_quantity) <= 0;
  const card = document.createElement('article');
  card.className = 'product-card';

  card.innerHTML = `
    <a class="product-card__media" href="${href}" aria-label="View ${escapeHtml(product.name)}">
      <img
        src="${escapeHtml(safeImageUrl(image?.image_url))}"
        alt="${escapeHtml(image?.alt_text || product.name)}"
        loading="lazy"
        decoding="async"
      />
      ${outOfStock ? '<span class="product-badge">Out of stock</span>' : ''}
    </a>
    <div class="product-card__body">
      <div class="product-card__meta">
        <span>${escapeHtml(product.categories?.name || 'Catalog')}</span>
        <span>${escapeHtml(product.materials?.name || 'Material')}</span>
      </div>
      <h3 class="product-card__title">
        <a href="${href}">${escapeHtml(product.name)}</a>
      </h3>
      <p class="product-card__copy">${escapeHtml(truncateText(product.description, 88))}</p>
      <div class="product-card__footer">
        <strong>${formatINR(product.price)}</strong>
        <span>${outOfStock ? 'Unavailable' : 'In stock'}</span>
      </div>
    </div>
  `;

  return card;
}
