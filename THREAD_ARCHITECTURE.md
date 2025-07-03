# Thread Management Architecture

## Overview

The LangChat application now uses a dual-source thread management architecture that combines **Supabase as the primary data store** with **LangGraph for real-time AI processing**.

## Architecture Components

### 1. **Supabase as Primary Data Store**
- **Location**: `packages/langchat/src/contexts/ChatContext.tsx`
- **Purpose**: Persistent storage for threads and messages
- **Features**:
  - Thread CRUD operations (create, read, update, delete)
  - Message persistence and history
  - User authentication and data isolation
  - Message purging capabilities

### 2. **LangGraph for AI Processing**
- **Location**: `packages/langchat/src/context/Stream.tsx`
- **Purpose**: Real-time AI interactions and streaming
- **Features**:
  - Streaming responses
  - AI model integration
  - Real-time message processing

### 3. **Supabase Edge Function**
- **Location**: `supabase/functions/chat-with-ai/index.ts`
- **Purpose**: Secure bridge between Supabase and LangGraph
- **Features**:
  - User authentication
  - Thread ownership verification
  - LangGraph API calls
  - Error handling with fallback messages

## Data Flow

### Message Sending Flow
1. **User Input**: User types a message in the chat interface
2. **Thread Check**: System ensures a thread exists (creates one if needed)
3. **Save to Supabase**: User message saved to `chat_messages` table via ChatContext
4. **AI Processing**: Supabase Edge Function calls LangGraph API
5. **AI Response**: LangGraph processes and returns AI response
6. **Save Response**: AI message saved to Supabase via Edge Function
7. **UI Update**: ChatContext updates local state and UI reflects new messages

### Thread Management Flow
1. **Primary Operations**: All thread operations go through ChatContext (Supabase)
2. **Optional Sync**: LangGraph operations are called as secondary sync (optional)
3. **UI Updates**: ThreadsPanel uses ChatContext data as source of truth

## Key Components Updated

### ChatContext (`packages/langchat/src/contexts/ChatContext.tsx`)
- **New Methods**:
  - `createThread()`: Creates thread in Supabase
  - `selectThread()`: Switches thread and loads messages
  - `deleteThread()`: Deletes thread and associated messages
  - `renameThread()`: Updates thread title
  - `sendMessage()`: Saves user message and triggers AI response
  - `loadMessages()`: Loads thread message history

### ThreadsPanel (`packages/langchat/src/components/common/ThreadsPanel.tsx`)
- **Updated to use ChatContext as primary data source**
- **Features**:
  - Automatic thread loading from Supabase
  - Thread selection via ChatContext methods
  - Thread management (create, delete, rename) via ChatContext
  - Fallback support for legacy LangGraph props

### ChatScreen (`packages/langchat/src/components/ChatScreen.tsx`)
- **Enhanced message flow coordination**
- **Features**:
  - Integrated ChatContext for message management
  - Dual mode support (demo vs live)
  - Thread coordination between Supabase and LangGraph
  - Message type conversion for compatibility

## Message Persistence & Purging

### Current Setup
- All messages stored in Supabase `chat_messages` table
- Messages linked to threads via foreign keys
- User isolation via `user_id` field

### Purging Strategy
```sql
-- Auto-purge messages older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_messages
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup (using pg_cron extension)
SELECT cron.schedule('cleanup-old-messages', '0 2 * * *', 'SELECT cleanup_old_messages();');
```

## Benefits of This Architecture

1. **Data Persistence**: All conversations safely stored in Supabase
2. **Real-time Processing**: LangGraph handles streaming and AI interactions
3. **Scalability**: Clear separation of concerns between storage and processing
4. **Security**: Sensitive operations go through authenticated Supabase Edge Functions
5. **Flexibility**: Can work with Supabase-only or add LangGraph for enhanced features
6. **Message Retention**: Easy to implement and customize retention policies

## Environment Variables Required

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# LangGraph Configuration (for AI processing)
EXPO_PUBLIC_LANGGRAPH_API_URL=your_langgraph_api_url
EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID=your_assistant_id
EXPO_PUBLIC_LANGGRAPH_API_KEY=your_langgraph_api_key

# For Supabase Edge Function
LANGGRAPH_API_URL=your_langgraph_api_url
LANGGRAPH_ASSISTANT_ID=your_assistant_id
LANGGRAPH_API_KEY=your_langgraph_api_key
```

## Usage Example

```tsx
// In your app
import { ChatProvider, ChatScreen, createDefaultSupabaseClient } from '@/packages/langchat/src';

const supabase = createDefaultSupabaseClient();

export default function ChatPage() {
  return (
    <ChatProvider supabaseClient={supabase}>
      <ChatScreen
        showThreadsPanel={true}
        config={{
          apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL,
          assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID,
          apiKey: process.env.EXPO_PUBLIC_LANGGRAPH_API_KEY,
        }}
      />
    </ChatProvider>
  );
}
```

## Migration Notes

- **Backward Compatibility**: All existing LangGraph functionality is preserved
- **Gradual Migration**: Can be adopted incrementally
- **Data Safety**: No existing data loss during transition
- **API Compatibility**: Existing ChatScreen props continue to work

This architecture provides a robust foundation for chat applications that need both persistent storage and real-time AI capabilities.
