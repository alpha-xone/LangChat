# LangGraph Integration Module

This module provides a complete integration with LangGraph for AI-powered chat functionality in React Native applications. It follows the package design specifications and provides a clean, layered architecture.

## Architecture

The LangGraph module consists of three main layers:

### 1. AI Integration Layer (`src/ai/`)
- **LangGraphClient**: Core client for communicating with LangGraph API
- **StreamParser**: Handles streaming response parsing and message reconstruction
- **useLangGraph**: React hook that provides a clean interface for components

### 2. Data Layer Integration (`src/data/ChatService.ts`)
- **ChatService**: Manages persistence of chat threads and messages in Supabase
- **Real-time subscriptions**: Live updates across multiple clients
- **Thread management**: Create, update, delete, and organize conversations

### 3. UI Layer (`src/components/chat/`)
- **ChatScreen**: Main chat interface component
- **MessageBubble**: Individual message display component

## Quick Start

### 1. Basic Usage

```tsx
import React from 'react';
import { ChatScreen, type LangGraphConfig } from '@alpha.xone/langchat';

export default function MyApp() {
  const config: LangGraphConfig = {
    apiUrl: "https://your-langgraph-deployment.com",
    assistantId: "your-assistant-id",
  };

  return (
    <ChatScreen
      config={config}
      placeholder="Ask me anything..."
      reconnectOnMount={true}
    />
  );
}
```

### 2. With Authentication

```tsx
import React from 'react';
import {
  ChatScreen,
  AuthProvider,
  useAuth,
  type LangGraphConfig
} from '@alpha.xone/langchat';

function AuthenticatedChat() {
  const { user } = useAuth();

  if (!user) return <LoginScreen />;

  const config: LangGraphConfig = {
    apiUrl: process.env.LANGGRAPH_API_URL,
    assistantId: process.env.LANGGRAPH_ASSISTANT_ID,
  };

  return (
    <ChatScreen
      config={config}
      onThreadCreated={(threadId) => {
        console.log('New conversation started:', threadId);
      }}
      onError={(error) => {
        console.error('Chat error:', error);
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedChat />
    </AuthProvider>
  );
}
```

### 3. Advanced Usage with Thread Management

```tsx
import React, { useState, useEffect } from 'react';
import {
  ChatScreen,
  ChatService,
  type LangGraphConfig,
  type ChatThread
} from '@alpha.xone/langchat';

export default function AdvancedChat() {
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [chatService] = useState(() => new ChatService());

  const config: LangGraphConfig = {
    apiUrl: "https://your-langgraph-deployment.com",
    assistantId: "your-assistant-id",
  };

  const handleThreadCreated = async (threadId: string) => {
    const dbThread = await chatService.createThread({
      title: "New Conversation",
      thread_id: threadId,
      metadata: { source: 'mobile_app' },
    });
    setCurrentThread(dbThread);
  };

  return (
    <ChatScreen
      config={config}
      threadId={currentThread?.thread_id}
      onThreadCreated={handleThreadCreated}
      renderHeader={() => (
        <ChatHeader thread={currentThread} />
      )}
    />
  );
}
```

## API Reference

### LangGraphConfig

```typescript
interface LangGraphConfig {
  apiUrl: string;                    // LangGraph API endpoint
  assistantId: string;               // Assistant/agent ID
  defaultHeaders?: Record<string, string>; // Additional headers
}
```

### ChatScreen Props

```typescript
interface ChatScreenProps {
  config: LangGraphConfig;           // Required: LangGraph configuration
  threadId?: string;                 // Optional: Continue existing conversation
  reconnectOnMount?: boolean;        // Default: true
  placeholder?: string;              // Input placeholder text
  renderHeader?: () => React.ReactNode;
  renderMessage?: (message: ParsedMessage, index: number) => React.ReactNode;
  onThreadCreated?: (threadId: string) => void;
  onError?: (error: string) => void;
  style?: {                          // Custom styling
    container?: object;
    messagesList?: object;
    inputContainer?: object;
    input?: object;
    sendButton?: object;
    sendButtonText?: object;
  };
}
```

