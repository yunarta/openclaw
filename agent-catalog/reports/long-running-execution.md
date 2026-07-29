# Long-Running Execution

## Long-running jobs

**Status:** confirmed  **Category:** long-running  **Maturity:** production

Scheduled/background jobs (src/cron/) are a distinct concept from an interactive multi-turn agent run, with their own active-job tracking, command execution, delivery, and heartbeat monitoring.

> RESOLVED in a follow-up pass: src/cron/isolated-agent/run-executor.ts's executeCronRun branches on whether the resolved provider is CLI-backed (runCliAgent, the same opt-in subscription-auth fork interactive CLI-backend runs use) or embedded -- in which case it calls runEmbeddedAgent (src/cron/isolated-agent/run-embedded.runtime.ts re-exports it directly from src/agents/embedded-agent.js), the identical entry point an interactive run calls. Cron passes trigger: "cron", jobId, and bootstrapContextRunKind: "cron" as run-kind hints, not a separate execution path.

## Checkpointing

**Status:** confirmed  **Category:** long-running  **Maturity:** production

A checkpoint step exists specifically around compaction boundaries (compaction-checkpoint.ts), suggesting checkpointing in this codebase is coupled to compaction rather than being a general-purpose per-turn snapshot mechanism.

> Whether any other checkpoint exists outside the compaction path (e.g. after every tool call) was not confirmed this pass.

## Session persistence

**Status:** confirmed  **Category:** session  **Maturity:** production

Sessions, conversations, and transcripts are durably persisted per-agent in a Kysely-typed SQLite schema (openclaw-agent-schema.sql).

> session_nodes, session_windows, conversations, session_conversations, transcript_events tables confirmed via schema grep.

## Session resume

**Status:** inferred  **Category:** session  **Maturity:** production

Both Codex (session-catalog-node-continue.ts) and Claude CLI (session-catalog.ts) extensions have explicit 'continue an existing session' logic; the embedded (non-CLI-backend) path's resume mechanics were not directly confirmed this pass.

> extensions/codex/src/session-catalog-node-continue.ts and extensions/anthropic/session-catalog.ts are the strongest confirmed evidence of resume specifically for CLI-backed harnesses/backends.

## Cancellation

**Status:** confirmed  **Category:** agent-runtime  **Maturity:** production

An in-flight run is cancelled via an AbortController owned by the lane controller (laneTaskAbortController), which the tool-outcome/post-compaction-loop-guard path can also trigger from inside a running turn.

> createEmbeddedRunLaneController exposes laneTaskAbortController; run-loop.ts's observeToolOutcome calls laneTaskAbortController.abort(...) when the post-compaction loop guard detects a persisted-loop condition. Exact propagation from an external HTTP/API cancel request into this AbortController was not traced this pass.

## Flow: checkpoint save

**Status:** inferred  **Category:** long-running

1. **Compaction is triggered** `src/agents/embedded-agent-runner/compact.ts`
   compact.ts / compact-reasons.ts determine a compaction is needed for the current run.
2. **Checkpoint recorded around the compaction boundary** `src/agents/embedded-agent-runner/compaction-checkpoint.ts`
   compaction-checkpoint.ts persists state associated with the compaction event, so the run's history before/after the compaction remains reconstructable.
3. **Run loop continues with compacted context** `src/agents/embedded-agent-runner/run/attempt-recovery.ts`
   recoverEmbeddedRunAttempt's compaction path returns { action: "retry" } to run-loop.ts once compaction completes.

## Flow: long-running run

**Status:** confirmed  **Category:** long-running


## Flow: run resume

**Status:** confirmed  **Category:** long-running


## Persistence entities (per `persistence_entities` table)

- **state_leases** (persistence, confirmed) -- sqlite
- **session_nodes** (session, confirmed) -- sqlite
- **session_windows** (session, confirmed) -- sqlite
- **conversations** (session, confirmed) -- sqlite
- **transcript_events** (events, confirmed) -- sqlite
- **trajectory_runtime_events** (events, confirmed) -- sqlite
- **acp_parent_stream_events** (events, confirmed) -- sqlite
- **cache_entries** (memory, confirmed) -- sqlite
- **memory_index_meta / memory_index_sources / memory_index_chunks / memory_index_chunk_provenance / memory_embedding_cache / memory_index_state** (memory, confirmed) -- sqlite
- **standing_intents** (session, confirmed) -- sqlite
- **skill_usage / skill_lifecycle / skill_curator_state / skill_workshop_proposals / skill_workshop_proposal_origin_runs / skill_workshop_proposal_rollbacks** (session, confirmed) -- sqlite
- **audit_events / diagnostic_events / diagnostic_stability_bundles** (events, confirmed) -- sqlite

## Open questions

- [high] Does a scheduled cron job execute through the same runEmbeddedAgent entry point as an interactive run, or a separate execution path?
  Likely: N/A -- resolved with direct evidence.
- [high] Can an interrupted embedded run (process crash mid-turn, not a CLI-backend session) be resumed after restart, and if so, from what durable state?
  Likely: N/A -- resolved with direct evidence.

