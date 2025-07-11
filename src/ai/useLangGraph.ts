import { useState, useEffect, useRef, useCallback } from 'react';
import { LangGraphClient, createLangGraphClient, type LangGraphConfig } from './LangGraphClient';
import { StreamParser, createStreamParser, type ParsedMessage } from './StreamParser';
import { useAuth } from '../hooks/useAuth';

export interface LangGraphHookConfig {
  apiUrl: string;
  assistantId: string;
  autoConnect?: boolean;
}

export interface LangGraphState {
  isConnected: boolean;
  isStreaming: boolean;
  currentMessage: ParsedMessage | null;
  error: string | null;
  threadId: string | null;
}

export interface LangGraphActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  createThread: () => Promise<string>;
  sendMessage: (message: string, threadId?: string) => Promise<void>;
  cancelCurrentStream: () => Promise<void>;
  clearError: () => void;
}

export interface UseLangGraphReturn extends LangGraphState, LangGraphActions {
  client: LangGraphClient | null;
}

/**
 * React hook for LangGraph integration with Supabase authentication
 * Handles client initialization, streaming, and session management
 */
export function useLangGraph(
  config: LangGraphHookConfig,
  onMessage?: (message: ParsedMessage) => void,
  onError?: (error: Error) => void
): UseLangGraphReturn {
  const { session } = useAuth();

  // State
  const [state, setState] = useState<LangGraphState>({
    isConnected: false,
    isStreaming: false,
    currentMessage: null,
    error: null,
    threadId: null,
  });

  // Refs
  const clientRef = useRef<LangGraphClient | null>(null);
  const streamParserRef = useRef<StreamParser | null>(null);
  const currentStreamRef = useRef<AbortController | null>(null);

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<LangGraphState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Initialize LangGraph client with current session
   */
  const connect = useCallback(async () => {
    console.log('[useLangGraph] Connect called with:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      apiUrl: config.apiUrl ? `${config.apiUrl.substring(0, 20)}...` : 'NOT SET',
      assistantId: config.assistantId || 'NOT SET',
    });

    if (!session?.access_token) {
      const error = 'No valid session found. Please authenticate first.';
      console.log('[useLangGraph] Connection failed:', error);
      updateState({ error, isConnected: false });
      return;
    }

    if (!config.apiUrl || !config.assistantId) {
      const error = 'LangGraph configuration missing. Please set EXPO_PUBLIC_LANGGRAPH_API_URL and EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID in your .env file.';
      console.log('[useLangGraph] Configuration error:', error);
      updateState({ error, isConnected: false });
      return;
    }

    try {
      console.log('[useLangGraph] Connecting to LangGraph with session token');

      const langGraphConfig: LangGraphConfig = {
        apiUrl: config.apiUrl,
        assistantId: config.assistantId,
        accessToken: session.access_token,
      };

      const client = createLangGraphClient(langGraphConfig);

      // Test connection
      console.log('[useLangGraph] Performing health check...');
      const isHealthy = await client.healthCheck();
      console.log('[useLangGraph] Health check result:', isHealthy);

      if (!isHealthy) {
        throw new Error('LangGraph health check failed');
      }

      clientRef.current = client;

      // Initialize stream parser
      streamParserRef.current = createStreamParser({
        onMessageStart: (message) => {
          console.log('[useLangGraph] Message started:', message.id);
          updateState({ currentMessage: message });
          onMessage?.(message);
        },
        onMessageUpdate: (message) => {
          console.log('[useLangGraph] Message updated:', message.id, 'length:', message.content.length);
          updateState({ currentMessage: message });
          onMessage?.(message);
        },
        onMessageComplete: (message) => {
          console.log('[useLangGraph] Message completed:', message.id);
          updateState({ currentMessage: message, isStreaming: false });
          onMessage?.(message);
        },
        onError: (error) => {
          console.error('[useLangGraph] Stream error:', error);
          updateState({ error: error.message, isStreaming: false, currentMessage: null });
          onError?.(error);
        },
        onStreamComplete: () => {
          console.log('[useLangGraph] Stream completed');
          updateState({ isStreaming: false });
        },
      });

      updateState({ isConnected: true, error: null });
      console.log('[useLangGraph] Successfully connected to LangGraph');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to LangGraph';
      console.error('[useLangGraph] Connection error:', errorMessage);
      updateState({ error: errorMessage, isConnected: false });
    }
  }, [session?.access_token, config, updateState, onMessage, onError]);

  /**
   * Disconnect from LangGraph
   */
  const disconnect = useCallback(() => {
    console.log('[useLangGraph] Disconnecting from LangGraph');

    // Cancel any active streams
    if (currentStreamRef.current) {
      currentStreamRef.current.abort();
      currentStreamRef.current = null;
    }

    // Reset parser
    if (streamParserRef.current) {
      streamParserRef.current.reset();
    }

    // Clear client
    clientRef.current = null;
    streamParserRef.current = null;

    updateState({
      isConnected: false,
      isStreaming: false,
      currentMessage: null,
      threadId: null,
      error: null,
    });
  }, [updateState]);

  /**
   * Create a new conversation thread
   */
  const createThread = useCallback(async (): Promise<string> => {
    if (!clientRef.current) {
      throw new Error('LangGraph client not connected');
    }

    try {
      console.log('[useLangGraph] Creating new thread');
      const { threadId } = await clientRef.current.createThread();
      updateState({ threadId });
      return threadId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create thread';
      updateState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [updateState]);

  /**
   * Send message and handle streaming response
   */
  const sendMessage = useCallback(async (message: string, threadId?: string): Promise<void> => {
    if (!clientRef.current || !streamParserRef.current) {
      throw new Error('LangGraph client not connected');
    }

    if (!threadId && !state.threadId) {
      throw new Error('No thread ID provided and no active thread');
    }

    const targetThreadId = threadId || state.threadId!;

    try {
      console.log('[useLangGraph] Sending message to thread:', targetThreadId);
      updateState({ isStreaming: true, error: null, currentMessage: null });

      // Create abort controller for this stream
      const abortController = new AbortController();
      currentStreamRef.current = abortController;

      // Stream the message
      const messageStream = clientRef.current.streamMessage(targetThreadId, message);

      for await (const chunk of messageStream) {
        // Check if stream was cancelled
        if (abortController.signal.aborted) {
          console.log('[useLangGraph] Stream was cancelled');
          break;
        }

        // Process chunk through parser
        await streamParserRef.current.processChunk(chunk);
      }

      // Clear the stream reference if completed normally
      if (currentStreamRef.current === abortController) {
        currentStreamRef.current = null;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('[useLangGraph] Send message error:', errorMessage);
      updateState({ error: errorMessage, isStreaming: false, currentMessage: null });
      throw new Error(errorMessage);
    }
  }, [state.threadId, updateState]);

  /**
   * Cancel current streaming operation
   */
  const cancelCurrentStream = useCallback(async (): Promise<void> => {
    if (currentStreamRef.current) {
      console.log('[useLangGraph] Cancelling current stream');
      currentStreamRef.current.abort();
      currentStreamRef.current = null;

      if (streamParserRef.current) {
        streamParserRef.current.reset();
      }

      updateState({ isStreaming: false, currentMessage: null });
    }
  }, [updateState]);

  /**
   * Update access token when session changes
   */
  useEffect(() => {
    if (clientRef.current && session?.access_token) {
      console.log('[useLangGraph] Updating access token');
      clientRef.current.updateAccessToken(session.access_token);
    }
  }, [session?.access_token]);

  /**
   * Auto-connect when session is available
   */
  useEffect(() => {
    if (config.autoConnect && session?.access_token && !state.isConnected) {
      console.log('[useLangGraph] Auto-connecting...');
      connect();
    }
  }, [config.autoConnect, session?.access_token, state.isConnected, connect]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    isConnected: state.isConnected,
    isStreaming: state.isStreaming,
    currentMessage: state.currentMessage,
    error: state.error,
    threadId: state.threadId,

    // Actions
    connect,
    disconnect,
    createThread,
    sendMessage,
    cancelCurrentStream,
    clearError,

    // Client access
    client: clientRef.current,
  };
}

/**
 * Hook for simple LangGraph usage with environment configuration
 */
export function useLangGraphSimple(
  onMessage?: (message: ParsedMessage) => void,
  onError?: (error: Error) => void
): UseLangGraphReturn {
  const apiUrl = process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || '';
  const assistantId = process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || '';

  console.log('[useLangGraphSimple] Environment configuration:', {
    apiUrl: apiUrl ? `${apiUrl.substring(0, 20)}...` : 'NOT SET',
    assistantId: assistantId || 'NOT SET',
  });

  const config: LangGraphHookConfig = {
    apiUrl,
    assistantId,
    autoConnect: true,
  };

  return useLangGraph(config, onMessage, onError);
}
