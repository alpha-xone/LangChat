import { ChatConfig, ChatMessage } from './index';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

export interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onRetry?: (messageId: string) => void;
}

export interface ChatContextValue {
  messages: ChatMessage[];
  config: ChatConfig;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export interface StreamContextValue {
  isStreaming: boolean;
  streamingMessageId?: string;
  startStreaming: (messageId: string) => void;
  stopStreaming: () => void;
}