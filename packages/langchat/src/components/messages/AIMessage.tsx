import { Message } from '@langchain/langgraph-sdk';
import React from 'react';
import Markdown from 'react-native-markdown-display';
import { useCopyToClipboard } from '../../hooks/common';
import { getContentString } from '../../lib/message-utils';
import { createMarkdownStyles } from '../../lib/utils';
import { Theme } from '../../theme';
import { CodeBlock, CopyButton, LoadingDots, MessageBubble, MessageContainer } from '../common';

interface AIMessageProps {
  message: Message;
  isLoading?: boolean;
  onCopy?: (text: string) => void;
  theme: Theme;
  showBubble?: boolean;
}

export function AIMessage({ message, isLoading = false, onCopy, theme, showBubble = false }: AIMessageProps) {
  const displayContent = getContentString(message?.content);
  const { copy } = useCopyToClipboard();

  const handleCopy = async () => {
    await copy(displayContent, onCopy);
  };

  if (isLoading) {
    return (
      <MessageContainer>
        <MessageBubble theme={theme} showBubble={showBubble}>
          <LoadingDots theme={theme} />
        </MessageBubble>
      </MessageContainer>
    );
  }

  if (!message) return null;

  // Return null for empty AI messages (but keep loading state)
  if (!displayContent || displayContent.trim() === '') {
    return null;
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
      <MessageBubble theme={theme} showBubble={showBubble}>
        <Markdown
          style={markdownStyles as any}
          rules={{
            code_block: renderCodeBlock,
            fence: renderCodeBlock,
          }}
        >
          {displayContent}
        </Markdown>
      </MessageBubble>
      {onCopy && (
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
