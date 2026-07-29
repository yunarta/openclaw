import type { SeedCapability, SeedFinding, SeedOpenQuestion } from "../seed-types.js";

/** Remaining required capabilities (per the catalog spec) not already defined in agent-loop.ts / providers.ts / oauth.ts / memory-sessions.ts. */
export const extraCapabilities: SeedCapability[] = [
  {
    name: "memory write",
    category: "memory",
    status: "inferred",
    maturity: "production",
    reusable: false,
    description:
      "Writing conversation turns to transcript_events/session_nodes is confirmed to happen (the schema exists and is populated in production), but the exact writer symbol/function was not located and read this pass.",
    implementationSummary:
      "See persistence_entities records for transcript_events and session_nodes.",
    symbols: [],
  },
  {
    name: "memory retrieval",
    category: "memory",
    status: "inferred",
    maturity: "production",
    reusable: false,
    description:
      "Retrieval of prior conversation history for prompt construction is confirmed to exist conceptually (multi-turn chat requires it) and semantic-memory retrieval is confirmed at the schema level (memory_index_chunks + memory_embedding_cache), but neither retrieval function was located and read this pass.",
    implementationSummary:
      "See memory_systems records 'conversation history' and 'semantic memory index'.",
    symbols: [],
  },
  {
    name: "prompt construction",
    category: "prompt",
    status: "inferred",
    maturity: "production",
    reusable: false,
    description:
      "System-instruction and prompt assembly is confirmed to be a distinct step (src/agents/system-prompt-params.ts's resolveSystemPromptRepoRoot is called from run-orchestrator.ts, and src/agents/embedded-agent-runner/run/attempt-system-prompt.ts / attempt-system-prompt-prepare.ts / attempt-prompt-assembly.ts are all confirmed to exist), but the full assembly pipeline was not read line-by-line this pass.",
    implementationSummary:
      "resolveSystemPromptRepoRoot (src/agents/system-prompt-params.ts) resolves the workspace repo root used in prompt construction; the dedicated attempt-prompt-*.ts files under embedded-agent-runner/run/ are the strongest candidates for the actual assembly logic.",
    symbols: [],
  },
  {
    name: "summarization",
    category: "memory",
    status: "inferred",
    maturity: "production",
    reusable: false,
    description:
      "Whether compaction (src/agents/embedded-agent-runner/compact.ts) performs LLM-driven summarization versus mechanical truncation was not confirmed by reading source this pass.",
    implementationSummary: "See capability 'compaction'.",
    symbols: [],
  },
  {
    name: "skills",
    category: "skills",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Markdown-based (SKILL.md) reusable agent skills with declarative frontmatter metadata, discovered from a bundled skills/ directory (~53 entries confirmed) plus workspace-local sources, with invocation policy (userInvocable/disableModelInvocation) and a proposal-based workshop for authoring changes.",
    implementationSummary: "See the skill-runtime module and skillDataTypes/seedSkills records.",
    symbols: [],
  },
  {
    name: "sub-agents",
    category: "agent-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "A run can spawn and supervise a delegated child agent session via the ACP (Agent Client Protocol) spawn machinery, with the parent's view of the child's event stream persisted (acp_parent_stream_events).",
    implementationSummary: "See the sub-agent-delegation module.",
    symbols: [],
  },
  {
    name: "sandboxing",
    category: "security",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "RESOLVED in a follow-up pass: src/agents/sandbox/ is a pluggable tool-execution sandbox with two registered backends -- Docker (container isolation: read-only rootfs, capability dropping, seccomp/AppArmor, resource limits, network modes, hardened bind-mount defaults) and SSH (remote-host execution). Independently of the backend, a per-tool allow/deny glob-pattern policy (isToolAllowed, merged across default/global/agent scope) decides which tools even reach the sandbox. src/security/'s audit-*.ts files are a DIFFERENT thing -- OpenClaw's own configuration-hygiene auditor, not the sandbox mechanism.",
    implementationSummary:
      "See the tool-sandbox-runtime module for the full file/symbol map. isToolAllowed (src/agents/sandbox/tool-policy.ts:218-221) is the policy gate; registerSandboxBackend/getSandboxBackendFactory (backend.ts) is the pluggable-backend seam Docker and SSH each register into.",
    symbols: [{ symbolKey: "sym:isToolAllowed", role: "policy" }],
  },
];

