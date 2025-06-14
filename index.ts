// Chat Components
export { ChatInput } from './components/chat/ChatInput';
export { MessageList } from './components/chat/MessageList';

// Message Components
export { AIMessage } from './components/messages/AIMessage';
export { HumanMessage } from './components/messages/HumanMessage';

// Demo Components
export { StreamingDemo } from './components/demo/StreamingDemo';

// UI Components
export { Toast } from './components/ui/Toast';

// Utilities
export * from './lib/config';
export * from './lib/message-utils';
export * from './lib/stream-context';

// Theme
export { ThemeProvider, useTheme } from './theme/ThemeContext';
export * from './theme/themes';

// Hooks
export { useChatConfig } from './hooks/useChatConfig';
export { useStreamContext } from './hooks/useStreamContext';

// Types
export type { Config } from './types/config';
export type { Message } from './types/message';
