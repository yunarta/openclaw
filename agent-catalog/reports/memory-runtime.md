# Memory Runtime

## Context selection

**Status:** inferred  **Category:** memory  **Maturity:** production

How context (working memory) is assembled for a given turn -- combination of recent conversation history, any compacted summary, and (if applicable) semantic-memory retrieval results.

> Not traced end-to-end this pass; buildContextEngineRuntimeSettings (src/context-engine/runtime-settings.ts) is confirmed to build token-budget/fallback settings consumed by whichever context engine is selected.

## Compaction

**Status:** confirmed  **Category:** memory  **Maturity:** production

Context compaction exists as a distinct pipeline with its own checkpoint step, triggered from within the run loop's recovery path (recoverEmbeddedRunAttempt references compactionRuntime).

> src/agents/embedded-agent-runner/compact.ts, compact-reasons.ts, compaction-checkpoint.ts, compaction-runtime-context.ts, and run/compaction-runtime.ts are all confirmed to exist; exact trigger condition (token-limit vs. turn-count vs. explicit) and whether it is a model-driven summarization call or mechanical truncation were not confirmed by reading this pass.

## Memory write

**Status:** inferred  **Category:** memory  **Maturity:** production

Writing conversation turns to transcript_events/session_nodes is confirmed to happen (the schema exists and is populated in production), but the exact writer symbol/function was not located and read this pass.

> See persistence_entities records for transcript_events and session_nodes.

## Memory retrieval

**Status:** inferred  **Category:** memory  **Maturity:** production

Retrieval of prior conversation history for prompt construction is confirmed to exist conceptually (multi-turn chat requires it) and semantic-memory retrieval is confirmed at the schema level (memory_index_chunks + memory_embedding_cache), but neither retrieval function was located and read this pass.

> See memory_systems records 'conversation history' and 'semantic memory index'.

## Persisted memory systems (per `memory_systems` table)

- **conversation history (per-agent transcript)** (conversation-history, confirmed) -- backend: SQLite (agents/<agentId>/agent/openclaw-agent.sqlite: session_nodes, session_windows, conversations, transcript_events)
- **root memory files** (long-term-memory, inferred) -- backend: Filesystem (per src/memory/root-memory-files.ts's name)
- **semantic memory index** (semantic-memory, confirmed) -- backend: SQLite (agents/<agentId>/agent/openclaw-agent.sqlite: memory_index_meta, memory_index_sources, memory_index_chunks, memory_index_chunk_provenance, memory_embedding_cache, memory_index_state)
- **session summary / compaction** (session-summary, inferred) -- backend: SQLite (per-agent DB; exact table not confirmed -- possibly session_windows)

## Open questions

- [high] What module writes to and reads from the semantic memory index tables (memory_index_chunks, memory_embedding_cache)?
  Likely: Likely lives under a plugin (memory-related bundled extension) rather than src/memory, given how thin src/memory itself is.

