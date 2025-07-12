import { supabase } from './supabase';
import type { ParsedMessage } from '../ai';
import AuthService from './AuthService';

export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  thread_id: string; // LangGraph thread ID
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  message_id: string; // LangGraph message ID
  type: 'human' | 'ai' | 'system' | 'assistant' | 'tool';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  is_complete: boolean;
}

export interface CreateThreadData {
  title: string;
  thread_id: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateThreadData {
  title?: string;
  metadata?: Record<string, any>;
  is_favorite?: boolean;
  tags?: string[];
}

export class ChatService {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Create a new chat thread
   */
  async createThread(data: CreateThreadData): Promise<ChatThread> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: thread, error } = await supabase
      .from('chat_threads')
      .insert({
        user_id: user.id,
        title: data.title,
        thread_id: data.thread_id,
        metadata: data.metadata || {},
        tags: data.tags || [],
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating thread:', error);
      throw new Error('Failed to create thread');
    }

    return thread;
  }

  /**
   * Get all threads for the current user
   */
  async getThreads(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    tags?: string[];
    favorite?: boolean;
  }): Promise<ChatThread[]> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (options?.search) {
      query = query.ilike('title', `%${options.search}%`);
    }

    if (options?.favorite !== undefined) {
      query = query.eq('is_favorite', options.favorite);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: threads, error } = await query;

    if (error) {
      console.error('Error fetching threads:', error);
      throw new Error('Failed to fetch threads');
    }

    return threads || [];
  }

  /**
   * Get a specific thread
   */
  async getThread(id: string): Promise<ChatThread | null> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: thread, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Thread not found
      }
      console.error('Error fetching thread:', error);
      throw new Error('Failed to fetch thread');
    }

    return thread;
  }

  /**
   * Update a thread
   */
  async updateThread(id: string, data: UpdateThreadData): Promise<ChatThread> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: thread, error } = await supabase
      .from('chat_threads')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating thread:', error);
      throw new Error('Failed to update thread');
    }

    return thread;
  }

  /**
   * Delete a thread
   */
  async deleteThread(id: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('chat_threads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting thread:', error);
      throw new Error('Failed to delete thread');
    }
  }

  /**
   * Save a message to the database
   */
  async saveMessage(threadId: string, message: ParsedMessage): Promise<ChatMessage> {
    const { data: chatMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        message_id: message.id,
        type: message.type,
        content: message.content,
        metadata: message.metadata || {},
        is_complete: message.isComplete,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }

    // Update thread's updated_at timestamp
    await this.updateThreadTimestamp(threadId);

    return chatMessage;
  }

  /**
   * Get messages for a thread
   */
  async getMessages(threadId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<ChatMessage[]> {
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }

    return messages || [];
  }

  /**
   * Update a message
   */
  async updateMessage(messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage> {
    const { data: message, error } = await supabase
      .from('chat_messages')
      .update(updates)
      .eq('message_id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      throw new Error('Failed to update message');
    }

    return message;
  }

  /**
   * Subscribe to real-time updates for a thread
   */
  subscribeToThread(threadId: string, callback: (message: ChatMessage) => void) {
    return supabase
      .channel(`thread-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as ChatMessage);
          }
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time updates for all user threads
   */
  subscribeToUserThreads(callback: (thread: ChatThread) => void) {
    return supabase
      .channel('user-threads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_threads',
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as ChatThread);
          }
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: any) {
    await supabase.removeChannel(channel);
  }

  /**
   * Generate a title for a thread based on the first message
   */
  generateThreadTitle(firstMessage: string): string {
    const maxLength = 50;
    const cleaned = firstMessage.trim().replace(/\s+/g, ' ');

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    return cleaned.substring(0, maxLength - 3) + '...';
  }

  /**
   * Private method to update thread timestamp
   */
  private async updateThreadTimestamp(threadId: string): Promise<void> {
    await supabase
      .from('chat_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);
  }

  /**
   * Convert ParsedMessage to ChatMessage format
   */
  parsedMessageToChatMessage(threadId: string, message: ParsedMessage): Omit<ChatMessage, 'id' | 'created_at'> {
    return {
      thread_id: threadId,
      message_id: message.id,
      type: message.type,
      content: message.content,
      metadata: message.metadata || {},
      is_complete: message.isComplete,
    };
  }

  /**
   * Convert ChatMessage to ParsedMessage format
   */
  chatMessageToParsedMessage(message: ChatMessage): ParsedMessage {
    return {
      id: message.message_id,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      timestamp: message.created_at,
      isComplete: message.is_complete,
    };
  }
}

export default ChatService;
