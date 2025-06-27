import { type Message, Client } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";

export type StateType = {
  messages: Message[];
  context?: Record<string, unknown>;
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      context?: Record<string, unknown>;
    };
  }
>;

type StreamContextType = (ReturnType<typeof useTypedStream> & {
  threadId?: string | null;
  clearMessages?: () => void;
  createNewThread?: () => Promise<void>;
  switchToThread?: (threadId: string) => Promise<void>;
  deleteThread?: (threadId: string) => Promise<void>;
  renameThread?: (threadId: string, newTitle: string) => Promise<void>;
  batchDeleteThreads?: (threadIds: string[]) => Promise<void>;
  ensureThread?: () => Promise<void>; // New method to ensure a thread exists
  loadThreadMessages?: (threadId: string) => Promise<Message[]>; // New method to load thread messages
  client?: Client | null;
}) | null;

const StreamContext = createContext<StreamContextType>(null);

// Function to load environment variables
const getEnvConfig = () => {
  return {
    apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || '',
    assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || '',
    apiKey: process.env.EXPO_PUBLIC_LANGGRAPH_API_KEY || '',
  };
};

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error("Graph status check failed:", e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
  autoCreateThread = true,
  onError,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
  autoCreateThread?: boolean;
  onError?: (error: string) => void;
}) => {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false); // Track thread creation state
  const hasInitiatedCreation = useRef(false); // Track if we've ever tried to create a thread

  // Initialize client
  useEffect(() => {
    try {
      console.log('Initializing LangGraph client with:', { apiUrl, hasApiKey: !!apiKey, assistantId });
      const newClient = new Client({
        apiUrl,
        ...(apiKey && { apiKey }),
      });
      setClient(newClient);
    } catch (error) {
      console.error('Failed to initialize LangGraph client:', error);
      onError?.('Failed to initialize LangGraph client');
    }
  }, [apiUrl, apiKey, assistantId, onError]);

  // Create thread when client is ready (but only if auto-creation is enabled)
  useEffect(() => {
    const createThread = async () => {
      if (client && !threadId && autoCreateThread && !isCreatingThread && !hasInitiatedCreation.current) {
        try {
          hasInitiatedCreation.current = true;
          setIsCreatingThread(true);
          console.log('Auto-creating thread...');
          const thread = await client.threads.create();
          setThreadId(thread.thread_id);
          console.log('Auto-created new thread:', thread.thread_id);
        } catch (error) {
          console.error('Failed to create thread:', error);
          onError?.('Failed to create thread');
          hasInitiatedCreation.current = false; // Reset on error to allow retry
        } finally {
          setIsCreatingThread(false);
        }
      }
    };
    createThread();
  }, [client, threadId, autoCreateThread, isCreatingThread, onError]);

  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    onThreadId: (id) => {
      // Only accept thread ID from stream if we don't already have one
      if (id && !threadId && !isCreatingThread) {
        setThreadId(id);
        hasInitiatedCreation.current = true;
        console.log('Thread ID accepted from stream:', id);
      } else if (id && threadId && id !== threadId) {
        // If stream provides a different thread ID, log it but don't change
        console.log('Thread ID from stream differs from current:', 'stream=', id, 'current=', threadId);
      }
    },
  });

  const clearMessages = useCallback(() => {
    // For now, we'll just clear local state since branch might not be available
    console.log('Clear messages requested');
  }, []);

  const createNewThread = useCallback(async () => {
    if (client && !isCreatingThread) {
      try {
        setIsCreatingThread(true);
        console.log('Creating new thread...');
        const thread = await client.threads.create();
        setThreadId(thread.thread_id);
        hasInitiatedCreation.current = true; // Mark that we've created a thread
        console.log('Created new thread:', thread.thread_id);
        // Clear any existing stream state if possible
        console.log('New thread created, clearing state');
      } catch (error) {
        console.error('Failed to create new thread:', error);
        onError?.('Failed to create new thread');
      } finally {
        setIsCreatingThread(false);
      }
    }
  }, [client, isCreatingThread, onError]);

  const switchToThread = useCallback(async (newThreadId: string) => {
    if (client) {
      try {
        setThreadId(newThreadId);
        hasInitiatedCreation.current = true; // Mark that we have a thread
        console.log('Switched to thread:', newThreadId);

        // Force a reload by temporarily clearing and resetting the thread ID
        // This ensures the stream context picks up the new/same thread properly
        if (newThreadId === threadId) {
          console.log('Reloading same thread:', newThreadId);
        }
      } catch (error) {
        console.error('Failed to switch thread:', error);
        onError?.('Failed to switch thread');
      }
    }
  }, [client, threadId, onError]);

  const deleteThread = useCallback(async (threadIdToDelete: string) => {
    if (client) {
      try {
        await client.threads.delete(threadIdToDelete);
        console.log('Deleted thread:', threadIdToDelete);

        // If we deleted the current thread, create a new one
        if (threadIdToDelete === threadId) {
          await createNewThread();
        }
      } catch (error) {
        console.error('Failed to delete thread:', error);
        onError?.('Failed to delete thread');
      }
    }
  }, [client, threadId, createNewThread, onError]);

  const renameThread = useCallback(async (threadIdToRename: string, newTitle: string) => {
    if (client) {
      try {
        await client.threads.update(threadIdToRename, {
          metadata: { title: newTitle }
        });
        console.log('Renamed thread:', threadIdToRename, 'to:', newTitle);
      } catch (error) {
        console.error('Failed to rename thread:', error);
        onError?.('Failed to rename thread');
      }
    }
  }, [client, onError]);

  const batchDeleteThreads = useCallback(async (threadIdsToDelete: string[]) => {
    if (client) {
      try {
        // Check if the current thread is in the batch to delete
        const deletingCurrentThread = threadIdsToDelete.includes(threadId || '');

        // Delete threads one by one
        await Promise.all(threadIdsToDelete.map(id => client.threads.delete(id)));

        console.log('Batch deleted threads:', threadIdsToDelete);

        // If we deleted the current thread, create a new one
        if (deletingCurrentThread) {
          await createNewThread();
        }
      } catch (error) {
        console.error('Failed to batch delete threads:', error);
        onError?.('Failed to batch delete threads');
      }
    }
  }, [client, threadId, createNewThread, onError]);

  // Ensure a thread exists (for cases where auto-creation was disabled)
  const ensureThread = useCallback(async () => {
    if (client && !threadId && !isCreatingThread) {
      try {
        setIsCreatingThread(true);
        console.log('Ensuring thread exists...');
        const thread = await client.threads.create();
        setThreadId(thread.thread_id);
        hasInitiatedCreation.current = true; // Mark that we've created a thread
        console.log('Ensured thread exists:', thread.thread_id);
      } catch (error) {
        console.error('Failed to ensure thread:', error);
        onError?.('Failed to ensure thread');
      } finally {
        setIsCreatingThread(false);
      }
    }
  }, [client, threadId, isCreatingThread, onError]);

  // Load messages from a specific thread
  const loadThreadMessages = useCallback(async (targetThreadId: string): Promise<Message[]> => {
    if (!client) {
      console.warn('Client not available for loading thread messages');
      return [];
    }

    try {
      console.log('Loading messages for thread:', targetThreadId);

      // Method 1: Try to get thread state/messages
      try {
        if (client.threads.getState) {
          const state = await client.threads.getState(targetThreadId);
          if (state && state.values) {
            // Handle different possible state structures
            const stateValues = state.values as any;
            if (stateValues.messages && Array.isArray(stateValues.messages)) {
              console.log('Loaded', stateValues.messages.length, 'messages from thread state');
              return stateValues.messages as Message[];
            }
          }
        }
      } catch (stateError) {
        console.log('getState method not available or failed:', stateError);
      }

      // Method 2: Try to get thread history
      try {
        if (client.threads.getHistory) {
          const history = await client.threads.getHistory(targetThreadId) as any;
          if (history && Array.isArray(history)) {
            // Extract messages from history entries
            const messages = history
              .map((entry: any) => entry.values?.messages)
              .filter(Boolean)
              .flat()
              .filter((msg: any) => msg && typeof msg === 'object');

            if (messages.length > 0) {
              console.log('Loaded', messages.length, 'messages from thread history');
              return messages as Message[];
            }
          }
        }
      } catch (historyError) {
        console.log('getHistory method not available or failed:', historyError);
      }

      // Method 3: Try to get thread info/runs (alternative approach)
      try {
        if (client.runs?.list) {
          const runs = await client.runs.list(targetThreadId) as any;
          if (runs && Array.isArray(runs)) {
            // Extract messages from run outputs
            const messages = runs
              .map((run: any) => run.outputs?.messages || run.output?.messages)
              .filter(Boolean)
              .flat()
              .filter((msg: any) => msg && typeof msg === 'object');

            if (messages.length > 0) {
              console.log('Loaded', messages.length, 'messages from thread runs');
              return messages as Message[];
            }
          }
        }
      } catch (runsError) {
        console.log('runs.list method not available or failed:', runsError);
      }

      // If no method works, return empty array
      console.log('No messages found for thread:', targetThreadId, '- thread may be empty or API methods not available');
      return [];
    } catch (error) {
      console.error('Failed to load thread messages:', error);
      return [];
    }
  }, [client]);

  useEffect(() => {
    // Only check graph status if we have a proper LangGraph URL
    if (apiUrl && (apiUrl.includes('localhost') || apiUrl.includes('langgraph'))) {
      checkGraphStatus(apiUrl, apiKey).then((ok) => {
        if (!ok) {
          const errorMessage = `Failed to connect to LangGraph server at ${apiUrl}. Please ensure your graph is running and your API key is correctly set.`;
          onError?.(errorMessage);
        }
      });
    }
  }, [apiKey, apiUrl, onError]);

  // Enhanced stream value with additional methods
  const enhancedStreamValue = streamValue && client ? {
    ...streamValue,
    threadId,
    clearMessages,
    createNewThread,
    switchToThread,
    deleteThread,
    renameThread,
    batchDeleteThreads,
    ensureThread,
    loadThreadMessages,
    client,
  } : streamValue ? {
    ...streamValue,
    threadId,
    clearMessages,
    createNewThread,
    switchToThread,
    deleteThread,
    ensureThread,
    loadThreadMessages,
  } : null;

  return (
    <StreamContext.Provider value={enhancedStreamValue}>
      {children}
    </StreamContext.Provider>
  );
};

