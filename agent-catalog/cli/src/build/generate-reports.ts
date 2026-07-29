#!/usr/bin/env node
/**
 * Generates the derived Markdown reports under agent-catalog/reports/ from
 * the current catalog.sqlite. The database is authoritative; these reports
 * are a rendering of it, not a second source of truth. Re-run after every
 * `npm run build-db`.
 *
 * Report bodies are built as arrays of plain (non-template-literal) lines
 * joined with "\n" -- markdown code-span backticks are ordinary characters
 * in a regular string, so this sidesteps any collision with JS template
 * literal delimiters.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { openCatalog } from "../db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.resolve(here, "..", "..", "..", "reports");
const CATALOG_ROOT = path.resolve(here, "..", "..", "..");

interface Capability {
  id: number;
  name: string;
  category: string;
  status: string;
  maturity: string | null;
  description: string | null;
  implementation_summary: string | null;
}

interface FlowMapRow {
  flow_name: string;
  flow_category: string;
  flow_status: string;
  step_order: number | null;
  step_title: string | null;
  step_description: string | null;
  symbol_name: string | null;
  file_path: string | null;
  start_line: number | null;
  end_line: number | null;
}

function getCapability(db: DatabaseSync, name: string): Capability | undefined {
  return db.prepare("SELECT * FROM capabilities WHERE name = ?").get(name) as unknown as
    | Capability
    | undefined;
}

function renderCapability(cap: Capability | undefined): string[] {
  if (!cap) return ["_Not cataloged._", ""];
  const lines = [
    "**Status:** " +
      cap.status +
      "  **Category:** " +
      cap.category +
      "  **Maturity:** " +
      (cap.maturity ?? "unknown"),
    "",
  ];
  if (cap.description) lines.push(cap.description, "");
  if (cap.implementation_summary) lines.push("> " + cap.implementation_summary, "");
  return lines;
}

function renderFlow(db: DatabaseSync, name: string): string[] {
  const rows = db
    .prepare("SELECT * FROM flow_map WHERE flow_name = ? ORDER BY step_order")
    .all(name) as unknown as FlowMapRow[];
  if (rows.length === 0 || !rows[0]) return ["_Not cataloged._", ""];
  const lines: string[] = [
    "**Status:** " + rows[0].flow_status + "  **Category:** " + rows[0].flow_category,
    "",
  ];
  for (const row of rows) {
    if (row.step_order === null) continue;
    const loc = row.file_path
      ? "`" +
        row.file_path +
        (row.start_line ? ":" + row.start_line + (row.end_line ? "-" + row.end_line : "") : "") +
        "`"
      : "";
    const symbol = row.symbol_name ? "(`" + row.symbol_name + "`) " : "";
    lines.push(row.step_order + ". **" + row.step_title + "** " + symbol + loc);
    lines.push("   " + row.step_description);
  }
  lines.push("");
  return lines;
}

function renderModuleTable(db: DatabaseSync, names: string[]): string[] {
  const lines = [
    "| Module | Extraction relevance | Extraction difficulty | Status |",
    "| --- | --- | --- | --- |",
  ];
  for (const name of names) {
    const row = db.prepare("SELECT * FROM modules WHERE name = ?").get(name) as unknown as
      | {
          name: string;
          extraction_relevance: string | null;
          extraction_difficulty: string | null;
          status: string;
        }
      | undefined;
    if (!row) continue;
    lines.push(
      "| " +
        row.name +
        " | " +
        (row.extraction_relevance ?? "?") +
        " | " +
        (row.extraction_difficulty ?? "?") +
        " | " +
        row.status +
        " |",
    );
  }
  lines.push("");
  return lines;
}

function statsBlock(db: DatabaseSync): string[] {
  const tables = [
    "files",
    "symbols",
    "modules",
    "capabilities",
    "flows",
    "flow_steps",
    "snippets",
    "evidence",
    "findings",
    "open_questions",
  ];
  const lines = ["| Table | Rows |", "| --- | --- |"];
  for (const t of tables) {
    const row = db.prepare("SELECT COUNT(*) AS n FROM " + t).get() as { n: number };
    lines.push("| " + t + " | " + row.n + " |");
  }
  lines.push("");
  return lines;
}

function findingsBlock(db: DatabaseSync, category?: string): string[] {
  const rows = (category
    ? db.prepare("SELECT * FROM findings WHERE category = ?").all(category)
    : db.prepare("SELECT * FROM findings").all()) as unknown as Array<{
    title: string;
    description: string;
    recommendation: string | null;
  }>;
  if (rows.length === 0) return ["_None recorded._", ""];
  const lines: string[] = [];
  for (const r of rows) {
    lines.push("- **" + r.title + "** -- " + r.description);
    if (r.recommendation) lines.push("  Recommendation: " + r.recommendation);
  }
  lines.push("");
  return lines;
}

function openQuestionsBlock(db: DatabaseSync, category?: string): string[] {
  const rows = (category
    ? db.prepare("SELECT * FROM open_questions WHERE category = ? ORDER BY priority").all(category)
    : db.prepare("SELECT * FROM open_questions ORDER BY priority").all()) as unknown as Array<{
    question: string;
    priority: string | null;
    likely_interpretation: string | null;
  }>;
  if (rows.length === 0) return ["_None recorded._", ""];
  const lines: string[] = [];
  for (const r of rows) {
    lines.push("- [" + (r.priority ?? "?") + "] " + r.question);
    if (r.likely_interpretation) lines.push("  Likely: " + r.likely_interpretation);
  }
  lines.push("");
  return lines;
}

function writeReport(name: string, lines: string[]): void {
  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(path.join(REPORTS_DIR, name), lines.join("\n") + "\n", "utf8");
  console.log("Wrote reports/" + name);
}

function writeTopLevelDoc(name: string, lines: string[]): void {
  writeFileSync(path.join(CATALOG_ROOT, name), lines.join("\n") + "\n", "utf8");
  console.log("Wrote " + name);
}

interface OpenQuestionRow {
  id: number;
  category: string;
  question: string;
  evidence_inspected: string | null;
  reason_unresolved: string | null;
  likely_interpretation: string | null;
  verification_method: string | null;
  priority: string | null;
  status: string;
}

function generateOpenQuestionsDoc(db: DatabaseSync): void {
  const rows = db
    .prepare("SELECT * FROM open_questions ORDER BY (priority = 'high') DESC, category, id")
    .all() as unknown as OpenQuestionRow[];
  const byPriority = { high: 0, medium: 0, low: 0, other: 0 };
  for (const r of rows) {
    const key = (r.priority ?? "other") as keyof typeof byPriority;
    if (key in byPriority) byPriority[key]++;
    else byPriority.other++;
  }

  const lines: string[] = [
    "# Open Questions",
    "",
    "Generated from the `open_questions` table in `catalog.sqlite`. Do not",
    "hand-edit; run `npm run generate-reports` (inside `cli/`) after changing",
    "seed data. Query live with:",
    "",
    "```bash",
    'node cli/dist/cli.js search "<topic>" --json',
    "```",
    "",
    "or `SELECT * FROM unresolved_high_priority;` directly against `catalog.sqlite`.",
    "",
    "## Summary",
    "",
    "| Priority | Count |",
    "| --- | --- |",
    "| high | " + byPriority.high + " |",
    "| medium | " + byPriority.medium + " |",
    "| low | " + byPriority.low + " |",
    "",
  ];

  for (const row of rows) {
    lines.push("## [" + (row.priority ?? "unset") + "] " + row.question);
    lines.push("");
    lines.push("- **Category:** " + row.category);
    lines.push("- **Status:** " + row.status);
    if (row.evidence_inspected) lines.push("- **Evidence inspected:** " + row.evidence_inspected);
    if (row.reason_unresolved) lines.push("- **Why unresolved:** " + row.reason_unresolved);
    if (row.likely_interpretation)
      lines.push("- **Likely interpretation:** " + row.likely_interpretation);
    if (row.verification_method) lines.push("- **How to verify:** " + row.verification_method);
    lines.push("");
  }

  writeTopLevelDoc("OPEN-QUESTIONS.md", lines);
}

function main(): void {
  const db = openCatalog(undefined, { readOnly: true });
  try {
    writeReport("architecture-summary.md", [
      "# Architecture Summary",
      "",
      "Generated from `catalog.sqlite`. Do not hand-edit; run `npm run generate-reports` after changing seed data.",
      "",
      "## Catalog statistics",
      "",
      ...statsBlock(db),
      "## The two-layer runtime shape",
      "",
      'OpenClaw\'s agent runtime is two layers: a pluggable **AgentHarness** contract (`src/agents/harness/`) that any execution engine implements, and one built-in implementation of it -- the **embedded runner** (`src/agents/embedded-agent-runner/`) -- registered as the `"openclaw"` harness. Codex is a second, independent harness implementation that drives the actual `@openai/codex` CLI as a subprocess.',
      "",
      "## The reusable core",
      "",
      "`packages/ai` (published as `@openclaw/ai`) implements the actual provider wire protocols and stream normalization, with zero dependency on OpenClaw core. `src/llm/stream.ts` is a thin OpenClaw-specific facade over it.",
      "",
      "## Module map",
      "",
      ...renderModuleTable(db, [
        "agent-runtime-core",
        "agent-harness-registry",
        "ai-provider-package",
        "llm-facade",
        "provider-codex",
        "provider-anthropic",
        "tool-runtime",
        "sub-agent-delegation",
        "skill-runtime",
        "memory-context-engine",
        "session-persistence",
        "long-running-jobs",
        "auth-and-secrets",
      ]),
      'See `SCHEMA.md` for the full table reference and the CLI (`node cli/dist/cli.js capability "<name>"`, `flow "<name>"`, `module "<name>"`) for query access to everything summarized here.',
    ]);

    writeReport("agent-loop.md", [
      "# Agent Loop",
      "",
      "## Capability: agent loop",
      "",
      ...renderCapability(getCapability(db, "agent loop")),
      "## Flow: new agent request",
      "",
      ...renderFlow(db, "new agent request"),
      "## Flow: cancellation",
      "",
      ...renderFlow(db, "cancellation"),
      "## Flow: provider fallback",
      "",
      ...renderFlow(db, "provider fallback"),
      "## Related capabilities",
      "",
      "### retry",
      "",
      ...renderCapability(getCapability(db, "retry")),
      "### usage accounting",
      "",
      ...renderCapability(getCapability(db, "usage accounting")),
      "## Findings",
      "",
      ...findingsBlock(db, "architecture"),
    ]);

    writeReport("provider-comparison.md", [
      "# Provider Comparison: Codex vs. Claude",
      "",
      "## Codex provider",
      "",
      ...renderCapability(getCapability(db, "Codex provider")),
      "## Claude provider",
      "",
      ...renderCapability(getCapability(db, "Claude provider")),
      "## Stream normalization",
      "",
      ...renderCapability(getCapability(db, "stream normalization")),
      "## Reasoning events",
      "",
      ...renderCapability(getCapability(db, "reasoning events")),
      "### Flow: Codex request",
      "",
      ...renderFlow(db, "Codex request"),
      "### Flow: Claude request",
      "",
      ...renderFlow(db, "Claude request"),
      "## Key asymmetry",
      "",
      'Codex is integrated as a full **AgentHarness** (drives the `@openai/codex` CLI\'s app-server as a subprocess). Claude/Anthropic is integrated primarily as a **provider adapter** (the embedded runner calls the Anthropic Messages API directly through `packages/ai`), with an *opt-in* CLI-backend fork (`cliBackendDispatch: "subscription-auth"`) used only to keep usage on subscription plan limits rather than metered billing. These are not equivalent lifecycle models -- see `OPEN-QUESTIONS.md` for what remains unverified about each.',
      "",
      "## Open questions",
      "",
      ...openQuestionsBlock(db, "authentication"),
    ]);

    writeReport("tool-runtime.md", [
      "# Tool Runtime",
      "",
      "## Tool registration",
      "",
      ...renderCapability(getCapability(db, "tool registration")),
      "## Tool dispatch",
      "",
      ...renderCapability(getCapability(db, "tool dispatch")),
      "## Tool approval",
      "",
      ...renderCapability(getCapability(db, "tool approval")),
      "## Tool execution",
      "",
      ...renderCapability(getCapability(db, "tool execution")),
      "## MCP",
      "",
      ...renderCapability(getCapability(db, "MCP")),
      "## Flow: tool call",
      "",
      ...renderFlow(db, "tool call"),
      "## Flow: tool approval",
      "",
      ...renderFlow(db, "tool approval"),
      "## Open questions",
      "",
      ...openQuestionsBlock(db, "tool-runtime"),
    ]);

    const memorySystemRows = db.prepare("SELECT * FROM memory_map").all() as unknown as Array<{
      name: string;
      category: string;
      storage_backend: string | null;
      status: string;
    }>;
    writeReport("memory-runtime.md", [
      "# Memory Runtime",
      "",
      "## Context selection",
      "",
      ...renderCapability(getCapability(db, "context selection")),
      "## Compaction",
      "",
      ...renderCapability(getCapability(db, "compaction")),
      "## Memory write",
      "",
      ...renderCapability(getCapability(db, "memory write")),
      "## Memory retrieval",
      "",
      ...renderCapability(getCapability(db, "memory retrieval")),
      "## Persisted memory systems (per `memory_systems` table)",
      "",
      ...memorySystemRows.map(
        (m) =>
          "- **" +
          m.name +
          "** (" +
          m.category +
          ", " +
          m.status +
          ") -- backend: " +
          (m.storage_backend ?? "unknown"),
      ),
      "",
      "## Open questions",
      "",
      ...openQuestionsBlock(db, "memory"),
    ]);

    const skillRows = db.prepare("SELECT * FROM skill_map").all() as unknown as Array<{
      name: string;
      source_path: string | null;
      status: string;
      description: string | null;
    }>;
    writeReport("skill-runtime.md", [
      "# Skill Runtime",
      "",
      "## Skills",
      "",
      ...renderCapability(getCapability(db, "skills")),
      "## Cataloged skills (sample, per `skill_map` view)",
      "",
      ...skillRows.map(
        (s) =>
          "- **" +
          s.name +
          "** (" +
          s.status +
          ") -- `" +
          (s.source_path ?? "?") +
          "`" +
          (s.description ? " -- " + s.description : ""),
      ),
      "",
      "## Open questions",
      "",
      ...openQuestionsBlock(db, "skills"),
    ]);

    const persistenceRows = db
      .prepare("SELECT name, category, storage_backend, status FROM persistence_entities")
      .all() as unknown as Array<{
      name: string;
      category: string;
      storage_backend: string | null;
      status: string;
    }>;
    writeReport("long-running-execution.md", [
      "# Long-Running Execution",
      "",
      "## Long-running jobs",
      "",
      ...renderCapability(getCapability(db, "long-running jobs")),
      "## Checkpointing",
      "",
      ...renderCapability(getCapability(db, "checkpointing")),
      "## Session persistence",
      "",
      ...renderCapability(getCapability(db, "session persistence")),
      "## Session resume",
      "",
      ...renderCapability(getCapability(db, "session resume")),
      "## Cancellation",
      "",
      ...renderCapability(getCapability(db, "cancellation")),
      "## Flow: checkpoint save",
      "",
      ...renderFlow(db, "checkpoint save"),
      "## Flow: long-running run",
      "",
      ...renderFlow(db, "long-running run"),
      "## Flow: run resume",
      "",
      ...renderFlow(db, "run resume"),
      "## Persistence entities (per `persistence_entities` table)",
      "",
      ...persistenceRows.map(
        (p) =>
          "- **" +
          p.name +
          "** (" +
          p.category +
          ", " +
          p.status +
          ") -- " +
          (p.storage_backend ?? "unknown backend"),
      ),
      "",
      "## Open questions",
      "",
      ...openQuestionsBlock(db, "long-running-execution"),
    ]);

    const extractionRows = db
      .prepare(
        "SELECT name, kind, file_path, importance, application_coupling FROM extraction_candidates",
      )
      .all() as unknown as Array<{
      name: string;
      kind: string;
      file_path: string;
      importance: string | null;
      application_coupling: string | null;
    }>;
    const extractionLines =
      extractionRows.length > 0
        ? extractionRows.map(
            (r) =>
              "- `" +
              r.name +
              "` (" +
              r.kind +
              ", " +
              (r.importance ?? "?") +
              " importance, " +
              r.application_coupling +
              " coupling) -- " +
              r.file_path,
          )
        : [
            "_None marked reusable with low/medium coupling yet at the symbol level -- most cataloged symbols this pass are OpenClaw-internal orchestration, not extraction targets themselves. See `packages/ai` and `src/tools/types.ts` as file/module-level (not yet symbol-level) extraction candidates._",
          ];
    const allOpenQuestions = openQuestionsBlock(db);
    const highPriorityLines = allOpenQuestions.filter((l) => l.startsWith("- [high]"));
    writeReport("extraction-plan.md", [
      "# Extraction Plan (summary)",
      "",
      "Full guidance lives in `../EXTRACTION-GUIDE.md`; this report is the database-derived quick reference.",
      "",
      "## Extraction candidates (per `extraction_candidates` view)",
      "",
      ...extractionLines,
      "",
      "## Module-level extraction relevance",
      "",
      ...renderModuleTable(db, [
        "ai-provider-package",
        "agent-harness-registry",
        "tool-runtime",
        "session-persistence",
        "agent-runtime-core",
        "provider-codex",
        "provider-anthropic",
        "skill-runtime",
        "memory-context-engine",
        "long-running-jobs",
        "sub-agent-delegation",
        "auth-and-secrets",
      ]),
      "## Unresolved high-priority questions",
      "",
      ...(highPriorityLines.length > 0 ? highPriorityLines : ["_None._"]),
    ]);

    generateOpenQuestionsDoc(db);

    console.log("All reports generated.");
  } finally {
    db.close();
  }
}

main();
