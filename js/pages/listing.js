import { renderBottomNav } from '../components/bottomNav.js';
import { renderActiveFilterChips, renderFilterBar, SORT_OPTIONS } from '../components/filterBar.js';
import { renderHeader } from '../components/header.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';
import { renderProductCard } from '../components/productCard.js';
import { createProductCardSkeletons } from '../components/skeletonLoader.js';
import { debounce } from '../lib/debounce.js';
import { consumeFlash } from '../lib/flash.js';
import { formatINR } from '../lib/format.js';
import { createPaginationState } from '../lib/pagination.js';
import { showErrorToast, showInfoToast, showSuccessToast } from '../lib/toast.js';
import {
  getCategoryBySlug,
  getMaterials,
  getPatternBySlug,
  getPatternsByStyle,
  getProducts,
  getStyleBySlug,
  getStylesByCategory,
} from '../services/catalogService.js';

const FILTER_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;
const SORT_VALUES = new Set(SORT_OPTIONS.map((option) => option.value));

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  heading: document.querySelector('[data-listing-heading]'),
  subtitle: document.querySelector('[data-listing-subtitle]'),
  status: document.querySelector('[data-listing-status]'),
  grid: document.querySelector('[data-listing-grid]'),
  state: document.querySelector('[data-listing-state]'),
  pagination: document.querySelector('[data-pagination]'),
  paginationStatus: document.querySelector('[data-pagination-status]'),
  prevPage: document.querySelector('[data-prev-page]'),
  nextPage: document.querySelector('[data-next-page]'),
  filterBar: document.querySelector('[data-filter-bar]'),
  activeFilters: document.querySelector('[data-active-filters]'),
  filterPanel: document.querySelector('[data-filter-panel]'),
};

/*
  Listing state is the single source of truth — every URL param, filter
  selection, and sort choice lives here and is mirrored into the URL so
  any catalog view is shareable by copy-pasting the address bar.
*/
const state = {
  page: 1,
  pageSize: PAGE_SIZE,
  categorySlug: '',
  styleSlug: '',
  patternSlug: '',
  category: null,
  style: null,
  pattern: null,
  materialNames: [],
  minPrice: null,
  maxPrice: null,
  sort: 'newest',
  catalogMaterials: [],
  catalogStyles: [],
  catalogPatterns: [],
  panelOpen: false,
  loading: false,
};

let filterHandles = null;
let latestRequestId = 0;
let latestStyleRequestId = 0;

const debouncedReload = debounce(() => {
  loadProducts();
}, FILTER_DEBOUNCE_MS);

/**
 * Parses a price value from URL/input text into a non-negative number or null.
 * @param {*} raw - Raw price text.
 * @returns {number | null} Parsed price or null when empty/invalid.
 */
function parsePriceValue(raw) {
  const trimmed = String(raw ?? '').trim();

  if (!trimmed) {
    return null;
  }

  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Parses the comma-separated material URL param into a deduped name list.
 * @param {string | null} raw - Raw `material` query param.
 * @returns {string[]} Deduped material names in URL order.
 */
function parseMaterialNames(raw) {
  if (!raw) {
    return [];
  }

  const seen = new Set();
  const names = [];

  String(raw).split(',').forEach((part) => {
    const name = part.trim();
    const key = name.toLowerCase();

    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  });

  return names;
}

/**
 * Maps URL material names onto canonical catalog names (case-insensitive).
 * Names without a catalog match are dropped so queries stay safe.
 * @param {string[]} names - Names from the URL.
 * @param {{id: string, name: string}[]} catalog - Catalog materials.
 * @returns {string[]} Canonical selected names.
 */
function normalizeMaterialNames(names, catalog) {
  const byLowerCase = new Map(catalog.map((material) => [material.name.toLowerCase(), material.name]));
  const selected = [];
  const seen = new Set();

  names.forEach((name) => {
    const canonical = byLowerCase.get(String(name).toLowerCase());

    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      selected.push(canonical);
    }
  });

  return selected;
}

