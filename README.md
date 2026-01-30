# Simple Conversational AI Agent

A minimal conversational AI assistant built with **LangGraph.js 1.x** that uses [OpenRouter](https://openrouter.ai/) for LLM access and runs in LangGraph Studio.

## Features

- Conversational AI with message history
- OpenRouter integration (access to 100+ models)
- **Short-term memory**: Thread-based conversation persistence (via `thread_id`)
- **Long-term memory**: Client-specific data across conversations (via `clientId`)
- Customizable system prompt
- LangGraph Studio compatible (Graph and Chat modes)
- Simple, modular architecture

## Tech Stack

| Package | Version |
|---------|---------|
| `@langchain/langgraph` | ^1.1.2 |
| `@langchain/langgraph-checkpoint-postgres` | ^1.0.0 |
| `@langchain/core` | ^1.1.17 |
| `@langchain/openai` | ^1.2.3 |
| `typescript` | ^5.9.0 |

## Prerequisites

- **Node.js** 20 or higher
- **OpenRouter API Key** ([get one here](https://openrouter.ai/keys))
- **PostgreSQL** (optional, for conversation persistence)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
OPENROUTER_API_KEY=sk-or-your-key-here
MODEL_NAME=google/gemini-2.5-flash-lite
```

### 3. Run with LangGraph Studio

Start the development server:

```bash
npm run dev
```

This will:
- Start the agent locally at `http://localhost:2024`
- Open LangGraph Studio in your browser
- Enable hot-reloading on code changes

### 4. Using LangGraph Studio

LangGraph Studio provides two modes:

- **Graph mode**: Full-featured view of your graph's execution with visual flow
- **Chat mode**: Lightweight conversational interface (like ChatGPT)

Both modes support the memory system via the Settings panel where you can configure `thread_id` and `clientId`.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key (required) | - |
| `OPENROUTER_BASE_URL` | OpenRouter base URL | `https://openrouter.ai/api/v1` |
| `MODEL_NAME` | Model identifier | `google/gemini-2.5-flash-lite` |
| `SYSTEM_PROMPT` | Custom system prompt | `"You are a helpful assistant."` |
| `DATABASE_URL` | PostgreSQL connection string (optional) | - |

### Available Models

[OpenRouter](https://openrouter.ai/) provides access to 100+ models. Popular choices:

| Model | Description |
|-------|-------------|
| `openai/gpt-4o` | OpenAI GPT-4o |
| `openai/gpt-4o-mini` | OpenAI GPT-4o Mini |
| `anthropic/claude-3.5-sonnet` | Anthropic Claude 3.5 Sonnet |
| `anthropic/claude-3-opus` | Anthropic Claude 3 Opus |
| `google/gemini-pro-1.5` | Google Gemini Pro 1.5 |
| `meta-llama/llama-3.1-70b-instruct` | Meta Llama 3.1 70B |

See all models at [openrouter.ai/models](https://openrouter.ai/models)

## Memory System

The agent supports two types of memory, both backed by PostgreSQL when `DATABASE_URL` is set.

### Short-term Memory (Checkpointer)

Thread-based conversation persistence. Each conversation thread maintains its message history.

- **Identified by**: `thread_id` in configurable
- **Scope**: Single conversation thread
- **Use case**: Multi-turn conversation context

```typescript
// Conversations are identified by thread_id
await graph.invoke(
  { messages: [{ role: "user", content: "Hello!" }] },
  { configurable: { thread_id: "conversation-123" } }
);
```

### Long-term Memory (Store)

Client-specific data that persists across different conversations.

- **Identified by**: `clientId` in configurable
- **Scope**: All conversations for a client
- **Use case**: User preferences, facts to remember

The agent can:
- **Remember**: Say "remember that I prefer dark mode"
- **Recall**: The agent retrieves relevant memories in future conversations

```typescript
// Client memories are identified by clientId
await graph.invoke(
  { messages: [{ role: "user", content: "Remember that my name is Alice" }] },
  { 
    configurable: { 
      thread_id: "conversation-123",
      clientId: "user-456"  // For long-term memory
    } 
  }
);
```

### PostgreSQL Setup

Enable both memory systems by setting `DATABASE_URL`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/langgraph
```

**Quick start with Docker:**

```bash
docker run -d \
  --name langgraph-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=langgraph \
  -p 5432:5432 \
  postgres:16
```

The checkpointer and store will automatically create the required tables on first run.

**Without PostgreSQL:** The agent runs with in-memory storage (data lost on restart).

### LangSmith Tracing (Optional)

Enable observability by adding these to your `.env`:

```bash
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com
LANGSMITH_API_KEY=ls-your-key
LANGSMITH_PROJECT=local-development
```

## Project Structure

```
src/
├── state.ts              # State annotation (MessagesAnnotation)
├── llm.ts                # LLM provider configuration (OpenRouter)
├── nodes/
│   └── conversation.ts   # Conversation node with memory
├── graph.ts              # Graph construction with memory config
└── agent.ts              # Entry point (exports graph)
```

### Architecture

The project follows a simple, modular architecture:

- **`state.ts`**: Uses `MessagesAnnotation` directly (enables Chat mode in Studio)
- **`llm.ts`**: Factory function for creating LLM instances via OpenRouter
- **`nodes/conversation.ts`**: Main conversation node with long-term memory integration
- **`graph.ts`**: Assembles the workflow with checkpointer (short-term) and store (long-term)
- **`agent.ts`**: Main entry point that exports the compiled graph

### Flow

```
START → conversation → END
```

Memory is handled automatically:
- Short-term: Checkpointer persists messages per `thread_id`
- Long-term: Store persists data per `clientId` namespace

## Development

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
```

## Extending the Agent

### Adding Custom State Fields

If you need additional state beyond messages, extend the state annotation:

```typescript
import { Annotation } from "@langchain/langgraph";
import { MessagesAnnotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  // Add custom fields
  userId: Annotation<string>,
  context: Annotation<Record<string, unknown>>,
});
```

Note: Adding custom fields may disable Chat mode in LangGraph Studio.

### Adding New Nodes

Create a new file in `src/nodes/`:

```typescript
// src/nodes/myNode.ts
import type { AgentStateType, AgentStateUpdate } from "../state.js";

export async function myNode(state: AgentStateType): Promise<AgentStateUpdate> {
  // Your logic here
  return { messages: [] };
}
```

Then add it to `src/graph.ts`:

```typescript
import { myNode } from "./nodes/myNode.js";

const workflow = new StateGraph(AgentState)
  .addNode("conversation", conversationNode)
  .addNode("myNode", myNode)
  // Add edges...
```

## License

MIT
