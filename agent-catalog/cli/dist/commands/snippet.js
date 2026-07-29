import { printJson } from "../formatters/json.js";
/** Finds snippets by title, symbol name, explanation text, or source path. */
export function runSnippet(ctx) {
    const { db, query, flags } = ctx;
    if (!query.trim()) {
        console.error('snippet requires a query, e.g. agent-catalog snippet "OAuth refresh"');
        process.exitCode = 1;
        return;
    }
    const like = `%${query}%`;
    let sql = `SELECT sn.id, sn.title, sn.start_line, sn.end_line, sn.content, sn.explanation,
                    sn.architectural_significance, f.path, s.name AS symbol_name
             FROM snippets sn
             JOIN files f ON f.id = sn.file_id
             LEFT JOIN symbols s ON s.id = sn.symbol_id
             WHERE sn.title LIKE ? OR sn.explanation LIKE ? OR s.name LIKE ? OR f.path LIKE ?`;
    const params = [like, like, like, like];
    if (flags.path) {
        sql += ` AND f.path LIKE ?`;
        params.push(`%${flags.path}%`);
    }
    sql += ` LIMIT ?`;
    params.push(flags.limit);
    const rows = db.prepare(sql).all(...params);
    if (flags.json) {
        printJson(rows);
        return;
    }
    if (rows.length === 0) {
        console.log(`No snippets found matching "${query}".`);
        return;
    }
    for (const row of rows) {
        console.log(`snippet:${row.id} ${row.title}`);
        console.log(`${row.path}:${row.start_line}-${row.end_line}${row.symbol_name ? ` (${row.symbol_name})` : ""}`);
        console.log("---");
        console.log(row.content);
        console.log("---");
        console.log(row.explanation);
        if (row.architectural_significance)
            console.log(`Significance: ${row.architectural_significance}`);
        console.log("");
    }
}
