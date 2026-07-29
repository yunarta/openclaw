# Extraction Plan (summary)

Full guidance lives in `../EXTRACTION-GUIDE.md`; this report is the database-derived quick reference.

## Extraction candidates (per `extraction_candidates` view)

- `(Anthropic OAuth module)` (constant, critical importance, low coupling) -- src/llm/utils/oauth/anthropic.ts
- `(Anthropic thinking-block replay helper)` (function, critical importance, low coupling) -- packages/ai/src/providers/anthropic-thinking-replay.ts
- `(Anthropic transport stream reader)` (function, critical importance, low coupling) -- packages/ai/src/transports/anthropic-transport-stream.ts
- `(OpenAI reasoning-effort mapper)` (function, critical importance, low coupling) -- packages/ai/src/providers/openai-reasoning-effort.ts
- `(OpenAI/ChatGPT OAuth module)` (constant, critical importance, low coupling) -- src/llm/utils/oauth/openai-chatgpt.ts
- `AgentHarness` (interface, critical importance, low coupling) -- src/agents/harness/types.ts
- `AssistantMessageEvent` (type, critical importance, low coupling) -- packages/llm-core/src/types.ts
- `ThinkingContent` (interface, critical importance, low coupling) -- packages/llm-core/src/types.ts
- `createAssistantMessageEventStream` (factory, critical importance, low coupling) -- packages/ai/src/utils/event-stream.ts
- `defaultApiRegistry` (constant, critical importance, low coupling) -- packages/ai/src/internal/runtime.ts
- `defaultLlmRuntime` (constant, critical importance, low coupling) -- packages/ai/src/internal/runtime.ts
- `isToolAllowed` (function, critical importance, low coupling) -- src/agents/sandbox/tool-policy.ts
- `registerAgentHarness` (function, critical importance, low coupling) -- src/agents/harness/registry.ts
- `registerBuiltInApiProviders` (function, critical importance, low coupling) -- packages/ai/src/providers.ts
- `resolveSecretInputString` (function, critical importance, low coupling) -- src/config/types.secrets.ts
- `stream` (function, critical importance, low coupling) -- src/llm/stream.ts
- `(ChatGPT OAuth JWT helper)` (function, high importance, low coupling) -- packages/ai/src/utils/oauth/openai-chatgpt-jwt.ts
- `(oauth.ts module)` (constant, high importance, low coupling) -- src/llm/oauth.ts
- `Tool` (interface, high importance, low coupling) -- packages/llm-core/src/types.ts
- `ValidateToolArgumentsFn` (type, high importance, low coupling) -- packages/llm-core/src/types.ts
- `coerceSecretRef` (function, high importance, low coupling) -- src/config/types.secrets.ts
- `complete` (function, high importance, low coupling) -- src/llm/stream.ts
- `getRegisteredAgentHarness` (function, high importance, low coupling) -- src/agents/harness/registry.ts
- `registerSandboxBackend` (function, high importance, low coupling) -- src/agents/sandbox/backend.ts
- `(GitHub Copilot OAuth module)` (constant, medium importance, low coupling) -- src/llm/utils/oauth/github-copilot.ts
- `completeSimple` (function, medium importance, low coupling) -- src/llm/stream.ts
- `createUsageAccumulator` (factory, medium importance, low coupling) -- src/agents/embedded-agent-runner/usage-accumulator.ts
- `listRegisteredAgentHarnesses` (function, medium importance, low coupling) -- src/agents/harness/registry.ts
- `streamSimple` (function, medium importance, low coupling) -- src/llm/stream.ts
- `disposeRegisteredAgentHarnesses` (function, low importance, low coupling) -- src/agents/harness/registry.ts
- `AnyAgentTool` (type, critical importance, medium coupling) -- src/agents/tools/common.ts
- `createEmbeddedRunLaneController` (factory, critical importance, medium coupling) -- src/agents/embedded-agent-runner/run/lane-controller.ts
- `normalizeAgentRunAttemptTerminal` (function, critical importance, medium coupling) -- src/agents/agent-run-terminal-outcome.ts
- `resolveRunFailoverDecision` (function, critical importance, medium coupling) -- src/agents/embedded-agent-runner/run/failover-policy.ts
- `AgentHarnessAttemptParams` (type, high importance, medium coupling) -- src/agents/harness/types.ts
- `AgentHarnessAttemptResult` (type, high importance, medium coupling) -- src/agents/harness/types.ts
- `resolveSandboxToolPolicyForAgent` (function, high importance, medium coupling) -- src/agents/sandbox/tool-policy.ts

