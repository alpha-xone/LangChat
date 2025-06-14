import React, { useCallback, useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@langchain/langgraph-sdk';
import { generateMessageId } from '../../lib/message-utils';
import { useTheme } from '../../context/ThemeContext';

interface StreamingDemoProps {
  onAddMessage: (message: Message) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  showModeInfo?: boolean;
  currentMode?: 'demo' | 'live';
}

export function StreamingDemo({
  onAddMessage,
  isStreaming,
  setIsStreaming,
  showModeInfo = false,
  currentMode = 'demo'
}: StreamingDemoProps) {
  const { theme } = useTheme();
  const [demoStep, setDemoStep] = useState(0);

  const runDemo = useCallback(async () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setDemoStep(0);

    try {
      // Step 1: User sends a message
      const userMessage: Message = {
        id: generateMessageId(),
        type: 'human',
        content: 'Hello! Can you help me understand how streaming works?',
      };

      onAddMessage(userMessage);
      setDemoStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: AI starts responding (streaming simulation)
      const responses = [
        'Hello! I\'d be happy to explain streaming.',
        'Streaming allows messages to appear in real-time...',
        'as the AI generates its response, rather than waiting...',
        'for the complete response to be ready.',
        'This creates a more natural conversation experience!'
      ];

      let currentContent = '';
      for (let i = 0; i < responses.length; i++) {
        currentContent += (i > 0 ? ' ' : '') + responses[i];

        const aiMessage: Message = {
          id: generateMessageId(),
          type: 'ai',
          content: currentContent,
        };

        onAddMessage(aiMessage);
        setDemoStep(2 + i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Step 3: Show tool call example
      await new Promise(resolve => setTimeout(resolve, 500));

      const toolCallMessage: Message = {
        id: generateMessageId(),
        type: 'ai',
        content: 'Let me also show you a tool call example:',
        tool_calls: [
          {
            id: 'call_123',
            name: 'get_weather',
            args: { location: 'San Francisco' },
          }
        ],
      } as any;

      onAddMessage(toolCallMessage);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalMessage: Message = {
        id: generateMessageId(),
        type: 'ai',
        content: 'This demo shows how LangGraph streaming works in real-time!',
      };

      onAddMessage(finalMessage);

    } catch (error) {
      console.error('Demo failed:', error);
      Alert.alert('Demo Error', 'Failed to run streaming demo');
    } finally {
      setIsStreaming(false);
      setDemoStep(0);
    }
  }, [isStreaming, onAddMessage, setIsStreaming]);

  const addSampleMessage = (content: string) => {
    const message: Message = {
      id: `demo-${Date.now()}`,
      type: 'ai',
      content,
    };
    onAddMessage(message);
  };

  return (
    <View style={{
      backgroundColor: theme.surface || theme.background,
      marginHorizontal: 16,
      marginVertical: 12,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border || theme.text + '20',
      elevation: 2,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <Ionicons
          name={currentMode === 'demo' ? 'play-circle-outline' : 'thunderstorm-outline'}
          size={24}
          color={theme.primary}
        />
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.text,
          marginLeft: 8
        }}>
          {currentMode === 'demo' ? 'Demo Mode' : 'Live Chat'}
        </Text>
      </View>

      {/* Description */}
      <Text style={{
        fontSize: 14,
        color: theme.text + '80',
        lineHeight: 20,
        marginBottom: 20
      }}>
        {currentMode === 'demo'
          ? 'Try the demo features below or start typing to see markdown rendering and AI responses.'
          : 'Connected to live AI assistant. Start typing to begin your conversation.'
        }
      </Text>

      {/* Demo buttons - only show in demo mode */}
      {currentMode === 'demo' && (
        <View style={{ gap: 12 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '500',
            color: theme.text,
            marginBottom: 8
          }}>
            Try these examples:
          </Text>

          <View style={{ gap: 8 }}>
            {/* Markdown Demo Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary + '15',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.primary + '30',
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => addSampleMessage(`# Welcome to Markdown Demo!

This is a **bold** text and this is *italic* text.

## Code Example
\`\`\`javascript
function greetUser(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Features List
- ✅ **Markdown rendering**
- ✅ Code syntax highlighting
- ✅ Tables and lists
- ✅ Blockquotes and more!

> This is a blockquote showing the markdown capabilities.`)}
            >
              <Ionicons
                name="reader-outline"
                size={16}
                color={theme.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                color: theme.primary,
                fontWeight: '500',
                fontSize: 14
              }}>
                Show Markdown Demo
              </Text>
            </TouchableOpacity>

            {/* Table Example Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.secondary + '15' || theme.primary + '15',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.secondary + '30' || theme.primary + '30',
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => addSampleMessage(`## Data Table Example

| Feature | Status | Priority |
|---------|--------|----------|
| Chat Interface | ✅ Complete | High |
| Markdown Support | ✅ Complete | High |
| Theme System | ✅ Complete | Medium |
| Live Streaming | 🔄 In Progress | High |

### Key Statistics
- **Response Time**: < 100ms
- **Uptime**: 99.9%
- **User Satisfaction**: 4.8/5 ⭐`)}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={theme.secondary || theme.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                color: theme.secondary || theme.primary,
                fontWeight: '500',
                fontSize: 14
              }}>
                Show Table Example
              </Text>
            </TouchableOpacity>

            {/* Code Examples Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.accent + '15' || theme.primary + '15',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.accent + '30' || theme.primary + '30',
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => addSampleMessage(`## Code Blocks with Syntax Highlighting

### Python Example
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Generate first 10 fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\`

### JSON Configuration
\`\`\`json
{
  "theme": "dark",
  "features": {
    "markdown": true,
    "codeHighlight": true,
    "streaming": true
  },
  "version": "2.0.0"
}
\`\`\`

### Inline Code
Use \`theme.primary\` for primary colors and \`theme.background\` for backgrounds.`)}
            >
              <Ionicons
                name="terminal-outline"
                size={16}
                color={theme.accent || theme.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                color: theme.accent || theme.primary,
                fontWeight: '500',
                fontSize: 14
              }}>
                Show Code Examples
              </Text>
            </TouchableOpacity>

            {/* Live Streaming Demo Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.success + '15' || theme.primary + '15',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.success + '30' || theme.primary + '30',
                flexDirection: 'row',
                alignItems: 'center',
                opacity: isStreaming ? 0.6 : 1,
              }}
              onPress={runDemo}
              disabled={isStreaming}
            >
              <Ionicons
                name={isStreaming ? "hourglass-outline" : "play-outline"}
                size={16}
                color={theme.success || theme.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                color: theme.success || theme.primary,
                fontWeight: '500',
                fontSize: 14
              }}>
                {isStreaming ? 'Running Demo...' : 'Show Streaming Demo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Live mode info */}
      {currentMode === 'live' && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.success + '15' || theme.primary + '15',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          marginTop: 8
        }}>
          <Ionicons
            name="wifi-outline"
            size={16}
            color={theme.success || theme.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={{
            fontSize: 14,
            color: theme.success || theme.primary,
            fontWeight: '500'
          }}>
            Connected to AI Assistant
          </Text>
        </View>
      )}
    </View>
  );
}
