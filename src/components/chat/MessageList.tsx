import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { MessageBubble } from './MessageBubble';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { MessageListProps, Message } from '../../types';
import { useAppTheme } from '../../theming/useAppTheme';

const { height: screenHeight } = Dimensions.get('window');

interface MessageGroup {
  id: string;
  messages: Message[];
  timestamp: Date;
  senderId: string;
  senderName: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onMessagePress,
  onLoadMore,
  isLoading,
  hasMore = true,
  onRefresh,
  refreshing = false,
  onMessageLongPress,
  selectedMessageIds = [],
  currentUserId,
  enableGrouping = true,
  showTypingIndicator = false,
  typingUsers = [],
  onRetryMessage,
  onDeleteMessage,
  enablePullToRefresh = true,
  inverted = true,
  messageSpacing = 8,
  groupTimeThreshold = 5 * 60 * 1000, // 5 minutes
}) => {
  const { theme } = useAppTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Group messages by sender and time
  const groupedMessages = useCallback(() => {
    if (!enableGrouping) {
      return messages.map(msg => ({
        id: msg.id,
        messages: [msg],
        timestamp: new Date(msg.createdAt),
        senderId: msg.senderId || 'unknown',
        senderName: msg.senderName || 'Unknown'
      }));
    }

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    messages.forEach(message => {
      const messageTime = new Date(message.createdAt);
      const messageSenderId = message.senderId || 'unknown';
      const shouldGroup = currentGroup &&
        currentGroup.senderId === messageSenderId &&
        (messageTime.getTime() - currentGroup.timestamp.getTime()) < groupTimeThreshold;

      if (shouldGroup && currentGroup) {
        currentGroup.messages.push(message);
      } else {
        const newGroup: MessageGroup = {
          id: `group-${message.id}`,
          messages: [message],
          timestamp: messageTime,
          senderId: messageSenderId,
          senderName: message.senderName || 'Unknown'
        };
        groups.push(newGroup);
        currentGroup = newGroup;
      }
    });

    return groups;
  }, [messages, enableGrouping, groupTimeThreshold]);

  const messageGroups = groupedMessages();

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !onLoadMore) return;

    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  const handleScroll = useCallback(({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 100;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    setShowScrollToBottom(!isCloseToBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messageGroups.length > 0) {
      flatListRef.current.scrollToIndex({ index: 0, animated: true });
    }
  }, [messageGroups.length]);

  const handleMessagePress = useCallback((message: Message) => {
    if (onMessagePress) {
      onMessagePress(message);
    }
  }, [onMessagePress]);

  const handleMessageLongPress = useCallback((message: Message) => {
    if (onMessageLongPress) {
      onMessageLongPress(message);
    } else {
      // Default long press behavior - show action sheet
      Alert.alert(
        'Message Actions',
        'What would you like to do with this message?',
        [
          { text: 'Copy', onPress: () => {} },
          { text: 'Reply', onPress: () => {} },
          { text: 'Delete', onPress: () => onDeleteMessage?.(message.id), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  }, [onMessageLongPress, onDeleteMessage]);

  const renderMessageGroup = useCallback(({ item: group }: { item: MessageGroup }) => {
    const isOwnMessage = currentUserId === group.senderId;
    const isSelected = group.messages.some(msg => selectedMessageIds.includes(msg.id));

    return (
      <View style={[styles.messageGroup, { marginVertical: messageSpacing }]}>
        {group.messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
            isFirstInGroup={index === 0}
            isLastInGroup={index === group.messages.length - 1}
            isSelected={isSelected}
            onPress={() => handleMessagePress(message)}
            onLongPress={() => handleMessageLongPress(message)}
            onRetry={() => onRetryMessage?.(message.id)}
            showAvatar={!isOwnMessage && index === group.messages.length - 1}
            showTimestamp={index === group.messages.length - 1}
            showSenderName={!isOwnMessage && index === 0}
          />
        ))}
      </View>
    );
  }, [
    currentUserId,
    selectedMessageIds,
    messageSpacing,
    handleMessagePress,
    handleMessageLongPress,
    onRetryMessage
  ]);

  const renderTypingIndicator = useCallback(() => {
    if (!showTypingIndicator || typingUsers.length === 0) return null;

    const typingText = typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.length} people are typing...`;

    return (
      <View style={styles.typingIndicator}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
          {typingText}
        </Text>
      </View>
    );
  }, [showTypingIndicator, typingUsers, theme.colors.primary, theme.colors.textSecondary]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <LoadingSpinner size="small" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading more messages...
        </Text>
      </View>
    );
  }, [isLoadingMore, theme.colors.textSecondary]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingSpinner />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Loading messages...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No messages yet. Start a conversation!
        </Text>
      </View>
    );
  }, [isLoading, theme.colors.textSecondary]);

  const keyExtractor = useCallback((item: MessageGroup) => item.id, []);

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: 80, // Estimated height
    offset: 80 * index,
    index,
  }), []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    messageGroup: {
      paddingHorizontal: theme.spacing.md,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    typingText: {
      marginLeft: theme.spacing.sm,
      fontSize: theme.typography.fontSize.small,
      fontStyle: 'italic',
    },
    loadingFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
    },
    loadingText: {
      marginLeft: theme.spacing.sm,
      fontSize: theme.typography.fontSize.small,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      minHeight: screenHeight * 0.5,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.medium,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    scrollToBottomButton: {
      position: 'absolute',
      bottom: theme.spacing.md,
      right: theme.spacing.md,
      backgroundColor: theme.colors.primary,
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messageGroups}
        renderItem={renderMessageGroup}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        inverted={inverted}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={20}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          enablePullToRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
        contentContainerStyle={
          messageGroups.length === 0 ? { flex: 1 } : undefined
        }
      />

      {renderTypingIndicator()}

      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.7}
        >
          <Text style={{ color: theme.colors.surface, fontSize: 20 }}>↓</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
