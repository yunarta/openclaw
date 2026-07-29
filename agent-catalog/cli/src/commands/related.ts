import { printJson } from "../formatters/json.js";
import type { CommandContext } from "./types.js";

interface SymbolRef {
  id: number;
  name: string;
  path: string;
}

interface RelationshipRow {
  relationship_type: string;
  description: string | null;
  status: string;
  other_type: string;
  other_id: number;
}

/** Finds symbols/entities connected to a named symbol via the relationships table, plus shared capability/flow membership. */
export function runRelated(ctx: CommandContext): void {
  const { db, query, flags } = ctx;
  if (!query.trim()) {
    console.error("related requires a symbol name, e.g. agent-catalog related runEmbeddedAgent");
    process.exitCode = 1;
    return;
  }

  const symbol = db
    .prepare(
      `SELECT s.id, s.name, f.path FROM symbols s JOIN files f ON f.id = s.file_id
       WHERE s.name = ? OR s.name LIKE ? ORDER BY (s.name = ?) DESC LIMIT 1`,
    )
    .get(query, `%${query}%`, query) as unknown as SymbolRef | undefined;

  if (!symbol) {
    if (flags.json) {
      printJson(null);
    } else {
      console.log(`No symbol found matching "${query}".`);
    }
    return;
  }

  const outgoing = db
    .prepare(
      `SELECT relationship_type, description, status, to_type AS other_type, to_id AS other_id
       FROM relationships WHERE from_type = 'symbol' AND from_id = ?`,
    )
    .all(symbol.id) as unknown as RelationshipRow[];
  const incoming = db
    .prepare(
      `SELECT relationship_type, description, status, from_type AS other_type, from_id AS other_id
       FROM relationships WHERE to_type = 'symbol' AND to_id = ?`,
    )
    .all(symbol.id) as unknown as RelationshipRow[];

  const resolveName = (type: string, id: number): string => {
    if (type === "symbol") {
      const row = db.prepare(`SELECT name FROM symbols WHERE id = ?`).get(id) as
        | { name: string }
        | undefined;
      return row?.name ?? `#${id}`;
    }
    const table = `${type}s`;
    try {
      const row = db.prepare(`SELECT name FROM ${table} WHERE id = ?`).get(id) as
        | { name: string }
        | undefined;
      return row?.name ?? `#${id}`;
    } catch {
      return `#${id}`;
    }
  };

  const capabilities = db
    .prepare(
      `SELECT c.name FROM capability_symbols cs JOIN capabilities c ON c.id = cs.capability_id WHERE cs.symbol_id = ?`,
    )
    .all(symbol.id) as unknown as Array<{ name: string }>;
  const flowSteps = db
    .prepare(
      `SELECT DISTINCT fl.name FROM flow_steps fst JOIN flows fl ON fl.id = fst.flow_id WHERE fst.symbol_id = ?`,
    )
    .all(symbol.id) as unknown as Array<{ name: string }>;

  const outgoingNamed = outgoing.map((r) => ({
    ...r,
    other_name: resolveName(r.other_type, r.other_id),
  }));
  const incomingNamed = incoming.map((r) => ({
    ...r,
    other_name: resolveName(r.other_type, r.other_id),
  }));

  if (flags.json) {
    printJson({
      symbol: symbol.name,
      path: symbol.path,
      outgoing: outgoingNamed,
      incoming: incomingNamed,
      capabilities: capabilities.map((c) => c.name),
      flows: flowSteps.map((f) => f.name),
    });
    return;
  }

  console.log(`Related to: ${symbol.name} (${symbol.path})`);
  if (outgoingNamed.length > 0) {
    console.log("\nOutgoing:");
    for (const r of outgoingNamed)
      console.log(
        `- --[${r.relationship_type}]--> ${r.other_type}:${r.other_name}${r.description ? `  (${r.description})` : ""}`,
      );
  }
  if (incomingNamed.length > 0) {
    console.log("\nIncoming:");
    for (const r of incomingNamed)
      console.log(`- ${r.other_type}:${r.other_name} --[${r.relationship_type}]-->`);
  }
  if (capabilities.length > 0) {
    console.log("\nCapabilities:");
    for (const c of capabilities) console.log(`- ${c.name}`);
  }
  if (flowSteps.length > 0) {
    console.log("\nFlows:");
    for (const f of flowSteps) console.log(`- ${f.name}`);
  }
  if (
    outgoingNamed.length === 0 &&
    incomingNamed.length === 0 &&
    capabilities.length === 0 &&
    flowSteps.length === 0
  ) {
    console.log("\n(no recorded relationships, capabilities, or flow steps for this symbol)");
  }
}
