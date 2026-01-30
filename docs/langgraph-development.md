---
name: LangGraph TypeScript Guide
overview: Create a comprehensive development guide covering all aspects of building production-grade conversational AI agents using LangGraph and the LangChain ecosystem in TypeScript, based on the official documentation.
todos:
  - id: create-guide-file
    content: Create the comprehensive LangGraph TypeScript guide markdown file with all 21 topics organized into 8 parts
    status: pending
  - id: part1-getting-started
    content: "Write Part 1: Installation, Quickstart, Local Server, and Changelog sections with code examples"
    status: pending
  - id: part2-core-concepts
    content: "Write Part 2: Thinking in LangGraph and Workflows/Agents patterns with detailed examples"
    status: pending
  - id: part3-persistence
    content: "Write Part 3: Persistence, Durable Execution, and Memory management sections"
    status: pending
  - id: part4-realtime
    content: "Write Part 4: Streaming, Interrupts, and Time Travel sections"
    status: pending
  - id: part5-architecture
    content: "Write Part 5: Subgraphs and Application Structure sections"
    status: pending
  - id: part6-testing-tools
    content: "Write Part 6: Testing, LangSmith Studio, and Agent Chat UI sections"
    status: pending
  - id: part7-production
    content: "Write Part 7: LangSmith Deployment and Observability sections"
    status: pending
  - id: part8-apis-runtime
    content: "Write Part 8: Graph API, Functional API, and Runtime sections"
    status: pending
isProject: false
---

# Comprehensive LangGraph TypeScript Development Guide

This plan outlines the creation of a detailed guide for developing production-grade, stable, and scalable conversational AI agents using LangGraph and the LangChain ecosystem in TypeScript.

## Document Structure

### Part 1: Getting Started

**1. Installation**

```bash
# Core packages
npm install @langchain/langgraph @langchain/core

# LangChain integration
npm install langchain

# Provider packages
npm install @langchain/anthropic @langchain/openai

# CLI for local development
npm install --save-dev @langchain/langgraph-cli

# Production checkpointers
npm install @langchain/langgraph-checkpoint-postgres
npm install @langchain/langgraph-checkpoint-sqlite
```

**2. Quickstart - Graph API**

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import {
  StateGraph, StateSchema, MessagesValue, ReducedValue,
  GraphNode, ConditionalEdgeRouter, START, END
} from "@langchain/langgraph";
import { SystemMessage, AIMessage, ToolMessage, HumanMessage } from "@langchain/core/messages";
import * as z from "zod";

// 1. Initialize model
const model = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  temperature: 0,
});

// 2. Define tools
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const toolsByName = { [add.name]: add, [multiply.name]: multiply };
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

// 3. Define state
const MessagesState = new StateSchema({
  messages: MessagesValue,
  llmCalls: new ReducedValue(
    z.number().default(0),
    { reducer: (x, y) => x + y }
  ),
});

// 4. Define nodes
const llmCall: GraphNode<typeof MessagesState> = async (state) => {
  const response = await modelWithTools.invoke([
    new SystemMessage("You are a helpful assistant tasked with performing arithmetic."),
    ...state.messages,
  ]);
  return { messages: [response], llmCalls: 1 };
};

const toolNode: GraphNode<typeof MessagesState> = async (state) => {
  const lastMessage = state.messages.at(-1);
  if (!AIMessage.isInstance(lastMessage)) return { messages: [] };
  
  const results: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    results.push(observation);
  }
  return { messages: results };
};

// 5. Define routing
const shouldContinue: ConditionalEdgeRouter<typeof MessagesState> = (state) => {
  const lastMessage = state.messages.at(-1);
  if (!AIMessage.isInstance(lastMessage)) return END;
  if (lastMessage.tool_calls?.length) return "toolNode";
  return END;
};

// 6. Build and compile
const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();

// 7. Invoke
const result = await agent.invoke({
  messages: [new HumanMessage("Add 3 and 4, then multiply by 2.")],
});
```

**2b. Quickstart - Functional API**

```typescript
import { task, entrypoint, addMessages } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import type { ToolCall } from "@langchain/core/messages/tool";

