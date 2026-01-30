/**
 * Database setup script for LangGraph.
 * This script initializes the PostgreSQL tables required for:
 * 1. Short-term memory (checkpoints)
 * 2. Long-term memory (store)
 *
 * Run with: npx tsx migrations/migrate.ts
 */

import "dotenv/config";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";

async function setup() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  console.log("Initializing database structure...");

  try {
    // 1. Setup Checkpointer (Short-term memory)
    console.log("- Setting up short-term memory (checkpointer)...");
    const checkpointer = PostgresSaver.fromConnString(connectionString);
    await checkpointer.setup();
    console.log("  ✓ Checkpointer setup complete.");

    // 2. Setup Store (Long-term memory)
    console.log("- Setting up long-term memory (store)...");
    const store = PostgresStore.fromConnString(connectionString);
    await store.setup();
    console.log("  ✓ Store setup complete.");

    console.log("\nSuccess: Database structure is ready.");
  } catch (error) {
    console.error("\nFailed to setup database:");
    console.error(error);
    process.exit(1);
  }
}

setup();
