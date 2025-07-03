import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Message } from '../../types';
import { useAppTheme } from '../../theming/useAppTheme';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  onPress?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  onPress
}) => {
  const { theme } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      marginVertical: theme.spacing.xs,
      marginHorizontal: theme.spacing.md,
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '80%',
    },
    bubble: {
      backgroundColor: isUser ? theme.colors.primary : theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderBottomRightRadius: isUser ? theme.borderRadius.sm : theme.borderRadius.lg,
      borderBottomLeftRadius: isUser ? theme.borderRadius.lg : theme.borderRadius.sm,
    },
    text: {
      color: isUser ? theme.colors.background : theme.colors.text,
      fontSize: theme.typography.fontSize.medium,
      lineHeight: theme.typography.fontSize.medium * 1.4,
    },
    timestamp: {
      fontSize: theme.typography.fontSize.small,
      color: isUser ? theme.colors.background : theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      opacity: 0.7,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{message.content}</Text>
        <Text style={styles.timestamp}>
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};
