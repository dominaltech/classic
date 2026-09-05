/**
 * Builds a safe one-based pagination state for Prev/Next controls.
 * @param {Object} input - Pagination input.
 * @param {number} input.totalItems - Total matching rows.
 * @param {number} input.pageSize - Rows per page.
 * @param {number} input.page - Requested one-based page.
 * @returns {{page: number, pageCount: number, hasPrev: boolean, hasNext: boolean, from: number, to: number, totalItems: number}} Pagination state.
 */
export function createPaginationState({ totalItems = 0, pageSize = 20, page = 1 } = {}) {
  const safeTotal = Math.max(0, Number(totalItems) || 0);
  const safePageSize = Math.max(1, Number(pageSize) || 20);
  const pageCount = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const safePage = Math.min(pageCount, Math.max(1, Number(page) || 1));
  const from = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const to = Math.min(safeTotal, safePage * safePageSize);

  return {
    page: safePage,
    pageCount,
    hasPrev: safePage > 1,
    hasNext: safePage < pageCount,
    from,
    to,
    totalItems: safeTotal,
  };
}

/**
 * Clamps a requested page into the valid one-based range.
 * @param {number} page - Requested page.
 * @param {number} pageCount - Known page count.
 * @returns {number} Safe page.
 */
export function clampPage(page, pageCount) {
  const safeCount = Math.max(1, Number(pageCount) || 1);
  return Math.min(safeCount, Math.max(1, Number(page) || 1));
}