/**
 * Reads every supported query param from the address bar into state.
 */
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const sortParam = params.get('sort') || 'newest';

  state.page = Math.max(1, Number(params.get('page')) || 1);
  state.categorySlug = params.get('category') || '';
  state.styleSlug = params.get('style') || '';
  state.patternSlug = params.get('pattern') || '';
  state.materialNames = parseMaterialNames(params.get('material'));
  state.minPrice = parsePriceValue(params.get('min_price'));
  state.maxPrice = parsePriceValue(params.get('max_price'));
  state.sort = SORT_VALUES.has(sortParam) ? sortParam : 'newest';
}

/**
 * Mirrors state into the address bar (pushState only when something changed).
 */
function syncUrl() {
  const next = new URLSearchParams();

  if (state.category) {
    next.set('category', state.category.slug);
  }

  if (state.style) {
    next.set('style', state.style.slug);
  }

  if (state.pattern) {
    next.set('pattern', state.pattern.slug);
  }

  if (state.materialNames.length > 0) {
    next.set('material', state.materialNames.join(','));
  }

  if (state.minPrice !== null) {
    next.set('min_price', String(state.minPrice));
  }

  if (state.maxPrice !== null) {
    next.set('max_price', String(state.maxPrice));
  }

  if (state.sort !== 'newest') {
    next.set('sort', state.sort);
  }

  if (state.page > 1) {
    next.set('page', String(state.page));
  }

  const query = next.toString();
  const target = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  const current = `${window.location.pathname}${window.location.search}`;

  if (target !== current) {
    window.history.pushState({}, '', target);
  }
}

/**
 * Resolves the category/style/pattern path named by the URL into objects.
 * Unknown or orphaned slugs are dropped gracefully (never fatal).
 */
async function resolveTaxonomy() {
  state.category = null;
  state.style = null;
  state.pattern = null;

  if (!state.categorySlug) {
    state.styleSlug = '';
    state.patternSlug = '';
    return;
  }

  const categoryResult = await getCategoryBySlug(state.categorySlug);

  if (!categoryResult.ok) {
    showErrorToast(categoryResult.error || 'Could not load the selected category.');
    state.styleSlug = '';
    state.patternSlug = '';
    return;
  }

  state.category = categoryResult.data;

  if (!state.category) {
    state.styleSlug = '';
    state.patternSlug = '';
    return;
  }

  if (state.styleSlug) {
    const styleResult = await getStyleBySlug(state.category.id, state.styleSlug);

    if (styleResult.ok) {
      state.style = styleResult.data;
    }
  }

  if (!state.style) {
    state.patternSlug = '';
    return;
  }

  if (state.patternSlug) {
    const patternResult = await getPatternBySlug(state.style.id, state.patternSlug);

    if (patternResult.ok) {
      state.pattern = patternResult.data;
    }
  }
}

/**
 * Loads filter panel options (materials globally; styles/patterns contextually)
 * and normalizes URL-selected material names against the catalog.
 */
async function loadFilterOptions() {
  state.catalogMaterials = [];
  state.catalogStyles = [];
  state.catalogPatterns = [];

  const materialsResult = await getMaterials();

  if (materialsResult.ok) {
    state.catalogMaterials = materialsResult.data || [];
    state.materialNames = normalizeMaterialNames(state.materialNames, state.catalogMaterials);
  } else {
    showErrorToast(materialsResult.error || 'Could not load materials.');
    state.materialNames = [];
  }

  if (state.category) {
    const stylesResult = await getStylesByCategory(state.category.id);

    if (stylesResult.ok) {
      state.catalogStyles = stylesResult.data || [];
    } else {
      showErrorToast(stylesResult.error || 'Could not load styles.');
    }
  }

  if (state.style) {
    const patternsResult = await getPatternsByStyle(state.style.id);

    if (patternsResult.ok) {
      state.catalogPatterns = patternsResult.data || [];
    } else {
      showErrorToast(patternsResult.error || 'Could not load patterns.');
    }
  }
}

