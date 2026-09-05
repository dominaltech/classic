/**
 * Formats a numeric price as Indian Rupees for customer-facing catalog UI.
 * @param {number | string} value - Raw price value.
 * @returns {string} Formatted INR price.
 */
export function formatINR(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/**
 * Trims long copy without breaking screen-reader access to full text.
 * @param {string} value - Source text.
 * @param {number} maxLength - Maximum visible characters.
 * @returns {string} Trimmed text.
 */
export function truncateText(value, maxLength = 96) {
  const clean = String(value || '').trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

/**
 * Builds the customer-facing short reference for an order uuid.
 * @param {string} id - Order uuid.
 * @returns {string} Short reference like #A1B2C3D4.
 */
export function formatShortOrderId(id) {
  const clean = String(id || '').trim();
  return clean ? `#${clean.slice(0, 8).toUpperCase()}` : '#—';
}

/**
 * Formats an ISO timestamp as an Indian-readable date ("3 Aug 2026").
 * @param {string | number | Date} value - Timestamp.
 * @returns {string} Formatted date ('' when the input is not a real date).
 */
export function formatOrderDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats an ISO timestamp as date + time ("3 Aug 2026, 5:41 pm").
 * @param {string | number | Date} value - Timestamp.
 * @returns {string} Formatted date-time ('' on bad input).
 */
export function formatOrderDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
