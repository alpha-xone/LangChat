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
  type: 'user' | 'human' | 'ai' | 'system' | 'tool' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
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
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  onFileUpload?: (files: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface MessageListProps {
  messages: Message[];
  onMessagePress?: (message: Message) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export interface ThreadListProps {
  threads: Thread[];
  onThreadSelect: (thread: Thread) => void;
  onThreadDelete?: (threadId: string) => void;
  onThreadFavorite?: (threadId: string, isFavorite: boolean) => void;
}
