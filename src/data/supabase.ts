import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables that should be provided by the consuming application
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.'
  );
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_threads: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          metadata: any;
          is_favorited: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          metadata?: any;
          is_favorited?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          metadata?: any;
          is_favorited?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          thread_id: string;
          content: string;
          role: 'user' | 'human' | 'assistant' | 'ai' | 'tool' | 'system';
          metadata: any;
          created_at: string;
          saved: boolean | null;
          summary: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          thread_id: string;
          content: string;
          role: 'user' | 'human' | 'assistant' | 'ai' | 'tool' | 'system';
          metadata?: any;
          created_at?: string;
          saved?: boolean | null;
          summary?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          thread_id?: string;
          content?: string;
          role?: 'user' | 'human' | 'assistant' | 'ai' | 'tool' | 'system';
          metadata?: any;
          created_at?: string;
          saved?: boolean | null;
          summary?: string | null;
        };
      };
    };
  };
}