const callLlm = task("callLlm", async (messages: BaseMessage[]) => {
  return modelWithTools.invoke([
    new SystemMessage("You are a helpful assistant tasked with performing arithmetic."),
    ...messages,
  ]);
});

const callTool = task("callTool", async (toolCall: ToolCall) => {
  const tool = toolsByName[toolCall.name];
  return tool.invoke(toolCall);
});

const agent = entrypoint({ name: "agent" }, async (messages: BaseMessage[]) => {
  let modelResponse = await callLlm(messages);

  while (true) {
    if (!modelResponse.tool_calls?.length) break;

    const toolResults = await Promise.all(
      modelResponse.tool_calls.map((toolCall) => callTool(toolCall))
    );
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }

  return messages;
});

const result = await agent.invoke([new HumanMessage("Add 3 and 4.")]);
```

**3. Local Development Server**

```json
// langgraph.json
{
  "node_version": "24",
  "graphs": {
    "agent": "./src/agent.ts:agent",
    "searchAgent": "./src/search.ts:searchAgent"
  },
  "env": ".env"
}
```
```bash
# Start local server
npx @langchain/langgraph-cli dev

# Output:
# - API: http://127.0.0.1:2024
# - Studio UI: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```
```typescript
// Test with SDK
import { Client } from "@langchain/langgraph-sdk";

const client = new Client({ apiUrl: "http://localhost:2024" });

const streamResponse = client.runs.stream(
  null, // Threadless run
  "agent", // Assistant ID from langgraph.json
  {
    input: { messages: [{ role: "user", content: "What is LangGraph?" }] },
    streamMode: "messages-tuple",
  }
);

for await (const chunk of streamResponse) {
  console.log(`Event: ${chunk.event}`, chunk.data);
}
```

**4. Changelog Highlights**

- v1.1.0: `StateSchema` with Standard Schema support (Zod 4, Valibot, ArkType)
- `MessagesValue`: Prebuilt for chat messages with standard reducer
- `ReducedValue`: Custom reducers with separate input/output schemas
- `UntrackedValue`: Transient state excluded from checkpoints
- Type utilities: `GraphNode<S>`, `ConditionalEdgeRouter<S>`

---

### Part 2: Core Concepts

**5. Thinking in LangGraph (Critical Section)**

Customer support email agent example demonstrating key principles:

```typescript
import { StateGraph, StateSchema, GraphNode, Command, interrupt } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { ChatAnthropic } from "@langchain/anthropic";
import * as z from "zod";

const llm = new ChatAnthropic({ model: "claude-sonnet-4-5-20250929" });

// Classification schema
const EmailClassificationSchema = z.object({
  intent: z.enum(["question", "bug", "billing", "feature", "complex"]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  topic: z.string(),
  summary: z.string(),
});

// State stores RAW data, not formatted prompts
const EmailAgentState = new StateSchema({
  emailContent: z.string(),
  senderEmail: z.string(),
  emailId: z.string(),
  classification: EmailClassificationSchema.optional(),
  searchResults: z.array(z.string()).optional(),
  customerHistory: z.record(z.string(), z.any()).optional(),
  responseText: z.string().optional(),
});

// Nodes do ONE thing well
const classifyIntent: GraphNode<typeof EmailAgentState> = async (state, config) => {
  const structuredLlm = llm.withStructuredOutput(EmailClassificationSchema);
  
  // Format prompt ON-DEMAND from raw state
  const classificationPrompt = `
    Analyze this customer email and classify it:
    Email: ${state.emailContent}
    From: ${state.senderEmail}
  `;
  
  const classification = await structuredLlm.invoke(classificationPrompt);
  
  // Use Command for dynamic routing
  let nextNode: string;
  if (classification.intent === "billing" || classification.urgency === "critical") {
    nextNode = "humanReview";
  } else if (classification.intent === "question") {
    nextNode = "searchDocumentation";
  } else if (classification.intent === "bug") {
    nextNode = "bugTracking";
  } else {
    nextNode = "draftResponse";
  }
  
  return new Command({
    update: { classification },
    goto: nextNode,
  });
};

// Human-in-the-loop with interrupt()
const humanReview: GraphNode<typeof EmailAgentState> = async (state, config) => {
  const classification = state.classification!;
  
  // interrupt() MUST come first - code before it re-runs on resume
  const humanDecision = interrupt({
    emailId: state.emailId,
    originalEmail: state.emailContent,
    draftResponse: state.responseText,
    urgency: classification.urgency,
    action: "Please review and approve/edit this response",
  });
  
  if (humanDecision.approved) {
    return new Command({
      update: { responseText: humanDecision.editedResponse || state.responseText },
      goto: "sendReply",
    });
  }
  return new Command({ update: {}, goto: END });
};

// Build with retry policies for transient errors
const workflow = new StateGraph(EmailAgentState)
  .addNode("classifyIntent", classifyIntent)
  .addNode("searchDocumentation", searchDocumentation, { 
    retryPolicy: { maxAttempts: 3 } 
  })
  .addNode("bugTracking", bugTracking)
  .addNode("draftResponse", draftResponse)
  .addNode("humanReview", humanReview)
  .addNode("sendReply", sendReply)
  .addEdge(START, "classifyIntent")
  .addEdge("sendReply", END);

const checkpointer = new MemorySaver();
const app = workflow.compile({ checkpointer });
```

