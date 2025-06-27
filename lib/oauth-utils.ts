/**
 * OAuth Utilities for Supabase Authentication
 * Provides OAuth sign-in functions for Google, Apple, and X (Twitter)
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { getOAuthErrorMessage, getOAuthRedirectUri, OAUTH_CONFIG } from './oauth-config';
import { supabase } from './supabase';

export type OAuthProvider = 'google' | 'apple' | 'twitter';
export type OAuthResult = { success: boolean; error?: string };

// Configure WebBrowser for OAuth flows
WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<OAuthResult> => {
  try {
    const redirectUri = getOAuthRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        queryParams: OAUTH_CONFIG.providers.google.additionalParameters,
      },
    });

    if (error) {
      console.error('Google OAuth error:', error);

      // Check for common configuration errors
      if (error.message.includes('Provider') && error.message.includes('is not enabled')) {
        return {
          success: false,
          error: 'Google OAuth is not configured in Supabase. Please enable it in your Supabase dashboard under Authentication > Providers.'
        };
      }

      return { success: false, error: error.message };
    }

    const authUrl = data?.url;
    if (!authUrl) {
      return { success: false, error: 'Failed to get Google auth URL' };
    }

    // Start OAuth flow using WebBrowser
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success') {
      // Session will be automatically handled by Supabase
      console.log('✅ Google OAuth successful');
      return { success: true };
    } else if (result.type === 'cancel') {
      return { success: false, error: 'Google sign-in was cancelled' };
    } else {
      return { success: false, error: 'Google sign-in failed' };
    }
  } catch (error: any) {
    console.error('Google OAuth exception:', error);
    const errorMessage = getOAuthErrorMessage(error.code || 'ERR_UNKNOWN', 'Google');
    return { success: false, error: errorMessage };
  }
};

/**
 * Sign in with Apple OAuth (iOS only)
 */
export const signInWithApple = async (): Promise<OAuthResult> => {
  try {
    // Check if Apple Authentication is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: 'Apple Sign-In is not available on this device' };
    }

    // Request Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: OAUTH_CONFIG.providers.apple.scopes,
    });

    if (credential.identityToken) {
      // Sign in with Supabase using Apple identity token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('Apple OAuth error:', error);

        // Check for common configuration errors
        if (error.message.includes('Provider') && error.message.includes('is not enabled')) {
          return {
            success: false,
            error: 'Apple OAuth is not configured in Supabase. Please enable it in your Supabase dashboard under Authentication > Providers.'
          };
        }

        return { success: false, error: error.message };
      }

      console.log('✅ Apple OAuth successful');
      return { success: true };
    } else {
      return { success: false, error: 'No identity token received from Apple' };
    }
  } catch (error: any) {
    console.error('Apple OAuth exception:', error);

    if (error.code === 'ERR_CANCELED') {
      return { success: false, error: 'Apple sign-in was cancelled' };
    }

    const errorMessage = getOAuthErrorMessage(error.code || 'ERR_UNKNOWN', 'Apple');
    return { success: false, error: errorMessage };
  }
};

/**
 * Sign in with X (Twitter) OAuth
 */
export const signInWithTwitter = async (): Promise<OAuthResult> => {
  try {
    // For Twitter OAuth, we don't specify redirectTo - let Supabase handle it
    // Supabase will use: https://your-project.supabase.co/auth/v1/callback
    // Then redirect back to the app using the configured redirect URL in Supabase settings

    console.log('Starting Twitter OAuth flow...');

    // For Twitter OAuth, use the same redirect URI as other providers
    const appRedirectUri = getOAuthRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: appRedirectUri,
      },
    });

    if (error) {
      console.error('Twitter OAuth error:', error);

      // Check for common configuration errors
      if (error.message.includes('Provider') && error.message.includes('is not enabled')) {
        return {
          success: false,
          error: 'X (Twitter) OAuth is not configured in Supabase. Please configure it using the Management API:\n\n' +
                 'curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \\\n' +
                 '  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \\\n' +
                 '  -H "Content-Type: application/json" \\\n' +
                 '  -d \'{\n' +
                 '    "external_twitter_enabled": true,\n' +
                 '    "external_twitter_client_id": "your-twitter-api-key",\n' +
                 '    "external_twitter_secret": "your-twitter-api-secret-key"\n' +
                 '  }\''
        };
      }

      if (error.message.includes('invalid') || error.message.includes('path')) {
        return {
          success: false,
          error: 'X OAuth configuration error. Please verify:\n' +
                 '1. Twitter app callback URL: https://your-project.supabase.co/auth/v1/callback\n' +
                 '2. OAuth 1.0a is enabled in Twitter Developer Portal\n' +
                 '3. Twitter provider is configured in Supabase via Management API'
        };
      }

      return { success: false, error: error.message };
    }

    const authUrl = data?.url;
    if (!authUrl) {
      return { success: false, error: 'Failed to get X auth URL' };
    }

    console.log('Starting X OAuth flow with URL:', authUrl);

    console.log('App redirect URI for callback:', appRedirectUri);

    // Start OAuth flow using WebBrowser
    const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);

    if (result.type === 'success') {
      console.log('✅ X OAuth successful');
      return { success: true };
    } else if (result.type === 'cancel') {
      return { success: false, error: 'X sign-in was cancelled' };
    } else {
      console.log('X OAuth result:', result);
      return { success: false, error: 'X sign-in failed. Please check your X OAuth configuration.' };
    }
  } catch (error: any) {
    console.error('Twitter OAuth exception:', error);
    const errorMessage = getOAuthErrorMessage(error.code || 'ERR_UNKNOWN', 'X');
    return { success: false, error: errorMessage };
  }
};

/**
 * Generic OAuth sign-in function
 */
export const signInWithOAuth = async (provider: OAuthProvider): Promise<OAuthResult> => {
  switch (provider) {
    case 'google':
      return signInWithGoogle();
    case 'apple':
      return signInWithApple();
    case 'twitter':
      return signInWithTwitter();
    default:
      return { success: false, error: `Unsupported OAuth provider: ${provider}` };
  }
};

/**
 * Check if device supports OAuth provider
 */
export const isOAuthSupported = async (provider: OAuthProvider): Promise<boolean> => {
  switch (provider) {
    case 'google':
      return true; // Google OAuth works on all platforms
    case 'apple':
      return await AppleAuthentication.isAvailableAsync();
    case 'twitter':
      return true; // Twitter OAuth works on all platforms
    default:
      return false;
  }
};
