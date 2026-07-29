# Open Questions

Generated from the `open_questions` table in `catalog.sqlite`. Do not
hand-edit; run `npm run generate-reports` (inside `cli/`) after changing
seed data. Query live with:

```bash
node cli/dist/cli.js search "<topic>" --json
```

or `SELECT * FROM unresolved_high_priority;` directly against `catalog.sqlite`.

## Summary

| Priority | Count |
| --- | --- |
| high | 5 |
| medium | 2 |
| low | 5 |

## [high] What is the exact discriminated-union type and full set of tag values for the internal agent-run event model (the AssistantMessageEventStreamContract's event payloads)?

- **Category:** events
- **Status:** resolved
- **Evidence inspected:** RESOLVED in a follow-up pass: packages/ai/src/types.ts turned out to be a 2-line re-export of @openclaw/llm-core (`export * from "@openclaw/llm-core"`). Read packages/llm-core/src/types.ts (691 lines) in full. The `AssistantMessageEvent` union (lines 397-418) has exactly 12 variants: start, text_start, text_delta, text_end, thinking_start, thinking_delta, thinking_end, toolcall_start, toolcall_delta, toolcall_end, done, error. See the events table for the full per-variant field list, and the `llm-core-foundation` module/finding for the architectural implication (a THIRD standalone package, more foundational than packages/ai).
- **Why unresolved:** N/A -- resolved.
- **Likely interpretation:** N/A -- resolved with direct evidence.
- **How to verify:** N/A -- resolved.

## [high] What does packages/gateway-protocol/ define, and how does it relate to the AssistantMessageEventStreamContract event model?

- **Category:** gateway-protocol
- **Status:** resolved
- **Evidence inspected:** RESOLVED in a follow-up pass: read packages/gateway-protocol/README.md and src/schema/agent.ts (398 lines) in full, plus src/infra/agent-events.ts (745 lines) in full. gateway-protocol is a standalone TypeBox schema/validator package for the Gateway WebSocket wire protocol (version 4). Its AgentEventSchema is a generic stream-event envelope (runId/seq/stream/ts/data) with `data` deliberately left as Type.Unknown() -- by explicit README design, ~60 fields including every event `data` payload are intentionally open passthroughs. src/infra/agent-events.ts independently defines the internal AgentEventPayload producer (emitAgentEvent), structurally matching but not type-linked to gateway-protocol. The embedded runner's emitAssistantStreamDataSafely (src/agents/embedded-agent-subscribe.ts:279-304) is the exact bridge point where a normalized AssistantMessageEvent becomes an emitAgentEvent({ stream: "assistant", data }) call. See the gateway-wire-protocol module/finding for the full three-layer picture.
- **Why unresolved:** N/A -- resolved.
- **Likely interpretation:** N/A -- resolved with direct evidence.
- **How to verify:** N/A -- resolved.

## [high] Does a scheduled cron job execute through the same runEmbeddedAgent entry point as an interactive run, or a separate execution path?

- **Category:** long-running-execution
- **Status:** open
- **Evidence inspected:** src/cron/active-jobs.ts and command-runner.ts confirmed to exist; not opened this pass.
- **Why unresolved:** Deprioritized in favor of confirming the interactive agent-loop and provider architecture given constrained research time.
- **Likely interpretation:** Likely the same entry point, given root AGENTS.md's emphasis on one canonical execution path per concept, but not confirmed.
- **How to verify:** Read src/cron/command-runner.ts and grep for 'runEmbeddedAgent' or 'runAgentHarnessLifecycleAttempt' call sites within src/cron/.

## [high] Can an interrupted embedded run (process crash mid-turn, not a CLI-backend session) be resumed after restart, and if so, from what durable state?