// Default values for the configuration with environment variable fallbacks
const getDefaultConfig = () => {
  const envConfig = getEnvConfig();
  return {
    apiUrl: envConfig.apiUrl || "http://localhost:2024",
    assistantId: envConfig.assistantId || "agent",
    apiKey: envConfig.apiKey || null,
  };
};

export interface StreamConfig {
  apiUrl?: string;
  assistantId?: string;
  apiKey?: string;
  autoCreateThread?: boolean; // New flag to control auto thread creation
}

export const StreamProvider: React.FC<{
  children: ReactNode;
  config?: StreamConfig;
}> = ({ children, config = {} }) => {
  // Get default configuration with environment variables
  const defaultConfig = getDefaultConfig();

  // Merge provided config with defaults (provided config takes precedence)
  const finalConfig = {
    apiUrl: config.apiUrl || defaultConfig.apiUrl,
    assistantId: config.assistantId || defaultConfig.assistantId,
    apiKey: config.apiKey || defaultConfig.apiKey,
    autoCreateThread: config.autoCreateThread ?? true, // Default to true for backward compatibility
  };

  console.log('StreamProvider configuration:', {
    ...finalConfig,
    apiKey: finalConfig.apiKey ? '***hidden***' : null
  });

  const handleError = (errorMessage: string) => {
    console.warn('StreamProvider error:', errorMessage);
  };

  return (
    <StreamSession
      apiUrl={finalConfig.apiUrl}
      assistantId={finalConfig.assistantId}
      apiKey={finalConfig.apiKey}
      autoCreateThread={finalConfig.autoCreateThread}
      onError={handleError}
    >
      {children}
    </StreamSession>
  );
};

// Create a safe hook that doesn't throw
export const useStreamContext = () => {
  const context = useContext(StreamContext);
  return context; // Return null if not in provider, don't throw
};
