/**
 * Semble service provider.
 * Creates the appropriate service instance based on environment configuration.
 */
import type { ISembleService } from "../types/index.js";
import { MockSembleService } from "../services/semble/mock.service.js";
import { RealSembleService } from "../services/semble/real.service.js";

/**
 * Creates a Semble service instance based on environment configuration.
 * Uses mock service by default unless USE_MOCK_SEMBLE is set to "false".
 */
export function createSembleService(): ISembleService {
  const useMock = process.env.USE_MOCK_SEMBLE !== "false";

  if (useMock) {
    return new MockSembleService();
  }

  return new RealSembleService();
}
