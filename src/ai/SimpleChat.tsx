import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLangGraphSimple, type ParsedMessage } from '../ai';
import { useAppTheme } from '../theming/useAppTheme';
import { SimpleIcon } from './SimpleIcon';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isComplete?: boolean;
}

export interface SimpleChatProps {
  placeholder?: string;
  maxLength?: number;
  onMessageSent?: (message: string) => void;
  onMessageReceived?: (message: ParsedMessage) => void;
  onError?: (error: Error) => void;
}

/**
 * Simple chat component demonstrating LangGraph integration
 * Shows how to use the useLangGraphSimple hook for AI conversations
 */
export const SimpleChat: React.FC<SimpleChatProps> = ({
  placeholder = "Type your message...",
  maxLength = 1000,
  onMessageSent,
  onMessageReceived,
  onError,
}) => {
  const { theme } = useAppTheme();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if LangGraph is configured
  const apiUrl = process.env.EXPO_PUBLIC_LANGGRAPH_API_URL;
  const assistantId = process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID;
  const isConfigured = apiUrl && assistantId;

  // LangGraph hook
  const {
    isConnected,
    isStreaming,
    currentMessage,
    error,
    threadId,
    connect,
    createThread,
    sendMessage,
    cancelCurrentStream,
    clearError,
  } = useLangGraphSimple(
    (message: ParsedMessage) => {
      console.log('[SimpleChat] Received message from LangGraph:', message);

      // Handle incoming AI messages
      setMessages(prev => {
        console.log('[SimpleChat] Current messages count:', prev.length);

        const existingIndex = prev.findIndex(msg => msg.id === message.id);

        // Map the role to our supported types
        const mappedRole: 'user' | 'assistant' | 'system' =
          message.role === 'user' ? 'user' :
          message.role === 'system' ? 'system' : 'assistant';

        const chatMessage: ChatMessage = {
          id: message.id,
          role: mappedRole,
          content: message.content,
          timestamp: message.timestamp,
          isComplete: message.isComplete,
        };

        let newMessages;
        if (existingIndex >= 0) {
          // Update existing message
          newMessages = [...prev];
          newMessages[existingIndex] = chatMessage;
          console.log('[SimpleChat] Updated existing message at index:', existingIndex);
        } else {
          // Add new message
          newMessages = [...prev, chatMessage];
          console.log('[SimpleChat] Added new message, total count:', newMessages.length);
        }

        return newMessages;
      });

      onMessageReceived?.(message);
    },
    (error: Error) => {
      console.error('[SimpleChat] LangGraph error:', error);
      Alert.alert('Error', error.message);
      onError?.(error);
    }
  );

  /**
   * Send message to AI
   */
  const handleSendMessage = async () => {
    console.log('[SimpleChat] Send message called:', { inputText: inputText.trim(), isStreaming, isConnected });

    if (!inputText.trim() || isStreaming) {
      console.log('[SimpleChat] Send message cancelled: empty input or streaming');
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');

    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      isComplete: true,
    };

    console.log('[SimpleChat] Adding user message:', userChatMessage);
    setMessages(prev => {
      const newMessages = [...prev, userChatMessage];
      console.log('[SimpleChat] Messages after adding user message:', newMessages.length);
      return newMessages;
    });
    onMessageSent?.(userMessage);

    try {
      // Ensure we have a thread
      let currentThreadId = threadId;
      if (!currentThreadId) {
        console.log('[SimpleChat] Creating new thread...');
        currentThreadId = await createThread();
        console.log('[SimpleChat] Created thread:', currentThreadId);
      }

      // Send message to AI
      console.log('[SimpleChat] Sending message to AI:', { message: userMessage, threadId: currentThreadId });
      await sendMessage(userMessage, currentThreadId);
      console.log('[SimpleChat] Message sent successfully');
    } catch (error) {
      console.error('[SimpleChat] Send error:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  /**
   * Cancel current AI response
   */
  const handleCancelStream = async () => {
    try {
      await cancelCurrentStream();
    } catch (error) {
      console.error('[SimpleChat] Cancel error:', error);
    }
  };

  /**
   * Clear error and retry connection
   */
  const handleRetryConnection = async () => {
    clearError();
    await connect();
  };

  /**
   * Scroll to bottom when new messages arrive
   */
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, currentMessage]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    headerIcon: {
      marginRight: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: theme.fontSizes.lg,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: isConnected ? theme.colors.success : theme.colors.error,
    },
    statusText: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.background,
      fontWeight: '500',
    },
    messagesContainer: {
      flex: 1,
      padding: theme.spacing.md,
    },
    messageItem: {
      marginBottom: theme.spacing.md,
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      maxWidth: '80%',
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      maxWidth: '80%',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    messageText: {
      fontSize: theme.fontSizes.md,
      lineHeight: 20,
    },
    userMessageText: {
      color: theme.colors.background,
    },
    assistantMessageText: {
      color: theme.colors.text,
    },
    incompleteIndicator: {
      marginTop: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    incompleteText: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    timestamp: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      alignItems: 'flex-end',
      backgroundColor: theme.colors.surface,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      maxHeight: 100,
    },
    sendButton: {
      marginLeft: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.colors.error,
    },
    disabledButton: {
      opacity: 0.5,
    },
    errorContainer: {
      margin: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.errorLight,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.error,
      flex: 1,
      marginLeft: theme.spacing.sm,
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
      fontWeight: '500',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyStateText: {
      fontSize: theme.fontSizes.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageItem,
        message.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
        ]}
      >
        {message.content}
      </Text>

      {!message.isComplete && (
        <View style={styles.incompleteIndicator}>
          <ActivityIndicator size="small" color={theme.colors.textSecondary} />
          <Text style={styles.incompleteText}>AI is typing...</Text>
        </View>
      )}

      <Text style={styles.timestamp}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <SimpleIcon name="message" size={24} color={theme.colors.primary} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>LangGraph Chat</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <SimpleIcon name="alert" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetryConnection}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {!isConfigured ? (
          <View style={styles.emptyState}>
            <SimpleIcon name="settings" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              LangGraph Configuration Required
            </Text>
            <Text style={[styles.emptyStateText, { fontSize: theme.fontSizes.sm, marginTop: theme.spacing.sm }]}>
              To use the AI chat, please configure your LangGraph settings:
            </Text>
            <Text style={[styles.emptyStateText, { fontSize: theme.fontSizes.xs, marginTop: theme.spacing.sm }]}>
              1. Copy .env.example to .env{'\n'}
              2. Set EXPO_PUBLIC_LANGGRAPH_API_URL{'\n'}
              3. Set EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID{'\n'}
              4. Restart the app
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <SimpleIcon name="message" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              Start a conversation with the AI assistant
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isConfigured ? placeholder : "Configure LangGraph to start chatting..."}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={maxLength}
          editable={!isStreaming && isConnected && isConfigured}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            isStreaming && styles.cancelButton,
            ((!inputText.trim() && !isStreaming) || !isConfigured) && styles.disabledButton,
          ]}
          onPress={isStreaming ? handleCancelStream : handleSendMessage}
          disabled={(!inputText.trim() && !isStreaming) || !isConfigured}
        >
          {isStreaming ? (
            <SimpleIcon name="stop" size={20} color={theme.colors.background} />
          ) : (
            <SimpleIcon name="send" size={20} color={theme.colors.background} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