## Module-level extraction relevance

| Module | Extraction relevance | Extraction difficulty | Status |
| --- | --- | --- | --- |
| ai-provider-package | critical -- explicitly designed and described by its own authors as reusable; the single best extraction candidate for a standalone gateway's Provider Router + Codex/Claude adapters. | low | confirmed |
| agent-harness-registry | high -- this is the cleanest seam for a standalone gateway's 'ProviderAdapter'/harness abstraction. | medium | confirmed |
| tool-runtime | high -- the declarative ToolDescriptor/availability-expression contract is a clean, reusable design for a standalone gateway's Tool Runtime. | medium | confirmed |
| session-persistence | high -- the schema and lease pattern are a strong direct model for a standalone gateway's run/session/event persistence, modulo OpenClaw-specific tables (skills, boards, device pairing). | low | confirmed |
| agent-runtime-core | high -- this is the closest thing to a standalone 'agent run service' loop in the repository, but it is heavily entangled with OpenClaw-specific concepts (lanes, hooks, session targets, workspace resolution). | high | confirmed |
| provider-codex | medium -- the harness-registration pattern is reusable, but the plugin's internals are tightly bound to the OpenClaw plugin SDK and its own session-catalog conventions. | medium | confirmed |
| provider-anthropic | medium -- auth/catalog patterns are reusable; the CLI-backend and native session-catalog code is OpenClaw-specific. | medium | confirmed |
| skill-runtime | medium -- the SKILL.md-as-contract pattern is portable, but discovery/lifecycle is wired into OpenClaw's shared-state DB (skill_usage, skill_lifecycle tables). | medium | confirmed |
| memory-context-engine | medium -- the registry/pluggable-engine pattern is reusable; exact compaction algorithm not verified line-by-line this pass. | medium | confirmed |
| long-running-jobs | medium -- a standalone gateway's Job Runtime would need an equivalent scheduler, but this module's exact durability guarantees were not verified. | medium | confirmed |
| sub-agent-delegation | medium -- the parent/child event-stream persistence pattern is a reusable idea for a gateway's sub-agent/delegated-task feature; the ACP protocol coupling itself is OpenClaw-specific. | high | confirmed |
| auth-and-secrets | medium -- the OAuth helpers (src/llm/utils/oauth) are directly reusable; the SecretRef/credential-application layer is more OpenClaw-config-specific. | medium | confirmed |

## Unresolved high-priority questions

- [high] Exactly how is a skill's SKILL.md content injected into the model's prompt -- fully upfront, or lazily via a tool call the model issues?
- [high] Does a scheduled cron job execute through the same runEmbeddedAgent entry point as an interactive run, or a separate execution path?
- [high] What module writes to and reads from the semantic memory index tables (memory_index_chunks, memory_embedding_cache)?
- [high] Can an interrupted embedded run (process crash mid-turn, not a CLI-backend session) be resumed after restart, and if so, from what durable state?
- [high] What is the exact discriminated-union type and full set of tag values for the internal agent-run event model (the AssistantMessageEventStreamContract's event payloads)?
- [high] What does packages/gateway-protocol/ define, and how does it relate to the AssistantMessageEventStreamContract event model?
