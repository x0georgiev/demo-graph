/**
 * Conversation node for the LangGraph agent.
 *
 * This node handles the core conversation logic:
 * - Retrieves long-term memories for the client (via clientId)
 * - Prepends system message with memories to conversation
 * - Invokes the configured LLM
 * - Stores new memories when user asks to remember something
 * - Returns the response to be added to state
 *
 * Memory access:
 * - Short-term (thread): Automatic via checkpointer + thread_id
 * - Long-term (client): Via store + clientId in configurable
 */

import { SystemMessage } from "@langchain/core/messages";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { AgentStateType, AgentStateUpdate } from "../state.js";
import { createLLM } from "../llm.js";

/**
 * Default system prompt for the conversational agent.
 */
const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";

/**
 * Memory item structure stored in the long-term store.
 */
interface MemoryItem {
  text: string;
  createdAt: string;
}

/**
 * Get namespace for client's long-term memories.
 * Format: ["memories", clientId]
 *
 * @param clientId - The client identifier
 * @returns Namespace array for the store
 */
function getMemoryNamespace(clientId: string): string[] {
  return ["memories", clientId];
}

/**
 * Gets the system prompt from environment variable or returns the default.
 *
 * @returns The configured system prompt
 */
export function getSystemPrompt(): string {
  return process.env.SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;
}

/**
 * Creates a SystemMessage with the configured system prompt,
 * including any available long-term memories.
 *
 * @param memories - Optional long-term memories about the user
 * @returns SystemMessage instance
 */
export function createSystemMessage(memories?: string): SystemMessage {
  const basePrompt = getSystemPrompt();

  if (memories) {
    return new SystemMessage(
      `${basePrompt}\n\nWhat you remember about this user:\n${memories}`
    );
  }

  return new SystemMessage(basePrompt);
}

/**
 * Main conversation node.
 *
 * Memory access:
 * - Short-term (thread): Automatic via checkpointer + thread_id in configurable
 * - Long-term (client): Via store + clientId in configurable
 *
 * @param state - Current agent state with messages
 * @param config - LangGraph runtime config with store access
 * @returns State update with the LLM response
 */
export async function conversationNode(
  state: AgentStateType,
  config: LangGraphRunnableConfig
): Promise<AgentStateUpdate> {
  const llm = createLLM();

  // Get client ID from config (defaults to "default" if not provided)
  const clientId = (config.configurable?.clientId as string) ?? "default";

  // Retrieve long-term memories if store is available
  let memoriesText = "";
  if (config.store) {
    try {
      const namespace = getMemoryNamespace(clientId);

      // Search for relevant memories (limit to 10)
      const memories = await config.store.search(namespace, { limit: 10 });

      if (memories && memories.length > 0) {
        memoriesText = memories
          .map((m) => {
            const item = m.value as MemoryItem;
            return item?.text;
          })
          .filter(Boolean)
          .join("\n- ");

        if (memoriesText) {
          memoriesText = "- " + memoriesText;
        }
      }
    } catch {
      // Store search failed, continue without memories
      console.warn("Failed to retrieve memories from store");
    }
  }

  // Create system message with memories
  const systemMessage = createSystemMessage(memoriesText);

  // Invoke the LLM with system message + conversation messages
  const response = await llm.invoke([systemMessage, ...state.messages]);

  // Check if user wants to store a memory
  if (config.store) {
    const lastMessage = state.messages.at(-1);
    const content =
      typeof lastMessage?.content === "string" ? lastMessage.content : "";

    // Simple check: if message contains "remember", store it
    if (content.toLowerCase().includes("remember")) {
      try {
        const namespace = getMemoryNamespace(clientId);
        const memoryId = `mem_${Date.now()}`;
        const memoryItem: MemoryItem = {
          text: content,
          createdAt: new Date().toISOString(),
        };
        await config.store.put(namespace, memoryId, memoryItem);
        console.log(`Stored memory for client ${clientId}: ${content}`);
      } catch {
        console.warn("Failed to store memory");
      }
    }
  }

  // Return the response to be added to state messages
  return { messages: [response] };
}