/**
 * Resolves selected material names into ids for the products query.
 * @returns {string[]} Selected material ids.
 */
function resolveMaterialIds() {
  const selected = new Set(state.materialNames);
  return state.catalogMaterials
    .filter((material) => selected.has(material.name))
    .map((material) => material.id);
}

/**
 * Formats the active price range for its filter chip.
 * @returns {string} Human-readable range label.
 */
function priceRangeLabel() {
  if (state.minPrice !== null && state.maxPrice !== null) {
    return `${formatINR(state.minPrice)} – ${formatINR(state.maxPrice)}`;
  }

  if (state.minPrice !== null) {
    return `From ${formatINR(state.minPrice)}`;
  }

  return `Up to ${formatINR(state.maxPrice)}`;
}

/**
 * Derives the removable chip list from current filter state.
 * @returns {{key: string, value: string, label: string}[]} Active chips.
 */
function computeChips() {
  const chips = state.materialNames.map((name) => ({ key: 'material', value: name, label: name }));

  if (state.style) {
    chips.push({ key: 'style', value: state.style.slug, label: `Style: ${state.style.name}` });
  }

  if (state.pattern) {
    chips.push({ key: 'pattern', value: state.pattern.slug, label: `Pattern: ${state.pattern.name}` });
  }

  if (state.minPrice !== null || state.maxPrice !== null) {
    chips.push({ key: 'price', value: 'range', label: priceRangeLabel() });
  }

  return chips;
}

/**
 * Re-renders chips and syncs the count badge (safe while panel inputs have focus).
 * @param {{key: string, value: string, label: string}[]} [chips] - Precomputed chips.
 */
function renderChips(chips = computeChips()) {
  renderActiveFilterChips(refs.activeFilters, chips, {
    onRemove: handleChipRemove,
    onClearAll: handleResetFilters,
  });

  if (filterHandles) {
    filterHandles.setFilterCount(chips.length);
  }
}

/**
 * Fully re-renders the filter bar + panel + chips from state.
 * Used on boot, chip removal, reset, and popstate — never while typing.
 */
function renderFilterUI() {
  const chips = computeChips();

  filterHandles = renderFilterBar(
    { bar: refs.filterBar, panel: refs.filterPanel },
    {
      materials: state.catalogMaterials,
      styles: state.catalogStyles,
      patterns: state.catalogPatterns,
      values: {
        materialNames: state.materialNames,
        styleSlug: state.style?.slug || '',
        patternSlug: state.pattern?.slug || '',
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        sort: state.sort,
      },
      meta: {
        stylesEnabled: Boolean(state.category),
        patternsEnabled: Boolean(state.style),
        expanded: state.panelOpen,
      },
      filterCount: chips.length,
      onMaterialsChange: handleMaterialsChange,
      onStyleChange: handleStyleChange,
      onPatternChange: handlePatternChange,
      onPriceInput: handlePriceInput,
      onSortChange: handleSortChange,
      onResetAll: handleResetFilters,
      onPanelToggle: (isOpen) => {
        state.panelOpen = isOpen;
      },
    },
  );

  renderChips(chips);
}

/**
 * Shared path for every filter/sort change: back to page 1, sync URL,
 * and refetch with a short debounce so rapid toggles fire one request.
 */
function queueFilterReload() {
  state.page = 1;
  syncUrl();
  debouncedReload();
}

/**
 * Material checkbox group change handler.
 * @param {string[]} names - Newly selected material names.
 */
function handleMaterialsChange(names) {
  state.materialNames = Array.isArray(names) ? names.slice() : [];
  queueFilterReload();
  renderChips();
}

/**
 * Style select change handler — clears the pattern, then lazily loads
 * the new style's patterns into the pattern select.
 * @param {string} slug - Selected style slug ('' = cleared).
 */
