/**
 * OpenRouter LLM service implementation.
 */
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ILLMService } from "../../types/index.js";

const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

export class OpenRouterLLMService implements ILLMService {
  private readonly apiKey: string;
  private readonly baseURL: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is required.");
    }
    this.apiKey = apiKey;
    this.baseURL = process.env.OPENROUTER_BASE_URL ?? DEFAULT_BASE_URL;
  }

  getModel(modelName?: string): BaseChatModel {
    return new ChatOpenAI({
      model: modelName ?? process.env.MODEL_NAME ?? DEFAULT_MODEL,
      apiKey: this.apiKey,
      configuration: { baseURL: this.baseURL },
    });
  }
}
