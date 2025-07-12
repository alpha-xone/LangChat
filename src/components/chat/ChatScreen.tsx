import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLangGraph, type LangGraphConfig, type ParsedMessage } from '../../ai';
import { useAppTheme } from '../../theming/useAppTheme';
import MessageBubble from './MessageBubble';

export interface ChatScreenProps {
  /**
   * LangGraph configuration
   */
  config: LangGraphConfig;

  /**
   * Optional thread ID to continue existing conversation
   */
  threadId?: string;

  /**
   * Whether to reconnect on mount
   */
  reconnectOnMount?: boolean;

  /**
   * Custom placeholder text for the input
   */
  placeholder?: string;

  /**
   * Custom header component
   */
  renderHeader?: () => React.ReactNode;

  /**
   * Custom message bubble component
   */
  renderMessage?: (message: ParsedMessage, index: number) => React.ReactElement | null;

  /**
   * Callback when a new thread is created
   */
  onThreadCreated?: (threadId: string) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void;

  /**
   * Custom styles
   */
  style?: {
    container?: object;
    messagesList?: object;
    inputContainer?: object;
    input?: object;
    sendButton?: object;
    sendButtonText?: object;
  };
}

export default function ChatScreen({
  config,
  threadId,
  reconnectOnMount = true,
  placeholder = "Type your message...",
  renderHeader,
  renderMessage,
  onThreadCreated,
  onError,
  style = {},
}: ChatScreenProps) {
  const [input, setInput] = useState('');
  const theme = useAppTheme();

  const {
    messages,
    isLoading,
    error,
    threadId: currentThreadId,
    sendMessage,
    stop,
    createNewThread,
  } = useLangGraph({
    config,
    threadId,
    reconnectOnMount,
  });

  // Handle thread creation callback
  React.useEffect(() => {
    if (currentThreadId && currentThreadId !== threadId) {
      onThreadCreated?.(currentThreadId);
    }
  }, [currentThreadId, threadId, onThreadCreated]);

  // Handle error callback
  React.useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput('');

    try {
      await sendMessage(messageText);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [input, isLoading, sendMessage]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleNewThread = useCallback(async () => {
    try {
      await createNewThread();
    } catch (err) {
      console.error('Error creating new thread:', err);
    }
  }, [createNewThread]);

  const renderMessageItem = useCallback(({ item, index }: { item: ParsedMessage; index: number }) => {
    if (renderMessage) {
      const customRender = renderMessage(item, index);
      if (customRender) {
        return customRender;
      }
    }

    return <MessageBubble key={item.id} message={item} theme={theme} />;
  }, [renderMessage, theme]);

  const styles = createStyles(theme, style);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        {renderHeader && (
          <View style={styles.header}>
            {renderHeader()}
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleNewThread} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          style={[styles.messagesList, style.messagesList]}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContainer}
        />

        {/* Input Container */}
        <View style={[styles.inputContainer, style.inputContainer]}>
          <TextInput
            style={[styles.input, style.input]}
            value={input}
            onChangeText={setInput}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={2000}
            editable={!isLoading}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              style.sendButton,
              (!input.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={isLoading ? handleStop : handleSend}
            disabled={!input.trim() && !isLoading}
          >
            <Text style={[styles.sendButtonText, style.sendButtonText]}>
              {isLoading ? 'Stop' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, customStyle: any = {}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      ...customStyle.container,
    },
    header: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      padding: theme.spacing.md,
      margin: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.fontSizes.md,
      flex: 1,
    },
    retryButton: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
    },
    retryButtonText: {
      color: theme.colors.background,
      fontSize: theme.fontSizes.sm,
      fontWeight: '600',
    },
    messagesList: {
      flex: 1,
    },
    messagesContainer: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    input: {
      flex: 1,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontSize: theme.fontSizes.md,
      maxHeight: 120,
      textAlignVertical: 'top',
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 60,
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
      opacity: 0.5,
    },
    sendButtonText: {
      color: theme.colors.background,
      fontSize: theme.fontSizes.md,
      fontWeight: '600',
    },
  });
