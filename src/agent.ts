/**
 * Main entry point for the LangGraph agent.
 *
 * This file serves as the entry point referenced in langgraph.json.
 * It re-exports the compiled graph from the graph module.
 *
 * @module agent
 */

// Re-export the compiled graph for LangGraph Studio
export { graph } from "./graph.js";

// Re-export types and utilities for external use
export {
  AgentState,
  type AgentStateType,
  type AgentStateUpdate,
} from "./state.js";
export { createLLM, type LLMConfig } from "./llm.js";
export {
  conversationNode,
  getSystemPrompt,
  createSystemMessage,
} from "./nodes/conversation.js";
