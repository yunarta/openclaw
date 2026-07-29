import path from "node:path";
/**
 * Programmatic helper library for the OpenClaw agent-catalog SQLite database.
 *
 * Future agents and scripts should use this module rather than querying
 * catalog.sqlite's table internals directly, so query shape stays
 * consistent with the CLI (agent-catalog/cli/) and stays in one place to
 * update if the schema changes. All queries are parameterized; nothing
 * here builds SQL by string-concatenating caller input.
 *
 * Requires a Node.js version with node:sqlite support (>=22.5.0). Run with
 * a TypeScript-capable runtime, e.g.:
 *   npx tsx -e 'import { openAgentCatalog } from "./agent-catalog.js"; ...'
 * or compile with the sibling cli/ package's tsconfig conventions.
 */
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.resolve(here, "..", "catalog.sqlite");

export interface SearchOptions {
  limit?: number;
  entityType?: string;
}

export interface SearchResult {
  entityType: string;
  entityId: number;
  title: string;
  body: string;
  sourcePath: string | null;
}

export interface SymbolRecord {
  id: number;
  name: string;
  qualifiedName: string | null;
  kind: string;
  signature: string | null;
  path: string;
  startLine: number | null;
  endLine: number | null;
  purpose: string | null;
  architecturalRole: string | null;
  importance: string | null;
  status: string;
  reusable: boolean | null;
  applicationCoupling: string | null;
}

export interface CapabilitySymbolEntry {
  symbolId: number;
  symbolName: string;
  role: string;
  sequenceOrder: number | null;
  filePath: string | null;
  startLine: number | null;
  endLine: number | null;
}

export interface CapabilityRecord {
  id: number;
  name: string;
  category: string;
  status: string;
  maturity: string | null;
  reusable: boolean | null;
  description: string | null;
  implementationSummary: string | null;
  symbols: CapabilitySymbolEntry[];
}

export interface FlowStepRecord {
  stepOrder: number;
  title: string;
  description: string;
  symbolName: string | null;
  filePath: string | null;
  startLine: number | null;
  endLine: number | null;
  alternatePath: string | null;
}

export interface FlowRecord {
  id: number;
  name: string;
  category: string;
  status: string;
  description: string | null;
  terminationCondition: string | null;
  errorBehavior: string | null;
  steps: FlowStepRecord[];
}

export interface RelatedSymbol {
  direction: "outgoing" | "incoming";
  relationshipType: string;
  otherType: string;
  otherName: string;
  description: string | null;
}

export interface SnippetRecord {
  id: number;
  title: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  explanation: string;
  architecturalSignificance: string | null;
}

export interface ExtractionCandidate {
  symbolId: number;
  name: string;
  kind: string;
  filePath: string;
  startLine: number | null;
  endLine: number | null;
  importance: string | null;
  applicationCoupling: string | null;
  purpose: string | null;
}

export interface AgentCatalog {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getSymbol(name: string): Promise<SymbolRecord[]>;
  getCapability(name: string): Promise<CapabilityRecord | null>;
  getFlow(name: string): Promise<FlowRecord | null>;
  getRelatedSymbols(symbol: string): Promise<RelatedSymbol[]>;
  getSnippetsForSymbol(symbol: string): Promise<SnippetRecord[]>;
  getExtractionCandidates(): Promise<ExtractionCandidate[]>;
  close(): void;
}