- **Category:** long-running-execution
- **Status:** open
- **Evidence inspected:** session_nodes/session_windows/transcript_events confirm conversation-level durability; whether an in-flight (uncompleted) attempt's partial state is itself resumable, versus the run simply restarting from the last persisted turn, was not confirmed.
- **Why unresolved:** Not traced this pass.
- **Likely interpretation:** Most likely: no true mid-attempt resume for the embedded path -- a restart resumes the *session* (conversation history) but re-issues a fresh attempt/turn, not a fresh continuation of a half-finished provider stream. This differs from Codex/Claude CLI-backend sessions, which do have explicit 'continue' logic at the session-catalog level.
- **How to verify:** Read src/state/openclaw-agent-db-session-migrations.ts and search for any 'resume' or 'recover' logic tied to an in-flight (not-yet-terminal) run row.

## [high] What module writes to and reads from the semantic memory index tables (memory_index_chunks, memory_embedding_cache)?

- **Category:** memory
- **Status:** open
- **Evidence inspected:** Table names confirmed via schema grep only; no module matching an obvious 'memory-index'/'embedding' name was located under src/memory (which contains only root-memory-files.ts) or src/agents this pass.
- **Why unresolved:** Not searched with broader patterns (e.g. 'embedding', 'memory_index') due to time constraints.
- **Likely interpretation:** Likely lives under a plugin (memory-related bundled extension) rather than src/memory, given how thin src/memory itself is.
- **How to verify:** grep -rln 'memory_index_chunks\|memory_embedding_cache' --include=*.ts, then read the matching module(s).

## [low] What is the exact SecretRef resolution mechanism (type definition and resolver function) described in root AGENTS.md, and where does it live?

- **Category:** authentication
- **Status:** resolved
- **Evidence inspected:** RESOLVED in a follow-up pass: src/config/types.secrets.ts (read in full, 354 lines) defines SecretRef/SecretInput/SecretProviderConfig and the coerce/resolve-to-status layer (coerceSecretRef, resolveSecretInputString, UnresolvedSecretInputError). src/secrets/resolve.ts (read lines 820-899) defines the runtime provider-dispatching resolvers (resolveSecretRefValue, resolveSecretRefValues, resolveSecretRefValuesSettledByProvider), including the explicit 'owner-isolation' settled-by-provider variant.
- **Why unresolved:** N/A -- resolved.
- **Likely interpretation:** N/A -- resolved with direct evidence.
- **How to verify:** Remaining depth gap: the actual env/file/exec provider-dispatch branch inside resolve.ts's ~820 lines before line 820 was not read line-by-line.

## [medium] Is provider OAuth token refresh triggered lazily (on-401) only, or also via a background scheduler?

- **Category:** authentication
- **Status:** open
- **Evidence inspected:** run-loop.ts references stopRuntimeAuthRefreshTimer, implying a timer exists, but the timer's creation site was not located/read this pass.
- **Why unresolved:** The timer's creation site (likely in run/runtime-preparation.ts's prepareEmbeddedRunRuntime) was not opened this pass.
- **Likely interpretation:** Probably both: a background timer refreshes proactively before expiry, with a lazy on-error refresh as a fallback for the run loop.
- **How to verify:** Read src/agents/embedded-agent-runner/run/runtime-preparation.ts in full and trace stopRuntimeAuthRefreshTimer back to its creation.

## [low] Exactly how is a skill's SKILL.md content injected into the model's prompt -- fully upfront, or lazily via a tool call the model issues?

- **Category:** skills
- **Status:** resolved
- **Evidence inspected:** RESOLVED in a follow-up pass: formatSkillsForPrompt (src/skills/loading/skill-contract.ts:38-65, read in full) confirms only a compact catalog entry (name/description/location/version) is injected; the prompt text explicitly instructs the model to use its own read tool to load the full SKILL.md when the task matches the description.
- **Why unresolved:** N/A -- resolved.
- **Likely interpretation:** N/A -- resolved with direct evidence.
- **How to verify:** Remaining depth gap: the exact call site that assembles the list of Skill records passed into formatSkillsForPrompt (i.e. the discovery/filtering step before formatting) was not traced this pass.

## [low] How does model-selection of a skill work when disableModelInvocation is false -- is it description-based (model reads a catalog and chooses), rule-based, or route-based?

