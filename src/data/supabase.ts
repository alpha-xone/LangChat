import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatConfig } from '../types';

let supabaseInstance: SupabaseClient | null = null;

// Custom storage adapter for React Native
const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const initializeSupabase = (config: ChatConfig): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storage: AsyncStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        debug: __DEV__,
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'react-native-ai-chat',
        },
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

export const resetSupabaseClient = (): void => {
  supabaseInstance = null;
};

export const isSupabaseInitialized = (): boolean => {
  return supabaseInstance !== null;
};

export { supabaseInstance };
