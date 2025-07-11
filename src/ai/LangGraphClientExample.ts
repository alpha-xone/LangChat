import { LangGraphClient } from './LangGraphClient';
import type { LangGraphConfig } from './LangGraphClient';

/**
 * Example usage of LangGraphClient with token refresh functionality
 */

// Example token refresh function - replace with your actual implementation
async function refreshAccessToken(): Promise<string> {
  // This is where you would implement your token refresh logic
  // For example, calling your authentication service
  try {
    console.log('Refreshing access token...');

    // Example: Call your auth service to get a new token
    // const response = await fetch('/api/auth/refresh', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ refreshToken: getStoredRefreshToken() })
    // });
    // const { accessToken } = await response.json();
    // return accessToken;

    // For demo purposes, return a mock token
    return 'new-refreshed-token-123';
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw new Error('Token refresh failed');
  }
}

// Create LangGraph client with token refresh capability
const config: LangGraphConfig = {
  apiUrl: 'https://zero.work/aria', // Using actual working URL
  assistantId: 'chat', // Using "chat" like in the working example
  accessToken: 'initial-access-token',
  onTokenRefresh: refreshAccessToken, // Provide the token refresh callback
};

const client = new LangGraphClient(config);

// Example usage with automatic token refresh
async function runStreamingWithTokenRefresh() {
  try {
    // Create a thread
    const { threadId } = await client.createThread();
    console.log('Created thread:', threadId);

    // Send a message - if token expires, it will automatically refresh and retry
    const streamResponse = client.streamMessage(
      threadId,
      'Explain LangGraph streaming with token refresh.',
      {
        context: { userId: 'user123' },
        metadata: { source: 'mobile-app' }
      }
    );

    // Process streaming response - updated to match working testStream.js pattern
    for await (const chunk of streamResponse) {
      if (chunk.event === 'messages/partial') {
        for (const messageChunk of chunk.data) {
          if (messageChunk.content) {
            console.log('Chunk content:', messageChunk.content);
          }
        }
      } else {
        console.log('Other event:', chunk.event, chunk.data);
      }
    }

    // Get thread history - also supports automatic token refresh
    const messages = await client.getThreadMessages(threadId);
    console.log('Thread messages:', messages);

  } catch (error) {
    console.error('Error in streaming with token refresh:', error);
  }
}

// Example without token refresh (original behavior)
async function runStreamingWithoutTokenRefresh() {
  const configWithoutRefresh: LangGraphConfig = {
    apiUrl: 'https://zero.work/aria', // Using actual working URL
    assistantId: 'chat', // Using "chat" like in the working example
    accessToken: 'initial-access-token',
    // onTokenRefresh is not provided
  };

  const clientWithoutRefresh = new LangGraphClient(configWithoutRefresh);

  try {
    const { threadId } = await clientWithoutRefresh.createThread();

    const streamResponse = clientWithoutRefresh.streamMessage(
      threadId,
      'This will fail if token expires because no refresh callback is provided.'
    );

    for await (const chunk of streamResponse) {
      // Updated to match working testStream.js pattern
      if (chunk.event === 'messages/partial') {
        for (const messageChunk of chunk.data) {
          console.log('Chunk content:', messageChunk.content);
        }
      } else {
        console.log('Other event:', chunk.event, chunk.data);
      }
    }
  } catch (error) {
    // If token expires, this will throw an error without attempting refresh
    console.error('Error without token refresh:', error);
  }
}

// Manual token update example
async function manualTokenUpdate() {
  const newToken = await refreshAccessToken();
  client.updateAccessToken(newToken);
  console.log('Token manually updated');
}

export {
  runStreamingWithTokenRefresh,
  runStreamingWithoutTokenRefresh,
  manualTokenUpdate,
  refreshAccessToken,
};
