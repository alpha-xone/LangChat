
export interface MessageContent {
  text: string;
  timestamp: Date;
  id: string;
}

export interface ChatMessage extends MessageContent {
  type: 'human' | 'ai' | 'system';
  isStreaming?: boolean;
  metadata?: Record<string, any>;
}

export interface StreamingMessage extends ChatMessage {
  isStreaming: true;
  partial?: boolean;
}

// Re-export LangChain types for convenience
export type { BaseMessage } from '@langchain/core/messages';
