import { printJson } from "../formatters/json.js";
/** Prints a capability's entry points, ordered implementation symbols, and any snippets attached to its symbols -- mirrors the CLI output shape documented in EXTRACTION-GUIDE.md. */
export function runCapability(ctx) {
    const { db, query, flags } = ctx;
    if (!query.trim()) {
        console.error('capability requires a name, e.g. agent-catalog capability "agent loop"');
        process.exitCode = 1;
        return;
    }
    const head = db
        .prepare(`SELECT id AS capability_id, name AS capability_name, category AS capability_category,
              status AS capability_status, maturity, reusable AS capability_reusable
       FROM capabilities WHERE name = ? OR name LIKE ? ORDER BY (name = ?) DESC LIMIT 1`)
        .get(query, `%${query}%`, query);
    if (!head) {
        if (flags.json) {
            printJson(null);
        }
        else {
            console.log(`No capability found matching "${query}".`);
        }
        return;
    }
    const rows = db
        .prepare(`SELECT role, sequence_order, symbol_id, symbol_name, symbol_kind, symbol_importance, file_path, start_line, end_line
       FROM capability_map WHERE capability_name = ? ORDER BY sequence_order, role`)
        .all(head.capability_name);
    const symbolIds = rows.map((r) => r.symbol_id).filter((id) => id !== null);
    const snippets = symbolIds.length > 0
        ? db
            .prepare(`SELECT id, title FROM snippets WHERE symbol_id IN (${symbolIds.map(() => "?").join(",")})`)
            .all(...symbolIds)
        : [];
    if (flags.json) {
        printJson({ ...head, symbols: rows, snippets });
        return;
    }
    console.log(`Capability: ${head.capability_name}`);
    console.log(`Status: ${head.capability_status}    Category: ${head.capability_category}    Maturity: ${head.maturity ?? "unknown"}`);
    console.log(`Reusable: ${head.capability_reusable === null ? "unknown" : head.capability_reusable ? "yes" : "no"}`);
    const entryPoints = rows.filter((r) => r.role === "entry-point" && r.symbol_name);
    if (entryPoints.length > 0) {
        console.log("\nEntry point:");
        for (const ep of entryPoints) {
            console.log(`- ${ep.symbol_name}`);
            if (ep.file_path)
                console.log(`  ${ep.file_path}${ep.start_line ? `:${ep.start_line}${ep.end_line ? `-${ep.end_line}` : ""}` : ""}`);
        }
    }
    const others = rows.filter((r) => r.role !== "entry-point" && r.symbol_name);
    if (others.length > 0) {
        console.log("\nRelated symbols:");
        for (const o of others) {
            console.log(`- ${o.symbol_name}${o.role ? ` (${o.role})` : ""}`);
        }
    }
    if (snippets.length > 0) {
        console.log("\nRelevant snippets:");
        for (const sn of snippets)
            console.log(`- snippet:${sn.id} ${sn.title}`);
    }
}
