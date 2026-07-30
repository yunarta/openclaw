# Agent Catalog Progress

## Repository

Commit: `8d273a4496bea2ba4a929d28b8370b15f7fc6715`
Branch: `claude/agentic-runtime-catalog-y0elec`

## What happened (read this first)

The original plan was to run nine parallel research subagents, one per
major subsystem (agent loop, Codex, Claude, tools, skills, memory,
sessions/long-running, events/streaming, OAuth), each producing a detailed
report to synthesize into the database. All nine were launched in
parallel; all nine failed immediately with the same error: the account
had hit its monthly Claude spend limit. No subagent returned usable
findings.

Direct tool calls from the main session (Read/Grep/Glob/Write/Bash)
continued to work, so research pivoted to first-hand investigation
instead of delegation. This produced fewer files-read overall than the
original nine-subagent plan would have, but every fact in the database
that isn't explicitly marked `inferred` was personally verified by reading
the actual source this session -- not relayed from an agent report.

## Completed

- [x] SQLite schema (`schema/001_initial.sql`, `002_indexes.sql`, `003_views.sql`) -- all required tables, FTS5 `catalog_search`, and all nine required views.
- [x] CLI (`cli/`): search, symbol, flow, module, capability, snippet, related, stats -- all working against the built database, `--json` output verified.
- [x] Helper library (`helpers/agent-catalog.ts`) -- typed, parameterized-SQL `AgentCatalog` implementation, type-checked clean.
- [x] Seed data + deterministic build pipeline (`cli/src/build/`) -- `npm run build-db` drops and rebuilds `catalog.sqlite` from `schema/*.sql` + typed seed data every time.
- [x] File inventory: 204 files, all confirmed to exist via direct `Read`/`Grep`/`Glob`/`ls` this session (not inferred from naming).
- [x] Module map: 13 modules covering the agent-runtime core, harness registry, the reusable `@openclaw/ai` package, the `src/llm` facade, Codex, Anthropic/Claude, tool runtime, sub-agent delegation, skill runtime, memory/context-engine, session persistence, long-running jobs, and auth/secrets.
- [x] Agent loop: fully traced with real line numbers -- `runEmbeddedAgent` -> `runEmbeddedAgentInternal` -> lane controller -> CLI-backend-dispatch fork -> `runPreparedEmbeddedLoop`'s `while(true)` (dispatch -> normalize -> recover -> handle-assistant-failure -> finalize -> resolve-terminal).
- [x] Harness architecture: confirmed `AgentHarness` is a pluggable contract; the embedded runner is registered as the built-in `"openclaw"` harness; Codex registers its own harness backed by `@openai/codex` 0.145.0.
- [x] Provider architecture: confirmed `packages/ai` (`@openclaw/ai`) is a standalone, zero-OpenClaw-core-dependency package implementing the actual provider wire protocols; `src/llm/stream.ts` is a thin facade over it; `extensions/anthropic` has no `@anthropic-ai/sdk` runtime dependency, confirming it does not own the wire protocol.
- [x] Generic OAuth barrel located (`src/llm/utils/oauth/{anthropic,openai-chatgpt,github-copilot}.ts`) and captured, though individual function signatures were not read.
- [x] Tool contract (`ToolDescriptor`, `src/tools/types.ts`) fully read and cataloged with every field.
- [x] Skill representation (`OpenClawSkillMetadata`, `SkillInvocationPolicy`, `SkillUsagePath`, `src/skills/types.ts`) fully read and cataloged; skills confirmed to be SKILL.md files under a top-level `skills/` directory (~53 entries).
- [x] Persistence schema: both canonical SQLite schemas (`src/state/openclaw-state-schema.sql`, `src/state/openclaw-agent-schema.sql`) enumerated via `grep '^CREATE TABLE'`, including the semantic-memory index tables (`memory_index_*`), lease tables (`state_leases`), and event/transcript tables.
- [x] Reports: all 8 required reports generated from the database (`npm run generate-reports`).
- [x] Top-level docs: README, PROGRESS (this file), SCHEMA, EXTRACTION-GUIDE, OPEN-QUESTIONS.
- [x] Validation: `PRAGMA integrity_check` = `ok`, `PRAGMA foreign_key_check` = 0 violations, CLI smoke-tested, JSON output verified valid.

## Pending

- [ ] Full read of `packages/ai/src/types.ts` for the complete event-model discriminated union (currently only 1-2 event shapes are confirmed with high confidence).
- [ ] `packages/gateway-protocol/` was not opened at all this pass.
- [ ] The exact tool-dispatch symbol (event -> registered `ToolDescriptor` -> executor) was not located and read.
- [ ] Skill loading/activation internals (`src/skills/loading/`, `src/skills/runtime/`, `src/skills/discovery/`) were confirmed to exist but not opened.
- [ ] `src/security/` (sandboxing) was not opened.
- [ ] The `SecretRef` mechanism described in root `AGENTS.md` was not located in source.
- [ ] Cron-to-agent-loop linkage (does a scheduled job call `runEmbeddedAgent`?) not confirmed.
- [ ] Semantic-memory-index writer/reader module not located (schema confirmed, code not found by name).

See `OPEN-QUESTIONS.md` for the full, database-backed list with priority and a suggested verification method for each.

## Blocked

- None currently. The only blocker encountered (subagent spend-limit failure) was worked around by shifting to direct research; it did not block completion of the catalog's required deliverables, only its research breadth.

## Catalog Statistics

- Files indexed: 204
- Symbols indexed: 39
- Modules indexed: 13
- Capabilities indexed: 29
- Flows indexed: 11 (36 flow steps)
- Snippets indexed: 3
- Evidence records: 16
- Findings: 5
- Open questions: 12 (9 high priority)
- `catalog_search` (FTS5) rows: 349
- `PRAGMA integrity_check`: ok
- `PRAGMA foreign_key_check`: 0 violations

## Last Updated

`2026-07-29T10:44:00Z`
