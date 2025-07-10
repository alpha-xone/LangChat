import { Message } from '@langchain/langgraph-sdk';

export interface StreamChunk {
  event: string;
  data: [any, any]; // [messageChunk, metadata]
}

export interface MessageMetadata {
  langgraph_node?: string;
  [key: string]: any;
}

export function processStreamChunk(chunkData: [any, any]) {
  const [messageChunk, metadata] = chunkData;

  return {
    messageChunk,
    metadata: metadata as MessageMetadata,
  };
}

// Update incremental message - handles the fact that each message contains all previous content plus new content
export function updateIncrementalMessage(
  messages: Message[],
  newChunk: any,
  metadata: MessageMetadata
): Message[] {
  const chunkId = newChunk.id;
  const chunkType = newChunk.type || 'ai';
  const chunkContent = newChunk.content || '';

  // Skip if no content
  if (!chunkContent) {
    return messages;
  }

  // Find existing message with same ID
  const existingIndex = messages.findIndex(msg => msg.id === chunkId);

  if (existingIndex >= 0) {
    // Update existing message with new incremental content
    const updatedMessages = [...messages];
    updatedMessages[existingIndex] = {
      ...updatedMessages[existingIndex],
      content: chunkContent, // Replace with full content (incremental)
      additional_kwargs: {
        ...updatedMessages[existingIndex].additional_kwargs,
        ...metadata,
        lastUpdated: Date.now(),
      },
    };
    return updatedMessages;
  } else {
    // Create new message
    const newMessage: Message = {
      id: chunkId,
      type: chunkType,
      content: chunkContent,
      additional_kwargs: {
        ...metadata,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
    };

    return [...messages, newMessage];
  }
}

// Keep the legacy mergeStreamingMessage for backward compatibility
export function mergeStreamingMessage(
  messages: Message[],
  messageChunk: any,
  metadata?: any
): Message[] {
  return updateIncrementalMessage(messages, messageChunk, metadata);
}
