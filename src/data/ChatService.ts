import type { Thread, Message } from '../types';
import { getSupabaseClient } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class ChatService {
  private supabase = getSupabaseClient();
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  // Thread Management
  async getThreads(userId: string, options?: {
    limit?: number;
    offset?: number;
    favoriteOnly?: boolean;
    tags?: string[];
  }): Promise<Thread[]> {
    try {
      let query = this.supabase
        .from('threads')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      if (options?.favoriteOnly) {
        query = query.eq('is_favorite', true);
      }

      if (options?.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(this.mapThread);
    } catch (error) {
      throw new Error(`Failed to fetch threads: ${error}`);
    }
  }

  async getThread(threadId: string): Promise<Thread | null> {
    try {
      const { data, error } = await this.supabase
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Thread not found
        }
        throw error;
      }

      return this.mapThread(data);
    } catch (error) {
      throw new Error(`Failed to fetch thread: ${error}`);
    }
  }

  async createThread(thread: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>): Promise<Thread> {
    try {
      const { data, error } = await this.supabase
        .from('threads')
        .insert({
          user_id: thread.userId,
          title: thread.title,
          is_favorite: thread.isFavorite || false,
          tags: thread.tags || [],
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapThread(data);
    } catch (error) {
      throw new Error(`Failed to create thread: ${error}`);
    }
  }

  async updateThread(threadId: string, updates: Partial<Thread>): Promise<Thread> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { data, error } = await this.supabase
        .from('threads')
        .update(updateData)
        .eq('id', threadId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapThread(data);
    } catch (error) {
      throw new Error(`Failed to update thread: ${error}`);
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    try {
      // First delete all messages in the thread
      const { error: messagesError } = await this.supabase
        .from('messages')
        .delete()
        .eq('thread_id', threadId);

      if (messagesError) {
        throw messagesError;
      }

      // Then delete the thread
      const { error } = await this.supabase
        .from('threads')
        .delete()
        .eq('id', threadId);

      if (error) {
        throw error;
      }

      // Unsubscribe from real-time updates
      this.unsubscribeFromMessages(threadId);
    } catch (error) {
      throw new Error(`Failed to delete thread: ${error}`);
    }
  }

  // Message Management
  async getMessages(threadId: string, options?: {
    limit?: number;
    offset?: number;
    beforeMessageId?: string;
    afterMessageId?: string;
  }): Promise<Message[]> {
    try {
      let query = this.supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      if (options?.beforeMessageId) {
        const { data: beforeMessage } = await this.supabase
          .from('messages')
          .select('created_at')
          .eq('id', options.beforeMessageId)
          .single();

        if (beforeMessage) {
          query = query.lt('created_at', beforeMessage.created_at);
        }
      }

      if (options?.afterMessageId) {
        const { data: afterMessage } = await this.supabase
          .from('messages')
          .select('created_at')
          .eq('id', options.afterMessageId)
          .single();

        if (afterMessage) {
          query = query.gt('created_at', afterMessage.created_at);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(this.mapMessage);
    } catch (error) {
      throw new Error(`Failed to fetch messages: ${error}`);
    }
  }

  async createMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          thread_id: message.threadId,
          user_id: message.userId,
          type: message.type,
          content: message.content,
          metadata: message.metadata || null,
          attachments: message.attachments || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update thread's updated_at timestamp
      await this.supabase
        .from('threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', message.threadId);

      return this.mapMessage(data);
    } catch (error) {
      throw new Error(`Failed to create message: ${error}`);
    }
  }

  async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
      if (updates.attachments !== undefined) updateData.attachments = updates.attachments;

      const { data, error } = await this.supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapMessage(data);
    } catch (error) {
      throw new Error(`Failed to update message: ${error}`);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to delete message: ${error}`);
    }
  }

  // Real-time subscriptions
  subscribeToMessages(threadId: string, callback: (message: Message) => void): () => void {
    const channelName = `messages:${threadId}`;

    // Unsubscribe from existing subscription if any
    this.unsubscribeFromMessages(threadId);

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          callback(this.mapMessage(payload.new as any));
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          callback(this.mapMessage(payload.new as any));
        }
      )
      .subscribe();

    this.subscriptions.set(threadId, channel);

    return () => this.unsubscribeFromMessages(threadId);
  }

  subscribeToThreads(userId: string, callback: (thread: Thread) => void): () => void {
    const channelName = `threads:${userId}`;

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'threads',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(this.mapThread(payload.new as any));
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'threads',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(this.mapThread(payload.new as any));
        }
      )
      .subscribe();

    this.subscriptions.set(`threads:${userId}`, channel);

    return () => {
      const subscription = this.subscriptions.get(`threads:${userId}`);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(`threads:${userId}`);
      }
    };
  }

  unsubscribeFromMessages(threadId: string): void {
    const subscription = this.subscriptions.get(threadId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(threadId);
    }
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  // Search functionality
  async searchMessages(query: string, options?: {
    threadId?: string;
    userId?: string;
    limit?: number;
    messageType?: Message['type'];
  }): Promise<Message[]> {
    try {
      let dbQuery = this.supabase
        .from('messages')
        .select('*')
        .textSearch('content', query, {
          type: 'websearch',
          config: 'english',
        })
        .order('created_at', { ascending: false });

      if (options?.threadId) {
        dbQuery = dbQuery.eq('thread_id', options.threadId);
      }

      if (options?.userId) {
        dbQuery = dbQuery.eq('user_id', options.userId);
      }

      if (options?.messageType) {
        dbQuery = dbQuery.eq('type', options.messageType);
      }

      if (options?.limit) {
        dbQuery = dbQuery.limit(options.limit);
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }

      return data.map(this.mapMessage);
    } catch (error) {
      throw new Error(`Failed to search messages: ${error}`);
    }
  }

  async searchThreads(query: string, userId: string, options?: {
    limit?: number;
    favoriteOnly?: boolean;
    tags?: string[];
  }): Promise<Thread[]> {
    try {
      let dbQuery = this.supabase
        .from('threads')
        .select('*')
        .eq('user_id', userId)
        .textSearch('title', query, {
          type: 'websearch',
          config: 'english',
        })
        .order('updated_at', { ascending: false });

      if (options?.favoriteOnly) {
        dbQuery = dbQuery.eq('is_favorite', true);
      }

      if (options?.tags && options.tags.length > 0) {
        dbQuery = dbQuery.overlaps('tags', options.tags);
      }

      if (options?.limit) {
        dbQuery = dbQuery.limit(options.limit);
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }

      return data.map(this.mapThread);
    } catch (error) {
      throw new Error(`Failed to search threads: ${error}`);
    }
  }

  // Bulk operations
  async bulkCreateMessages(messages: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Message[]> {
    try {
      const insertData = messages.map(message => ({
        thread_id: message.threadId,
        user_id: message.userId,
        type: message.type,
        content: message.content,
        metadata: message.metadata || null,
        attachments: message.attachments || null,
      }));

      const { data, error } = await this.supabase
        .from('messages')
        .insert(insertData)
        .select();

      if (error) {
        throw error;
      }

      return data.map(this.mapMessage);
    } catch (error) {
      throw new Error(`Failed to create messages: ${error}`);
    }
  }

  async bulkDeleteMessages(messageIds: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .in('id', messageIds);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to delete messages: ${error}`);
    }
  }

  // Analytics and statistics
  async getThreadStats(threadId: string): Promise<{
    messageCount: number;
    firstMessageDate: Date | null;
    lastMessageDate: Date | null;
    userMessageCount: number;
    aiMessageCount: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('type, created_at')
        .eq('thread_id', threadId);

      if (error) {
        throw error;
      }

      const messageCount = data.length;
      const userMessageCount = data.filter(msg => msg.type === 'user' || msg.type === 'human').length;
      const aiMessageCount = data.filter(msg => msg.type === 'ai' || msg.type === 'assistant').length;

      const dates = data.map(msg => new Date(msg.created_at)).sort((a, b) => a.getTime() - b.getTime());
      const firstMessageDate = dates.length > 0 ? dates[0] : null;
      const lastMessageDate = dates.length > 0 ? dates[dates.length - 1] : null;

      return {
        messageCount,
        firstMessageDate: firstMessageDate || null,
        lastMessageDate: lastMessageDate || null,
        userMessageCount,
        aiMessageCount,
      };
    } catch (error) {
      throw new Error(`Failed to get thread stats: ${error}`);
    }
  }

  async getUserStats(userId: string): Promise<{
    threadCount: number;
    messageCount: number;
    favoriteThreadCount: number;
    totalAttachments: number;
  }> {
    try {
      const [threadsResult, messagesResult] = await Promise.all([
        this.supabase
          .from('threads')
          .select('id, is_favorite')
          .eq('user_id', userId),
        this.supabase
          .from('messages')
          .select('attachments')
          .eq('user_id', userId)
      ]);

      if (threadsResult.error) {
        throw threadsResult.error;
      }

      if (messagesResult.error) {
        throw messagesResult.error;
      }

      const threadCount = threadsResult.data.length;
      const favoriteThreadCount = threadsResult.data.filter(thread => thread.is_favorite).length;
      const messageCount = messagesResult.data.length;
      const totalAttachments = messagesResult.data.reduce((count, msg) => {
        return count + (msg.attachments ? msg.attachments.length : 0);
      }, 0);

      return {
        threadCount,
        messageCount,
        favoriteThreadCount,
        totalAttachments,
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error}`);
    }
  }

  // Utility methods
  private mapThread(data: any): Thread {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isFavorite: data.is_favorite,
      tags: data.tags || [],
    };
  }

  private mapMessage(data: any): Message {
    return {
      id: data.id,
      threadId: data.thread_id,
      userId: data.user_id,
      type: data.type,
      content: data.content,
      metadata: data.metadata,
      attachments: data.attachments || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

}

// Export singleton instance
export const chatService = new ChatService();
