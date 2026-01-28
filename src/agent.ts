// Simple Conversational AI Agent

import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * Conversation state schema using LangGraph's Annotation.
 * Messages use a reducer to append new messages rather than replacing the array.
 */
export const ConversationState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});