**6. Workflows and Agents Patterns**

**Prompt Chaining with Validation Gates:**

```typescript
const State = new StateSchema({
  topic: z.string(),
  joke: z.string(),
  improvedJoke: z.string(),
  finalJoke: z.string(),
});

const checkPunchline: ConditionalEdgeRouter<typeof State> = (state) => {
  if (state.joke?.includes("?") || state.joke?.includes("!")) {
    return "Pass";
  }
  return "Fail";
};

const chain = new StateGraph(State)
  .addNode("generateJoke", generateJoke)
  .addNode("improveJoke", improveJoke)
  .addNode("polishJoke", polishJoke)
  .addEdge(START, "generateJoke")
  .addConditionalEdges("generateJoke", checkPunchline, {
    Pass: "improveJoke",
    Fail: END
  })
  .addEdge("improveJoke", "polishJoke")
  .addEdge("polishJoke", END)
  .compile();
```

**Parallelization:**

```typescript
// Graph API - parallel edges
const parallelWorkflow = new StateGraph(State)
  .addNode("callLlm1", callLlm1)
  .addNode("callLlm2", callLlm2)
  .addNode("callLlm3", callLlm3)
  .addNode("aggregator", aggregator)
  .addEdge(START, "callLlm1")
  .addEdge(START, "callLlm2")  // All three run in parallel
  .addEdge(START, "callLlm3")
  .addEdge("callLlm1", "aggregator")  // Aggregator waits for all
  .addEdge("callLlm2", "aggregator")
  .addEdge("callLlm3", "aggregator")
  .addEdge("aggregator", END)
  .compile();

// Functional API - Promise.all
const workflow = entrypoint("parallelWorkflow", async (topic: string) => {
  const [joke, story, poem] = await Promise.all([
    callLlm1(topic),
    callLlm2(topic),
    callLlm3(topic),
  ]);
  return aggregator({ topic, joke, story, poem });
});
```

**Routing with Structured Output:**

```typescript
const routeSchema = z.object({
  step: z.enum(["poem", "story", "joke"]).describe("The next step"),
});

const router = llm.withStructuredOutput(routeSchema);

const llmCallRouter: GraphNode<typeof State> = async (state) => {
  const decision = await router.invoke([
    { role: "system", content: "Route based on user's request." },
    { role: "user", content: state.input },
  ]);
  return { decision: decision.step };
};

const routeDecision: ConditionalEdgeRouter<typeof State> = (state) => {
  if (state.decision === "story") return "llmCall1";
  if (state.decision === "joke") return "llmCall2";
  return "llmCall3";
};
```

**Orchestrator-Worker with Send API:**

```typescript
import { Send } from "@langchain/langgraph";

const assignWorkers: ConditionalEdgeRouter<typeof State> = (state) => {
  // Dynamically spawn workers for each section
  return state.sections.map((section) =>
    new Send("llmCall", { section })
  );
};

const orchestratorWorker = new StateGraph(State)
  .addNode("orchestrator", orchestrator)
  .addNode("llmCall", llmCall)
  .addNode("synthesizer", synthesizer)
  .addEdge(START, "orchestrator")
  .addConditionalEdges("orchestrator", assignWorkers, ["llmCall"])
  .addEdge("llmCall", "synthesizer")
  .addEdge("synthesizer", END)
  .compile();
```

