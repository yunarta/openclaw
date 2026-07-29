import type { SeedModule } from "../seed-types.js";

export const modules: SeedModule[] = [
  {
    name: "llm-core-foundation",
    rootPath: "packages/llm-core",
    category: "provider",
    status: "confirmed",
    purpose:
      "The foundational type + validation package underneath @openclaw/ai. Defines every shared LLM contract (Api, Model, Message, AssistantMessage, ThinkingContent, ToolCall, Usage, Tool, Context, AssistantMessageEvent) with zero HTTP/provider logic.",
    responsibilities:
      "Type definitions for the whole provider stack; tool-argument validation (validation.ts) against a TypeBox `Tool.parameters` schema; diagnostic-info types.",
    nonResponsibilities:
      "Does not make HTTP requests, does not know about specific providers (Anthropic/OpenAI/etc.), does not know about OpenClaw sessions/agents/plugins.",
    publicSurface: "packages/llm-core/src/index.ts, src/types.ts, src/validation.ts.",
    runtimeBehavior:
      "Pure library: packages/ai imports these types (packages/ai/src/types.ts is a 1-line re-export) and packages/ai's provider adapters construct/consume these shapes when talking to each provider's wire API.",
    extractionRelevance:
      "critical -- even more reusable than packages/ai since it has no transport/HTTP concerns at all; a standalone gateway's agent-contract layer should depend on this package directly.",
    extractionDifficulty: "low",
    files: [
      { fileKey: "packages/llm-core/package.json", role: "interface" },
      { fileKey: "packages/llm-core/src/types.ts", role: "interface" },
      { fileKey: "packages/llm-core/src/index.ts", role: "entry-point" },
      { fileKey: "packages/llm-core/src/validation.ts", role: "policy" },
      { fileKey: "packages/llm-core/src/utils/diagnostics.ts", role: "interface" },
    ],
  },
  {
    name: "agent-runtime-core",
    rootPath: "src/agents/embedded-agent-runner",
    category: "agent-runtime",
    status: "confirmed",
    purpose:
      "OpenClaw's own in-process ('embedded') agent execution loop: one attempt per provider call, wrapped in a retry/recovery/failover while(true) loop.",
    responsibilities:
      "Run admission, session/lane concurrency control, per-attempt dispatch to a provider via src/llm, tool-call continuation across attempts, auth/compaction/failover recovery, terminal-state resolution, usage accounting.",
    nonResponsibilities:
      "Does not implement provider wire protocols itself (delegates to src/llm -> @openclaw/ai). Does not implement channel-specific message rendering or delivery.",
    publicSurface:
      "runEmbeddedAgent() (run-orchestrator.ts) is the module's single external entry point; almost everything else is internal.",
    runtimeBehavior:
      "while(true) loop in run-loop.ts: dispatch attempt -> normalize -> (complete|retry) -> recover (auth/compaction/failover) -> (complete|retry) -> handle assistant failure -> finalize -> resolve terminal -> (complete|retry-continue).",
    extractionRelevance:
      "high -- this is the closest thing to a standalone 'agent run service' loop in the repository, but it is heavily entangled with OpenClaw-specific concepts (lanes, hooks, session targets, workspace resolution).",
    extractionDifficulty: "high",
    files: [
      { fileKey: "src/agents/embedded-agent-runner/run-orchestrator.ts", role: "entry-point" },
      { fileKey: "src/agents/embedded-agent-runner/run-loop.ts", role: "implementation" },
      { fileKey: "src/agents/embedded-agent-runner/run-execution.ts", role: "implementation" },
      { fileKey: "src/agents/embedded-agent-runner/run/attempt.ts", role: "implementation" },
      {
        fileKey: "src/agents/embedded-agent-runner/run/attempt-execution-phase.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/attempt-dispatch-preparation.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/attempt-normalization.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/attempt-recovery.ts",
        role: "implementation",
      },
      { fileKey: "src/agents/embedded-agent-runner/run/failover-policy.ts", role: "policy" },
      {
        fileKey: "src/agents/embedded-agent-runner/run/failover-retry-controller.ts",
        role: "policy",
      },
      { fileKey: "src/agents/embedded-agent-runner/run/retry-limit.ts", role: "implementation" },
      {
        fileKey: "src/agents/embedded-agent-runner/run/terminal-resolution.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/terminal-timeout.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/settled-turn-finalization.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/assistant-failure.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/runtime-preparation.ts",
        role: "implementation",
      },
      { fileKey: "src/agents/embedded-agent-runner/run/lane-controller.ts", role: "policy" },
      { fileKey: "src/agents/embedded-agent-runner/lanes.ts", role: "helper" },
      { fileKey: "src/agents/embedded-agent-runner/abort.ts", role: "implementation" },
      { fileKey: "src/agents/embedded-agent-runner/usage-accumulator.ts", role: "implementation" },
      { fileKey: "src/agents/embedded-agent-runner/types.ts", role: "interface" },
      { fileKey: "src/agents/agent-run-terminal-outcome.ts", role: "implementation" },
      { fileKey: "src/agents/embedded-agent-runner/cli-backend-dispatch.ts", role: "dispatcher" },
    ],
  },
  {
    name: "agent-harness-registry",
    rootPath: "src/agents/harness",
    category: "agent-runtime",
    status: "confirmed",
    purpose:
      "Pluggable execution-engine abstraction (AgentHarness) that lets a provider plugin (Codex, Copilot) supply an alternative agent loop, while the built-in 'openclaw' harness just wraps the embedded runner.",
    responsibilities:
      "Harness registration/lookup, capability/support negotiation, attempt lifecycle wrapping (diagnostics, trace propagation, result classification), settled-turn finalization contract.",
    nonResponsibilities:
      "Does not itself execute a turn -- delegates to whichever harness (embedded or plugin-provided) is selected.",
    publicSurface:
      "registerAgentHarness/getRegisteredAgentHarness/listRegisteredAgentHarnesses (registry.ts); AgentHarness/AgentHarnessAttemptParams/AgentHarnessAttemptResult types (types.ts).",
    runtimeBehavior:
      "A provider plugin calls api.registerAgentHarness(harness) at plugin-load time (confirmed for Codex). The run loop resolves the effective harness via preparedRuntime.snapshot().agentHarness and invokes its attempt contract through lifecycle.ts.",
    extractionRelevance:
      "high -- this is the cleanest seam for a standalone gateway's 'ProviderAdapter'/harness abstraction.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "src/agents/harness/types.ts", role: "interface" },
      { fileKey: "src/agents/harness/registry.ts", role: "registry" },
      { fileKey: "src/agents/harness/builtin-openclaw.ts", role: "adapter" },
      { fileKey: "src/agents/harness/lifecycle.ts", role: "implementation" },
      { fileKey: "src/agents/harness/selection.ts", role: "policy" },
      { fileKey: "src/agents/harness/policy.ts", role: "policy" },
      { fileKey: "src/agents/harness/result-classification.ts", role: "implementation" },
      { fileKey: "src/agents/harness/settled-turn-finalization-result.ts", role: "interface" },
    ],
  },
  {
    name: "ai-provider-package",
    rootPath: "packages/ai",
    category: "provider",
    status: "confirmed",
    purpose:
      "Standalone, non-OpenClaw-coupled provider-adapter and streaming-runtime package (published as @openclaw/ai). Implements the actual wire protocols for each Api family (anthropic-messages, openai-responses, openai-completions, google, azure, bedrock, mistral) and normalizes their SSE streams into one event model.",
    responsibilities:
      "Provider registry (api-registry.ts), per-family request construction and response parsing (providers/*.ts), low-level SSE stream reading (transports/*.ts), retry/backoff, host-policy ports for proxy/TLS/network customization.",
    nonResponsibilities:
      "Does not know about OpenClaw sessions, agents, plugins, channels, tools, or skills. Does not persist anything.",
    publicSurface:
      "stream()/complete() (src/stream.ts), api-registry.ts, providers.ts, transports.ts, types.ts.",
    runtimeBehavior:
      "src/llm/stream.ts (OpenClaw core) calls into this package's runtime, which picks the registered provider implementation for the model's Api family and returns a normalized AssistantMessageEventStreamContract.",
    extractionRelevance:
      "critical -- explicitly designed and described by its own authors as reusable; the single best extraction candidate for a standalone gateway's Provider Router + Codex/Claude adapters.",
    extractionDifficulty: "low",
    files: [
      { fileKey: "packages/ai/package.json", role: "interface" },
      { fileKey: "packages/ai/src/index.ts", role: "entry-point" },
      { fileKey: "packages/ai/src/stream.ts", role: "entry-point" },
      { fileKey: "packages/ai/src/api-registry.ts", role: "registry" },
      { fileKey: "packages/ai/src/providers.ts", role: "registry" },
      { fileKey: "packages/ai/src/transports.ts", role: "implementation" },
      { fileKey: "packages/ai/src/types.ts", role: "interface" },
      { fileKey: "packages/ai/src/host.ts", role: "interface" },
      { fileKey: "packages/ai/src/model-utils.ts", role: "helper" },
      { fileKey: "packages/ai/src/env-api-keys.ts", role: "helper" },
      { fileKey: "packages/ai/src/providers/anthropic.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/anthropic-usage.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/anthropic-tool-projection.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/anthropic-thinking-replay.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/anthropic-refusal.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/anthropic-server-fallback.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/anthropic-auth-headers.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/anthropic-model-contract.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/openai-responses.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/openai-reasoning-effort.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/openai-chatgpt-responses.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/openai-completions.ts", role: "adapter" },
      { fileKey: "packages/ai/src/providers/google.ts", role: "adapter" },
      { fileKey: "packages/ai/src/transports/anthropic-transport-stream.ts", role: "adapter" },
      { fileKey: "packages/ai/src/transports/anthropic-payload-policy.ts", role: "adapter" },
      {
        fileKey: "packages/ai/src/transports/provider-transport-stream.ts",
        role: "implementation",
      },
      {
        fileKey: "packages/ai/src/transports/openai-responses-stream-internal.ts",
        role: "adapter",
      },
      { fileKey: "packages/ai/src/transports/openai-responses-replay.ts", role: "adapter" },
      { fileKey: "packages/ai/src/transports/host-policy.ts", role: "implementation" },
      { fileKey: "packages/ai/src/internal/runtime.ts", role: "implementation" },
      { fileKey: "packages/ai/src/internal/default-runtime.ts", role: "implementation" },
      { fileKey: "packages/ai/src/internal/retry-after.ts", role: "helper" },
      { fileKey: "packages/ai/src/internal/retry-sleep.ts", role: "helper" },
      { fileKey: "packages/ai/src/utils/oauth/openai-chatgpt-jwt.ts", role: "helper" },
    ],
  },
  {
    name: "llm-facade",
    rootPath: "src/llm",
    category: "provider",
    status: "confirmed",
    purpose:
      "Thin OpenClaw-specific facade over @openclaw/ai: installs OpenClaw's transport host policy, exposes stream()/complete(), and re-exports the generic multi-provider OAuth helpers.",
    responsibilities:
      "Wiring @openclaw/ai's runtime into OpenClaw's process (host ports, lazy transport-runtime-host import), generic OAuth facade, model registry glue.",
    nonResponsibilities:
      "Does not implement provider wire protocols (delegates entirely to packages/ai).",
    publicSurface:
      "stream(), complete(), streamSimple(), completeSimple() (stream.ts); oauth.ts re-exports.",
    runtimeBehavior:
      "Registers built-in API providers into @openclaw/ai's defaultApiRegistry at module load; each stream()/complete() call lazily ensures the OpenClaw transport-runtime host is configured before delegating to the resolved runtime.",
    extractionRelevance:
      "medium -- useful as a template for how a standalone gateway would wire its own host policy into @openclaw/ai, but the module itself is OpenClaw-process-specific.",
    extractionDifficulty: "low",
    files: [
      { fileKey: "src/llm/stream.ts", role: "entry-point" },
      { fileKey: "src/llm/oauth.ts", role: "interface" },
      { fileKey: "src/llm/utils/oauth/index.ts", role: "implementation" },
      { fileKey: "src/llm/utils/oauth/types.ts", role: "interface" },
      { fileKey: "src/llm/utils/oauth/anthropic.ts", role: "adapter" },
      { fileKey: "src/llm/utils/oauth/openai-chatgpt.ts", role: "adapter" },
      { fileKey: "src/llm/utils/oauth/github-copilot.ts", role: "adapter" },
      { fileKey: "src/llm/utils/oauth/abort.ts", role: "helper" },
      { fileKey: "src/llm/model-registry.ts", role: "registry" },
      { fileKey: "src/llm/model-runtime-binding.ts", role: "helper" },
      { fileKey: "src/llm/ai-transport-host.ts", role: "adapter" },
      { fileKey: "src/llm/types.ts", role: "interface" },
    ],
  },
  {
    name: "provider-codex",
    rootPath: "extensions/codex",
    category: "provider",
    status: "confirmed",
    purpose:
      "Codex provider plugin: registers a full AgentHarness (createCodexAppServerAgentHarness) that drives the actual @openai/codex CLI's app-server as OpenClaw's execution engine, plus Codex-specific session catalog, native-thread tool bridging, and supervision tools.",
    responsibilities:
      "Codex app-server process/session lifecycle, session catalog (resume/continue/adopt), conversation binding and turn-event collection, Codex-specific web-search and media-understanding provider registration, owner-only supervision tools.",
    nonResponsibilities:
      "Does not implement the OpenAI Responses API wire protocol itself (that lives in packages/ai for the direct-API path Codex models can also use); does not own generic OAuth token storage (uses src/llm/utils/oauth/openai-chatgpt.ts).",
    publicSurface:
      "index.ts plugin entry (api.registerAgentHarness, api.registerWebSearchProvider, api.registerMediaUnderstandingProvider, api.registerMigrationProvider).",
    runtimeBehavior:
      "On plugin load, registers its AgentHarness; when selected for a run, the harness drives the codex app-server as a subprocess and OpenClaw's run loop treats it like any other harness attempt.",
    extractionRelevance:
      "medium -- the harness-registration pattern is reusable, but the plugin's internals are tightly bound to the OpenClaw plugin SDK and its own session-catalog conventions.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "extensions/codex/index.ts", role: "entry-point" },
      { fileKey: "extensions/codex/package.json", role: "interface" },
      { fileKey: "extensions/codex/src/session-catalog.ts", role: "persistence" },
      { fileKey: "extensions/codex/src/session-catalog-node-continue.ts", role: "implementation" },
      { fileKey: "extensions/codex/src/session-catalog-node-adoption.ts", role: "implementation" },
      { fileKey: "extensions/codex/src/native-thread-tool.ts", role: "adapter" },
      { fileKey: "extensions/codex/src/supervision-tools.ts", role: "implementation" },
      { fileKey: "extensions/codex/src/conversation-binding.ts", role: "adapter" },
      { fileKey: "extensions/codex/src/conversation-turn-collector.ts", role: "event-producer" },
      { fileKey: "extensions/codex/src/conversation-turn-input.ts", role: "adapter" },
      { fileKey: "extensions/codex/src/conversation-control.ts", role: "implementation" },
      { fileKey: "extensions/codex/src/incognito-session.ts", role: "implementation" },
      { fileKey: "extensions/codex/src/node-cli-sessions.ts", role: "implementation" },
      { fileKey: "extensions/codex/src/web-search-provider.ts", role: "adapter" },
      { fileKey: "extensions/codex/src/commands.ts", role: "helper" },
    ],
  },
  {
    name: "provider-anthropic",
    rootPath: "extensions/anthropic",
    category: "provider",
    status: "confirmed",
    purpose:
      "Claude/Anthropic provider plugin: owns auth (OAuth + API key), model catalog, an opt-in Claude CLI backend (for subscription-billing-safe turns), and a native Claude Code CLI session catalog. Does NOT implement the Anthropic Messages API wire protocol -- that lives in packages/ai.",
    responsibilities:
      "Claude auth/onboarding, model catalog and refs, CLI-backend dispatch target (cli-backend.ts) for the embedded runner's opt-in subscription-auth path, Claude CLI native session catalog/resume.",
    nonResponsibilities:
      "Does not construct Anthropic Messages API requests or parse its SSE stream (packages/ai/src/providers/anthropic.ts and packages/ai/src/transports/anthropic-transport-stream.ts own that).",
    publicSurface:
      "index.ts plugin entry; cli-backend.ts (invoked indirectly via src/agents/cli-runner.runtime.js from embedded-agent-runner/cli-backend-dispatch.ts).",
    runtimeBehavior:
      "Default embedded runs call the Anthropic Messages API directly through packages/ai using stored credentials. When a run opts into cliBackendDispatch: \"subscription-auth\", OpenClaw instead shells out through this plugin's CLI backend to run the turn as the actual `claude` CLI process, to keep usage on the subscription's plan limits.",
    extractionRelevance:
      "medium -- auth/catalog patterns are reusable; the CLI-backend and native session-catalog code is OpenClaw-specific.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "extensions/anthropic/package.json", role: "interface" },
      { fileKey: "extensions/anthropic/index.ts", role: "entry-point" },
      { fileKey: "extensions/anthropic/cli-backend.ts", role: "adapter" },
      { fileKey: "extensions/anthropic/cli-auth-seam.ts", role: "adapter" },
      { fileKey: "extensions/anthropic/cli-catalog.ts", role: "registry" },
      { fileKey: "extensions/anthropic/cli-migration.ts", role: "implementation" },
      { fileKey: "extensions/anthropic/session-catalog.ts", role: "persistence" },
      { fileKey: "extensions/anthropic/session-catalog-adoption.ts", role: "implementation" },
      { fileKey: "extensions/anthropic/session-upstream-activity.ts", role: "implementation" },
      { fileKey: "extensions/anthropic/claude-model-refs.ts", role: "registry" },
      { fileKey: "extensions/anthropic/claude-desktop-groups.ts", role: "helper" },
      { fileKey: "extensions/anthropic/usage.ts", role: "adapter" },
      { fileKey: "extensions/anthropic/stream-wrappers.ts", role: "adapter" },
      { fileKey: "extensions/anthropic/provider-discovery.ts", role: "registry" },
      { fileKey: "extensions/anthropic/register.runtime.ts", role: "entry-point" },
      { fileKey: "extensions/anthropic/setup-api.ts", role: "policy" },
    ],
  },
  {
    name: "tool-runtime",
    rootPath: "src/tools",
    category: "tool-runtime",
    status: "confirmed",
    purpose:
      "Tool contract and dispatch/approval seams: declarative ToolDescriptor definitions, before-tool-call approval hook, and per-tool implementations under src/agents/tools.",
    responsibilities:
      "Tool contract typing, tool-name normalization/policy, before-tool-call approval evaluation, tool-result-error classification, individual tool implementations (ask-user, agents-list, agents-wait, sessions-spawn, etc.).",
    nonResponsibilities:
      "Does not itself decide provider-specific tool-schema wire format (that is packages/ai/src/providers/anthropic-tool-projection.ts and OpenAI-family equivalents).",
    publicSurface:
      "ToolDescriptor (src/tools/types.ts); before-tool-call hooks under src/agents/agent-tools.before-tool-call*.ts.",
    runtimeBehavior:
      "A provider tool-call event is normalized, matched against the registered ToolDescriptor, run through the before-tool-call approval hook, executed, and its result appended to the continuation -- exact step-by-step evidence for this flow is incomplete this pass (see open_questions).",
    extractionRelevance:
      "high -- the declarative ToolDescriptor/availability-expression contract is a clean, reusable design for a standalone gateway's Tool Runtime.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "src/tools/types.ts", role: "interface" },
      { fileKey: "src/agents/tools/agent-step.ts", role: "implementation" },
      { fileKey: "src/agents/tools/ask-user-tool.ts", role: "implementation" },
      { fileKey: "src/agents/agent-tools.before-tool-call.approval.ts", role: "policy" },
      { fileKey: "src/agents/agent-tools.before-tool-call.diagnostics.ts", role: "helper" },
      { fileKey: "src/agents/agent-tools.abort.ts", role: "implementation" },
      { fileKey: "src/agents/agent-tool-definition-adapter.ts", role: "adapter" },
      { fileKey: "src/agents/tool-policy.ts", role: "policy" },
      { fileKey: "src/agents/tool-result-error.ts", role: "implementation" },
      { fileKey: "src/agents/tool-loop-detection-config.ts", role: "policy" },
      { fileKey: "src/agents/cli-runner/tool-policy.ts", role: "policy" },
      { fileKey: "src/agents/tools/agents-list-tool.ts", role: "implementation" },
      { fileKey: "src/agents/tools/agents-wait-tool.ts", role: "implementation" },
      { fileKey: "src/agents/tools/sessions-spawn-tool.ts", role: "implementation" },
      { fileKey: "packages/ai/src/providers/anthropic-tool-projection.ts", role: "adapter" },
    ],
  },
  {
    name: "sub-agent-delegation",
    rootPath: "src/agents",
    category: "agent-runtime",
    status: "confirmed",
    purpose:
      "ACP (Agent Client Protocol)-based sub-agent spawn/delegation: lets a run launch and supervise a child agent session and observe its event stream.",
    responsibilities:
      "Spawn admission, target resolution, bootstrap delivery, heartbeat, parent-side persisted view of the child's event stream.",
    nonResponsibilities:
      "Does not implement a distinct execution loop -- a spawned sub-agent runs through the same embedded-agent-runner/harness machinery as a top-level run.",
    publicSurface:
      "sessions-spawn-tool.ts (model-facing tool), acp-spawn.ts / acp-spawn-runtime.ts (implementation).",
    runtimeBehavior:
      "A model-issued sessions-spawn tool call dispatches to the ACP spawn runtime, which admits, targets, and launches a child run and persists its event stream for the parent to observe (acp_parent_stream_events table).",
    extractionRelevance:
      "medium -- the parent/child event-stream persistence pattern is a reusable idea for a gateway's sub-agent/delegated-task feature; the ACP protocol coupling itself is OpenClaw-specific.",
    extractionDifficulty: "high",
    files: [
      { fileKey: "src/agents/acp-spawn.ts", role: "entry-point" },
      { fileKey: "src/agents/acp-spawn-runtime.ts", role: "implementation" },
      { fileKey: "src/agents/acp-spawn-requester.ts", role: "implementation" },
      { fileKey: "src/agents/acp-spawn-target.ts", role: "implementation" },
      { fileKey: "src/agents/acp-spawn-admission.ts", role: "policy" },
      { fileKey: "src/agents/acp-spawn-heartbeat.ts", role: "implementation" },
      { fileKey: "src/agents/acp-spawn-bootstrap-delivery.ts", role: "implementation" },
      { fileKey: "src/agents/acp-parent-stream-store.sqlite.ts", role: "persistence" },
      { fileKey: "src/agents/tools/sessions-spawn-tool.ts", role: "entry-point" },
      { fileKey: "src/agents/tools/agents-list-tool.ts", role: "implementation" },
      { fileKey: "src/agents/tools/agents-wait-tool.ts", role: "implementation" },
    ],
  },
  {
    name: "skill-runtime",
    rootPath: "src/skills",
    category: "skills",
    status: "confirmed",
    purpose:
      "Discovers, loads, and activates Markdown-based agent skills (SKILL.md files with YAML-ish frontmatter metadata) from the bundled skills/ directory and workspace-local sources.",
    responsibilities:
      "Skill discovery, SKILL.md parsing/loading, activation/invocation policy (userInvocable / disableModelInvocation), lifecycle tracking, a proposal-based workshop for authoring/modifying skills.",
    nonResponsibilities:
      "Does not implement the tools a skill may expose beyond the shared tool-runtime contract.",
    publicSurface:
      "OpenClawSkillMetadata / SkillInvocationPolicy / SkillCommandSpec (src/skills/types.ts); Skill (src/skills/loading/skill-contract.ts).",
    runtimeBehavior:
      "Skills are discovered from disk, parsed into a Skill record with metadata (always/skillKey/primaryEnv/requires/install), and either always-on or invoked by name; the exact prompt-injection and tool-exposure mechanics were not verified line-by-line this pass (see open_questions).",
    extractionRelevance:
      "medium -- the SKILL.md-as-contract pattern is portable, but discovery/lifecycle is wired into OpenClaw's shared-state DB (skill_usage, skill_lifecycle tables).",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "src/skills/types.ts", role: "interface" },
      { fileKey: "src/skills/loading/skill-contract.ts", role: "interface" },
      { fileKey: "src/skills/discovery", role: "implementation" },
      { fileKey: "src/skills/loading", role: "implementation" },
      { fileKey: "src/skills/runtime", role: "implementation" },
      { fileKey: "src/skills/lifecycle", role: "implementation" },
      { fileKey: "src/skills/security", role: "policy" },
      { fileKey: "src/skills/config", role: "implementation" },
      { fileKey: "src/skills/workshop", role: "implementation" },
    ],
  },
  {
    name: "memory-context-engine",
    rootPath: "src/context-engine",
    category: "memory",
    status: "confirmed",
    purpose:
      "Pluggable context-management engine registry (compaction/summarization strategy) plus the embedded runner's compaction pipeline and the per-agent SQLite semantic-memory index.",
    responsibilities:
      "Context-engine selection (legacy vs. plugin-provided), runtime-settings construction (token budgets, degraded/fallback reasons), compaction triggering and checkpointing around a compaction boundary, semantic memory index tables (memory_index_meta/sources/chunks/chunk_provenance, memory_embedding_cache).",
    nonResponsibilities:
      "Does not own raw conversation-history storage (that is the session-persistence module's transcript_events/session_nodes tables).",
    publicSurface:
      "resolveContextEngine/resolveContextEngineOwnerPluginId (registry.ts); buildContextEngineRuntimeSettings (runtime-settings.ts).",
    runtimeBehavior:
      "The run loop resolves a context engine once per run and reuses it across retries; compact.ts and compaction-checkpoint.ts run when a compaction trigger fires, producing a session-summary-style compacted state before the loop continues.",
    extractionRelevance:
      "medium -- the registry/pluggable-engine pattern is reusable; exact compaction algorithm not verified line-by-line this pass.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "src/context-engine/registry.ts", role: "registry" },
      { fileKey: "src/context-engine/init.ts", role: "implementation" },
      { fileKey: "src/context-engine/runtime-settings.ts", role: "implementation" },
      { fileKey: "src/context-engine/host-compat.ts", role: "interface" },
      { fileKey: "src/context-engine/types.ts", role: "interface" },
      { fileKey: "src/context-engine/legacy.ts", role: "implementation" },
      { fileKey: "src/context-engine/delegate.ts", role: "implementation" },
      { fileKey: "src/context-engine/quarantine-health.ts", role: "implementation" },
      { fileKey: "src/memory/root-memory-files.ts", role: "implementation" },
      { fileKey: "src/agents/embedded-agent-runner/compact.ts", role: "implementation" },
      { fileKey: "src/agents/embedded-agent-runner/compact-reasons.ts", role: "implementation" },
      { fileKey: "src/agents/embedded-agent-runner/compaction-checkpoint.ts", role: "persistence" },
      {
        fileKey: "src/agents/embedded-agent-runner/compaction-runtime-context.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/context-engine-maintenance.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/compaction-runtime.ts",
        role: "implementation",
      },
      {
        fileKey: "src/agents/embedded-agent-runner/run/context-recovery-state.ts",
        role: "implementation",
      },
    ],
  },
  {
    name: "session-persistence",
    rootPath: "src/state",
    category: "persistence",
    status: "confirmed",
    purpose:
      "Canonical SQLite-backed durable state: a shared state DB (state/openclaw.sqlite) and a per-agent DB (agents/<agentId>/agent/openclaw-agent.sqlite), each with Kysely-typed schemas.",
    responsibilities:
      "Session/conversation/transcript persistence (session_nodes, session_windows, conversations, transcript_events, trajectory_runtime_events), lease-based concurrency (state_leases), auth-profile storage, diagnostic/audit event logging, skill usage/lifecycle tracking, semantic memory index tables.",
    nonResponsibilities:
      "Does not run any agent logic itself; pure storage layer plus lease primitives.",
    publicSurface:
      "src/state/openclaw-state-schema.sql / openclaw-agent-schema.sql (DDL); openclaw-state-db.ts / openclaw-agent-db.ts (access); openclaw-state-lease.ts / openclaw-agent-db-lease.ts (locking).",
    runtimeBehavior:
      "Every run/session read or write goes through a Kysely-typed accessor over one of these two SQLite files; leases (state_leases) serialize access to shared mutable rows across processes.",
    extractionRelevance:
      "high -- the schema and lease pattern are a strong direct model for a standalone gateway's run/session/event persistence, modulo OpenClaw-specific tables (skills, boards, device pairing).",
    extractionDifficulty: "low",
    files: [
      { fileKey: "src/state/openclaw-state-schema.sql", role: "schema" },
      { fileKey: "src/state/openclaw-agent-schema.sql", role: "schema" },
      { fileKey: "src/state/openclaw-state-schema.generated.ts", role: "interface" },
      { fileKey: "src/state/openclaw-agent-schema.generated.ts", role: "interface" },
      { fileKey: "src/state/openclaw-state-db.ts", role: "persistence" },
      { fileKey: "src/state/openclaw-state-lease.ts", role: "policy" },
      { fileKey: "src/state/openclaw-agent-db.ts", role: "persistence" },
      { fileKey: "src/state/openclaw-agent-db-lease.ts", role: "policy" },
      { fileKey: "src/state/openclaw-agent-db-registry.ts", role: "registry" },
      { fileKey: "src/state/openclaw-agent-db-schema.ts", role: "implementation" },
      { fileKey: "src/state/openclaw-agent-db-session-migrations.ts", role: "implementation" },
      { fileKey: "src/state/openclaw-database-preflight.ts", role: "implementation" },
      { fileKey: "src/state/agent-deletion-journal.ts", role: "persistence" },
      { fileKey: "src/agents/session-suspension.ts", role: "implementation" },
      { fileKey: "src/agents/run-session-target.ts", role: "implementation" },
    ],
  },
  {
    name: "long-running-jobs",
    rootPath: "src/cron",
    category: "long-running",
    status: "confirmed",
    purpose:
      "Scheduled/background job execution distinct from an interactive agent run: cron-style jobs with active-job tracking, command execution, delivery of results, and heartbeat monitoring.",
    responsibilities:
      "Job scheduling/tracking, command execution, result delivery to a target channel, heartbeat/liveness monitoring for long-running jobs.",
    nonResponsibilities:
      "Does not itself implement the agent loop -- a scheduled job likely invokes the same embedded-agent-runner entry point as an interactive run (not verified line-by-line this pass).",
    publicSurface: "src/cron/active-jobs.ts.",
    runtimeBehavior:
      "Not fully traced this pass; classified from file names and the state_leases/state DB pattern shared with the rest of the runtime.",
    extractionRelevance:
      "medium -- a standalone gateway's Job Runtime would need an equivalent scheduler, but this module's exact durability guarantees were not verified.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "src/cron/active-jobs.ts", role: "implementation" },
      { fileKey: "src/cron/command-runner.ts", role: "implementation" },
      { fileKey: "src/cron/delivery.ts", role: "implementation" },
      { fileKey: "src/cron/heartbeat-monitor.ts", role: "implementation" },
      { fileKey: "src/cron/heartbeat-policy.ts", role: "policy" },
    ],
  },
  {
    name: "auth-and-secrets",
    rootPath: "src/secrets",
    category: "authentication",
    status: "confirmed",
    purpose:
      "Generic secret/credential application, auditing, and configuration, alongside the provider-agnostic OAuth helpers in src/llm/utils/oauth.",
    responsibilities:
      "Applying resolved secrets into runtime config, auditing secret access, scanning configured auth profiles, interactive secret configuration.",
    nonResponsibilities:
      "Does not implement any single provider's OAuth flow itself (those live in src/llm/utils/oauth/*.ts and packages/ai/src/utils/oauth/*.ts).",
    publicSurface: "src/secrets/apply.ts, src/secrets/configure.ts.",
    runtimeBehavior:
      "Not fully traced this pass; the SecretRef fail-closed/degraded-owner semantics described in root AGENTS.md were not located and verified in source during this pass (see open_questions).",
    extractionRelevance:
      "medium -- the OAuth helpers (src/llm/utils/oauth) are directly reusable; the SecretRef/credential-application layer is more OpenClaw-config-specific.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "src/secrets/apply.ts", role: "implementation" },
      { fileKey: "src/secrets/audit.ts", role: "implementation" },
      { fileKey: "src/secrets/auth-profiles-scan.ts", role: "implementation" },
      { fileKey: "src/secrets/configure.ts", role: "implementation" },
      { fileKey: "src/secrets/plan.ts", role: "implementation" },
      { fileKey: "src/llm/utils/oauth/index.ts", role: "implementation" },
      { fileKey: "src/llm/utils/oauth/types.ts", role: "interface" },
      { fileKey: "src/llm/utils/oauth/anthropic.ts", role: "adapter" },
      { fileKey: "src/llm/utils/oauth/openai-chatgpt.ts", role: "adapter" },
      { fileKey: "src/llm/utils/oauth/github-copilot.ts", role: "adapter" },
      { fileKey: "src/llm/utils/oauth/abort.ts", role: "helper" },
      { fileKey: "packages/ai/src/utils/oauth/openai-chatgpt-jwt.ts", role: "helper" },
      { fileKey: "packages/ai/src/providers/anthropic-auth-headers.ts", role: "adapter" },
      { fileKey: "packages/ai/src/env-api-keys.ts", role: "helper" },
    ],
  },
  {
    name: "memory-core-semantic-index",
    rootPath: "extensions/memory-core",
    category: "memory",
    status: "confirmed",
    purpose:
      "Resolves the 'what writes/reads the semantic memory index' open question. A bundled plugin (@openclaw/memory-core) that owns the full semantic-memory pipeline: chunking, embedding, embedding-cache reuse, vector-table writes, and embedding/keyword retrieval, exposed to the model as two tools (memory_search, memory_get) rather than auto-injected content.",
    responsibilities:
      "Writing memory_index_chunks/memory_index_chunks_vec/memory_embedding_cache (MemoryManagerEmbeddingOps.writeChunks, replaceMemoryVectorRow, upsertMemoryEmbeddingCache); reading them for retrieval (MemoryIndexManager.search -> searchVector/searchKeyword); registering memory_search/memory_get tools and a promptBuilder (buildPromptSection) that injects only tool-usage guidance, never chunk content.",
    nonResponsibilities:
      "Does not handle generic conversation-history/transcript persistence for ordinary multi-turn prompt construction (that is transcript_events/session_nodes, owned elsewhere -- see the 'memory write' capability, still not fully traced).",
    publicSurface:
      "extensions/memory-core/index.ts (plugin entry): api.registerMemoryCapability, api.registerTool for memory_search/memory_get.",
    runtimeBehavior:
      "On indexing: MemoryManagerEmbeddingOps.writeChunks runs inside one sync transaction per file, clearing prior rows for that path/source then upserting each chunk plus its vector embedding, reusing cached embeddings by content hash when available. On retrieval: the model calls memory_search/memory_get itself (prompted to do so by buildPromptSection's guidance text); MemoryIndexManager.search dispatches to embedding-similarity (searchVector) and/or FTS (searchKeyword) queries.",
    extractionRelevance:
      "medium -- a standalone gateway extracting Skills-style lazy tool-mediated context loading (already documented for the Skills subsystem) would find this a second, independent confirmation of the same design pattern applied to long-term memory; the SQLite chunk/vector/cache schema is a reusable reference shape.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "extensions/memory-core/index.ts", role: "entry-point" },
      { fileKey: "extensions/memory-core/src/prompt-section.ts", role: "policy" },
      { fileKey: "extensions/memory-core/src/memory/manager.ts", role: "orchestrator" },
      {
        fileKey: "extensions/memory-core/src/memory/manager-embedding-ops.ts",
        role: "implementation",
      },
      {
        fileKey: "extensions/memory-core/src/memory/manager-vector-write.ts",
        role: "implementation",
      },
      {
        fileKey: "extensions/memory-core/src/memory/manager-embedding-cache.ts",
        role: "implementation",
      },
      { fileKey: "extensions/memory-core/src/memory/manager-search.ts", role: "implementation" },
    ],
  },
];
