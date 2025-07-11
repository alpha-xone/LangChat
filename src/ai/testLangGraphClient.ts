import { LangGraphClient } from './LangGraphClient';
import type { LangGraphConfig } from './LangGraphClient';

/**
 * Test streaming functionality based on the working testStream.js example
 */
async function testStreamingWithClient() {
  // Configuration matching the working example
  const config: LangGraphConfig = {
    apiUrl: "https://zero.work/aria",
    assistantId: "chat", // Using "chat" like in the working example
    accessToken: "eyJhbGciOiJIUzI1NiIsImtpZCI6ImZNMFhMZC90RGJFRms5bU8iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3VmcGpycmVoZXdyYmhlbmxrZW1hLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1ZTA2OGY2YS0xNjA2LTRlMDAtYjFhYy1mZTJkZThkMTYwNGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyMjM5NTYzLCJpYXQiOjE3NTIyMzU5NjMsImVtYWlsIjoiaHVhbmcuc2hhbmd0aW5nQGxpdmUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Imh1YW5nLnNoYW5ndGluZ0BsaXZlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiU3RhbiBIIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI1ZTA2OGY2YS0xNjA2LTRlMDAtYjFhYy1mZTJkZThkMTYwNGQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MjE5ODk1OH1dLCJzZXNzaW9uX2lkIjoiYTE5NDQxNzktZTJjYy00NDU1LTlkNDAtNjExMDQ0ODVhY2U5IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.CYNPxg9wrro1Q1sSLEpKqjzUkiDMi-RpDZ4TGkhJ6Wo",
    // Add token refresh capability
    onTokenRefresh: async () => {
      console.log('Token refresh would be called here');
      // In a real app, this would call your auth service
      throw new Error('Token refresh not implemented for test');
    }
  };

  const client = new LangGraphClient(config);

  try {
    console.log('Creating new thread...');

    // Create a new thread
    const { threadId } = await client.createThread();
    console.log('Created thread:', threadId);

    console.log('Starting streaming...');

    // Start streaming with the same message as the working example
    const streamResponse = client.streamMessage(
      threadId,
      "Tell me a joke of girls"
    );

    // Consume the stream and log chunks (matching the working example pattern)
    for await (const chunk of streamResponse) {
      if (chunk.event === "messages/partial") {
        for (const messageChunk of chunk.data) {
          if (messageChunk.content) {
            console.log("Chunk content:", messageChunk.content);
          }
        }
      } else {
        console.log("Other event:", chunk.event, chunk.data);
      }

      // Alternative: Use the helper method
      const textChunks = LangGraphClient.extractStreamingText(chunk);
      if (textChunks.length > 0) {
        console.log("Extracted text:", textChunks.join(''));
      }
    }

    console.log('Streaming completed successfully!');

    // Get the thread messages to verify everything worked
    console.log('Retrieving thread messages...');
    const messages = await client.getThreadMessages(threadId);
    console.log('Thread messages:', messages);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Test streaming without token refresh (simpler version)
 */
async function testStreamingSimple() {
  const config: LangGraphConfig = {
    apiUrl: "https://zero.work/aria",
    assistantId: "chat",
    accessToken: "eyJhbGciOiJIUzI1NiIsImtpZCI6ImZNMFhMZC90RGJFRms5bU8iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3VmcGpycmVoZXdyYmhlbmxrZW1hLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1ZTA2OGY2YS0xNjA2LTRlMDAtYjFhYy1mZTJkZThkMTYwNGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyMjM5NTYzLCJpYXQiOjE3NTIyMzU5NjMsImVtYWlsIjoiaHVhbmcuc2hhbmd0aW5nQGxpdmUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Imh1YW5nLnNoYW5ndGluZ0BsaXZlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiU3RhbiBIIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI1ZTA2OGY2YS0xNjA2LTRlMDAtYjFhYy1mZTJkZThkMTYwNGQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MjE5ODk1OH1dLCJzZXNzaW9uX2lkIjoiYTE5NDQxNzktZTJjYy00NDU1LTlkNDAtNjExMDQ0ODVhY2U5IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.CYNPxg9wrro1Q1sSLEpKqjzUkiDMi-RpDZ4TGkhJ6Wo"
    // No token refresh callback - simpler version
  };

  const client = new LangGraphClient(config);

  try {
    const { threadId } = await client.createThread();

    const streamResponse = client.streamMessage(threadId, "Tell me a joke of girls");

    for await (const chunk of streamResponse) {
      if (chunk.event === "messages/partial") {
        for (const messageChunk of chunk.data) {
          console.log("Chunk content:", messageChunk.content);
        }
      } else {
        console.log("Other event:", chunk.event, chunk.data);
      }
    }

  } catch (error) {
    console.error('Simple test failed:', error);
  }
}

// Export test functions
export { testStreamingWithClient, testStreamingSimple };

// Run the test if this file is executed directly
if (require.main === module) {
  console.log('Running LangGraphClient streaming test...');
  testStreamingWithClient().catch(console.error);
}
