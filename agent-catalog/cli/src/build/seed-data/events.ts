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
      'The coarse terminal-outcome union for a harness attempt, defined in src/agents/harness/lifecycle.ts as `type AgentRunCompletedOutcome = "completed" | "aborted" | "blocked" | "error"`, paired with an AgentRunCompletion shape carrying optional blockedBy/error detail.',
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
];

/**
 * Confirmed event names are intentionally sparse this pass: the full
 * AssistantMessageEventStreamContract discriminated union (text-delta,
 * reasoning-delta, tool-call-*, usage-update, etc.) lives in
 * packages/ai/src/types.ts, which was not read line-by-line this pass --
 * see open_questions ("full event union"). What is listed here is directly
 * evidenced by files that were actually read.
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
      "Terminal outcome tag: the run/attempt finished normally with a visible assistant answer.",
  },
  {
    key: "evt:run-aborted",
    name: "aborted",
    category: "run",
    status: "confirmed",
    persisted: true,
    payloadTypeKey: "dt:AgentRunCompletedOutcome",
    description:
      "Terminal outcome tag: the run/attempt was cancelled (matches the 'cancellation' capability).",
  },
  {
    key: "evt:run-blocked",
    name: "blocked",
    category: "run",
    status: "confirmed",
    persisted: true,
    payloadTypeKey: "dt:AgentRunCompletedOutcome",
    description:
      'Terminal outcome tag: the run/attempt stopped in a blocked state (e.g. exceeded the retry limit -- handleRetryLimitExhaustion sets livenessState: "blocked").',
  },
  {
    key: "evt:run-error",
    name: "error",
    category: "run",
    status: "confirmed",
    persisted: true,
    payloadTypeKey: "dt:AgentRunCompletedOutcome",
    description: "Terminal outcome tag: the run/attempt failed with an unrecoverable error.",
  },
  {
    key: "evt:stream-error",
    name: "error",
    category: "message",
    status: "confirmed",
    persisted: false,
    description:
      'A stream-level error event, shaped { type: "error", reason: "error", error: AssistantMessage }, pushed onto the AssistantMessageEventStreamContract when the transport-runtime host fails to initialize or the underlying provider stream throws (src/llm/stream.ts\'s deferUntilTransportRuntimeHost).',
    producerSymbolKeys: [],
    consumerSymbolKeys: [],
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
