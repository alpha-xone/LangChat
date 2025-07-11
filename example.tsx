import { Client } from "@langchain/langgraph-sdk";

async function createClientWithToken(token: string) {
  return new Client({
    apiUrl: "your-deployment-url",
    defaultHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function runStreaming() {
  let token = await getValidToken(); // Your method to get a fresh token
  let client = await createClientWithToken(token);

  const assistantID = "agent";
  const thread = await client.threads.create();
  const threadID = thread["thread_id"];

  try {
    const streamResponse = client.runs.stream(
      threadID,
      assistantID,
      {
        input: {
          messages: [{ role: "user", content: "Explain LangGraph streaming." }],
        },
        streamMode: "messages",
      }
    );

    for await (const chunk of streamResponse) {
      // process chunk
      if (chunk.event === "messages") {
        for (const messageChunk of chunk.data) {
          if (messageChunk.content) {
            process.stdout.write(messageChunk.content);
          }
        }
      }
    }
  } catch (error) {
    if (isTokenExpiredError(error)) {
      // Refresh token and retry
      token = await refreshToken();
      client = await createClientWithToken(token);
      // Retry streaming or handle accordingly
    } else {
      throw error;
    }
  }
}
