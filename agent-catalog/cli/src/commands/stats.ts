import { printJson } from "../formatters/json.js";
import type { CommandContext } from "./types.js";

const TABLES = [
  "repositories",
  "files",
  "symbols",
  "modules",
  "module_files",
  "capabilities",
  "capability_symbols",
  "evidence",
  "relationships",
  "flows",
  "flow_steps",
  "data_types",
  "data_fields",
  "events",
  "event_producers",
  "event_consumers",
  "tools",
  "skills",
  "memory_systems",
  "persistence_entities",
  "snippets",
  "findings",
  "open_questions",
  "catalog_search",
];

/** Row counts for every catalog table, plus a quick integrity check -- the fastest way to sanity-check the database after a rebuild. */
export function runStats(ctx: CommandContext): void {
  const { db, flags } = ctx;

  const counts: Record<string, number> = {};
  for (const table of TABLES) {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number };
    counts[table] = row.n;
  }

  const integrity = db.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
  const fkViolations = db.prepare("PRAGMA foreign_key_check").all().length;

  const highPriorityOpen = db
    .prepare(
      `SELECT COUNT(*) AS n FROM open_questions WHERE priority = 'high' AND status NOT IN ('resolved','wontfix')`,
    )
    .get() as { n: number };

  if (flags.json) {
    printJson({
      counts,
      integrityCheck: integrity.integrity_check,
      foreignKeyViolations: fkViolations,
      unresolvedHighPriorityQuestions: highPriorityOpen.n,
    });
    return;
  }

  console.log("Agent Catalog Stats");
  console.log("====================");
  for (const table of TABLES) {
    console.log(`${table.padEnd(24)} ${counts[table]}`);
  }
  console.log("");
  console.log(`Integrity check: ${integrity.integrity_check}`);
  console.log(`Foreign key violations: ${fkViolations}`);
  console.log(`Unresolved high-priority open questions: ${highPriorityOpen.n}`);
}