function handleStyleChange(slug) {
  state.style = slug ? state.catalogStyles.find((style) => style.slug === slug) || null : null;
  state.pattern = null;
  state.patternSlug = '';
  state.catalogPatterns = [];

  if (filterHandles) {
    filterHandles.setPatternOptions([], { enabled: false, hintText: 'Select a style first to see its patterns.' });
  }

  queueFilterReload();
  renderChips();

  if (state.style) {
    loadPatternOptions(state.style.id);
  }
}

/**
 * Loads patterns for one style into the open panel (stale-safe).
 * @param {string} styleId - Style id whose patterns should load.
 */
async function loadPatternOptions(styleId) {
  const requestId = ++latestStyleRequestId;

  try {
    const result = await getPatternsByStyle(styleId);

    if (requestId !== latestStyleRequestId) {
      return;
    }

    if (!result.ok) {
      showErrorToast(result.error || 'Could not load patterns.');
      return;
    }

    state.catalogPatterns = result.data || [];

    if (filterHandles) {
      filterHandles.setPatternOptions(state.catalogPatterns, { enabled: true });
    }
  } catch (error) {
    if (requestId === latestStyleRequestId) {
      showErrorToast(error?.message || 'Could not load patterns.');
    }
  }
}

/**
 * Pattern select change handler.
 * @param {string} slug - Selected pattern slug ('' = cleared).
 */
function handlePatternChange(slug) {
  state.pattern = slug ? state.catalogPatterns.find((pattern) => pattern.slug === slug) || null : null;
  queueFilterReload();
  renderChips();
}

/**
 * Debounced price typing handler with min <= max validation.
 * While invalid, the error is shown and no refetch/URL sync happens.
 * @param {{minRaw: string, maxRaw: string}} prices - Raw input values.
 */
function handlePriceInput({ minRaw, maxRaw }) {
  const min = parsePriceValue(minRaw);
  const max = parsePriceValue(maxRaw);

  if (min !== null && max !== null && min > max) {
    if (filterHandles) {
      filterHandles.setPriceError('Minimum price cannot be greater than maximum price.');
    }
    debouncedReload.cancel();
    return;
  }

  if (filterHandles) {
    filterHandles.setPriceError('');
  }

  state.minPrice = min;
  state.maxPrice = max;
  queueFilterReload();
  renderChips();
}

/**
 * Sort select change handler.
 * @param {string} sort - Selected sort key.
 */
function handleSortChange(sort) {
  state.sort = SORT_VALUES.has(sort) ? sort : 'newest';
  queueFilterReload();
}

/**
 * Clears every panel filter (material, style, pattern, price) while keeping
 * the page's category context and current sort order.
 */
function handleResetFilters() {
  state.materialNames = [];
  state.style = null;
  state.styleSlug = '';
  state.pattern = null;
  state.patternSlug = '';
  state.catalogPatterns = [];
  state.minPrice = null;
  state.maxPrice = null;

  queueFilterReload();
  renderFilterUI();
}

/**
 * Removes one active filter chip and re-renders the panel controls.
 * @param {string} key - Chip kind: material | style | pattern | price.
 * @param {string} value - Chip value (material name / slug / range marker).
 */
function handleChipRemove(key, value) {
  if (key === 'material') {
    state.materialNames = state.materialNames.filter((name) => name !== value);
  }

  if (key === 'style') {
    state.style = null;
    state.styleSlug = '';
    state.pattern = null;
    state.patternSlug = '';
    state.catalogPatterns = [];
  }

  if (key === 'pattern') {
    state.pattern = null;
    state.patternSlug = '';
  }

  if (key === 'price') {
    state.minPrice = null;
    state.maxPrice = null;
  }

  queueFilterReload();
  renderFilterUI();
}

/**
 * Toggles the grid loading affordance on pagination controls.
 * @param {boolean} isLoading - Whether a fetch is in flight.
 */
function setLoading(isLoading) {
  state.loading = isLoading;
  refs.grid.setAttribute('aria-busy', String(isLoading));
  refs.prevPage.disabled = isLoading;
  refs.nextPage.disabled = isLoading;
}