**Evaluator-Optimizer Loop:**

```typescript
const feedbackSchema = z.object({
  grade: z.enum(["funny", "not funny"]),
  feedback: z.string(),
});

const evaluator = llm.withStructuredOutput(feedbackSchema);

const routeJoke: ConditionalEdgeRouter<typeof State> = (state) => {
  if (state.funnyOrNot === "funny") return "Accepted";
  return "Rejected + Feedback";
};

const optimizerWorkflow = new StateGraph(State)
  .addNode("llmCallGenerator", llmCallGenerator)
  .addNode("llmCallEvaluator", llmCallEvaluator)
  .addEdge(START, "llmCallGenerator")
  .addEdge("llmCallGenerator", "llmCallEvaluator")
  .addConditionalEdges("llmCallEvaluator", routeJoke, {
    "Accepted": END,
    "Rejected + Feedback": "llmCallGenerator",  // Loop back
  })
  .compile();
```

**Tool-Calling Agent:**

```typescript
import { ToolNode } from "@langchain/langgraph/prebuilt";

const toolNode = new ToolNode(tools);

const shouldContinue: ConditionalEdgeRouter<typeof State> = (state) => {
  const lastMessage = state.messages.at(-1);
  if (lastMessage?.tool_calls?.length) return "toolNode";
  return END;
};

const agentBuilder = new StateGraph(State)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")  // Loop back after tool execution
  .compile();
```

---

### Part 3: Persistence and State Management

**7. Persistence**

```typescript
import { StateGraph, StateSchema, ReducedValue, START, END, MemorySaver } from "@langchain/langgraph";
import { z } from "zod/v4";

const State = new StateSchema({
  foo: z.string(),
  bar: new ReducedValue(z.array(z.string()).default(() => []), { reducer: (x, y) => x.concat(y) }),
});

const workflow = new StateGraph(State)
  .addNode("nodeA", (state) => ({ foo: "a", bar: ["a"] }))
  .addNode("nodeB", (state) => ({ foo: "b", bar: ["b"] }))
  .addEdge(START, "nodeA").addEdge("nodeA", "nodeB").addEdge("nodeB", END);

const checkpointer = new MemorySaver();
const graph = workflow.compile({ checkpointer });

// MUST provide thread_id
const config = { configurable: { thread_id: "1" } };
await graph.invoke({ foo: "", bar: [] }, config);

// Get/inspect state
const state = await graph.getState(config);
for await (const s of graph.getStateHistory(config)) { console.log(s.next, s.values); }

// Update state and fork
await graph.updateState(config, { foo: "modified" }, "nodeA");
await graph.invoke(null, config);  // Resume
```

**Production Checkpointers:**

```typescript
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
const pgCheckpointer = PostgresSaver.fromConnString("postgresql://...");
// await pgCheckpointer.setup();  // First time
```

**8. Durable Execution**

```typescript
import { task, StateGraph, MemorySaver } from "@langchain/langgraph";

// Wrap side effects in tasks for checkpointing
const makeRequest = task("makeRequest", async (url: string) => {
  const response = await fetch(url);
  return (await response.text()).slice(0, 100);
});

const callApi = async (state) => {
  const results = await Promise.all(state.urls.map(url => makeRequest(url)));
  return { results };
};

// Durability modes: "exit" | "async" | "sync"
await graph.stream(input, { durability: "sync", configurable: { thread_id: "1" } });

// Resume after error
await graph.invoke(null, config);  // Picks up from last checkpoint
```

**9. Memory**

**Short-term (Thread-scoped):**

```typescript
const graph = new StateGraph(State).addNode("call_model", callModel).addEdge(START, "call_model")
  .compile({ checkpointer: new MemorySaver() });
const config = { configurable: { thread_id: "1" } };
await graph.invoke({ messages: [{ role: "user", content: "I'm Bob" }] }, config);
await graph.invoke({ messages: [{ role: "user", content: "what's my name?" }] }, config);
// AI remembers "Bob"
```

**Long-term (Cross-thread):**

