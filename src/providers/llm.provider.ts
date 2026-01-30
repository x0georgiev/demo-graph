/**
 * LLM service provider.
 * Creates the LLM service instance based on environment configuration.
 */
import type { ILLMService } from "../types/index.js";
import { OpenRouterLLMService } from "../services/llm/openrouter.service.js";

/**
 * Creates an LLM service instance based on environment configuration.
 */
export function createLLMService(): ILLMService {
  return new OpenRouterLLMService();
}
