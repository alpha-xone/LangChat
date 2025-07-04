import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChatScreenProps } from '../types';
import { useAppTheme } from '../theming/useAppTheme';
import { useAuth } from '../hooks';

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onAuthStateChange,
  onError
}) => {
  const { theme: currentTheme } = useAppTheme();
  const { user, loading, error } = useAuth();

  React.useEffect(() => {
    if (onAuthStateChange) {
      onAuthStateChange(user);
    }
  }, [user, onAuthStateChange]);

  React.useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: currentTheme.typography.fontSize.large,
      color: currentTheme.colors.text,
      fontWeight: '600' as const,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Please sign in to continue</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Chat!</Text>
      <Text style={[styles.text, { fontSize: currentTheme.typography.fontSize.medium }]}>
        User: {user.email}
      </Text>
    </View>
  );
};
