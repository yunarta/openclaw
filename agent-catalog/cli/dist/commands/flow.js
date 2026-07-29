import { printJson } from "../formatters/json.js";
/** Prints a flow's ordered steps with the source file/symbol backing each step, via the flow_map view. */
export function runFlow(ctx) {
    const { db, query, flags } = ctx;
    if (!query.trim()) {
        console.error('flow requires a name, e.g. agent-catalog flow "tool call"');
        process.exitCode = 1;
        return;
    }
    const nameRow = db
        .prepare(`SELECT name FROM flows WHERE name = ? OR name LIKE ? ORDER BY (name = ?) DESC LIMIT 1`)
        .get(query, `%${query}%`, query);
    if (!nameRow) {
        if (flags.json) {
            printJson(null);
        }
        else {
            console.log(`No flow found matching "${query}".`);
        }
        return;
    }
    const rows = db
        .prepare(`SELECT * FROM flow_map WHERE flow_name = ? ORDER BY step_order`)
        .all(nameRow.name);
    if (flags.json) {
        printJson(rows);
        return;
    }
    const [head] = rows;
    console.log(`Flow: ${head.flow_name}`);
    console.log(`Category: ${head.flow_category}    Status: ${head.flow_status}`);
    if (head.termination_condition)
        console.log(`Termination: ${head.termination_condition}`);
    if (head.error_behavior)
        console.log(`Error behavior: ${head.error_behavior}`);
    console.log("");
    console.log("Steps:");
    for (const row of rows) {
        if (row.step_order === null)
            continue;
        const loc = row.file_path
            ? row.start_line
                ? `${row.file_path}:${row.start_line}${row.end_line ? `-${row.end_line}` : ""}`
                : row.file_path
            : null;
        console.log(`${row.step_order}. ${row.step_title}`);
        console.log(`   ${row.step_description}`);
        if (loc)
            console.log(`   ${row.symbol_name ? `${row.symbol_name} ` : ""}${loc}`);
        if (row.alternate_path)
            console.log(`   Alternate: ${row.alternate_path}`);
    }
}
