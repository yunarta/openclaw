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
| high | 9 |
| medium | 3 |
| low | 0 |

## [high] What is the exact SecretRef resolution mechanism (type definition and resolver function) described in root AGENTS.md, and where does it live?

- **Category:** authentication
- **Status:** open
- **Evidence inspected:** Searched for 'SecretRef' conceptually via root AGENTS.md description only; did not grep/read src/secrets/*.ts or src/plugin-sdk/*.ts for the actual type this pass.
- **Why unresolved:** Time/resource-constrained research pass prioritized the agent loop, provider architecture, and persistence schema over this specific mechanism.
- **Likely interpretation:** Likely a discriminated-union type in src/secrets/ or src/plugin-sdk/ with a resolver that turns a {provider, kind, ref} tuple into a live credential value, given the 'fail-closed on unknown ownership' semantics described in root AGENTS.md.
- **How to verify:** grep -rn 'SecretRef' src/secrets src/plugin-sdk, then read the resolver function and its call sites.

## [high] What is the exact discriminated-union type and full set of tag values for the internal agent-run event model (the AssistantMessageEventStreamContract's event payloads)?

- **Category:** events
- **Status:** open
- **Evidence inspected:** Confirmed the type name (AssistantMessageEventStreamContract) and the factory (createAssistantMessageEventStream) via src/llm/stream.ts; confirmed one concrete event shape ({ type: "error", reason: "error", error: AssistantMessage }) from the same file's error-handling branch. The full event union (text-delta, reasoning-delta, tool-call-*, usage-update, etc.) was not read from packages/ai/src/types.ts this pass.
- **Why unresolved:** Deprioritized after the subagent failures in favor of confirming the loop/provider architecture first.
- **Likely interpretation:** packages/ai/src/types.ts almost certainly contains the full event union, given it's the package's own canonical type file.
- **How to verify:** Read packages/ai/src/types.ts in full and enumerate every event/tag value.

## [high] What does packages/gateway-protocol/ define, and how does it relate to the AssistantMessageEventStreamContract event model?

- **Category:** gateway-protocol
- **Status:** open
- **Evidence inspected:** Not opened this pass at all -- packages/gateway-protocol was named in the task brief as a scoped guide location but was not investigated during this research pass.
- **Why unresolved:** Time/resource constraint after the subagent failures; this was assigned to the 'events, streaming, gateway protocol' research thread which did not complete.
- **Likely interpretation:** Likely a client<->gateway RPC/message envelope schema (WebSocket or SSE transport) that wraps or references the same underlying agent-run events for delivery to external clients (channels, control UI).
- **How to verify:** Read packages/gateway-protocol/package.json and its src/index.ts or equivalent entry file.

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

## [high] Exactly how is a skill's SKILL.md content injected into the model's prompt -- fully upfront, or lazily via a tool call the model issues?

- **Category:** skills
- **Status:** open
- **Evidence inspected:** src/skills/types.ts's SkillUsagePath.readPath field ('Path visible to the tool runtime when it reads SKILL.md') suggests lazy, tool-mediated reads rather than eager full-content injection, but this is inferred from a field comment, not confirmed by reading the loader/runtime code.
- **Why unresolved:** src/skills/loading and src/skills/runtime subdirectories were confirmed to exist but not opened this pass.
- **Likely interpretation:** Likely a hybrid: a short skill index/description is always in context (for model-selection), with the full SKILL.md body fetched on demand via a tool when the skill is actually invoked -- consistent with the 'Skill' tool pattern referenced in root AGENTS.md ('Skills own workflows').
- **How to verify:** Read src/skills/loading/*.ts and src/skills/runtime/*.ts in full, and find the model-facing tool (if any) that reads a SKILL.md body on demand.

## [high] What is the exact function that dispatches a normalized provider tool-call event to a resolved ToolDescriptor's executor?

- **Category:** tool-runtime
- **Status:** open
- **Evidence inspected:** Searched src/agents for dispatchToolCall/executeToolCall/runTool/invokeTool export patterns; no match found with the patterns tried. src/agents/tools/agent-step.ts is a strong candidate by name but was not opened this pass.
- **Why unresolved:** Research budget was reallocated to the agent loop, provider architecture, and persistence schema after early subagent research failures (account spend limit); this symbol was not personally verified before the pivot to writing the catalog.
- **Likely interpretation:** Likely src/agents/tools/agent-step.ts or a sibling file in src/agents/embedded-agent-runner/run/ (e.g. attempt-tool-construction-plan.ts, attempt-tool-catalog.ts, attempt-client-tools.ts -- all confirmed to exist by directory listing).
- **How to verify:** Read src/agents/tools/agent-step.ts and src/agents/embedded-agent-runner/run/attempt-tool-construction-plan.ts in full; grep for where the tool-call event's `name` field is looked up against the tool registry.

## [high] Is tool execution sandboxed (subprocess isolation, filesystem/network restriction), and if so, how?

- **Category:** tool-runtime
- **Status:** open
- **Evidence inspected:** src/security/ directory exists at the repo root (confirmed via initial top-level listing) but was not opened this pass.
- **Why unresolved:** Not traced this pass.
- **Likely interpretation:** Likely partial: shell/exec-family tools probably run through an exec-approval/sandbox policy (exec_approvals_config table confirmed in src/state/openclaw-state-schema.sql), while most tools run in-process with no OS-level sandbox.
- **How to verify:** Read src/security/*.ts and cross-reference the exec_approvals_config table's writer/reader symbols.

## [medium] Is provider OAuth token refresh triggered lazily (on-401) only, or also via a background scheduler?

- **Category:** authentication
- **Status:** open
- **Evidence inspected:** run-loop.ts references stopRuntimeAuthRefreshTimer, implying a timer exists, but the timer's creation site was not located/read this pass.
- **Why unresolved:** The timer's creation site (likely in run/runtime-preparation.ts's prepareEmbeddedRunRuntime) was not opened this pass.
- **Likely interpretation:** Probably both: a background timer refreshes proactively before expiry, with a lazy on-error refresh as a fallback for the run loop.
- **How to verify:** Read src/agents/embedded-agent-runner/run/runtime-preparation.ts in full and trace stopRuntimeAuthRefreshTimer back to its creation.

## [medium] How does model-selection of a skill work when disableModelInvocation is false -- is it description-based (model reads a catalog and chooses), rule-based, or route-based?

- **Category:** skills
- **Status:** open
- **Evidence inspected:** Not traced this pass.
- **Why unresolved:** src/skills/discovery was confirmed to exist but not opened.
- **Likely interpretation:** Likely description-based: a compact per-skill description is included in the system prompt or a dedicated Skill tool's own description, and the model chooses by issuing a tool call naming the skill.
- **How to verify:** Read src/skills/discovery/*.ts and search for where skill descriptions are assembled into a prompt or tool schema.

## [medium] Is a tool call's inputSchema validated with a specific library (zod, ajv, a custom JSON-Schema validator), and where?

- **Category:** tool-runtime
- **Status:** open
- **Evidence inspected:** ToolDescriptor.inputSchema is typed as JsonObject (a plain JSON-Schema-shaped object), not a zod schema, suggesting validation happens via a generic JSON-Schema validator rather than zod inference -- but this is inferred, not confirmed by reading a validator call site.
- **Why unresolved:** Not traced this pass.
- **Likely interpretation:** A shared JSON-Schema validation helper somewhere under src/tools or src/plugin-sdk.
- **How to verify:** grep -rn 'inputSchema' src/agents src/tools src/plugin-sdk for the validation call site.

