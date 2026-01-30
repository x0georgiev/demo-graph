/**
 * State definitions for the conversational agent.
 *
 * Uses LangGraph's Annotation system with messagesStateReducer
 * to define a "messages" key for conversation history.
 */

import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { Patient } from "./types/index.js";

/**
 * Agent state with "messages" key.
 *
 * Note: Chat mode in LangGraph Studio requires the CLI to extract
 * JSON Schema from the code. Currently, TypeScript type annotations
 * don't translate to JSON Schema, so Chat mode may not work.
 * Use Graph mode instead.
 */
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  user: Annotation<Patient | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

/**
 * Type alias for the agent state.
 */
export type AgentStateType = typeof AgentState.State;

/**
 * Type alias for state updates.
 */
export type AgentStateUpdate = typeof AgentState.Update;
