/**
 * Service interfaces for dependency injection.
 */
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Patient } from "./patient.js";

/**
 * Interface for Semble CRM service.
 */
export interface ISembleService {
  getUser(userId: string): Promise<Patient | null>;
}

/**
 * Interface for LLM service.
 */
export interface ILLMService {
  getModel(modelName?: string): BaseChatModel;
}