```typescript
import { InMemoryStore } from "@langchain/langgraph";
const store = new InMemoryStore();

const callModel = async (state, config) => {
  const userId = config.configurable?.userId;
  const memories = await config.store?.search(["memories", userId], { query: state.messages.at(-1)?.content });
  await config.store?.put(["memories", userId], uuidv4(), { data: "User is Bob" });
  // Use memories in response...
};

const graph = workflow.compile({ checkpointer, store });
```

**Semantic Search:**

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";
const store = new InMemoryStore({
  index: { embeddings: new OpenAIEmbeddings({ model: "text-embedding-3-small" }), dims: 1536 }
});
await store.put(["user", "memories"], "1", { text: "I love pizza" });
const items = await store.search(["user", "memories"], { query: "I'm hungry", limit: 1 });
```

**Message Management:**

```typescript
import { trimMessages, RemoveMessage } from "@langchain/core/messages";
const messages = trimMessages(state.messages, { strategy: "last", maxTokens: 128, tokenCounter: model });
// Delete: return { messages: state.messages.slice(0, 5).map(m => new RemoveMessage({ id: m.id })) };
```

---

### Part 4: Real-time Features

**10. Streaming**

```typescript
// Stream modes: "values" | "updates" | "messages" | "custom" | "debug"
for await (const chunk of await graph.stream({ topic: "cats" }, { streamMode: "updates" })) {
  console.log(chunk);  // { nodeName: { key: "value" } }
}

// Multiple modes
for await (const [mode, chunk] of await graph.stream(input, { streamMode: ["updates", "custom"] })) {
  console.log(mode, chunk);
}

// Stream LLM tokens
for await (const [msg, metadata] of await graph.stream(input, { streamMode: "messages" })) {
  if (msg.content) console.log(msg.content + "|");
  // Filter: metadata.tags?.includes("joke") or metadata.langgraph_node === "writePoem"
}

// Custom streaming from nodes
const node = async (state, config) => {
  config.writer({ progress: "50% complete" });
  return { answer: "done" };
};
for await (const chunk of await graph.stream(input, { streamMode: "custom" })) {
  console.log(chunk);  // { progress: "50% complete" }
}

// Subgraph outputs
for await (const chunk of await graph.stream(input, { streamMode: "updates", subgraphs: true })) {
  console.log(chunk);  // [['subgraphNode:id'], { nodeOutput }]
}
```

**11. Interrupts (Human-in-the-Loop)**

```typescript
import { interrupt, Command, MemorySaver, StateGraph, START, END } from "@langchain/langgraph";

// Approval workflow
const approvalNode = async (state) => {
  const decision = interrupt({ question: "Approve?", details: state.actionDetails });
  return new Command({ goto: decision ? "proceed" : "cancel" });
};

const graph = new StateGraph(State)
  .addNode("approval", approvalNode, { ends: ["proceed", "cancel"] })
  .addNode("proceed", () => ({ status: "approved" }))
  .addNode("cancel", () => ({ status: "rejected" }))
  .addEdge(START, "approval").addEdge("proceed", END).addEdge("cancel", END)
  .compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: "1" } };
const initial = await graph.invoke({ actionDetails: "Transfer $500" }, config);
console.log(initial.__interrupt__);  // [{ value: { question: "Approve?", ... } }]

// Resume with decision
await graph.invoke(new Command({ resume: true }), config);

// Tool with approval
const sendEmail = tool(async ({ to, subject }) => {
  const response = interrupt({ action: "send_email", to, subject, message: "Approve?" });
  if (response?.action === "approve") return `Email sent to ${response.to ?? to}`;
  return "Cancelled";
}, { name: "send_email", schema: z.object({ to: z.string(), subject: z.string() }) });

// Validation loop
const getAge = (state) => {
  let prompt = "What is your age?";
  while (true) {
    const answer = interrupt(prompt);
    if (typeof answer === "number" && answer > 0) return { age: answer };
    prompt = `'${answer}' invalid. Enter a positive number.`;
  }
};
```

**12. Time Travel**

```typescript
const config = { configurable: { thread_id: uuidv4() } };
await graph.invoke({}, config);

// Get history
const states = [];
for await (const s of graph.getStateHistory(config)) states.push(s);

