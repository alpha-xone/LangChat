import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Message, Thread, User, Attachment } from '../types';
import { ChatService } from '../data/ChatService';
import { AuthService } from '../data/AuthService';
import { FileService } from '../data/FileService';
import { LangGraphClient } from '../ai/LangGraphClient';

// Chat Messages Hook
export const useChatMessages = (threadId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const chatService = useMemo(() => new ChatService(), []);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadMessages = useCallback(async (id: string, options?: { limit?: number; offset?: number }) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const msgs = await chatService.getMessages(id, options);
      if (options?.offset) {
        setMessages(prev => [...prev, ...msgs]);
      } else {
        setMessages(msgs);
      }
      setHasMore(msgs.length === (options?.limit || 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [chatService]);

  const loadMoreMessages = useCallback(() => {
    if (threadId && hasMore && !loading) {
      loadMessages(threadId, { limit: 50, offset: messages.length });
    }
  }, [threadId, hasMore, loading, messages.length, loadMessages]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, [chatService]);

  const subscribeToMessages = useCallback((id: string) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = chatService.subscribeToMessages(id, (message) => {
      addMessage(message);
    });
    setIsSubscribed(true);
  }, [chatService, addMessage]);

  const unsubscribeFromMessages = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsSubscribed(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    if (!threadId) throw new Error('No thread ID provided');

    try {
      const message = await chatService.createMessage({
        threadId,
        type: 'user',
        content,
        attachments,
      });
      return message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [threadId, chatService]);

  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
      subscribeToMessages(threadId);
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [threadId, loadMessages, subscribeToMessages, unsubscribeFromMessages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    isSubscribed,
    addMessage,
    updateMessage,
    deleteMessage,
    sendMessage,
    loadMoreMessages,
    refetch: () => threadId && loadMessages(threadId),
    subscribe: subscribeToMessages,
    unsubscribe: unsubscribeFromMessages,
  };
};

// Threads Hook
export const useThreads = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);

  const chatService = useMemo(() => new ChatService(), []);
  const authService = useMemo(() => new AuthService(), []);

  const loadThreads = useCallback(async (options?: {
    limit?: number;
    favoriteOnly?: boolean;
    tags?: string[]
  }) => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userThreads = await chatService.getThreads(user.id, options);
      setThreads(userThreads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  }, [chatService, authService]);

  const createThread = useCallback(async (title?: string, tags?: string[]) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newThread = await chatService.createThread({
        userId: user.id,
        title,
        isFavorite: false,
        tags: tags || [],
      });
      setThreads(prev => [newThread, ...prev]);
      return newThread;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thread');
      throw err;
    }
  }, [chatService, authService]);

  const updateThread = useCallback(async (threadId: string, updates: Partial<Thread>) => {
    try {
      const updatedThread = await chatService.updateThread(threadId, updates);
      setThreads(prev =>
        prev.map(thread =>
          thread.id === threadId ? updatedThread : thread
        )
      );
      return updatedThread;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thread');
      throw err;
    }
  }, [chatService]);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      await chatService.deleteThread(threadId);
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete thread');
      throw err;
    }
  }, [chatService]);

  const searchThreads = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredThreads(threads);
      return;
    }

    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const results = await chatService.searchThreads(query, user.id);
      setFilteredThreads(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search threads');
    }
  }, [threads, chatService, authService]);

  const toggleFavorite = useCallback(async (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      await updateThread(threadId, { isFavorite: !thread.isFavorite });
    }
  }, [threads, updateThread]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (searchQuery) {
      searchThreads(searchQuery);
    } else {
      setFilteredThreads(threads);
    }
  }, [searchQuery, threads, searchThreads]);

  return {
    threads,
    filteredThreads,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    createThread,
    updateThread,
    deleteThread,
    toggleFavorite,
    searchThreads,
    refetch: loadThreads,
  };
};

// Authentication Hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  const authService = useMemo(() => new AuthService(), []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { user: signedInUser, error: signInError } = await authService.signIn(email, password);
      if (signInError) {
        throw signInError;
      }
      setUser(signedInUser);
      return signedInUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const { user: signedUpUser, error: signUpError } = await authService.signUp(email, password, metadata);
      if (signUpError) {
        throw signUpError;
      }
      setUser(signedUpUser);
      return signedUpUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await authService.signOut();
      if (signOutError) {
        throw signOutError;
      }
      setUser(null);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { user: updatedUser, error } = await authService.updateProfile(updates);
      if (error) {
        throw error;
      }
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  }, [user, authService]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      throw err;
    }
  }, [authService]);

  const getAccessToken = useCallback(async () => {
    return await authService.getAccessToken();
  }, [authService]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const subscription = authService.onAuthStateChange((user) => {
      setUser(user);
    });

    return () => {
      subscription?.data?.subscription?.unsubscribe();
    };
  }, [authService]);

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    getAccessToken,
    isAuthenticated: !!user,
    clearError: () => setError(null),
  };
};

