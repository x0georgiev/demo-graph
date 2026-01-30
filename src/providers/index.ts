/**
 * Provider registry - singleton container for service instances.
 */
import type { ISembleService, ILLMService } from "../types/index.js";
import { createSembleService } from "./semble.provider.js";
import { createLLMService } from "./llm.provider.js";

let sembleService: ISembleService | null = null;
let llmService: ILLMService | null = null;

/**
 * Get the Semble service singleton instance.
 */
export function getSembleService(): ISembleService {
  if (!sembleService) {
    sembleService = createSembleService();
  }
  return sembleService;
}

/**
 * Get the LLM service singleton instance.
 */
export function getLLMService(): ILLMService {
  if (!llmService) {
    llmService = createLLMService();
  }
  return llmService;
}

/**
 * Reset all providers. Useful for testing.
 */
export function resetProviders(): void {
  sembleService = null;
  llmService = null;
}