### useLangGraph Hook

```typescript
const {
  messages,           // Array of parsed messages
  isLoading,          // Boolean: AI is responding
  error,              // String: Current error state
  threadId,           // String: Current thread ID
  currentMessage,     // ParsedMessage: Message being streamed
  sendMessage,        // Function: Send a new message
  stop,               // Function: Stop current AI response
  clearMessages,      // Function: Clear local message history
  reconnect,          // Function: Reconnect to thread
  createNewThread,    // Function: Start new conversation
} = useLangGraph({
  config: langGraphConfig,
  threadId: optionalThreadId,
  reconnectOnMount: true,
});
```

### ChatService Methods

```typescript
const chatService = new ChatService();

// Thread management
await chatService.createThread(data);
await chatService.getThreads(options);
await chatService.getThread(id);
await chatService.updateThread(id, data);
await chatService.deleteThread(id);

// Message management
await chatService.saveMessage(threadId, message);
await chatService.getMessages(threadId, options);
await chatService.updateMessage(messageId, updates);

// Real-time subscriptions
const channel = chatService.subscribeToThread(threadId, callback);
await chatService.unsubscribe(channel);
```

## Configuration

### Environment Variables

```env
LANGGRAPH_API_URL=https://your-langgraph-deployment.com
LANGGRAPH_ASSISTANT_ID=your-assistant-id
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### LangGraph Backend Setup

Your LangGraph backend should:

1. Accept Supabase JWT tokens in the Authorization header
2. Validate tokens using your Supabase JWT secret
3. Extract user.uid from validated tokens for user context
4. Save messages to your Supabase database during processing

Example backend validation:
```python
import jwt
from supabase import create_client

def validate_supabase_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"]
        )
        return payload
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

# In your LangGraph agent:
def process_message(token: str, message: dict):
    user_data = validate_supabase_token(token)
    user_id = user_data["sub"]  # User ID

    # Process message with user context
    # Save to Supabase during processing
```

## Database Schema

The module expects these Supabase tables:

```sql
-- Chat threads
CREATE TABLE chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  thread_id TEXT NOT NULL UNIQUE, -- LangGraph thread ID
  metadata JSONB DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL UNIQUE, -- LangGraph message ID
  type TEXT NOT NULL CHECK (type IN ('human', 'ai', 'system', 'assistant', 'tool')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_complete BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_threads_user_id ON chat_threads(user_id);
CREATE INDEX idx_chat_threads_updated_at ON chat_threads(updated_at DESC);
CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

## Features

- ✅ **Real-time streaming**: Live AI responses with proper parsing
- ✅ **Authentication integration**: Seamless Supabase auth
- ✅ **Persistent conversations**: Save and resume chat threads
- ✅ **Real-time sync**: Multi-device conversation sync
- ✅ **Error handling**: Comprehensive error management
- ✅ **Customizable UI**: Theme support and custom components
- ✅ **TypeScript support**: Full type safety
- ✅ **Thread management**: Create, update, delete conversations
- ✅ **Message history**: Load previous conversations
- ✅ **Stop generation**: Cancel AI responses mid-stream

## Troubleshooting

### Common Issues

1. **"Client not initialized" error**
   - Ensure LangGraphConfig is properly set
   - Check that API URL is accessible

2. **Authentication errors**
   - Verify Supabase configuration
   - Ensure user is signed in before using chat

3. **Streaming not working**
   - Check network connectivity
   - Verify LangGraph backend supports streaming
   - Ensure proper CORS settings

4. **Messages not persisting**
   - Check Supabase database schema
   - Verify user permissions and RLS policies

### Debug Mode

Enable debug logging:
```typescript
// Add to your app's initialization
if (__DEV__) {
  console.log('LangGraph Debug Mode Enabled');
}
```

## Contributing

See the main package README for contribution guidelines.

## License

MIT - See LICENSE file for details.
