// Simple Conversational AI Agent

import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

/**
 * Default system prompt for the conversational agent.
 */
const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";

/**
 * Gets the system prompt from environment variable or returns the default.
 */
export function getSystemPrompt(): string {
  return process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
}

/**
 * Creates a SystemMessage with the configured system prompt.
 */
export function createSystemMessage(): SystemMessage {
  return new SystemMessage(getSystemPrompt());
}

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

/**
 * Conversation node that invokes the LLM with the current messages.
 * Prepends the system message to the conversation and returns the LLM response.
 */
export async function conversationNode(
  state: typeof ConversationState.State
): Promise<typeof ConversationState.Update> {
  const llm = createLLM();
  const systemMessage = createSystemMessage();

  // Prepend system message to the conversation messages
  const messagesWithSystem = [systemMessage, ...state.messages];

  // Invoke the LLM and get the response
  const response = await llm.invoke(messagesWithSystem);

  // Return the response to be added to state messages
  return { messages: [response] };
}

/**
 * Create and compile the conversation graph.
 * Flow: START → conversation → END
 */
const workflow = new StateGraph(ConversationState)
  .addNode("conversation", conversationNode)
  .addEdge(START, "conversation")
  .addEdge("conversation", END);

/**
 * Compiled graph exported for use with LangSmith Studio.
 */
export const graph = workflow.compile();
