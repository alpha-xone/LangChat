import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { SimpleChat } from '../ai/SimpleChat';
import { useAppTheme } from '../theming/useAppTheme';
import type { ParsedMessage } from '../ai';

export interface LangGraphDemoProps {
  title?: string;
  subtitle?: string;
}

/**
 * Demo component showing LangGraph integration
 * This demonstrates how to use the SimpleChat component with LangGraph
 */
export const LangGraphDemo: React.FC<LangGraphDemoProps> = ({
  title = "LangGraph AI Chat Demo",
  subtitle = "Experience AI-powered conversations with LangGraph streaming",
}) => {
  const { theme } = useAppTheme();

  const handleMessageSent = (message: string) => {
    console.log('[LangGraphDemo] User sent message:', message);
  };

  const handleMessageReceived = (message: ParsedMessage) => {
    console.log('[LangGraphDemo] AI message received:', {
      id: message.id,
      role: message.role,
      contentLength: message.content.length,
      isComplete: message.isComplete,
    });
  };

  const handleError = (error: Error) => {
    console.error('[LangGraphDemo] Error occurred:', error);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: theme.fontSizes.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.fontSizes.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    chatContainer: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.chatContainer}>
        <SimpleChat
          placeholder="Ask the AI assistant anything..."
          maxLength={2000}
          onMessageSent={handleMessageSent}
          onMessageReceived={handleMessageReceived}
          onError={handleError}
        />
      </View>
    </SafeAreaView>
  );
};
