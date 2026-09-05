/*
  Shared order-status vocabulary + chip renderer. Used by Order History,
  Order Confirmation, and Order Detail so status labels/colors never diverge.
  Customers never get a control that changes status — this is display-only.
*/

/** Canonical status flow (pending → ... → delivered) with customer-facing labels.
 *  `cancelled` sits OUTSIDE the happy-path flow: the customer reaches it only
 *  if the store cancels from the admin app, and it must render truthfully. */
export const ORDER_STATUS_LABELS = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

/** Ordered flow used by the timeline to mark completed steps. */
export const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

/**
 * Normalizes any raw status value into a known status key.
 * @param {*} status - Raw status from the database.
 * @returns {string} Known status key ('pending' when unknown).
 */
export function normalizeStatus(status) {
    const clean = String(status || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(ORDER_STATUS_LABELS, clean) ? clean : 'pending';
}

/**
 * Renders one status chip.
 * @param {*} status - Raw status value.
 * @returns {HTMLElement} Chip element with the status modifier class.
 */
export function renderStatusChip(status) {
    const key = normalizeStatus(status);
    const chip = document.createElement('span');
    chip.className = `status-chip status-chip--${key}`;
    chip.textContent = ORDER_STATUS_LABELS[key];
    return chip;
}
