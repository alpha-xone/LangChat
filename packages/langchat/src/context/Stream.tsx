import { type Message, Client } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
}) | null;

const StreamContext = createContext<StreamContextType>(null);

// Function to load environment variables
const getEnvConfig = () => {
  return {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
    assistantId: process.env.EXPO_PUBLIC_ASSISTANT_ID || '',
    apiKey: process.env.EXPO_PUBLIC_API_KEY || '',
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
  onError,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
  onError?: (error: string) => void;
}) => {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);

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
  }, [apiUrl, apiKey, onError]);

  // Create thread when client is ready
  useEffect(() => {
    const createThread = async () => {
      if (client && !threadId) {
        try {
          const thread = await client.threads.create();
          setThreadId(thread.thread_id);
          console.log('Created new thread:', thread.thread_id);
        } catch (error) {
          console.error('Failed to create thread:', error);
          onError?.('Failed to create thread');
        }
      }
    };
    createThread();
  }, [client, threadId, onError]);

  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    onThreadId: (id) => {
      if (id && id !== threadId) {
        setThreadId(id);
        console.log('Thread ID updated:', id);
      }
    },
  });

  const clearMessages = useCallback(() => {
    // For now, we'll just clear local state since branch might not be available
    console.log('Clear messages requested');
  }, []);

  const createNewThread = useCallback(async () => {
    if (client) {
      try {
        const thread = await client.threads.create();
        setThreadId(thread.thread_id);
        console.log('Created new thread:', thread.thread_id);
        // Clear any existing stream state if possible
        console.log('New thread created, clearing state');
      } catch (error) {
        console.error('Failed to create new thread:', error);
        onError?.('Failed to create new thread');
      }
    }
  }, [client, onError]);

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
  const enhancedStreamValue = streamValue ? {
    ...streamValue,
    threadId,
    clearMessages,
    createNewThread,
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
  };

  console.log('StreamProvider configuration:', {
    ...finalConfig,
    apiKey: finalConfig.apiKey ? '***hidden***' : null
  });

  const [error, setError] = useState<string | null>(null);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.warn('StreamProvider error:', errorMessage);
  };

  return (
    <StreamSession
      apiUrl={finalConfig.apiUrl}
      assistantId={finalConfig.assistantId}
      apiKey={finalConfig.apiKey}
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
