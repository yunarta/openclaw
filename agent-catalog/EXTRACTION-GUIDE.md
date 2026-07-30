# Extraction Guide

How to build a standalone agentic REST API gateway using what this
codebase already has, derived from the `agent-catalog.sqlite` database
(query it directly for line-level detail; this document is the narrative
summary). Everything under "Proposed" is a **design recommendation**, not
a fact about the current repository -- the repository facts are in the
database and cited by file/line wherever confirmed.

## The one fact to anchor on

`packages/ai` (published as `@openclaw/ai`) is a standalone package with
**zero dependency on OpenClaw core**, already implementing the actual
provider wire protocols (Anthropic Messages, OpenAI Responses/Completions,
Google, Azure, Bedrock, Mistral) and stream normalization. Its own
`package.json` describes it as "Reusable model provider adapters and
streaming runtime from OpenClaw." A standalone gateway's Provider Router
should be built directly on this package, not re-derived from OpenClaw's
`src/` tree.

## Target layers

### `agent-contract`

- **Responsibilities:** Shared types every other layer depends on -- run/turn/session/event/tool-call shapes.
- **Non-responsibilities:** No execution logic.
- **Source to study:** `packages/ai/src/types.ts` (Api/Model/AssistantMessage/Context), `src/agents/embedded-agent-runner/types.ts` (EmbeddedAgentRunResult, TraceAttempt), `src/agents/agent-run-terminal-outcome.ts` (terminal-outcome normalization).
- **Reusable concepts:** The `AssistantMessage` / `AssistantMessageEventStreamContract` shapes from `packages/ai` are close to what a gateway needs as its own wire contract.
- **Application-specific coupling:** Low for the `packages/ai` types; high for OpenClaw-specific fields bolted onto run params (session keys, lane ids, hook context).
- **Extraction risk:** Low.

### `agent-runtime`

- **Responsibilities:** Drive one run to completion: admit, dispatch attempts, recover/retry/fail over, resolve terminal state.
- **Non-responsibilities:** Does not itself speak any provider wire protocol.
- **Source to study:** `src/agents/harness/types.ts` (`AgentHarness` contract), `src/agents/harness/registry.ts`, `src/agents/harness/builtin-openclaw.ts`, `src/agents/embedded-agent-runner/run-orchestrator.ts`, `run-loop.ts`.
- **Reusable concepts:** The two-layer shape itself -- a pluggable harness contract, with one direct-API implementation -- is the strongest reusable idea here, even though the concrete code is OpenClaw-coupled (lanes, hooks, workspace resolution, config).
- **Application-specific coupling:** High. This layer is the most OpenClaw-specific of all of them; expect to rewrite, not port.
- **Extraction risk:** High -- `run-loop.ts` alone is ~670 lines with deep threading of retry/failover/compaction/usage state; a gateway version should be written fresh against the harness *interface*, using this code only as a reference for the state machine shape.

### `provider-codex`

