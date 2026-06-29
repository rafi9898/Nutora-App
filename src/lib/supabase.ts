import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Shared Supabase client for the future production backend.
 *
 * Etap 3 keeps the current app flow local/mock-first, so missing env values do
 * not crash the mobile UI. Backend services call getSupabaseClient(), which
 * throws a clear setup error only when a real Supabase operation is attempted.
 */
export const supabase = isSupabaseConfigured && supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      storage: AsyncStorage
    }
  })
  : null;

export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Supabase nie jest skonfigurowany. Uzupełnij EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return supabase;
};
