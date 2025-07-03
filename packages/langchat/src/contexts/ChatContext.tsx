import { Message } from '@langchain/langgraph-sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useLangGraphStream } from '../hooks/useLangGraphStream';
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

  // Initialize LangGraph stream
  const langGraphStream = useLangGraphStream({
    apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || '',
    assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || '',
    apiKey: process.env.EXPO_PUBLIC_LANGGRAPH_API_KEY || undefined,
    authToken: session?.access_token,
  });

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

      console.log('Loaded threads:', data?.length || 0);
      console.log('Thread data:', JSON.stringify(data, null, 2));
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

      // Update local state
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
  }, [user, supabaseClient]);

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

      // Delete messages first (due to foreign key constraints)
      await supabaseClient
        .from('chat_messages')
        .delete()
        .eq('thread_id', threadId)
        .eq('user_id', user.id);

      // Delete thread
      const { error } = await supabaseClient
        .from('chat_threads')
        .delete()
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting thread:', error);
        return;
      }

      setThreads(prev => prev.filter(t => t.id !== threadId));

      if (currentThread?.id === threadId) {
        setCurrentThread(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error in deleteThread:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabaseClient, currentThread]);

  const renameThread = useCallback(async (threadId: string, newTitle: string) => {
    if (!user) return;

    try {
      const { error } = await supabaseClient
        .from('chat_threads')
        .update({
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error renaming thread:', error);
        return;
      }

      setThreads(prev =>
        prev.map(t => t.id === threadId ? { ...t, title: newTitle } : t)
      );

      if (currentThread?.id === threadId) {
        setCurrentThread(prev => prev ? { ...prev, title: newTitle } : null);
      }
    } catch (error) {
      console.error('Error in renameThread:', error);
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
      // Create a message object for LangGraph
      const message: Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        content,
        type: 'human',
      };

      // Set the thread ID in LangGraph stream if it's different
      if (langGraphStream.threadId !== currentThread.id) {
        // We might need to create a new LangGraph thread or map to existing Supabase thread
        // For now, let LangGraph handle thread management
      }

      // Send message using LangGraph stream
      await langGraphStream.sendMessage(message);

      // Refresh messages from database after LangGraph processes them
      setTimeout(() => {
        loadMessages(currentThread.id);
      }, 1000); // Small delay to allow LangGraph to save to Supabase
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }, [user, currentThread, langGraphStream, loadMessages]);

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

  const value: ChatContextType = {
    currentThread,
    messages,
    threads,
    isLoading,
    isStreaming: langGraphStream.isStreaming || isLoading,
    createThread,
    selectThread,
    deleteThread,
    renameThread,
    loadThreads,
    sendMessage,
    loadMessages,
    deleteMessage,
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
