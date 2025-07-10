import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import AuthService, { type AuthUser, type SignUpData, type SignInData } from '../data/AuthService';

export interface UseAuthReturn {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<AuthUser, 'name' | 'avatar_url'>>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const authService = AuthService.getInstance();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Get current session
        const currentSession = await authService.getSession();
        if (mounted) {
          setSession(currentSession);
        }

        // Get current user if session exists
        if (currentSession) {
          const currentUser = await authService.getCurrentUser();
          if (mounted) {
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (newSession) {
        const newUser = await authService.getCurrentUser();
        setUser(newUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authService]);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setLoading(true);
      const { error } = await authService.signUp(data);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const signIn = useCallback(async (data: SignInData) => {
    try {
      setLoading(true);
      const { error } = await authService.signIn(data);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await authService.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await authService.resetPassword(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }, [authService]);

  const updateProfile = useCallback(async (updates: Partial<Pick<AuthUser, 'name' | 'avatar_url'>>) => {
    try {
      setLoading(true);
      const { error } = await authService.updateProfile(updates);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh user data
      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [authService]);

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
  };
};
