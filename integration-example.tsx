import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  ChatScreen,
  AuthProvider,
  useAuth,
  ChatService,
  type LangGraphConfig,
} from './src';

// Use the ChatService types
type ChatThread = import('./src/data/ChatService').ChatThread;

// Complete integration example
export default function LangChatIntegrationExample() {
  return (
    <AuthProvider>
      <AuthenticatedChatExample />
    </AuthProvider>
  );
}

function AuthenticatedChatExample() {
  const { user, loading: authLoading } = useAuth();
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [chatService] = useState(() => new ChatService());

  // LangGraph configuration
  const langGraphConfig: LangGraphConfig = {
    apiUrl: process.env.LANGGRAPH_API_URL || "https://your-deployment-url",
    assistantId: process.env.LANGGRAPH_ASSISTANT_ID || "agent",
    defaultHeaders: {
      'Content-Type': 'application/json',
    },
  };

  // Load or create a thread when user is available
  useEffect(() => {
    if (user && !currentThread) {
      loadOrCreateThread();
    }
  }, [user]);

  const loadOrCreateThread = async () => {
    try {
      // Try to get the most recent thread
      const threads = await chatService.getThreads({ limit: 1 });

      if (threads.length > 0 && threads[0]) {
        setCurrentThread(threads[0]);
      }
      // If no threads, we'll create one when the first message is sent
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  const handleThreadCreated = async (threadId: string) => {
    try {
      // Create a new thread record in the database
      const title = "New Conversation";
      const dbThread = await chatService.createThread({
        title,
        thread_id: threadId,
        metadata: {
          source: 'mobile_app',
          created_by: 'user',
        },
      });

      setCurrentThread(dbThread);
      console.log('Thread created and saved:', dbThread.id);
    } catch (error) {
      console.error('Error saving thread:', error);
      Alert.alert('Error', 'Failed to save conversation thread');
    }
  };

  const handleError = (error: string) => {
    console.error('Chat error:', error);
    Alert.alert('Chat Error', error);
  };

  const handleNewConversation = async () => {
    setCurrentThread(null);
    // The next message will trigger creation of a new thread
  };

  // Show authentication screens if not authenticated
  if (authLoading || !user) {
    return (
      <View style={styles.container}>
        {/* You can show auth screens here or a loading indicator */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChatScreen
        config={langGraphConfig}
        threadId={currentThread?.thread_id}
        reconnectOnMount={true}
        placeholder="Ask me anything..."
        onThreadCreated={handleThreadCreated}
        onError={handleError}
        renderHeader={() => (
          <ChatHeader
            thread={currentThread}
            onNewConversation={handleNewConversation}
          />
        )}
        style={{
          container: styles.chatContainer,
          input: styles.input,
          sendButton: styles.sendButton,
        }}
      />
    </View>
  );
}

// Custom header component
function ChatHeader({
  thread,
  onNewConversation
}: {
  thread: ChatThread | null;
  onNewConversation: () => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {thread?.title || 'New Conversation'}
      </Text>
      <TouchableOpacity
        onPress={onNewConversation}
        style={styles.newChatButton}
      >
        <Text style={styles.newChatButtonText}>New Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  newChatButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
  },
});
