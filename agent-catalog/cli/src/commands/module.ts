import { printJson } from "../formatters/json.js";
import type { CommandContext } from "./types.js";

interface ModuleRow {
  id: number;
  name: string;
  root_path: string;
  category: string;
  purpose: string | null;
  responsibilities: string | null;
  non_responsibilities: string | null;
  public_surface: string | null;
  runtime_behavior: string | null;
  extraction_relevance: string | null;
  extraction_difficulty: string | null;
  status: string;
}

interface ModuleFileRow {
  path: string;
  role: string | null;
  category: string | null;
  importance: string | null;
}

/** Prints a module's ownership summary and its member files. */
export function runModule(ctx: CommandContext): void {
  const { db, query, flags } = ctx;
  if (!query.trim()) {
    console.error("module requires a name, e.g. agent-catalog module agent-runtime-core");
    process.exitCode = 1;
    return;
  }

  const mod = db
    .prepare(`SELECT * FROM modules WHERE name = ? OR name LIKE ? ORDER BY (name = ?) DESC LIMIT 1`)
    .get(query, `%${query}%`, query) as unknown as ModuleRow | undefined;

  if (!mod) {
    if (flags.json) {
      printJson(null);
    } else {
      console.log(`No module found matching "${query}".`);
    }
    return;
  }

  const files = db
    .prepare(
      `SELECT f.path, mf.role, f.category, f.importance FROM module_files mf
       JOIN files f ON f.id = mf.file_id WHERE mf.module_id = ? ORDER BY f.importance, f.path`,
    )
    .all(mod.id) as unknown as ModuleFileRow[];

  if (flags.json) {
    printJson({ ...mod, files });
    return;
  }

  console.log(`Module: ${mod.name}`);
  console.log(`Root: ${mod.root_path}    Category: ${mod.category}    Status: ${mod.status}`);
  if (mod.purpose) console.log(`\nPurpose: ${mod.purpose}`);
  if (mod.responsibilities) console.log(`Responsibilities: ${mod.responsibilities}`);
  if (mod.non_responsibilities) console.log(`Non-responsibilities: ${mod.non_responsibilities}`);
  if (mod.public_surface) console.log(`Public surface: ${mod.public_surface}`);
  if (mod.runtime_behavior) console.log(`Runtime behavior: ${mod.runtime_behavior}`);
  if (mod.extraction_relevance) console.log(`Extraction relevance: ${mod.extraction_relevance}`);
  if (mod.extraction_difficulty) console.log(`Extraction difficulty: ${mod.extraction_difficulty}`);
  console.log(`\nFiles (${files.length}):`);
  for (const f of files) {
    console.log(`  - ${f.path}${f.role ? ` [${f.role}]` : ""}`);
  }
}
