import { Message } from '@langchain/langgraph-sdk';
import LucideIcon from '@react-native-vector-icons/lucide';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StreamProvider, useStreamContext } from '../context/Stream';
import { ThemeProvider, useOptionalTheme, useTheme } from '../context/ThemeProvider';
import { useChat } from '../contexts/ChatContext'; // Add this import
import { useChatConfig } from '../hooks/useChatConfig';
import { useDemoMessageHandler } from '../hooks/useDemoMessageHandler';
import { useRealChatHandler } from '../hooks/useRealChatHandler';
import { mergeStreamingMessage, processStreamChunk } from '../lib/stream-utils';
import { Theme, ThemeMode } from '../theme';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { ThreadsPanel } from './common';
import { StreamingDemo } from './demo/StreamingDemo';

// Auth types for optional integration
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
}

interface ChatScreenProps {
  themeMode?: ThemeMode;
  theme?: Partial<Theme>;
  showDemo?: boolean;
  showAIBubble?: boolean;
  showToolMessages?: boolean;
  showThreadsPanel?: boolean; // New prop to enable/disable threads panel
  showUserProfile?: boolean; // New prop to show user profile button
  authContext?: AuthContextType; // Optional auth context
  onThemeChange?: (mode: ThemeMode) => void; // Callback for app-level theme sync
  onProfilePress?: () => void; // Callback for profile button press
  config?: {
    apiUrl?: string;
    assistantId?: string;
    apiKey?: string;
  };
}

interface ChatInterfaceProps {
  showDemo: boolean;
  showAIBubble: boolean;
  showToolMessages: boolean;
  showThreadsPanel: boolean;
  showUserProfile: boolean;
  authContext?: AuthContextType;
  onProfilePress?: () => void;
}

