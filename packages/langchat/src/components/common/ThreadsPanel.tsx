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
  client?: any; // LangGraph client
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
  client,
}: ThreadsPanelProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300)); // Start off-screen
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const panelWidth = Math.min(320, screenWidth * 0.8);

  // Animate panel visibility
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -panelWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim, panelWidth]);

  // Fetch threads when panel becomes visible
  useEffect(() => {
    if (visible && client) {
      fetchThreads();
    }
  }, [visible, client]);
  const fetchThreads = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      // Note: The exact API method for listing threads may vary based on LangGraph SDK version
      // This is a placeholder implementation - adjust based on actual SDK capabilities
      let response;

      // Try different possible API methods
      if (client.threads.search) {
        response = await client.threads.search({
          limit: 20,
          offset: 0,
        });
      } else if (client.threads.list) {
        response = await client.threads.list({
          limit: 20,
          offset: 0,
        });
      } else {
        // Fallback: just show current thread if we can't list threads
        if (currentThreadId) {
          setThreads([{
            id: currentThreadId,
            title: `Current Thread`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
        }
        return;
      }

      if (response && Array.isArray(response)) {
        setThreads(response.map((thread: any) => ({
          id: thread.thread_id || thread.id,
          title: thread.metadata?.title || thread.title || `Thread ${(thread.thread_id || thread.id).slice(0, 8)}`,
          created_at: thread.created_at || new Date().toISOString(),
          updated_at: thread.updated_at || thread.created_at || new Date().toISOString(),
          metadata: thread.metadata,
        })));
      } else if (response && response.data && Array.isArray(response.data)) {
        // Handle paginated response
        setThreads(response.data.map((thread: any) => ({
          id: thread.thread_id || thread.id,
          title: thread.metadata?.title || thread.title || `Thread ${(thread.thread_id || thread.id).slice(0, 8)}`,
          created_at: thread.created_at || new Date().toISOString(),
          updated_at: thread.updated_at || thread.created_at || new Date().toISOString(),
          metadata: thread.metadata,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
      // Fallback: show current thread if available
      if (currentThreadId) {
        setThreads([{
          id: currentThreadId,
          title: `Current Thread`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, currentThreadId]);

  const handleCreateThread = useCallback(async () => {
    if (!client) return;

    try {
      setIsLoading(true);
      await onCreateThread();
      setNewThreadTitle('');
      setShowCreateForm(false);
      await fetchThreads(); // Refresh the list
    } catch (error) {
      console.error('Failed to create thread:', error);
      Alert.alert('Error', 'Failed to create new thread');
    } finally {
      setIsLoading(false);
    }
  }, [client, onCreateThread, fetchThreads]);

  const handleDeleteThread = useCallback(async (threadId: string) => {
    if (!onDeleteThread || !client) return;

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
              setIsLoading(true);

              // Always use the parent handler first as it contains important state management logic
              await onDeleteThread(threadId);

              await fetchThreads(); // Refresh the list
            } catch (error) {
              console.error('Failed to delete thread:', error);
              Alert.alert('Error', 'Failed to delete thread');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [onDeleteThread, client, fetchThreads]);

  const handleRenameThread = useCallback(async (threadId: string, newTitle: string) => {
    if (!onRenameThread || !client || !newTitle.trim()) return;

    try {
      setIsLoading(true);

      // Always use the parent handler first as it contains important state management logic
      await onRenameThread(threadId, newTitle.trim());

      setRenamingThreadId(null);
      setRenameTitle('');
      await fetchThreads(); // Refresh the list
    } catch (error) {
      console.error('Failed to rename thread:', error);
      Alert.alert('Error', 'Failed to rename thread');
    } finally {
      setIsLoading(false);
    }
  }, [onRenameThread, client, fetchThreads]);

  const handleBatchDelete = useCallback(async () => {
    if (!onBatchDeleteThreads || !client || selectedThreads.size === 0) return;

    // Filter out current thread from deletion
    const threadsToDelete = Array.from(selectedThreads).filter(id => id !== currentThreadId);

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
              setIsLoading(true);

              // Always use the parent handler first as it contains important state management logic
              await onBatchDeleteThreads(threadsToDelete);

              setSelectedThreads(new Set());
              setIsSelectionMode(false);
              await fetchThreads(); // Refresh the list
            } catch (error) {
              console.error('Failed to batch delete threads:', error);
              Alert.alert('Error', 'Failed to delete threads');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [onBatchDeleteThreads, client, selectedThreads, currentThreadId, fetchThreads]);

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
    // Include all threads except current thread for deletion, but allow current thread to be selected for other operations
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
                {selectedThreads.size > 0 && Array.from(selectedThreads).some(id => id !== currentThreadId) && (
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
          {!currentThreadId && (
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
                    thread.id === currentThreadId ? theme.primary + '10' :
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
                            if (renameTitle.trim() && renameTitle.trim() !== thread.title) {
                              handleRenameThread(thread.id, renameTitle.trim());
                            } else {
                              setRenamingThreadId(null);
                              setRenameTitle('');
                            }
                          }}
                          onSubmitEditing={() => {
                            if (renameTitle.trim() && renameTitle.trim() !== thread.title) {
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
                          if (!isSelectionMode && onRenameThread) {
                            setRenamingThreadId(thread.id);
                            setRenameTitle(thread.title || '');
                          }
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: thread.id === currentThreadId ? theme.primary : theme.text,
                            marginBottom: 4,
                          }}
                          numberOfLines={1}
                        >
                          {thread.title}
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
                      {onRenameThread && (
                        <TouchableOpacity
                          style={{ padding: 4 }}
                          onPress={() => {
                            setRenamingThreadId(thread.id);
                            setRenameTitle(thread.title || '');
                          }}
                        >
                          <FeatherIcon
                            name="edit"
                            size={14}
                            color={theme.placeholder}
                          />
                        </TouchableOpacity>
                      )}
                      {onDeleteThread && thread.id !== currentThreadId && (
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
