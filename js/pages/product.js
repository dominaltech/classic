import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { renderProductGallery } from '../components/productGallery.js';
import { createQuantitySelector } from '../components/quantitySelector.js';
import { createSkeleton } from '../components/skeletonLoader.js';
import { bindHeaderCartBadge, notifyCartChanged } from '../lib/cart-badge.js';
import { queueFlash } from '../lib/flash.js';
import { formatINR } from '../lib/format.js';
import { guardProfileOrRedirect } from '../lib/profile-guard.js';
import { showErrorToast, showSuccessToast } from '../lib/toast.js';
import { addCartItem } from '../services/cartService.js';
import { getProductById } from '../services/catalogService.js';

const LISTING_PATH = '/pages/listing.html';

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  breadcrumbCurrent: document.querySelector('[data-breadcrumb-current]'),
  breadcrumbCategory: document.querySelector('[data-breadcrumb-category]'),
  breadcrumbCategorySeparator: document.querySelector('[data-breadcrumb-category-separator]'),
  skeleton: document.querySelector('[data-product-skeleton]'),
  detail: document.querySelector('[data-product-detail]'),
  gallery: document.querySelector('[data-product-gallery]'),
  meta: document.querySelector('[data-product-meta]'),
  name: document.querySelector('[data-product-name]'),
  price: document.querySelector('[data-product-price]'),
  stock: document.querySelector('[data-product-stock]'),
  description: document.querySelector('[data-product-description]'),
  quantityGroup: document.querySelector('[data-product-quantity]'),
  quantityMount: document.querySelector('[data-quantity-mount]'),
  addToCart: document.querySelector('[data-add-to-cart]'),
  buyNow: document.querySelector('[data-buy-now]'),
  note: document.querySelector('[data-product-note]'),
  statePanel: document.querySelector('[data-product-state]'),
};

const state = {
  product: null,
  outOfStock: false,
  loading: false,
};

let quantitySelector = null;

/**
 * Queues a friendly toast and replaces the current view with the Listing
 * page — the single path for missing/invalid/unknown product ids.
 */
function redirectToListing() {
  queueFlash({
    type: 'info',
    title: 'Product not found',
    message: 'That product is unavailable or the link has changed. Browse the catalog instead.',
    durationMs: 5200,
  });
  window.location.replace(LISTING_PATH);
}

/**
 * Renders the shaped loading skeleton (gallery + info column).
 */
function renderSkeleton() {
  refs.detail.hidden = true;
  refs.statePanel.hidden = true;
  refs.skeleton.hidden = false;
  refs.skeleton.replaceChildren();

  const media = createSkeleton({ variant: 'media', className: 'product-detail-skeleton__media' });

  const info = document.createElement('div');
  info.className = 'product-detail-skeleton__info';
  info.append(
    createSkeleton({ variant: 'text', width: 42 }),
    createSkeleton({ variant: 'text-lg', width: 78 }),
    createSkeleton({ variant: 'text-lg', width: 30 }),
    createSkeleton({ variant: 'text', width: 96 }),
    createSkeleton({ variant: 'text', width: 88 }),
    createSkeleton({ variant: 'button', width: 46 }),
  );

  refs.skeleton.append(media, info);
}

/**
 * Renders a designed error panel with a Retry action (load failures never
 * blank the page and never redirect).
 * @param {string} message - User-safe error message.
 */
function renderErrorState(message) {
  refs.skeleton.hidden = true;
  refs.detail.hidden = true;
  refs.statePanel.hidden = false;
  refs.statePanel.replaceChildren();

  const panel = document.createElement('div');
  panel.className = 'panel-state';

  const title = document.createElement('h3');
  title.textContent = 'Could not load this product';

  const copy = document.createElement('p');
  copy.textContent = message;

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'button button--ghost button--small';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => {
    loadProduct();
  });

  panel.append(title, copy, retry);
  refs.statePanel.append(panel);
}

/**
 * Syncs purchase controls with loading/stock state.
 * @param {boolean} disabled - True while an async action runs.
 */
function setActionsDisabled(disabled) {
  const blocked = disabled || state.outOfStock || !state.product;
  refs.addToCart.disabled = blocked;
  refs.buyNow.disabled = blocked;

  if (quantitySelector) {
    quantitySelector.setDisabled(disabled);
  }
}

/**
 * Phase-4 profile gate shared by Add to Cart and Buy Now. The guard always
 * runs first; the actual cart write arrives in Phase 8 (cartService).
 * @param {'cart' | 'buy'} action - Which purchase action fired.
 */
