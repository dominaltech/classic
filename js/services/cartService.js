import { supabase } from '../config/supabaseClient.js';

const CART_PRODUCT_COLUMNS = `
  id,
  name,
  slug,
  price,
  stock_quantity,
  is_active,
  product_images(image_url, alt_text, display_order)
`;

/**
 * Converts cart errors into stable, user-safe messages.
 * @param {{message?: string, code?: string} | null | undefined} error - Supabase error object.
 * @param {string} fallback - Fallback message.
 * @returns {string} User-safe error message.
 */
function cartErrorMessage(error, fallback = 'Something went wrong with your cart.') {
  if (!error) {
    return fallback;
  }

  return error.message || fallback;
}

/**
 * Normalizes any raw quantity into a positive whole number.
 * @param {*} value - Raw quantity.
 * @returns {number} Safe quantity (>= 1).
 */
function sanitizeQuantity(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Reads stock/availability for one product (cart rules depend on live stock).
 * @param {string} productId - Product id.
 * @returns {Promise<{ok: boolean, stock?: number, isActive?: boolean, error?: string}>} Stock snapshot.
 */
async function getProductStock(productId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('stock_quantity, is_active')
      .eq('id', productId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: cartErrorMessage(error, 'Could not check product stock.') };
    }

    if (!data) {
      return { ok: false, error: 'This material is no longer available.' };
    }

    return {
      ok: true,
      stock: Math.max(0, Number(data.stock_quantity) || 0),
      isActive: Boolean(data.is_active),
    };
  } catch (error) {
    return { ok: false, error: cartErrorMessage(error, 'Could not check product stock.') };
  }
}

/**
 * Counts total units across a customer's cart (header badge number).
 * @param {string} userId - Cart owner id.
 * @returns {Promise<{ok: boolean, count: number, error?: string}>} Unit count.
 */
