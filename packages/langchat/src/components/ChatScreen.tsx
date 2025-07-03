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
import { useChat } from '../contexts/ChatContext';
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

  // Use ChatContext for message management when not in demo mode
  const {
    messages: chatContextMessages,
    loadMessages,
    currentThread,
    selectThread,
    deleteThread,
    renameThread,
    createThread,
    sendMessage
  } = useChat();

  // Keep local state for both demo and live messages
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [demoMessages, setDemoMessages] = useState<Message[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(showDemo);
  const [isThreadsPanelVisible, setIsThreadsPanelVisible] = useState(false);
  const messagesRef = useRef<Message[]>([]);

  // Use appropriate messages based on mode
  const messages: Message[] = isDemoMode ? demoMessages :
    (currentThread ? chatContextMessages.map(msg => {
      // Ensure proper type mapping for message display
      let messageType: 'human' | 'ai' | 'tool' | 'remove';

      // Handle both database roles and potential Message type roles
      const role = msg.role as string;

      if (role === 'user' || role === 'human') {
        messageType = 'human';
      } else if (role === 'assistant' || role === 'ai') {
        messageType = 'ai';
      } else if (role === 'system') {
        messageType = 'ai'; // Show system messages as AI messages
      } else {
        messageType = 'ai'; // Default to AI for unknown roles
      }

      return {
        id: msg.id,
        content: msg.content,
        type: messageType,
        created_at: msg.created_at,
        metadata: msg.metadata || {},
      } as Message;
    }) : localMessages);

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

  // Process streaming chunks from LangGraph (for demo mode only)
  const processStreamingChunk = useCallback((chunkData: any) => {
    if (!isDemoMode) return; // Only use for demo mode

    try {
      const { messageChunk, metadata } = processStreamChunk(chunkData);

      if (messageChunk) {
        setDemoMessages(prev => {
          const updatedMessages = mergeStreamingMessage(prev, messageChunk, metadata);
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error('Error processing streaming chunk:', error);
    }
  }, [isDemoMode]);

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

  // Enhanced message sending flow
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      if (isDemoMode) {
        // Demo mode - local only
        await handleDemoMessage(text);
      } else {
        // Live mode - Supabase + LangGraph coordination

        // 1. Save user message to Supabase via ChatContext
        if (currentThread) {
          await sendMessage(text); // This saves to Supabase and calls LangGraph
        } else {
          // Create thread first if none exists
          const newThread = await createThread();
          if (newThread) {
            await sendMessage(text);
          }
        }

        // 2. LangGraph processes and streams response
        // 3. AI response gets saved to Supabase via ChatContext
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  }, [isDemoMode, currentThread, sendMessage, createThread, handleDemoMessage]);

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
      setIsDemoMode(prev => {
        const newMode = !prev;
        if (newMode) {
          setLocalMessages([]);
        } else {
          setDemoMessages([]);
        }
        return newMode;
      });
      chunkQueueRef.current = [];
    }
  }, [showDemo]);

  // Thread management handlers - Updated to use ChatContext methods
  const handleSelectThread = useCallback(async (threadId: string) => {
    try {
      // Use ChatContext's selectThread method which handles both switching and loading messages
      await selectThread(threadId);

      // Sync with LangGraph if needed
      if (streamContext?.switchToThread) {
        await streamContext.switchToThread(threadId);
      }

      console.log('Thread selected and messages loaded from Supabase:', threadId);
    } catch (error) {
      console.error('Failed to select thread:', error);
      Alert.alert('Error', 'Failed to switch to thread');
    }
  }, [selectThread, streamContext]);

  const handleCreateNewThread = useCallback(async () => {
    try {
      // Use ChatContext's createThread method which creates in Supabase
      const newThread = await createThread('New Chat');

      if (newThread) {
        // Optionally sync with LangGraph
        if (streamContext?.createNewThread) {
          await streamContext.createNewThread();
        }
        console.log('New thread created in Supabase:', newThread.id);
      }
    } catch (error) {
      console.error('Failed to create new thread:', error);
      Alert.alert('Error', 'Failed to create new thread');
    }
  }, [createThread, streamContext]);

  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      // Use ChatContext's deleteThread method which deletes from Supabase
      await deleteThread(threadId);

      // Optionally sync with LangGraph
      if (streamContext?.deleteThread) {
        await streamContext.deleteThread(threadId);
      }

      console.log('Thread deleted from Supabase:', threadId);
    } catch (error) {
      console.error('Failed to delete thread:', error);
      Alert.alert('Error', 'Failed to delete thread');
    }
  }, [deleteThread, streamContext]);

  const handleRenameThread = useCallback(async (threadId: string, newTitle: string) => {
    try {
      // Use ChatContext's renameThread method which updates in Supabase
      await renameThread(threadId, newTitle);

      // Optionally sync with LangGraph
      if (streamContext?.renameThread) {
        await streamContext.renameThread(threadId, newTitle);
      }

      console.log('Thread renamed in Supabase:', threadId, newTitle);
    } catch (error) {
      console.error('Failed to rename thread:', error);
      Alert.alert('Error', 'Failed to rename thread');
    }
  }, [renameThread, streamContext]);

  const handleBatchDeleteThreads = useCallback(async (threadIds: string[]) => {
    try {
      // Delete threads one by one using ChatContext
      for (const threadId of threadIds) {
        await deleteThread(threadId);
      }

      // Optionally sync with LangGraph
      if (streamContext?.batchDeleteThreads) {
        await streamContext.batchDeleteThreads(threadIds);
      }

      console.log('Batch deleted threads from Supabase:', threadIds);
    } catch (error) {
      console.error('Failed to batch delete threads:', error);
      Alert.alert('Error', 'Failed to batch delete threads');
    }
  }, [deleteThread, streamContext]);
  // Message deletion handlers
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      if (isDemoMode) {
        // For demo mode, remove from local state
        const messageToDelete = demoMessages.find(m => m.id === messageId);
        if (messageToDelete) {
          setDeletedMessages(prev => [...prev, { message: messageToDelete, timestamp: Date.now() }]);
          setShowUndoToast(true);
          setTimeout(() => setShowUndoToast(false), 5000);
        }
        setDemoMessages(prev => prev.filter(m => m.id !== messageId));
      } else {
        // For live mode, use ChatContext to delete from Supabase
        const messageToDelete = messages.find(m => m.id === messageId);
        if (messageToDelete) {
          // Convert back to Message type for consistency
          const msgAsMessage: Message = messageToDelete as any;
          setDeletedMessages(prev => [...prev, { message: msgAsMessage, timestamp: Date.now() }]);
          setShowUndoToast(true);
          setTimeout(() => setShowUndoToast(false), 5000);
        }

        // Use ChatContext's deleteMessage method
        const { deleteMessage: deleteMessageFromSupabase } = useChat();
        await deleteMessageFromSupabase(messageId);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  }, [messages, demoMessages, isDemoMode]);

  const handleBatchDeleteMessages = useCallback(async (messageIds: string[]) => {
    try {
      if (isDemoMode) {
        // For demo mode, remove from local state
        const messagesToDelete = demoMessages.filter(m => messageIds.includes(m.id || ''));
        if (messagesToDelete.length > 0) {
          setDeletedMessages(prev => [
            ...prev,
            ...messagesToDelete.map(msg => ({ message: msg, timestamp: Date.now() }))
          ]);
          setShowUndoToast(true);
          setTimeout(() => setShowUndoToast(false), 5000);
        }
        setDemoMessages(prev => prev.filter(m => !messageIds.includes(m.id || '')));
      } else {
        // For live mode, use ChatContext to delete from Supabase
        const messagesToDelete = messages.filter(m => messageIds.includes(m.id || ''));
        if (messagesToDelete.length > 0) {
          const msgsAsMessages: Message[] = messagesToDelete as any;
          setDeletedMessages(prev => [
            ...prev,
            ...msgsAsMessages.map(msg => ({ message: msg, timestamp: Date.now() }))
          ]);
          setShowUndoToast(true);
          setTimeout(() => setShowUndoToast(false), 5000);
        }

        // Use ChatContext's deleteMessage method for each message
        const { deleteMessage: deleteMessageFromSupabase } = useChat();
        for (const messageId of messageIds) {
          await deleteMessageFromSupabase(messageId);
        }
      }
    } catch (error) {
      console.error('Failed to batch delete messages:', error);
      Alert.alert('Error', 'Failed to batch delete messages');
    }
  }, [messages, demoMessages, isDemoMode]);

  // Undo functionality for deleted messages
  const [deletedMessages, setDeletedMessages] = useState<{message: Message, timestamp: number}[]>([]);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Clean up old deleted messages (older than 30 seconds)
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDeletedMessages(prev => prev.filter(item => now - item.timestamp < 30000));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleUndoDelete = useCallback(() => {
    const lastDeleted = deletedMessages[deletedMessages.length - 1];
    if (lastDeleted) {
      if (isDemoMode) {
        setDemoMessages(prev => [...prev, lastDeleted.message].sort((a, b) => {
          const aTime = (a as any).created_at || a.id || '';
          const bTime = (b as any).created_at || b.id || '';
          return aTime.localeCompare(bTime);
        }));
      } else {
        setLocalMessages(prev => [...prev, lastDeleted.message].sort((a, b) => {
          const aTime = (a as any).created_at || a.id || '';
          const bTime = (b as any).created_at || b.id || '';
          return aTime.localeCompare(bTime);
        }));
      }
      setDeletedMessages(prev => prev.slice(0, -1));
      setShowUndoToast(false);
    }
  }, [deletedMessages, isDemoMode]);

  // Message selection mode state
  const [triggerMessageSelection, setTriggerMessageSelection] = useState(false);
  const [isMessageSelectionMode, setIsMessageSelectionMode] = useState(false);

  // Keyboard shortcuts for message management
  React.useEffect(() => {
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