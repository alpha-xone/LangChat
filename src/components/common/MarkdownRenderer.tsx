import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theming/useAppTheme';

interface MarkdownRendererProps {
  content: string;
  onLinkPress?: (url: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  const { theme } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.sm,
    },
    text: {
      fontSize: theme.typography.fontSize.medium,
      color: theme.colors.text,
      lineHeight: theme.typography.fontSize.medium * 1.4,
    },
    codeBlock: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.sm,
      marginVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      fontFamily: 'monospace',
    },
    inlineCode: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      fontFamily: 'monospace',
    },
    heading: {
      fontSize: theme.typography.fontSize.large,
      fontWeight: 'bold' as const,
      marginVertical: theme.spacing.sm,
    },
    bold: {
      fontWeight: 'bold' as const,
    },
    italic: {
      fontStyle: 'italic',
    },
  });

  // Basic markdown rendering - in a real implementation, you'd use a library like react-native-markdown-display
  const renderMarkdown = (text: string) => {
    // This is a simplified version - you'd want to use a proper markdown parser
    return (
      <Text style={styles.text}>
        {text}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {renderMarkdown(content)}
    </View>
  );
};
