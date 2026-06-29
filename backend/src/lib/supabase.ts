import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from '../config.js';

export const supabaseAdmin = isSupabaseConfigured
  ? createClient(config.SUPABASE_URL!, config.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

export const requireSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase backend credentials are not configured.');
  }

  return supabaseAdmin;
};
