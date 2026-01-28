// Simple Conversational AI Agent

import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

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

/**
 * Creates a configured LLM based on environment variables.
 * - MODEL_PROVIDER: "openai" or "anthropic" (default: "openai")
 * - MODEL_NAME: model identifier (default: "gpt-4o-mini" for OpenAI, "claude-3-5-sonnet-latest" for Anthropic)
 */
export function createLLM(): BaseChatModel {
  const provider = process.env.MODEL_PROVIDER || "openai";
  const modelName = process.env.MODEL_NAME;

  if (provider === "anthropic") {
    return new ChatAnthropic({
      model: modelName || "claude-3-5-sonnet-latest",
    });
  }

  // Default to OpenAI
  return new ChatOpenAI({
    model: modelName || "gpt-4o-mini",
  });
}
