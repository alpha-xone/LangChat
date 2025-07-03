import { LangGraphClient } from '../ai/LangGraphClient';

// Mock AuthService
jest.mock('../data/AuthService', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  })),
}));

describe('LangGraphClient', () => {
  let client: LangGraphClient;
  const mockConfig = {
    apiUrl: 'https://test-api.langgraph.com',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new LangGraphClient(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(client).toBeInstanceOf(LangGraphClient);
    });

    it('should set default values for missing config options', () => {
      const minimalConfig = { apiUrl: 'https://test.com' };
      const clientWithDefaults = new LangGraphClient(minimalConfig);

      const config = clientWithDefaults.getConfig();
      expect(config.defaultAssistantId).toBe('default');
      expect(config.timeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const mockRunId = 'run-123';

      // Mock the client.runs.create method
      const mockCreate = jest.fn().mockResolvedValue({ run_id: mockRunId });
      (client as any).client.runs.create = mockCreate;

      const result = await client.sendMessage('thread-1', 'Hello world');

      expect(result).toBe(mockRunId);
      expect(mockCreate).toHaveBeenCalledWith('thread-1', 'default', expect.any(Object));
    });

    it('should handle custom assistant ID', async () => {
      const mockRunId = 'run-123';
      const mockCreate = jest.fn().mockResolvedValue({ run_id: mockRunId });
      (client as any).client.runs.create = mockCreate;

      await client.sendMessage('thread-1', 'Hello', [], {
        assistantId: 'custom-assistant',
      });

      expect(mockCreate).toHaveBeenCalledWith('thread-1', 'custom-assistant', expect.any(Object));
    });

    it('should throw error when API call fails', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      (client as any).client.runs.create = mockCreate;

      await expect(client.sendMessage('thread-1', 'Hello')).rejects.toThrow('Failed to send message');
    });
  });

  describe('createThread', () => {
    it('should create a thread successfully', async () => {
      const mockThreadId = 'thread-123';
      const mockCreate = jest.fn().mockResolvedValue({ thread_id: mockThreadId });
      (client as any).client.threads.create = mockCreate;

      const result = await client.createThread({ test: 'metadata' });

      expect(result).toBe(mockThreadId);
      expect(mockCreate).toHaveBeenCalledWith({
        metadata: expect.objectContaining({
          test: 'metadata',
          createdAt: expect.any(String),
        }),
      });
    });

    it('should handle thread creation failure', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('Creation failed'));
      (client as any).client.threads.create = mockCreate;

      await expect(client.createThread()).rejects.toThrow('Failed to create thread');
    });
  });

  describe('deleteThread', () => {
    it('should delete a thread successfully', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      (client as any).client.threads.delete = mockDelete;

      await client.deleteThread('thread-123');

      expect(mockDelete).toHaveBeenCalledWith('thread-123');
    });

    it('should handle thread deletion failure', async () => {
      const mockDelete = jest.fn().mockRejectedValue(new Error('Deletion failed'));
      (client as any).client.threads.delete = mockDelete;

      await expect(client.deleteThread('thread-123')).rejects.toThrow('Failed to delete thread');
    });
  });

  describe('getRunStatus', () => {
    it('should get run status successfully', async () => {
      const mockRun = {
        status: 'success',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:01:00Z',
      };
      const mockGet = jest.fn().mockResolvedValue(mockRun);
      (client as any).client.runs.get = mockGet;

      const result = await client.getRunStatus('thread-123', 'run-456');

      expect(result).toEqual({
        status: 'success',
        completedAt: '2025-01-01T00:01:00Z',
        error: undefined,
      });
    });

    it('should handle error status', async () => {
      const mockRun = {
        status: 'error',
        created_at: '2025-01-01T00:00:00Z',
      };
      const mockGet = jest.fn().mockResolvedValue(mockRun);
      (client as any).client.runs.get = mockGet;

      const result = await client.getRunStatus('thread-123', 'run-456');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Run failed');
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      const mockSearch = jest.fn().mockResolvedValue([]);
      (client as any).client.assistants.search = mockSearch;

      const result = await client.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when API is unhealthy', async () => {
      const mockSearch = jest.fn().mockRejectedValue(new Error('API down'));
      (client as any).client.assistants.search = mockSearch;

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should return current config', () => {
      const config = client.getConfig();

      expect(config.apiUrl).toBe(mockConfig.apiUrl);
      expect(config.apiKey).toBe(mockConfig.apiKey);
    });

    it('should update config', () => {
      const updates = { timeout: 60000 };
      client.updateConfig(updates);

      const config = client.getConfig();
      expect(config.timeout).toBe(60000);
    });
  });
});
