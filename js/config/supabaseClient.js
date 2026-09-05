import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Returns an environment variable value or throws a developer-readable error.
 * @param {string | undefined} value - Variable value.
 * @param {string} name - Variable name.
 * @returns {string} Non-empty environment variable value.
 */
function requireEnv(value, name) {
  if (!value || String(value).trim() === '') {
    throw new Error(
      `Missing ${name}. Create .env from .env.example, fill in the Supabase project values, and restart the Vite dev server.`,
    );
  }

  return String(value).trim();
}

/**
 * Shared Supabase browser client. This is the only module allowed to call createClient.
 */
export const supabase = createClient(
  requireEnv(SUPABASE_URL, 'VITE_SUPABASE_URL'),
  requireEnv(SUPABASE_KEY, 'VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)'),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
