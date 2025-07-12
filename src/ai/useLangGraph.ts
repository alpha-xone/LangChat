import { useState, useEffect, useCallback, useRef } from 'react';
import { LangGraphClient, type LangGraphConfig, type ThreadMessage } from './LangGraphClient';
import { StreamParser, type ParsedMessage } from './StreamParser';
import AuthService from '../data/AuthService';

export interface UseLangGraphProps {
  config: LangGraphConfig;
  threadId?: string;
  reconnectOnMount?: boolean;
}

export interface UseLangGraphReturn {
  messages: ParsedMessage[];
  isLoading: boolean;
  error: string | null;
  threadId: string | null;
  currentMessage: ParsedMessage | null;

  // Actions
  sendMessage: (message: string | ThreadMessage) => Promise<void>;
  stop: () => void;
  clearMessages: () => void;
  reconnect: () => Promise<void>;
  createNewThread: () => Promise<string>;
}

export function useLangGraph({
  config,
  threadId: initialThreadId,
  reconnectOnMount = true
}: UseLangGraphProps): UseLangGraphReturn {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId || null);
  const [currentMessage, setCurrentMessage] = useState<ParsedMessage | null>(null);

  // Refs to maintain stable references
  const clientRef = useRef<LangGraphClient | null>(null);
  const parserRef = useRef<StreamParser | null>(null);
  const authServiceRef = useRef<AuthService | null>(null);
  const currentStreamRef = useRef<AsyncGenerator<any, void, unknown> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize auth service
  useEffect(() => {
    authServiceRef.current = new AuthService();
  }, []);

  // Initialize client and parser
  useEffect(() => {
    if (!authServiceRef.current) return;

    clientRef.current = new LangGraphClient(config, authServiceRef.current);

    parserRef.current = new StreamParser({
      onMessage: (message: ParsedMessage) => {
        setCurrentMessage(message);

        // Update messages array
        setMessages(prev => {
          const existingIndex = prev.findIndex(m => m.id === message.id);
          if (existingIndex >= 0) {
            // Update existing message
            const updated = [...prev];
            updated[existingIndex] = message;
            return updated;
          } else {
            // Add new message
            return [...prev, message];
          }
        });
      },
      onError: (errorMsg: string) => {
        setError(errorMsg);
        setIsLoading(false);
        setCurrentMessage(null);
      },
      onComplete: () => {
        setIsLoading(false);
        setCurrentMessage(null);
      },
    });
  }, [config]);

  // Initialize thread on mount
  useEffect(() => {
    if (reconnectOnMount && clientRef.current && !threadId) {
      initializeThread();
    }
  }, [reconnectOnMount]);

  const initializeThread = useCallback(async (): Promise<string> => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    try {
      const thread = await clientRef.current.getOrCreateThread(threadId || undefined);
      setThreadId(thread.thread_id);

      // Load existing messages if any
      if (thread.thread_id) {
        await loadThreadMessages(thread.thread_id);
      }

      return thread.thread_id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize thread';
      setError(errorMsg);
      throw err;
    }
  }, [threadId]);

  const loadThreadMessages = useCallback(async (threadId: string) => {
    if (!clientRef.current) return;

    try {
      const threadMessages = await clientRef.current.getThreadMessages(threadId);

      // Convert thread messages to parsed messages
      const parsedMessages: ParsedMessage[] = threadMessages
        .filter(msg => msg.messages && Array.isArray(msg.messages))
        .flatMap(state => state.messages)
        .map((msg: any, index: number) => ({
          id: msg.id || `loaded_${index}`,
          type: normalizeMessageType(msg.type || msg.role),
          content: extractMessageContent(msg),
          metadata: msg.metadata || {},
          timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
          isComplete: true,
        }));

      setMessages(parsedMessages);
    } catch (err) {
      console.error('Error loading thread messages:', err);
    }
  }, []);

  const sendMessage = useCallback(async (input: string | ThreadMessage) => {
    if (!clientRef.current || !parserRef.current) {
      setError('Client not initialized');
      return;
    }

    // Ensure we have a thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      try {
        currentThreadId = await initializeThread();
      } catch (err) {
        return; // Error already set by initializeThread
      }
    }

    // Prepare message
    const message: ThreadMessage = typeof input === 'string'
      ? { type: 'human', content: input }
      : input;

    // Add user message to display immediately
    const userMessage: ParsedMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'human',
      content: message.content,
      metadata: message.metadata || {},
      timestamp: new Date().toISOString(),
      isComplete: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setCurrentMessage(null);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Start streaming
      const stream = clientRef.current.streamMessage(currentThreadId, message);
      currentStreamRef.current = stream;

      // Process stream
      for await (const event of stream) {
        // Check if we should abort
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        // Parse the event
        parserRef.current.parseStreamEvent(event);
        // Parsing is handled by the parser callbacks
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
      setCurrentMessage(null);
      currentStreamRef.current = null;
      abortControllerRef.current = null;
    }
  }, [threadId, initializeThread]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setCurrentMessage(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentMessage(null);
    if (parserRef.current) {
      parserRef.current.clearBuffer();
    }
  }, []);

  const reconnect = useCallback(async () => {
    setError(null);
    await initializeThread();
  }, [initializeThread]);

  const createNewThread = useCallback(async (): Promise<string> => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    try {
      const thread = await clientRef.current.getOrCreateThread();
      setThreadId(thread.thread_id);
      clearMessages();
      return thread.thread_id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create new thread';
      setError(errorMsg);
      throw err;
    }
  }, [clearMessages]);

  return {
    messages,
    isLoading,
    error,
    threadId,
    currentMessage,
    sendMessage,
    stop,
    clearMessages,
    reconnect,
    createNewThread,
  };
}

// Helper functions
function normalizeMessageType(type: string): 'human' | 'ai' | 'system' | 'assistant' | 'tool' {
  switch (type?.toLowerCase()) {
    case 'human':
    case 'user':
      return 'human';
    case 'ai':
    case 'assistant':
      return 'ai';
    case 'system':
      return 'system';
    case 'tool':
      return 'tool';
    default:
      return 'ai';
  }
}

function extractMessageContent(message: any): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
  }

  if (message.text) {
    return message.text;
  }

  return '';
}
