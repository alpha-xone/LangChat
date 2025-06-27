import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import LucideIcon from '@react-native-vector-icons/lucide';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { filterRenderableMessages } from '../lib/message-utils';
import { Theme } from '../theme';
import { AIMessage } from './messages/AIMessage';
import { HumanMessage } from './messages/HumanMessage';
import { ToolMessage } from './messages/ToolMessage';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  theme: Theme;
  showAIBubble?: boolean;
  showHumanBubble?: boolean;
  showToolMessages?: boolean;
  compactToolMessages?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onBatchDeleteMessages?: (messageIds: string[]) => void;
  showMessageActions?: boolean;
  onSelectionModeChange?: (isSelectionMode: boolean) => void;
  triggerSelectionMode?: boolean;
}

export function MessageList({
  messages,
  isLoading = false,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
  theme,
  showAIBubble = false,
  showHumanBubble = true,
  showToolMessages = true,
  compactToolMessages = false,
  onDeleteMessage,
  onBatchDeleteMessages,
  showMessageActions = false,
  onSelectionModeChange,
  triggerSelectionMode = false,
}: MessageListProps) {
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const renderableMessages = filterRenderableMessages(messages, showToolMessages);

  const toggleMessageSelection = useCallback((messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const selectAllMessages = useCallback(() => {
    const allMessageIds = renderableMessages.map(m => m.id).filter(Boolean) as string[];
    setSelectedMessages(new Set(allMessageIds));
  }, [renderableMessages]);

  const clearSelection = useCallback(() => {
    setSelectedMessages(new Set());
    setIsSelectionMode(false);
  }, []);

  const handleBatchDelete = useCallback(() => {
    if (!onBatchDeleteMessages || selectedMessages.size === 0) return;

    Alert.alert(
      'Delete Messages',
      `Are you sure you want to delete ${selectedMessages.size} message(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onBatchDeleteMessages(Array.from(selectedMessages));
            clearSelection();
          },
        },
      ]
    );
  }, [onBatchDeleteMessages, selectedMessages, clearSelection]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!onDeleteMessage) return;

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteMessage(messageId),
        },
      ]
    );
  }, [onDeleteMessage]);
  const renderMessage = ({ item: message }: { item: Message }) => {
    const isUser = message.type === 'human';
    const isTool = message.type === 'tool';
    const messageId = message.id;
    const isSelected = messageId ? selectedMessages.has(messageId) : false;

    // Add safety check for message content
    if (!message.content && message.content !== '') {
      return null; // Skip messages with no content
    }

    const MessageWrapper = ({ children }: { children: React.ReactNode }) => (
      <View style={{
        position: 'relative',
        backgroundColor: isSelected ? theme.primary + '20' : 'transparent',
        marginVertical: 2,
      }}>
        <TouchableOpacity
          onLongPress={() => {
            if (showMessageActions && messageId) {
              if (!isSelectionMode) {
                setIsSelectionMode(true);
                toggleMessageSelection(messageId);
              }
            }
          }}
          onPress={() => {
            if (isSelectionMode && messageId) {
              toggleMessageSelection(messageId);
            }
          }}
          activeOpacity={isSelectionMode ? 0.7 : 1}
          style={{ flex: 1 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {isSelectionMode && (
              <View style={{
                marginLeft: 8,
                marginRight: 4,
                marginTop: 8,
                justifyContent: 'center'
              }}>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={isSelected ? theme.primary : theme.placeholder}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              {children}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );

    if (isUser) {
      return (
        <MessageWrapper>
          <HumanMessage
            message={message}
            theme={theme}
            showBubble={showHumanBubble}
            onCopy={(text) => {
              // Copy handled internally in component
            }}
          />
        </MessageWrapper>
      );
    } else if (isTool) {
      // Tool messages are rendered with a special ToolMessage component
      return (
        <MessageWrapper>
          <ToolMessage
            message={message}
            theme={theme}
            showBubble={showAIBubble}
            compact={compactToolMessages}
            onCopy={(text) => {
              // Copy handled internally in component
            }}
          />
        </MessageWrapper>
      );
    } else {
      return (
        <MessageWrapper>
          <AIMessage
            message={message}
            theme={theme}
            showBubble={showAIBubble}
            onCopy={(text) => {
              // Copy handled internally in component
            }}
          />
        </MessageWrapper>
      );
    }
  };

  const renderSelectionHeader = () => {
    if (!isSelectionMode) return null;

    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: theme.text,
        }}>
          {selectedMessages.size} Selected
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {selectedMessages.size > 0 && onBatchDeleteMessages && (
            <TouchableOpacity onPress={handleBatchDelete}>
              <LucideIcon
                name="trash"
                size={18}
                color={theme.error || '#ff4444'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={selectAllMessages}>
            <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearSelection}>
            <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32
    }}>
      <Text style={{
        fontSize: 16,
        color: theme.text + '80',
        textAlign: 'center',
        lineHeight: 24
      }}>
        Start a conversation by sending a message below
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={{ paddingVertical: 8 }}>
        <AIMessage
          isLoading={true}
          onCopy={() => {}}
          message={{ id: 'loading', type: 'ai', content: '' } as Message}
          theme={theme}
          showBubble={showAIBubble}
        />
      </View>
    );
  };

  // Notify parent when selection mode changes
  React.useEffect(() => {
    onSelectionModeChange?.(isSelectionMode);
  }, [isSelectionMode, onSelectionModeChange]);

  // Handle external trigger for selection mode
  React.useEffect(() => {
    if (triggerSelectionMode && renderableMessages.length > 0 && !isSelectionMode) {
      setIsSelectionMode(true);
    }
  }, [triggerSelectionMode, renderableMessages.length, isSelectionMode]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {renderSelectionHeader()}
      <FlatList
        data={renderableMessages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id || `${item.type}-${index}`}
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: 8,
          ...(renderableMessages.length === 0 && { justifyContent: 'center' })
        }}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
