import type {
  SeedCapability,
  SeedPersistenceEntity,
  SeedMemorySystem,
  SeedFlow,
  SeedFlowStep,
  SeedEvidence,
  SeedOpenQuestion,
} from "../seed-types.js";

export const persistenceEntities: SeedPersistenceEntity[] = [
  {
    name: "state_leases",
    category: "persistence",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation:
      "src/state/openclaw-state-schema.sql (shared DB) and src/state/openclaw-agent-schema.sql (per-agent DB, same table name, separate database file)",
    writerSymbols:
      "src/state/openclaw-state-lease.ts (shared DB); src/state/openclaw-agent-db-lease.ts (per-agent DB)",
    readerSymbols: "Same lease modules.",
    lifecycle:
      "Acquired for a bounded operation, released on completion; exact TTL/heartbeat behavior not confirmed by reading this pass.",
    concurrencyNotes:
      "This is the primary lock/lease primitive preventing two processes from concurrently mutating the same shared-state or per-agent-DB row set.",
    recoveryNotes:
      "Not confirmed this pass whether stale leases are reaped by TTL, by next-owner steal, or require manual doctor intervention.",
  },
  {
    name: "session_nodes",
    category: "session",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols: "Not individually confirmed this pass.",
    readerSymbols: "Not individually confirmed this pass.",
    lifecycle: "Per-agent-DB table; confirmed to exist via schema grep only.",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes: "Not confirmed.",
  },
  {
    name: "session_windows",
    category: "session",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols: "Not individually confirmed this pass.",
    readerSymbols: "Not individually confirmed this pass.",
    lifecycle:
      "Per-agent-DB table; confirmed to exist via schema grep only. Name suggests a bounded window/slice of a session's history (compaction-related?).",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes: "Not confirmed.",
  },
  {
    name: "conversations",
    category: "session",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols: "Not individually confirmed this pass.",
    readerSymbols: "Not individually confirmed this pass.",
    lifecycle:
      "Per-agent-DB table; likely the top-level conversation/thread record a session belongs to.",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes: "Not confirmed.",
  },
  {
    name: "transcript_events",
    category: "events",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols: "Not individually confirmed this pass.",
    readerSymbols: "Not individually confirmed this pass.",
    lifecycle:
      "Per-agent-DB table; the durable record of a session's message/event transcript -- direct answer to 'are agent run events persisted': yes, at least at the transcript level.",
    concurrencyNotes:
      "Sibling table transcript_rewrite_watermarks (also confirmed in the schema) suggests transcripts can be rewritten/repaired with a watermark to track progress.",
    recoveryNotes: "Not confirmed.",
  },
  {
    name: "trajectory_runtime_events",
    category: "events",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols:
      "Likely src/trajectory/* (top-level directory confirmed to exist in the initial repo listing, not opened this pass).",
    readerSymbols: "Not confirmed.",
    lifecycle:
      "Per-agent-DB table; a distinct, lower-level runtime event log from transcript_events -- observability/audit-oriented rather than user-visible-message-oriented.",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes: "Not confirmed.",
  },
  {
    name: "acp_parent_stream_events",
    category: "events",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols:
      "src/agents/acp-parent-stream-store.sqlite.ts (confirmed to exist, matches table name).",
    readerSymbols: "Same module.",
    lifecycle:
      "Persists a parent run's view of a spawned sub-agent's event stream, enabling the parent to observe/replay a delegated child run's progress.",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes: "Not confirmed.",
  },
  {
    name: "cache_entries",
    category: "memory",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols: "Not individually confirmed this pass.",
    readerSymbols: "Not individually confirmed this pass.",
    lifecycle: "Per-agent-DB generic cache table.",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes: "Not confirmed.",
  },
  {
    name: "memory_index_meta / memory_index_sources / memory_index_chunks / memory_index_chunk_provenance / memory_embedding_cache / memory_index_state",
    category: "memory",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols:
      "Not individually confirmed this pass; a dedicated memory-indexing module was not located by name during this pass (see open_questions).",
    readerSymbols: "Not individually confirmed this pass.",
    lifecycle:
      "Per-agent-DB semantic-memory index: sources are chunked (memory_index_chunks), each chunk has provenance tracking, and an embedding_cache avoids recomputing embeddings. This is the strongest confirmed evidence of true long-term/semantic memory (embedding-based retrieval) as distinct from raw conversation history.",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes:
      "memory_index_state suggests an explicit indexing-progress/health state distinct from the index content itself.",
  },
  {
    name: "standing_intents",
    category: "session",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-agent-schema.sql",
    writerSymbols:
      "src/state/onboarding-recommendations.ts or a dedicated standing-intents module (not confirmed).",
    readerSymbols: "Not confirmed.",
    lifecycle:
      "Table name suggests a durable, user-declared standing goal/intent the agent tracks across sessions -- distinct from a single run/turn. Not confirmed by reading source this pass.",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes: "Not confirmed.",
  },
  {
    name: "skill_usage / skill_lifecycle / skill_curator_state / skill_workshop_proposals / skill_workshop_proposal_origin_runs / skill_workshop_proposal_rollbacks",
    category: "session",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-state-schema.sql",
    writerSymbols:
      "src/skills/lifecycle and src/skills/workshop (directories confirmed to exist, not opened).",
    readerSymbols: "Not confirmed.",
    lifecycle:
      "Shared-state-DB tables tracking skill usage telemetry, lifecycle transitions, and a proposal/rollback workflow for authoring or modifying skills (a 'workshop').",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes:
      "skill_workshop_proposal_rollbacks implies proposals can be explicitly rolled back, i.e. skill authorship changes are durable and reversible.",
  },
  {
    name: "audit_events / diagnostic_events / diagnostic_stability_bundles",
    category: "events",
    status: "confirmed",
    storageBackend: "sqlite",
    schemaLocation: "src/state/openclaw-state-schema.sql",
    writerSymbols:
      "src/audit/* (top-level directory confirmed to exist, not opened this pass) and src/infra/diagnostic-events.ts (referenced by src/agents/harness/lifecycle.ts's imports).",
    readerSymbols: "Not confirmed.",
    lifecycle:
      "Shared-state-DB observability/audit log, separate from per-agent transcript_events -- confirms a dedicated audit/observability event stream exists distinct from the live agent event stream, per the task's event-model requirements.",
    concurrencyNotes: "Not confirmed.",
    recoveryNotes: "Not confirmed.",
  },
];

