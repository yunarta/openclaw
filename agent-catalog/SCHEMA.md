# Schema Reference

Authoritative DDL lives in `schema/001_initial.sql` (tables + FTS5),
`schema/002_indexes.sql` (indexes), and `schema/003_views.sql` (views).
This file is a human-readable guide to that DDL, not a second definition
of it -- if this file and the SQL ever disagree, the SQL wins.

## Conventions

- Every table has an `INTEGER PRIMARY KEY` `id` (SQLite rowid alias).
- Boolean-ish columns (`in_scope`, `generated`, `reusable`, `persisted`,
  `sensitive`, `provider_specific`, `required`, `cancellation_support`,
  `long_running`) are stored as `INTEGER` (0/1) or `NULL` for "unknown."
- `status` columns follow the confidence vocabulary in `EXTRACTION-GUIDE.md`
  §Evidence: `confirmed` (read directly), `inferred` (strongly implied,
  not read directly), `configuration-dependent`, `legacy`,
  `unused-suspected`.
- Foreign keys are enforced at the connection level
  (`PRAGMA foreign_keys = ON`, set by `cli/src/db.ts`'s `openCatalog()`),
  since SQLite does not enforce them by default.
- `relationships.from_id`/`to_id` are polymorphic (their meaning depends on
  the sibling `from_type`/`to_type` column), so SQLite cannot declare a
  direct `FOREIGN KEY` on them. Validate polymorphic references at the
  application layer (the seed-data build pipeline's `KeyRegistry` does
  this at insert time -- see `cli/src/build/inserters.ts`).

## Core tables

| Table | Purpose |
| --- | --- |
| `repositories` | One row per analyzed repo snapshot (name, commit, branch, analysis timestamp, catalog schema version). |
| `files` | File inventory: category/purpose/importance/in-scope flags, source hash for staleness detection. |
| `symbols` | Functions/classes/types/etc. within a file: kind, signature, line range, purpose, architectural role, reusability and application-coupling judgments. |
| `modules` | A named ownership boundary (e.g. `agent-runtime-core`, `ai-provider-package`) grouping files with a purpose/responsibilities/extraction-relevance narrative. |
| `module_files` | Many-to-many join: which files belong to which module, with a role label. |
| `capabilities` | A named runtime capability (e.g. "agent loop", "tool approval") with a description and implementation summary. |
| `capability_symbols` | Which symbols implement a capability, in what role, in what order. |
| `evidence` | A specific claim tied to a file/symbol/line-range with an evidence type and a 0.0-1.0 confidence score. |
| `relationships` | A typed edge between two catalog entities (polymorphic `from_type`/`to_type`), optionally backed by an `evidence` row. |
| `flows` | A named end-to-end sequence (e.g. "new agent request", "tool call"). |
| `flow_steps` | Ordered steps within a flow, each optionally tied to a symbol/file. |
| `data_types` | A named data shape (message/event/session/run/tool-call/credential/etc.), optionally tied to the symbol that defines it. |
| `data_fields` | Fields of a `data_types` row, with sensitivity/persistence/provider-specificity flags. |
| `events` | A named runtime event (e.g. a terminal-outcome tag, a stream event), optionally tied to a `data_types` payload shape. |
| `event_producers` / `event_consumers` | Which symbols emit/consume a given event. |
| `tools` | An agent-invocable tool: implementation/registration symbols, schemas, approval/sandbox policy, side effects. |
| `skills` | A Markdown-based (SKILL.md) agent skill: source file, loader/invocation symbols, instruction source, tool exposure, lifecycle. |
| `memory_systems` | A distinct memory mechanism (conversation history, session summary, semantic index, etc.) with write/retrieval paths and retention policy. |
| `persistence_entities` | A durable storage entity (typically a SQLite table) with its schema location, writer/reader symbols, and concurrency/recovery notes. |
| `snippets` | A focused (5-40 line) source excerpt with an explanation and architectural-significance note; `content_hash` (first 16 hex chars of SHA-256) supports staleness detection. |
| `evidence` | See above. |
| `findings` | A named architectural finding/recommendation, optionally backed by an `evidence` row. |
| `open_questions` | A named unresolved question with what was inspected, why it's unresolved, a likely interpretation, and a suggested verification method. `status` values used by this catalog: `open`, `investigating`, `resolved`, `wontfix`. |

## Full-text search: `catalog_search`

An FTS5 virtual table (`entity_type`, `entity_id` UNINDEXED, `title`,
`body`, `keywords`, `source_path`) covering files, symbols, capabilities,
flows, flow steps, snippets, skills, tools, memory systems, findings, and
open questions.

**Design choice: an explicit rebuild command instead of triggers.**
`schema/001_initial.sql` intentionally does not define `AFTER INSERT`
triggers to keep `catalog_search` in sync automatically. Given how many
tables feed the index (11+), trigger-maintained sync is easy to get subtly
wrong (a new insert path added later that forgets to fire the trigger,
partial updates, etc.) and hard to audit. Instead,
`cli/src/build/rebuild-search.ts` exports `rebuildSearchIndex(db)`, which
deletes and deterministically repopulates the whole table from the base
tables in one pass. It runs automatically at the end of
`npm run build-db`, and can be re-run standalone via `npm run
rebuild-search`. `rebuildSearchIndex` also injects a small category ->
synonym map (see the file) so natural-language queries like "resume" or
"function calling" hit rows tagged with the matching but differently-named
category (`session` / `tool-runtime`).

## Views (`schema/003_views.sql`)

| View | Purpose |
| --- | --- |
| `critical_symbols` | Symbols with `importance = 'critical'`, joined to their file. |
| `capability_map` | Every capability joined to its ordered/roled symbols and their source location. |
| `flow_map` | Every flow joined to its ordered steps and each step's source location. |
| `tool_map` | Every tool joined to its implementation and registration symbols/locations. |
| `skill_map` | Every skill joined to its source file, loader symbol, and invocation symbol. |
| `memory_map` | `memory_systems`, ordered by category -- a thin view since the base table is already close to the desired shape. |
| `extraction_candidates` | Symbols with `reusable = 1` and `application_coupling IN ('low','medium')`, ordered by coupling then importance. |
| `unresolved_high_priority` | `open_questions` with `priority = 'high'` and `status NOT IN ('resolved','wontfix')`. |
| `source_evidence_map` | `evidence` joined to its file/symbol, ordered by confidence descending. |

## Regenerating

```bash
cd cli
npm install
npm run build        # tsc
npm run build-db      # drops + rebuilds catalog.sqlite from schema/*.sql + seed data, then rebuilds the FTS index
npm run generate-reports
```

`npm run build-db` alone is idempotent and safe to re-run; it always
starts from a clean file (`rmSync` if present) rather than attempting an
in-place migration, since this is a generated artifact, not a live
runtime database.
