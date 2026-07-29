import type { SeedDataType, SeedEvent } from "../seed-types.js";

export const eventDataTypes: SeedDataType[] = [
  {
    key: "dt:AgentRunCompletedOutcome",
    symbolKey: undefined,
    name: "AgentRunCompletedOutcome",
    category: "run",
    status: "confirmed",
    persistenceScope: "run",
    providerSpecific: false,
    purpose:
      'The coarse terminal-outcome union for a harness attempt, defined in src/agents/harness/lifecycle.ts as `type AgentRunCompletedOutcome = "completed" | "aborted" | "blocked" | "error"`, paired with an AgentRunCompletion shape carrying optional blockedBy/error detail. This is a harness-level (per-attempt) outcome tag, distinct from the lower-level AssistantMessageEvent stream (see dt:AssistantMessageEvent).',
    fields: [
      {
        name: "outcome",
        typeText: '"completed" | "aborted" | "blocked" | "error"',
        required: true,
        persisted: true,
        description: "Coarse terminal classification.",
      },
      { name: "blockedBy", typeText: "string | undefined", required: false, persisted: true },
      { name: "error", typeText: "unknown", required: false, persisted: false },
    ],
  },
  {
    key: "dt:AssistantMessageEvent",
    symbolKey: undefined,
    name: "AssistantMessageEvent",
    category: "event",
    status: "confirmed",
    persistenceScope: "run",
    providerSpecific: false,
    purpose:
      "The canonical low-level stream event union every provider adapter normalizes into, defined in packages/llm-core/src/types.ts:397-418 (re-exported by packages/ai/src/types.ts and src/llm/types.ts). Read in full this pass. 12 discriminated variants keyed by `type`; see the `events` table for one row per variant with its exact field list.",
    fields: [
      {
        name: "type",
        typeText: "one of the 12 event names -- see events table",
        required: true,
        persisted: false,
        description: "Discriminant tag.",
      },
    ],
  },
  {
    key: "dt:AssistantMessage.v2",
    symbolKey: undefined,
    name: "AssistantMessage",
    category: "message",
    status: "confirmed",
    persistenceScope: "run",
    providerSpecific: false,
    purpose:
      "Upgraded from 'inferred' to 'confirmed' this pass: full definition read at packages/llm-core/src/types.ts:314-331. An assistant turn carrying provider identity, content blocks, usage, and stop state.",
    fields: [
      { name: "role", typeText: '"assistant"', required: true, persisted: true },
      {
        name: "content",
        typeText: "(TextContent | ThinkingContent | ToolCall)[]",
        required: true,
        persisted: true,
      },
      { name: "api", typeText: "Api", required: true, persisted: true },
      { name: "provider", typeText: "Provider", required: true, persisted: true },
      { name: "model", typeText: "string", required: true, persisted: true },
      {
        name: "responseModel",
        typeText: "string | undefined",
        required: false,
        persisted: true,
        description:
          "Concrete chunk.model when different from requested model (e.g. OpenRouter auto).",
      },
      {
        name: "responseId",
        typeText: "string | undefined",
        required: false,
        persisted: true,
        description: "Provider-specific response/message id.",
      },
      {
        name: "turnId",
        typeText: "string | undefined",
        required: false,
        persisted: true,
        description: "Runtime-assigned stable turn identity when the provider does not expose one.",
      },
      {
        name: "diagnostics",
        typeText: "AssistantMessageDiagnostic[] | undefined",
        required: false,
        persisted: true,
        sensitive: true,
        description: "Redacted provider/runtime diagnostics for failures and recoveries.",
      },
      { name: "usage", typeText: "Usage", required: true, persisted: true },
      {
        name: "stopReason",
        typeText: '"stop" | "length" | "toolUse" | "error" | "aborted"',
        required: true,
        persisted: true,
      },
      { name: "errorMessage", typeText: "string | undefined", required: false, persisted: true },
      { name: "errorCode", typeText: "string | undefined", required: false, persisted: true },
      { name: "errorType", typeText: "string | undefined", required: false, persisted: true },
      { name: "errorBody", typeText: "string | undefined", required: false, persisted: true },
      { name: "timestamp", typeText: "number", required: true, persisted: true },
    ],
  },
  {
    key: "dt:ThinkingContent",
    symbolKey: undefined,
    name: "ThinkingContent",
    category: "message",
    status: "confirmed",
    persistenceScope: "run",
    providerSpecific: true,
    purpose:
      "packages/llm-core/src/types.ts:243-251. THE reasoning-content data type: exposes real reasoning text by default (`thinking`), an opaque provider replay token (`thinkingSignature`), and a `redacted` flag for safety-filtered content where the encrypted payload lives in `thinkingSignature` instead. Directly answers whether reasoning is exposed, summarized, or hidden: exposed as real text, with an orthogonal opaque-continuation-token mechanism.",
    fields: [
      { name: "type", typeText: '"thinking"', required: true, persisted: true },
      {
        name: "thinking",
        typeText: "string",
        required: true,
        persisted: true,
        description: "The actual reasoning text.",
      },
      {
        name: "thinkingSignature",
        typeText: "string | undefined",
        required: false,
        persisted: true,
        sensitive: true,
        description:
          "Opaque provider token for multi-turn continuity, e.g. the OpenAI Responses reasoning item ID.",
      },
      {
        name: "redacted",
        typeText: "boolean | undefined",
        required: false,
        persisted: true,
        description:
          "True when safety filters redacted the content; the encrypted payload is then in thinkingSignature.",
      },
    ],
  },
  {
    key: "dt:ToolCall.v2",
    symbolKey: undefined,
    name: "ToolCall",
    category: "tool-call",
    status: "confirmed",
    persistenceScope: "run",
    providerSpecific: true,
    purpose:
      "packages/llm-core/src/types.ts:261-268. Normalized assistant tool call emitted by providers or repaired from text.",
    fields: [
      { name: "type", typeText: '"toolCall"', required: true, persisted: true },
      { name: "id", typeText: "string", required: true, persisted: true },
      { name: "name", typeText: "string", required: true, persisted: true },
      { name: "arguments", typeText: "Record<string, unknown>", required: true, persisted: true },
      {
        name: "thoughtSignature",
        typeText: "string | undefined",
        required: false,
        persisted: true,
        sensitive: true,
        providerSpecific: true,
        description: "Google-specific opaque signature for reusing thought context.",
      },
      {
        name: "executionMode",
        typeText: '"sequential" | "parallel" | undefined',
        required: false,
        persisted: true,
      },
    ],
  },
  {
    key: "dt:Usage.v2",
    symbolKey: undefined,
    name: "Usage",
    category: "message",
    status: "confirmed",
    persistenceScope: "run",
    providerSpecific: false,
    purpose:
      "packages/llm-core/src/types.ts:271-292. Normalized token and cost accounting for a provider response, including an exact context-window snapshot for the final iteration.",
    fields: [
      { name: "input", typeText: "number", required: true, persisted: true },
      { name: "output", typeText: "number", required: true, persisted: true },
      { name: "cacheRead", typeText: "number", required: true, persisted: true },
      { name: "cacheWrite", typeText: "number", required: true, persisted: true },
      {
        name: "cacheWrite1h",
        typeText: "number | undefined",
        required: false,
        persisted: true,
        description: "Subset of cacheWrite written with 1-hour retention when reported.",
      },
      {
        name: "contextUsage",
        typeText: '{state:"available";promptTokens;totalTokens} | {state:"unavailable"}',
        required: false,
        persisted: true,
        description: "Exact context snapshot for the final provider iteration.",
      },
      { name: "totalTokens", typeText: "number", required: true, persisted: true },
      {
        name: "cost",
        typeText: "{input;output;cacheRead;cacheWrite;total;totalOrigin?}",
        required: true,
        persisted: true,
      },
    ],
  },
  {
    key: "dt:Tool.llmcore",
    symbolKey: undefined,
    name: "Tool",
    category: "tool-call",
    status: "confirmed",
    persistenceScope: "process",
    providerSpecific: false,
    purpose:
      "packages/llm-core/src/types.ts:376-380. The low-level, wire-facing tool declaration sent to a provider: { name, description, parameters }, where `parameters` is a TypeBox TSchema (from the `typebox` package), not a plain JSON Schema object. This is distinct from src/tools/types.ts's ToolDescriptor, which is OpenClaw's higher-level registration/availability contract and types its inputSchema as a plain JsonObject -- some bridging step (not yet located) must convert ToolDescriptor.inputSchema into this Tool.parameters TypeBox shape before a provider call.",
    fields: [
      { name: "name", typeText: "string", required: true, persisted: false },
      { name: "description", typeText: "string", required: true, persisted: false },
      {
        name: "parameters",
        typeText: "TSchema (typebox)",
        required: true,
        persisted: false,
        description:
          "TypeBox schema, validated by ValidateToolArgumentsFn (types.ts:691) against an incoming ToolCall.",
      },
    ],
  },
  {
    key: "dt:Message.union",
    symbolKey: undefined,
    name: "Message",
    category: "message",
    status: "confirmed",
    persistenceScope: "run",
    providerSpecific: false,
    purpose:
      "packages/llm-core/src/types.ts:345. `type Message = UserMessage | AssistantMessage | ToolResultMessage` -- any conversation message. ToolResultMessage (types.ts:334-342) answers a prior ToolCall by toolCallId, carrying isError and content.",
    fields: [],
  },
];