export const memorySystems: SeedMemorySystem[] = [
  {
    name: "conversation history (per-agent transcript)",
    category: "conversation-history",
    status: "confirmed",
    storageBackend:
      "SQLite (agents/<agentId>/agent/openclaw-agent.sqlite: session_nodes, session_windows, conversations, transcript_events)",
    writePath: "Not individually confirmed this pass.",
    retrievalPath: "Not individually confirmed this pass.",
    rankingMethod: "None (chronological transcript, not ranked retrieval).",
    promptInjection:
      "Direct: prior turns are (re)sent as message history on each provider call, per the standard multi-turn chat pattern; exact truncation/windowing logic not confirmed.",
    retentionPolicy:
      "Not confirmed; likely durable until explicit session deletion (src/state/agent-deletion-journal.ts confirms a deletion journal exists).",
  },
  {
    name: "session summary / compaction",
    category: "session-summary",
    status: "inferred",
    storageBackend: "SQLite (per-agent DB; exact table not confirmed -- possibly session_windows)",
    writePath:
      "src/agents/embedded-agent-runner/compact.ts (confirmed to exist, not read line-by-line)",
    retrievalPath: "Not confirmed.",
    rankingMethod: "N/A",
    promptInjection:
      "A compacted representation presumably replaces older raw turns in the next prompt; exact mechanism not confirmed.",
    retentionPolicy: "Not confirmed.",
  },
  {
    name: "semantic memory index",
    category: "semantic-memory",
    status: "confirmed",
    storageBackend:
      "SQLite (agents/<agentId>/agent/openclaw-agent.sqlite: memory_index_meta, memory_index_sources, memory_index_chunks, memory_index_chunk_provenance, memory_embedding_cache, memory_index_state)",
    writePath: "Not individually confirmed this pass -- indexing module not located by name.",
    retrievalPath: "Not individually confirmed this pass.",
    rankingMethod:
      "Embedding-based (memory_embedding_cache implies vector-similarity retrieval), possibly hybrid with keyword search; not confirmed.",
    promptInjection: "Not confirmed.",
    retentionPolicy:
      "memory_index_state suggests explicit index-health/progress tracking rather than a simple always-fresh assumption.",
  },
  {
    name: "root memory files",
    category: "long-term-memory",
    status: "inferred",
    storageBackend: "Filesystem (per src/memory/root-memory-files.ts's name)",
    writePath: "Not confirmed.",
    retrievalPath: "Not confirmed.",
    rankingMethod: "N/A (likely whole-file inclusion, not ranked retrieval)",
    promptInjection:
      "Not confirmed; likely analogous to CLAUDE.md/AGENTS.md-style always-loaded instruction files at the workspace root, given the name and this repository's own heavy use of that pattern for itself.",
    retentionPolicy: "User/operator-authored, durable until edited.",
  },
];