function ChatInterface({
  showDemo,
  showAIBubble,
  showToolMessages,
  showThreadsPanel,
  showUserProfile,
  authContext,
  onProfilePress
}: ChatInterfaceProps) {
  const { theme } = useTheme();

  // Use ChatContext for message management
  const {
    messages: chatContextMessages,
    loadMessages,
    currentThread,
    selectThread,
    deleteThread,
    renameThread,
    createThread
  } = useChat();

  // Keep local state for both demo and live messages (to avoid breaking existing logic)
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [demoMessages, setDemoMessages] = useState<Message[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(showDemo);
  const [isThreadsPanelVisible, setIsThreadsPanelVisible] = useState(false);

  // Use appropriate messages based on mode
  const messages = isDemoMode ? demoMessages : localMessages;
  const messagesRef = useRef<Message[]>([]);

  // Add refs for chunk queuing
  const chunkQueueRef = useRef<any[]>([]);
  const isProcessingChunksRef = useRef(false);

  // Get streaming context
  const streamContext = useStreamContext();

  // Undo functionality for deleted messages - MOVED UP to avoid reference errors
  const [deletedMessages, setDeletedMessages] = useState<{message: Message, timestamp: number}[]>([]);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Message selection mode state
  const [triggerMessageSelection, setTriggerMessageSelection] = useState(false);
  const [isMessageSelectionMode, setIsMessageSelectionMode] = useState(false);

  // Force live mode if demo is disabled
  useEffect(() => {
    if (!showDemo) {
      setIsDemoMode(false);
    }
  }, [showDemo]);

  // Sync ChatContext messages to local state for live mode
  useEffect(() => {
    if (!isDemoMode) {
      // Convert ChatMessage[] to Message[] format with proper type mapping
      const convertedMessages: Message[] = chatContextMessages.map(chatMsg => {
        // Map role to proper message type
        let messageType: 'human' | 'ai' | 'tool';
        const msgRole = (chatMsg.role || '').toLowerCase();

        if (msgRole === 'human' || msgRole === 'user') {
          messageType = 'human';
        } else if (msgRole === 'tool') {
          messageType = 'tool';
        } else {
          // All other roles (assistant, ai, etc.) are AI messages
          messageType = 'ai';
        }

        return {
          id: chatMsg.id,
          content: chatMsg.content,
          role: chatMsg.role, // Keep the original role from database
          metadata: chatMsg.metadata || {},
          created_at: chatMsg.created_at,
          type: messageType, // Use the mapped type instead of hardcoded 'human'
        } as Message;
      });
      setLocalMessages(convertedMessages);
    }
  }, [chatContextMessages, isDemoMode]);

  // Create setMessages function for compatibility - MOVED UP to avoid reference errors
  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    if (isDemoMode) {
      setDemoMessages(updater);
    } else {
      setLocalMessages(updater);
    }
  }, [isDemoMode]);

  // Initialize message handlers - only for demo mode
  const addMessage = useCallback((message: Message) => {
    if (isDemoMode) {
      setDemoMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
          const newMessages = [...prev];
          newMessages[existingIndex] = message;
          return newMessages;
        }
        return [...prev, message];
      });
    } else {
      // For live mode, update local messages
      setLocalMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
          const newMessages = [...prev];
          newMessages[existingIndex] = message;
          return newMessages;
        }
        return [...prev, message];
      });
    }
  }, [isDemoMode]);

  const { handleDemoMessage } = useDemoMessageHandler({ addMessage });
  const { handleRealMessage } = useRealChatHandler({ addMessage, chunkQueueRef });

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Debounced message update function - FIXED return type
  const debouncedUpdateMessages = useCallback(
    (newMessages: Message[]) => {
      setTimeout(() => {
        setMessages(newMessages);
      }, 50);
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
  }, [setMessages]);

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
      setDemoMessages([]);
      chunkQueueRef.current = [];
    } else {
      setLocalMessages([]);
      chunkQueueRef.current = [];
    }
  }, [isDemoMode]);

  // Add toggleMode function that was referenced in JSX
  const toggleMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
  }, []);

  // Main message handler
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // If we're in live mode and don't have a thread, ensure one exists
    if (!showDemo || !isDemoMode) {
      if (!streamContext?.threadId && streamContext?.ensureThread) {
        await streamContext.ensureThread();
      }
      await handleRealMessage(text);
    } else {
      await handleDemoMessage(text);
    }
  }, [showDemo, isDemoMode, handleDemoMessage, handleRealMessage, streamContext]);

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

  // Thread management handlers - Updated to use ChatContext methods
  const handleSelectThread = useCallback(async (threadId: string) => {
    try {
      // Use ChatContext's selectThread method which handles both switching and loading messages
      await selectThread(threadId);

      // Clear any demo messages and local streaming state
      setDemoMessages([]);
      setLocalMessages([]); // Clear local messages, they'll be repopulated from ChatContext
      chunkQueueRef.current = [];

      console.log('Thread selected and messages loaded from Supabase:', threadId);
    } catch (error) {
      console.error('Failed to switch to thread:', error);
      Alert.alert('Error', 'Failed to switch to thread');
    }
  }, [selectThread]);

  const handleCreateNewThread = useCallback(async () => {
    try {
      // Use ChatContext's createThread method which creates in Supabase
      const newThread = await createThread('New Chat');

      if (newThread) {
        setDemoMessages([]); // Clear demo messages for new thread
        setLocalMessages([]); // Clear local messages for new thread
        chunkQueueRef.current = [];
        console.log('New thread created in Supabase:', newThread.id);
      }
    } catch (error) {
      console.error('Failed to create new thread:', error);
      Alert.alert('Error', 'Failed to create new thread');
    }
  }, [createThread]);

  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      // Use ChatContext's deleteThread method which deletes from Supabase
      await deleteThread(threadId);

      // If we deleted the current thread, clear messages
      if (currentThread?.id === threadId) {
        setMessages([]);
        chunkQueueRef.current = [];
      }

      console.log('Thread deleted from Supabase:', threadId);
    } catch (error) {
      console.error('Failed to delete thread:', error);
      Alert.alert('Error', 'Failed to delete thread');
    }
  }, [deleteThread, currentThread, setMessages]);

  const handleRenameThread = useCallback(async (threadId: string, newTitle: string) => {
    try {
      // Use ChatContext's renameThread method which updates Supabase
      await renameThread(threadId, newTitle);
      console.log('Thread renamed in Supabase:', threadId, newTitle);
    } catch (error) {
      console.error('Failed to rename thread:', error);
      Alert.alert('Error', 'Failed to rename thread');
    }
  }, [renameThread]);

  const handleBatchDeleteThreads = useCallback(async (threadIds: string[]) => {
    try {
      // Delete threads one by one using ChatContext's deleteThread method
      await Promise.all(threadIds.map(threadId => deleteThread(threadId)));

      // If we deleted the current thread, clear messages
      if (threadIds.includes(currentThread?.id || '')) {
        setMessages([]);
        chunkQueueRef.current = [];
      }

      console.log('Batch deleted threads from Supabase:', threadIds.length);
    } catch (error) {
      console.error('Failed to batch delete threads:', error);
      Alert.alert('Error', 'Failed to batch delete threads');
    }
  }, [deleteThread, currentThread, setMessages]);

  // Message deletion handlers
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      if (isDemoMode) {
        // Handle demo mode deletion locally
        const messageToDelete = demoMessages.find(m => m.id === messageId);
        if (messageToDelete) {
          setDeletedMessages(prev => [...prev, { message: messageToDelete, timestamp: Date.now() }]);
          setShowUndoToast(true);
          setTimeout(() => setShowUndoToast(false), 5000);
        }
        setDemoMessages(prev => prev.filter(m => m.id !== messageId));
      } else {
        // For live mode, handle locally and potentially sync with ChatContext later
        const messageToDelete = localMessages.find(m => m.id === messageId);
        if (messageToDelete) {
          setDeletedMessages(prev => [...prev, { message: messageToDelete, timestamp: Date.now() }]);
          setShowUndoToast(true);
          setTimeout(() => setShowUndoToast(false), 5000);
        }
        setLocalMessages(prev => prev.filter(m => m.id !== messageId));
        console.log('Message deletion in live mode - local only for now');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  }, [isDemoMode, demoMessages, localMessages]);

  const handleBatchDeleteMessages = useCallback(async (messageIds: string[]) => {
    try {
      // Find and store the messages for undo
      const messagesToDelete = messages.filter(m => messageIds.includes(m.id || ''));
      if (messagesToDelete.length > 0) {
        setDeletedMessages(prev => [
          ...prev,
          ...messagesToDelete.map(msg => ({ message: msg, timestamp: Date.now() }))
        ]);
        setShowUndoToast(true);

        // Auto-hide undo toast after 5 seconds
        setTimeout(() => setShowUndoToast(false), 5000);
      }

      // Remove messages from local state
      setMessages(prev => prev.filter(m => !messageIds.includes(m.id || '')));

      // TODO: If LangGraph supports batch message deletion, add server sync here
      // Example: await streamContext?.batchDeleteMessages?.(messageIds);

    } catch (error) {
      console.error('Failed to batch delete messages:', error);
      Alert.alert('Error', 'Failed to batch delete messages');
    }
  }, [messages, setMessages]);

  // Clean up old deleted messages (older than 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDeletedMessages(prev => prev.filter(item => now - item.timestamp < 30000));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleUndoDelete = useCallback(() => {
    const lastDeleted = deletedMessages[deletedMessages.length - 1];
    if (lastDeleted) {
      setMessages(prev => [...prev, lastDeleted.message].sort((a, b) => {
        // Sort by message creation time if available, otherwise by ID
        const aTime = (a as any).created_at || a.id || '';
        const bTime = (b as any).created_at || b.id || '';
        return aTime.localeCompare(bTime);
      }));
      setDeletedMessages(prev => prev.slice(0, -1));
      setShowUndoToast(false);
    }
  }, [deletedMessages, setMessages]);

  // Keyboard shortcuts for message management
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isMessageSelectionMode) {
        switch (event.key) {
          case 'Escape':
            // Exit selection mode
            break;
          case 'Delete':
          case 'Backspace':
            // Trigger batch delete if messages are selected
            break;
          case 'a':
          case 'A':
            if (event.ctrlKey || event.metaKey) {
              // Select all messages
              event.preventDefault();
            }
            break;
        }
      }
    };

    // Only add listener on web platforms
    if (Platform.OS === 'web') {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isMessageSelectionMode]);

  const isStreaming = (showDemo && isDemoMode) ? false : (streamContext?.isLoading ?? false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            {/* Threads Button */}
            {showThreadsPanel && (
              <TouchableOpacity
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: theme.primary + '10',
                }}
                onPress={() => setIsThreadsPanelVisible(true)}
              >
                <Text style={{
                  fontSize: 16,
                  color: theme.primary,
                  fontWeight: '600',
                }}>
                  ☰
                </Text>
              </TouchableOpacity>
            )}
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

          {/* User Profile Button */}
          {showUserProfile && authContext?.isAuthenticated && (
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: theme.primary + '30',
              }}
              onPress={onProfilePress}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: theme.primary,
              }}>
                {authContext.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <MessageList
          messages={messages}
          isLoading={isStreaming}
          theme={theme}
          showAIBubble={showAIBubble}
          showToolMessages={showToolMessages}
          onDeleteMessage={handleDeleteMessage}
          onBatchDeleteMessages={handleBatchDeleteMessages}
          showMessageActions={true}
          onSelectionModeChange={setIsMessageSelectionMode}
          triggerSelectionMode={triggerMessageSelection}
          ListHeaderComponent={
            (showDemo && messages.length === 0) ? (
              <StreamingDemo
                onAddMessage={addMessage}
                isStreaming={isStreaming}
                setIsStreaming={() => {}}
                showModeInfo={true}
                currentMode={isDemoMode ? 'demo' : 'live'}
                theme={theme}
              />
            ) : null
          }
        />
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          disabled={false}
          isStreaming={isStreaming}
          theme={theme}
          placeholder={
            isStreaming
              ? "AI is responding..."
              : (showDemo && isDemoMode)
                ? "Type a message (Demo mode)..."
                : "Type a message..."
          }
        />

        {/* Threads Panel */}
        {showThreadsPanel && (
          <ThreadsPanel
            visible={isThreadsPanelVisible}
            onClose={() => setIsThreadsPanelVisible(false)}
            theme={theme}
            currentThreadId={streamContext?.threadId}
            onSelectThread={handleSelectThread}
            onCreateThread={handleCreateNewThread}
            onDeleteThread={handleDeleteThread}
            onRenameThread={handleRenameThread}
            onBatchDeleteThreads={handleBatchDeleteThreads}
            client={streamContext?.client}
          />
        )}

        {/* Floating Message Management Button */}
        {messages.length > 0 && !isMessageSelectionMode && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 100,
              right: 16,
              backgroundColor: theme.primary,
              borderRadius: 28,
              width: 56,
              height: 56,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 8,
            }}
            onPress={() => {
              setTriggerMessageSelection(true);
              // Reset trigger after a brief moment
              setTimeout(() => setTriggerMessageSelection(false), 100);
            }}
          >
            <LucideIcon
              name="list-checks"
              size={24}
              color={theme.background}
            />
          </TouchableOpacity>
        )}

        {/* Undo Toast (for deleted messages) */}
        {showUndoToast && deletedMessages.length > 0 && (
          <View style={{
            position: 'absolute',
            bottom: 20,
            left: 16,
            right: 16,
            backgroundColor: theme.surface,
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 8,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <Text style={{ color: theme.text, flex: 1 }}>
              {deletedMessages.length === 1 ? 'Message deleted' : `${deletedMessages.length} messages deleted`}
            </Text>
            <TouchableOpacity
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: theme.primary,
                borderRadius: 6,
                marginLeft: 12,
              }}
              onPress={handleUndoDelete}
            >
              <Text style={{ color: theme.background, fontWeight: '600' }}>
                Undo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 4, marginLeft: 8 }}
              onPress={() => setShowUndoToast(false)}
            >
              <LucideIcon
                name="x"
                size={16}
                color={theme.placeholder}
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function ChatScreen({
  themeMode = 'system',
  theme: themeOverrides,
  showDemo = false,
  showAIBubble = false,
  showToolMessages = false,
  showThreadsPanel = false,
  showUserProfile = false,
  authContext,
  onThemeChange,
  onProfilePress,
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
    autoCreateThread: !showThreadsPanel, // Disable auto-creation when threads panel is enabled
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
  }  // If already in a theme context, use it directly
  if (existingThemeContext) {
    return (
      <StreamProvider config={streamConfig}>
        <ChatInterface
          showDemo={showDemo}
          showAIBubble={showAIBubble}
          showToolMessages={showToolMessages}
          showThreadsPanel={showThreadsPanel}
          showUserProfile={showUserProfile}
          authContext={authContext}
          onProfilePress={onProfilePress}
        />
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
        <ChatInterface
          showDemo={showDemo}
          showAIBubble={showAIBubble}
          showToolMessages={showToolMessages}
          showThreadsPanel={showThreadsPanel}
          showUserProfile={showUserProfile}
          authContext={authContext}
          onProfilePress={onProfilePress}
        />
      </StreamProvider>
    </ThemeProvider>
  );
}