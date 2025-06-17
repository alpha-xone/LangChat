import { Message } from '@langchain/langgraph-sdk';
import { useCallback } from 'react';
import { simulateDemoResponse } from '../lib/demo-utils';
import { generateMessageId } from '../lib/message-utils';

interface UseDemoMessageHandlerProps {
  addMessage: (message: Message) => void;
}

export const useDemoMessageHandler = ({ addMessage }: UseDemoMessageHandlerProps) => {
  const handleDemoMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message immediately
    const humanMessage: Message = {
      id: generateMessageId(),
      type: 'human',
      content: text.trim(),
    };
    addMessage(humanMessage);

    // Simulate AI response
    simulateDemoResponse(text.trim(), addMessage);
  }, [addMessage]);

  return { handleDemoMessage };
};