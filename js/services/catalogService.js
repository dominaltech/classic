import { supabase } from '../config/supabaseClient.js';

const PRODUCT_COLUMNS = `
  id,
  name,
  slug,
  description,
  price,
  stock_quantity,
  created_at,
  categories(name, slug),
  styles(name, slug),
  patterns(name, slug),
  materials(name),
  product_images(image_url, alt_text, display_order)
`;

/**
 * Sort definitions supported by the product listing contract.
 * `created_at` and `id` are always appended as stable tie-breakers so
 * paginated pages never shuffle rows between requests.
 */
const PRODUCT_SORTS = {
  newest: { column: 'created_at', ascending: false },
  'price-asc': { column: 'price', ascending: true },
  'price-desc': { column: 'price', ascending: false },
};

/**
 * Loose RFC-4122 uuid check — lets getProductById treat malformed ids as
 * "not found" without ever hitting the database with an invalid cast.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Converts catalog errors into stable, user-safe messages.
 * @param {{message?: string, code?: string} | null | undefined} error - Supabase error object.
 * @param {string} fallback - Fallback message.
 * @returns {string} User-safe error message.
 */
function catalogErrorMessage(error, fallback = 'Could not load catalog data.') {
  if (!error) {
    return fallback;
  }

  return error.message || fallback;
}

/**
 * Keeps only positive one-based integers.
 * @param {*} value - Raw value.
 * @param {number} fallback - Fallback when the value is unusable.
 * @returns {number} Safe positive integer.
 */
function clampPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Normalizes a price bound into a non-negative finite number or null.
 * @param {*} value - Raw price bound.
 * @returns {number | null} Sanitized bound or null when absent/invalid.
 */
function sanitizePriceBound(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Keeps only non-empty string ids from a raw id list.
 * @param {*} ids - Raw id list.
 * @returns {string[]} Sanitized id list.
 */
function sanitizeIdList(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids.filter((id) => typeof id === 'string' && id.trim().length > 0);
}

/**
 * Loads all public product categories.
 * @returns {Promise<{ok: boolean, data?: object[], error?: string}>} Service result.
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (error) {
      return { ok: false, error: catalogErrorMessage(error, 'Could not load categories.') };
    }

    return { ok: true, data: data || [] };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load categories.') };
  }
}

/**
 * Resolves one category by its shareable slug.
 * @param {string} slug - Category slug.
 * @returns {Promise<{ok: boolean, data?: object | null, error?: string}>} Service result.
 */
export async function getCategoryBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      return { ok: false, error: catalogErrorMessage(error, 'Could not load the selected category.') };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load the selected category.') };
  }
}

/**
 * Loads styles for one category.
 * @param {string} categoryId - Category id.
 * @returns {Promise<{ok: boolean, data?: object[], error?: string}>} Service result.
 */
export async function getStylesByCategory(categoryId) {
  try {
    const { data, error } = await supabase
      .from('styles')
      .select('id, category_id, name, slug')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });

    if (error) {
      return { ok: false, error: catalogErrorMessage(error, 'Could not load styles.') };
    }

    return { ok: true, data: data || [] };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load styles.') };
  }
}

/**
 * Resolves one style inside a category by slug.
 * @param {string} categoryId - Category id.
 * @param {string} slug - Style slug.
 * @returns {Promise<{ok: boolean, data?: object | null, error?: string}>} Service result.
 */
export async function getStyleBySlug(categoryId, slug) {
  try {
    const { data, error } = await supabase
      .from('styles')
      .select('id, category_id, name, slug')
      .eq('category_id', categoryId)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      return { ok: false, error: catalogErrorMessage(error, 'Could not load the selected style.') };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load the selected style.') };
  }
}

/**
 * Loads every pattern belonging to one style (filter panel options).
 * @param {string} styleId - Style id.
 * @returns {Promise<{ok: boolean, data?: object[], error?: string}>} Service result.
 */
export async function getPatternsByStyle(styleId) {
  try {
    const { data, error } = await supabase
      .from('patterns')
      .select('id, style_id, name, slug')
      .eq('style_id', styleId)
      .order('name', { ascending: true });

    if (error) {
      return { ok: false, error: catalogErrorMessage(error, 'Could not load patterns.') };
    }

    return { ok: true, data: data || [] };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load patterns.') };
  }
}

/**
 * Resolves one pattern inside a style by slug.
 * @param {string} styleId - Style id.
 * @param {string} slug - Pattern slug.
 * @returns {Promise<{ok: boolean, data?: object | null, error?: string}>} Service result.
 */