- **Category:** skills
- **Status:** resolved
- **Evidence inspected:** RESOLVED in a follow-up pass: formatSkillsForPrompt's injected prompt text is description-based selection -- the model is shown every eligible skill's name/description/location and told to use its read tool 'when the task matches its description.' No rule-engine or router was found; selection is left to the model's own judgment against the description text.
- **Why unresolved:** N/A -- resolved.
- **Likely interpretation:** N/A -- resolved with direct evidence.
- **How to verify:** N/A -- resolved.

## [medium] What is the exact function that dispatches a normalized provider tool-call event to a resolved ToolDescriptor's executor?

- **Category:** tool-runtime
- **Status:** resolved
- **Evidence inspected:** RESOLVED in a follow-up pass: runToolLifecycle (src/agents/embedded-agent-subscribe.ts:1436-1476) is the confirmed lifecycle-wrapping dispatcher, called from toolSearchCatalogExecutor (src/agents/embedded-agent-runner/run/attempt-stream-prepare.ts:292-330) with `execute: () => toolParams.tool.execute(toolCallId, input, signal, onUpdate)`. Both read directly.
- **Why unresolved:** N/A -- resolved, with one residual nuance below.
- **Likely interpretation:** toolSearchCatalogExecutor's name ('tool search catalog') suggests OpenClaw may have more than one tool-resolution path (e.g. a smaller always-in-context tool set vs. a larger searchable catalog); whether every tool call funnels through this exact function or whether a second, simpler direct-dispatch path also exists was not fully ruled out.
- **How to verify:** grep -rn 'runToolLifecycle' src/agents to enumerate every call site and confirm whether toolSearchCatalogExecutor is the only one.

## [low] Is a tool call's inputSchema validated with a specific library (zod, ajv, a custom JSON-Schema validator), and where?

- **Category:** tool-runtime
- **Status:** investigating
- **Evidence inspected:** RESOLVED (library identified) in a follow-up pass: both the wire-level Tool.parameters (packages/llm-core/src/types.ts:376-380, validated by ValidateToolArgumentsFn at line 691) and the runtime AgentTool/AnyAgentTool contract (src/agents/tools/common.ts, `import type { TSchema } from "typebox"`) type tool arguments as TypeBox schemas, not zod or a bespoke JSON-Schema validator. ToolDescriptor.inputSchema (src/tools/types.ts) remains a plain JsonObject, so a descriptor-to-TypeBox bridge still exists somewhere (not located).
- **Why unresolved:** The exact call site invoking ValidateToolArgumentsFn against a live ToolCall, and the ToolDescriptor.inputSchema-to-TypeBox bridge, were not located this pass.
- **Likely interpretation:** packages/llm-core/src/validation.ts (confirmed to exist, has its own validation.test.ts) almost certainly implements ValidateToolArgumentsFn.
- **How to verify:** Read packages/llm-core/src/validation.ts in full.

## [low] Is tool execution sandboxed (subprocess isolation, filesystem/network restriction), and if so, how?

- **Category:** tool-runtime
- **Status:** resolved
- **Evidence inspected:** RESOLVED in a follow-up pass: src/agents/sandbox.ts (read in full) and src/agents/sandbox/tool-policy.ts (read in full) confirm a pluggable Docker/SSH backend registry plus a per-tool allow/deny policy. src/config/types.sandbox.ts (read in full) confirms the Docker hardening surface (readOnlyRoot, capDrop, seccomp/AppArmor, resource limits, hardened bind-mount defaults). src/security/ was correctly identified as a SEPARATE thing (a configuration-hygiene auditor), not the sandbox mechanism -- so the earlier likely-interpretation guessing at exec_approvals_config as the sandbox mechanism was a red herring.
- **Why unresolved:** N/A -- resolved. See the tool-sandbox-runtime module and 'sandboxing' capability for the full picture.
- **Likely interpretation:** N/A -- resolved with direct evidence.
- **How to verify:** Remaining depth gap: docker-backend.ts, ssh-backend.ts, fs-bridge.ts, and validate-sandbox-security.ts were confirmed to exist and skimmed via exports but not read line-by-line; a future pass could read those for exact command-construction detail.

