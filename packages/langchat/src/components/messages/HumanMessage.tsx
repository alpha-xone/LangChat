import { Message } from '@langchain/langgraph-sdk';
import React from 'react';
import { Dimensions } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useCopyToClipboard } from '../../hooks/common';
import { getContentString } from '../../lib/message-utils';
import { createMarkdownStyles } from '../../lib/utils';
import { Theme } from '../../theme';
import { CodeBlock, CopyButton, MessageBubble, MessageContainer } from '../common';

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
  const { copy } = useCopyToClipboard();

  const handleCopy = async () => {
    await copy(content, onCopy);
  };

  if (!message) return null;

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

  const markdownStyles = createMarkdownStyles(theme, showBubble, true);

  return (
    <MessageContainer isUser={true}>
      <MessageBubble
        theme={theme}
        showBubble={showBubble}
        isUser={true}
        style={{ maxWidth: maxMessageWidth }}
      >
        <Markdown
          style={markdownStyles as any}
          rules={{
            code_block: renderCodeBlock,
            fence: renderCodeBlock,
          }}
        >
          {content}
        </Markdown>
      </MessageBubble>
      {onCopy && (
        <CopyButton
          text={content}
          theme={theme}
          size="small"
          onCopy={onCopy}
          style={{
            marginTop: 5,
            marginRight: showBubble ? 3 : 8,
            alignSelf: 'flex-end',
          }}
        />
      )}
    </MessageContainer>
  );
}
