import type { Message } from '../types';

export class StreamParser {
  private buffer: string = '';
  private messageBuffer: Partial<Message> = {};

  parseStreamChunk(chunk: string): Message[] {
    this.buffer += chunk;
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
          // Skip invalid lines
        }
      }
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

    return null;
  }

  private processMessageChunk(chunk: any): Message | null {
    if (!chunk || !chunk.type) {
      return null;
    }

    // Handle different message types from LangGraph
    switch (chunk.type) {
      case 'message_start':
        this.messageBuffer = {
          id: chunk.id,
          type: chunk.message_type || 'ai',
          content: '',
          metadata: chunk.metadata || {},
        };
        return null;

      case 'message_delta':
        if (this.messageBuffer.content !== undefined) {
          this.messageBuffer.content += chunk.delta || '';
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
          type: 'tool',
          content: chunk.content || JSON.stringify(chunk.tool_call),
          metadata: {
            toolName: chunk.tool_name,
            toolCall: chunk.tool_call,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Message;

      case 'system_message':
        return {
          id: chunk.id || `system_${Date.now()}`,
          type: 'system',
          content: chunk.content || '',
          metadata: chunk.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Message;

      default:
        return null;
    }
  }

  reset(): void {
    this.buffer = '';
    this.messageBuffer = {};
  }

  getBufferState(): { buffer: string; messageBuffer: Partial<Message> } {
    return {
      buffer: this.buffer,
      messageBuffer: { ...this.messageBuffer },
    };
  }
}
