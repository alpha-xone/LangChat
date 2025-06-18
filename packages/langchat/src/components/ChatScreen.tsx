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
import { StreamProvider, useStreamContext } from '../context/Stream';
import { ThemeProvider, useOptionalTheme, useTheme } from '../context/ThemeProvider';
import { useChatConfig } from '../hooks/useChatConfig';
import { useDemoMessageHandler } from '../hooks/useDemoMessageHandler';
import { useRealChatHandler } from '../hooks/useRealChatHandler';
import { mergeStreamingMessage, processStreamChunk } from '../lib/stream-utils';
import { Theme, ThemeMode } from '../theme';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { StreamingDemo } from './demo/StreamingDemo';

interface ChatScreenProps {
  themeMode?: ThemeMode;
  theme?: Partial<Theme>;
  showDemo?: boolean;
  onThemeChange?: (mode: ThemeMode) => void; // Callback for app-level theme sync
  config?: {
    apiUrl?: string;
    assistantId?: string;
    apiKey?: string;
  };
}

interface ChatInterfaceProps {
  showDemo: boolean;
}

function ChatInterface({ showDemo }: ChatInterfaceProps) {
  const { theme } = useTheme(); // Now uses the package's theme context
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(showDemo);
  const messagesRef = useRef<Message[]>([]);

  // Add refs for chunk queuing
  const chunkQueueRef = useRef<any[]>([]);
  const isProcessingChunksRef = useRef(false);

  // Get streaming context
  const streamContext = useStreamContext();

  // Force live mode if demo is disabled
  useEffect(() => {
    if (!showDemo) {
      setIsDemoMode(false);
    }
  }, [showDemo]);

  // Initialize message handlers
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const existingIndex = prev.findIndex(m => m.id === message.id);
      if (existingIndex >= 0) {
        const newMessages = [...prev];
        newMessages[existingIndex] = message;
        return newMessages;
      }
      return [...prev, message];
    });
  }, []);

  const { handleDemoMessage } = useDemoMessageHandler({ addMessage });
  const { handleRealMessage } = useRealChatHandler({ addMessage, chunkQueueRef });

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Debounced message update function
  const debouncedUpdateMessages = useCallback(
    (newMessages: Message[]) => {
      const timeoutId = setTimeout(() => {
        setMessages(newMessages);
      }, 50);
      return () => clearTimeout(timeoutId);
    },
    [setMessages]
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

  // Process chunk queue
  const processChunkQueue = useCallback(async () => {
    if (isProcessingChunksRef.current || chunkQueueRef.current.length === 0) {
      return;
    }

    isProcessingChunksRef.current = true;

    try {
      while (chunkQueueRef.current.length > 0) {
        const chunk = chunkQueueRef.current.shift();
        if (chunk) {
          processStreamingChunk(chunk);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      isProcessingChunksRef.current = false;
    }
  }, [processStreamingChunk]);

  // Handle incoming stream data
  useEffect(() => {
    if (!isDemoMode && streamContext?.messages) {
      const streamMessages = streamContext.messages;

      if (Array.isArray(streamMessages) && streamMessages.length > 0) {
        const lastMessage = streamMessages[streamMessages.length - 1];

        if (lastMessage && lastMessage.content) {
          chunkQueueRef.current.push(lastMessage);
          processChunkQueue();
        }
      }
    }
  }, [streamContext?.messages, isDemoMode, processChunkQueue]);

  // Alternative: Direct message updates
  useEffect(() => {
    if (!isDemoMode && streamContext?.messages) {
      const streamMessages = streamContext.messages;

      if (Array.isArray(streamMessages) && streamMessages.length > 0) {
        const validMessages = streamMessages.filter(msg =>
          msg && typeof msg === 'object' && msg.content
        );

        if (validMessages.length !== messagesRef.current.length ||
            JSON.stringify(validMessages) !== JSON.stringify(messagesRef.current)) {
          debouncedUpdateMessages(validMessages);
        }
      }
    }
  }, [streamContext?.messages, isDemoMode, debouncedUpdateMessages]);

  // Clear messages when switching modes
  useEffect(() => {
    if (isDemoMode) {
      setMessages([]);
      chunkQueueRef.current = [];
    }
  }, [isDemoMode]);

  // Main message handler
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    if (!showDemo || !isDemoMode) {
      await handleRealMessage(text);
    } else {
      await handleDemoMessage(text);
    }
  }, [showDemo, isDemoMode, handleDemoMessage, handleRealMessage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      chunkQueueRef.current = [];

      if ((!showDemo || !isDemoMode) && streamContext?.createNewThread) {
        await streamContext.createNewThread();
      } else if ((!showDemo || !isDemoMode) && streamContext?.clearMessages) {
        streamContext.clearMessages();
      } else {
        setMessages([]);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [showDemo, isDemoMode, streamContext]);

  const handleStopStreaming = useCallback(async () => {
    try {
      chunkQueueRef.current = [];
      isProcessingChunksRef.current = false;

      if ((!showDemo || !isDemoMode) && streamContext?.stop) {
        streamContext.stop();
      }
    } catch (error) {
      console.error('Failed to stop stream:', error);
      Alert.alert('Error', 'Failed to stop stream');
    }
  }, [showDemo, isDemoMode, streamContext]);

  const toggleMode = useCallback(() => {
    if (showDemo) {
      setIsDemoMode(prev => !prev);
      setMessages([]);
      chunkQueueRef.current = [];
    }
  }, [showDemo]);

  const isStreaming = (showDemo && isDemoMode) ? false : (streamContext?.isLoading ?? false);

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
          borderBottomColor: theme.border,
          backgroundColor: theme.background
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.primary
            }}>
              Chat
            </Text>
            {showDemo && (
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
                  color: isDemoMode ? theme.primary : theme.success
                }}>
                  {isDemoMode ? 'Demo' : 'Live'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <MessageList
          messages={messages}
          isLoading={isStreaming}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          theme={theme} // Add theme prop
          ListHeaderComponent={
            (showDemo && messages.length === 0) ? (
              <StreamingDemo
                onAddMessage={addMessage}
                isStreaming={isStreaming}
                setIsStreaming={() => {}}
                showModeInfo={true}
                currentMode={isDemoMode ? 'demo' : 'live'}
                theme={theme} // Add theme prop
              />
            ) : null
          }
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          disabled={false}
          isStreaming={isStreaming}
          theme={theme} // Add theme prop
          placeholder={
            isStreaming
              ? "AI is responding..."
              : (showDemo && isDemoMode)
                ? "Type a message (Demo mode)..."
                : "Type a message..."
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function ChatScreen({
  themeMode = 'system',
  theme: themeOverrides,
  showDemo = false,
  onThemeChange,
  config: externalConfig
}: ChatScreenProps) {
  const { config, isConfigured } = useChatConfig();
  const existingThemeContext = useOptionalTheme();

  // Get environment variables as fallback
  const envConfig = {
    apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || '',
    assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || '',
    apiKey: process.env.EXPO_PUBLIC_LANGGRAPH_API_KEY || '',
  };

  // Check configuration
  const hasExternalConfig = !!(externalConfig?.apiUrl && externalConfig?.assistantId);
  const hasEnvConfig = !!(envConfig.apiUrl && envConfig.assistantId);
  const canChat = hasExternalConfig || isConfigured || hasEnvConfig;

  // Convert config to StreamConfig format
  const streamConfig = {
    apiUrl: externalConfig?.apiUrl || config.apiUrl || envConfig.apiUrl,
    assistantId: externalConfig?.assistantId || config.assistantId || envConfig.assistantId,
    apiKey: externalConfig?.apiKey || config.apiKey || envConfig.apiKey,
  };

  if (!canChat) {
    return (
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: themeOverrides?.background || '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 16,
          color: themeOverrides?.text || '#000000'
        }}>
          Configuration Required
        </Text>
        <Text style={{
          fontSize: 16,
          color: themeOverrides?.text || '#000000',
          opacity: 0.7,
          textAlign: 'center',
          marginBottom: 24
        }}>
          Please configure your API settings to start chatting.
        </Text>
        <Text style={{
          fontSize: 14,
          color: themeOverrides?.text || '#000000',
          opacity: 0.5,
          textAlign: 'center'
        }}>
          Pass config props or set environment variables
        </Text>
      </SafeAreaView>
    );
  }

  // If already in a theme context, use it directly
  if (existingThemeContext) {
    return (
      <StreamProvider config={streamConfig}>
        <ChatInterface showDemo={showDemo} />
      </StreamProvider>
    );
  }

  // Create new theme context if none exists
  return (
    <ThemeProvider
      mode={themeMode}
      theme={themeOverrides}
      onModeChange={onThemeChange}
    >
      <StreamProvider config={streamConfig}>
        <ChatInterface showDemo={showDemo} />
      </StreamProvider>
    </ThemeProvider>
  );
}