class SqliteAgentCatalog implements AgentCatalog {
  constructor(private readonly db: DatabaseSync) {}

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit ?? 20;
    const matchQuery = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `"${term.replace(/"/g, '""')}"`)
      .join(" OR ");
    if (!matchQuery) return [];

    let sql = `SELECT entity_type, entity_id, title, body, source_path
               FROM catalog_search WHERE catalog_search MATCH ?`;
    const params: unknown[] = [matchQuery];
    if (options.entityType) {
      sql += ` AND entity_type = ?`;
      params.push(options.entityType);
    }
    sql += ` ORDER BY rank LIMIT ?`;
    params.push(limit);

    const rows = this.db.prepare(sql).all(...(params as [])) as unknown as Array<{
      entity_type: string;
      entity_id: number;
      title: string;
      body: string;
      source_path: string | null;
    }>;
    return rows.map((r) => ({
      entityType: r.entity_type,
      entityId: r.entity_id,
      title: r.title,
      body: r.body,
      sourcePath: r.source_path,
    }));
  }

  async getSymbol(name: string): Promise<SymbolRecord[]> {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.name, s.qualified_name, s.kind, s.signature, f.path, s.start_line, s.end_line,
                s.purpose, s.architectural_role, s.importance, s.status, s.reusable, s.application_coupling
         FROM symbols s JOIN files f ON f.id = s.file_id
         WHERE s.name = ? OR s.name LIKE ? OR s.qualified_name LIKE ?
         ORDER BY (s.name = ?) DESC, s.importance`,
      )
      .all(name, `%${name}%`, `%${name}%`, name) as unknown as Array<{
      id: number;
      name: string;
      qualified_name: string | null;
      kind: string;
      signature: string | null;
      path: string;
      start_line: number | null;
      end_line: number | null;
      purpose: string | null;
      architectural_role: string | null;
      importance: string | null;
      status: string;
      reusable: number | null;
      application_coupling: string | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      qualifiedName: r.qualified_name,
      kind: r.kind,
      signature: r.signature,
      path: r.path,
      startLine: r.start_line,
      endLine: r.end_line,
      purpose: r.purpose,
      architecturalRole: r.architectural_role,
      importance: r.importance,
      status: r.status,
      reusable: r.reusable === null ? null : Boolean(r.reusable),
      applicationCoupling: r.application_coupling,
    }));
  }

  async getCapability(name: string): Promise<CapabilityRecord | null> {
    const head = this.db
      .prepare(
        `SELECT id, name, category, status, maturity, reusable, description, implementation_summary
         FROM capabilities WHERE name = ? OR name LIKE ? ORDER BY (name = ?) DESC LIMIT 1`,
      )
      .get(name, `%${name}%`, name) as unknown as
      | {
          id: number;
          name: string;
          category: string;
          status: string;
          maturity: string | null;
          reusable: number | null;
          description: string | null;
          implementation_summary: string | null;
        }
      | undefined;
    if (!head) return null;

    const symbolRows = this.db
      .prepare(
        `SELECT symbol_id, symbol_name, role, sequence_order, file_path, start_line, end_line
         FROM capability_map WHERE capability_name = ? AND symbol_id IS NOT NULL ORDER BY sequence_order, role`,
      )
      .all(head.name) as unknown as Array<{
      symbol_id: number;
      symbol_name: string;
      role: string;
      sequence_order: number | null;
      file_path: string | null;
      start_line: number | null;
      end_line: number | null;
    }>;

    return {
      id: head.id,
      name: head.name,
      category: head.category,
      status: head.status,
      maturity: head.maturity,
      reusable: head.reusable === null ? null : Boolean(head.reusable),
      description: head.description,
      implementationSummary: head.implementation_summary,
      symbols: symbolRows.map((r) => ({
        symbolId: r.symbol_id,
        symbolName: r.symbol_name,
        role: r.role,
        sequenceOrder: r.sequence_order,
        filePath: r.file_path,
        startLine: r.start_line,
        endLine: r.end_line,
      })),
    };
  }

  async getFlow(name: string): Promise<FlowRecord | null> {
    const nameRow = this.db
      .prepare(
        `SELECT name FROM flows WHERE name = ? OR name LIKE ? ORDER BY (name = ?) DESC LIMIT 1`,
      )
      .get(name, `%${name}%`, name) as { name: string } | undefined;
    if (!nameRow) return null;

    const rows = this.db
      .prepare(`SELECT * FROM flow_map WHERE flow_name = ? ORDER BY step_order`)
      .all(nameRow.name) as unknown as Array<{
      flow_id: number;
      flow_name: string;
      flow_category: string;
      flow_status: string;
      termination_condition: string | null;
      error_behavior: string | null;
      step_order: number | null;
      step_title: string | null;
      step_description: string | null;
      symbol_name: string | null;
      file_path: string | null;
      start_line: number | null;
      end_line: number | null;
      alternate_path: string | null;
    }>;
    const [head] = rows;
    if (!head) return null;

    return {
      id: head.flow_id,
      name: head.flow_name,
      category: head.flow_category,
      status: head.flow_status,
      description: null,
      terminationCondition: head.termination_condition,
      errorBehavior: head.error_behavior,
      steps: rows
        .filter((r) => r.step_order !== null)
        .map((r) => ({
          stepOrder: r.step_order as number,
          title: r.step_title as string,
          description: r.step_description as string,
          symbolName: r.symbol_name,
          filePath: r.file_path,
          startLine: r.start_line,
          endLine: r.end_line,
          alternatePath: r.alternate_path,
        })),
    };
  }

  async getRelatedSymbols(symbol: string): Promise<RelatedSymbol[]> {
    const symbolRow = this.db
      .prepare(
        `SELECT id FROM symbols WHERE name = ? OR name LIKE ? ORDER BY (name = ?) DESC LIMIT 1`,
      )
      .get(symbol, `%${symbol}%`, symbol) as { id: number } | undefined;
    if (!symbolRow) return [];

    const resolveName = (type: string, id: number): string => {
      if (type === "symbol") {
        const row = this.db.prepare(`SELECT name FROM symbols WHERE id = ?`).get(id) as
          | { name: string }
          | undefined;
        return row?.name ?? `#${id}`;
      }
      try {
        const row = this.db.prepare(`SELECT name FROM ${type}s WHERE id = ?`).get(id) as
          | { name: string }
          | undefined;
        return row?.name ?? `#${id}`;
      } catch {
        return `#${id}`;
      }
    };

    const outgoing = this.db
      .prepare(
        `SELECT relationship_type, description, to_type, to_id FROM relationships WHERE from_type = 'symbol' AND from_id = ?`,
      )
      .all(symbolRow.id) as unknown as Array<{
      relationship_type: string;
      description: string | null;
      to_type: string;
      to_id: number;
    }>;
    const incoming = this.db
      .prepare(
        `SELECT relationship_type, description, from_type, from_id FROM relationships WHERE to_type = 'symbol' AND to_id = ?`,
      )
      .all(symbolRow.id) as unknown as Array<{
      relationship_type: string;
      description: string | null;
      from_type: string;
      from_id: number;
    }>;

    return [
      ...outgoing.map((r) => ({
        direction: "outgoing" as const,
        relationshipType: r.relationship_type,
        otherType: r.to_type,
        otherName: resolveName(r.to_type, r.to_id),
        description: r.description,
      })),
      ...incoming.map((r) => ({
        direction: "incoming" as const,
        relationshipType: r.relationship_type,
        otherType: r.from_type,
        otherName: resolveName(r.from_type, r.from_id),
        description: r.description,
      })),
    ];
  }

  async getSnippetsForSymbol(symbol: string): Promise<SnippetRecord[]> {
    const rows = this.db
      .prepare(
        `SELECT sn.id, sn.title, f.path, sn.start_line, sn.end_line, sn.content, sn.explanation, sn.architectural_significance
         FROM snippets sn
         JOIN files f ON f.id = sn.file_id
         LEFT JOIN symbols s ON s.id = sn.symbol_id
         WHERE s.name = ? OR s.name LIKE ?`,
      )
      .all(symbol, `%${symbol}%`) as unknown as Array<{
      id: number;
      title: string;
      path: string;
      start_line: number;
      end_line: number;
      content: string;
      explanation: string;
      architectural_significance: string | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      filePath: r.path,
      startLine: r.start_line,
      endLine: r.end_line,
      content: r.content,
      explanation: r.explanation,
      architecturalSignificance: r.architectural_significance,
    }));
  }

  async getExtractionCandidates(): Promise<ExtractionCandidate[]> {
    const rows = this.db.prepare(`SELECT * FROM extraction_candidates`).all() as unknown as Array<{
      symbol_id: number;
      name: string;
      kind: string;
      file_path: string;
      start_line: number | null;
      end_line: number | null;
      importance: string | null;
      application_coupling: string | null;
      purpose: string | null;
    }>;
    return rows.map((r) => ({
      symbolId: r.symbol_id,
      name: r.name,
      kind: r.kind,
      filePath: r.file_path,
      startLine: r.start_line,
      endLine: r.end_line,
      importance: r.importance,
      applicationCoupling: r.application_coupling,
      purpose: r.purpose,
    }));
  }

  close(): void {
    this.db.close();
  }
}

/** Opens the agent catalog (read-only) and returns the AgentCatalog helper. Call .close() when done. */
export function openAgentCatalog(dbPath: string = DEFAULT_DB_PATH): AgentCatalog {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  return new SqliteAgentCatalog(db);
}
