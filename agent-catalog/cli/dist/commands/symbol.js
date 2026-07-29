import { printJson } from "../formatters/json.js";
/** Looks up one or more symbols by exact or partial name and prints their location, purpose, and capability membership. */
export function runSymbol(ctx) {
    const { db, query, flags } = ctx;
    if (!query.trim()) {
        console.error("symbol requires a name, e.g. agent-catalog symbol runEmbeddedAgent");
        process.exitCode = 1;
        return;
    }
    let sql = `SELECT s.id, s.name, s.qualified_name, s.kind, s.signature, s.start_line, s.end_line,
                    s.purpose, s.architectural_role, s.importance, s.status, s.reusable,
                    s.application_coupling, f.path
             FROM symbols s
             JOIN files f ON f.id = s.file_id
             WHERE s.name = ? OR s.name LIKE ? OR s.qualified_name LIKE ?`;
    const params = [query, `%${query}%`, `%${query}%`];
    if (flags.status) {
        sql += ` AND s.status = ?`;
        params.push(flags.status);
    }
    if (flags.importance) {
        sql += ` AND s.importance = ?`;
        params.push(flags.importance);
    }
    if (flags.path) {
        sql += ` AND f.path LIKE ?`;
        params.push(`%${flags.path}%`);
    }
    sql += ` ORDER BY (s.name = ?) DESC, s.importance LIMIT ?`;
    params.push(query, flags.limit);
    const rows = db.prepare(sql).all(...params);
    if (rows.length === 0) {
        if (flags.json) {
            printJson([]);
        }
        else {
            console.log(`No symbols found matching "${query}".`);
        }
        return;
    }
    const capStmt = db.prepare(`SELECT c.name AS capability_name, cs.role FROM capability_symbols cs
     JOIN capabilities c ON c.id = cs.capability_id WHERE cs.symbol_id = ?`);
    const results = rows.map((row) => {
        const capabilities = capStmt.all(row.id);
        return { ...row, capabilities };
    });
    if (flags.json) {
        printJson(results);
        return;
    }
    for (const row of results) {
        const location = row.start_line
            ? `${row.path}:${row.start_line}${row.end_line ? `-${row.end_line}` : ""}`
            : row.path;
        console.log(`Symbol: ${row.qualified_name ?? row.name}`);
        console.log(`Kind: ${row.kind}    Status: ${row.status}    Importance: ${row.importance ?? "unset"}`);
        console.log(`Location: ${location}`);
        if (row.signature)
            console.log(`Signature: ${row.signature}`);
        if (row.purpose)
            console.log(`Purpose: ${row.purpose}`);
        if (row.architectural_role)
            console.log(`Role: ${row.architectural_role}`);
        console.log(`Reusable: ${row.reusable === null ? "unknown" : row.reusable ? "yes" : "no"}    Coupling: ${row.application_coupling ?? "unknown"}`);
        if (row.capabilities.length > 0) {
            console.log("Capabilities:");
            for (const cap of row.capabilities)
                console.log(`  - ${cap.capability_name} (${cap.role})`);
        }
        console.log("");
    }
}
