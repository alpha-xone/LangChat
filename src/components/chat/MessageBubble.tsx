import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ParsedMessage } from '../../ai';

export interface MessageBubbleProps {
  message: ParsedMessage;
  theme: any;
  renderMarkdown?: (content: string) => React.ReactNode;
}

export default function MessageBubble({
  message,
  theme,
  renderMarkdown
}: MessageBubbleProps) {
  const isUser = message.type === 'human';
  const isSystem = message.type === 'system';
  const isLoading = !message.isComplete && message.type === 'ai';

  const styles = createStyles(theme, isUser);

  const renderContent = () => {
    if (renderMarkdown && message.type === 'ai') {
      return renderMarkdown(message.content);
    }

    return (
      <Text style={styles.messageText}>
        {message.content}
        {isLoading && (
          <Text style={styles.loadingIndicator}> ●</Text>
        )}
      </Text>
    );
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.messageBubble}>
        {renderContent()}

        {/* Timestamp */}
        <View style={styles.metaContainer}>
          <Text style={styles.timestamp}>
            {formatTime(message.timestamp)}
          </Text>

          {/* Message type indicator for non-user messages */}
          {!isUser && message.type !== 'ai' && (
            <Text style={styles.typeIndicator}>
              {message.type.toUpperCase()}
            </Text>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <Text style={styles.statusIndicator}>Thinking...</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isUser: boolean) =>
  StyleSheet.create({
    container: {
      marginVertical: theme.spacing.xs,
      alignItems: isUser ? 'flex-end' : 'flex-start',
    },
    messageBubble: {
      maxWidth: '80%',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: isUser
        ? theme.colors.primary
        : theme.colors.surface,
      borderBottomLeftRadius: isUser ? theme.borderRadius.lg : theme.spacing.xs,
      borderBottomRightRadius: isUser ? theme.spacing.xs : theme.borderRadius.lg,
      elevation: 1,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    messageText: {
      fontSize: theme.fontSizes.md,
      lineHeight: theme.fontSizes.md * 1.4,
      color: isUser ? theme.colors.background : theme.colors.text,
    },
    loadingIndicator: {
      color: isUser ? theme.colors.background : theme.colors.primary,
      fontWeight: 'bold',
    },
    metaContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    timestamp: {
      fontSize: theme.fontSizes.xs,
      color: isUser
        ? theme.colors.background + '80'
        : theme.colors.textSecondary,
    },
    typeIndicator: {
      fontSize: theme.fontSizes.xs,
      color: isUser
        ? theme.colors.background + '80'
        : theme.colors.textSecondary,
      fontWeight: '500',
    },
    statusIndicator: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.primary,
      fontStyle: 'italic',
    },
    systemContainer: {
      alignItems: 'center',
      marginVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    systemText: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
  });