export const extraFindings: SeedFinding[] = [
  {
    category: "architecture",
    title:
      "OpenClaw is a plugin host over a reusable provider package, not a single monolithic agent loop",
    description:
      "The 'agent loop' the task asked to locate is actually two layers: (1) a generic AgentHarness plugin contract (src/agents/harness/) that any provider can implement, and (2) one specific implementation of that contract -- the embedded runner (src/agents/embedded-agent-runner/) -- registered as the built-in 'openclaw' harness. Codex is a second, independent implementation of the same contract, driving the actual @openai/codex CLI as a subprocess rather than reimplementing its protocol.",
    significance:
      "A REST API gateway extraction should mirror this two-layer shape (a harness/adapter interface, plus one built-in direct-API implementation) rather than assuming there is exactly one loop to port.",
    recommendation:
      "Treat AgentHarness (src/agents/harness/types.ts) as the primary interface to study when designing the gateway's ProviderAdapter contract.",
    status: "confirmed",
  },
  {
    category: "architecture",
    title: "packages/ai (@openclaw/ai) is the single best extraction candidate in the repository",
    description:
      "packages/ai has zero dependency on OpenClaw core, is already published as a standalone npm package, and its own package.json describes it as 'Reusable model provider adapters and streaming runtime from OpenClaw'. It implements the actual wire protocols (Anthropic Messages, OpenAI Responses/Completions, Google, Azure, Bedrock, Mistral) and stream normalization that a standalone gateway needs.",
    significance:
      "This single fact should anchor the extraction plan: build the gateway's Provider Router directly on @openclaw/ai rather than re-deriving provider adapters from scratch or from OpenClaw's core src/ tree.",
    recommendation:
      "Start the gateway's Provider Router / Codex Adapter / Claude Adapter layers by depending on @openclaw/ai and writing a thin host-policy + harness layer around it, mirroring src/llm/stream.ts and src/agents/harness/builtin-openclaw.ts.",
    status: "confirmed",
  },
  {
    category: "architecture",
    title:
      "packages/ai re-exports @openclaw/llm-core, a third standalone package that is the true type foundation",
    description:
      'packages/ai/src/types.ts is a 2-line file: `export * from "@openclaw/llm-core"`. The actual AssistantMessage/ToolCall/ThinkingContent/Usage/AssistantMessageEvent/Model/Tool type definitions all live in packages/llm-core/src/types.ts (691 lines), a separate workspace package (name: "@openclaw/llm-core", private, version 0.0.0-private) with its own package.json, dist build, and a dedicated validation.ts. packages/ai depends on it for types; the actual provider adapters (packages/ai/src/providers/*.ts) presumably import both.',
    significance:
      "The extraction hierarchy is three-deep, not two: llm-core (pure types + validation, zero provider logic) -> ai (provider adapters + streaming runtime, depends on llm-core) -> OpenClaw core's src/llm (host-policy facade, depends on ai). A standalone gateway's agent-contract layer should be built directly on @openclaw/llm-core, which is even more reusable than @openclaw/ai since it has no HTTP/SSE logic at all -- just types and a validation.ts helper.",
    recommendation:
      "Update EXTRACTION-GUIDE.md's agent-contract layer to name packages/llm-core as the primary source, not just packages/ai/src/types.ts.",
    status: "confirmed",
  },
  {
    category: "reasoning continuation state",
    title:
      "Reasoning/thinking content is exposed as real text, not just a summary, with a separate opaque replay signature",
    description:
      "packages/llm-core/src/types.ts's ThinkingContent (lines 243-251) has three fields: `thinking: string` (the actual reasoning text, exposed to callers), `thinkingSignature?: string` (an opaque provider token -- e.g. the OpenAI Responses reasoning item ID -- that must be replayed on continuation but carries no readable content itself), and `redacted?: boolean` (true when safety filters redacted the content; in that case the encrypted payload is stored in thinkingSignature instead of thinking). ToolCall separately has `thoughtSignature` for Google's opaque per-call thought-context token.",
    significance:
      "Directly answers 'does the system preserve hidden reasoning, summaries of reasoning, or neither': the answer is real reasoning text by default, with a distinct opaque-signature mechanism only for continuation/replay and only falling back to redaction when the provider's safety filter requires it. This is provider-agnostic at the llm-core type level; per-provider behavior (whether Anthropic/OpenAI/Google actually populate `thinking` vs. only `redacted` content) still depends on each provider adapter and was not verified per-provider this pass.",
    recommendation:
      "Update the 'reasoning events' capability and the Claude/Codex provider findings to cite ThinkingContent directly instead of inferring from file names.",
    status: "confirmed",
  },
  {
    category: "coverage-gap",
    title:
      "This catalog pass is narrower than originally scoped due to a mid-task resource constraint",
    description:
      "Nine parallel research subagents (one per major subsystem) were launched but all failed immediately after hitting the account's monthly spend limit, before returning any usable findings. Research continued via direct first-hand Grep/Read/Glob calls instead of subagents, which yielded higher per-item confidence but covered fewer files in depth (tool dispatch internals, skill loading/activation internals, MCP dispatch internals, cron-to-agent-loop linkage, and the SecretRef mechanism were not read in full).",
    significance:
      "The catalog is honest about this: every symbol/flow/finding with status 'inferred' or an open_questions entry reflects a real, named gap rather than a fabricated answer.",
    recommendation:
      "Prioritize the open_questions table (filter priority='high') for a follow-up research pass before treating this catalog as complete for tool-runtime and skill-runtime extraction planning.",
    status: "confirmed",
  },
];