// File Upload Hook
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const fileService = useMemo(() => new FileService(), []);
  const authService = useMemo(() => new AuthService(), []);

  const uploadFile = useCallback(async (file: any) => {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    setUploading(true);
    setError(null);

    try {
      const attachment = await fileService.uploadFile(file, user.id, {
        generateThumbnail: true,
        onProgress: (progress) => {
          setProgress(prev => ({ ...prev, [file.name]: progress }));
        },
      });

      setProgress(prev => {
        const { [file.name]: removed, ...rest } = prev;
        return rest;
      });

      return attachment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      throw err;
    } finally {
      setUploading(false);
    }
  }, [fileService, authService]);

  const uploadMultipleFiles = useCallback(async (files: any[]) => {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    setUploading(true);
    setError(null);

    try {
      const attachments = await fileService.uploadMultipleFiles(files, user.id, {
        onProgress: (progress, fileIndex) => {
          const fileName = files[fileIndex]?.name;
          if (fileName) {
            setProgress(prev => ({ ...prev, [fileName]: progress }));
          }
        },
        onFileComplete: (_attachment, fileIndex) => {
          const fileName = files[fileIndex]?.name;
          if (fileName) {
            setProgress(prev => {
              const { [fileName]: removed, ...rest } = prev;
              return rest;
            });
          }
        },
      });

      return attachments;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
      throw err;
    } finally {
      setUploading(false);
      setProgress({});
    }
  }, [fileService, authService]);

  const deleteFile = useCallback(async (filePath: string) => {
    try {
      await fileService.deleteFile(filePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
      throw err;
    }
  }, [fileService]);

  return {
    uploading,
    progress,
    error,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    clearError: () => setError(null),
  };
};

// AI Streaming Hook
export const useAIStream = () => {
  const [streaming, setStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const langGraphClient = useMemo(() => new LangGraphClient({
    apiUrl: process.env.LANGGRAPH_API_URL || '',
    apiKey: process.env.LANGGRAPH_API_KEY,
  }), []);

  const sendStreamingMessage = useCallback(async (
    threadId: string,
    message: string,
    attachments?: any[],
    options?: {
      onToken?: (token: string) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    setStreaming(true);
    setCurrentMessage('');
    setError(null);

    try {
      const stream = await langGraphClient.sendStreamingMessage(threadId, message, attachments, {
        onToken: (token) => {
          setCurrentMessage(prev => prev + token);
          options?.onToken?.(token);
        },
        onComplete: () => {
          setStreaming(false);
          options?.onComplete?.();
        },
        onError: (err) => {
          setError(err.message);
          setStreaming(false);
          options?.onError?.(err);
        },
      });

      return stream;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send streaming message');
      setStreaming(false);
      throw err;
    }
  }, [langGraphClient]);

  const stopStreaming = useCallback(() => {
    setStreaming(false);
    setCurrentMessage('');
  }, []);

  return {
    streaming,
    currentMessage,
    error,
    sendStreamingMessage,
    stopStreaming,
    clearError: () => setError(null),
  };
};

// Search Hook
export const useSearch = () => {
  const [results, setResults] = useState<(Message | Thread)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatService = useMemo(() => new ChatService(), []);
  const authService = useMemo(() => new AuthService(), []);

  const searchMessages = useCallback(async (query: string, options?: {
    threadId?: string;
    messageType?: Message['type'];
    limit?: number;
  }) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const messages = await chatService.searchMessages(query, {
        userId: user.id,
        ...options,
      });

      setResults(messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search messages');
    } finally {
      setLoading(false);
    }
  }, [chatService, authService]);

  const searchThreads = useCallback(async (query: string, options?: {
    favoriteOnly?: boolean;
    tags?: string[];
    limit?: number;
  }) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const threads = await chatService.searchThreads(query, user.id, options);
      setResults(threads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search threads');
    } finally {
      setLoading(false);
    }
  }, [chatService, authService]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchMessages,
    searchThreads,
    clearResults,
    clearError: () => setError(null),
  };
};

// Keyboard Hook for React Native
export const useKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const showSubscription = require('react-native').Keyboard.addListener('keyboardDidShow', keyboardWillShow);
    const hideSubscription = require('react-native').Keyboard.addListener('keyboardDidHide', keyboardWillHide);

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
  };
};

// Debounce Hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Export useChat hooks (remove duplicate useAuth export)
export { useChat } from './useChat';
