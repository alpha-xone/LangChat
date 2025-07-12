import { LangGraphClient, StreamParser } from '../index';
import AuthService from '../../data/AuthService';
import { ChatService } from '../../data/ChatService';

// Mock data for testing
const mockConfig = {
  apiUrl: 'https://test-api.com',
  assistantId: 'test-agent',
};

const mockMessage = {
  id: 'test-msg-1',
  type: 'human' as const,
  content: 'Hello, how are you?',
  metadata: {},
  timestamp: new Date().toISOString(),
  isComplete: true,
};

describe('LangGraph Integration', () => {
  let authService: AuthService;
  let client: LangGraphClient;
  let parser: StreamParser;
  let chatService: ChatService;

  beforeEach(() => {
    authService = new AuthService();
    client = new LangGraphClient(mockConfig, authService);
    parser = new StreamParser();
    chatService = new ChatService();
  });

  describe('LangGraphClient', () => {
    it('should initialize with config', () => {
      expect(client).toBeDefined();
    });

    it('should update config', () => {
      const newConfig = { ...mockConfig, assistantId: 'new-agent' };
      client.updateConfig(newConfig);
      expect(client).toBeDefined();
    });
  });

  describe('StreamParser', () => {
    it('should parse message events', () => {
      const mockEvent = {
        event: 'messages/complete',
        data: {
          messages: [{
            id: 'ai-msg-1',
            type: 'ai',
            content: 'Hello! I am doing well, thank you for asking.',
          }],
        },
      };

      const parsed = parser.parseStreamEvent(mockEvent);
      expect(parsed).toBeDefined();
      expect(parsed?.type).toBe('ai');
      expect(parsed?.content).toContain('Hello!');
    });

    it('should handle error events', () => {
      let errorReceived = '';
      const parserWithCallback = new StreamParser({
        onError: (error: string) => { errorReceived = error; },
      });

      const errorEvent = {
        event: 'error',
        data: { error: 'Test error message' },
      };

      parserWithCallback.parseStreamEvent(errorEvent);
      expect(errorReceived).toBe('Test error message');
    });

    it('should manage message buffer', () => {
      const testMessage = {
        id: 'buffer-test',
        type: 'ai' as const,
        content: 'Test content',
        metadata: {},
        timestamp: new Date().toISOString(),
        isComplete: true,
      };

      // Simulate adding message through parsing
      const mockEvent = {
        event: 'messages/complete',
        data: {
          message: {
            id: testMessage.id,
            type: testMessage.type,
            content: testMessage.content,
          },
        },
      };

      parser.parseStreamEvent(mockEvent);
      const messages = parser.getAllMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]?.id).toBe(testMessage.id);

      parser.clearBuffer();
      expect(parser.getAllMessages()).toHaveLength(0);
    });
  });

  describe('ChatService', () => {
    it('should initialize correctly', () => {
      expect(chatService).toBeDefined();
    });

    it('should convert between message formats', () => {
      const parsedMessage = mockMessage;
      const chatMessage = chatService.parsedMessageToChatMessage('thread-1', parsedMessage);

      expect(chatMessage.thread_id).toBe('thread-1');
      expect(chatMessage.message_id).toBe(parsedMessage.id);
      expect(chatMessage.type).toBe(parsedMessage.type);
      expect(chatMessage.content).toBe(parsedMessage.content);

      const backToParsed = chatService.chatMessageToParsedMessage({
        ...chatMessage,
        id: 'db-id',
        created_at: parsedMessage.timestamp,
      });

      expect(backToParsed.id).toBe(parsedMessage.id);
      expect(backToParsed.type).toBe(parsedMessage.type);
      expect(backToParsed.content).toBe(parsedMessage.content);
    });

    it('should generate appropriate thread titles', () => {
      const shortMessage = 'Hello';
      const longMessage = 'This is a very long message that should be truncated because it exceeds the maximum length allowed for thread titles';

      expect(chatService.generateThreadTitle(shortMessage)).toBe('Hello');

      const longTitle = chatService.generateThreadTitle(longMessage);
      expect(longTitle.length).toBeLessThanOrEqual(50);
      expect(longTitle.endsWith('...')).toBe(true);
    });
  });

  describe('Message Type Normalization', () => {
    it('should normalize various message types correctly', () => {
      const testCases = [
        { input: 'human', expected: 'human' },
        { input: 'user', expected: 'human' },
        { input: 'ai', expected: 'ai' },
        { input: 'assistant', expected: 'ai' },
        { input: 'system', expected: 'system' },
        { input: 'tool', expected: 'tool' },
        { input: 'unknown', expected: 'ai' },
      ];

      testCases.forEach(({ input, expected }) => {
        const mockEvent = {
          event: 'messages/complete',
          data: {
            message: {
              id: `test-${input}`,
              type: input,
              content: 'Test message',
            },
          },
        };

        const parsed = parser.parseStreamEvent(mockEvent);
        expect(parsed?.type).toBe(expected);
      });
    });
  });

  describe('Content Extraction', () => {
    it('should extract content from different formats', () => {
      const testCases = [
        {
          name: 'string content',
          data: { content: 'Simple string content' },
          expected: 'Simple string content',
        },
        {
          name: 'array content with text blocks',
          data: {
            content: [
              { type: 'text', text: 'First block' },
              { type: 'image', url: 'https://example.com/image.jpg' },
              { type: 'text', text: 'Second block' },
            ],
          },
          expected: 'First block\nSecond block',
        },
        {
          name: 'text property',
          data: { text: 'Text property content' },
          expected: 'Text property content',
        },
        {
          name: 'empty content',
          data: {},
          expected: '',
        },
      ];

      testCases.forEach(({ name, data, expected }) => {
        const mockEvent = {
          event: 'messages/complete',
          data: {
            message: {
              id: `test-${name}`,
              type: 'ai',
              ...data,
            },
          },
        };

        const parsed = parser.parseStreamEvent(mockEvent);
        expect(parsed?.content).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed stream events gracefully', () => {
      const malformedEvents = [
        { event: 'messages/complete', data: null },
        { event: 'messages/complete', data: undefined },
        { event: 'messages/complete', data: 'not an object' },
        { event: 'unknown-event', data: {} },
      ];

      malformedEvents.forEach((event) => {
        expect(() => parser.parseStreamEvent(event)).not.toThrow();
      });
    });

    it('should handle missing required fields', () => {
      const eventWithoutId = {
        event: 'messages/complete',
        data: {
          message: {
            type: 'ai',
            content: 'Content without ID',
          },
        },
      };

      const parsed = parser.parseStreamEvent(eventWithoutId);
      expect(parsed).toBeDefined();
      expect(parsed?.id).toBeDefined(); // Should generate an ID
      expect(parsed?.content).toBe('Content without ID');
    });
  });
});

