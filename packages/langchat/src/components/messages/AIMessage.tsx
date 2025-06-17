import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getContentString } from '../../lib/message-utils';
import { Theme } from '../../theme';

interface AIMessageProps {
  message: Message;
  isLoading?: boolean;
  onCopy?: (text: string) => void;
  theme: Theme;
}

export function AIMessage({ message, isLoading = false, onCopy, theme }: AIMessageProps) {
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

  if (isLoading) {
    return (
      <View style={{
        padding: 16,
        alignItems: 'flex-start',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 12,
          borderBottomLeftRadius: 4,
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
      </ScrollView>
    );
  };

  return (
    <View style={{
      padding: 16,
      alignItems: 'flex-start',
    }}>
      <View style={{
        maxWidth: '85%',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 12,
        borderBottomLeftRadius: 4,
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

        {onCopy && (
          <TouchableOpacity
            style={{
              marginTop: 8,
              alignSelf: 'flex-end',
            }}
            onPress={handleCopy}
          >
            <Text style={{
              color: theme.primary,
              fontSize: 12,
              fontWeight: '600',
            }}>
              Copy
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
