import { printJson } from "../formatters/json.js";
import { truncate } from "../formatters/text.js";
/** Full-text search across the whole catalog (files, symbols, capabilities, flows, flow steps, snippets, skills, tools, memory systems, findings, open questions). */
export function runSearch(ctx) {
    const { db, query, flags } = ctx;
    if (!query.trim()) {
        console.error('search requires a query, e.g. agent-catalog search "tool approval"');
        process.exitCode = 1;
        return;
    }
    const matchQuery = query
        .trim()
        .split(/\s+/)
        .map((term) => `"${term.replace(/"/g, '""')}"`)
        .join(" OR ");
    let sql = `SELECT entity_type, entity_id, title, body, source_path
             FROM catalog_search
             WHERE catalog_search MATCH ?`;
    const params = [matchQuery];
    if (flags.category) {
        sql += ` AND entity_type = ?`;
        params.push(flags.category);
    }
    sql += ` ORDER BY rank LIMIT ?`;
    params.push(flags.limit);
    const rows = db.prepare(sql).all(...params);
    if (flags.json) {
        printJson(rows);
        return;
    }
    if (rows.length === 0) {
        console.log(`No results for "${query}".`);
        return;
    }
    for (const row of rows) {
        console.log(`[${row.entity_type}] ${row.title}`);
        if (row.source_path)
            console.log(`  ${row.source_path}`);
        if (row.body)
            console.log(`  ${truncate(row.body.replace(/\s+/g, " ").trim())}`);
        console.log("");
    }
}
