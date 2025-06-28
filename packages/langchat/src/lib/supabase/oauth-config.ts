/**
 * OAuth Configuration for LangChat
 * Handles Google, Apple, and X (Twitter) authentication
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export const OAUTH_CONFIG = {
  // App scheme for deep linking
  scheme: 'langchat',

  // OAuth providers configuration
  providers: {
    google: {
      name: 'Google',
      color: '#4285F4',
      icon: 'google',
      scopes: ['openid', 'profile', 'email'],
      additionalParameters: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },

    apple: {
      name: 'Apple',
      color: '#000000',
      icon: 'apple',
      scopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      // Apple Sign-In is only available on iOS
      available: Platform.OS === 'ios',
    },

    twitter: {
      name: 'X',
      color: '#1DA1F2',
      icon: 'twitter',
      // Twitter OAuth 1.0a - configuration handled by Supabase
    },
  },
};

/**
 * Generate OAuth redirect URI
 */
export const getOAuthRedirectUri = (path: string = 'auth/callback') => {
  // Generate the redirect URI
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: OAUTH_CONFIG.scheme,
    path: path,
  });

  return redirectUri;
};

/**
 * Check if OAuth provider is available on current platform
 */
export const isOAuthProviderAvailable = (provider: keyof typeof OAUTH_CONFIG.providers): boolean => {
  const config = OAUTH_CONFIG.providers[provider];

  if ('available' in config) {
    return config.available;
  }

  // Default: available on all platforms
  return true;
};

/**
 * Get OAuth provider configuration
 */
export const getOAuthProviderConfig = (provider: keyof typeof OAUTH_CONFIG.providers) => {
  return OAUTH_CONFIG.providers[provider];
};

/**
 * OAuth error messages for better user experience
 */
export const OAUTH_ERROR_MESSAGES = {
  ERR_CANCELED: 'Sign-in was cancelled',
  ERR_NETWORK: 'Network error. Please check your connection and try again.',
  ERR_INVALID_CREDENTIALS: 'Invalid credentials. Please try again.',
  ERR_USER_DISABLED: 'This account has been disabled. Please contact support.',
  ERR_TOO_MANY_REQUESTS: 'Too many sign-in attempts. Please try again later.',
  ERR_POPUP_BLOCKED: 'Pop-up was blocked. Please allow pop-ups and try again.',
  ERR_UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Get user-friendly error message
 */
export const getOAuthErrorMessage = (error: string, provider: string): string => {
  const message = OAUTH_ERROR_MESSAGES[error as keyof typeof OAUTH_ERROR_MESSAGES];
  return message || `${provider} sign-in failed. Please try again.`;
};
