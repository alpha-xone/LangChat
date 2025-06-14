import { Message } from '@langchain/langgraph-sdk';

export interface StreamChunk {
  content?: string;
  type?: string;
  id?: string;
  additional_kwargs?: Record<string, any>;
  response_metadata?: Record<string, any>;
  tool_calls?: any[];
  invalid_tool_calls?: any[];
  usage_metadata?: any;
  tool_call_chunks?: any[];
}

export interface StreamMetadata {
  created_by?: string;
  graph_id?: string;
  assistant_id?: string;
  run_attempt?: number;
  run_id?: string;
  thread_id?: string;
  user_id?: string;
  langgraph_step?: number;
  langgraph_node?: string;
  [key: string]: any;
}

/**
 * Process streaming chunk data from LangGraph runs.stream
 * @param chunkData - The raw chunk data from the stream
 * @returns Processed message chunk or null if not processable
 */
export function processStreamChunk(chunkData: any): {
  messageChunk: StreamChunk | null;
  metadata: StreamMetadata | null;
} {
  try {
    // Handle different chunk formats
    if (!chunkData) {
      return { messageChunk: null, metadata: null };
    }

    // If it's an array, extract the message chunk and metadata
    if (Array.isArray(chunkData)) {
      const [messageChunk, metadata] = chunkData;
      return {
        messageChunk: messageChunk || null,
        metadata: metadata || null,
      };
    }

    // If it's a direct object, treat it as a message chunk
    if (typeof chunkData === 'object') {
      return {
        messageChunk: chunkData,
        metadata: null,
      };
    }

    return { messageChunk: null, metadata: null };
  } catch (error) {
    console.error('Error processing stream chunk:', error);
    return { messageChunk: null, metadata: null };
  }
}

/**
 * Check if a chunk contains AI message content or tool calls
 * @param chunk - The message chunk to check
 * @returns True if it's an AI message chunk with content or tool calls
 */
export function isAIMessageChunk(chunk: StreamChunk | null): boolean {
  return !!(
    chunk &&
    chunk.type === 'AIMessageChunk' &&
    (
      // Has text content
      (typeof chunk.content === 'string' && chunk.content.length > 0) ||
      // Has tool calls
      (chunk.tool_calls && chunk.tool_calls.length > 0) ||
      // Has tool call chunks
      (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0)
    )
  );
}

/**
 * Extract run ID from chunk or metadata
 * @param chunk - The message chunk
 * @param metadata - The metadata object
 * @returns A unique run ID for the message
 */
export function extractRunId(chunk: StreamChunk | null, metadata: StreamMetadata | null): string {
  // Try to get ID from chunk first
  if (chunk?.id) {
    return chunk.id;
  }

  // Try to get run_id from metadata
  if (metadata?.run_id) {
    return `ai-${metadata.run_id}`;
  }

  // Fallback to timestamp-based ID
  return `ai-response-${Date.now()}`;
}

/**
 * Merge streaming content into existing messages
 * @param messages - Current messages array
 * @param chunk - New chunk data
 * @param metadata - Chunk metadata
 * @returns Updated messages array
 */
export function mergeStreamingMessage(
  messages: Message[],
  chunk: StreamChunk,
  metadata: StreamMetadata | null
): Message[] {
  if (!isAIMessageChunk(chunk)) {
    return messages;
  }

  const runId = extractRunId(chunk, metadata);
  const content = chunk.content || '';

  // Find existing message with the same run ID
  const existingIndex = messages.findIndex(m =>
    m.type === 'ai' && m.id === runId
  );

  if (existingIndex >= 0) {
    // Update existing message
    const updatedMessages = [...messages];
    const existingMessage = updatedMessages[existingIndex];

    // Merge content
    const updatedContent = (existingMessage.content || '') + content;
      // Merge tool calls if present
    let mergedToolCalls = (existingMessage as any).tool_calls || [];
    if (chunk.tool_calls && chunk.tool_calls.length > 0) {
      // Merge or append tool calls
      chunk.tool_calls.forEach(newToolCall => {
        const existingToolCallIndex = mergedToolCalls.findIndex((tc: any) => tc.id === newToolCall.id);
        if (existingToolCallIndex >= 0) {
          // Update existing tool call
          mergedToolCalls[existingToolCallIndex] = {
            ...mergedToolCalls[existingToolCallIndex],
            ...newToolCall,
            // Merge args if they're strings
            args: typeof newToolCall.args === 'string' && typeof mergedToolCalls[existingToolCallIndex].args === 'string'
              ? mergedToolCalls[existingToolCallIndex].args + newToolCall.args
              : newToolCall.args || mergedToolCalls[existingToolCallIndex].args
          };
        } else {
          // Add new tool call
          mergedToolCalls.push(newToolCall);
        }
      });
    }

    // Handle tool call chunks for incremental tool argument building
    if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
      chunk.tool_call_chunks.forEach(toolCallChunk => {
        if (toolCallChunk.args) {
          // Find corresponding tool call by index or id
          const toolCallIndex = toolCallChunk.index ?? 0;
          if (mergedToolCalls[toolCallIndex]) {
            // Append to existing tool call args
            const existingArgs = mergedToolCalls[toolCallIndex].args || '';
            mergedToolCalls[toolCallIndex] = {
              ...mergedToolCalls[toolCallIndex],
              args: typeof existingArgs === 'string' ? existingArgs + toolCallChunk.args : toolCallChunk.args
            };
          } else {
            // Create new tool call from chunk
            mergedToolCalls[toolCallIndex] = {
              id: toolCallChunk.id || `tool_call_${toolCallIndex}`,
              name: toolCallChunk.name || '',
              args: toolCallChunk.args,
              type: 'tool_call'
            };
          }
        }
      });
    }

    updatedMessages[existingIndex] = {
      ...existingMessage,
      content: updatedContent,
      ...(mergedToolCalls.length > 0 && { tool_calls: mergedToolCalls })
    } as Message;

    return updatedMessages;  } else {
    // Create new AI message
    const aiMessage: any = {
      id: runId,
      type: 'ai',
      content: content,
    };

    // Add tool calls if present
    if (chunk.tool_calls && chunk.tool_calls.length > 0) {
      aiMessage.tool_calls = chunk.tool_calls;
    }

    // Handle initial tool call chunks
    if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
      const toolCalls: any[] = [];
      chunk.tool_call_chunks.forEach(toolCallChunk => {
        const toolCallIndex = toolCallChunk.index ?? 0;
        toolCalls[toolCallIndex] = {
          id: toolCallChunk.id || `tool_call_${toolCallIndex}`,
          name: toolCallChunk.name || '',
          args: toolCallChunk.args || '',
          type: 'tool_call'
        };
      });
      if (toolCalls.length > 0) {
        aiMessage.tool_calls = toolCalls.filter((tc: any) => tc); // Remove empty slots
      }
    }

    return [...messages, aiMessage as Message];
  }
}

/**
 * Debounce function for UI updates
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}
