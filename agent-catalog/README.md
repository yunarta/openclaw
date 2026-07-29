# Agent Catalog

A queryable architecture knowledge base for OpenClaw's agentic runtime,
built to help a future AI coding agent extract a standalone agentic REST
API gateway from this codebase.

**The SQLite database (`catalog.sqlite`) is authoritative.** Everything
under `reports/` is a derived rendering of it, regenerated with a script,
not a second source of truth. Query the database through the CLI or the
helper library -- do not re-grep the repository to answer questions this
catalog already answers.

## Quick start

```bash
# Query the pre-built database
node cli/dist/cli.js stats
node cli/dist/cli.js capability "agent loop"
node cli/dist/cli.js flow "tool call"
node cli/dist/cli.js symbol runEmbeddedAgent
node cli/dist/cli.js search "Codex OAuth refresh" --json

# Rebuild everything from schema/ + seed data (deterministic)
cd cli
npm install
npm run build
npm run build-db
npm run generate-reports
```

## Layout

```text
agent-catalog/
├── README.md              -- this file
├── PROGRESS.md             -- what's cataloged, what's pending/blocked
├── SCHEMA.md                -- table-by-table reference
├── EXTRACTION-GUIDE.md      -- target architecture for a standalone gateway
├── OPEN-QUESTIONS.md        -- unresolved questions, generated from the DB
├── catalog.sqlite           -- THE authoritative database
├── schema/                  -- DDL migrations (001_initial, 002_indexes, 003_views)
├── cli/                     -- Node+TS query CLI and the DB build pipeline
│   └── src/build/           -- schema application, seed data, FTS rebuild, report generation
├── helpers/                 -- agent-catalog.ts: typed, parameterized-SQL query library
└── reports/                 -- Markdown reports generated FROM the database
```

## How this catalog was built

See `PROGRESS.md` for the full account, including a mid-task resource
constraint (nine parallel research subagents failed simultaneously after
the session hit its monthly spend limit) that shifted research from
delegated subagents to direct first-hand `Grep`/`Read`/`Glob` calls. That
shift traded breadth for verification confidence: every symbol, flow step,
and finding in the database is either `confirmed` (read directly this
pass) or explicitly marked `inferred` with a linked `open_questions` entry
explaining what's missing and how to close the gap. Nothing here fakes a
line number or a confirmed status.

## What you can ask it

```bash
node cli/dist/cli.js search "how does tool result return to model"
node cli/dist/cli.js search "where is codex oauth refreshed"
node cli/dist/cli.js capability "tool result continuation"
node cli/dist/cli.js flow "resumed agent session"
node cli/dist/cli.js symbol "runAgentTurn"
node cli/dist/cli.js snippet "OAuth refresh"
node cli/dist/cli.js related "executeToolCall"
node cli/dist/cli.js search "reusable low coupling agent runtime"
```

See `cli/README` usage text (`node cli/dist/cli.js --help`) for the full
command/flag list, and `helpers/README.md` for the programmatic API.
