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

**Status:** confirmed  **Category:** memory  **Maturity:** production

PARTIALLY RESOLVED in a follow-up pass, scoped to the semantic memory index: extensions/memory-core (a bundled plugin, @openclaw/memory-core) owns memory_index_chunks/memory_index_chunks_vec/memory_embedding_cache end to end. Retrieval is entirely tool-mediated, not auto-injected -- buildPromptSection (extensions/memory-core/src/prompt-section.ts, registered as the memory capability's promptBuilder) only injects tool-usage guidance text telling the model to call the memory_search/memory_get tools when relevant, mirroring the same lazy, description-driven pattern documented for Skills (see skill invocation flow). Generic prior-conversation-history retrieval for ordinary multi-turn prompt construction (distinct from the semantic index) was not re-investigated this pass.

> MemoryIndexManager.search (extensions/memory-core/src/memory/manager.ts:1114) -> private searchVector (manager.ts:1613) -> standalone searchVector() (manager-search.ts:444), querying memory_index_chunks JOIN memory_index_chunks_vec. Exposed to the model via api.registerTool for memory_search/memory_get (extensions/memory-core/index.ts:340-346).

## Persisted memory systems (per `memory_systems` table)

- **conversation history (per-agent transcript)** (conversation-history, confirmed) -- backend: SQLite (agents/<agentId>/agent/openclaw-agent.sqlite: session_nodes, session_windows, conversations, transcript_events)
- **root memory files** (long-term-memory, inferred) -- backend: Filesystem (per src/memory/root-memory-files.ts's name)
- **semantic memory index** (semantic-memory, confirmed) -- backend: SQLite (agents/<agentId>/agent/openclaw-agent.sqlite: memory_index_meta, memory_index_sources, memory_index_chunks, memory_index_chunk_provenance, memory_embedding_cache, memory_index_state)
- **session summary / compaction** (session-summary, inferred) -- backend: SQLite (per-agent DB; exact table not confirmed -- possibly session_windows)

## Open questions

- [high] What module writes to and reads from the semantic memory index tables (memory_index_chunks, memory_embedding_cache)?
  Likely: N/A -- resolved with direct evidence.

