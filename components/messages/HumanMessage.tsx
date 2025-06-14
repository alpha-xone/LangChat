import { getContentString } from '@/lib/message-utils';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface HumanMessageProps {
  message: Message;
  onCopy?: (text: string) => void;
}

export function HumanMessage({ message, onCopy }: HumanMessageProps) {
  const { theme } = useTheme();
  const content = getContentString(message?.content);
  const screenWidth = Dimensions.get('window').width;
  const maxMessageWidth = screenWidth * 0.85;

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(content);
      onCopy?.(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // Markdown styles for human messages (white text on primary background)
  const markdownStyles = StyleSheet.create({
    body: {
      color: '#FFFFFF',
      fontSize: 16,
      lineHeight: 22,
      margin: 0,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 16,
      marginBottom: 8,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 12,
      marginBottom: 6,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 10,
      marginBottom: 4,
    },
    heading4: {
      fontSize: 16,
      fontWeight: '600',
      color: '#E8F4FF',
      marginTop: 8,
      marginBottom: 4,
    },
    heading5: {
      fontSize: 14,
      fontWeight: '600',
      color: '#E8F4FF',
      marginTop: 6,
      marginBottom: 2,
    },
    heading6: {
      fontSize: 12,
      fontWeight: '600',
      color: '#D0E8FF',
      marginTop: 4,
      marginBottom: 2,
    },
    paragraph: {
      color: '#FFFFFF',
      fontSize: 16,
      lineHeight: 22,
      marginVertical: 4,
      flexWrap: 'wrap',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    strong: {
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    em: {
      fontStyle: 'italic',
      color: '#FFFFFF',
    },
    code_inline: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      color: '#FFFFFF',
    },
    code_block: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      color: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    fence: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      color: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      color: '#FFFFFF',
      fontSize: 16,
      lineHeight: 22,
      marginVertical: 2,
    },
    bullet_list_icon: {
      marginLeft: 6,
      marginRight: 6,
      marginTop: 6,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#FFFFFF',
    },
    bullet_list_content: {
      flex: 1,
    },
    ordered_list_icon: {
      marginLeft: 6,
      marginRight: 6,
      minWidth: 20,
    },
    ordered_list_content: {
      flex: 1,
    },
    table: {
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 6,
      marginVertical: 8,
    },
    thead: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    tbody: {},
    th: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.3)',
      borderRightWidth: 1,
      borderRightColor: 'rgba(255, 255, 255, 0.3)',
    },
    td: {
      fontSize: 14,
      color: '#FFFFFF',
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
      borderRightWidth: 1,
      borderRightColor: 'rgba(255, 255, 255, 0.2)',
      flex: 1,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
      flexDirection: 'row',
    },
    blockquote: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderLeftWidth: 4,
      borderLeftColor: 'rgba(255, 255, 255, 0.4)',
      paddingLeft: 12,
      paddingRight: 12,
      paddingVertical: 8,
      marginVertical: 8,
      fontStyle: 'italic',
    },
    hr: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      height: 1,
      marginVertical: 16,
    },
    link: {
      color: '#B3D9FF',
      textDecorationLine: 'underline',
    },
  });

  // Custom renderer for code blocks to make them horizontally scrollable
  const renderCodeBlock = (node: any, children: any, parent: any, styles: any) => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          marginVertical: 8,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}
        contentContainerStyle={{
          padding: 12,
        }}
      >
        <Text style={{
          fontSize: 14,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          color: '#FFFFFF',
          lineHeight: 20,
        }}>
          {node.content}
        </Text>
      </ScrollView>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    messageWrapper: {
      maxWidth: maxMessageWidth,
    },
    messageContainer: {
      backgroundColor: theme.primary,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 3,
      elevation: 2,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    copyButton: {
      marginTop: 8,
      marginRight: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.messageWrapper}>
        <View style={styles.messageContainer}>
          <Markdown
            style={markdownStyles}
            rules={{
              code_block: renderCodeBlock,
              fence: renderCodeBlock,
            }}
          >
            {content}
          </Markdown>
        </View>
      </View>

      {/* Copy button - below message, aligned right */}
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