// Find checkpoint before specific node
const checkpoint = states.find(s => s.next.includes("writeJoke"));

// Fork with modified state
const newConfig = await graph.updateState(checkpoint.config, { topic: "chickens" });

// Resume from fork
const forked = await graph.invoke(null, newConfig);  // New trajectory
```

---

### Part 5: Advanced Architecture

**13. Subgraphs**

```typescript
// Invoke from node (different schemas - transform at boundaries)
const SubgraphState = new StateSchema({ bar: z.string(), baz: z.string() });
const subgraph = new StateGraph(SubgraphState)
  .addNode("sub1", (s) => ({ baz: "baz" }))
  .addNode("sub2", (s) => ({ bar: s.bar + s.baz }))
  .addEdge(START, "sub1").addEdge("sub1", "sub2").compile();

const ParentState = new StateSchema({ foo: z.string() });
const parent = new StateGraph(ParentState)
  .addNode("node1", (s) => ({ foo: "hi! " + s.foo }))
  .addNode("node2", async (s) => {
    const response = await subgraph.invoke({ bar: s.foo });  // Transform in
    return { foo: response.bar };  // Transform out
  })
  .addEdge(START, "node1").addEdge("node1", "node2").compile();

// Add as node (shared schema - no transformation needed)
const SharedState = new StateSchema({ foo: z.string(), bar: z.string() });
const subgraph = new StateGraph(SharedState).addNode("sub", (s) => ({ foo: s.foo + s.bar })).compile();
const parent = new StateGraph(SharedState)
  .addNode("node1", (s) => ({ bar: "bar" }))
  .addNode("node2", subgraph)  // Add compiled graph directly
  .addEdge(START, "node1").addEdge("node1", "node2").compile();

// Subgraph with own memory
const subgraph = subgraphBuilder.compile({ checkpointer: true });

// Navigate to parent graph
return new Command({ update: { foo: "bar" }, goto: "otherNode", graph: Command.PARENT });

// Stream subgraph outputs
for await (const c of await graph.stream(input, { streamMode: "updates", subgraphs: true })) {
  console.log(c);  // [['node2:id'], { subNode: { ... } }]
}
```

**14. Application Structure**

```
my-app/
├── src/
│   ├── agent.ts          # export const agent = workflow.compile()
│   ├── nodes/
│   │   ├── classify.ts   # export const classifyNode: GraphNode<State> = ...
│   │   └── respond.ts
│   ├── tools/
│   │   └── email.ts      # export const sendEmail = tool(...)
│   └── state.ts          # export const State = new StateSchema({...})
├── package.json
├── .env                  # LANGSMITH_API_KEY=lsv2...
└── langgraph.json
```
```json
// langgraph.json
{
  "node_version": "24",
  "dependencies": ["."],
  "graphs": {
    "agent": "./src/agent.ts:agent",
    "support": "./src/support.ts:supportAgent"
  },
  "env": ".env",
  "store": { "index": { "embed": "openai:text-embeddings-3-small", "dims": 1536 } }
}
```

**15. Testing**

```typescript
import { test, expect } from "vitest";
import { StateGraph, StateSchema, START, END, MemorySaver } from "@langchain/langgraph";

const State = new StateSchema({ my_key: z.string() });
const createGraph = () => new StateGraph(State)
  .addNode("node1", () => ({ my_key: "from node1" }))
  .addNode("node2", () => ({ my_key: "from node2" }))
  .addEdge(START, "node1").addEdge("node1", "node2").addEdge("node2", END);

test("full execution", async () => {
  const graph = createGraph().compile({ checkpointer: new MemorySaver() });
  const result = await graph.invoke({ my_key: "initial" }, { configurable: { thread_id: "1" } });
  expect(result.my_key).toBe("from node2");
});

test("individual node", async () => {
  const graph = createGraph().compile({ checkpointer: new MemorySaver() });
  const result = await graph.nodes["node1"].invoke({ my_key: "initial" });
  expect(result.my_key).toBe("from node1");
});

