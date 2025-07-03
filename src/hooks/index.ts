import { useState, useEffect } from 'react';
import type { Message, Thread, User } from '../types';
import { ChatService } from '../data/ChatService';
import { AuthService } from '../data/AuthService';

export const useChatMessages = (threadId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatService = new ChatService();

  const loadMessages = async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const msgs = await chatService.getMessages(id);
      setMessages(msgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  };

  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
    }
  }, [threadId]);

  return {
    messages,
    loading,
    error,
    addMessage,
    updateMessage,
    refetch: () => threadId && loadMessages(threadId),
  };
};

export const useThreads = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatService = new ChatService();
  const authService = new AuthService();

  const loadThreads = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userThreads = await chatService.getThreads(user.id);
      setThreads(userThreads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  const createThread = async (title?: string) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newThread = await chatService.createThread(user.id, title);
      setThreads(prev => [newThread, ...prev]);
      return newThread;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thread');
      throw err;
    }
  };

  const updateThread = async (threadId: string, updates: Partial<Thread>) => {
    try {
      const updatedThread = await chatService.updateThread(threadId, updates);
      setThreads(prev =>
        prev.map(thread =>
          thread.id === threadId ? updatedThread : thread
        )
      );
      return updatedThread;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thread');
      throw err;
    }
  };

  const deleteThread = async (threadId: string) => {
    try {
      await chatService.deleteThread(threadId);
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete thread');
      throw err;
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  return {
    threads,
    loading,
    error,
    createThread,
    updateThread,
    deleteThread,
    refetch: loadThreads,
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authService = new AuthService();

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { user: signedInUser, error: signInError } = await authService.signIn(email, password);
      if (signInError) {
        throw signInError;
      }
      setUser(signedInUser);
      return signedInUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { user: signedUpUser, error: signUpError } = await authService.signUp(email, password);
      if (signUpError) {
        throw signUpError;
      }
      setUser(signedUpUser);
      return signedUpUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await authService.signOut();
      if (signOutError) {
        throw signOutError;
      }
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
};
