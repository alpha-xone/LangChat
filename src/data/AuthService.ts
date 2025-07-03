import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import { getSupabaseClient } from './supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const AUTH_STORAGE_KEY = 'chat_auth_session';
const USER_PROFILE_KEY = 'chat_user_profile';

export class AuthService {
  private supabase = getSupabaseClient();
  private authListeners: Array<(user: User | null) => void> = [];

  async signUp(
    email: string,
    password: string,
    options?: {
      displayName?: string;
      redirectTo?: string;
    }
  ): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: options?.displayName,
          },
          emailRedirectTo: options?.redirectTo,
        },
      });

      if (error) {
        return { user: null, error };
      }

      const user = data.user ? this.mapSupabaseUser(data.user) : null;

      // Create user profile in the database
      if (user && data.session) {
        await this.createUserProfile(user);
      }

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

      // Cache user profile
      if (user) {
        await this.cacheUserProfile(user);
      }

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signInWithOAuth(provider: 'google' | 'apple' | 'github'): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'com.yourapp://auth/callback',
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_PROFILE_KEY]);

      // Notify listeners
      this.authListeners.forEach(listener => listener(null));

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'com.yourapp://auth/reset-password',
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        data: {
          display_name: updates.displayName,
          avatar_url: updates.avatarUrl,
        },
      });

      if (error) {
        return { user: null, error };
      }

      // Update user profile in database
      if (data.user) {
        await this.updateUserProfile(data.user.id, updates);
      }

      const user = data.user ? this.mapSupabaseUser(data.user) : null;

      if (user) {
        await this.cacheUserProfile(user);
      }

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // First check cached user
      const cachedUser = await this.getCachedUser();
      if (cachedUser) {
        return cachedUser;
      }

      // Then check Supabase
      const { data: { user } } = await this.supabase.auth.getUser();
      const mappedUser = user ? this.mapSupabaseUser(user) : null;

      if (mappedUser) {
        await this.cacheUserProfile(mappedUser);
      }

      return mappedUser;
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

  async refreshSession(): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      if (data.session) {
        await this.storeSession(data.session);
      }
      return { session: data.session, error };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    this.authListeners.push(callback);

    const subscription = this.supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const user = session?.user ? this.mapSupabaseUser(session.user) : null;

      if (user) {
        await this.cacheUserProfile(user);
      } else {
        await AsyncStorage.removeItem(USER_PROFILE_KEY);
      }

      // Notify all listeners
      this.authListeners.forEach(listener => listener(user));
    });

    return subscription;
  }

  removeAuthListener(callback: (user: User | null) => void) {
    this.authListeners = this.authListeners.filter(listener => listener !== callback);
  }

  // Private helper methods
  private async createUserProfile(user: User): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          display_name: user.displayName,
          avatar_url: user.avatarUrl,
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        });

      if (error) {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  private async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          display_name: updates.displayName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  private async cacheUserProfile(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error caching user profile:', error);
    }
  }

  private async getCachedUser(): Promise<User | null> {
    try {
      const cached = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (cached) {
        const user = JSON.parse(cached);
        return {
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        };
      }
    } catch (error) {
      console.error('Error getting cached user:', error);
    }
    return null;
  }

  private async storeSession(session: Session): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  private mapSupabaseUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0],
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at),
    };
  }
}
