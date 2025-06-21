import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getContentString } from '../../lib/message-utils';
import { Theme } from '../../theme';

interface HumanMessageProps {
  message: Message;
  onCopy?: (text: string) => void;
  theme: Theme;
  showBubble?: boolean;
}

export function HumanMessage({ message, onCopy, theme, showBubble = true }: HumanMessageProps) {
  const content = getContentString(message?.content);
  const screenWidth = Dimensions.get('window').width;
  const maxMessageWidth = screenWidth * 0.85;
  const [isCopied, setIsCopied] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(content);
      onCopy?.(content);

      // Show copied state with animation
      setIsCopied(true);

      // Scale animation for feedback
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();

      // Reset back to copy icon after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };
  // Markdown styles for human messages (conditional based on showBubble)
  const textColor = showBubble ? '#FFFFFF' : theme.text;
  const markdownStyles = StyleSheet.create({
    body: {
      color: textColor,
      fontSize: 16,
      lineHeight: 22,
      margin: 0,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      marginTop: 16,
      marginBottom: 8,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: textColor,
      marginTop: 12,
      marginBottom: 6,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginTop: 10,
      marginBottom: 4,
    },
    heading4: {
      fontSize: 16,
      fontWeight: '600',
      color: showBubble ? '#E8F4FF' : textColor,
      marginTop: 8,
      marginBottom: 4,
    },
    heading5: {
      fontSize: 14,
      fontWeight: '600',
      color: showBubble ? '#E8F4FF' : textColor,
      marginTop: 6,
      marginBottom: 2,
    },
    heading6: {
      fontSize: 12,
      fontWeight: '600',
      color: showBubble ? '#D0E8FF' : textColor,
      marginTop: 4,
      marginBottom: 2,
    },    paragraph: {
      color: textColor,
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
      color: textColor,
    },
    em: {
      fontStyle: 'italic',
      color: textColor,
    },
    code_inline: {
      backgroundColor: showBubble ? 'rgba(255, 255, 255, 0.2)' : theme.background,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      color: showBubble ? '#FFFFFF' : theme.primary,
    },
    code_block: {
      backgroundColor: showBubble ? 'rgba(255, 255, 255, 0.1)' : theme.background,
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      color: textColor,
      borderWidth: 1,
      borderColor: showBubble ? 'rgba(255, 255, 255, 0.2)' : theme.border,
    },
    fence: {
      backgroundColor: showBubble ? 'rgba(255, 255, 255, 0.1)' : theme.background,
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      color: textColor,
      borderWidth: 1,
      borderColor: showBubble ? 'rgba(255, 255, 255, 0.2)' : theme.border,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },    list_item: {
      color: textColor,
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
      backgroundColor: textColor,
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
    },    table: {
      borderWidth: 1,
      borderColor: showBubble ? 'rgba(255, 255, 255, 0.3)' : theme.border,
      borderRadius: 6,
      marginVertical: 8,
    },
    thead: {
      backgroundColor: showBubble ? 'rgba(255, 255, 255, 0.1)' : theme.surface,
    },
    tbody: {},
    th: {
      fontSize: 14,
      fontWeight: 'bold',
      color: textColor,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: showBubble ? 'rgba(255, 255, 255, 0.3)' : theme.border,
      borderRightWidth: 1,
      borderRightColor: showBubble ? 'rgba(255, 255, 255, 0.3)' : theme.border,
    },
    td: {
      fontSize: 14,
      color: textColor,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: showBubble ? 'rgba(255, 255, 255, 0.2)' : theme.border,
      borderRightWidth: 1,
      borderRightColor: showBubble ? 'rgba(255, 255, 255, 0.2)' : theme.border,
      flex: 1,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: showBubble ? 'rgba(255, 255, 255, 0.2)' : theme.border,
      flexDirection: 'row',
    },
    blockquote: {
      backgroundColor: showBubble ? 'rgba(255, 255, 255, 0.1)' : theme.surface,
      borderLeftWidth: 4,
      borderLeftColor: showBubble ? 'rgba(255, 255, 255, 0.4)' : theme.primary,
      paddingLeft: 12,
      paddingRight: 12,
      paddingVertical: 8,
      marginVertical: 8,
      fontStyle: 'italic',
    },
    hr: {
      backgroundColor: showBubble ? 'rgba(255, 255, 255, 0.3)' : theme.border,
      height: 1,
      marginVertical: 16,
    },
    link: {
      color: showBubble ? '#B3D9FF' : theme.primary,
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
          backgroundColor: showBubble ? 'rgba(255, 255, 255, 0.1)' : theme.background,
          borderRadius: 8,
          marginVertical: 8,
          borderWidth: 1,
          borderColor: showBubble ? 'rgba(255, 255, 255, 0.2)' : theme.border,
        }}
        contentContainerStyle={{
          padding: 12,
        }}
      >
        <Text style={{
          fontSize: 14,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          color: textColor,
          lineHeight: 20,
        }}>
          {node.content}
        </Text>
      </ScrollView>
    );
  };const styles = StyleSheet.create({
    container: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      marginBottom: 0,
      paddingHorizontal: 16,
    },
    messageWrapper: {
      maxWidth: showBubble ? maxMessageWidth : '95%',
    },
    messageContainer: {
      backgroundColor: showBubble ? theme.primary : 'transparent',
      borderRadius: showBubble ? 18 : 0,
      paddingHorizontal: showBubble ? 12 : 0,
      paddingVertical: showBubble ? 0 : 0,
      elevation: showBubble ? 2 : 0,
      shadowColor: showBubble ? theme.primary : 'transparent',
      shadowOffset: showBubble ? { width: 0, height: 2 } : { width: 0, height: 0 },
      shadowOpacity: showBubble ? 0.2 : 0,
      shadowRadius: showBubble ? 4 : 0,
    },
    copyButton: {
      marginTop: 5,
      marginRight: 5,
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
      <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={isCopied ? "checkmark" : "copy-outline"}
            size={16}
            color={theme.text + '60'}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
