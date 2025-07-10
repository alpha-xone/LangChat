import type { Session, User, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@langchat_access_token',
  REFRESH_TOKEN: '@langchat_refresh_token',
  USER_DATA: '@langchat_user_data',
} as const;

class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign up a new user with email, password, and name
   */
  async signUp({ email, password, name }: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            avatar_url: null,
          },
        },
      });

      if (error) {
        return { user: null, error };
      }

      // If signup is successful, create a profile entry
      if (data.user) {
        await this.createUserProfile(data.user, name);
      }

      return { user: data.user, error: null };
    } catch (error) {
      return {
        user: null,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          name: 'SignUpError',
          status: 500
        } as AuthError
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: SignInData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      // Store session data
      if (data.session) {
        await this.storeSessionData(data.session);
      }

      return { user: data.user, error: null };
    } catch (error) {
      return {
        user: null,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          name: 'SignInError',
          status: 500
        } as AuthError
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      // Clear stored session data
      await this.clearSessionData();

      return { error };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          name: 'SignOutError',
          status: 500
        } as AuthError
      };
    }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get the current user with profile data
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      // Fetch user profile from the profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        // If profile doesn't exist, create it from auth user data
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        await this.createUserProfile(user, name);

        return {
          id: user.id,
          email: user.email!,
          name,
          avatar_url: user.user_metadata?.avatar_url,
        };
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get the current access token for LangGraph backend authentication
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      // Fallback to stored token
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Pick<AuthUser, 'name' | 'avatar_url'>>): Promise<{ error: AuthError | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: { message: 'User not authenticated', name: 'AuthError', status: 401 } as AuthError };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return {
          error: {
            message: error.message,
            name: 'UpdateProfileError',
            status: 400
          } as AuthError
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          name: 'UpdateProfileError',
          status: 500
        } as AuthError
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          name: 'ResetPasswordError',
          status: 500
        } as AuthError
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        await this.storeSessionData(session);
      } else {
        await this.clearSessionData();
      }
      callback(session);
    });
  }

  /**
   * Private method to create user profile
   */
  private async createUserProfile(user: User, name: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          name,
          avatar_url: user.user_metadata?.avatar_url || null,
        });

      if (error) {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  /**
   * Private method to store session data locally
   */
  private async storeSessionData(session: Session): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token),
      ]);
    } catch (error) {
      console.error('Error storing session data:', error);
    }
  }

  /**
   * Private method to clear stored session data
   */
  private async clearSessionData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }
}

export default AuthService;
