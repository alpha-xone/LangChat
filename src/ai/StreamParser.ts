import type { Message } from '../types';

export interface StreamEvent {
  type: string;
  data?: any;
  id?: string;
  event?: string;
  retry?: number;
}

export interface StreamParserOptions {
  maxBufferSize?: number;
  timeout?: number;
  onError?: (error: Error) => void;
  onEvent?: (event: StreamEvent) => void;
}

export class StreamParser {
  private buffer: string = '';
  private messageBuffer: Partial<Message> = {};
  private options: StreamParserOptions;
  private eventQueue: StreamEvent[] = [];

  constructor(options: StreamParserOptions = {}) {
    this.options = {
      maxBufferSize: 1024 * 1024, // 1MB default
      timeout: 30000, // 30 seconds
      ...options,
    };
  }

  parseStreamChunk(chunk: string): Message[] {
    this.buffer += chunk;

    // Check buffer size limit
    if (this.buffer.length > (this.options.maxBufferSize || 1024 * 1024)) {
      this.options.onError?.(new Error('Stream buffer size exceeded'));
      this.reset();
      return [];
    }

    const messages: Message[] = [];

    // Split by newlines to process individual events
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = this.parseSSELine(line);
          if (parsed) {
            messages.push(parsed);
          }
        } catch (error) {
          this.options.onError?.(error instanceof Error ? error : new Error('Parse error'));
        }
      }
    }

    return messages;
  }

  parseJSONStream(chunk: string): Message[] {
    const messages: Message[] = [];

    try {
      // Handle JSONL (JSON Lines) format
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim()) {
          const parsed = JSON.parse(line);
          const message = this.processMessageChunk(parsed);
          if (message) {
            messages.push(message);
          }
        }
      }
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error : new Error('JSON parse error'));
    }

    return messages;
  }

  private parseSSELine(line: string): Message | null {
    // Handle Server-Sent Events format
    if (line.startsWith('data: ')) {
      const data = line.substring(6);
      if (data === '[DONE]') {
        return null;
      }

      try {
        const parsed = JSON.parse(data);
        return this.processMessageChunk(parsed);
      } catch (error) {
        return null;
      }
    }

    // Handle other SSE fields
    if (line.startsWith('event: ')) {
      const event = line.substring(7);
      this.eventQueue.push({ type: 'event', event });
      this.options.onEvent?.({ type: 'event', event });
    }

    if (line.startsWith('id: ')) {
      const id = line.substring(4);
      this.eventQueue.push({ type: 'id', id });
      this.options.onEvent?.({ type: 'id', id });
    }

    if (line.startsWith('retry: ')) {
      const retry = parseInt(line.substring(7), 10);
      this.eventQueue.push({ type: 'retry', retry });
      this.options.onEvent?.({ type: 'retry', retry });
    }

    return null;
  }

  private processMessageChunk(chunk: any): Message | null {
    if (!chunk || typeof chunk !== 'object') {
      return null;
    }

    // Handle different message types from LangGraph
    switch (chunk.type) {
      case 'message_start':
        this.messageBuffer = {
          id: chunk.id,
          threadId: chunk.thread_id,
          type: this.mapMessageType(chunk.message_type || 'ai'),
          content: '',
          metadata: chunk.metadata || {},
          attachments: chunk.attachments || [],
        };
        return null;

      case 'message_delta':
        if (this.messageBuffer.content !== undefined) {
          this.messageBuffer.content += chunk.delta || '';
        }
        if (chunk.metadata) {
          this.messageBuffer.metadata = {
            ...this.messageBuffer.metadata,
            ...chunk.metadata,
          };
        }
        return null;

      case 'message_end':
        if (this.messageBuffer.id) {
          const completeMessage = {
            ...this.messageBuffer,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Message;

          this.messageBuffer = {};
          return completeMessage;
        }
        return null;

      case 'tool_call':
        return {
          id: chunk.id || `tool_${Date.now()}`,
          threadId: chunk.thread_id || '',
          type: 'tool',
          content: chunk.content || JSON.stringify(chunk.tool_call),
          metadata: {
            toolName: chunk.tool_name,
            toolCall: chunk.tool_call,
            toolId: chunk.tool_id,
          },
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Message;

      case 'system_message':
        return {
          id: chunk.id || `system_${Date.now()}`,
          threadId: chunk.thread_id || '',
          type: 'system',
          content: chunk.content || '',
          metadata: chunk.metadata || {},
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Message;

      case 'error':
        this.options.onError?.(new Error(chunk.message || 'Stream error'));
        return null;

      case 'ping':
        // Heartbeat - no action needed
        return null;

      default:
        // Try to parse as a generic message
        if (chunk.content) {
          return {
            id: chunk.id || `msg_${Date.now()}`,
            threadId: chunk.thread_id || '',
            type: this.mapMessageType(chunk.type || 'ai'),
            content: chunk.content,
            metadata: chunk.metadata || {},
            attachments: chunk.attachments || [],
            createdAt: new Date(chunk.created_at || Date.now()),
            updatedAt: new Date(chunk.updated_at || Date.now()),
          } as Message;
        }
        return null;
    }
  }

  private mapMessageType(type: string): Message['type'] {
    switch (type.toLowerCase()) {
      case 'human':
      case 'user':
        return 'user';
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

  // Parse OpenAI-style streaming chunks
  parseOpenAIChunk(chunk: string): Message[] {
    const messages: Message[] = [];

    try {
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

      for (const line of lines) {
        const data = line.substring(6).trim();
        if (data === '[DONE]') {
          continue;
        }

        const parsed = JSON.parse(data);
        if (parsed.choices && parsed.choices.length > 0) {
          const choice = parsed.choices[0];
          const delta = choice.delta;

          if (delta.content) {
            // Create or update message
            const message: Message = {
              id: parsed.id || `msg_${Date.now()}`,
              threadId: parsed.thread_id || '',
              type: 'ai',
              content: delta.content,
              metadata: {
                model: parsed.model,
                finishReason: choice.finish_reason,
                usage: parsed.usage,
              },
              attachments: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            messages.push(message);
          }
        }
      }
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error : new Error('OpenAI parse error'));
    }

    return messages;
  }

  // Parse Anthropic-style streaming chunks
  parseAnthropicChunk(chunk: string): Message[] {
    const messages: Message[] = [];

    try {
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

      for (const line of lines) {
        const data = line.substring(6).trim();
        if (data === '[DONE]') {
          continue;
        }

        const parsed = JSON.parse(data);

        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          const message: Message = {
            id: parsed.message?.id || `msg_${Date.now()}`,
            threadId: parsed.thread_id || '',
            type: 'ai',
            content: parsed.delta.text,
            metadata: {
              model: parsed.model,
              usage: parsed.usage,
            },
            attachments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          messages.push(message);
        }
      }
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error : new Error('Anthropic parse error'));
    }

    return messages;
  }

  reset(): void {
    this.buffer = '';
    this.messageBuffer = {};
    this.eventQueue = [];
  }

  getBufferState(): {
    buffer: string;
    messageBuffer: Partial<Message>;
    eventQueue: StreamEvent[];
  } {
    return {
      buffer: this.buffer,
      messageBuffer: { ...this.messageBuffer },
      eventQueue: [...this.eventQueue],
    };
  }

  getMessageBuffer(): Partial<Message> {
    return { ...this.messageBuffer };
  }

  hasIncompleteMessage(): boolean {
    return Object.keys(this.messageBuffer).length > 0;
  }

  setMessageBuffer(message: Partial<Message>): void {
    this.messageBuffer = { ...message };
  }

  // Utility methods
  static isValidSSEChunk(chunk: string): boolean {
    return chunk.includes('data: ') || chunk.includes('event: ') || chunk.includes('id: ');
  }

  static isValidJSONChunk(chunk: string): boolean {
    try {
      JSON.parse(chunk);
      return true;
    } catch {
      return false;
    }
  }

  static detectStreamFormat(chunk: string): 'sse' | 'json' | 'openai' | 'anthropic' | 'unknown' {
    if (chunk.includes('data: ')) {
      if (chunk.includes('choices') && chunk.includes('delta')) {
        return 'openai';
      }
      if (chunk.includes('content_block_delta')) {
        return 'anthropic';
      }
      return 'sse';
    }

    if (StreamParser.isValidJSONChunk(chunk)) {
      return 'json';
    }

    return 'unknown';
  }
}

// Export singleton instance
export const streamParser = new StreamParser();
