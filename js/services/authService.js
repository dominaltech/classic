import { supabase } from '../config/supabaseClient.js';

/**
 * Converts Supabase auth errors into stable, user-safe messages.
 * @param {{message?: string, code?: string} | null | undefined} error - Supabase error object.
 * @param {string} fallback - Fallback message.
 * @returns {string} User-safe error message.
 */
function authErrorMessage(error, fallback = 'Authentication failed. Please try again.') {
  if (!error) {
    return fallback;
  }

  const raw = String(error.message || '').toLowerCase();

  if (raw.includes('email not confirmed') || raw.includes('confirm your email')) {
    return 'Please confirm your email before logging in.';
  }

  if (raw.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }

  if (raw.includes('email rate limit')) {
    return 'Too many auth emails were requested. Wait a few minutes and try again.';
  }

  if (raw.includes('user already registered') || raw.includes('already been registered')) {
    return 'An account already exists for this email. Try logging in instead.';
  }

  if (raw.includes('password')) {
    return 'Password does not meet the required strength.';
  }

  if (raw.includes('email')) {
    return 'Enter a valid email address.';
  }

  return error.message || fallback;
}

/**
 * Creates a new email/password account and passes profile metadata for the signup trigger.
 * @param {Object} input - Signup input.
 * @param {string} input.name - Customer display name.
 * @param {string} input.email - Customer email.
 * @param {string} input.password - Customer password.
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>} Service result.
 */
export async function signUp({ name, email, password }) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      return { ok: false, error: authErrorMessage(error, 'Could not create your account.') };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: authErrorMessage(error, 'Could not create your account.') };
  }
}

/**
 * Signs in an existing customer with email and password.
 * @param {Object} input - Login input.
 * @param {string} input.email - Customer email.
 * @param {string} input.password - Customer password.
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>} Service result.
 */
export async function signIn({ email, password }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { ok: false, error: authErrorMessage(error, 'Could not log you in.') };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: authErrorMessage(error, 'Could not log you in.') };
  }
}

/**
 * Clears the current Supabase auth session.
 * @returns {Promise<{ok: boolean, error?: string}>} Service result.
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { ok: false, error: authErrorMessage(error, 'Could not log you out.') };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: authErrorMessage(error, 'Could not log you out.') };
  }
}

/**
 * Reads the current persisted auth session.
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>} Service result.
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { ok: false, error: authErrorMessage(error, 'Could not read your session.') };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: authErrorMessage(error, 'Could not read your session.') };
  }
}

/**
 * Subscribes to Supabase auth changes and normalizes the callback payload.
 * @param {(state: {event: string, session: object | null, user: object | null}) => void} callback - Auth state callback.
 * @returns {{unsubscribe: () => void}} Subscription handle.
 */
export function subscribeToAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback({
      event,
      session,
      user: session?.user ?? null,
    });
  });

  return data.subscription;
}
