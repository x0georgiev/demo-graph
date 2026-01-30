/**
 * LangGraph workflow definition.
 *
 * Constructs and compiles the conversation graph with the following flow:
 * START → conversation → END
 *
 * Memory management:
 * - Short-term memory: PostgresSaver checkpointer for thread-based persistence
 * - Long-term memory: PostgresStore for clientId-based data across sessions
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
import { AgentState } from "./state.js";
import { conversationNode } from "./nodes/conversation.js";

/**
 * Create the conversation workflow.
 */
const workflow = new StateGraph(AgentState)
  .addNode("conversation", conversationNode)
  .addEdge(START, "conversation")
  .addEdge("conversation", END);

/**
 * Initialize memory systems.
 */
const DATABASE_URL = process.env.DATABASE_URL;

// Short-term memory: conversation persistence per thread_id
const checkpointer = DATABASE_URL
  ? PostgresSaver.fromConnString(DATABASE_URL)
  : undefined;

// Long-term memory: user data across conversations per clientId
const store = DATABASE_URL
  ? PostgresStore.fromConnString(DATABASE_URL)
  : undefined;

/**
 * Compiled graph ready for execution.
 *
 * Usage:
 * ```typescript
 * await graph.invoke(
 *   { messages: [{ role: "user", content: "Hello!" }] },
 *   {
 *     configurable: {
 *       thread_id: "conversation-123",
 *       clientId: "user-456",
 *     }
 *   }
 * );
 * ```
 */
export const graph = workflow.compile({
  checkpointer,
  store,
});
