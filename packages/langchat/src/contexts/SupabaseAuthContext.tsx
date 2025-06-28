import { Session, SupabaseClient, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { signInWithOAuth, type OAuthProvider } from '../lib/supabase/oauth-utils';
import type { Database, Tables } from '../lib/supabase/types';

export interface AuthUser extends User {
  profile?: Tables<'profiles'>;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  configurationError: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<Tables<'profiles'>, 'name' | 'avatar_url'>>) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  supabaseClient: SupabaseClient<Database>;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, supabaseClient }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configurationError, setConfigurationError] = useState(false);

  // Check if Supabase is properly configured
  useEffect(() => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase configuration missing. Please check your environment variables.');
      console.log('Expected: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
      setConfigurationError(true);
      setIsLoading(false);
      return;
    }

    console.log('✅ Supabase configuration found');
  }, []);

  // Load initial session and set up auth state listener
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        console.log('🔄 Starting session restoration...');

        const sessionPromise = supabaseClient.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session load timeout')), 5000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (mounted) {
          if (error) {
            console.error('❌ Error getting session:', error);
            setIsLoading(false);
          } else {
            console.log('✅ Session loaded:', session ? 'User authenticated' : 'No session');
            setSession(session);
            if (session?.user) {
              console.log('👤 Loading user profile...');
              await loadUserProfile(session.user);
            }
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Session loading taking too long, setting loading to false');
        setIsLoading(false);
      }
    }, 8000);

    getInitialSession().finally(() => {
      clearTimeout(fallbackTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (mounted) {
          setSession(session);

          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setUser(null);
          }

          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('👤 Loading profile for user:', authUser.email);

      const profilePromise = supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 3000)
      );

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('⚠️ Error loading profile (using fallback):', error.message);
        // Use auth user data as fallback
        setUser({
          ...authUser,
          profile: {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            avatar_url: authUser.user_metadata?.avatar_url,
            created_at: authUser.created_at,
            updated_at: authUser.updated_at || authUser.created_at,
          }
        });
        return;
      }

      console.log('✅ Profile loaded successfully');
      setUser({
        ...authUser,
        profile: profile || {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          avatar_url: authUser.user_metadata?.avatar_url,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        }
      });
    } catch (error) {
      console.warn('⚠️ Error in loadUserProfile (using fallback):', error);
      // Always set user even if profile loading fails
      setUser({
        ...authUser,
        profile: {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          avatar_url: authUser.user_metadata?.avatar_url,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        }
      } as AuthUser);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user);
      }

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabaseClient.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Create profile if user was created
      if (data.user && !data.user.email_confirmed_at) {
        // For email confirmation flow
        return {
          success: true,
          error: 'Please check your email for a confirmation link'
        };
      } else if (data.user) {
        // Auto-confirm case, create profile
        await createProfile(data.user, name);
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: OAuthProvider): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const result = await signInWithOAuth(supabaseClient, provider);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // The session will be handled by the auth state listener
      return { success: true };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      return { success: false, error: 'An unexpected error occurred during OAuth sign in' };
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (authUser: User, name: string) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email!,
          name: name.trim(),
        });

      if (error) {
        console.error('Error creating profile:', error);
      }
    } catch (error) {
      console.error('Error in createProfile:', error);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateProfile = async (updates: Partial<Pick<Tables<'profiles'>, 'name' | 'avatar_url'>>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      setIsLoading(true);

      const { error } = await supabaseClient
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Reload user profile
      await loadUserProfile(user);

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession();

      if (error) {
        console.error('Error refreshing session:', error);
      } else if (data.session) {
        setSession(data.session);
        if (data.user) {
          await loadUserProfile(data.user);
        }
      }
    } catch (error) {
      console.error('Error in refreshSession:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    configurationError,
    signIn,
    signUp,
    signInWithOAuth: handleOAuthSignIn,
    signOut,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
