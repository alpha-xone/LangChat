import { Client } from '@langchain/langgraph-sdk';
import type { Message } from '../types';

export interface LangGraphConfig {
  apiUrl: string;
  apiKey?: string;
  defaultAssistantId?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface StreamingOptions {
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class LangGraphClient {
  private client: Client;
  // private _authService: AuthService; // Unused for now
  private config: LangGraphConfig;

  constructor(config: LangGraphConfig) {
    this.config = {
      defaultAssistantId: 'default',
      timeout: 30000,
      retryAttempts: 3,
      ...config,
    };

    this.client = new Client({
      apiUrl: this.config.apiUrl,
      apiKey: this.config.apiKey,
    });

    // this._authService = new AuthService(); // Unused for now
  }

  async sendMessage(
    threadId: string,
    message: string,
    attachments?: any[],
    options?: {
      assistantId?: string;
      metadata?: Record<string, any>;
      signal?: AbortSignal;
    }
  ): Promise<string> {
    try {
      const response = await this.client.runs.create(threadId, options?.assistantId || this.config.defaultAssistantId || 'default', {
        input: {
          message,
          attachments: attachments || [],
          metadata: options?.metadata || {},
        },
      });

      return response.run_id;
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  async *streamMessages(
    threadId: string,
    runId: string,
    options?: StreamingOptions
  ): AsyncGenerator<Partial<Message>, void, unknown> {
    try {
      const stream = this.client.runs.stream(threadId, runId, {
        signal: options?.signal,
      });

      for await (const chunk of stream) {
        if (options?.signal?.aborted) {
          break;
        }

        if (chunk.event === 'messages/partial') {
          const partialMessage = this.parseStreamChunk(chunk.data);

          if (partialMessage.content && options?.onToken) {
            options.onToken(partialMessage.content);
          }

          yield partialMessage;
        }
      }

      options?.onComplete?.();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(`Failed to stream messages: ${error}`);
      options?.onError?.(errorObj);
      throw errorObj;
    }
  }

  async sendStreamingMessage(
    threadId: string,
    message: string,
    attachments?: any[],
    options?: StreamingOptions & {
      assistantId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<AsyncGenerator<Partial<Message>, void, unknown>> {
    try {
      const runId = await this.sendMessage(threadId, message, attachments, {
        assistantId: options?.assistantId,
        metadata: options?.metadata,
        signal: options?.signal,
      });

      return this.streamMessages(threadId, runId, options);
    } catch (error) {
      throw new Error(`Failed to send streaming message: ${error}`);
    }
  }

  async getThreadMessages(threadId: string, _options?: {
    limit?: number;
    before?: string;
    after?: string;
  }): Promise<Message[]> {
    try {
      // Mock implementation - replace with actual API call when available
      await this.client.threads.getState(threadId);

      return [];
    } catch (error) {
      throw new Error(`Failed to get thread messages: ${error}`);
    }
  }

  async createThread(metadata?: Record<string, any>): Promise<string> {
    try {
      const thread = await this.client.threads.create({
        metadata: {
          createdAt: new Date().toISOString(),
          ...metadata,
        },
      });
      return thread.thread_id;
    } catch (error) {
      throw new Error(`Failed to create thread: ${error}`);
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    try {
      await this.client.threads.delete(threadId);
    } catch (error) {
      throw new Error(`Failed to delete thread: ${error}`);
    }
  }

  async updateThread(threadId: string, metadata: Record<string, any>): Promise<void> {
    try {
      await this.client.threads.updateState(threadId, {
        values: metadata,
      });
    } catch (error) {
      throw new Error(`Failed to update thread: ${error}`);
    }
  }

  async getRunStatus(threadId: string, runId: string): Promise<{
    status: 'pending' | 'success' | 'error' | 'timeout' | 'interrupted';
    completedAt?: string;
    error?: string;
  }> {
    try {
      const run = await this.client.runs.get(threadId, runId);

      // Map run status to expected values
      let mappedStatus: 'pending' | 'success' | 'error' | 'timeout' | 'interrupted';
      switch (run.status) {
        case 'running':
          mappedStatus = 'pending';
          break;
        case 'success':
          mappedStatus = 'success';
          break;
        case 'error':
          mappedStatus = 'error';
          break;
        case 'timeout':
          mappedStatus = 'timeout';
          break;
        case 'interrupted':
          mappedStatus = 'interrupted';
          break;
        default:
          mappedStatus = 'pending';
      }

      return {
        status: mappedStatus,
        completedAt: run.updated_at || run.created_at,
        error: run.status === 'error' ? 'Run failed' : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to get run status: ${error}`);
    }
  }

  async cancelRun(threadId: string, runId: string): Promise<void> {
    try {
      await this.client.runs.cancel(threadId, runId);
    } catch (error) {
      throw new Error(`Failed to cancel run: ${error}`);
    }
  }

  async waitForRun(
    threadId: string,
    runId: string,
    options?: {
      timeout?: number;
      pollInterval?: number;
    }
  ): Promise<void> {
    const timeout = options?.timeout || this.config.timeout || 30000;
    const pollInterval = options?.pollInterval || 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getRunStatus(threadId, runId);

      if (status.status === 'success') {
        return;
      }

      if (status.status === 'error') {
        throw new Error(`Run failed: ${status.error}`);
      }

      if (status.status === 'interrupted') {
        throw new Error('Run was interrupted');
      }

      await this.sleep(pollInterval);
    }

    throw new Error('Run timeout');
  }

  async getAvailableAssistants(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    model?: string;
    tools?: string[];
  }>> {
    try {
      const assistants = await this.client.assistants.search();
      return assistants.map(assistant => ({
        id: assistant.assistant_id,
        name: assistant.name || 'Unnamed Assistant',
        description: undefined,
        model: undefined,
        tools: [],
      }));
    } catch (error) {
      throw new Error(`Failed to get assistants: ${error}`);
    }
  }

  async createAssistant(config: {
    name: string;
    graphId: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      const assistant = await this.client.assistants.create({
        graphId: config.graphId,
        name: config.name,
        metadata: config.metadata || {},
      });
      return assistant.assistant_id;
    } catch (error) {
      throw new Error(`Failed to create assistant: ${error}`);
    }
  }

  async updateAssistant(assistantId: string, updates: {
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.client.assistants.update(assistantId, updates);
    } catch (error) {
      throw new Error(`Failed to update assistant: ${error}`);
    }
  }

  async deleteAssistant(assistantId: string): Promise<void> {
    try {
      await this.client.assistants.delete(assistantId);
    } catch (error) {
      throw new Error(`Failed to delete assistant: ${error}`);
    }
  }

  // Utility methods
  private parseStreamChunk(chunk: any): Partial<Message> {
    return {
      type: chunk.type === 'human' ? 'user' : (chunk.type || 'ai'),
      content: chunk.content || '',
      metadata: chunk.metadata || {},
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.assistants.search({ limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Configuration methods
  getConfig(): LangGraphConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<LangGraphConfig>): void {
    this.config = { ...this.config, ...updates };
  }

}

// Export singleton instance
export const langGraphClient = new LangGraphClient({
  apiUrl: process.env.LANGGRAPH_API_URL || '',
  apiKey: process.env.LANGGRAPH_API_KEY,
});
