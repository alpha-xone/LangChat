import { SupabaseClient } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Database, Tables } from '../lib/supabase/types';
import { useAuth } from './SupabaseAuthContext';

export interface ChatMessage extends Tables<'chat_messages'> {}
export interface ChatThread extends Tables<'chat_threads'> {}

export interface ChatContextType {
  // Current state
  currentThread: ChatThread | null;
  messages: ChatMessage[];
  threads: ChatThread[];
  isLoading: boolean;
  isStreaming: boolean;

  // Thread management
  createThread: (title?: string) => Promise<ChatThread | null>;
  selectThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  renameThread: (threadId: string, newTitle: string) => Promise<void>;
  loadThreads: () => Promise<void>;

  // Message management
  sendMessage: (content: string) => Promise<void>;
  loadMessages: (threadId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;

  // AI Integration
  invokeLangGraph: (message: string, threadId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  supabaseClient: SupabaseClient<Database>;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  supabaseClient
}) => {
  const { user, session } = useAuth();
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const loadThreads = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabaseClient
        .from('chat_threads')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading threads:', error);
        return;
      }
      setThreads(data || []);
    } catch (error) {
      console.error('Error in loadThreads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabaseClient]);

  // Load threads when user changes
  useEffect(() => {
    if (user) {
      loadThreads();
    } else {
      setThreads([]);
      setCurrentThread(null);
      setMessages([]);
    }
  }, [user, loadThreads]);

  const createThread = useCallback(async (title = 'New Chat'): Promise<ChatThread | null> => {
    if (!user) return null;

    try {
      setIsLoading(true);

      // Create thread in Supabase first
      const { data, error } = await supabaseClient
        .from('chat_threads')
        .insert({
          user_id: user.id,
          title,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating thread:', error);
        return null;
      }

      // Initialize LangGraph thread state if needed
      // This ensures communication consistency with LangGraph
      try {
        await supabaseClient.functions.invoke('initialize-thread', {
          body: {
            threadId: data.id,
            userId: user.id,
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });
      } catch (langGraphError) {
        console.warn('LangGraph thread initialization failed:', langGraphError);
        // Continue anyway - thread is created in Supabase
      }

      setThreads(prev => [data, ...prev]);
      setCurrentThread(data);
      setMessages([]);

      return data;
    } catch (error) {
      console.error('Error in createThread:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, supabaseClient, session]);

  const selectThread = useCallback(async (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    setCurrentThread(thread);
    await loadMessages(threadId);
  }, [threads]);

  const deleteThread = useCallback(async (threadId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);

      // First delete all messages in the thread
      const { error: messagesError } = await supabaseClient
        .from('chat_messages')
        .delete()
        .eq('thread_id', threadId)
        .eq('user_id', user.id);

      if (messagesError) {
        console.error('Error deleting thread messages:', messagesError);
        // Continue with thread deletion even if message deletion fails
      }

      // Then delete the thread itself
      const { error: threadError } = await supabaseClient
        .from('chat_threads')
        .delete()
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (threadError) {
        console.error('Error deleting thread:', threadError);
        throw new Error('Failed to delete thread');
      }

      // Update local state
      setThreads(prev => prev.filter(thread => thread.id !== threadId));

      // Clear current thread if it was deleted
      if (currentThread?.id === threadId) {
        setCurrentThread(null);
        setMessages([]);
      }

      console.log('Thread and its messages deleted from Supabase:', threadId);
    } catch (error) {
      console.error('Error in deleteThread:', error);
      throw error; // Re-throw to let the UI handle the error
    } finally {
      setIsLoading(false);
    }
  }, [user, supabaseClient, currentThread]);

  const renameThread = useCallback(async (threadId: string, newTitle: string) => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Update the thread title in Supabase
      const { error } = await supabaseClient
        .from('chat_threads')
        .update({
          title: newTitle.trim(),
          updated_at: new Date().toISOString() // Update the timestamp
        })
        .eq('id', threadId)
        .eq('user_id', user.id); // Ensure user can only update their own threads

      if (error) {
        console.error('Error updating thread title:', error);
        throw new Error('Failed to update thread title');
      }

      // Update local state
      setThreads(prev => prev.map(thread =>
        thread.id === threadId
          ? { ...thread, title: newTitle.trim(), updated_at: new Date().toISOString() }
          : thread
      ));

      // Update current thread if it's the one being renamed
      if (currentThread?.id === threadId) {
        setCurrentThread(prev => prev ? { ...prev, title: newTitle.trim() } : null);
      }

      console.log('Thread renamed successfully:', threadId, newTitle);
    } catch (error) {
      console.error('Error in renameThread:', error);
      throw error; // Re-throw to let the UI handle the error
    } finally {
      setIsLoading(false);
    }
  }, [user, supabaseClient, currentThread]);

  const loadMessages = useCallback(async (threadId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error in loadMessages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabaseClient]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !currentThread) return;

    try {
      // Add user message to database
      const { data: userMessage, error: userError } = await supabaseClient
        .from('chat_messages')
        .insert({
          user_id: user.id,
          thread_id: currentThread.id,
          content,
          role: 'user',
        })
        .select()
        .single();

      if (userError) {
        console.error('Error saving user message:', userError);
        return;
      }

      // Update local state
      setMessages(prev => [...prev, userMessage]);

      // Update thread timestamp
      await supabaseClient
        .from('chat_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentThread.id);

      // Invoke AI response
      await invokeLangGraph(content, currentThread.id);
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }, [user, currentThread, supabaseClient]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabaseClient
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting message:', error);
        return;
      }

      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error in deleteMessage:', error);
    }
  }, [user, supabaseClient]);

  // LangGraph is only used for AI message communication
  const invokeLangGraph = useCallback(async (message: string, threadId: string) => {
    if (!user || !session) return;

    try {
      setIsStreaming(true);

      // Call Supabase Edge Function for secure AI invocation
      const { data, error } = await supabaseClient.functions.invoke('chat-with-ai', {
        body: {
          message,
          threadId,
          userId: user.id,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error invoking AI:', error);

        // Add error message to chat
        const errorMessage = {
          user_id: user.id,
          thread_id: threadId,
          content: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant' as const,
        };

        const { data: savedError } = await supabaseClient
          .from('chat_messages')
          .insert(errorMessage)
          .select()
          .single();

        if (savedError) {
          setMessages(prev => [...prev, savedError]);
        }
        return;
      }

      // Handle successful AI response
      if (data?.content) {
        const aiMessage = {
          user_id: user.id,
          thread_id: threadId,
          content: data.content,
          role: 'assistant' as const,
          metadata: data.metadata || {},
        };

        const { data: savedMessage } = await supabaseClient
          .from('chat_messages')
          .insert(aiMessage)
          .select()
          .single();

        if (savedMessage) {
          setMessages(prev => [...prev, savedMessage]);
        }
      }
    } catch (error) {
      console.error('Error in invokeLangGraph:', error);

      // Add fallback error message
      const errorMessage = {
        user_id: user.id,
        thread_id: threadId,
        content: 'Sorry, I encountered a connection error. Please try again.',
        role: 'assistant' as const,
      };

      const { data: savedError } = await supabaseClient
        .from('chat_messages')
        .insert(errorMessage)
        .select()
        .single();

      if (savedError) {
        setMessages(prev => [...prev, savedError]);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [user, session, supabaseClient]);

  const value: ChatContextType = {
    currentThread,
    messages,
    threads,
    isLoading,
    isStreaming,
    createThread,
    selectThread,
    deleteThread,
    renameThread,
    loadThreads,
    sendMessage,
    loadMessages,
    deleteMessage,
    invokeLangGraph,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
