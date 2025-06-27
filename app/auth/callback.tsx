/**
 * OAuth Callback Handler
 * Handles OAuth redirects from Supabase authentication in React Native
 */

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      console.log('OAuth callback received with params:', params);
      setStatus('Verifying authentication...');

      // Extract auth parameters from the URL params
      const { access_token, refresh_token, error_description, error } = params;

      if (error || error_description) {
        console.error('OAuth error:', error, error_description);
        router.replace({
          pathname: '/auth',
          params: { error: error_description || error || 'Authentication failed' }
        });
        return;
      }

      if (access_token && refresh_token) {
        console.log('✅ OAuth tokens received, setting session...');

        // Set the session with the received tokens
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          router.replace({
            pathname: '/auth',
            params: { error: 'Failed to establish session. Please try again.' }
          });
          return;
        }

        if (data?.session) {
          console.log('✅ OAuth authentication successful');
          setStatus('Authentication successful! Redirecting...');

          // Small delay to show success message
          setTimeout(() => {
            router.replace('/');
          }, 1000);
        } else {
          console.log('No session established');
          router.replace('/auth');
        }
      } else {
        // Check if we have an existing session (user might already be logged in)
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session) {
          console.log('✅ Existing session found');
          router.replace('/');
        } else {
          console.log('No tokens or session found');
          router.replace('/auth');
        }
      }
    } catch (error: any) {
      console.error('OAuth callback exception:', error);
      router.replace({
        pathname: '/auth',
        params: { error: 'Authentication failed. Please try again.' }
      });
    }
  };

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 20
    }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
      }}>
        {status}
      </Text>
    </View>
  );
}
