import { supabase } from '../config/supabaseClient.js';

/*
  Order placement service. The actual order write happens inside the
  `place_order` Postgres RPC (migration 0010) so the order, its items,
  the status-history row, and the cart clear are ONE atomic transaction.
  No payment field, payment step, or payment SDK exists here by design.
*/

/** Stable mappings from RPC error codes to customer-safe copy. */
const ORDER_ERROR_MESSAGES = {
  ORDER_NOT_AUTHORIZED: 'You can only place orders for your own account.',
  ORDER_PROFILE_INCOMPLETE: 'Complete your name, address, and phone number before placing an order.',
  ORDER_CART_EMPTY: 'Your cart is empty — add materials before checkout.',
};

/**
 * Extracts the payload of an `ORDER_ITEMS_UNAVAILABLE: names...` RPC error.
 * @param {string} raw - Raw Postgres error message.
 * @returns {string | null} Comma-separated product names, or null when absent.
 */
function unavailableItemsFromMessage(raw) {
  const marker = 'ORDER_ITEMS_UNAVAILABLE:';
  const index = raw.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return raw.slice(index + marker.length).trim() || null;
}

/**
 * Places the signed-in customer's order as a single atomic operation.
 * Shipping/product snapshots, status history, and cart clearing all live
 * transactionally inside the RPC — this call either succeeds fully or not at all.
 * @param {string} userId - Order owner id (RPC double-checks auth.uid()).
 * @returns {Promise<{ok: boolean, data?: {orderId: string}, code?: string, error?: string}>} Placement result.
 */
export async function createOrder(userId) {
  if (!userId) {
    return { ok: false, error: 'Please log in to place your order.' };
  }

  try {
    const { data, error } = await supabase.rpc('place_order', { p_user_id: userId });

    if (error) {
      const raw = String(error.message || '');
      const unavailableNames = unavailableItemsFromMessage(raw);

      if (unavailableNames !== null) {
        return {
          ok: false,
          code: 'ORDER_ITEMS_UNAVAILABLE',
          error: `These materials are unavailable or out of stock: ${unavailableNames}. Update your cart and try again.`,
        };
      }

      const known = Object.entries(ORDER_ERROR_MESSAGES)
        .find(([code]) => raw.includes(code));

      if (known) {
        return { ok: false, code: known[0], error: known[1] };
      }

      return { ok: false, error: raw || 'Could not place your order. Please try again.' };
    }

    return { ok: true, data: { orderId: data } };
  } catch (error) {
    return { ok: false, error: error?.message || 'Could not place your order. Please try again.' };
  }
}

/** Loose RFC-4122 uuid check for order ids coming from query params. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORDER_HISTORY_COLUMNS = `
  id,
  status,
  total_amount,
  created_at,
  order_items(quantity)
`;

const ORDER_DETAIL_COLUMNS = `
  id,
  status,
  shipping_name,
  shipping_address,
  shipping_phone,
  subtotal_amount,
  total_amount,
  created_at,
  order_items(id, product_id, product_name_snapshot, unit_price, quantity, line_total),
  order_status_history(id, status, note, changed_at)
`;

/**
 * Keeps only positive one-based integers.
 * @param {*} value - Raw value.
 * @param {number} fallback - Fallback when unusable.
 * @returns {number} Safe positive integer.
 */
function clampPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Loads one page of a customer's orders (newest first) with exact count.
 * @param {string} userId - Order owner id.
 * @param {Object} [params] - Pagination params.
 * @param {number} [params.page] - One-based page.
 * @param {number} [params.pageSize] - Rows per page.
 * @returns {Promise<{ok: boolean, data?: object[], count?: number, page?: number, pageSize?: number, error?: string}>} Page result.
 */
export async function getOrders(userId, { page = 1, pageSize = 10 } = {}) {
  if (!userId) {
    return { ok: true, data: [], count: 0, page: 1, pageSize };
  }

  const safePage = clampPositiveInteger(page, 1);
  const safePageSize = clampPositiveInteger(pageSize, 10);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  try {
    const [countResult, dataResult] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('orders')
        .select(ORDER_HISTORY_COLUMNS)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to),
    ]);

    if (countResult.error) {
      return { ok: false, error: countResult.error.message || 'Could not load your orders.' };
    }

    if (dataResult.error) {
      return { ok: false, error: dataResult.error.message || 'Could not load your orders.' };
    }

    const orders = (dataResult.data || []).map((order) => {
      const items = Array.isArray(order.order_items) ? order.order_items : [];

      return {
        ...order,
        itemKinds: items.length,
        itemUnits: items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0),
      };
    });

    return {
      ok: true,
      data: orders,
      count: countResult.count || 0,
      page: safePage,
      pageSize: safePageSize,
    };
  } catch (error) {
    return { ok: false, error: error?.message || 'Could not load your orders.' };
  }
}

/**
 * Loads one order of the signed-in customer with items and status history.
 * Everything renders strictly from snapshot columns (blueprint rule), and
 * the history rows come back in chronological order for the timeline.
 * @param {string} orderId - Order uuid from the ?orderId= query param.
 * @param {string} userId - Order owner id (double safety on top of RLS).
 * @returns {Promise<{ok: boolean, data?: object | null, error?: string}>} Service result.
 */
export async function getOrderById(orderId, userId) {
  const safeId = String(orderId || '').trim();

  if (!UUID_PATTERN.test(safeId) || !userId) {
    return { ok: true, data: null };
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_DETAIL_COLUMNS)
      .eq('id', safeId)
      .eq('user_id', userId)
      .order('changed_at', { referencedTable: 'order_status_history', ascending: true })
      .order('id', { referencedTable: 'order_status_history', ascending: true })
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message || 'Could not load this order.' };
    }

    if (!data) {
      return { ok: true, data: null };
    }

    const history = Array.isArray(data.order_status_history)
      ? [...data.order_status_history].sort((a, b) => {
        const byTime = new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime();
        return byTime !== 0 ? byTime : String(a.id).localeCompare(String(b.id));
      })
      : [];

    return { ok: true, data: { ...data, order_status_history: history } };
  } catch (error) {
    return { ok: false, error: error?.message || 'Could not load this order.' };
  }
}
