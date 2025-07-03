import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ThreadListProps } from '../../types';
import { useAppTheme } from '../../theming/useAppTheme';

export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  onThreadSelect,
  onThreadDelete,
  onThreadFavorite
}) => {
  const { theme } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    threadItem: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    threadTitle: {
      fontSize: theme.typography.fontSize.medium,
      color: theme.colors.text,
      fontWeight: theme.typography.fontWeight.medium,
      marginBottom: theme.spacing.xs,
    },
    threadDate: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.textSecondary,
    },
    favoriteIndicator: {
      position: 'absolute',
      right: theme.spacing.md,
      top: theme.spacing.md,
      fontSize: theme.typography.fontSize.medium,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (threads.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          No conversations yet.{'\n'}Start a new chat to get started!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {threads.map((thread) => (
        <TouchableOpacity
          key={thread.id}
          style={styles.threadItem}
          onPress={() => onThreadSelect(thread)}
        >
          <Text style={styles.threadTitle}>
            {thread.title || 'New Conversation'}
          </Text>
          <Text style={styles.threadDate}>
            {thread.updatedAt.toLocaleDateString()}
          </Text>
          {thread.isFavorite && (
            <Text style={styles.favoriteIndicator}>⭐</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};
