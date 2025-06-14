import { Message } from "@langchain/langgraph-sdk";

// Infer MessageContent from the content property of the exported Message type
type LocalMessageContent = Message['content'];

// Infer MessageContentComplex from LocalMessageContent if it's an array
// This extracts the element type if LocalMessageContent is an array
type LocalMessageContentComplex = Extract<LocalMessageContent, Array<any>>[number];


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
export function getContentString(content: LocalMessageContent | undefined | null): string {
  if (!content) {
    return '';
  }
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    // Ensure that 'item' is treated as LocalMessageContentComplex
    return content
      .map((item: LocalMessageContentComplex) => {
        if (item && typeof item === 'object' && 'type' in item) {
          if (item.type === 'text') {
            // We need to assert item as { type: "text"; text: string; }
            // or ensure LocalMessageContentComplex correctly infers its structure.
            // For simplicity, if item.type is 'text', item.text should exist.
            return (item as { type: "text"; text: string }).text;
          }
          if (item.type === 'image_url') {
            return '[Image]'; // Or handle image URLs appropriately
          }
        }
        return '';
      })
      .join('');
  }
  return '';
}

/**
 * Check if message has tool calls
 */
export function hasToolCalls(message: Message): boolean {
  // Check if the message is an AIMessage before accessing tool_calls
  if (message.type === "ai") {
    return !!(message.tool_calls && message.tool_calls.length > 0);
  }
  return false;
}

/**
 * Ensure all tool calls have corresponding tool responses
 * This is important for maintaining conversation flow
 */
export function ensureToolCallsHaveResponses(messages: Message[]): Message[] {
  const toolCallMessages = messages.filter((m): m is Extract<Message, { type: "ai" }> =>
    m.type === "ai" && hasToolCalls(m)
  );

  const toolMessages: Message[] = [];

  for (const toolCallMessage of toolCallMessages) {
    // Since we filtered for AIMessage with tool_calls, tool_calls should be defined.
    const toolCalls = toolCallMessage.tool_calls || [];

    for (const toolCall of toolCalls) {
      // Check if there's already a response for this tool call
      const hasResponse = messages.some((m) =>
        m.type === "tool" && m.tool_call_id === toolCall.id
      );

      if (!hasResponse && toolCall.id) { // Ensure toolCall.id exists
        // Create a placeholder tool response
        toolMessages.push({
          // id: `tool-${toolCall.id}`, // id is optional for ToolMessage based on definition
          type: "tool",
          content: "Tool call completed", // Content can be string
          tool_call_id: toolCall.id,
        } as Message); // Cast as Message to satisfy the return type array
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
