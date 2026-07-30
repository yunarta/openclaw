#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { DEFAULT_DB_PATH, SCHEMA_DIR } from "../db.js";
import { insertAll } from "./inserters.js";
import { rebuildSearchIndex } from "./rebuild-search.js";
import { buildCatalogSeed } from "./seed-data/index.js";

function applySchema(db: DatabaseSync): void {
  const migrationFiles = readdirSync(SCHEMA_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const name of migrationFiles) {
    const sql = readFileSync(path.join(SCHEMA_DIR, name), "utf8");
    db.exec(sql);
    console.log(`Applied schema/${name}`);
  }
}

function printStats(db: DatabaseSync): void {
  const tables = [
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
    "tools",
    "skills",
    "memory_systems",
    "persistence_entities",
    "snippets",
    "findings",
    "open_questions",
    "catalog_search",
  ];
  for (const table of tables) {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number };
    console.log(`  ${table}: ${row.n}`);
  }
}

async function main(): Promise<void> {
  mkdirSync(path.dirname(DEFAULT_DB_PATH), { recursive: true });
  if (existsSync(DEFAULT_DB_PATH)) {
    rmSync(DEFAULT_DB_PATH);
  }
  console.log(`Building ${DEFAULT_DB_PATH} ...`);

  const db = new DatabaseSync(DEFAULT_DB_PATH);
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    applySchema(db);

    const seed = buildCatalogSeed();
    db.exec("BEGIN");
    try {
      insertAll(db, seed);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    console.log("Seed data inserted.");

    rebuildSearchIndex(db);
    console.log("Search index built.");

    console.log("Row counts:");
    printStats(db);

    const integrity = db.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
    console.log(`Integrity check: ${integrity.integrity_check}`);

    const fkViolations = db.prepare("PRAGMA foreign_key_check").all();
    console.log(`Foreign key violations: ${fkViolations.length}`);
    if (fkViolations.length > 0) {
      console.error(fkViolations);
      process.exitCode = 1;
    }
  } finally {
    db.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
