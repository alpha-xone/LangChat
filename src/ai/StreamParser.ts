import type { StreamingResponse, ChatMessage } from './LangGraphClient';

export interface ParsedMessage {
  id: string;
  role: ChatMessage['role'];
  content: string;
  isComplete: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface StreamParserEvents {
  onMessageStart: (message: ParsedMessage) => void;
  onMessageUpdate: (message: ParsedMessage) => void;
  onMessageComplete: (message: ParsedMessage) => void;
  onError: (error: Error) => void;
  onStreamComplete: () => void;
}

/**
 * Stream parser for handling LangGraph streaming responses
 * Handles incremental content updates and message reconstruction
 */
export class StreamParser {
  private currentMessage: ParsedMessage | null = null;
  private events: StreamParserEvents;
  private isProcessing = false;

  constructor(events: StreamParserEvents) {
    this.events = events;
  }

  /**
   * Process a streaming response chunk
   */
  async processChunk(response: StreamingResponse): Promise<void> {
    try {
      console.log('[StreamParser] Processing chunk:', {
        event: response.event,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'n/a',
        data: response.data
      });

      switch (response.event) {
        case 'messages/partial':
          await this.handlePartialMessage(response.data);
          break;

        case 'messages/complete':
          await this.handleCompleteMessage(response.data);
          break;

        case 'data':
          // Handle generic data events that might contain messages
          console.log('[StreamParser] Handling data event:', response.data);
          if (Array.isArray(response.data)) {
            await this.handlePartialMessage(response.data);
          }
          break;

        case 'run/start':
          console.log('[StreamParser] Run started');
          this.isProcessing = true;
          break;

        case 'run/end':
          console.log('[StreamParser] Run ended');
          await this.finalizeCurrentMessage();
          this.isProcessing = false;
          this.events.onStreamComplete();
          break;

        case 'error':
          this.handleError(response.data);
          break;

        default:
          console.log('[StreamParser] Unhandled event:', response.event, 'with data:', response.data);
          // Try to extract messages from any unhandled events that might contain them
          if (response.data && Array.isArray(response.data)) {
            const potentialMessages = response.data.filter(item =>
              item && typeof item === 'object' && ('content' in item || 'message' in item)
            );
            if (potentialMessages.length > 0) {
              console.log('[StreamParser] Found potential messages in unhandled event:', potentialMessages);
              await this.handlePartialMessage(potentialMessages);
            }
          }
      }
    } catch (error) {
      console.error('[StreamParser] Error processing chunk:', error);
      this.events.onError(error instanceof Error ? error : new Error('Unknown parsing error'));
    }
  }

  /**
   * Handle partial message chunks (incremental content)
   */
  private async handlePartialMessage(data: any[]): Promise<void> {
    console.log('[StreamParser] handlePartialMessage called with:', data);

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('[StreamParser] No valid data array in partial message');
      return;
    }

    for (const messageChunk of data) {
      console.log('[StreamParser] Processing message chunk:', messageChunk);

      // Handle different possible message structures
      let content = '';
      let messageId = '';
      let role = 'assistant';

      if (typeof messageChunk === 'string') {
        content = messageChunk;
        messageId = `msg-${Date.now()}`;
      } else if (messageChunk && typeof messageChunk === 'object') {
        // Try different possible content fields
        content = messageChunk.content ||
                 messageChunk.message ||
                 messageChunk.text ||
                 (typeof messageChunk.data === 'string' ? messageChunk.data : '') ||
                 '';

        messageId = messageChunk.id ||
                   messageChunk.message_id ||
                   `msg-${Date.now()}`;

        role = messageChunk.role ||
               messageChunk.type ||
               messageChunk.sender ||
               'assistant';
      }

      if (!content) {
        console.log('[StreamParser] No content found in message chunk, skipping');
        continue;
      }

      console.log('[StreamParser] Extracted content:', {
        id: messageId,
        role: role,
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + '...'
      });

      // Important: LangGraph sends incremental content, not delta
      // So messageChunk.content contains the full content up to this point
      const fullContent = content;

      if (!this.currentMessage) {
        // Start new message
        this.currentMessage = {
          id: messageId,
          role: this.normalizeRole(role),
          content: fullContent,
          isComplete: false,
          timestamp: new Date(),
          metadata: messageChunk.additional_kwargs || {},
        };

        console.log('[StreamParser] Starting new message:', this.currentMessage.id);
        this.events.onMessageStart({ ...this.currentMessage });
      } else {
        // Update existing message with new incremental content
        this.currentMessage.content = fullContent;
        this.currentMessage.timestamp = new Date();

        console.log('[StreamParser] Updating message content length:', fullContent.length);
        this.events.onMessageUpdate({ ...this.currentMessage });
      }
    }
  }

