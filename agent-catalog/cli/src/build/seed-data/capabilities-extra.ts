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
    status: "inferred",
    maturity: "unknown",
    reusable: false,
    description:
      "An exec_approvals_config table exists in the shared state DB, suggesting shell/exec-tool calls are gated by an approval/sandbox policy, but the exact sandbox mechanism (subprocess isolation? filesystem/network restriction?) was not located and read this pass.",
    implementationSummary:
      "src/security/ (top-level directory, confirmed to exist, not opened this pass) is the most likely home for this logic.",
    symbols: [],
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
      'Confirmed the type name (AssistantMessageEventStreamContract) and the factory (createAssistantMessageEventStream) via src/llm/stream.ts; confirmed one concrete event shape ({ type: "error", reason: "error", error: AssistantMessage }) from the same file\'s error-handling branch. The full event union (text-delta, reasoning-delta, tool-call-*, usage-update, etc.) was not read from packages/ai/src/types.ts this pass.',
    reasonUnresolved:
      "Deprioritized after the subagent failures in favor of confirming the loop/provider architecture first.",
    likelyInterpretation:
      "packages/ai/src/types.ts almost certainly contains the full event union, given it's the package's own canonical type file.",
    verificationMethod:
      "Read packages/ai/src/types.ts in full and enumerate every event/tag value.",
    priority: "high",
    status: "open",
  },
  {
    category: "gateway-protocol",
    question:
      "What does packages/gateway-protocol/ define, and how does it relate to the AssistantMessageEventStreamContract event model?",
    evidenceInspected:
      "Not opened this pass at all -- packages/gateway-protocol was named in the task brief as a scoped guide location but was not investigated during this research pass.",
    reasonUnresolved:
      "Time/resource constraint after the subagent failures; this was assigned to the 'events, streaming, gateway protocol' research thread which did not complete.",
    likelyInterpretation:
      "Likely a client<->gateway RPC/message envelope schema (WebSocket or SSE transport) that wraps or references the same underlying agent-run events for delivery to external clients (channels, control UI).",
    verificationMethod:
      "Read packages/gateway-protocol/package.json and its src/index.ts or equivalent entry file.",
    priority: "high",
    status: "open",
  },
];
