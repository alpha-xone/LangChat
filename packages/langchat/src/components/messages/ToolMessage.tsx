import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useState } from 'react';
import { Animated, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getContentString } from '../../lib/message-utils';
import { Theme } from '../../theme';

interface ToolMessageProps {
  message: Message;
  onCopy?: (text: string) => void;
  theme: Theme;
  showBubble?: boolean;
}

export function ToolMessage({ message, onCopy, theme, showBubble = false }: ToolMessageProps) {
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
    }
  };

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
      </ScrollView>
    );
  };

  return (
    <View style={{
      padding: 4,
      alignItems: 'flex-start',
    }}>
      <View style={{
        maxWidth: showBubble ? '85%' : '95%',
        backgroundColor: showBubble ? theme.surface : 'transparent',
        borderRadius: showBubble ? 18 : 0,
        paddingHorizontal: showBubble ? 12 : 0,
        paddingVertical: showBubble ? 0 : 0,
        elevation: showBubble ? 1 : 0,
        shadowColor: showBubble ? theme.surface : 'transparent',
        shadowOffset: showBubble ? { width: 0, height: 1 } : { width: 0, height: 0 },
        shadowOpacity: showBubble ? 0.1 : 0,
        shadowRadius: showBubble ? 2 : 0,
        borderWidth: showBubble ? 1 : 0,
        borderColor: showBubble ? theme.border + '40' : 'transparent',
      }}>
        {/* Tool message indicator */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: displayContent ? 6 : 0,
          opacity: 0.7,
        }}>
          <Ionicons
            name="build-outline"
            size={14}
            color={theme.text + '80'}
          />
          <Text style={{
            color: theme.text + '80',
            fontSize: 12,
            marginLeft: 4,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            Tool Response
          </Text>
        </View>

        {displayContent && (
          <Markdown
            style={{
              body: {
                color: theme.text + 'E0',
                fontSize: 14,
                margin: 0,
              },
              paragraph: {
                color: theme.text + 'E0',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 6,
              },
              strong: {
                fontWeight: 'bold',
                color: theme.text + 'E0',
              },
              em: {
                fontStyle: 'italic',
                color: theme.text + 'E0',
              },
              code_inline: {
                backgroundColor: theme.background,
                color: theme.primary,
                borderRadius: 4,
                paddingHorizontal: 4,
                paddingVertical: 2,
                fontSize: 12,
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              },
              code_block: {
                backgroundColor: theme.background,
                color: theme.text,
                borderRadius: 8,
                padding: 8,
                fontSize: 12,
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              },
              blockquote: {
                backgroundColor: theme.surface,
                borderLeftWidth: 3,
                borderLeftColor: theme.primary + '60',
                paddingLeft: 10,
                paddingVertical: 6,
                marginVertical: 6,
                fontStyle: 'italic',
              },
              list_item: {
                fontSize: 14,
                lineHeight: 20,
                color: theme.text + 'E0',
                marginBottom: 3,
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
        )}
      </View>
      {onCopy && displayContent && (
        <TouchableOpacity
          style={{
            marginTop: 4,
            alignSelf: 'flex-start',
          }}
          onPress={handleCopy}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={isCopied ? "checkmark" : "copy-outline"}
              size={14}
              color={theme.text + '60'}
            />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}