export async function getPatternBySlug(styleId, slug) {
  try {
    const { data, error } = await supabase
      .from('patterns')
      .select('id, style_id, name, slug')
      .eq('style_id', styleId)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      return { ok: false, error: catalogErrorMessage(error, 'Could not load the selected pattern.') };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load the selected pattern.') };
  }
}

/**
 * Loads every material option (global filter group, not category-scoped).
 * @returns {Promise<{ok: boolean, data?: object[], error?: string}>} Service result.
 */
export async function getMaterials() {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      return { ok: false, error: catalogErrorMessage(error, 'Could not load materials.') };
    }

    return { ok: true, data: data || [] };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load materials.') };
  }
}

/**
 * Loads active products with exact count for pagination, filters, and sorting.
 * @param {Object} [params] - Product query params.
 * @param {string} [params.categoryId] - Optional category id.
 * @param {string} [params.styleId] - Optional style id.
 * @param {string} [params.patternId] - Optional pattern id.
 * @param {string[]} [params.materialIds] - Optional multi-select material ids.
 * @param {number | null} [params.minPrice] - Optional minimum price (inclusive).
 * @param {number | null} [params.maxPrice] - Optional maximum price (inclusive).
 * @param {string} [params.sort] - Sort key: newest | price-asc | price-desc.
 * @param {number} [params.page] - One-based page number.
 * @param {number} [params.pageSize] - Items per page.
 * @returns {Promise<{ok: boolean, data?: object[], count?: number, page?: number, pageSize?: number, error?: string}>} Service result.
 */
export async function getProducts({
  categoryId,
  styleId,
  patternId,
  materialIds = [],
  minPrice = null,
  maxPrice = null,
  sort = 'newest',
  page = 1,
  pageSize = 20,
} = {}) {
  const safePage = clampPositiveInteger(page, 1);
  const safePageSize = clampPositiveInteger(pageSize, 20);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const safeMaterialIds = sanitizeIdList(materialIds);
  const safeMinPrice = sanitizePriceBound(minPrice);
  const safeMaxPrice = sanitizePriceBound(maxPrice);
  const sortRule = PRODUCT_SORTS[sort] || PRODUCT_SORTS.newest;

  const applyFilters = (query) => {
    let nextQuery = query.eq('is_active', true);

    if (categoryId) {
      nextQuery = nextQuery.eq('category_id', categoryId);
    }

    if (styleId) {
      nextQuery = nextQuery.eq('style_id', styleId);
    }

    if (patternId) {
      nextQuery = nextQuery.eq('pattern_id', patternId);
    }

    if (safeMaterialIds.length > 0) {
      nextQuery = nextQuery.in('material_id', safeMaterialIds);
    }

    if (safeMinPrice !== null) {
      nextQuery = nextQuery.gte('price', safeMinPrice);
    }

    if (safeMaxPrice !== null) {
      nextQuery = nextQuery.lte('price', safeMaxPrice);
    }

    return nextQuery;
  };

  try {
    const [countResult, dataResult] = await Promise.all([
      applyFilters(supabase.from('products').select('id', { count: 'exact', head: true })),
      applyFilters(supabase.from('products').select(PRODUCT_COLUMNS))
        .order(sortRule.column, { ascending: sortRule.ascending })
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to),
    ]);

    if (countResult.error) {
      return { ok: false, error: catalogErrorMessage(countResult.error, 'Could not count products.') };
    }

    if (dataResult.error) {
      return { ok: false, error: catalogErrorMessage(dataResult.error, 'Could not load products.') };
    }

    return {
      ok: true,
      data: dataResult.data || [],
      count: countResult.count || 0,
      page: safePage,
      pageSize: safePageSize,
    };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load products.') };
  }
}

/**
 * Loads one active product by id with its full taxonomy + images joined.
 * Images are returned pre-sorted by display_order. An id that is missing,
 * malformed, inactive, or unknown resolves to `{ ok: true, data: null }`
 * so callers can show a single "product not found" path.
 * @param {string} id - Product uuid from the ?id= query param.
 * @returns {Promise<{ok: boolean, data?: object | null, error?: string}>} Service result.
 */
export async function getProductById(id) {
  const safeId = String(id || '').trim();

  if (!UUID_PATTERN.test(safeId)) {
    return { ok: true, data: null };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('id', safeId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return { ok: false, error: catalogErrorMessage(error, 'Could not load the product.') };
    }

    if (!data) {
      return { ok: true, data: null };
    }

    const images = Array.isArray(data.product_images)
      ? [...data.product_images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      : [];

    return { ok: true, data: { ...data, product_images: images } };
  } catch (error) {
    return { ok: false, error: catalogErrorMessage(error, 'Could not load the product.') };
  }
}