export async function getCartCount(userId) {
  if (!userId) {
    return { ok: true, count: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', userId);

    if (error) {
      return { ok: false, count: 0, error: cartErrorMessage(error, 'Could not load the cart count.') };
    }

    const count = (data || []).reduce((sum, row) => sum + Math.max(0, Number(row.quantity) || 0), 0);
    return { ok: true, count };
  } catch (error) {
    return { ok: false, count: 0, error: cartErrorMessage(error, 'Could not load the cart count.') };
  }
}

/**
 * Loads a customer's cart rows joined with live product data + sorted images.
 * @param {string} userId - Cart owner id.
 * @returns {Promise<{ok: boolean, data?: object[], error?: string}>} Cart rows (newest first).
 */
export async function getCartItems(userId) {
  if (!userId) {
    return { ok: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`id, quantity, created_at, product_id, products(${CART_PRODUCT_COLUMNS})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { ok: false, error: cartErrorMessage(error, 'Could not load your cart.') };
    }

    const items = (data || []).map((row) => {
      const product = row.products;
      const images = product && Array.isArray(product.product_images)
        ? [...product.product_images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        : [];

      return {
        ...row,
        products: product ? { ...product, product_images: images } : null,
      };
    });

    return { ok: true, data: items };
  } catch (error) {
    return { ok: false, error: cartErrorMessage(error, 'Could not load your cart.') };
  }
}

/**
 * Adds a product to the cart. Re-adding the same product MERGES into the
 * existing row (blueprint rule: never a duplicate row) and every quantity
 * is capped at live stock.
 * @param {string} userId - Cart owner id.
 * @param {string} productId - Product id to add.
 * @param {number} [quantity=1] - Units to add.
 * @returns {Promise<{ok: boolean, data?: {merged: boolean, quantity: number, capped: boolean}, error?: string}>} Add result.
 */
export async function addCartItem(userId, productId, quantity = 1) {
  if (!userId || !productId) {
    return { ok: false, error: 'Could not add this item to your cart.' };
  }

  const addQty = sanitizeQuantity(quantity);

  const stockResult = await getProductStock(productId);

  if (!stockResult.ok) {
    return { ok: false, error: stockResult.error };
  }

  if (!stockResult.isActive) {
    return { ok: false, error: 'This material is currently unavailable.' };
  }

  if (stockResult.stock <= 0) {
    return { ok: false, error: 'This material is out of stock right now.' };
  }

  try {
    const { data: existing, error: lookupError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (lookupError) {
      return { ok: false, error: cartErrorMessage(lookupError, 'Could not update your cart.') };
    }

    if (existing) {
      const wanted = Number(existing.quantity) + addQty;
      const target = Math.min(stockResult.stock, wanted);

      if (target <= Number(existing.quantity)) {
        return {
          ok: false,
          error: `Only ${stockResult.stock} in stock — your cart already has the maximum available.`,
        };
      }

      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: target })
        .eq('id', existing.id)
        .select('id, quantity')
        .maybeSingle();

      if (updateError) {
        return { ok: false, error: cartErrorMessage(updateError, 'Could not update your cart.') };
      }

      return {
        ok: true,
        data: {
          merged: true,
          quantity: updated?.quantity ?? target,
          capped: target < wanted,
        },
      };
    }

    const insertQty = Math.min(stockResult.stock, addQty);
    const { data: inserted, error: insertError } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity: insertQty })
      .select('id, quantity')
      .maybeSingle();

    if (insertError) {
      /* Unique-violation = a concurrent add created the row first; merge once. */
      if (insertError.code === '23505') {
        return addCartItem(userId, productId, addQty);
      }

      return { ok: false, error: cartErrorMessage(insertError, 'Could not add this item to your cart.') };
    }

    return {
      ok: true,
      data: {
        merged: false,
        quantity: inserted?.quantity ?? insertQty,
        capped: insertQty < addQty,
      },
    };
  } catch (error) {
    return { ok: false, error: cartErrorMessage(error, 'Could not add this item to your cart.') };
  }
}

/**
 * Updates one cart row's quantity (>= 1, capped by live stock).
 * @param {string} itemId - Cart row id.
 * @param {string} userId - Cart owner id.
 * @param {number} quantity - New quantity.
 * @returns {Promise<{ok: boolean, data?: {quantity: number}, error?: string}>} Update result.
 */
export async function updateCartItemQuantity(itemId, userId, quantity) {
  if (!itemId || !userId) {
    return { ok: false, error: 'Could not update this item.' };
  }

  const nextQty = sanitizeQuantity(quantity);

  try {
    const { data: row, error: readError } = await supabase
      .from('cart_items')
      .select('id, products(stock_quantity, is_active)')
      .eq('id', itemId)
      .eq('user_id', userId)
      .maybeSingle();

    if (readError) {
      return { ok: false, error: cartErrorMessage(readError, 'Could not update this item.') };
    }

    if (!row) {
      return { ok: false, error: 'That cart item is no longer available. Refresh your cart.' };
    }

    const stock = Math.max(0, Number(row.products?.stock_quantity) || 0);
    const isActive = Boolean(row.products?.is_active);

    if (!isActive || stock <= 0) {
      return { ok: false, error: 'This material is currently unavailable.' };
    }

    if (nextQty > stock) {
      return { ok: false, error: `Only ${stock} left in stock for this material.` };
    }

    const { data: updated, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: nextQty })
      .eq('id', itemId)
      .select('id, quantity')
      .maybeSingle();

    if (updateError) {
      return { ok: false, error: cartErrorMessage(updateError, 'Could not update this item.') };
    }

    return { ok: true, data: { quantity: updated?.quantity ?? nextQty } };
  } catch (error) {
    return { ok: false, error: cartErrorMessage(error, 'Could not update this item.') };
  }
}

/**
 * Removes one cart row (owner-scoped; RLS also enforces this).
 * @param {string} itemId - Cart row id.
 * @param {string} userId - Cart owner id.
 * @returns {Promise<{ok: boolean, error?: string}>} Remove result.
 */
export async function removeCartItem(itemId, userId) {
  if (!itemId || !userId) {
    return { ok: false, error: 'Could not remove this item.' };
  }

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      return { ok: false, error: cartErrorMessage(error, 'Could not remove this item.') };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: cartErrorMessage(error, 'Could not remove this item.') };
  }
}
