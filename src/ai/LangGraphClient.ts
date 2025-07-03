import { Client } from '@langchain/langgraph-sdk';
import type { Message } from '../types';
import { AuthService } from '../data/AuthService';

export class LangGraphClient {
  private client: Client;
  private authService: AuthService;

  constructor(apiUrl: string, apiKey?: string) {
    this.client = new Client({
      apiUrl,
      apiKey,
    });
    this.authService = new AuthService();
  }

  async sendMessage(
    threadId: string,
    message: string,
    attachments?: any[]
  ): Promise<string> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await this.client.threads.createRun(threadId, {
        assistantId: 'default',
        input: {
          message,
          attachments: attachments || [],
        },
        config: {
          headers,
        },
      });

      return response.id;
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  async *streamMessages(threadId: string, runId: string) {
    try {
      const stream = this.client.runs.stream(threadId, runId);

      for await (const chunk of stream) {
        if (chunk.event === 'messages/partial') {
          yield this.parseStreamChunk(chunk.data);
        }
      }
    } catch (error) {
      throw new Error(`Failed to stream messages: ${error}`);
    }
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    try {
      const messages = await this.client.threads.getMessages(threadId);
      return messages.map(this.mapLangGraphMessage);
    } catch (error) {
      throw new Error(`Failed to get thread messages: ${error}`);
    }
  }

  async createThread(): Promise<string> {
    try {
      const thread = await this.client.threads.create({
        metadata: {
          createdAt: new Date().toISOString(),
        },
      });
      return thread.id;
    } catch (error) {
      throw new Error(`Failed to create thread: ${error}`);
    }
  }

  private parseStreamChunk(chunk: any): Partial<Message> {
    return {
      type: chunk.type || 'ai',
      content: chunk.content || '',
      metadata: chunk.metadata || {},
    };
  }

  private mapLangGraphMessage(message: any): Message {
    return {
      id: message.id,
      threadId: message.thread_id,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      createdAt: new Date(message.created_at),
      updatedAt: new Date(message.updated_at),
    };
  }
}