export const memoryCapabilities: SeedCapability[] = [
  {
    name: "context selection",
    category: "memory",
    status: "inferred",
    maturity: "production",
    reusable: false,
    description:
      "How context (working memory) is assembled for a given turn -- combination of recent conversation history, any compacted summary, and (if applicable) semantic-memory retrieval results.",
    implementationSummary:
      "Not traced end-to-end this pass; buildContextEngineRuntimeSettings (src/context-engine/runtime-settings.ts) is confirmed to build token-budget/fallback settings consumed by whichever context engine is selected.",
    symbols: [],
  },
  {
    name: "compaction",
    category: "memory",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "Context compaction exists as a distinct pipeline with its own checkpoint step, triggered from within the run loop's recovery path (recoverEmbeddedRunAttempt references compactionRuntime).",
    implementationSummary:
      "src/agents/embedded-agent-runner/compact.ts, compact-reasons.ts, compaction-checkpoint.ts, compaction-runtime-context.ts, and run/compaction-runtime.ts are all confirmed to exist; exact trigger condition (token-limit vs. turn-count vs. explicit) and whether it is a model-driven summarization call or mechanical truncation were not confirmed by reading this pass.",
    symbols: [],
  },
  {
    name: "checkpointing",
    category: "long-running",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "A checkpoint step exists specifically around compaction boundaries (compaction-checkpoint.ts), suggesting checkpointing in this codebase is coupled to compaction rather than being a general-purpose per-turn snapshot mechanism.",
    implementationSummary:
      "Whether any other checkpoint exists outside the compaction path (e.g. after every tool call) was not confirmed this pass.",
    symbols: [],
  },
  {
    name: "session persistence",
    category: "session",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Sessions, conversations, and transcripts are durably persisted per-agent in a Kysely-typed SQLite schema (openclaw-agent-schema.sql).",
    implementationSummary:
      "session_nodes, session_windows, conversations, session_conversations, transcript_events tables confirmed via schema grep.",
    symbols: [],
  },
  {
    name: "session resume",
    category: "session",
    status: "inferred",
    maturity: "production",
    reusable: false,
    description:
      "Both Codex (session-catalog-node-continue.ts) and Claude CLI (session-catalog.ts) extensions have explicit 'continue an existing session' logic; the embedded (non-CLI-backend) path's resume mechanics were not directly confirmed this pass.",
    implementationSummary:
      "extensions/codex/src/session-catalog-node-continue.ts and extensions/anthropic/session-catalog.ts are the strongest confirmed evidence of resume specifically for CLI-backed harnesses/backends.",
    symbols: [],
  },
  {
    name: "long-running jobs",
    category: "long-running",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Scheduled/background jobs (src/cron/) are a distinct concept from an interactive multi-turn agent run, with their own active-job tracking, command execution, delivery, and heartbeat monitoring.",
    implementationSummary:
      "src/cron/active-jobs.ts, command-runner.ts, delivery.ts, heartbeat-monitor.ts confirmed to exist; whether a scheduled job invokes the same runEmbeddedAgent entry point as an interactive run was not confirmed this pass.",
    symbols: [],
  },
];

export const memorySessionFlows: SeedFlow[] = [
  {
    name: "long-running run",
    category: "long-running",
    status: "inferred",
    description:
      "Best-effort reconstruction: a cron-scheduled job (src/cron/active-jobs.ts) triggers at its scheduled time, executes via command-runner.ts, and delivers its result via delivery.ts -- most likely by invoking the same embedded-agent-runner entry point as an interactive run, but this specific link was not confirmed by reading source this pass.",
    terminationCondition: "Not confirmed.",
    errorBehavior:
      "heartbeat-monitor.ts / heartbeat-policy.ts suggest liveness is monitored and a stuck job can be detected, but the exact recovery action was not confirmed.",
  },
  {
    name: "checkpoint save",
    category: "long-running",
    status: "inferred",
    description:
      "compaction-checkpoint.ts is confirmed to exist and, by name and its position in the module list (imported/used near the compaction runtime in run-loop.ts's recovery path), is triggered specifically at a compaction boundary rather than on every turn.",
    terminationCondition: "Not confirmed.",
    errorBehavior: "Not confirmed.",
  },
  {
    name: "run resume",
    category: "long-running",
    status: "inferred",
    description:
      "Confirmed to exist distinctly for CLI-backed sessions (Codex's session-catalog-node-continue.ts, Claude's session-catalog.ts adoption/continue logic); embedded-runner-level resume after a process restart was not confirmed this pass.",
    terminationCondition: "Not confirmed.",
    errorBehavior: "Not confirmed.",
  },
];

