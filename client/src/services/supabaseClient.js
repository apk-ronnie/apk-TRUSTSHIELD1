import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = (val) =>
  !val ||
  val.includes('your-project-id') ||
  val.includes('your_supabase_') ||
  val.trim() === '';

export const isSupabaseClientConfigured =
  !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

/**
 * Supabase Browser Client
 * Authenticates client-side requests using the public Anonymous Key (safe for frontend distribution)
 */
export const supabase = isSupabaseClientConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

if (!isSupabaseClientConfigured) {
  console.info(
    '[TrustShield Client] Supabase client credentials are in template mode. Using backend REST API proxy.'
  );
} else {
  console.info(`[TrustShield Client] Supabase client connected to ${supabaseUrl}`);
}

export default supabase;
