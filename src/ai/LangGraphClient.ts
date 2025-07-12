import { Client } from '@langchain/langgraph-sdk';
import type { Thread } from '@langchain/langgraph-sdk';
import AuthService from '../data/AuthService';

export interface LangGraphConfig {
  apiUrl: string;
  assistantId: string;
  defaultHeaders?: Record<string, string>;
}

export interface ThreadMessage {
  type: 'human' | 'ai' | 'system' | 'assistant' | 'tool';
  content: string;
  id?: string;
  metadata?: Record<string, any>;
}

export interface StreamEvent {
  event: string;
  data: any;
  metadata?: Record<string, any>;
}

export class LangGraphClient {
  private client: Client;
  private config: LangGraphConfig;
  private authService: AuthService;

  constructor(config: LangGraphConfig, authService: AuthService) {
    this.config = config;
    this.authService = authService;

    // Initialize client without auth token - will be added per request
    this.client = new Client({
      apiUrl: config.apiUrl,
      defaultHeaders: {
        ...config.defaultHeaders,
      },
    });
  }

  /**
   * Create a new client instance with current access token
   */
  private async getAuthenticatedClient(): Promise<Client> {
    try {
      const accessToken = await this.authService.getAccessToken();

      return new Client({
        apiUrl: this.config.apiUrl,
        defaultHeaders: {
          ...this.config.defaultHeaders,
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      });
    } catch (error) {
      console.warn('Failed to get access token, using client without auth:', error);
      return this.client;
    }
  }

  /**
   * Get or create a thread for the current user
   */
  async getOrCreateThread(threadId?: string): Promise<Thread> {
    try {
      const client = await this.getAuthenticatedClient();

      if (threadId) {
        return await client.threads.get(threadId);
      } else {
        // Create a new thread with user metadata
        const user = await this.authService.getCurrentUser();
        return await client.threads.create({
          metadata: {
            userId: user?.id,
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Error getting/creating thread:', error);
      throw new Error('Failed to initialize chat thread');
    }
  }

  /**
   * Send a message and get streaming response
   */
  async *streamMessage(
    threadId: string,
    message: ThreadMessage,
    config?: { configurable?: Record<string, any> }
  ): AsyncGenerator<StreamEvent, void, unknown> {
    try {
      // Get authenticated client with current Supabase access token
      const client = await this.getAuthenticatedClient();

      // Start the run with streaming
      const runStream = client.runs.stream(threadId, this.config.assistantId, {
        input: {
          messages: [message],
        },
        config: config?.configurable ? { configurable: config.configurable } : undefined,
        streamMode: 'values',
      });

      // Process the stream with error handling
      for await (const chunk of runStream) {
        try {
          // Safely access chunk properties
          const event = chunk?.event || 'unknown';
          const data = chunk?.data || null;

          // Only yield valid chunks
          if (event && data !== null) {
            yield {
              event,
              data,
            };
          }
        } catch (chunkError) {
          console.warn('Error processing stream chunk:', chunkError);
          // Continue processing other chunks rather than failing completely
          continue;
        }
      }
    } catch (error) {
      console.error('Error streaming message:', error);

      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error: Please check your internet connection and API URL');
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          throw new Error('Authentication error: Please sign in again');
        } else if (error.message.includes('404')) {
          throw new Error('API endpoint not found: Please check your LangGraph configuration');
        }
      }

      throw new Error('Failed to process message. Please try again.');
    }
  }

  /**
   * Get thread messages
   */
  async getThreadMessages(threadId: string): Promise<any[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const messages = await client.threads.getHistory(threadId);
      return messages;
    } catch (error) {
      console.error('Error getting thread messages:', error);
      throw new Error('Failed to retrieve messages');
    }
  }

  /**
   * Stop a running stream/run
   */
  async stopRun(threadId: string, runId: string): Promise<void> {
    try {
      const client = await this.getAuthenticatedClient();
      await client.runs.cancel(threadId, runId);
    } catch (error) {
      console.error('Error stopping run:', error);
      throw new Error('Failed to stop message processing');
    }
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string): Promise<void> {
    try {
      const client = await this.getAuthenticatedClient();
      await client.threads.delete(threadId);
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw new Error('Failed to delete thread');
    }
  }

  /**
   * Update client configuration
   */
  updateConfig(newConfig: Partial<LangGraphConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Update the base client (auth will be added per request)
    this.client = new Client({
      apiUrl: this.config.apiUrl,
      defaultHeaders: {
        ...this.config.defaultHeaders,
      },
    });
  }

  /**
   * Get current session info for debugging
   */
  async getSessionInfo(): Promise<{
    hasToken: boolean;
    tokenPreview?: string;
    userId?: string;
  }> {
    try {
      const accessToken = await this.authService.getAccessToken();
      const user = await this.authService.getCurrentUser();

      return {
        hasToken: !!accessToken,
        tokenPreview: accessToken ? `${accessToken.substring(0, 10)}...` : undefined,
        userId: user?.id,
      };
    } catch (error) {
      console.error('Error getting session info:', error);
      return { hasToken: false };
    }
  }
}
