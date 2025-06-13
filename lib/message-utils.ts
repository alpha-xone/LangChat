import { Message } from "@langchain/langgraph-sdk";

// Prefix for messages that should not be rendered
export const DO_NOT_RENDER_ID_PREFIX = "do-not-render-";

/**
 * Filter out messages that should not be rendered in the UI
 */
export function filterRenderableMessages(messages: Message[]): Message[] {
  return messages.filter(
    (message) => !message.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)
  );
}

/**
 * Get the text content from a message
 */
export function getContentString(message: Message): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("");
  }

  return "";
}

/**
 * Check if message has tool calls
 */
export function hasToolCalls(message: Message): boolean {
  return (message as any).tool_calls && (message as any).tool_calls.length > 0;
}

/**
 * Ensure all tool calls have corresponding tool responses
 * This is important for maintaining conversation flow
 */
export function ensureToolCallsHaveResponses(messages: Message[]): Message[] {
  const toolCallMessages = messages.filter((m) =>
    m.type === "ai" && hasToolCalls(m)
  );

  const toolMessages: Message[] = [];

  for (const toolCallMessage of toolCallMessages) {
    const toolCalls = (toolCallMessage as any).tool_calls || [];

    for (const toolCall of toolCalls) {
      // Check if there's already a response for this tool call
      const hasResponse = messages.some((m) =>
        m.type === "tool" && (m as any).tool_call_id === toolCall.id
      );

      if (!hasResponse) {
        // Create a placeholder tool response
        toolMessages.push({
          id: `tool-${toolCall.id}`,
          type: "tool",
          content: "Tool call completed",
          tool_call_id: toolCall.id,
        } as Message);
      }
    }
  }

  return toolMessages;
}

/**
 * Generate a unique ID for messages
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
