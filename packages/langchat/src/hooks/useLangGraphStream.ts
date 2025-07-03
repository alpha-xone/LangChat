import { Client, Message } from '@langchain/langgraph-sdk';
import { useCallback, useEffect, useState } from 'react';
import { mergeStreamingMessage, processStreamChunk } from '../lib/stream-utils';

interface UseLangGraphStreamProps {
  apiUrl: string;
  assistantId: string;
  apiKey?: string;
  authToken?: string; // Add auth token support
}

interface StreamState {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  threadId: string | null;
}

export function useLangGraphStream({ apiUrl, assistantId, apiKey, authToken }: UseLangGraphStreamProps) {
  const [state, setState] = useState<StreamState>({
    messages: [],
    isStreaming: false,
    error: null,
    threadId: null,
  });

  const [client, setClient] = useState<Client | null>(null);

  // Initialize client
  useEffect(() => {
    try {
      let clientConfig: any = {
        apiUrl,
        ...(apiKey && { apiKey }),
      };      // Add authorization header if authToken is provided
      if (authToken) {
        // Set default headers for all requests
        clientConfig.defaultHeaders = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        };

        console.log('Setting LangGraph client with auth token:', authToken ? 'present' : 'missing');
        console.log('Auth token preview:', authToken ? authToken.substring(0, 20) + '...' : 'none');
      } else {
        console.warn('No auth token provided to LangGraph client');
      }

      const newClient = new Client(clientConfig);
      setClient(newClient);
    } catch (error) {
      console.error('Failed to initialize LangGraph client:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize LangGraph client'
      }));
    }
  }, [apiUrl, apiKey, authToken]); // Add authToken to dependencies

  const sendMessage = useCallback(async (message: Message) => {
    if (!client) {
      setState(prev => ({
        ...prev,
        error: 'Client not initialized'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isStreaming: true,
      error: null,
      messages: [...prev.messages, message],
    }));

    try {
      // Create thread if we don't have one
      let currentThreadId = state.threadId;
      if (!currentThreadId) {
        console.log('Creating thread with auth token:', authToken ? 'present' : 'missing');
        const thread = await client.threads.create();
        currentThreadId = thread.thread_id;
        setState(prev => ({ ...prev, threadId: currentThreadId }));
      }      // Stream the response with optional headers
      const streamConfig: any = {
        input: { messages: [message] },
        streamMode: 'messages-tuple',
      };

      // Add authorization header to stream config if available
      if (authToken) {
        streamConfig.headers = {
          'Authorization': `Bearer ${authToken}`,
        };
      }

      const stream = client.runs.stream(
        currentThreadId,
        assistantId,
        streamConfig
      );

      // Process streaming responses
      for await (const chunk of stream) {
        try {
          // chunk.data contains the tuple format: [messageChunk, metadata]
          const { messageChunk, metadata } = processStreamChunk(chunk.data);

          if (messageChunk && messageChunk.content) {
            setState(prev => {
              const updatedMessages = mergeStreamingMessage(prev.messages, messageChunk, metadata);
              return {
                ...prev,
                messages: updatedMessages,
              };
            });

            // Add 10ms delay to verify real-time UI updates
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error('Error processing chunk:', error);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // Enhanced error logging for authorization issues
      if (error instanceof Error && error.message.includes('403')) {
        console.error('❌ Authorization error details:', {
          hasAuthToken: !!authToken,
          authTokenLength: authToken ? authToken.length : 0,
          authTokenPrefix: authToken ? authToken.substring(0, 20) + '...' : 'none',
          error: error.message
        });
      }

      setState(prev => ({
        ...prev,
        error: `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
        // Remove the optimistic message on error
        messages: prev.messages.slice(0, -1),
      }));
    } finally {
      setState(prev => ({ ...prev, isStreaming: false }));
    }
  }, [client, assistantId, state.threadId, authToken]);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [], threadId: null }));
  }, []);
  const interrupt = useCallback(async () => {
    if (!client || !state.threadId) return;

    try {
      // Note: interrupt functionality may need to be implemented differently
      // depending on your LangGraph setup. For now, we'll just stop locally.
      setState(prev => ({ ...prev, isStreaming: false }));
    } catch (error) {
      console.error('Failed to interrupt:', error);
    }
  }, [client, state.threadId]);

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    error: state.error,
    threadId: state.threadId,
    sendMessage,
    clearMessages,
    interrupt,
  };
}
