# LangGraph Integration

This module provides seamless integration with LangGraph for AI-powered chat functionality. It handles authentication using Supabase sessions, streaming responses, and provides React components for easy integration.

## Features

- **Automatic Authentication**: Uses Supabase session tokens for LangGraph authentication
- **Streaming Support**: Handles incremental message streaming from LangGraph
- **React Hooks**: Easy-to-use hooks for LangGraph integration
- **UI Components**: Pre-built chat components with theming support
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **TypeScript Support**: Full TypeScript support with comprehensive types

## Quick Start

### 1. Environment Setup

Add these environment variables to your `.env` file:

```bash
EXPO_PUBLIC_LANGGRAPH_API_URL=https://your-langgraph-api-url
EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID=your-assistant-id
```

### 2. Basic Usage with Hook

```tsx
import React from 'react';
import { useLangGraphSimple } from 'langchat';

function MyChat() {
  const {
    isConnected,
    isStreaming,
    sendMessage,
    createThread
  } = useLangGraphSimple(
    (message) => console.log('AI:', message.content),
    (error) => console.error('Error:', error)
  );

  const handleSend = async () => {
    const threadId = await createThread();
    await sendMessage("Hello AI!", threadId);
  };

  return (
    <button onClick={handleSend} disabled={!isConnected || isStreaming}>
      Send Message
    </button>
  );
}
```

### 3. Using the SimpleChat Component

```tsx
import React from 'react';
import { SimpleChat } from 'langchat';

function App() {
  return (
    <SimpleChat
      placeholder="Type your message..."
      onMessageSent={(message) => console.log('Sent:', message)}
      onMessageReceived={(message) => console.log('Received:', message)}
    />
  );
}
```

### 4. Using the Demo Component

```tsx
import React from 'react';
import { LangGraphDemo } from 'langchat';

function App() {
  return (
    <LangGraphDemo
      title="My AI Assistant"
      subtitle="Chat with our AI powered by LangGraph"
    />
  );
}
```

## Token Refresh Support

The LangGraphClient now supports automatic token refresh when authentication tokens expire. This ensures uninterrupted service even during long-running sessions.

### Configuration with Token Refresh

```tsx
import { LangGraphClient } from './LangGraphClient';

// Define your token refresh function
async function refreshAccessToken(): Promise<string> {
  // Call your authentication service to get a new token
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: getStoredRefreshToken() })
  });
  const { accessToken } = await response.json();
  return accessToken;
}

// Create client with token refresh capability
const client = new LangGraphClient({
  apiUrl: 'your-deployment-url',
  assistantId: 'agent',
  accessToken: 'initial-access-token',
  onTokenRefresh: refreshAccessToken // Enable automatic token refresh
});
```

### Working Example Configuration

Based on a tested working example, here's the recommended configuration:

```tsx
// Create client with working configuration
const client = new LangGraphClient({
  apiUrl: 'https://zero.work/aria', // Your LangGraph API URL
  assistantId: 'chat', // Assistant ID (often "chat")
  accessToken: 'your-supabase-jwt-token',
  onTokenRefresh: refreshAccessToken // Enable automatic token refresh
});

// Streaming with proper event handling
const streamResponse = client.streamMessage(threadId, "Tell me a joke");

for await (const chunk of streamResponse) {
  if (chunk.event === "messages/partial") {
    // Handle partial message chunks
    for (const messageChunk of chunk.data) {
      if (messageChunk.content) {
        console.log("Chunk content:", messageChunk.content);
      }
    }
  } else {
    // Handle other events
    console.log("Other event:", chunk.event, chunk.data);
  }
}
```

### Stream Event Types

The client handles these stream events:
- `messages/partial` - Partial message content (most common for streaming text)
- Other events as defined by your LangGraph configuration

### Automatic Token Refresh Behavior

When a token expires during any operation, the client will:

1. **Detect token expiry** from HTTP 401/403 responses or authentication error messages
2. **Call the refresh callback** to obtain a new token
3. **Update the client** with the new token
4. **Retry the failed operation** automatically

This works for all client methods:
- `createThread()` - Thread creation with token refresh
- `getThread()` - Thread retrieval with token refresh
- `streamMessage()` - Message streaming with token refresh
- `getThreadMessages()` - Message history with token refresh

### Error Handling

If token refresh fails, the client will throw a descriptive error:

```tsx
try {
  const thread = await client.createThread();
} catch (error) {
  if (error.message.includes('Token refresh failed')) {
    // Handle token refresh failure
    // Redirect user to login or show error
  }
}
```

### Manual Token Updates

You can still manually update tokens when needed:

