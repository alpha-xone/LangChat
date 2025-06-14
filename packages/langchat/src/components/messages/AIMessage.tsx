import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import { useTheme } from '../../context/ThemeContext';
import { getContentString } from '../../lib/message-utils';

interface AIMessageProps {
  message?: Message;
  isLoading?: boolean;
  onCopy?: (text: string) => void;
}

export function AIMessage({ message, isLoading = false, onCopy }: AIMessageProps) {
  const { theme } = useTheme();
  const displayContent = getContentString(message?.content);

  const handleCopy = async () => {
    if (!displayContent) return;

    try {
      await Clipboard.setStringAsync(displayContent);
      onCopy?.(displayContent);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // Markdown styles that adapt to theme
  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.text,
      margin: 0,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
      marginTop: 8,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 10,
      marginTop: 8,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
      marginTop: 6,
    },
    paragraph: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.text,
      marginBottom: 8,
    },
    strong: {
      fontWeight: 'bold',
      color: theme.text,
    },
    em: {
      fontStyle: 'italic',
      color: theme.text,
    },
    code_inline: {
      backgroundColor: theme.text + '15',
      color: theme.primary,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    code_block: {
      backgroundColor: theme.text + '10',
      color: theme.text,
      padding: 12,
      borderRadius: 8,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.border || theme.text + '20',
      flexWrap: 'nowrap',
      overflow: 'hidden',
    },
    fence: {
      backgroundColor: theme.text + '10',
      color: theme.text,
      padding: 12,
      borderRadius: 8,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.border || theme.text + '20',
      flexWrap: 'nowrap',
      overflow: 'hidden',
    },
    blockquote: {
      backgroundColor: theme.text + '08',
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
      fontStyle: 'italic',
    },
    list_item: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.text,
      marginBottom: 4,
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.border || theme.text + '30',
      borderRadius: 6,
      marginVertical: 8,
      width: '100%',
    },
    thead: {
      backgroundColor: theme.text + '10',
    },
    tbody: {
      backgroundColor: theme.background,
    },
    th: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border || theme.text + '30',
      textAlign: 'left',
      minWidth: 80,
    },
    td: {
      fontSize: 14,
      color: theme.text,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border || theme.text + '20',
      minWidth: 80,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border || theme.text + '20',
    },
    link: {
      color: theme.primary,
      textDecorationLine: 'underline',
    },
    hr: {
      backgroundColor: theme.border || theme.text + '30',
      height: 1,
      marginVertical: 16,
    },
  });

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    loadingText: {
      color: theme.text + '60',
      fontSize: 14,
      marginLeft: 8,
      fontStyle: 'italic',
    },
    toolCallsContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: theme.primary + '10',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },
    toolCallLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
      marginBottom: 4,
    },
    toolCallText: {
      fontSize: 14,
      color: theme.text,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
      marginLeft: 4,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color={theme.text + '60'}
          />
          <Text style={styles.loadingText}>
            AI is typing...
          </Text>
        </View>
      </View>
    );
  }

  if (!message) return null;

  // Custom renderer for code blocks to make them horizontally scrollable
  const renderCodeBlock = (node: any, children: any, parent: any, styles: any) => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={{
          backgroundColor: theme.text + '10',
          borderRadius: 8,
          marginVertical: 8,
          borderWidth: 1,
          borderColor: theme.border || theme.text + '20',
        }}
        contentContainerStyle={{
          padding: 12,
        }}
      >
        <Text style={{
          fontSize: 14,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          color: theme.text,
          lineHeight: 20,
        }}>
          {node.content}
        </Text>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Message Content with Markdown - Full Width */}
      <Markdown
        style={markdownStyles}
        rules={{
          code_block: renderCodeBlock,
          fence: renderCodeBlock,
        }}
      >
        {displayContent}
      </Markdown>

      {/* Tool calls if any */}
      {message.type === 'ai' && message.tool_calls && message.tool_calls.length > 0 && (
        <View style={styles.toolCallsContainer}>
          <Text style={styles.toolCallLabel}>
            Tool Call
          </Text>
          {message.tool_calls.map((tool, index) => (
            <ScrollView
              key={index}
              horizontal
              showsHorizontalScrollIndicator={true}
            >
              <Text style={styles.toolCallText}>
                {tool.name}({JSON.stringify(tool.args)})
              </Text>
            </ScrollView>
          ))}
        </View>
      )}

      {/* Copy button - below message, aligned left */}
      <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
        <Ionicons
          name="copy-outline"
          size={16}
          color={theme.text + '60'}
        />
      </TouchableOpacity>
    </View>
  );
}
