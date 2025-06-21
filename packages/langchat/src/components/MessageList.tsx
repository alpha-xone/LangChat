import { Message } from '@langchain/langgraph-sdk';
import React from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
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
}: MessageListProps) {
  const renderableMessages = filterRenderableMessages(messages, showToolMessages);
  const renderMessage = ({ item: message }: { item: Message }) => {
    const isUser = message.type === 'human';
    const isTool = message.type === 'tool';

    if (isUser) {
      return (        <HumanMessage
          message={message}
          theme={theme}
          showBubble={showHumanBubble}
          onCopy={(text) => {
            // Copy handled internally in component
          }}
        />
      );    } else if (isTool) {
      // Tool messages are rendered with a special ToolMessage component
      return (
        <ToolMessage
          message={message}
          theme={theme}
          showBubble={showAIBubble}
          compact={compactToolMessages}
          onCopy={(text) => {
            // Copy handled internally in component
          }}
        />
      );
    } else {
      return (
        <AIMessage
          message={message}
          theme={theme}
          showBubble={showAIBubble}
          onCopy={(text) => {
            // Copy handled internally in component
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
          showBubble={showAIBubble}
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
