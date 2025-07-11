import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from 'langchat';

/**
 * Debug component to show environment configuration status
 */
export const ConfigDebug: React.FC = () => {
  const { theme } = useAppTheme();

  const apiUrl = process.env.EXPO_PUBLIC_LANGGRAPH_API_URL;
  const assistantId = process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      margin: 16,
      borderRadius: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    row: {
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    value: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
    },
    status: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    success: {
      color: theme.colors.success,
    },
    error: {
      color: theme.colors.error,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Environment Configuration</Text>

      <View style={styles.row}>
        <Text style={styles.label}>LangGraph API URL:</Text>
        <Text style={styles.value}>{apiUrl || 'NOT SET'}</Text>
        <Text style={[styles.status, apiUrl ? styles.success : styles.error]}>
          {apiUrl ? '✓ Configured' : '✗ Missing'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Assistant ID:</Text>
        <Text style={styles.value}>{assistantId || 'NOT SET'}</Text>
        <Text style={[styles.status, assistantId ? styles.success : styles.error]}>
          {assistantId ? '✓ Configured' : '✗ Missing'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Supabase URL:</Text>
        <Text style={styles.value}>{supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET'}</Text>
        <Text style={[styles.status, supabaseUrl ? styles.success : styles.error]}>
          {supabaseUrl ? '✓ Configured' : '✗ Missing'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.status, (apiUrl && assistantId) ? styles.success : styles.error]}>
          Overall Status: {(apiUrl && assistantId) ? 'Ready for LangGraph' : 'Configuration Required'}
        </Text>
      </View>
    </View>
  );
};
