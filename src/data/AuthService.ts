import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import { getSupabaseClient } from './supabase';

const AUTH_STORAGE_KEY = 'chat_auth_session';

export class AuthService {
  private supabase = getSupabaseClient();

  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      const user = data.user ? this.mapSupabaseUser(data.user) : null;
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      const user = data.user ? this.mapSupabaseUser(data.user) : null;
      await this.storeSession(data.session);
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user ? this.mapSupabaseUser(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? this.mapSupabaseUser(session.user) : null;
      callback(user);
    });
  }

  private async storeSession(session: any): Promise<void> {
    if (session) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  }

  private mapSupabaseUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.display_name,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at),
    };
  }
}
