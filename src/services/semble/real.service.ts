/**
 * Real Semble service for production use.
 */
import type { Patient, ISembleService } from "../../types/index.js";

export class RealSembleService implements ISembleService {
  async getUser(userId: string): Promise<Patient | null> {
    // TODO: Implement actual GraphQL call to Semble API
    // This is a stub for now
    throw new Error("Real Semble integration not implemented yet");
  }
}
