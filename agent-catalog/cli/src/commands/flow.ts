import { printJson } from "../formatters/json.js";
import type { CommandContext } from "./types.js";

interface FlowMapRow {
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
}

/** Prints a flow's ordered steps with the source file/symbol backing each step, via the flow_map view. */
export function runFlow(ctx: CommandContext): void {
  const { db, query, flags } = ctx;
  if (!query.trim()) {
    console.error('flow requires a name, e.g. agent-catalog flow "tool call"');
    process.exitCode = 1;
    return;
  }

  const nameRow = db
    .prepare(
      `SELECT name FROM flows WHERE name = ? OR name LIKE ? ORDER BY (name = ?) DESC LIMIT 1`,
    )
    .get(query, `%${query}%`, query) as { name: string } | undefined;

  if (!nameRow) {
    if (flags.json) {
      printJson(null);
    } else {
      console.log(`No flow found matching "${query}".`);
    }
    return;
  }

  const rows = db
    .prepare(`SELECT * FROM flow_map WHERE flow_name = ? ORDER BY step_order`)
    .all(nameRow.name) as unknown as FlowMapRow[];

  if (flags.json) {
    printJson(rows);
    return;
  }

  const [head] = rows;
  console.log(`Flow: ${head.flow_name}`);
  console.log(`Category: ${head.flow_category}    Status: ${head.flow_status}`);
  if (head.termination_condition) console.log(`Termination: ${head.termination_condition}`);
  if (head.error_behavior) console.log(`Error behavior: ${head.error_behavior}`);
  console.log("");
  console.log("Steps:");
  for (const row of rows) {
    if (row.step_order === null) continue;
    const loc = row.file_path
      ? row.start_line
        ? `${row.file_path}:${row.start_line}${row.end_line ? `-${row.end_line}` : ""}`
        : row.file_path
      : null;
    console.log(`${row.step_order}. ${row.step_title}`);
    console.log(`   ${row.step_description}`);
    if (loc) console.log(`   ${row.symbol_name ? `${row.symbol_name} ` : ""}${loc}`);
    if (row.alternate_path) console.log(`   Alternate: ${row.alternate_path}`);
  }
}
