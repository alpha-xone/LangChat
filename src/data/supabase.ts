import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ChatConfig } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export const initializeSupabase = (config: ChatConfig): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storage: undefined, // Will be configured with AsyncStorage
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Call initializeSupabase first.');
  }
  return supabaseInstance;
};

export { supabaseInstance };