export const extraOpenQuestions: SeedOpenQuestion[] = [
  {
    category: "events",
    question:
      "What is the exact discriminated-union type and full set of tag values for the internal agent-run event model (the AssistantMessageEventStreamContract's event payloads)?",
    evidenceInspected:
      'RESOLVED in a follow-up pass: packages/ai/src/types.ts turned out to be a 2-line re-export of @openclaw/llm-core (`export * from "@openclaw/llm-core"`). Read packages/llm-core/src/types.ts (691 lines) in full. The `AssistantMessageEvent` union (lines 397-418) has exactly 12 variants: start, text_start, text_delta, text_end, thinking_start, thinking_delta, thinking_end, toolcall_start, toolcall_delta, toolcall_end, done, error. See the events table for the full per-variant field list, and the `llm-core-foundation` module/finding for the architectural implication (a THIRD standalone package, more foundational than packages/ai).',
    reasonUnresolved: "N/A -- resolved.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod: "N/A -- resolved.",
    priority: "high",
    status: "resolved",
  },
  {
    category: "gateway-protocol",
    question:
      "What does packages/gateway-protocol/ define, and how does it relate to the AssistantMessageEventStreamContract event model?",
    evidenceInspected:
      'RESOLVED in a follow-up pass: read packages/gateway-protocol/README.md and src/schema/agent.ts (398 lines) in full, plus src/infra/agent-events.ts (745 lines) in full. gateway-protocol is a standalone TypeBox schema/validator package for the Gateway WebSocket wire protocol (version 4). Its AgentEventSchema is a generic stream-event envelope (runId/seq/stream/ts/data) with `data` deliberately left as Type.Unknown() -- by explicit README design, ~60 fields including every event `data` payload are intentionally open passthroughs. src/infra/agent-events.ts independently defines the internal AgentEventPayload producer (emitAgentEvent), structurally matching but not type-linked to gateway-protocol. The embedded runner\'s emitAssistantStreamDataSafely (src/agents/embedded-agent-subscribe.ts:279-304) is the exact bridge point where a normalized AssistantMessageEvent becomes an emitAgentEvent({ stream: "assistant", data }) call. See the gateway-wire-protocol module/finding for the full three-layer picture.',
    reasonUnresolved: "N/A -- resolved.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod: "N/A -- resolved.",
    priority: "high",
    status: "resolved",
  },
];