/**
 * The full AssistantMessageEvent union, read directly from
 * packages/llm-core/src/types.ts:397-418 this pass (12 variants). Every
 * event's `name` is the literal `type` discriminant value used in source.
 */
export const seedEvents: SeedEvent[] = [
  {
    key: "evt:run-completed",
    name: "completed",
    category: "run",
    status: "confirmed",
    persisted: true,
    payloadTypeKey: "dt:AgentRunCompletedOutcome",
    description:
      "Harness-level terminal outcome tag: the run/attempt finished normally with a visible assistant answer.",
  },
  {
    key: "evt:run-aborted",
    name: "aborted",
    category: "run",
    status: "confirmed",
    persisted: true,
    payloadTypeKey: "dt:AgentRunCompletedOutcome",
    description:
      "Harness-level terminal outcome tag: the run/attempt was cancelled (matches the 'cancellation' capability).",
  },
  {
    key: "evt:run-blocked",
    name: "blocked",
    category: "run",
    status: "confirmed",
    persisted: true,
    payloadTypeKey: "dt:AgentRunCompletedOutcome",
    description:
      'Harness-level terminal outcome tag: the run/attempt stopped in a blocked state (e.g. exceeded the retry limit -- handleRetryLimitExhaustion sets livenessState: "blocked").',
  },
  {
    key: "evt:run-error",
    name: "error",
    category: "run",
    status: "confirmed",
    persisted: true,
    payloadTypeKey: "dt:AgentRunCompletedOutcome",
    description:
      "Harness-level terminal outcome tag: the run/attempt failed with an unrecoverable error.",
  },
  {
    key: "evt:stream-start",
    name: "start",
    category: "message",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      "packages/llm-core/src/types.ts:398. First event of a stream, carrying an initial `partial: AssistantMessage`. Streams must emit this before any partial update.",
  },
  {
    key: "evt:text-start",
    name: "text_start",
    category: "message",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description: "types.ts:399. { contentIndex, partial }. Opens a new text content block.",
  },
  {
    key: "evt:text-delta",
    name: "text_delta",
    category: "message",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      "types.ts:405. { contentIndex, delta, partial? }. `partial` is optionally omitted on plain text deltas to avoid retaining one full AssistantMessage snapshot per token; consumers replay `delta` from the latest start/end checkpoint.",
  },
  {
    key: "evt:text-end",
    name: "text_end",
    category: "message",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      "types.ts:406. { contentIndex, content, partial }. Closes a text content block with its final accumulated content.",
  },
  {
    key: "evt:thinking-start",
    name: "thinking_start",
    category: "reasoning",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description: "types.ts:407. { contentIndex, partial }. Opens a new ThinkingContent block.",
  },
  {
    key: "evt:thinking-delta",
    name: "thinking_delta",
    category: "reasoning",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      "types.ts:408. { contentIndex, delta, partial }. Incremental reasoning-text delta (always carries `partial`, unlike text_delta).",
  },
  {
    key: "evt:thinking-end",
    name: "thinking_end",
    category: "reasoning",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      "types.ts:409. { contentIndex, content, partial }. Closes a ThinkingContent block with the final reasoning text.",
  },
  {
    key: "evt:toolcall-start",
    name: "toolcall_start",
    category: "tool",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description: "types.ts:410. { contentIndex, partial }. Opens a new tool-call content block.",
  },
  {
    key: "evt:toolcall-delta",
    name: "toolcall_delta",
    category: "tool",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      "types.ts:411. { contentIndex, delta, partial }. Incremental tool-call-arguments-JSON delta.",
  },
  {
    key: "evt:toolcall-end",
    name: "toolcall_end",
    category: "tool",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      "types.ts:412. { contentIndex, toolCall: ToolCall, partial }. Closes a tool-call block with the fully parsed ToolCall.",
  },
  {
    key: "evt:done",
    name: "done",
    category: "message",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      'types.ts:413-417. { reason: "stop"|"length"|"toolUse", message: AssistantMessage }. Successful stream termination.',
  },
  {
    key: "evt:stream-error",
    name: "error",
    category: "message",
    status: "confirmed",
    persisted: false,
    payloadTypeKey: "dt:AssistantMessageEvent",
    description:
      'types.ts:418. { reason: "aborted"|"error", error: AssistantMessage }. Failed/aborted stream termination -- confirmed directly in src/llm/stream.ts\'s deferUntilTransportRuntimeHost error path too.',
  },
  {
    key: "evt:execution-phase",
    name: "runner_entered | workspace | runtime_plugins | before_agent_reply | context_engine",
    category: "run",
    status: "confirmed",
    persisted: false,
    description:
      "Named execution-phase progress notifications (notifyExecutionPhase calls confirmed in run-orchestrator.ts and run-loop.ts) used for run-progress observability, distinct from the assistant-message event stream itself.",
  },
];
