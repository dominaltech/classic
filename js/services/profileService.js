import { supabase } from '../config/supabaseClient.js';

/**
 * Converts Supabase profile errors into stable, user-safe messages.
 * @param {{message?: string, code?: string} | null | undefined} error - Supabase error object.
 * @param {string} fallback - Fallback message.
 * @returns {string} User-safe error message.
 */
function profileErrorMessage(error, fallback = 'Could not update your profile.') {
  if (!error) {
    return fallback;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}

const PROFILE_COLUMNS = 'id, name, address, phone, is_admin, created_at, updated_at';

/**
 * Loads the current customer's profile by auth user id.
 * @param {string} userId - Authenticated user id.
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>} Service result.
 */
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: profileErrorMessage(error, 'Could not load your profile.') };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: profileErrorMessage(error, 'Could not load your profile.') };
  }
}

/**
 * Updates only the customer-editable profile fields.
 * @param {string} userId - Authenticated user id.
 * @param {Object} input - Editable fields.
 * @param {string} input.name - Customer display name.
 * @param {string} input.address - Shipping address.
 * @param {string} input.phone - Contact phone.
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>} Service result.
 */
export async function updateProfile(userId, { name, address, phone }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
      })
      .eq('id', userId)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      return { ok: false, error: profileErrorMessage(error) };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: profileErrorMessage(error) };
  }
}
