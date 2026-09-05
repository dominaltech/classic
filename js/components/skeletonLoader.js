/**
 * Creates a generic shimmer block used by every loading state in the app.
 * @param {Object} [options] - Skeleton block options.
 * @param {string} [options.variant] - Visual variant such as text, media, or button.
 * @param {number} [options.width] - Optional width percentage.
 * @param {string} [options.className] - Additional classes.
 * @returns {HTMLDivElement} Skeleton element.
 */
export function createSkeleton({ variant = 'text', width = 100, className = '' } = {}) {
  const node = document.createElement('div');
  node.className = `skeleton skeleton--${variant} ${className}`.trim();
  node.setAttribute('aria-hidden', 'true');

  if (Number.isFinite(width) && width > 0 && width < 100) {
    node.style.inlineSize = `${Math.round(width)}%`;
  }

  return node;
}

/**
 * Creates a product-card shaped skeleton for catalog and preview grids.
 * @param {number} [count] - Number of cards to render.
 * @returns {HTMLDivElement[]} Product card skeleton elements.
 */
export function createProductCardSkeletons(count = 4) {
  const safeCount = Math.max(1, Number(count) || 1);

  return Array.from({ length: safeCount }, () => {
    const card = document.createElement('article');
    card.className = 'skeleton-card';
    card.setAttribute('aria-hidden', 'true');

    const media = createSkeleton({ variant: 'media', className: 'skeleton-card__media' });
    const body = document.createElement('div');
    body.className = 'skeleton-card__body';

    body.append(
      createSkeleton({ variant: 'text-lg', width: 92 }),
      createSkeleton({ variant: 'text', width: 64 }),
      createSkeleton({ variant: 'text', width: 48 }),
      createSkeleton({ variant: 'button' }),
    );
    card.append(media, body);

    return card;
  });
}

/**
 * Renders a responsive product-card skeleton grid into a mount node.
 * @param {HTMLElement} target - Mount node for the skeleton grid.
 * @param {number} [count] - Number of cards to render.
 * @returns {HTMLDivElement} The created grid element.
 */
export function renderProductSkeletonGrid(target, count = 4) {
  if (!target) {
    throw new Error('renderProductSkeletonGrid requires a target element.');
  }

  const grid = document.createElement('div');
  grid.className = 'skeleton-grid';
  grid.setAttribute('role', 'status');
  grid.setAttribute('aria-label', 'Loading content');
  grid.append(...createProductCardSkeletons(count));
  target.append(grid);

  return grid;
}
