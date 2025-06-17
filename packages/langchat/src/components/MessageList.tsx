import { Message } from '@langchain/langgraph-sdk';
import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { filterRenderableMessages } from '../lib/message-utils';
import { Theme } from '../theme';
import { AIMessage } from './messages/AIMessage';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  theme: Theme; // Add theme prop
}

export function MessageList({
  messages,
  isLoading = false,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
  theme, // Receive theme prop
}: MessageListProps) {
  const renderableMessages = filterRenderableMessages(messages);

  const renderMessage = ({ item: message, index }: { item: Message; index: number }) => {
    const isUser = message.type === 'human';

    return (
      <View style={{
        padding: 16,
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        <View style={{
          maxWidth: '80%',
          backgroundColor: isUser ? theme.primary : theme.surface,
          borderRadius: 16,
          padding: 12,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
        }}>
          <Text style={{
            color: isUser ? '#ffffff' : theme.text,
            fontSize: 16,
            lineHeight: 20,
          }}>
            {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
          </Text>
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
        />
      </View>
    );
  };

  return (
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
      inverted={renderableMessages.length > 0}
    />
  );
}
