import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatService } from '../data/ChatService';
import { LangGraphClient } from '../ai/LangGraphClient';
import { StreamParser } from '../ai/StreamParser';
import type { Message, SendMessageOptions } from '../types';

export interface UseChatOptions {
  threadId?: string;
  userId?: string;
  langGraphConfig?: {
    apiUrl: string;
    apiKey?: string;
    defaultAssistantId?: string;
  };
  onError?: (error: Error) => void;
  onMessageReceived?: (message: Message) => void;
  onTypingStateChange?: (isTyping: boolean) => void;
  autoSave?: boolean;
  maxRetries?: number;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  error: Error | null;
  threadId: string | null;
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  resendMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  clearMessages: () => Promise<void>;
  loadThread: (threadId: string) => Promise<void>;
  createNewThread: (title?: string) => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const {
    threadId: initialThreadId,
    userId,
    langGraphConfig,
    onError,
    onMessageReceived,
    onTypingStateChange,
    maxRetries = 3,
  } = options;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId || null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const chatServiceRef = useRef<ChatService | null>(null);
  const langGraphClientRef = useRef<LangGraphClient | null>(null);
  const streamParserRef = useRef<StreamParser | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string>('');

  // Initialize services
  useEffect(() => {
    chatServiceRef.current = new ChatService();
    streamParserRef.current = new StreamParser();

    if (langGraphConfig) {
      langGraphClientRef.current = new LangGraphClient(langGraphConfig);
    }
  }, [langGraphConfig]);

  // Load initial thread
  useEffect(() => {
    if (initialThreadId) {
      loadThread(initialThreadId).catch(handleError);
    }
  }, [initialThreadId]);

  // Handle errors
  const handleError = useCallback((err: Error) => {
    setError(err);
    setIsLoading(false);
    setIsTyping(false);
    onError?.(err);
  }, [onError]);

  // Handle typing state changes
  const handleTypingChange = useCallback((typing: boolean) => {
    setIsTyping(typing);
    onTypingStateChange?.(typing);
  }, [onTypingStateChange]);

  // Send message
  const sendMessage = useCallback(async (content: string, options: SendMessageOptions = {}) => {
    if (!content.trim() || isLoading || !threadId) return;

    setError(null);
    setIsLoading(true);
    lastMessageRef.current = content;

    try {
      // Create user message
      const userMessage = {
        threadId,
        userId: userId || 'anonymous',
        type: 'user' as const,
        content: content.trim(),
        metadata: options.metadata,
        attachments: options.attachments,
      };

      // Save user message
      let savedUserMessage: Message;
      if (chatServiceRef.current) {
        savedUserMessage = await chatServiceRef.current.createMessage(userMessage);
        setMessages(prev => [...prev, savedUserMessage]);
      }

      // Send to AI service if available
      if (langGraphClientRef.current) {
        handleTypingChange(true);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        const response = await langGraphClientRef.current.sendMessage(
          threadId,
          content,
          options.attachments,
          {
            ...options,
            signal: abortControllerRef.current.signal,
          }
        );

        // Create AI message
        const aiMessage = {
          threadId,
          type: 'ai' as const,
          content: response,
          metadata: { ...options.metadata, userMessageId: savedUserMessage!.id },
        };

        // Save AI message
        if (chatServiceRef.current) {
          const savedAiMessage = await chatServiceRef.current.createMessage(aiMessage);
          setMessages(prev => [...prev, savedAiMessage]);
          onMessageReceived?.(savedAiMessage);
        }
      }

      setRetryCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      handleError(error);
    } finally {
      setIsLoading(false);
      handleTypingChange(false);
      abortControllerRef.current = null;
    }
  }, [threadId, userId, isLoading, onMessageReceived, handleError, handleTypingChange]);

  // Resend message
  const resendMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.type !== 'user') return;

    await sendMessage(message.content);
  }, [messages, sendMessage]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      if (chatServiceRef.current) {
        await chatServiceRef.current.deleteMessage(messageId);
      }
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to delete message'));
    }
  }, [handleError]);

  // Clear messages
  const clearMessages = useCallback(async () => {
    try {
      if (threadId && chatServiceRef.current) {
        const messageIds = messages.map(m => m.id);
        await chatServiceRef.current.bulkDeleteMessages(messageIds);
      }
      setMessages([]);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to clear messages'));
    }
  }, [threadId, messages, handleError]);

  // Load thread
  const loadThread = useCallback(async (newThreadId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (chatServiceRef.current) {
        const threadMessages = await chatServiceRef.current.getMessages(newThreadId);
        setThreadId(newThreadId);
        setMessages(threadMessages);
      }
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to load thread'));
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Create new thread
  const createNewThread = useCallback(async (title?: string) => {
    if (!userId) {
      handleError(new Error('User ID is required to create a thread'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (chatServiceRef.current) {
        const newThread = await chatServiceRef.current.createThread({
          userId,
          title,
          isFavorite: false,
          tags: [],
        });
        setThreadId(newThread.id);
        setMessages([]);
      }
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to create thread'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  // Retry last message
  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      handleError(new Error('Maximum retry attempts reached'));
      return;
    }

    if (lastMessageRef.current) {
      setRetryCount(prev => prev + 1);
      await sendMessage(lastMessageRef.current);
    }
  }, [retryCount, maxRetries, sendMessage, handleError]);

  // Cancel current request
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    handleTypingChange(false);
  }, [handleTypingChange]);

  return {
    messages,
    isLoading,
    isTyping,
    error,
    threadId,
    sendMessage,
    resendMessage,
    deleteMessage,
    clearMessages,
    loadThread,
    createNewThread,
    retry,
    cancel,
  };
};

export default useChat;
