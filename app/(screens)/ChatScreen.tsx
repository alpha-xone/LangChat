import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList } from '@/components/chat/MessageList';
import { useChatConfig } from '@/hooks/useChatConfig';
import { getMarkdownExample, getRandomMarkdownExample } from '@/lib/markdown-examples';
import { generateMessageId } from '@/lib/message-utils';
import { debounce, mergeStreamingMessage, processStreamChunk } from '@/lib/stream-utils';
import { StreamProvider, useStreamContext } from '@/providers/Stream';
import { useTheme } from '@/theme/ThemeContext';
import { Message } from '@langchain/langgraph-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { StreamingDemo } from '@/components/demo/StreamingDemo';

function ChatInterface() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const messagesRef = useRef<Message[]>([]);

  // Add refs for chunk queuing
  const chunkQueueRef = useRef<any[]>([]);
  const isProcessingChunksRef = useRef(false);

  // Get streaming context - this will be null if not in provider
  const streamContext = useStreamContext();

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Function to add messages (used by demo and real chat)
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Replace message if it has the same ID (for streaming updates)
      const existingIndex = prev.findIndex(m => m.id === message.id);
      if (existingIndex >= 0) {
        const newMessages = [...prev];
        newMessages[existingIndex] = message;
        return newMessages;
      }
      return [...prev, message];
    });
  }, []);
  // Debounced message update function to prevent too frequent re-renders
  const debouncedUpdateMessages = useCallback(
    debounce((newMessages: Message[]) => {
      setMessages(newMessages);
    }, 50),
    []
  );

  // Process streaming chunks from LangGraph
  const processStreamingChunk = useCallback((chunkData: any) => {
    try {
      const { messageChunk, metadata } = processStreamChunk(chunkData);

      if (messageChunk) {
        setMessages(prev => {
          const updatedMessages = mergeStreamingMessage(prev, messageChunk, metadata);
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error('Error processing streaming chunk:', error);
    }
  }, []);
  // Update messages when stream context messages change
  useEffect(() => {
    if (!isDemoMode && streamContext?.messages) {
      // Use optional chaining to safely access messages
      const streamMessages = streamContext.messages;
      if (Array.isArray(streamMessages) && streamMessages.length > 0) {
        // Filter and process valid messages
        const validMessages = streamMessages.filter(msg =>
          msg && typeof msg === 'object' && msg.content
        );

        if (validMessages.length > messagesRef.current.length) {
          setMessages(validMessages);
        }
      }
    }
  }, [streamContext?.messages?.length, isDemoMode]); // Only depend on message length, not the array itself

  // Clear messages when switching modes
  useEffect(() => {
    if (isDemoMode) {
      setMessages([]);
    }
  }, [isDemoMode]);
  // Real LangGraph message handling
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    if (isDemoMode) {
      // Demo mode - simulate response
      const humanMessage: Message = {
        id: generateMessageId(),
        type: 'human',
        content: text.trim(),
      };
      addMessage(humanMessage);      // Simulate AI response with markdown examples
      setTimeout(() => {
        let demoContent = `Demo Echo: ${text.trim()}`;

        // Add markdown examples for demonstration
        const lowerText = text.toLowerCase();
        if (lowerText.includes('markdown') || lowerText.includes('example')) {
          demoContent = getRandomMarkdownExample();
        } else if (lowerText.includes('table')) {
          demoContent = getMarkdownExample('table');
        } else if (lowerText.includes('code')) {
          demoContent = getMarkdownExample('code');
        } else if (lowerText.includes('mixed') || lowerText.includes('all')) {
          demoContent = getMarkdownExample('mixed');
        } else if (lowerText.includes('basic')) {
          demoContent = getMarkdownExample('basic');
        } else {
          // For any other message, show a simple markdown demo
          demoContent = `# Demo Response

Your message: **${text.trim()}**

## Try these commands:
- Type "markdown" or "example" for random markdown demo
- Type "table" for table examples
- Type "code" for code block examples
- Type "mixed" or "all" for comprehensive demo
- Type "basic" for basic markdown features

### Current Features:
- ✅ **Bold** and *italic* text
- ✅ \`Inline code\` formatting
- ✅ Code blocks with syntax highlighting
- ✅ Tables and lists
- ✅ Blockquotes and headers

> Try different keywords to see various markdown examples!`;
        }

        const aiMessage: Message = {
          id: generateMessageId(),
          type: 'ai',
          content: demoContent,
        };
        addMessage(aiMessage);
      }, 1000);
      return;
    }

    // Real LangGraph streaming
    if (!streamContext) {
      Alert.alert('Error', 'Streaming not available. Please check configuration.');
      return;
    }

    try {
      console.log('Sending message to LangGraph:', { text });
      console.log('Stream context loading:', streamContext.isLoading);

      // Add user message immediately
      const userMessage: Message = {
        id: generateMessageId(),
        type: 'human',
        content: text.trim(),
      };
      addMessage(userMessage);

      // Use the submit method to send messages
      if (streamContext?.submit) {
        await streamContext.submit({
          messages: [userMessage]
        });
      } else {
        throw new Error('Submit method not available on stream context');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(
        'Error',
        'Failed to send message. Please check your connection and try again.\n\nError: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  }, [isDemoMode, streamContext, addMessage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (!isDemoMode && streamContext?.createNewThread) {
        // Create a new thread for fresh conversation
        await streamContext.createNewThread();
      } else if (!isDemoMode && streamContext?.clearMessages) {
        // Clear messages using stream context
        streamContext.clearMessages();
      } else {
        // Just clear local messages in demo mode
        setMessages([]);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isDemoMode, streamContext]);

  const handleStopStreaming = useCallback(async () => {
    try {
      if (!isDemoMode && streamContext?.stop) {
        streamContext.stop();
      }
    } catch (error) {
      console.error('Failed to stop stream:', error);
      Alert.alert('Error', 'Failed to stop stream');
    }
  }, [isDemoMode, streamContext]);

  const toggleMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
    setMessages([]);
  }, []);

  const isStreaming = isDemoMode ? false : (streamContext?.isLoading ?? false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border || theme.text + '20',
          backgroundColor: theme.background
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.text
            }}>
              Chat
            </Text>
            <TouchableOpacity
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                minWidth: 50,
                alignItems: 'center',
                backgroundColor: isDemoMode ? theme.primary + '20' : theme.success + '20'
              }}
              onPress={toggleMode}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: isDemoMode ? theme.primary : theme.success || theme.primary
              }}>
                {isDemoMode ? 'Demo' : 'Live'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <MessageList
          messages={messages}
          isLoading={isStreaming}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListHeaderComponent={
            messages.length === 0 ? (
              <StreamingDemo
                onAddMessage={addMessage}
                isStreaming={isStreaming}
                setIsStreaming={() => {}}
                showModeInfo={true}
                currentMode={isDemoMode ? 'demo' : 'live'}
              />
            ) : null
          }
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          disabled={false}
          isStreaming={isStreaming}
          placeholder={
            isStreaming
              ? "AI is responding..."
              : isDemoMode
                ? "Type a message (Demo mode)..."
                : "Type a message..."
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const { config, isConfigured } = useChatConfig();

  // Get environment variables as fallback
  const envConfig = {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
    assistantId: process.env.EXPO_PUBLIC_ASSISTANT_ID || '',
    apiKey: process.env.EXPO_PUBLIC_API_KEY || '',
  };

  // Check if we have configuration from either stored config or environment
  const hasEnvConfig = !!(envConfig.apiUrl && envConfig.assistantId);
  const canChat = isConfigured || hasEnvConfig;

  // Convert config to StreamConfig format, with env fallback
  const streamConfig = {
    apiUrl: config.apiUrl || envConfig.apiUrl,
    assistantId: config.assistantId || envConfig.assistantId,
    apiKey: config.apiKey || envConfig.apiKey,
  };

  console.log('ChatScreen: Configuration check', {
    isConfigured,
    hasEnvConfig,
    canChat,
    streamConfig: {
      ...streamConfig,
      apiKey: streamConfig.apiKey ? '***hidden***' : undefined
    }
  });

  if (!canChat) {
    return (
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 16,
          color: theme.text
        }}>
          Configuration Required
        </Text>
        <Text style={{
          fontSize: 16,
          color: theme.text + 'CC',
          textAlign: 'center',
          marginBottom: 24
        }}>
          Please configure your API settings in the Profile tab to start chatting.
        </Text>
        <Text style={{
          fontSize: 14,
          color: theme.text + '80',
          textAlign: 'center'
        }}>
          Go to Profile → Configure API URL and Assistant ID
        </Text>
        {!hasEnvConfig && (
          <Text style={{
            fontSize: 12,
            color: theme.text + '60',
            textAlign: 'center',
            marginTop: 16,
            fontStyle: 'italic'
          }}>
            Or add EXPO_PUBLIC_API_URL and EXPO_PUBLIC_ASSISTANT_ID to your .env file
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <StreamProvider config={streamConfig}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ChatInterface />
      </View>
    </StreamProvider>
  );
}