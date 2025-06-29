import { Message } from '@langchain/langgraph-sdk';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useStreamContext } from '../context/Stream';
import { useAuth } from '../contexts/SupabaseAuthContext'; // Add this import
import { generateMessageId } from '../lib/message-utils';

interface UseRealChatHandlerProps {
  addMessage: (message: Message) => void;
  chunkQueueRef: React.MutableRefObject<any[]>;
}

export const useRealChatHandler = ({ addMessage, chunkQueueRef }: UseRealChatHandlerProps) => {
  const streamContext = useStreamContext();
  const { session } = useAuth(); // Get current session

  const handleRealMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    if (!streamContext) {
      Alert.alert('Error', 'Streaming not available. Please check configuration.');
      return;
    }

    // Check if user is authenticated
    if (!session?.access_token) {
      Alert.alert('Error', 'Authentication required. Please sign in.');
      return;
    }

    try {
      console.log('Sending message to LangGraph:', { text });
      console.log('Stream context loading:', streamContext.isLoading);
      console.log('Using access token:', session.access_token ? 'Present' : 'Missing');

      // Add user message immediately
      const userMessage: Message = {
        id: generateMessageId(),
        type: 'human',
        content: text.trim(),
      };
      addMessage(userMessage);

      // Clear chunk queue before new message
      chunkQueueRef.current = [];

      // Use the submit method to send messages
      if (streamContext?.submit) {
        await streamContext.submit({
          messages: [userMessage]
        });
      } else {
        throw new Error('Submit method not available on stream context');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(
        'Error',
        'Failed to send message. Please check your connection and try again.\n\nError: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  }, [streamContext, addMessage, chunkQueueRef, session]);

  return { handleRealMessage };
};