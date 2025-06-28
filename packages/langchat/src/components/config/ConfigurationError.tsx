import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../contexts/AppThemeContext';

interface ConfigurationErrorProps {
  onRetry?: () => void;
}

export default function ConfigurationError({ onRetry }: ConfigurationErrorProps) {
  const { currentTheme: theme } = useAppTheme();

  const handleShowHelp = () => {
    Alert.alert(
      'Configuration Required',
      'To use LangChat, you need to:\n\n' +
      '1. Create a .env file in your project root\n' +
      '2. Add your Supabase project URL and API key\n' +
      '3. Optionally configure LangGraph settings\n\n' +
      'Run "node setup-env.js" in your terminal to get started.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.errorCard, {
        backgroundColor: theme.surface,
        borderColor: theme.border
      }]}>
        <Text style={[styles.title, { color: theme.error }]}>
          ⚠️ Configuration Required
        </Text>

        <Text style={[styles.message, { color: theme.text }]}>
          LangChat requires environment configuration to connect to Supabase and other services.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.helpButton, { backgroundColor: theme.primary }]}
            onPress={handleShowHelp}
          >
            <Text style={[styles.buttonText, { color: theme.background }]}>
              Setup Guide
            </Text>
          </TouchableOpacity>

          {onRetry && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton, {
                backgroundColor: theme.surface,
                borderColor: theme.border
              }]}
              onPress={onRetry}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.hint, { color: theme.placeholder }]}>
          Run: node setup-env.js
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  helpButton: {
    // Primary button styles handled in JSX
  },
  retryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