  /**
   * Handle complete message
   */
  private async handleCompleteMessage(data: any[]): Promise<void> {
    if (!data || !Array.isArray(data)) {
      return;
    }

    for (const messageData of data) {
      if (this.currentMessage && messageData.id === this.currentMessage.id) {
        // Finalize current message
        this.currentMessage.content = messageData.content || this.currentMessage.content;
        this.currentMessage.isComplete = true;

        console.log('[StreamParser] Message complete:', this.currentMessage.id, 'length:', this.currentMessage.content.length);
        this.events.onMessageComplete({ ...this.currentMessage });

        this.currentMessage = null;
      }
    }
  }

  /**
   * Handle errors in the stream
   */
  private handleError(error: any): void {
    console.error('[StreamParser] Stream error:', error);
    const errorObj = error instanceof Error ? error : new Error(error?.message || 'Stream error');
    this.events.onError(errorObj);

    // Reset state on error
    this.currentMessage = null;
    this.isProcessing = false;
  }

  /**
   * Finalize any pending message when stream ends
   */
  private async finalizeCurrentMessage(): Promise<void> {
    if (this.currentMessage && !this.currentMessage.isComplete) {
      console.log('[StreamParser] Finalizing pending message:', this.currentMessage.id);
      this.currentMessage.isComplete = true;
      this.events.onMessageComplete({ ...this.currentMessage });
      this.currentMessage = null;
    }
  }

  /**
   * Normalize role names
   */
  private normalizeRole(role: string): ChatMessage['role'] {
    const roleMap: Record<string, ChatMessage['role']> = {
      'human': 'user',
      'ai': 'assistant',
      'user': 'user',
      'assistant': 'assistant',
      'system': 'system',
      'tool': 'tool',
    };

    return roleMap[role?.toLowerCase()] || 'assistant';
  }

  /**
   * Reset parser state
   */
  reset(): void {
    console.log('[StreamParser] Resetting parser state');
    this.currentMessage = null;
    this.isProcessing = false;
  }

  /**
   * Check if parser is currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get current message being processed
   */
  getCurrentMessage(): ParsedMessage | null {
    return this.currentMessage ? { ...this.currentMessage } : null;
  }
}

/**
 * Create a stream parser with event handlers
 */
export function createStreamParser(events: StreamParserEvents): StreamParser {
  return new StreamParser(events);
}

/**
 * Utility function to create a basic stream parser with logging
 */
export function createLoggingStreamParser(
  onMessage: (message: ParsedMessage) => void,
  onError?: (error: Error) => void
): StreamParser {
  return new StreamParser({
    onMessageStart: (message) => {
      console.log('[StreamParser] Message started:', message.id);
      onMessage(message);
    },
    onMessageUpdate: (message) => {
      console.log('[StreamParser] Message updated:', message.id, 'length:', message.content.length);
      onMessage(message);
    },
    onMessageComplete: (message) => {
      console.log('[StreamParser] Message completed:', message.id, 'final length:', message.content.length);
      onMessage(message);
    },
    onError: (error) => {
      console.error('[StreamParser] Error:', error);
      onError?.(error);
    },
    onStreamComplete: () => {
      console.log('[StreamParser] Stream completed');
    },
  });
}