async function handlePurchaseAction(action) {
  if (state.loading || !state.product) {
    return;
  }

  setActionsDisabled(true);

  try {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const gate = await guardProfileOrRedirect({ returnTo });

    if (!gate) {
      /* Guard redirected to Login or Profile — nothing else to do. */
      return;
    }

    if (!gate.profile) {
      showErrorToast(gate.error || 'Could not verify your profile. Please try again.');
      setActionsDisabled(false);
      return;
    }

    const quantity = quantitySelector ? quantitySelector.getValue() : 1;

    /* Profile gate passed — write the cart row through cartService. */
    const result = await addCartItem(gate.auth.user.id, state.product.id, quantity);

    if (!result.ok) {
      showErrorToast(result.error || 'Could not add this item to your cart.');
      setActionsDisabled(false);
      return;
    }

    notifyCartChanged();

    if (action === 'cart') {
      const cappedNote = result.data?.capped ? ' (capped at available stock)' : '';
      showSuccessToast(`Added ${result.data?.quantity ?? quantity} × ${state.product.name} to your cart${cappedNote}.`, {
        title: 'Added to cart',
      });
      setActionsDisabled(false);
      return;
    }

    /* Buy Now lands the shopper straight on the cart review. */
    window.location.assign('/pages/cart.html');
  } catch (error) {
    showErrorToast(error?.message || 'Something went wrong. Please try again.');
    setActionsDisabled(false);
  }
}

/**
 * Fills the detail section with a loaded product and enables interactions.
 * @param {object} product - Product row joined with taxonomy + images.
 */
function renderProduct(product) {
  state.product = product;
  state.outOfStock = Number(product.stock_quantity) <= 0;

  document.title = `${product.name} | Classic Collection Solapur`;
  refs.breadcrumbCurrent.textContent = product.name;

  if (product.categories) {
    const categoryLink = document.createElement('a');
    categoryLink.className = 'breadcrumb__link';
    categoryLink.href = `${LISTING_PATH}?category=${encodeURIComponent(product.categories.slug)}`;
    categoryLink.textContent = product.categories.name;
    refs.breadcrumbCategory.replaceChildren(categoryLink);
    refs.breadcrumbCategorySeparator.hidden = false;
  } else {
    refs.breadcrumbCategory.replaceChildren();
    refs.breadcrumbCategorySeparator.hidden = true;
  }

  const metaParts = [
    product.categories?.name,
    product.styles?.name,
    product.patterns?.name,
    product.materials?.name,
  ].filter(Boolean);
  refs.meta.textContent = metaParts.join(' · ');

  refs.name.textContent = product.name;
  refs.price.textContent = formatINR(product.price);

  if (state.outOfStock) {
    refs.stock.textContent = 'Out of stock';
    refs.stock.classList.add('product-detail__stock--out');
    refs.note.textContent = 'This material is out of stock right now. Purchase actions are disabled.';
    refs.note.hidden = false;
  } else {
    refs.stock.textContent = `In stock — ${Number(product.stock_quantity)} available`;
    refs.stock.classList.remove('product-detail__stock--out');
    refs.note.hidden = true;
  }

  const description = String(product.description || '').trim();
  refs.description.textContent = description || 'No description added for this material yet.';

  renderProductGallery(refs.gallery, {
    images: product.product_images,
    productName: product.name,
    outOfStock: state.outOfStock,
  });

  refs.quantityMount.replaceChildren();
  quantitySelector = null;

  if (state.outOfStock) {
    refs.quantityGroup.hidden = true;
  } else {
    refs.quantityGroup.hidden = false;
    quantitySelector = createQuantitySelector({
      min: 1,
      max: Number(product.stock_quantity),
      value: 1,
      label: `Quantity for ${product.name}`,
    });
    refs.quantityMount.append(quantitySelector.element);
  }

  refs.detail.setAttribute('aria-busy', 'false');
  refs.skeleton.hidden = true;
  refs.statePanel.hidden = true;
  refs.detail.hidden = false;
  setActionsDisabled(false);
}

/**
 * Loads the product named by ?id= and routes to the right view:
 * redirect (unknown id), error panel (fetch failure), or detail render.
 */
async function loadProduct() {
  const productId = new URLSearchParams(window.location.search).get('id');

  if (!productId) {
    redirectToListing();
    return;
  }

  state.loading = true;
  renderSkeleton();

  try {
    const result = await getProductById(productId);
    state.loading = false;

    if (!result.ok) {
      const message = result.error || 'Could not load the product.';
      renderErrorState(message);
      showErrorToast(message);
      return;
    }

    if (!result.data) {
      redirectToListing();
      return;
    }

    renderProduct(result.data);
  } catch (error) {
    state.loading = false;
    const message = error?.message || 'Could not load the product.';
    renderErrorState(message);
    showErrorToast(message);
  }
}

/**
 * Boots the Product Detail page: chrome, action wiring, first load.
 */
function bootProduct() {
  if (!refs.header || !refs.bottomNav || !refs.detail || !refs.skeleton) {
    throw new Error('Product page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});

  refs.addToCart.addEventListener('click', () => {
    handlePurchaseAction('cart');
  });

  refs.buyNow.addEventListener('click', () => {
    handlePurchaseAction('buy');
  });

  loadProduct();
}

bootProduct();
