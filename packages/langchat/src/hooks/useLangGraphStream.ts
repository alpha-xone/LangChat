import { mergeStreamingMessage, processStreamChunk } from '../lib/stream-utils';
import { Client, Message } from '@langchain/langgraph-sdk';
import { useCallback, useEffect, useState } from 'react';

interface UseLangGraphStreamProps {
  apiUrl: string;
  assistantId: string;
  apiKey?: string;
}

interface StreamState {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  threadId: string | null;
}

export function useLangGraphStream({ apiUrl, assistantId, apiKey }: UseLangGraphStreamProps) {
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
      const newClient = new Client({
        apiUrl,
        ...(apiKey && { apiKey }),
      });
      setClient(newClient);
    } catch (error) {
      console.error('Failed to initialize LangGraph client:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize LangGraph client'
      }));
    }
  }, [apiUrl, apiKey]);

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
        const thread = await client.threads.create();
        currentThreadId = thread.thread_id;
        setState(prev => ({ ...prev, threadId: currentThreadId }));
      }      // Stream the response
      const stream = client.runs.stream(
        currentThreadId,
        assistantId,
        {
          input: { messages: [message] },
          streamMode: 'messages-tuple',
        }
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
      setState(prev => ({
        ...prev,
        error: 'Failed to send message',
        // Remove the optimistic message on error
        messages: prev.messages.slice(0, -1),
      }));
    } finally {
      setState(prev => ({ ...prev, isStreaming: false }));
    }
  }, [client, assistantId, state.threadId]);

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