```tsx
// Update token manually
client.updateAccessToken('new-token-123');
```

### Backward Compatibility

The token refresh feature is optional. Existing code without `onTokenRefresh` will continue to work as before, but won't automatically handle token expiry.

## API Reference

### Hooks

#### `useLangGraphSimple(onMessage?, onError?)`

Simple hook for LangGraph integration with automatic configuration.

**Parameters:**
- `onMessage?: (message: ParsedMessage) => void` - Callback for received messages
- `onError?: (error: Error) => void` - Callback for errors

**Returns:**
- `isConnected: boolean` - Connection status
- `isStreaming: boolean` - Whether currently streaming
- `currentMessage: ParsedMessage | null` - Current streaming message
- `error: string | null` - Current error if any
- `threadId: string | null` - Current thread ID
- `connect: () => Promise<void>` - Manual connection
- `createThread: () => Promise<string>` - Create new thread
- `sendMessage: (message: string, threadId?: string) => Promise<void>` - Send message
- `cancelCurrentStream: () => Promise<void>` - Cancel current stream

#### `useLangGraph(config, onMessage?, onError?)`

Advanced hook with custom configuration.

**Parameters:**
- `config: LangGraphHookConfig` - Configuration object
- `onMessage?: (message: ParsedMessage) => void` - Callback for received messages
- `onError?: (error: Error) => void` - Callback for errors

### Components

#### `SimpleChat`

Pre-built chat interface with LangGraph integration.

**Props:**
- `placeholder?: string` - Input placeholder text
- `maxLength?: number` - Maximum message length
- `onMessageSent?: (message: string) => void` - Callback when user sends message
- `onMessageReceived?: (message: ParsedMessage) => void` - Callback when AI responds
- `onError?: (error: Error) => void` - Error callback

#### `LangGraphDemo`

Demo component showcasing LangGraph integration.

**Props:**
- `title?: string` - Demo title
- `subtitle?: string` - Demo subtitle

### Types

#### `ParsedMessage`

```typescript
interface ParsedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'human' | 'ai';
  content: string;
  isComplete: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

#### `LangGraphConfig`

```typescript
interface LangGraphConfig {
  apiUrl: string;
  assistantId: string;
  accessToken: string;
}
```

## Streaming Details

The LangGraph integration handles incremental streaming correctly:

- **Incremental Content**: Each chunk contains the full content up to that point, not just the delta
- **Message Reconstruction**: Messages are properly reconstructed from streaming chunks
- **Completion Detection**: Knows when messages are complete vs. still streaming
- **Error Recovery**: Handles stream interruptions and network issues

## Authentication

The integration automatically uses your Supabase session token:

1. User authenticates with Supabase
2. Session token is extracted from `session.access_token`
3. Token is passed to LangGraph for API authentication
4. Token is automatically refreshed when session updates

## Error Handling

Comprehensive error handling includes:

- **Connection Errors**: Network and API connection issues
- **Authentication Errors**: Invalid or expired tokens
- **Streaming Errors**: Stream interruption or parsing errors
- **Rate Limiting**: API rate limit handling
- **Retry Logic**: Automatic retry for transient errors

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_LANGGRAPH_API_URL` | LangGraph API endpoint | Yes |
| `EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID` | Assistant/agent ID | Yes |

## Examples

### Custom Message Handling

```tsx
import { useLangGraphSimple, ParsedMessage } from 'langchat';

function CustomChat() {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);

  const { sendMessage, createThread } = useLangGraphSimple(
    (message) => {
      setMessages(prev => {
        const existing = prev.findIndex(m => m.id === message.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = message;
          return updated;
        }
        return [...prev, message];
      });
    }
  );

  // Rest of component...
}
```

### Error Recovery

```tsx
function ChatWithErrorRecovery() {
  const { error, clearError, connect } = useLangGraphSimple();

  const handleRetry = async () => {
    clearError();
    await connect();
  };

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  // Rest of component...
}
```

## Troubleshooting

### Common Issues

1. **"No valid session found"**
   - Ensure user is authenticated with Supabase
   - Check that `session.access_token` is available

2. **"LangGraph health check failed"**
   - Verify `EXPO_PUBLIC_LANGGRAPH_API_URL` is correct
   - Check API endpoint is accessible
   - Verify authentication token has proper permissions

3. **Messages not streaming**
   - Check `streamMode: 'messages'` is supported by your LangGraph deployment
   - Verify assistant ID is correct
   - Check network connectivity

4. **TypeScript errors**
   - Ensure all peer dependencies are installed
   - Check TypeScript configuration
   - Verify React Native version compatibility