test("partial execution", async () => {
  const graph = createGraph().compile({ checkpointer: new MemorySaver() });
  const config = { configurable: { thread_id: "1" } };
  await graph.updateState(config, { my_key: "simulated" }, "node1");  // Simulate node1 output
  const result = await graph.invoke(null, { ...config, interruptAfter: ["node2"] });
  expect(result.my_key).toBe("from node2");
});
```

---

### Part 6: Development Tools

**16. LangSmith Studio**

```bash
# Install CLI
npm install --save-dev @langchain/langgraph-cli

# Start local server with Studio
npx @langchain/langgraph-cli dev

# Output:
# - API: http://127.0.0.1:2024
# - Studio UI: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024

# Safari workaround (creates secure tunnel)
npx @langchain/langgraph-cli dev --tunnel
```
```typescript
// agent.ts - simple agent for Studio
import { createAgent } from "@langchain/langgraph";

function sendEmail(to: string, subject: string, body: string): string {
  return `Email sent to ${to}`;
}

export const agent = createAgent({
  model: "gpt-4o",
  tools: [sendEmail],
  systemPrompt: "You are an email assistant.",
});
```
```json
// langgraph.json
{
  "dependencies": ["."],
  "graphs": { "agent": "./src/agent.ts:agent" },
  "env": ".env"
}
```

Features:

- Step-by-step execution visualization
- State inspection at each node
- Prompt iteration with hot-reload
- Debug LangSmith traces

**17. Agent Chat UI**

```bash
# Create new project
npx create-agent-chat-app --project-name my-chat-ui
cd my-chat-ui && pnpm install && pnpm dev

# Or clone repository
git clone https://github.com/langchain-ai/agent-chat-ui.git
cd agent-chat-ui && pnpm install && pnpm dev
```

Connect to agent:

1. **Graph ID**: Name from `graphs` in `langgraph.json`
2. **Deployment URL**: `http://localhost:2024` (local) or deployed URL
3. **LangSmith API key**: Optional for local

Features:

- Real-time chat interface
- Tool call visualization
- Time-travel debugging
- State forking
- Generative UI support

---

### Part 7: Production Deployment

**18. LangSmith Deployment**

Deploy: Push code with `langgraph.json` to GitHub → Connect in LangSmith → Create deployment → Test in Studio → Get API URL

```typescript
import { Client } from "@langchain/langgraph-sdk";

const client = new Client({
  apiUrl: "your-deployment-url",
  apiKey: "your-langsmith-api-key"
});

// Stateless run (no thread)
const stream = client.runs.stream(null, "agent", {
  input: { messages: [{ role: "user", content: "Hello" }] },
  streamMode: "messages-tuple",
});
for await (const chunk of stream) {
  console.log(`Event: ${chunk.event}`, chunk.data);
}

// Stateful run (with thread)
const thread = await client.threads.create();
await client.runs.wait(thread.thread_id, "agent", {
  input: { messages: [{ role: "user", content: "Hi!" }] }
});
```
```bash
# cURL
curl -s --request POST --url "https://your-deployment/runs/stream" \
  --header "Content-Type: application/json" --header "X-Api-Key: your-key" \
  --data '{"assistant_id":"agent","input":{"messages":[{"role":"human","content":"Hello"}]}}'
```

**19. LangSmith Observability**

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=lsv2...
export LANGSMITH_PROJECT=my-agent  # Optional custom project
```
```typescript
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";

// Selective tracing
const tracer = new LangChainTracer({ projectName: "email-agent" });
await agent.invoke(input, { callbacks: [tracer] });

// Metadata and tags
await agent.invoke(input, {
  tags: ["production", "v1.0"],
  metadata: { userId: "123", sessionId: "456" }
});

// Anonymize sensitive data
import { createAnonymizer } from "langsmith/anonymizer";
import { Client } from "langsmith";

const anonymizer = createAnonymizer([
  { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/, replace: "<SSN>" }
]);
const client = new Client({ anonymizer });
const tracer = new LangChainTracer({ client });
export const graph = workflow.compile().withConfig({ callbacks: [tracer] });
```

---

### Part 8: APIs and Runtime

**20. Graph API vs Functional API**

**Graph API** - Declarative, explicit state, visual representation:

```typescript
import { StateGraph, StateSchema, MessagesValue, GraphNode, ConditionalEdgeRouter, START, END } from "@langchain/langgraph";

