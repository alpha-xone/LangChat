import { Client } from "@langchain/langgraph-sdk";

async function testStreaming() {
  const client = new Client({
    apiUrl: "https://zero.work/aria",
    defaultHeaders: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6ImZNMFhMZC90RGJFRms5bU8iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3VmcGpycmVoZXdyYmhlbmxrZW1hLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1ZTA2OGY2YS0xNjA2LTRlMDAtYjFhYy1mZTJkZThkMTYwNGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyMjUwMjU1LCJpYXQiOjE3NTIyNDY2NTUsImVtYWlsIjoiaHVhbmcuc2hhbmd0aW5nQGxpdmUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Imh1YW5nLnNoYW5ndGluZ0BsaXZlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiU3RhbiBIIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI1ZTA2OGY2YS0xNjA2LTRlMDAtYjFhYy1mZTJkZThkMTYwNGQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MjE5ODk1OH1dLCJzZXNzaW9uX2lkIjoiYTE5NDQxNzktZTJjYy00NDU1LTlkNDAtNjExMDQ0ODVhY2U5IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.XXVZp_DQ3P4sy3WzTizPnmOA1g-yJRqO3x527GnVosA`,
    },
  });
  const assistantID = "chat";

  // Create a new thread
  const thread = await client.threads.create();
  const threadID = thread["thread_id"];

  // Start streaming with streamMode "messages"
  const streamResponse = client.runs.stream(
    threadID,
    assistantID,
    {
      input: {
        messages: [
          { role: "user", content: "Tell me a joke to make girls laugh!" },
        ]
      },
      streamMode: "messages",
    }
  );

  // Consume the stream and log chunks
  for await (const chunk of streamResponse) {
    if (chunk.event === "messages/partial") {
      for (const messageChunk of chunk.data) {
        const contentText = typeof messageChunk.content === 'string'
          ? messageChunk.content
          : Array.isArray(messageChunk.content)
            ? messageChunk.content.map(c => {
                if (typeof c === 'string') return c;
                if (c && typeof c === 'object' && 'text' in c) return c.text || '';
                return '';
              }).join('')
            : '';
        if (contentText && contentText.trim() !== "") {
          console.log('[LangGraphClient] Chunk content:', contentText);
        }
      }
    } else {
      // console.log("Other event:", chunk.event, chunk.data);
    }
  }
}

testStreaming().catch(console.error);