// Integration test helpers
export const createMockLangGraphConfig = (overrides = {}) => ({
  apiUrl: 'https://mock-api.com',
  assistantId: 'mock-agent',
  ...overrides,
});

export const createMockParsedMessage = (overrides = {}) => ({
  id: `mock-${Date.now()}`,
  type: 'ai' as const,
  content: 'Mock AI response',
  metadata: {},
  timestamp: new Date().toISOString(),
  isComplete: true,
  ...overrides,
});

export const createMockStreamEvent = (type = 'messages/complete', data = {}) => ({
  event: type,
  data: {
    message: {
      id: `mock-${Date.now()}`,
      type: 'ai',
      content: 'Mock stream content',
      ...data,
    },
  },
});

// Mock implementations for testing
export class MockLangGraphClient {
  constructor(_config: any, _authService: any) {
    // Mock implementation
  }

  async getOrCreateThread(threadId?: string) {
    return {
      thread_id: threadId || `mock-thread-${Date.now()}`,
      created_at: new Date().toISOString(),
      metadata: {},
    };
  }

  async *streamMessage(_threadId: string, message: any) {
    // Simulate streaming response
    yield createMockStreamEvent('messages/partial', {
      content: 'Thinking...',
    });

    yield createMockStreamEvent('messages/complete', {
      content: `Response to: ${message.content}`,
    });
  }

  async getThreadMessages() {
    return [];
  }
}

export default {
  LangGraphClient,
  StreamParser,
  ChatService,
  createMockLangGraphConfig,
  createMockParsedMessage,
  createMockStreamEvent,
  MockLangGraphClient,
};