const State = new StateSchema({
  messages: MessagesValue,
  currentStep: z.string(),
  retryCount: z.number().default(0),
});

const shouldContinue: ConditionalEdgeRouter<typeof State> = (state) => {
  if (state.retryCount > 3) return END;
  return state.currentStep === "search" ? "processSearch" : "callLlm";
};

const workflow = new StateGraph(State)
  .addNode("callLlm", callLlmNode)
  .addNode("processSearch", searchNode)
  .addConditionalEdges("callLlm", shouldContinue)
  .addEdge(START, "callLlm")
  .compile();
```

**Functional API** - Imperative, function-scoped state, standard control flow:

```typescript
import { entrypoint, task, interrupt } from "@langchain/langgraph";

const processInput = task("processInput", async (input: string) => {
  return { processed: input.toLowerCase().trim() };
});

const workflow = entrypoint({ checkpointer }, async (input: string) => {
  const processed = await processInput(input);
  
  if (processed.processed.includes("urgent")) {
    return await handleUrgent(processed);
  }
  return await handleNormal(processed);
});

// With human-in-the-loop
const essayWorkflow = entrypoint({ checkpointer }, async (topic: string) => {
  const essay = await writeEssay(topic);
  const feedback = interrupt({ essay, action: "Please review" });
  
  if (feedback === "approve") return { essay };
  return { essay: await reviseEssay(essay, feedback) };
});
```

**When to use each:**

| Graph API | Functional API |

|-----------|----------------|

| Complex branching | Linear workflows |

| Parallel execution paths | Standard if/else/loops |

| Team collaboration (visual) | Rapid prototyping |

| Shared state across nodes | Function-scoped state |

**21. Runtime (Pregel)**

Based on Google's Pregel algorithm. Execution model:

1. **Plan**: Select actors (nodes) to execute
2. **Execute**: Run in parallel until completion
3. **Update**: Apply channel updates
4. Repeat until no actors selected
```typescript
import { EphemeralValue, LastValue, Topic, BinaryOperatorAggregate } from "@langchain/langgraph/channels";
import { Pregel, NodeBuilder } from "@langchain/langgraph/pregel";

// Direct Pregel API (low-level)
const node1 = new NodeBuilder()
  .subscribeOnly("a")
  .do((x: string) => x + x)
  .writeTo("b");

const node2 = new NodeBuilder()
  .subscribeOnly("b")
  .do((x: string) => x + x)
  .writeTo("c");

const app = new Pregel({
  nodes: { node1, node2 },
  channels: {
    a: new EphemeralValue<string>(),
    b: new LastValue<string>(),
    c: new EphemeralValue<string>(),
  },
  inputChannels: ["a"],
  outputChannels: ["b", "c"],
});

await app.invoke({ a: "foo" });  // { b: 'foofoo', c: 'foofoofoofoo' }

// Channels with reducers
const reducer = (current: string, update: string) => current ? `${current} | ${update}` : update;
const channels = {
  a: new EphemeralValue<string>(),
  b: new EphemeralValue<string>(),
  c: new BinaryOperatorAggregate<string>({ operator: reducer }),
};

// Topic for accumulation
const channels = {
  a: new EphemeralValue<string>(),
  b: new EphemeralValue<string>(),
  c: new Topic<string>({ accumulate: true }),
};
```


**High-level APIs compile to Pregel:**

```typescript
// StateGraph compiles to Pregel
const graph = new StateGraph(State).addNode(...).compile();
console.log(graph.nodes);    // PregelNode instances
console.log(graph.channels); // LastValue, EphemeralValue channels

// Entrypoint creates Pregel
const workflow = entrypoint({ checkpointer, name: "workflow" }, async (input) => { ... });
console.log(workflow.nodes);    // { workflow: PregelNode }
console.log(workflow.channels); // { __start__: EphemeralValue, __end__: LastValue, __previous__: LastValue }
```

---

## Implementation Approach

The guide will be created as a single comprehensive markdown file ([docs/LANGGRAPH_GUIDE.md](docs/LANGGRAPH_GUIDE.md)) containing:

- All 21 topics with detailed explanations
- Production-ready TypeScript code examples
- Best practices from official documentation
- Architecture diagrams using Mermaid
- Cross-references between related sections