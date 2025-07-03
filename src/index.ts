// Main entry point for the react-native-ai-chat package
export { ChatScreen } from './screens/ChatScreen';

// Types
export type {
  User,
  Thread,
  Message,
  Attachment,
  ChatConfig,
  Theme,
  ChatScreenProps,
  MessageInputProps,
  MessageListProps,
  ThreadListProps
} from './types';

// Components
export { MessageList } from './components/chat/MessageList';
export { MessageInput } from './components/chat/MessageInput';
export { ThreadList } from './components/chat/ThreadList';
export { MessageBubble } from './components/chat/MessageBubble';
export { ImageCarousel } from './components/chat/ImageCarousel';
export { FileUpload } from './components/chat/FileUpload';
export { MarkdownRenderer } from './components/common/MarkdownRenderer';
export { LoadingSpinner } from './components/common/LoadingSpinner';
export { ErrorBoundary } from './components/common/ErrorBoundary';

// Hooks
export { useChatMessages, useThreads, useAuth } from './hooks';

// Theming
export { useAppTheme } from './theming/useAppTheme';
export { defaultThemes } from './theming/themes';
export type { ThemeMode } from './theming/themes';

// Services
export { AuthService } from './data/AuthService';
export { ChatService } from './data/ChatService';
export { FileService } from './data/FileService';
export { LangGraphClient } from './ai/LangGraphClient';
export { StreamParser } from './ai/StreamParser';

// Utils
export * from './utils';

// Initialize function for easy setup
export { initializeSupabase } from './data/supabase';
