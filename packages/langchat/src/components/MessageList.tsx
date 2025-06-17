import { Message } from '@langchain/langgraph-sdk';
import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { filterRenderableMessages } from '../lib/message-utils';
import { Theme } from '../theme';
import { AIMessage } from './messages/AIMessage';
import { HumanMessage } from './messages/HumanMessage';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  theme: Theme;
}

export function MessageList({
  messages,
  isLoading = false,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
  theme,
}: MessageListProps) {
  const renderableMessages = filterRenderableMessages(messages);

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isUser = message.type === 'human';

    if (isUser) {
      return (
        <HumanMessage
          message={message}
          theme={theme}
          onCopy={(text) => {
            // Handle copy functionality if needed
            console.log('Copied:', text);
          }}
        />
      );
    } else {
      return (
        <AIMessage
          message={message}
          theme={theme}
          onCopy={(text) => {
            // Handle copy functionality if needed
            console.log('Copied:', text);
          }}
        />
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
    />
  );
}
