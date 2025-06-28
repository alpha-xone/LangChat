import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth, useAppTheme } from '../../contexts';
import ConfigurationError from '../config/ConfigurationError';
import { SignInScreen } from './SignInScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, configurationError } = useAuth();
  const { currentTheme: theme } = useAppTheme();

  // Show configuration error if Supabase is not configured
  if (configurationError) {
    return <ConfigurationError />;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
      }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Show sign-in screen if not authenticated
  if (!isAuthenticated) {
    return fallback || <SignInScreen />;
  }

  // Render protected content
  return <>{children}</>;
}
