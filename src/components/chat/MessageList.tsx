import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MessageListProps } from '../../types';
import { useAppTheme } from '../../theming/useAppTheme';

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onMessagePress,
  onLoadMore,
  isLoading
}) => {
  const { theme } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    messageContainer: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    messageText: {
      fontSize: theme.typography.fontSize.medium,
      color: theme.colors.text,
    },
    messageType: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    loadingText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      padding: theme.spacing.md,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {messages.map((message) => (
        <View key={message.id} style={styles.messageContainer}>
          <Text style={styles.messageType}>{message.type}</Text>
          <Text style={styles.messageText}>{message.content}</Text>
        </View>
      ))}
    </View>
  );
};
