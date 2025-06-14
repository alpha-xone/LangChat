import { Message } from '@langchain/langgraph-sdk';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { filterRenderableMessages } from '../lib/message-utils';
import { AIMessage } from './messages/AIMessage';
import { HumanMessage } from './messages/HumanMessage';
import { Toast } from './ui/Toast';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export function MessageList({
  messages,
  isLoading = false,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
}: MessageListProps) {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [toast, setToast] = useState({ visible: false, message: '' });

  // Filter out messages that shouldn't be rendered
  const renderableMessages = filterRenderableMessages(messages);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (renderableMessages.length > 0) {
      // Use a small delay to ensure the UI has updated
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [renderableMessages.length, renderableMessages[renderableMessages.length - 1]?.content]);

  const handleCopy = (text: string) => {
    setToast({ visible: true, message: 'Message copied to clipboard' });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '' });
  };

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    const key = message.id || `${message.type}-${index}`;

    switch (message.type) {
      case 'human':
        return <HumanMessage key={key} message={message} onCopy={handleCopy} />;
      case 'ai':
        return <AIMessage key={key} message={message} onCopy={handleCopy} />;
      case 'tool':
        // Tool messages are typically not rendered directly in the UI
        return null;
      default:
        return (
          <View key={key} style={{
            marginVertical: 4,
            marginHorizontal: 16,
            padding: 12,
            backgroundColor: theme.error + '20' || '#FF000020',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.error + '40' || '#FF000040'
          }}>
            <Text style={{
              color: theme.error || '#FF0000',
              fontSize: 12,
              fontStyle: 'italic'
            }}>
              Unknown message type: {message.type}
            </Text>
          </View>
        );
    }
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
        <AIMessage isLoading={true} onCopy={handleCopy} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={renderableMessages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id || `${item.type}-${index}`}
        style={{
          flex: 1,
          backgroundColor: theme.background
        }}
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={20}
        windowSize={10}
      />

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
        duration={2000}
      />
    </View>
  );
}
