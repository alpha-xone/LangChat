import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useState } from 'react';
import { Animated, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getContentString } from '../../lib/message-utils';
import { Theme } from '../../theme';

interface AIMessageProps {
  message: Message;
  isLoading?: boolean;
  onCopy?: (text: string) => void;
  theme: Theme;
  showBubble?: boolean;
}

export function AIMessage({ message, isLoading = false, onCopy, theme, showBubble = false }: AIMessageProps) {
  const displayContent = getContentString(message?.content);
  const [isCopied, setIsCopied] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCopy = async () => {
    if (!displayContent) return;

    try {
      await Clipboard.setStringAsync(displayContent);
      onCopy?.(displayContent);

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
    }  };  if (isLoading) {
    return (
      <View style={{
        padding: 4,
        alignItems: 'flex-start',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: showBubble ? theme.surface : 'transparent',
          borderRadius: showBubble ? 18 : 0,
          padding: showBubble ? 12 : 0,
          elevation: showBubble ? 2 : 0,
          shadowColor: showBubble ? theme.surface : 'transparent',
          shadowOffset: showBubble ? { width: 0, height: 2 } : { width: 0, height: 0 },
          shadowOpacity: showBubble ? 0.2 : 0,
          shadowRadius: showBubble ? 4 : 0,
        }}>
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color={theme.text + '60'}
          />
          <Text style={{
            color: theme.text + '60',
            fontSize: 14,
            marginLeft: 8,
            fontStyle: 'italic',
          }}>
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
          backgroundColor: theme.background,
          borderRadius: 8,
          marginVertical: 8,
          borderWidth: 1,
          borderColor: theme.border,
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
      </ScrollView>    );
  };  return (
    <View style={{
      padding: 4,
      alignItems: 'flex-start',
    }}>
      <View style={{
        maxWidth: showBubble ? '85%' : '95%',
        backgroundColor: showBubble ? theme.surface : 'transparent',
        borderRadius: showBubble ? 18 : 0,
        paddingHorizontal: showBubble ? 15 : 8,
        paddingVertical: showBubble ? 5 : 0,
        elevation: showBubble ? 2 : 0,
        shadowColor: showBubble ? theme.surface : 'transparent',
        shadowOffset: showBubble ? { width: 0, height: 2 } : { width: 0, height: 0 },
        shadowOpacity: showBubble ? 0.2 : 0,
        shadowRadius: showBubble ? 4 : 0,
      }}>
        <Markdown
          style={{
            body: {
              color: theme.text,
              fontSize: 16,
              margin: 0,
            },
            paragraph: {
              color: theme.text,
              fontSize: 16,
              lineHeight: 24,
              marginTop: showBubble ? 3 : 0,
              marginBottom: showBubble ? 5 : 0,
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
              backgroundColor: theme.background,
              color: theme.primary,
              borderRadius: 4,
              paddingHorizontal: 4,
              paddingVertical: 2,
              fontSize: 14,
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            },
            code_block: {
              backgroundColor: theme.background,
              color: theme.text,
              borderRadius: 8,
              padding: 8,
              fontSize: 14,
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            },
            blockquote: {
              backgroundColor: theme.surface,
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
            link: {
              color: theme.primary,
              textDecorationLine: 'underline',
            },
          }}
          rules={{
            code_block: renderCodeBlock,
            fence: renderCodeBlock,
          }}
        >
          {displayContent}
        </Markdown>
      </View>
      {onCopy && (
        <TouchableOpacity
          style={{
            marginTop: 5,
            marginLeft: showBubble ? 10 : 8,
            alignSelf: 'flex-start',
          }}
          onPress={handleCopy}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={isCopied ? "checkmark" : "copy-outline"}
              size={16}
              color={theme.text + '60'}
            />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}