export const memorySessionFlowSteps: SeedFlowStep[] = [
  {
    flowName: "checkpoint save",
    stepOrder: 1,
    title: "Compaction is triggered",
    description:
      "compact.ts / compact-reasons.ts determine a compaction is needed for the current run.",
    fileKey: "src/agents/embedded-agent-runner/compact.ts",
  },
  {
    flowName: "checkpoint save",
    stepOrder: 2,
    title: "Checkpoint recorded around the compaction boundary",
    description:
      "compaction-checkpoint.ts persists state associated with the compaction event, so the run's history before/after the compaction remains reconstructable.",
    fileKey: "src/agents/embedded-agent-runner/compaction-checkpoint.ts",
  },
  {
    flowName: "checkpoint save",
    stepOrder: 3,
    title: "Run loop continues with compacted context",
    description:
      'recoverEmbeddedRunAttempt\'s compaction path returns { action: "retry" } to run-loop.ts once compaction completes.',
    fileKey: "src/agents/embedded-agent-runner/run/attempt-recovery.ts",
  },
];

export const memorySessionEvidence: SeedEvidence[] = [
  {
    key: "ev:agent-db-schema-tables",
    fileKey: "src/state/openclaw-agent-schema.sql",
    claim:
      "The per-agent SQLite schema includes session_nodes, session_windows, conversations, transcript_events, trajectory_runtime_events, acp_parent_stream_events, cache_entries, memory_index_meta/sources/chunks/chunk_provenance, memory_embedding_cache, memory_index_state, and standing_intents.",
    evidenceType: "type-definition",
    confidence: 1.0,
    notes:
      "Confirmed via `grep -n '^CREATE TABLE' src/state/openclaw-agent-schema.sql`; column-level detail not read this pass.",
  },
  {
    key: "ev:state-schema-tables",
    fileKey: "src/state/openclaw-state-schema.sql",
    claim:
      "The shared-state SQLite schema includes auth_profile_stores/state, mcp_oauth_stores, diagnostic_events, skill_usage/lifecycle/curator_state/workshop_proposals(+origin_runs/rollbacks), audit_events, session_state_events/heads, session_watch_cursors, session_upstream_links, state_leases, exec_approvals_config, operator_approvals, device pairing/auth tables, onboarding_recommendations.",
    evidenceType: "type-definition",
    confidence: 1.0,
    notes:
      "Confirmed via `grep -n '^CREATE TABLE' src/state/openclaw-state-schema.sql`; column-level detail not read this pass.",
  },
];

export const memorySessionOpenQuestions: SeedOpenQuestion[] = [
  {
    category: "long-running-execution",
    question:
      "Does a scheduled cron job execute through the same runEmbeddedAgent entry point as an interactive run, or a separate execution path?",
    evidenceInspected:
      "src/cron/active-jobs.ts and command-runner.ts confirmed to exist; not opened this pass.",
    reasonUnresolved:
      "Deprioritized in favor of confirming the interactive agent-loop and provider architecture given constrained research time.",
    likelyInterpretation:
      "Likely the same entry point, given root AGENTS.md's emphasis on one canonical execution path per concept, but not confirmed.",
    verificationMethod:
      "Read src/cron/command-runner.ts and grep for 'runEmbeddedAgent' or 'runAgentHarnessLifecycleAttempt' call sites within src/cron/.",
    priority: "high",
    status: "open",
  },
  {
    category: "memory",
    question:
      "What module writes to and reads from the semantic memory index tables (memory_index_chunks, memory_embedding_cache)?",
    evidenceInspected:
      "Table names confirmed via schema grep only; no module matching an obvious 'memory-index'/'embedding' name was located under src/memory (which contains only root-memory-files.ts) or src/agents this pass.",
    reasonUnresolved:
      "Not searched with broader patterns (e.g. 'embedding', 'memory_index') due to time constraints.",
    likelyInterpretation:
      "Likely lives under a plugin (memory-related bundled extension) rather than src/memory, given how thin src/memory itself is.",
    verificationMethod:
      "grep -rln 'memory_index_chunks\\|memory_embedding_cache' --include=*.ts, then read the matching module(s).",
    priority: "high",
    status: "open",
  },
  {
    category: "long-running-execution",
    question:
      "Can an interrupted embedded run (process crash mid-turn, not a CLI-backend session) be resumed after restart, and if so, from what durable state?",
    evidenceInspected:
      "session_nodes/session_windows/transcript_events confirm conversation-level durability; whether an in-flight (uncompleted) attempt's partial state is itself resumable, versus the run simply restarting from the last persisted turn, was not confirmed.",
    reasonUnresolved: "Not traced this pass.",
    likelyInterpretation:
      "Most likely: no true mid-attempt resume for the embedded path -- a restart resumes the *session* (conversation history) but re-issues a fresh attempt/turn, not a fresh continuation of a half-finished provider stream. This differs from Codex/Claude CLI-backend sessions, which do have explicit 'continue' logic at the session-catalog level.",
    verificationMethod:
      "Read src/state/openclaw-agent-db-session-migrations.ts and search for any 'resume' or 'recover' logic tied to an in-flight (not-yet-terminal) run row.",
    priority: "high",
    status: "open",
  },
];
