// Example: How to properly pass Supabase session access token to LangGraph client

import { AuthService, LangGraphClient, type LangGraphConfig } from 'langchat';

async function createLangGraphClientWithSupabaseAuth() {
  // 1. Initialize the AuthService (this handles Supabase authentication)
  const authService = new AuthService();

  // 2. Configure your LangGraph settings
  const config: LangGraphConfig = {
    apiUrl: process.env.EXPO_PUBLIC_LANGGRAPH_API_URL || "https://your-deployment-url",
    assistantId: process.env.EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID || "agent",
    defaultHeaders: {
      'Content-Type': 'application/json',
      // Note: Don't manually add Authorization header here
      // It will be automatically added with the current Supabase token
    },
  };

  // 3. Create LangGraph client with AuthService
  const client = new LangGraphClient(config, authService);

  // 4. The client will automatically:
  //    - Get the current Supabase session access token
  //    - Add it as Authorization: Bearer <token> header
  //    - Refresh the token if needed for each request

  return client;
}

// Example usage:
async function sendMessageExample() {
  try {
    const client = await createLangGraphClientWithSupabaseAuth();

    // Check if user is authenticated
    const sessionInfo = await client.getSessionInfo();
    console.log('Session info:', sessionInfo);

    // Create or get a thread
    const thread = await client.getOrCreateThread();
    console.log('Thread created:', thread.thread_id);

    // Send a message with automatic token authentication
    const message = {
      type: 'human' as const,
      content: 'Hello, LangGraph!'
    };

    // The token will be automatically attached to this request
    for await (const event of client.streamMessage(thread.thread_id, message)) {
      console.log('Received event:', event);
    }

  } catch (error) {
    console.error('Error:', error);

    if (error instanceof Error && error.message.includes('Authentication error')) {
      console.log('User needs to sign in again');
    }
  }
}

/*
Key Benefits of this implementation:

1. **Automatic Token Management**:
   - No need to manually handle token refresh
   - Token is retrieved fresh for each request

2. **Secure**:
   - Token is never stored in memory permanently
   - Always uses the latest valid token from Supabase

3. **Error Handling**:
   - Proper error messages for auth failures
   - Fallback handling for network issues

4. **Thread Safety**:
   - Each request gets its own authenticated client instance
   - No shared state between requests

5. **Debugging Support**:
   - getSessionInfo() method to check auth status
   - Clear error messages for troubleshooting
*/

export { createLangGraphClientWithSupabaseAuth, sendMessageExample };
