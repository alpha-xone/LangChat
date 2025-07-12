import type { StreamEvent } from './LangGraphClient';

export interface ParsedMessage {
  id: string;
  type: 'human' | 'ai' | 'system' | 'assistant' | 'tool';
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
  isComplete: boolean;
}

export interface StreamState {
  messages: ParsedMessage[];
  isLoading: boolean;
  currentMessage?: ParsedMessage;
  error?: string;
}

export class StreamParser {
  private messageBuffer: Map<string, Partial<ParsedMessage>> = new Map();
  private callbacks: {
    onMessage?: (message: ParsedMessage) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
  } = {};

  constructor(callbacks?: {
    onMessage?: (message: ParsedMessage) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
  }) {
    this.callbacks = callbacks || {};
  }

  /**
   * Parse a stream event and extract message data
   */
  parseStreamEvent(event: StreamEvent): ParsedMessage | null {
    try {
      // Safety check for event structure
      if (!event || typeof event !== 'object') {
        console.warn('Invalid stream event received:', event);
        return null;
      }

      // Ensure event has required properties
      const eventType = event.event || 'unknown';
      const eventData = event.data;

      switch (eventType) {
        case 'messages/partial':
        case 'messages/complete':
          return this.parseMessageEvent(event);

        case 'error':
          this.handleError(event);
          return null;

        case 'end':
          this.handleStreamEnd();
          return null;

        default:
          // Log unknown event types for debugging
          console.debug('Unknown stream event type:', eventType, eventData);
          return null;
      }
    } catch (error) {
      console.error('Error parsing stream event:', error);
      // Provide more specific error message
      if (error instanceof TypeError && error.message.includes('body')) {
        console.error('Body access error - this usually indicates an API configuration issue');
        this.callbacks.onError?.('API configuration error: Please check your LangGraph settings');
      } else {
        this.callbacks.onError?.('Failed to parse message');
      }
      return null;
    }
  }

  /**
   * Parse message-specific events
   */
  private parseMessageEvent(event: StreamEvent): ParsedMessage | null {
    const data = event.data;

    // Enhanced safety checks
    if (!data) {
      console.debug('No data in message event');
      return null;
    }

    if (typeof data !== 'object') {
      console.warn('Invalid data type in message event:', typeof data);
      return null;
    }

    // Extract message data based on LangGraph stream format
    const messageData = this.extractMessageData(data);
    if (!messageData) {
      console.debug('Could not extract message data from event');
      return null;
    }

    const messageId = messageData.id || this.generateMessageId();
    const isComplete = event.event === 'messages/complete';

    // Update or create message in buffer
    const existingMessage = this.messageBuffer.get(messageId) || {};
    const updatedMessage: ParsedMessage = {
      id: messageId,
      type: messageData.type || 'ai',
      content: messageData.content || existingMessage.content || '',
      metadata: { ...existingMessage.metadata, ...messageData.metadata },
      timestamp: messageData.timestamp || existingMessage.timestamp || new Date().toISOString(),
      isComplete,
    };

    // Store in buffer
    this.messageBuffer.set(messageId, updatedMessage);

    // Notify callback
    this.callbacks.onMessage?.(updatedMessage);

    return updatedMessage;
  }

  /**
   * Extract message data from stream event data
   */
  private extractMessageData(data: any): {
    id?: string;
    type?: 'human' | 'ai' | 'system' | 'assistant' | 'tool';
    content?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  } | null {
    // Safety check for undefined or null data
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Handle different data structures that might come from LangGraph
    if (data.messages && Array.isArray(data.messages)) {
      // Extract the latest message
      const lastMessage = data.messages[data.messages.length - 1];
      return this.extractSingleMessage(lastMessage);
    }

    if (data.message) {
      return this.extractSingleMessage(data.message);
    }

    // Handle case where data might have a body property
    if (data.body && typeof data.body === 'object') {
      return this.extractMessageData(data.body);
    }

    // Direct message data
    return this.extractSingleMessage(data);
  }

  /**
   * Extract data from a single message object
   */
  private extractSingleMessage(message: any): {
    id?: string;
    type?: 'human' | 'ai' | 'system' | 'assistant' | 'tool';
    content?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  } | null {
    if (!message || typeof message !== 'object') {
      return null;
    }

    return {
      id: message.id,
      type: this.normalizeMessageType(message.type || message.role),
      content: this.extractContent(message),
      metadata: message.metadata || message.additional_kwargs,
      timestamp: message.timestamp || message.created_at,
    };
  }

  /**
   * Extract content from various message formats
   */
  private extractContent(message: any): string {
    if (typeof message.content === 'string') {
      return message.content;
    }

    if (Array.isArray(message.content)) {
      // Handle content blocks (text, images, etc.)
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

  /**
   * Normalize message type from various formats
   */
  private normalizeMessageType(type: string): 'human' | 'ai' | 'system' | 'assistant' | 'tool' {
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

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle error events
   */
  private handleError(event: StreamEvent): void {
    const errorMessage = event.data?.error || event.data?.message || 'Unknown error occurred';
    this.callbacks.onError?.(errorMessage);
  }

  /**
   * Handle stream end
   */
  private handleStreamEnd(): void {
    this.callbacks.onComplete?.();
  }

  /**
   * Get all parsed messages
   */
  getAllMessages(): ParsedMessage[] {
    return Array.from(this.messageBuffer.values())
      .filter((msg): msg is ParsedMessage =>
        msg.id !== undefined &&
        msg.type !== undefined &&
        msg.content !== undefined &&
        msg.timestamp !== undefined &&
        msg.isComplete !== undefined
      )
      .sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }

  /**
   * Clear the message buffer
   */
  clearBuffer(): void {
    this.messageBuffer.clear();
  }

  /**
   * Get a specific message by ID
   */
  getMessage(id: string): ParsedMessage | undefined {
    const msg = this.messageBuffer.get(id);
    if (!msg || !msg.id || !msg.type || !msg.content || !msg.timestamp || msg.isComplete === undefined) {
      return undefined;
    }
    return msg as ParsedMessage;
  }

  /**
   * Update callbacks
   */
  updateCallbacks(callbacks: {
    onMessage?: (message: ParsedMessage) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}
