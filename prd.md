# Simple Conversational AI Agent PRD

## Overview
A minimal conversational AI assistant built with LangGraph.js (TypeScript) that supports multiple LLM providers, maintains in-memory conversation history, and can be compiled and interacted with via LangSmith Studio.

## Goals
- Create a functional LangGraph agent that compiles without errors
- Support configurable LLM providers (OpenAI, Anthropic)
- Enable interaction through LangSmith Studio
- Provide a customizable system prompt for the assistant persona

## User Stories

### US-001: Project Setup
**As a** developer, **I want** the TypeScript project initialized with LangGraph.js dependencies **so that** I can build the conversational agent.

**Acceptance Criteria:**
- [ ] `package.json` created with required dependencies (`@langchain/langgraph`, `@langchain/core`, `@langchain/openai`, `@langchain/anthropic`)
- [ ] `tsconfig.json` configured for ES modules and strict mode
- [ ] Project compiles with `tsc` without errors
- [ ] Typecheck passes

---

### US-002: Define Conversation State Schema
**As a** developer, **I want** a typed state schema for conversation history **so that** messages are tracked throughout the conversation.

**Acceptance Criteria:**
- [ ] State interface defined with `messages` array using LangChain message types
- [ ] State uses LangGraph's `Annotation` for proper state management
- [ ] Messages use reducer for appending (not replacing)
- [ ] Typecheck passes

---

### US-003: Create Configurable LLM Provider
**As a** developer, **I want** to configure the LLM provider via environment variable **so that** I can switch between OpenAI and Anthropic.

**Acceptance Criteria:**
- [ ] `MODEL_PROVIDER` env var switches between `"openai"` and `"anthropic"`
- [ ] `MODEL_NAME` env var allows specifying the model (e.g., `gpt-4o`, `claude-3-5-sonnet-latest`)
- [ ] Default provider is OpenAI with `gpt-4o-mini` if not specified
- [ ] Typecheck passes

---

### US-004: Implement System Prompt Configuration
**As a** developer, **I want** a configurable system prompt **so that** I can customize the assistant's persona.

**Acceptance Criteria:**
- [ ] `SYSTEM_PROMPT` env var allows custom system prompt
- [ ] Default system prompt provided: "You are a helpful assistant."
- [ ] System prompt injected as first message in conversation
- [ ] Typecheck passes

---

### US-005: Build Conversation Node
**As a** developer, **I want** a conversation node that invokes the LLM **so that** the agent can respond to user messages.

**Acceptance Criteria:**
- [ ] Node reads messages from state
- [ ] Node prepends system message to messages
- [ ] Node invokes configured LLM and returns response
- [ ] Response is added to state messages
- [ ] Typecheck passes

---

### US-006: Compile LangGraph and Export for LangSmith Studio
**As a** developer, **I want** the graph compiled and exported **so that** I can interact with it via LangSmith Studio.

**Acceptance Criteria:**
- [ ] Graph created with conversation node
- [ ] Graph has START → conversation → END flow
- [ ] Graph exported as `graph` from `src/agent.ts`
- [ ] `langgraph.json` configuration file created for LangSmith Studio
- [ ] Agent runs with `npx @langchain/langgraph-cli dev`
- [ ] Typecheck passes

---

## Functional Requirements
1. Agent must compile and run without runtime errors
2. Conversation state persists within a single session (in-memory)
3. LLM provider is swappable via environment configuration
4. Graph is compatible with LangSmith Studio's expected format

## Non-Goals
- Persistent storage/checkpointing across sessions
- Tool calling or function execution
- Multi-turn branching or complex graph flows
- Authentication or user management

## Technical Considerations
- Use `@langchain/langgraph` v0.2+ for TypeScript support
- LangSmith Studio requires a `langgraph.json` config pointing to the graph export
- Environment variables loaded via `dotenv` or LangSmith Studio's built-in env support

## Design Considerations
- N/A (no UI — interaction via LangSmith Studio)

## Open Questions
- None at this time
