import type { Thread, Message } from '../types';
import { getSupabaseClient } from './supabase';

export class ChatService {
  private supabase = getSupabaseClient();

  async getThreads(userId: string): Promise<Thread[]> {
    try {
      const { data, error } = await this.supabase
        .from('threads')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(this.mapThread);
    } catch (error) {
      throw new Error(`Failed to fetch threads: ${error}`);
    }
  }

  async getMessages(threadId: string): Promise<Message[]> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data.map(this.mapMessage);
    } catch (error) {
      throw new Error(`Failed to fetch messages: ${error}`);
    }
  }

  async createThread(userId: string, title?: string): Promise<Thread> {
    try {
      const { data, error } = await this.supabase
        .from('threads')
        .insert({
          user_id: userId,
          title: title || null,
          is_favorite: false,
          tags: [],
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
      const { data, error } = await this.supabase
        .from('threads')
        .update({
          title: updates.title,
          is_favorite: updates.isFavorite,
          tags: updates.tags,
          updated_at: new Date().toISOString(),
        })
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
      const { error } = await this.supabase
        .from('threads')
        .delete()
        .eq('id', threadId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to delete thread: ${error}`);
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

      return this.mapMessage(data);
    } catch (error) {
      throw new Error(`Failed to create message: ${error}`);
    }
  }

  subscribeToMessages(threadId: string, callback: (message: Message) => void) {
    return this.supabase
      .channel(`messages:${threadId}`)
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
      .subscribe();
  }

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
      attachments: data.attachments,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
