import { signInWithOAuth, type OAuthProvider } from '@/lib/oauth-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  provider?: 'email' | 'google' | 'apple' | 'twitter';
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'avatar'>>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@langchat_auth_user';
const DEMO_USERS_KEY = '@langchat_demo_users';

// Demo users for testing - in production, this would be handled by your backend
const createDemoUser = (email: string, password: string, name: string, provider: User['provider'] = 'email'): User => ({
  id: Math.random().toString(36).substr(2, 9),
  email,
  name,
  provider,
  createdAt: new Date().toISOString(),
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on app start
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to store user:', error);
      throw error;
    }
  };

  const clearUser = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  };

  const getDemoUsers = async (): Promise<Record<string, { password: string; user: User }>> => {
    try {
      const stored = await AsyncStorage.getItem(DEMO_USERS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get demo users:', error);
      return {};
    }
  };

  const storeDemoUser = async (email: string, password: string, userData: User) => {
    try {
      const users = await getDemoUsers();
      users[email] = { password, user: userData };
      await AsyncStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to store demo user:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // In demo mode, check against stored demo users
      const demoUsers = await getDemoUsers();
      const demoUser = demoUsers[email.toLowerCase()];

      if (demoUser && demoUser.password === password) {
        await storeUser(demoUser.user);
        return { success: true };
      }

      // For demo purposes, create a few default users
      const defaultUsers = [
        { email: 'demo@langchat.com', password: 'demo123', name: 'Demo User' },
        { email: 'test@example.com', password: 'test123', name: 'Test User' },
        { email: 'admin@langchat.com', password: 'admin123', name: 'Admin User' },
      ];

      const defaultUser = defaultUsers.find(u =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (defaultUser) {
        const userData = createDemoUser(defaultUser.email, defaultUser.password, defaultUser.name);
        await storeUser(userData);
        return { success: true };
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An error occurred during sign in' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user already exists
      const demoUsers = await getDemoUsers();
      if (demoUsers[email.toLowerCase()]) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Validate input
      if (!email || !password || !name) {
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }

      // Create new user
      const userData = createDemoUser(email, password, name);
      await storeDemoUser(email.toLowerCase(), password, userData);
      await storeUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An error occurred during sign up' };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuthProvider = async (provider: OAuthProvider): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Use the OAuth utility function
      const result = await signInWithOAuth(provider);

      if (result.success) {
        // Create a demo user for OAuth sign-in
        // In a real app, this would come from the OAuth provider's user data
        const userData = createDemoUser(
          `${provider}-user@example.com`, // Placeholder email
          '', // No password for OAuth
          `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          provider
        );

        await storeUser(userData);
        return { success: true };
      } else {
        return result;
      }
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      return { success: false, error: `${provider} sign-in failed` };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await clearUser();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // In a real app, this would send a password reset email
      // For demo purposes, we'll just return success
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const resendVerification = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: 'An error occurred' };
    }
  };

  const verifyEmail = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, error: 'Invalid or expired verification token' };
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'avatar'>>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      setIsLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));

      const updatedUser = { ...user, ...updates };
      await storeUser(updatedUser);

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithOAuth: signInWithOAuthProvider,
    signOut,
    forgotPassword,
    resendVerification,
    verifyEmail,
    updateProfile,
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
