import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import React from 'react';
import { Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useCopyToClipboard } from '../../hooks/common';
import { getContentString } from '../../lib/message-utils';
import { createMarkdownStyles, truncateText } from '../../lib/utils';
import { Theme } from '../../theme';
import { CodeBlock, CopyButton, MessageBubble, MessageContainer } from '../common';

interface ToolMessageProps {
  message: Message;
  onCopy?: (text: string) => void;
  theme: Theme;
  showBubble?: boolean;
  compact?: boolean;
}

export function ToolMessage({ message, onCopy, theme, showBubble = false, compact = false }: ToolMessageProps) {
  const displayContent = getContentString(message?.content);
  const { copy } = useCopyToClipboard();

  const handleCopy = async () => {
    await copy(displayContent, onCopy);
  };

  if (!message) return null;

  // Extract tool call ID from message if available
  const toolCallId = (message as any)?.tool_call_id;

  // Try to find associated tool call information
  const findToolName = () => {
    if (displayContent.toLowerCase().includes('weather')) return 'get_weather';
    if (displayContent.toLowerCase().includes('search')) return 'search';
    if (displayContent.toLowerCase().includes('calculator')) return 'calculate';
    return null;
  };

  const toolName = findToolName();

  // Compact version for minimal display
  if (compact) {
    return (
      <MessageContainer>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface + '80',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderLeftWidth: 2,
          borderLeftColor: theme.primary + '60',
        }}>
          <Ionicons
            name="construct"
            size={10}
            color={theme.primary + 'A0'}
          />
          <Text style={{
            fontSize: 10,
            color: theme.text + '80',
            marginLeft: 4,
            fontWeight: '500',
          }}>
            {toolName || 'Tool'}
          </Text>
          <Text style={{
            fontSize: 9,
            color: theme.text + '60',
            marginLeft: 6,
            flex: 1,
          }}>
            {truncateText(displayContent, 30)}
          </Text>
        </View>
      </MessageContainer>
    );
  }

  // Custom renderer for code blocks
  const renderCodeBlock = (node: any, children: any, parent: any, styles: any) => {
    const language = node.sourceInfo || node.lang || node.language || 'text';
    const codeContent = node.content || '';

    return (
      <CodeBlock
        code={codeContent}
        language={language}
        theme={theme}
        onCopy={onCopy}
      />
    );
  };

  const markdownStyles = createMarkdownStyles(theme, showBubble, false);

  return (
    <MessageContainer>
      <MessageBubble
        theme={theme}
        showBubble={showBubble}
        style={{
          borderLeftWidth: showBubble ? 3 : 2,
          borderLeftColor: theme.primary + '60',
          backgroundColor: showBubble ? theme.surface : theme.surface + '40',
        }}
      >
        {/* Tool header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: displayContent ? 6 : 0,
        }}>
          <Ionicons
            name="construct"
            size={14}
            color={theme.primary}
          />
          <Text style={{
            fontSize: 12,
            color: theme.primary,
            marginLeft: 6,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {toolName || 'Tool Response'}
          </Text>
          {toolCallId && (
            <Text style={{
              fontSize: 10,
              color: theme.text + '60',
              marginLeft: 8,
              fontFamily: 'monospace',
            }}>
              #{toolCallId.slice(-6)}
            </Text>
          )}
        </View>

        {/* Tool content */}
        {displayContent && (
          <Markdown
            style={markdownStyles as any}
            rules={{
              code_block: renderCodeBlock,
              fence: renderCodeBlock,
            }}
          >
            {displayContent}
          </Markdown>
        )}
      </MessageBubble>

      {onCopy && displayContent && (
        <CopyButton
          text={displayContent}
          theme={theme}
          size="small"
          onCopy={onCopy}
          style={{
            marginTop: 5,
            marginLeft: showBubble ? 10 : 8,
            alignSelf: 'flex-start',
          }}
        />
      )}
    </MessageContainer>
  );
}
