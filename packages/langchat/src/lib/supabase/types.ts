// Database types (you can generate these from your Supabase schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          thread_id: string;
          content: string;
          role: 'human' | 'ai' | 'system' | 'tool' | 'assistant';
          metadata?: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          thread_id: string;
          content: string;
          role: 'human' | 'ai' | 'system' | 'tool' | 'assistant';
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          thread_id?: string;
          content?: string;
          role?: 'human' | 'ai' | 'system' | 'tool' | 'assistant';
          metadata?: Record<string, any>;
        };
      };
      chat_threads: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          metadata?: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          metadata?: Record<string, any>;
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// User types for LangChat
export interface LangChatUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthContext {
  user: LangChatUser | null;
  isAuthenticated: boolean;
}
