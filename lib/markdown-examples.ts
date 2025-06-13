// Markdown examples for testing and demonstration

export const markdownExamples = {
  basic: `# Welcome to Markdown Chat!

This message demonstrates **basic markdown** support with *italic text* and \`inline code\`.

## Features Included:
- **Bold** and *italic* text formatting
- \`Inline code\` snippets
- Code blocks with syntax highlighting
- Tables for structured data
- Lists and blockquotes

### Quick Example:
\`\`\`javascript
function sayHello(name) {
  return \`Hello, \${name}! Welcome to markdown chat.\`;
}
\`\`\`

> This is a blockquote showcasing the markdown rendering capabilities.`,

  table: `# Data Table Example

Here's a comparison of different chat features:

| Feature | Status | Notes |
|---------|--------|-------|
| Text Messages | ✅ | Basic text support |
| Markdown | ✅ | Full markdown rendering |
| Code Blocks | ✅ | Syntax highlighting |
| Tables | ✅ | Structured data display |
| Lists | ✅ | Ordered and unordered |
| Blockquotes | ✅ | Quote formatting |

## Summary
All markdown features are now **fully supported** in the chat interface!`,

  code: `# Code Examples

## JavaScript Function:
\`\`\`javascript
function processMessage(content) {
  const words = content.split(' ');
  return words
    .map(word => word.toLowerCase())
    .filter(word => word.length > 3)
    .join(' ');
}

console.log(processMessage("Hello World"));
\`\`\`

## Python Example:
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Generate first 10 fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\`

## JSON Configuration:
\`\`\`json
{
  "app": {
    "name": "LangChat",
    "version": "1.0.0",
    "features": ["markdown", "streaming", "ai-chat"]
  }
}
\`\`\``,

  mixed: `# Mixed Content Demo

This demonstrates **all markdown features** working together:

## 1. Text Formatting
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`Inline code\` for technical terms
- ~~Strikethrough~~ for corrections

## 2. Code Block
\`\`\`typescript
interface ChatMessage {
  id: string;
  type: 'human' | 'ai';
  content: string;
  timestamp: Date;
}
\`\`\`

## 3. Comparison Table
| Approach | Pros | Cons |
|----------|------|------|
| Plain Text | Simple | Limited formatting |
| **Markdown** | Rich formatting | Requires parsing |
| HTML | Full control | Too complex |

## 4. Important Note
> **Remember**: Markdown makes chat messages more readable and engaging while maintaining simplicity.

### 5. Todo List
- [x] Implement basic markdown
- [x] Add table support
- [x] Style code blocks
- [ ] Add emoji support
- [ ] Add math expressions

*That's all for now!* 🚀`
};

export function getRandomMarkdownExample(): string {
  const examples = Object.values(markdownExamples);
  const randomIndex = Math.floor(Math.random() * examples.length);
  return examples[randomIndex];
}

export function getMarkdownExample(type: keyof typeof markdownExamples): string {
  return markdownExamples[type] || markdownExamples.basic;
}
