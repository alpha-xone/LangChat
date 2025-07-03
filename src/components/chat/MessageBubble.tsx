import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import type { MessageBubbleProps } from '../../types';
import { useAppTheme } from '../../theming/useAppTheme';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

const { width: screenWidth } = Dimensions.get('window');

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  isFirstInGroup = false,
  isLastInGroup = false,
  isSelected = false,
  onPress,
  onLongPress,
  onRetry,
  showAvatar = false,
  showTimestamp = false,
  showSenderName = false,
  maxWidth = screenWidth * 0.8,
}) => {
  const { theme } = useAppTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const isFailedMessage = message.status === 'failed';
  const isSendingMessage = message.status === 'sending';

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now.getTime() - messageDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return messageDate.toLocaleDateString();
  };

  const getBorderRadius = () => {
    const baseRadius = theme.borderRadius.lg;
    const smallRadius = theme.borderRadius.sm;

    if (isOwnMessage) {
      return {
        borderTopLeftRadius: baseRadius,
        borderTopRightRadius: isFirstInGroup ? baseRadius : smallRadius,
        borderBottomLeftRadius: baseRadius,
        borderBottomRightRadius: isLastInGroup ? baseRadius : smallRadius,
      };
    } else {
      return {
        borderTopLeftRadius: isFirstInGroup ? baseRadius : smallRadius,
        borderTopRightRadius: baseRadius,
        borderBottomLeftRadius: isLastInGroup ? baseRadius : smallRadius,
        borderBottomRightRadius: baseRadius,
      };
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: theme.spacing.xs,
      marginHorizontal: theme.spacing.md,
      alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
      maxWidth,
    },
    messageContainer: {
      flexDirection: isOwnMessage ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
    },
    avatarContainer: {
      marginHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    } as any,
    bubbleContainer: {
      flex: 1,
      alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
    },
    senderName: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      marginHorizontal: theme.spacing.sm,
    },
    bubble: {
      backgroundColor: isSelected
        ? theme.colors.primary + '20'
        : isOwnMessage
          ? theme.colors.primary
          : theme.colors.surface,
      padding: theme.spacing.md,
      ...getBorderRadius(),
      opacity: isSendingMessage ? 0.7 : 1,
      borderWidth: isFailedMessage ? 1 : 0,
      borderColor: isFailedMessage ? theme.colors.error : 'transparent',
    },
    messageText: {
      fontSize: theme.typography.fontSize.medium,
      color: isOwnMessage ? theme.colors.surface : theme.colors.text,
      lineHeight: theme.typography.fontSize.medium * 1.4,
    },
    timestamp: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      textAlign: isOwnMessage ? 'right' : 'left',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
    },
    statusText: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    retryButton: {
      marginTop: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.sm,
    },
    retryText: {
      color: theme.colors.surface,
      fontSize: theme.typography.fontSize.small,
      fontWeight: '500' as const,
    },
    attachmentContainer: {
      marginTop: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    attachment: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    attachmentText: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
    },
  });

  const renderAvatar = () => {
    if (!showAvatar) return null;

    return (
      <View style={styles.avatarContainer}>
        {message.senderName ? (
          <Image
            source={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${message.senderName}` }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatar} />
        )}
      </View>
    );
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <View style={styles.attachmentContainer}>
        {message.attachments.map((attachment) => (
          <View key={attachment.id} style={styles.attachment}>
            <Text style={styles.attachmentText}>
              {attachment.fileName}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMessageContent = () => {
    if (message.type === 'ai' || message.type === 'assistant') {
      return (
        <MarkdownRenderer
          content={message.content}
        />
      );
    }

    return (
      <Text style={styles.messageText}>
        {message.content}
      </Text>
    );
  };

  const renderStatus = () => {
    if (!isOwnMessage) return null;

    return (
      <View style={styles.statusIndicator}>
        {isSendingMessage && (
          <Text style={styles.statusText}>Sending...</Text>
        )}
        {isFailedMessage && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
        {message.status === 'sent' && (
          <Text style={styles.statusText}>✓</Text>
        )}
        {message.status === 'delivered' && (
          <Text style={styles.statusText}>✓✓</Text>
        )}
        {message.status === 'read' && (
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>✓✓</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        {renderAvatar()}
        <View style={styles.bubbleContainer}>
          {showSenderName && !isOwnMessage && (
            <Text style={styles.senderName}>
              {message.senderName || 'Unknown'}
            </Text>
          )}
          <TouchableOpacity
            style={styles.bubble}
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={0.8}
          >
            {renderMessageContent()}
            {renderAttachments()}
          </TouchableOpacity>
          {renderStatus()}
          {showTimestamp && (
            <Text style={styles.timestamp}>
              {formatTimestamp(message.createdAt)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};