- **Responsibilities:** Drive the `@openai/codex` CLI/app-server as an execution engine.
- **Non-responsibilities:** Does not implement the OpenAI wire protocol itself for this path (that's `packages/ai/src/providers/openai-responses.ts`, used by the *direct-API* path Codex-family models can also take).
- **Source to study:** `extensions/codex/index.ts` (`api.registerAgentHarness(createCodexAppServerAgentHarness(...))`), `extensions/codex/src/session-catalog*.ts`, `conversation-binding.ts`, `conversation-turn-collector.ts`.
- **Reusable concepts:** Depending on `@openai/codex` directly (pinned `0.145.0`) rather than reimplementing Codex's protocol is directly portable.
- **Application-specific coupling:** Medium -- the harness-registration pattern is generic; session-catalog conventions are OpenClaw-specific.
- **Extraction risk:** Medium.

### `provider-claude`

- **Responsibilities:** Claude/Anthropic auth, catalog, and (opt-in) CLI-backend dispatch.
- **Non-responsibilities:** Does not implement the Anthropic Messages API wire protocol (`extensions/anthropic/package.json` has no `@anthropic-ai/sdk` runtime dependency -- confirmed).
- **Source to study:** `packages/ai/src/providers/anthropic*.ts` and `packages/ai/src/transports/anthropic-transport-stream.ts` for the wire protocol; `extensions/anthropic/cli-backend.ts` and `session-catalog.ts` for the CLI-backend path.
- **Reusable concepts:** Use `packages/ai`'s Anthropic adapter directly for the default path; only build a CLI-backend equivalent if the gateway needs to support subscription-plan billing specifically.
- **Application-specific coupling:** Medium.
- **Extraction risk:** Medium.

### `tool-runtime`

- **Responsibilities:** Tool contract, registration, approval, dispatch, result normalization.
- **Non-responsibilities:** Does not decide provider-specific tool-schema wire format (that's `packages/ai/src/providers/anthropic-tool-projection.ts` and OpenAI-family equivalents).
- **Source to study:** `src/tools/types.ts` (`ToolDescriptor`, fully read this pass), `src/agents/agent-tools.before-tool-call.approval.ts`.
- **Reusable concepts:** The declarative `ToolDescriptor` contract -- owner ref (core/plugin/channel/mcp), executor ref, and a boolean `ToolAvailabilityExpression` over auth/config/env/plugin-enabled/context signals -- is a clean, portable design.
- **Application-specific coupling:** Medium; the owner/executor refs assume OpenClaw's plugin/channel/MCP taxonomy but the shape generalizes easily.
- **Extraction risk:** Medium -- the dispatcher itself was not located this pass (see `OPEN-QUESTIONS.md`); budget time to find and read it before committing to a port.

### `skill-runtime`

- **Responsibilities:** Discover, load, and activate SKILL.md-based skills.
- **Non-responsibilities:** Does not implement the tools a skill exposes beyond the shared tool-runtime contract.
- **Source to study:** `src/skills/types.ts` (fully read this pass), `src/skills/loading/skill-contract.ts`.
- **Reusable concepts:** SKILL.md + YAML-ish frontmatter (`OpenClawSkillMetadata`) is a portable, tool-agnostic format; a gateway could adopt it wholesale.
- **Application-specific coupling:** Medium -- lifecycle/telemetry hooks into OpenClaw's shared-state DB (`skill_usage`, `skill_lifecycle` tables), but the format itself is not coupled.
- **Extraction risk:** Medium -- discovery/loading/runtime internals were not read this pass.

### `memory-runtime`

- **Responsibilities:** Working memory assembly, compaction, semantic-memory retrieval.
- **Non-responsibilities:** Does not own raw conversation-history storage (session-runtime's job).
- **Source to study:** `src/context-engine/registry.ts`, `runtime-settings.ts`; `src/agents/embedded-agent-runner/compact*.ts`; the `memory_index_*` tables in `src/state/openclaw-agent-schema.sql`.
- **Reusable concepts:** A pluggable context-engine registry (multiple compaction/retrieval strategies behind one interface) is a good pattern to copy even without the exact implementation.
- **Application-specific coupling:** Medium-high; exact algorithm unverified this pass.
- **Extraction risk:** High -- too much of this layer is unverified to port with confidence yet.

### `session-runtime`

- **Responsibilities:** Session/conversation/transcript persistence, resume.
- **Non-responsibilities:** Does not run agent logic.
- **Source to study:** `src/state/openclaw-agent-schema.sql` (fully enumerated via schema grep this pass), `src/state/openclaw-agent-db-lease.ts`.
- **Reusable concepts:** The two-database split (shared state DB vs. per-agent DB) and the `state_leases` locking pattern are both strong, directly portable ideas for a gateway needing multi-process-safe session storage.
- **Application-specific coupling:** Low-medium; table names/columns are OpenClaw-flavored but the *shape* generalizes.
- **Extraction risk:** Low.

### `job-runtime`

- **Responsibilities:** Scheduled/background job execution, distinct from an interactive run.
- **Non-responsibilities:** Does not (necessarily) implement its own agent loop -- likely reuses `agent-runtime`.
- **Source to study:** `src/cron/active-jobs.ts`, `command-runner.ts`, `delivery.ts`, `heartbeat-monitor.ts`.
- **Reusable concepts:** Unconfirmed this pass -- see `OPEN-QUESTIONS.md`.
- **Application-specific coupling:** Unknown.
- **Extraction risk:** High (low confidence, not enough was read).

### `event-runtime`

- **Responsibilities:** Normalize and stream run/message/reasoning/tool events; persist them for replay/audit.
- **Non-responsibilities:** Channel-specific rendering/delivery (out of scope for this catalog entirely).
- **Source to study:** `packages/ai/src/utils/event-stream.ts` (`createAssistantMessageEventStream`), `src/llm/stream.ts`; `transcript_events` / `trajectory_runtime_events` / `audit_events` tables.
- **Reusable concepts:** `AssistantMessageEventStreamContract` as the base event contract; the split between a live agent-event stream and a separate audit/diagnostic event stream (`audit_events`/`diagnostic_events`) is worth preserving.
- **Application-specific coupling:** Low for the base contract, unknown for the full event union (not read in full this pass).
- **Extraction risk:** Medium.

### `agent-api`

- **Responsibilities:** The REST/streaming surface itself (not present in this repository -- OpenClaw exposes channels, not a generic REST API).
- **Source to study:** N/A -- this is the layer to design new, informed by everything above.
- **Extraction risk:** N/A (net-new).

## Extraction matrix

| Capability | Current source | Reusability | Coupling | Difficulty | Recommendation |
| --- | --- | ---: | ---: | ---: | --- |
| Provider wire protocols (Anthropic, OpenAI, Google, ...) | `packages/ai` | high | low | low | Depend on `@openclaw/ai` directly. |
| Stream/event normalization | `packages/ai/src/utils/event-stream.ts`, `src/llm/stream.ts` | high | low | low | Reuse `AssistantMessageEventStreamContract`; write a thin gateway-specific host-policy facade like `src/llm/stream.ts`. |
| Harness/adapter contract | `src/agents/harness/types.ts` | high | low | low | Model `ProviderAdapter` directly on `AgentHarness`. |
| Codex integration | `extensions/codex/` | medium | medium | medium | Keep the "depend on `@openai/codex`, register a harness" pattern; drop OpenClaw-specific session-catalog conventions. |
| Claude integration | `extensions/anthropic/` + `packages/ai` | medium | medium | medium | Use `packages/ai`'s Anthropic adapter as the default path; treat the CLI-backend fork as optional. |
| Tool contract | `src/tools/types.ts` | high | medium | medium | Port `ToolDescriptor` largely as-is; simplify owner/executor refs to the gateway's own extension model. |
| Tool dispatch/approval | `src/agents/agent-tools.before-tool-call.approval.ts` + unlocated dispatcher | unknown | unknown | unknown | Read the dispatcher before committing to a design (see open question). |
| Skill format | `src/skills/types.ts` | high | medium | medium | Port `SKILL.md` + frontmatter format as-is. |
| Session/transcript persistence | `src/state/openclaw-agent-schema.sql` | high | low | low | Port the shared-DB/per-agent-DB split and lease pattern. |
| Compaction/memory | `src/context-engine/`, `compact*.ts` | medium | medium | high | Design fresh; use the pluggable-registry *pattern* only. |
| Long-running jobs | `src/cron/` | unknown | unknown | high | Not enough verified to reuse directly; design fresh informed by the active-jobs/heartbeat naming. |
| Sub-agent delegation | `src/agents/acp-spawn*.ts` | medium | high | high | Reuse the "persist the parent's view of the child's event stream" idea; the ACP protocol coupling itself is not portable. |

## Proposed gateway contracts

These interfaces are informed by, but not identical to, what this
repository does. They are **recommendations**, marked as such.

```ts
// Proposed -- not present in the repository as-is.
interface AgentRuntime {
  createRun(input: CreateRunInput): Promise<Run>;
  streamRun(runId: string): AsyncIterable<AgentEvent>;
  resumeRun(runId: string, input?: ResumeInput): Promise<Run>;
  cancelRun(runId: string): Promise<void>;
}
```

Modeled on `runEmbeddedAgent` (create) + `AssistantMessageEventStreamContract`
(stream) + the (unconfirmed) session-catalog "continue" pattern (resume) +
`laneTaskAbortController.abort()` (cancel).

```ts
// Proposed. Modeled directly on src/agents/harness/types.ts's AgentHarness.
interface ProviderAdapter {
  createResponse(input: ProviderRequest): AsyncIterable<ProviderEvent>;
  resumeResponse(continuation: ProviderContinuation, input: ProviderRequest): AsyncIterable<ProviderEvent>;
  cancel(requestId: string): Promise<void>;
}
```

```ts
// Proposed. Modeled on src/tools/types.ts's ToolDescriptor + the (unconfirmed) dispatcher.
interface ToolRuntime {
  register(tool: AgentTool): void;
  execute(call: ToolCall, context: ToolContext): Promise<ToolResult>;
}
```

```ts
// Proposed. No single confirmed source -- modeled on the memory_systems catalog table's category taxonomy.
interface MemoryRuntime {
  write(records: MemoryRecord[]): Promise<void>;
  search(query: MemoryQuery): Promise<MemoryResult[]>;
  buildContext(input: MemoryContextInput): Promise<MemoryContext>;
}
```

```ts
// Proposed. Modeled on state_leases + compaction-checkpoint.ts, neither of which
// exposes exactly this shape today -- treat as a target, not a port.
interface JobRuntime {
  checkpoint(runId: string, state: RunState): Promise<void>;
  restore(runId: string): Promise<RunState | null>;
  acquireLease(runId: string): Promise<Lease>;
  releaseLease(lease: Lease): Promise<void>;
}
```

## Security constraints to carry forward

- Tool approval is a real gate in this codebase (`agent-tools.before-tool-call.approval.ts`, `exec_approvals_config` table) -- do not ship a gateway that executes tools without an equivalent gate.
- Credentials: this codebase never logs raw tokens; the catalog itself redacts any secret-shaped content in snippets (`<ACCESS_TOKEN>` etc. convention). Keep that discipline in the gateway's own logging.
- The lease pattern (`state_leases`) exists specifically to prevent two processes from concurrently mutating the same session -- a REST gateway that allows concurrent requests against one session needs an equivalent.

## REST/streaming design notes

- `AssistantMessageEventStreamContract` already models "push events, then end" -- a natural fit for SSE. WebSocket would need an explicit envelope (unconfirmed whether `packages/gateway-protocol/` already defines one -- see `OPEN-QUESTIONS.md`).
- Persisted event tables (`transcript_events`, `trajectory_runtime_events`, `acp_parent_stream_events`) suggest a REST gateway's `GET /runs/:id/events` with Last-Event-ID-style replay is buildable directly on an equivalent table, not just a live pub/sub.
- Idempotency: run/session ids are already central to this codebase's design; reuse the same id as an idempotency key for `POST /runs`.

## Minimal viable gateway

1. `agent-contract` + `event-runtime` base types (low risk, port directly).
2. `provider-claude` and `provider-codex` built directly on `@openclaw/ai` for the default path (low-medium risk).
3. A from-scratch, deliberately simple `agent-runtime` implementing just `AgentRuntime.createRun`/`streamRun` (no failover/compaction/lanes yet) against the `ProviderAdapter` interface.
4. `session-runtime` on SQLite, copying the shared-DB/per-agent-DB split and lease pattern.
5. `tool-runtime` with a minimal `ToolDescriptor` subset (skip MCP/channel owner kinds initially).

Add `memory-runtime`, `skill-runtime`, `job-runtime`, and sub-agent
delegation only after the above is proven, per the risk/confidence levels
in the extraction matrix above.