/**
 * Swaps the grid for skeleton cards during any (re)fetch.
 */
function renderSkeletons() {
  refs.state.hidden = true;
  refs.grid.innerHTML = '';
  refs.grid.append(...createProductCardSkeletons(8));
}

/**
 * Renders a designed empty/error panel inside the results region.
 * @param {Object} input - Panel input.
 * @param {string} input.title - Panel heading.
 * @param {string} input.message - Panel message.
 * @param {string} [input.actionLabel] - Optional action button label.
 * @param {Function} [input.handleAction] - Optional action handler.
 */
function renderPanelState({ title, message, actionLabel, handleAction }) {
  refs.grid.innerHTML = '';
  refs.state.hidden = false;
  refs.state.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'panel-state';
  panel.innerHTML = `<h3>${title}</h3><p>${message}</p>`;

  if (actionLabel && handleAction) {
    const button = document.createElement('button');
    button.className = 'button button--ghost button--small';
    button.type = 'button';
    button.textContent = actionLabel;
    button.addEventListener('click', handleAction);
    panel.append(button);
  }

  refs.state.append(panel);
}

/**
 * Syncs the listing heading/subtitle with the resolved taxonomy path.
 */
function renderHeading() {
  const parts = [state.pattern?.name, state.style?.name, state.category?.name].filter(Boolean);
  refs.heading.textContent = parts.length > 0 ? parts.join(' / ') : 'All materials';
  refs.subtitle.textContent = parts.length > 0
    ? 'Showing the selected catalog path.'
    : 'Browse active products with clean pagination.';
}

/**
 * Fetches products for the current state — guards against stale responses
 * so rapid filter changes never render out-of-order results.
 */
async function loadProducts() {
  const requestId = ++latestRequestId;

  setLoading(true);
  renderSkeletons();
  renderHeading();

  try {
    const result = await getProducts({
      categoryId: state.category?.id,
      styleId: state.style?.id,
      patternId: state.pattern?.id,
      materialIds: resolveMaterialIds(),
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      sort: state.sort,
      page: state.page,
      pageSize: state.pageSize,
    });

    if (requestId !== latestRequestId) {
      return;
    }

    setLoading(false);

    if (!result.ok) {
      const message = result.error || 'Could not load products.';
      refs.status.textContent = 'Products unavailable';
      refs.pagination.hidden = true;
      renderPanelState({
        title: 'Could not load products',
        message,
        actionLabel: 'Retry',
        handleAction: loadProducts,
      });
      showErrorToast(message);
      return;
    }

    const pagination = createPaginationState({
      totalItems: result.count,
      pageSize: state.pageSize,
      page: state.page,
    });

    state.page = pagination.page;
    syncUrl();

    const products = result.data || [];
    refs.grid.innerHTML = '';

    if (products.length === 0) {
      const hasFilters = computeChips().length > 0;

      refs.status.textContent = 'No products found';
      refs.pagination.hidden = true;
      renderPanelState(hasFilters
        ? {
          title: 'No products match these filters',
          message: 'Try removing a filter or widening the price range to see more materials.',
          actionLabel: 'Clear all filters',
          handleAction: handleResetFilters,
        }
        : {
          title: 'No products found',
          message: 'This catalog view does not have products yet. Try another category from Home.',
        });
      return;
    }

    products.forEach((product) => {
      refs.grid.append(renderProductCard(product));
    });

    refs.status.textContent = `Showing ${pagination.from}-${pagination.to} of ${pagination.totalItems}`;
    refs.pagination.hidden = pagination.totalItems <= state.pageSize;
    refs.paginationStatus.textContent = `Page ${pagination.page} of ${pagination.pageCount}`;
    refs.prevPage.disabled = state.loading || !pagination.hasPrev;
    refs.nextPage.disabled = state.loading || !pagination.hasNext;
  } catch (error) {
    if (requestId !== latestRequestId) {
      return;
    }

    const message = error?.message || 'Could not load products.';
    setLoading(false);
    refs.status.textContent = 'Products unavailable';
    refs.pagination.hidden = true;
    renderPanelState({
      title: 'Could not load products',
      message,
      actionLabel: 'Retry',
      handleAction: loadProducts,
    });
    showErrorToast(message);
  }
}

