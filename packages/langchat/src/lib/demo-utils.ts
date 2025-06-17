import { Message } from '@langchain/langgraph-sdk';
import { getMarkdownExample, getRandomMarkdownExample } from './markdown-examples';
import { generateMessageId } from './message-utils';

export const createDemoResponse = (userText: string): string => {
  const lowerText = userText.toLowerCase();

  if (lowerText.includes('markdown') || lowerText.includes('example')) {
    return getRandomMarkdownExample();
  } else if (lowerText.includes('table')) {
    return getMarkdownExample('table');
  } else if (lowerText.includes('code')) {
    return getMarkdownExample('code');
  } else if (lowerText.includes('mixed') || lowerText.includes('all')) {
    return getMarkdownExample('mixed');
  } else if (lowerText.includes('basic')) {
    return getMarkdownExample('basic');
  }

  return `# Demo Response

Your message: **${userText.trim()}**

## Try these commands:
- Type "markdown" or "example" for random markdown demo
- Type "table" for table examples
- Type "code" for code block examples
- Type "mixed" or "all" for comprehensive demo
- Type "basic" for basic markdown features

### Current Features:
- ✅ **Bold** and *italic* text
- ✅ \`Inline code\` formatting
- ✅ Code blocks with syntax highlighting
- ✅ Tables and lists
- ✅ Blockquotes and headers

> Try different keywords to see various markdown examples!`;
};

export const simulateDemoResponse = (
  userText: string,
  addMessage: (message: Message) => void,
  delay: number = 1000
): void => {
  setTimeout(() => {
    const demoContent = createDemoResponse(userText);
    const aiMessage: Message = {
      id: generateMessageId(),
      type: 'ai',
      content: demoContent,
    };
    addMessage(aiMessage);
  }, delay);
};