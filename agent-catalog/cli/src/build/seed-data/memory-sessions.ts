import type {
  SeedCapability,
  SeedPersistenceEntity,
  SeedMemorySystem,
  SeedSymbol,
  SeedFlow,
  SeedFlowStep,
  SeedEvidence,
  SeedOpenQuestion,
} from "../seed-types.js";

export const memorySessionSymbols: SeedSymbol[] = [
  {
    key: "sym:executeCronRun",
    fileKey: "src/cron/isolated-agent/run-executor.ts",
    name: "executeCronRun",
    kind: "function",
    startLine: 610,
    purpose:
      'Cron\'s per-job run executor. Branches on whether the resolved provider is CLI-backed (runCliAgent, trigger: "cron") or embedded (runEmbeddedAgent, trigger: "cron", bootstrapContextRunKind: "cron") -- the same two entry points an interactive run uses, distinguished only by a run-kind hint, not a separate execution path.',
    architecturalRole: "orchestrator",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:MemoryIndexManager.search",
    fileKey: "extensions/memory-core/src/memory/manager.ts",
    name: "MemoryIndexManager.search",
    qualifiedName: "MemoryIndexManager.search",
    kind: "method",
    startLine: 1114,
    purpose:
      "The public semantic-memory retrieval entry point (async search(query, opts)). Delegates to a private searchVector wrapper (manager.ts:1613) around manager-search.ts's standalone searchVector(), which joins memory_index_chunks against the memory_index_chunks_vec vector table. Reached only through the memory_search/memory_get tools, never auto-invoked.",
    architecturalRole: "entry-point",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "medium",
  },
  {
    key: "sym:MemoryManagerEmbeddingOps.writeChunks",
    fileKey: "extensions/memory-core/src/memory/manager-embedding-ops.ts",
    name: "MemoryManagerEmbeddingOps.writeChunks",
    qualifiedName: "MemoryManagerEmbeddingOps.writeChunks",
    kind: "method",
    startLine: 980,
    endLine: 1015,
    purpose:
      "Private write path for one indexed file's chunks. Inside a single sync transaction: clears any prior rows for the path/source, then for each chunk inserts/updates memory_index_chunks (with an ON CONFLICT upsert keyed by a content hash id) and writes the corresponding embedding into the memory_index_chunks_vec vector table via replaceMemoryVectorRow.",
    architecturalRole: "implementation",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:recoverRestartAbortedMainSessions",
    fileKey: "src/agents/main-session-restart-recovery-runtime.ts",
    name: "recoverRestartAbortedMainSessions",
    kind: "function",
    startLine: 62,
    endLine: 71,
    signature:
      "async function recoverRestartAbortedMainSessions(params: { cfg?, stateDir?, resumedSessionKeys?, activeSessionIds?, activeSessionKeys?, gatewayRuntime }): Promise<{ recovered: number; failed: number; skipped: number }>",
    purpose:
      "Resolves the run-resume-after-crash open question. Public entry point for restart-triggered recovery: iterates every per-agent restart-recovery store, resuming each marked session (stamped at shutdown or detected orphaned at startup) by re-dispatching it with a synthetic 'your previous turn was interrupted, continue from the transcript' system message. Re-exported from the src/agents/main-session-restart-recovery.ts barrel and wired into gateway boot from src/gateway/server-startup-post-attach.ts.",
    architecturalRole: "orchestrator",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:recoverStartupOrphanedMainSessions",
    fileKey: "src/agents/main-session-restart-recovery-runtime.ts",
    name: "recoverStartupOrphanedMainSessions",
    kind: "function",
    startLine: 293,
    purpose:
      "The hard-crash detection path: on gateway startup, scans session stores for sessions that still claim to be running but have no live owner in the new process -- the case a graceful-shutdown recovery marker cannot cover, since no shutdown code ran. Marks them for the same re-dispatch recovery flow as a graceful-restart abort.",
    architecturalRole: "orchestrator",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:buildPromptSection",
    fileKey: "extensions/memory-core/src/prompt-section.ts",
    name: "buildPromptSection",
    kind: "function",
    startLine: 4,
    endLine: 39,
    signature:
      "const buildPromptSection: MemoryPromptSectionBuilder = ({ availableTools, citationsMode }) => string[]",
    purpose:
      "Registered as the memory capability's promptBuilder (api.registerMemoryCapability). Injects only tool-usage guidance text ('run memory_search ... then use memory_get') into the system prompt when the memory_search/memory_get tools are available -- never the retrieved chunk content itself. Confirms semantic-memory retrieval is entirely tool-mediated, mirroring the Skills lazy-loading pattern.",
    architecturalRole: "prompt-injection",
    importance: "high",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "low",
  },
];

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
      "extensions/memory-core/src/memory/manager-embedding-ops.ts's MemoryManagerEmbeddingOps.writeChunks (memory_index_chunks) and manager-vector-write.ts's replaceMemoryVectorRow (memory_index_chunks_vec); manager-embedding-cache.ts's upsertMemoryEmbeddingCache (memory_embedding_cache).",
    readerSymbols:
      "extensions/memory-core/src/memory/manager.ts's MemoryIndexManager.search -> manager-search.ts's searchVector/searchKeyword; manager-embedding-cache.ts's loadMemoryEmbeddingCache.",
    lifecycle:
      "Per-agent-DB semantic-memory index, owned end to end by the bundled extensions/memory-core plugin (@openclaw/memory-core): sources are chunked (memory_index_chunks), each chunk has provenance tracking, and an embedding_cache avoids recomputing embeddings. This is the strongest confirmed evidence of true long-term/semantic memory (embedding-based retrieval) as distinct from raw conversation history.",
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
    writePath:
      "RESOLVED: extensions/memory-core (bundled plugin @openclaw/memory-core) owns the full pipeline. MemoryManagerEmbeddingOps.writeChunks (extensions/memory-core/src/memory/manager-embedding-ops.ts:980-1015, private method on the class starting line 303) upserts memory_index_chunks inside a single sync transaction, and calls replaceMemoryVectorRow (manager-vector-write.ts) for the sqlite-vec table plus an FTS write. loadMemoryEmbeddingCache/upsertMemoryEmbeddingCache (manager-embedding-cache.ts) separately read/write memory_embedding_cache so embeddings are not recomputed for unchanged chunk hashes.",
    retrievalPath:
      "RESOLVED: MemoryIndexManager.search (manager.ts:1114, public) -> private searchVector (manager.ts:1613) -> standalone searchVector() (manager-search.ts:444), which joins memory_index_chunks against memory_index_chunks_vec. Exposed to the model exclusively via two registered tools (memory_search, memory_get; extensions/memory-core/index.ts:340-346) -- there is no automatic background injection of retrieved chunk content.",
    rankingMethod:
      "Embedding-based vector similarity (searchVector), with a separate keyword/FTS path (searchKeyword, manager-search.ts:646) -- confirmed to coexist as two distinct query functions; whether/how MemoryIndexManager.search blends their results was not traced line-by-line this pass.",
    promptInjection:
      "RESOLVED: no chunk content is auto-injected. buildPromptSection (extensions/memory-core/src/prompt-section.ts, registered as the memory capability's promptBuilder via api.registerMemoryCapability) injects only tool-usage guidance text instructing the model to call memory_search/memory_get itself when the turn needs prior context -- the same lazy, description-driven pattern confirmed for Skills (see the skill invocation flow).",
    retentionPolicy:
      "memory_index_state suggests explicit index-health/progress tracking rather than a simple always-fresh assumption; retention/eviction policy itself not traced this pass.",
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
      'RESOLVED in a follow-up pass: src/cron/isolated-agent/run-executor.ts\'s executeCronRun branches on whether the resolved provider is CLI-backed (runCliAgent, the same opt-in subscription-auth fork interactive CLI-backend runs use) or embedded -- in which case it calls runEmbeddedAgent (src/cron/isolated-agent/run-embedded.runtime.ts re-exports it directly from src/agents/embedded-agent.js), the identical entry point an interactive run calls. Cron passes trigger: "cron", jobId, and bootstrapContextRunKind: "cron" as run-kind hints, not a separate execution path.',
    symbols: [{ symbolKey: "sym:executeCronRun", role: "entry-point" }],
  },
];

