/**
 * Mock Semble service for development and testing.
 */
import type { Patient, ISembleService } from "../../types/index.js";

export class MockSembleService implements ISembleService {
  async getUser(userId: string): Promise<Patient | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock data matching Semble structure
    return {
      id: userId,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      dob: "1985-05-15",
      gender: "Male",
      address: {
        line1: "123 Baker Street",
        city: "London",
        postcode: "NW1 6XE",
      },
      phones: [
        {
          type: "mobile",
          number: "+447700900123",
        },
      ],
    };
  }
}
