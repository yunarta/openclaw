import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

// cli/dist/db.js -> agent-catalog/catalog.sqlite
export const DEFAULT_DB_PATH = path.resolve(here, "..", "..", "catalog.sqlite");
export const SCHEMA_DIR = path.resolve(here, "..", "..", "schema");

export interface OpenCatalogOptions {
  readOnly?: boolean;
}

/**
 * Opens the catalog database. Foreign key enforcement is turned on
 * explicitly since node:sqlite does not enable it by default.
 */
export function openCatalog(dbPath: string = DEFAULT_DB_PATH, options: OpenCatalogOptions = {}): DatabaseSync {
  const db = new DatabaseSync(dbPath, { readOnly: options.readOnly ?? false });
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}
