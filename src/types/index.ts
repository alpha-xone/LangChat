// Core types for the chat package

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Thread {
  id: string;
  userId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  tags: string[];
}

export interface Message {
  id: string;
  threadId: string;
  userId?: string;
  senderId?: string;
  senderName?: string;
  type: 'user' | 'human' | 'ai' | 'system' | 'tool' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyToId?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
}

export interface ChatConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  langGraphApiUrl: string;
  langGraphApiKey?: string;
}

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
    fontWeight: {
      light: string;
      regular: string;
      medium: string;
      bold: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

export interface ChatScreenProps {
  config: ChatConfig;
  theme?: Theme;
  onAuthStateChange?: (user: User | null) => void;
  onError?: (error: Error) => void;
}

export interface MessageInputProps {
  onSendMessage: (message: string, attachments?: Attachment[], metadata?: Record<string, any>) => void;
  onFileUpload?: (files: File[]) => Promise<Attachment[]>;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  allowFileUpload?: boolean;
  allowVoiceInput?: boolean;
  showTypingIndicator?: boolean;
  onTyping?: (threadId?: string) => void;
  onStopTyping?: (threadId?: string) => void;
  threadId?: string;
  replyToMessage?: Message;
  onCancelReply?: () => void;
  draftMessage?: string;
  onDraftChange?: (message: string) => void;
  multiline?: boolean;
  sendOnEnter?: boolean;
  enableMentions?: boolean;
  mentionableUsers?: User[];
  onMentionSelect?: (user: string) => void;
  enableCommands?: boolean;
  commands?: Array<{ name: string; description: string }>;
  onCommandSelect?: (command: string) => void;
  enableAI?: boolean;
  onAIPrompt?: (prompt: string) => void;
  aiSuggestions?: string[];
}

export interface MessageListProps {
  messages: Message[];
  onMessagePress?: (message: Message) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  onMessageLongPress?: (message: Message) => void;
  onMessageSelect?: (message: Message) => void;
  selectedMessageIds?: string[];
  currentUserId?: string;
  enableGrouping?: boolean;
  showTypingIndicator?: boolean;
  typingUsers?: string[];
  onRetryMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  enablePullToRefresh?: boolean;
  inverted?: boolean;
  messageSpacing?: number;
  groupTimeThreshold?: number;
}

export interface ThreadListProps {
  threads: Thread[];
  onThreadSelect: (thread: Thread) => void;
  onThreadDelete?: (threadId: string) => void;
  onThreadFavorite?: (threadId: string, isFavorite: boolean) => void;
}

export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onRetry?: () => void;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showSenderName?: boolean;
  maxWidth?: number;
}

// Additional types for useChat hook
export interface ChatSession {
  id: string;
  title?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface SendMessageOptions {
  assistantId?: string;
  metadata?: Record<string, any>;
  signal?: AbortSignal;
  sessionId?: string;
  threadId?: string;
  attachments?: Attachment[];
}

export interface StreamingResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta?: {
      content?: string;
      role?: string;
    };
    message?: {
      content: string;
      role: string;
    };
    finish_reason?: string;
  }>;
}
