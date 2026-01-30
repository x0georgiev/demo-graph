/**
 * LLM provider configuration and factory.
 *
 * Uses OpenRouter API for LLM access, providing a unified interface
 * to multiple model providers (OpenAI, Anthropic, Google, Meta, etc.)
 */

import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Configuration options for the LLM.
 */
export interface LLMConfig {
  /** Model name/identifier (e.g., "openai/gpt-4o", "anthropic/claude-3.5-sonnet") */
  modelName?: string;
  /** OpenRouter API key (optional, defaults to environment variable) */
  apiKey?: string;
  /** OpenRouter base URL (optional, defaults to environment variable or standard URL) */
  baseURL?: string;
}

/**
 * Default model to use if none specified.
 */
const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

/**
 * Default OpenRouter API base URL.
 */
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Creates a configured LLM instance using OpenRouter.
 *
 * Environment variables:
 * - OPENROUTER_API_KEY: API key for OpenRouter (required)
 * - OPENROUTER_BASE_URL: Custom base URL (optional)
 * - MODEL_NAME: Model identifier (optional, e.g., "anthropic/claude-3.5-sonnet")
 *
 * @param config - Optional configuration to override environment variables
 * @returns Configured LLM instance
 *
 * @example
 * ```typescript
 * // Use defaults from environment
 * const llm = createLLM();
 *
 * // Override model
 * const llm = createLLM({ modelName: "anthropic/claude-3.5-sonnet" });
 * ```
 */
export function createLLM(config?: LLMConfig): BaseChatModel {
  const apiKey = config?.apiKey ?? process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or pass apiKey in config."
    );
  }

  const baseURL =
    config?.baseURL ?? process.env.OPENROUTER_BASE_URL ?? DEFAULT_BASE_URL;

  const modelName = config?.modelName ?? process.env.MODEL_NAME ?? DEFAULT_MODEL;

  return new ChatOpenAI({
    model: modelName,
    apiKey: apiKey,
    configuration: {
      baseURL,
    },
  });
}
