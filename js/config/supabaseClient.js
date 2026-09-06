import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://mizbiarhnxzrpfuodqnj.supabase.co';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pemJpYXJobnh6cnBmdW9kcW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTg3NTYsImV4cCI6MjEwNDA3NDc1Nn0.plMkDTZJ7wy2D6yLWtRmJU_gvJ9z-zZYXumbOlWHCrU';

/**
 * Shared Supabase browser client. This is the only module allowed to call createClient.
 */
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
