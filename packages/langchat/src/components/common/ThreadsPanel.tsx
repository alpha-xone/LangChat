import { Ionicons } from '@expo/vector-icons';
import FeatherIcon from '@react-native-vector-icons/feather';
import LucideIcon from '@react-native-vector-icons/lucide';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useChat } from '../../contexts/ChatContext'; // Import ChatContext
import { Theme } from '../../theme';

export interface Thread {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

interface ThreadsPanelProps {
  visible: boolean;
  onClose: () => void;
  theme: Theme;
  currentThreadId?: string | null;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => Promise<void>;
  onDeleteThread?: (threadId: string) => Promise<void>;
  onRenameThread?: (threadId: string, newTitle: string) => Promise<void>;
  onBatchDeleteThreads?: (threadIds: string[]) => Promise<void>;
  client?: any; // LangGraph client - keeping for backward compatibility but not using
}

export function ThreadsPanel({
  visible,
  onClose,
  theme,
  currentThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onRenameThread,
  onBatchDeleteThreads,
  client, // Not using this anymore
}: ThreadsPanelProps) {
  // Use ChatContext instead of local state for threads
  const {
    threads,
    isLoading,
    currentThread,
    loadThreads,
    createThread,
    deleteThread,
    renameThread
  } = useChat();

  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300)); // Start off-screen
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const panelWidth = Math.min(320, screenWidth * 0.8);

  // Use current thread ID from ChatContext if not provided
  const effectiveCurrentThreadId = currentThreadId || currentThread?.id;

  // Animate panel visibility
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -panelWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim, panelWidth]);

  // Load threads when panel becomes visible (threads are managed by ChatContext)
  useEffect(() => {
    if (visible) {
      loadThreads();
    }
  }, [visible, loadThreads]);

  const handleCreateThread = useCallback(async () => {
    try {
      // Remove this line - isLoading is managed by ChatContext
      // setIsLoading(true);

      // Use ChatContext's createThread method
      const newThread = await createThread(newThreadTitle.trim() || 'New Chat');

      if (newThread) {
        setNewThreadTitle('');
        setShowCreateForm(false);
        // No need to manually refresh threads - ChatContext handles state updates
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
      Alert.alert('Error', 'Failed to create new thread');
    }
  }, [createThread, newThreadTitle]);

  const handleDeleteThread = useCallback(async (threadId: string) => {
    Alert.alert(
      'Delete Thread',
      'Are you sure you want to delete this thread? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use ChatContext's deleteThread method
              await deleteThread(threadId);
              // No need to manually refresh threads - ChatContext handles state updates
            } catch (error) {
              console.error('Failed to delete thread:', error);
              Alert.alert('Error', 'Failed to delete thread');
            }
          },
        },
      ]
    );
  }, [deleteThread]);

  // Helper function to get display title
  const getDisplayTitle = useCallback((thread: Thread) => {
    if (thread.title && thread.title.trim()) {
      return thread.title;
    }
    // Use "Thread" + first 8 characters of thread ID
    return `Thread ${thread.id.substring(0, 8)}`;
  }, []);

  const handleRenameThread = useCallback(async (threadId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      // Use ChatContext's renameThread method which updates Supabase
      await renameThread(threadId, newTitle.trim());

      setRenamingThreadId(null);
      setRenameTitle('');
      // No need to manually refresh threads - ChatContext handles state updates
    } catch (error) {
      console.error('Failed to rename thread:', error);
      Alert.alert('Error', 'Failed to rename thread');
    }
  }, [renameThread]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedThreads.size === 0) return;

    // Filter out current thread from deletion
    const threadsToDelete = Array.from(selectedThreads).filter(id => id !== effectiveCurrentThreadId);

    if (threadsToDelete.length === 0) {
      Alert.alert('Info', 'Cannot delete the current thread. Please select other threads.');
      return;
    }

    Alert.alert(
      'Delete Threads',
      `Are you sure you want to delete ${threadsToDelete.length} thread(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete threads one by one using ChatContext
              await Promise.all(threadsToDelete.map(threadId => deleteThread(threadId)));

              setSelectedThreads(new Set());
              setIsSelectionMode(false);
              // No need to manually refresh threads - ChatContext handles state updates
            } catch (error) {
              console.error('Failed to batch delete threads:', error);
              Alert.alert('Error', 'Failed to delete threads');
            }
          },
        },
      ]
    );
  }, [selectedThreads, effectiveCurrentThreadId, deleteThread]);

  const toggleThreadSelection = useCallback((threadId: string) => {
    setSelectedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  }, []);

  const selectAllThreads = useCallback(() => {
    const allThreadIds = threads.map(t => t.id);
    setSelectedThreads(new Set(allThreadIds));
  }, [threads]);

  const clearSelection = useCallback(() => {
    setSelectedThreads(new Set());
    setIsSelectionMode(false);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Panel */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: panelWidth,
          backgroundColor: theme.background,
          borderRightWidth: 1,
          borderRightColor: theme.border,
          zIndex: 1000,
          transform: [{ translateX: slideAnim }],
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}
        >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.text,
            }}
          >
            {isSelectionMode ? `${selectedThreads.size} Selected` : 'Threads'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {isSelectionMode ? (
              <>
                {selectedThreads.size > 0 && Array.from(selectedThreads).some(id => id !== effectiveCurrentThreadId) && (
                  <TouchableOpacity onPress={handleBatchDelete}>
                    <LucideIcon
                      name="trash"
                      size={18}
                      color={theme.error || '#ff4444'}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={selectAllThreads}>
                  <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearSelection}>
                  <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {threads.length > 1 && (
                  <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: theme.primary,
                      fontWeight: '600',
                    }}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Create New Thread Button */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          {!showCreateForm ? (
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => setShowCreateForm(true)}
              disabled={isLoading}
            >
              <Text
                style={{
                  color: theme.background,
                  fontWeight: '600',
                  fontSize: 16,
                }}
              >
                + New Thread
              </Text>
            </TouchableOpacity>
          ) : (
            <View>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: theme.text,
                  backgroundColor: theme.surface,
                  marginBottom: 8,
                }}
                placeholder="Thread title (optional)"
                placeholderTextColor={theme.placeholder}
                value={newThreadTitle}
                onChangeText={setNewThreadTitle}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: theme.primary,
                    paddingVertical: 8,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                  onPress={handleCreateThread}
                  disabled={isLoading}
                >
                  <Text style={{ color: theme.background, fontWeight: '600' }}>
                    Create
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: theme.border,
                    paddingVertical: 8,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowCreateForm(false);
                    setNewThreadTitle('');
                  }}
                  disabled={isLoading}
                >
                  <Text style={{ color: theme.text, fontWeight: '600' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Threads List */}
        <ScrollView style={{ flex: 1 }}>
          {/* No Thread Selected Indicator */}
          {!effectiveCurrentThreadId && (
            <View style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
              backgroundColor: theme.warning + '10',
            }}>
              <Text style={{
                color: theme.warning || theme.primary,
                fontSize: 14,
                fontWeight: '600',
                textAlign: 'center',
              }}>
                No thread selected
              </Text>
              <Text style={{
                color: theme.placeholder,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 4,
              }}>
                Create a new thread or select an existing one
              </Text>
            </View>
          )}

          {isLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.placeholder }}>Loading threads...</Text>
            </View>
          ) : threads.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.placeholder, textAlign: 'center' }}>
                No threads yet.{'\n'}Create your first thread to get started.
              </Text>
            </View>
          ) : (
            threads.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                  backgroundColor:
                    thread.id === effectiveCurrentThreadId ? theme.primary + '10' :
                    selectedThreads.has(thread.id) ? theme.primary + '20' : 'transparent',
                }}
                onPress={() => {
                  if (isSelectionMode) {
                    toggleThreadSelection(thread.id);
                  } else {
                    onSelectThread(thread.id);
                    onClose();
                  }
                }}
                onLongPress={() => {
                  if (!isSelectionMode) {
                    setIsSelectionMode(true);
                    toggleThreadSelection(thread.id);
                  }
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {isSelectionMode && (
                    <View style={{ marginRight: 12, justifyContent: 'center' }}>
                      <Ionicons
                        name={selectedThreads.has(thread.id) ? "checkmark-circle" : "ellipse-outline"}
                        size={20}
                        color={selectedThreads.has(thread.id) ? theme.primary : theme.placeholder}
                      />
                    </View>
                  )}

                  <View style={{ flex: 1, marginRight: 8 }}>
                    {renamingThreadId === thread.id ? (
                      <View>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: theme.border,
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            color: theme.text,
                            backgroundColor: theme.surface,
                            fontSize: 16,
                            fontWeight: '600',
                            marginBottom: 4,
                          }}
                          value={renameTitle}
                          onChangeText={setRenameTitle}
                          autoFocus
                          onBlur={() => {
                            if (renameTitle.trim() && renameTitle.trim() !== getDisplayTitle(thread)) {
                              handleRenameThread(thread.id, renameTitle.trim());
                            } else {
                              setRenamingThreadId(null);
                              setRenameTitle('');
                            }
                          }}
                          onSubmitEditing={() => {
                            if (renameTitle.trim() && renameTitle.trim() !== getDisplayTitle(thread)) {
                              handleRenameThread(thread.id, renameTitle.trim());
                            } else {
                              setRenamingThreadId(null);
                              setRenameTitle('');
                            }
                          }}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          if (!isSelectionMode) {
                            onSelectThread(thread.id);
                            onClose();
                          }
                        }}
                        onLongPress={() => {
                          if (!isSelectionMode && typeof renameThread === 'function') {
                            setRenamingThreadId(thread.id);
                            setRenameTitle(getDisplayTitle(thread));
                          }
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: thread.id === effectiveCurrentThreadId ? theme.primary : theme.text,
                            marginBottom: 4,
                          }}
                          numberOfLines={1}
                        >
                          {getDisplayTitle(thread)}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.placeholder,
                      }}
                    >
                      {formatDate(thread.updated_at)}
                    </Text>
                  </View>

                  {!isSelectionMode && renamingThreadId !== thread.id && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{ padding: 4 }}
                        onPress={() => {
                          setRenamingThreadId(thread.id);
                          setRenameTitle(getDisplayTitle(thread));
                        }}
                      >
                        <FeatherIcon
                          name="edit"
                          size={14}
                          color={theme.placeholder}
                        />
                      </TouchableOpacity>
                      {thread.id !== effectiveCurrentThreadId && (
                        <TouchableOpacity
                          style={{ padding: 4 }}
                          onPress={() => handleDeleteThread(thread.id)}
                        >
                          <LucideIcon
                            name="trash"
                            size={14}
                            color={theme.error || '#ff4444'}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
}