export const memorySessionFlows: SeedFlow[] = [
  {
    name: "long-running run",
    category: "long-running",
    status: "confirmed",
    entrySymbolKey: "sym:executeCronRun",
    description:
      'RESOLVED in a follow-up pass: a cron-scheduled job triggers at its scheduled time and is executed by src/cron/isolated-agent/run-executor.ts\'s executeCronRun, which calls either runCliAgent (CLI-backed provider) or runEmbeddedAgent (embedded provider) -- the exact same entry points an interactive run uses, tagged with trigger: "cron" / bootstrapContextRunKind: "cron" rather than routed through a separate execution path.',
    terminationCondition:
      "Same as any embedded/CLI run: the run loop reaches a terminal state (end/error/timeout) via the shared agent-run-terminal-outcome normalization.",
    errorBehavior:
      "heartbeat-monitor.ts / heartbeat-policy.ts suggest liveness is monitored and a stuck job can be detected, but the exact recovery action was not confirmed this pass.",
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
    status: "confirmed",
    entrySymbolKey: "sym:recoverRestartAbortedMainSessions",
    description:
      "RESOLVED in a follow-up pass: confirmed to exist distinctly for CLI-backed sessions (Codex's session-catalog-node-continue.ts, Claude's session-catalog.ts adoption/continue logic) AND for the embedded main-session path, via a dedicated always-on restart-recovery subsystem (src/agents/main-session-restart-recovery*.ts, ~1650 lines across 7+ files). This is session/turn-level resume-by-replay-instruction: a fresh attempt is re-dispatched with a synthetic system message telling the agent its turn was interrupted, not literal continuation of a half-finished provider stream.",
    terminationCondition:
      "Recovery succeeds (session re-dispatched and produces a reply, or a previously-produced-but-undelivered reply is delivered), the durable 3-attempt dispatch budget is exhausted (session tombstoned), or the transcript tail is judged unsafe to continue from (falls back to a resend notice instead of a silent re-run).",
    errorBehavior:
      "Fail-closed on ambiguity: an unhandled before_agent_reply hook checkpoint blocks recovery (a checkpoint cannot prove the same plugin code/config loaded post-restart); an unknown post-dispatch provider outcome for a message-tool-only reply is never replayed; startup reconciliation retries transient failures up to 3 times with exponential backoff; a repeatedly-failing session is tombstoned rather than looping forever.",
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
    key: "ev:memory-core-write-chunks",
    fileKey: "extensions/memory-core/src/memory/manager-embedding-ops.ts",
    symbolKey: "sym:MemoryManagerEmbeddingOps.writeChunks",
    startLine: 952,
    endLine: 1015,
    claim:
      "extensions/memory-core's MemoryManagerEmbeddingOps.writeChunks is the writer for memory_index_chunks (upsert) and, via replaceMemoryVectorRow, memory_index_chunks_vec; manager-embedding-cache.ts's upsertMemoryEmbeddingCache separately writes memory_embedding_cache.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:memory-core-search-vector",
    fileKey: "extensions/memory-core/src/memory/manager-search.ts",
    startLine: 444,
    endLine: 646,
    claim:
      "manager-search.ts's searchVector() is the semantic (embedding-similarity) reader querying memory_index_chunks JOIN memory_index_chunks_vec; searchKeyword() is a separate FTS-based reader. MemoryIndexManager.search (manager.ts:1114) is the public method that reaches these.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly (searchVector signature and query construction).",
  },
  {
    key: "ev:memory-core-tool-mediated-retrieval",
    fileKey: "extensions/memory-core/src/prompt-section.ts",
    symbolKey: "sym:buildPromptSection",
    startLine: 1,
    endLine: 39,
    claim:
      "buildPromptSection injects only tool-usage guidance ('run memory_search ... then use memory_get') into the prompt, never retrieved chunk content -- confirmed by reading the function in full plus its registration as promptBuilder in extensions/memory-core/index.ts:328-346 alongside the memory_search/memory_get tool registrations.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:restart-recovery-doc",
    fileKey: "docs/gateway/restart-recovery.md",
    claim:
      "OpenClaw runs an always-on restart-recovery subsystem: interrupted main-session turns, subagent runs, and background tasks are detected (at turn admission, at graceful shutdown, and at startup scan for orphaned live-claim rows with no owner in the new process) and automatically resumed by re-dispatching the session with a synthetic continuation message, bounded by a 3-attempt durable budget, a transcript-tail safety check, and fail-closed handling of unresolved before_agent_reply hook checkpoints.",
    evidenceType: "documentation",
    confidence: 1.0,
    notes:
      "Read in full. Cross-checked against source (see ev:restart-recovery-source) rather than trusted alone, per repo doctrine that docs change with behavior but source is authoritative.",
  },
  {
    key: "ev:restart-recovery-source",
    fileKey: "src/agents/main-session-restart-recovery-runtime.ts",
    symbolKey: "sym:recoverRestartAbortedMainSessions",
    startLine: 1,
    endLine: 100,
    claim:
      "recoverRestartAbortedMainSessions and recoverStartupOrphanedMainSessions are real, exported functions matching the documented behavior; src/agents/main-session-restart-recovery.ts is a 17-line public barrel re-exporting them, and src/gateway/server-startup-post-attach.ts lazily imports that barrel at gateway boot (line 57), confirming the recovery subsystem is actually wired into startup rather than being dead/unused code.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes:
      "Read lines 1-100 of 389; the remaining ~1650 lines across sibling files were not read line-by-line this pass.",
  },
  {
    key: "ev:cron-runs-embedded-agent",
    fileKey: "src/cron/isolated-agent/run-executor.ts",
    symbolKey: "sym:executeCronRun",
    startLine: 399,
    endLine: 570,
    claim:
      'executeCronRun calls runCliAgent for CLI-backed providers or runEmbeddedAgent for embedded providers, both tagged trigger: "cron" -- the identical entry points an interactive run uses, confirmed further by src/cron/isolated-agent/run-embedded.runtime.ts re-exporting runEmbeddedAgent directly from src/agents/embedded-agent.js with no cron-specific wrapper.',
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly.",
  },
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
      'RESOLVED in a follow-up pass: read src/cron/isolated-agent/run-executor.ts\'s executeCronRun (the branching call sites around lines 399-570) and src/cron/isolated-agent/run-embedded.runtime.ts (4-line re-export seam) in full. Confirmed: yes, the same entry point (runEmbeddedAgent, or runCliAgent for CLI-backed providers -- both identical to the interactive path), distinguished only by trigger: "cron" / bootstrapContextRunKind: "cron" run-kind hints, not a separate execution path.',
    reasonUnresolved: "N/A -- resolved.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod: "N/A -- resolved.",
    priority: "high",
    status: "resolved",
  },
  {
    category: "memory",
    question:
      "What module writes to and reads from the semantic memory index tables (memory_index_chunks, memory_embedding_cache)?",
    evidenceInspected:
      "RESOLVED in a follow-up pass: `grep -rl \"memory_index_chunks\\|memory_embedding_cache\" extensions/` -> extensions/memory-core (the bundled @openclaw/memory-core plugin), confirming the likely-interpretation guess below. Read manager-embedding-ops.ts's writeChunks (lines 980-1015), manager-vector-write.ts (24 lines, full), manager-embedding-cache.ts (121 lines, full), manager-search.ts's searchVector/searchKeyword signatures (lines 444-763), manager.ts's public search method (line 1114) and MemoryIndexManager class declaration (line 418), extensions/memory-core/index.ts's plugin registration (lines 328-350), and prompt-section.ts's buildPromptSection (full, 39 lines). Writer: MemoryManagerEmbeddingOps.writeChunks + replaceMemoryVectorRow + upsertMemoryEmbeddingCache. Reader: MemoryIndexManager.search -> searchVector/searchKeyword, reached only via the registered memory_search/memory_get tools -- buildPromptSection injects tool-usage guidance only, never chunk content, confirming retrieval is entirely tool-mediated like Skills.",
    reasonUnresolved: "N/A -- resolved.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod: "N/A -- resolved.",
    priority: "high",
    status: "resolved",
  },
  {
    category: "long-running-execution",
    question:
      "Can an interrupted embedded run (process crash mid-turn, not a CLI-backend session) be resumed after restart, and if so, from what durable state?",
    evidenceInspected:
      'RESOLVED in a follow-up pass, initially found via `grep -rl "crash" docs/` -> docs/gateway/restart-recovery.md (read in full, 242 lines), then cross-checked against source: src/agents/main-session-restart-recovery-runtime.ts (read lines 1-100 of 389, confirming recoverRestartAbortedMainSessions/recoverStartupOrphanedMainSessions signatures), src/agents/main-session-restart-recovery.ts (17-line public barrel), and confirmed wiring from src/gateway/server-startup-post-attach.ts (lazy import of the barrel at gateway boot, line 57). Answer: yes -- a purpose-built, always-on recovery subsystem (not the embedded run loop itself) detects and resumes interrupted main-session turns. Three detection points: (1) at turn admission, the user message + a recovery delivery claim are written in one SQLite transaction before model/hook execution; (2) at graceful shutdown, every session with an active run is stamped with a recovery marker before abort; (3) at startup, the gateway scans session stores for sessions still claiming to be running with no live owner in the new process (catches hard crashes with no shutdown code). A few seconds after boot, each marked session is re-dispatched with a synthetic system message telling the agent its previous turn was interrupted and to continue from the existing transcript; a fail-closed check on unhandled before_agent_reply hook checkpoints, a 3-attempt durable dispatch budget with tombstoning on exhaustion, and a transcript-tail safety check (falls back to a resend notice if the tail is unsafe to continue from, e.g. mid-tool-call or a stale pending approval) bound the retry behavior. This is session/turn-level resume-by-replay-instruction, not literal mid-attempt provider-stream continuation -- consistent with the original likely-interpretation guess.',
    reasonUnresolved: "N/A -- resolved.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod: "N/A -- resolved.",
    priority: "high",
    status: "resolved",
  },
];
