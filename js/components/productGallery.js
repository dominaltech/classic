/*
  Reusable product image gallery for the Product Detail page.
  One main viewport plus lazy-loaded thumbnail buttons in display_order.
  Pure DOM rendering only — no data fetching lives here.
*/

const PLACEHOLDER_IMAGE = new URL('../../assets/images/product-placeholder.svg', import.meta.url).href;

/**
 * Accepts only safe absolute/site-relative image URLs; falls back to the
 * shared placeholder for anything else (protocol-relative, empty, junk).
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
 * Renders the product image gallery into a mount node.
 * @param {HTMLElement} mount - Gallery mount node.
 * @param {Object} input - Gallery input.
 * @param {{image_url: string, alt_text?: string, display_order?: number}[]} [input.images] - Product images.
 * @param {string} input.productName - Product name used for alt-text fallbacks.
 * @param {boolean} [input.outOfStock] - Shows the shared out-of-stock badge when true.
 */
export function renderProductGallery(mount, { images = [], productName = 'Product', outOfStock = false } = {}) {
  if (!mount) {
    throw new Error('renderProductGallery requires a mount node.');
  }

  mount.replaceChildren();

  const usable = Array.isArray(images)
    ? images.filter((image) => image && String(image.image_url || '').trim() !== '')
    : [];
  const ordered = [...usable].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const list = ordered.length > 0
    ? ordered
    : [{ image_url: PLACEHOLDER_IMAGE, alt_text: productName, display_order: 0 }];

  /* Main viewport ---------------------------------------------------------- */
  const viewport = document.createElement('div');
  viewport.className = 'product-gallery__viewport';

  const mainImage = document.createElement('img');
  mainImage.className = 'product-gallery__image';
  mainImage.src = safeImageUrl(list[0].image_url);
  mainImage.alt = list[0].alt_text || productName;
  mainImage.decoding = 'async';

  viewport.append(mainImage);

  if (outOfStock) {
    const badge = document.createElement('span');
    badge.className = 'product-badge';
    badge.textContent = 'Out of stock';
    viewport.append(badge);
  }

  mount.append(viewport);

  /* Broken main image falls back to the placeholder instead of a torn icon. */
  mainImage.addEventListener('error', () => {
    if (mainImage.src !== PLACEHOLDER_IMAGE) {
      mainImage.src = PLACEHOLDER_IMAGE;
    }
  });

  /* Thumbnail strip (only when there is a real choice) ---------------------- */
  if (list.length < 2) {
    return;
  }

  const strip = document.createElement('div');
  strip.className = 'product-gallery__thumbs';
  strip.setAttribute('role', 'group');
  strip.setAttribute('aria-label', 'Product images');

  const thumbButtons = list.map((image, index) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'product-gallery__thumb';
    thumb.setAttribute('aria-label', `View image ${index + 1} of ${list.length}`);
    thumb.setAttribute('aria-pressed', String(index === 0));

    const thumbImage = document.createElement('img');
    thumbImage.src = safeImageUrl(image.image_url);
    thumbImage.alt = '';
    thumbImage.setAttribute('aria-hidden', 'true');
    thumbImage.loading = 'lazy';
    thumbImage.decoding = 'async';
    thumbImage.addEventListener('error', () => {
      if (thumbImage.src !== PLACEHOLDER_IMAGE) {
        thumbImage.src = PLACEHOLDER_IMAGE;
      }
    });

    thumb.append(thumbImage);
    return thumb;
  });

  /**
   * Swaps the main viewport to the chosen thumbnail and syncs pressed state.
   * @param {number} index - Thumbnail index to activate.
   */
  function selectImage(index) {
    const image = list[index];

    mainImage.src = safeImageUrl(image.image_url);
    mainImage.alt = image.alt_text || `${productName} — image ${index + 1}`;

    thumbButtons.forEach((thumb, thumbIndex) => {
      thumb.setAttribute('aria-pressed', String(thumbIndex === index));
    });
  }

  thumbButtons.forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
      selectImage(index);
    });
  });

  strip.append(...thumbButtons);
  mount.append(strip);
}