/**
 * Restores the full page state when the user travels with browser
 * back/forward — the URL is always the source of truth.
 */
async function handlePopState() {
  debouncedReload.cancel();
  readUrlParams();
  await resolveTaxonomy();
  await loadFilterOptions();
  renderFilterUI();
  await loadProducts();
}

/**
 * Shows a queued one-time message after cross-page redirects
 * (e.g. the Product page sending shoppers back here).
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
 * Boots the listing page: chrome, URL restore, filter options, first fetch.
 */
async function bootListing() {
  if (!refs.header || !refs.bottomNav || !refs.grid || !refs.filterBar || !refs.activeFilters || !refs.filterPanel) {
    throw new Error('Listing page mount nodes are missing.');
  }

  const announcementEl = document.querySelector('#app-announcement');
  if (announcementEl) {
    announcementEl.innerHTML = `
      <div class="announcement-bar">
        <div class="announce-ticker">
          <div class="announce-ticker-track">
            <span>Classic Collection Solapur — <strong>classicsolapur.com</strong></span>
            <span>100% Authentic <strong>Pure Cotton, Linen & Khadi</strong></span>
            <span>Express Delivery <strong>Across India</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  const footerEl = document.querySelector('#app-footer');
  if (footerEl) {
    footerEl.innerHTML = `
      <footer class="site-footer">
        <div class="footer-grid">
          <div>
            <div class="footer-logo-row">
              <span style="font-family: var(--font-family-heading, 'Playfair Display', Georgia, serif); font-size: 1.25rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Classic Collection</span>
            </div>
            <p class="footer-desc">
              Classic Collection Solapur — Premium clothing materials and fabrics for men. Discover genuine cotton, linen, silk, and khadi weaves.
            </p>
          </div>
          <div>
            <div class="footer-col-title">Collections</div>
            <div class="footer-links">
              <a href="/pages/listing.html?style=formal">Men's Formal</a>
              <a href="/pages/listing.html?style=casual">Men's Casual</a>
              <a href="/pages/listing.html?material=Khadi">Handloom Khadi</a>
              <a href="/pages/listing.html?material=Silk">Festive Silk</a>
            </div>
          </div>
          <div>
            <div class="footer-col-title">Customer Care</div>
            <div class="footer-links">
              <a href="/pages/orders.html">Track Orders</a>
              <a href="/pages/profile.html">My Profile</a>
              <a href="/pages/cart.html">Shopping Bag</a>
            </div>
          </div>
          <div>
            <div class="footer-col-title">Location</div>
            <p style="font-size: 13px; color: var(--color-text-muted); line-height: 1.6;">
              Solapur, Maharashtra, India<br>
              Website: classicsolapur.com
            </p>
          </div>
        </div>
        <div class="footer-bottom">
          <div>© ${new Date().getFullYear()} Classic Collection Solapur (classicsolapur.com). All rights reserved.</div>
          <div>Premium Clothing Materials</div>
        </div>
      </footer>
    `;
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});
  showStoredFlash();

  refs.prevPage.addEventListener('click', () => {
    if (state.loading || state.page <= 1) {
      return;
    }

    debouncedReload.cancel();
    state.page -= 1;
    loadProducts();
  });

  refs.nextPage.addEventListener('click', () => {
    if (state.loading) {
      return;
    }

    debouncedReload.cancel();
    state.page += 1;
    loadProducts();
  });

  window.addEventListener('popstate', handlePopState);

  readUrlParams();
  await resolveTaxonomy();
  await loadFilterOptions();
  renderFilterUI();
  await loadProducts();
}

bootListing();
