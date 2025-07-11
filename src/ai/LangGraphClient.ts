import { Client } from '@langchain/langgraph-sdk';
import type { Thread } from '@langchain/langgraph-sdk';

export interface LangGraphConfig {
  apiUrl: string;
  assistantId: string;
  accessToken: string;
  onTokenRefresh?: () => Promise<string>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool' | 'human' | 'ai';
  content: string;
  timestamp?: Date;
  id?: string;
}

export interface StreamingResponse {
  event: string;
  data: any;
}

export interface ThreadCreationResult {
  threadId: string;
  thread: Thread;
}

/**
 * LangGraph client for handling AI chat interactions
 * Manages thread creation, message streaming, and session management
 */
export class LangGraphClient {
  private client: Client;
  private config: LangGraphConfig;

  constructor(config: LangGraphConfig) {
    this.config = config;
    this.client = new Client({
      apiUrl: config.apiUrl,
      defaultHeaders: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update the access token for authentication
   */
  updateAccessToken(accessToken: string): void {
    this.config.accessToken = accessToken;
    this.client = new Client({
      apiUrl: this.config.apiUrl,
      defaultHeaders: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new thread for conversation
   */
  async createThread(): Promise<ThreadCreationResult> {
    try {
      const thread = await this.client.threads.create();
      const threadId = thread.thread_id;

      console.log('[LangGraphClient] Created new thread:', threadId);

      return {
        threadId,
        thread,
      };
    } catch (error) {
      console.error('[LangGraphClient] Failed to create thread:', error);

      if (this.isTokenExpiredError(error) && this.config.onTokenRefresh) {
        try {
          console.log('[LangGraphClient] Token expired during thread creation, attempting refresh and retry...');
          await this.refreshTokenAndUpdateClient();

          // Retry thread creation with refreshed token
          const thread = await this.client.threads.create();
          const threadId = thread.thread_id;

          console.log('[LangGraphClient] Created new thread after token refresh:', threadId);
          return {
            threadId,
            thread,
          };
        } catch (refreshError) {
          console.error('[LangGraphClient] Token refresh failed during thread creation:', refreshError);
          throw new Error(`Failed to create thread after token refresh: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(`Failed to create thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Get an existing thread by ID
   */
  async getThread(threadId: string): Promise<Thread> {
    try {
      const thread = await this.client.threads.get(threadId);
      console.log('[LangGraphClient] Retrieved thread:', threadId);
      return thread;
    } catch (error) {
      console.error('[LangGraphClient] Failed to get thread:', threadId, error);

      if (this.isTokenExpiredError(error) && this.config.onTokenRefresh) {
        try {
          console.log('[LangGraphClient] Token expired during thread retrieval, attempting refresh and retry...');
          await this.refreshTokenAndUpdateClient();

          // Retry thread retrieval with refreshed token
          const thread = await this.client.threads.get(threadId);
          console.log('[LangGraphClient] Retrieved thread after token refresh:', threadId);
          return thread;
        } catch (refreshError) {
          console.error('[LangGraphClient] Token refresh failed during thread retrieval:', refreshError);
          throw new Error(`Failed to get thread after token refresh: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(`Failed to get thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Send a message and get streaming response
   */
  async *streamMessage(
    threadId: string,
    message: string,
    options?: {
      context?: Record<string, any>;
      metadata?: Record<string, any>;
    }
  ): AsyncGenerator<StreamingResponse, void, unknown> {
    const attemptStream = async function* (this: LangGraphClient): AsyncGenerator<StreamingResponse, void, unknown> {
      console.log('[LangGraphClient] Starting stream for thread:', threadId, 'message:', message.substring(0, 100) + '...');

      console.log('[LangGraphClient] Streaming message:', message);
      console.log('[LangGraphClient] Token:', this.config.accessToken);
      const streamResponse = this.client.runs.stream(
        threadId,
        this.config.assistantId,
        {
          input: {
            messages: [
              { role: 'user', content: message }
            ],
            ...options?.context,
          },
          streamMode: 'messages',
          ...options?.metadata,
        }
      );

      for await (const chunk of streamResponse) {
        if (chunk.event === "messages/partial") {
          for (const messageChunk of chunk.data) {
            console.log(messageChunk);
            const contentText = typeof messageChunk.content === 'string'
              ? messageChunk.content
              : Array.isArray(messageChunk.content)
                ? messageChunk.content.map(c => {
                    if (typeof c === 'string') return c;
                    if (c && typeof c === 'object' && 'text' in c) return c.text || '';
                    return '';
                  }).join('')
                : '';
            if (contentText && contentText.trim() !== "") {
              console.log('[LangGraphClient] Chunk content:', contentText);
              yield {
                event: chunk.event,
                data: [messageChunk],
              };
            }
          }
        }
      }

      console.log('[LangGraphClient] Stream completed for thread:', threadId);
    }.bind(this);

    try {
      yield* attemptStream();
    } catch (error) {
      console.error('[LangGraphClient] Stream error:', error);

      if (this.isTokenExpiredError(error) && this.config.onTokenRefresh) {
        try {
          console.log('[LangGraphClient] Token expired, attempting refresh and retry...');
          await this.refreshTokenAndUpdateClient();

          // Retry streaming with refreshed token
          yield* attemptStream();
        } catch (refreshError) {
          console.error('[LangGraphClient] Token refresh failed:', refreshError);
          throw new Error(`Streaming failed after token refresh: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(`Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Get thread history/messages
   */
  async getThreadMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const state = await this.client.threads.getState(threadId);
      const messages = (state.values as any)?.messages || [];

      console.log('[LangGraphClient] Retrieved', messages.length, 'messages for thread:', threadId);

      return messages.map((msg: any, index: number) => ({
        id: msg.id || `msg-${index}`,
        role: this.normalizeRole(msg.role || msg.type),
        content: msg.content || '',
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
    } catch (error) {
      console.error('[LangGraphClient] Failed to get thread messages:', error);

      if (this.isTokenExpiredError(error) && this.config.onTokenRefresh) {
        try {
          console.log('[LangGraphClient] Token expired during message retrieval, attempting refresh and retry...');
          await this.refreshTokenAndUpdateClient();

          // Retry message retrieval with refreshed token
          const state = await this.client.threads.getState(threadId);
          const messages = (state.values as any)?.messages || [];

          console.log('[LangGraphClient] Retrieved', messages.length, 'messages for thread after token refresh:', threadId);

          return messages.map((msg: any, index: number) => ({
            id: msg.id || `msg-${index}`,
            role: this.normalizeRole(msg.role || msg.type),
            content: msg.content || '',
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
        } catch (refreshError) {
          console.error('[LangGraphClient] Token refresh failed during message retrieval:', refreshError);
          throw new Error(`Failed to get messages after token refresh: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Cancel a running stream/run
   */
  async cancelRun(threadId: string, runId: string): Promise<void> {
    try {
      await this.client.runs.cancel(threadId, runId);
      console.log('[LangGraphClient] Cancelled run:', runId, 'for thread:', threadId);
    } catch (error) {
      console.error('[LangGraphClient] Failed to cancel run:', error);
      throw new Error(`Failed to cancel run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string): Promise<void> {
    try {
      await this.client.threads.delete(threadId);
      console.log('[LangGraphClient] Deleted thread:', threadId);
    } catch (error) {
      console.error('[LangGraphClient] Failed to delete thread:', error);
      throw new Error(`Failed to delete thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check client health/connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to create and immediately delete a test thread
      const testThread = await this.createThread();
      await this.deleteThread(testThread.threadId);
      console.log('[LangGraphClient] Health check passed');
      return true;
    } catch (error) {
      console.error('[LangGraphClient] Health check failed:', error);
      return false;
    }
  }

  /**
   * Normalize role names from LangGraph to standard chat roles
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

    return roleMap[role.toLowerCase()] || 'assistant';
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<LangGraphConfig> {
    return { ...this.config };
  }

  /**
   * Extract text content from streaming response chunks
   * Helper method to easily get text from messages/partial events
   */
  static extractStreamingText(chunk: StreamingResponse): string[] {
    const textChunks: string[] = [];

    if (chunk.event === "messages/partial" && Array.isArray(chunk.data)) {
      for (const messageChunk of chunk.data) {
        if (messageChunk.content) {
          textChunks.push(messageChunk.content);
        }
      }
    }

    return textChunks;
  }

  /**
   * Check if an error indicates token expiry
   */
  private isTokenExpiredError(error: any): boolean {
    if (!error) return false;

    // Check for common token expiry indicators
    const errorMessage = error.message || error.toString() || '';
    const errorStatus = error.status || error.statusCode || 0;

    return (
      errorStatus === 401 ||
      errorStatus === 403 ||
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('token') ||
      errorMessage.toLowerCase().includes('expired') ||
      errorMessage.toLowerCase().includes('invalid')
    );
  }

  /**
   * Refresh token and update client
   */
  private async refreshTokenAndUpdateClient(): Promise<void> {
    if (!this.config.onTokenRefresh) {
      throw new Error('Token refresh callback not provided');
    }

    try {
      console.log('[LangGraphClient] Refreshing access token...');
      const newToken = await this.config.onTokenRefresh();
      this.updateAccessToken(newToken);
      console.log('[LangGraphClient] Access token refreshed successfully');
    } catch (error) {
      console.error('[LangGraphClient] Failed to refresh token:', error);
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Create a LangGraph client instance
 */
export function createLangGraphClient(config: LangGraphConfig): LangGraphClient {
  return new LangGraphClient(config);
}
