#!/usr/bin/env node
import { openCatalog } from "../db.js";
/** Synonym expansion so natural-language queries hit the right rows without keyword-stuffing source content. */
const CATEGORY_SYNONYMS = {
    "agent-runtime": "agent loop, execution loop, run loop, orchestration loop, agentic runtime",
    "tool-runtime": "tool dispatch, function calling, tool execution, tool calling",
    memory: "memory retrieval, context retrieval, long-term memory, working memory",
    session: "resume, continuation, session recovery",
    provider: "reasoning, thinking, deliberation event, model provider, LLM backend",
    streaming: "stream normalization, event stream, SSE",
    "long-running": "long-running, durable execution, background job, scheduled run",
    skills: "skills, capabilities, instruction bundles, workflow modules",
    authentication: "OAuth, token refresh, credential, auth profile",
    persistence: "checkpoint, durable state, SQLite schema",
    events: "event model, event stream, observability",
    security: "sandbox, approval, permission policy",
};
function synonymsFor(category) {
    if (!category)
        return "";
    return CATEGORY_SYNONYMS[category] ?? "";
}
/** Clears and repopulates catalog_search deterministically from the base tables. Prefer this over triggers: one auditable rebuild step beats FTS content drifting silently out of sync with every INSERT/UPDATE path. */
export function rebuildSearchIndex(db) {
    db.exec("DELETE FROM catalog_search;");
    const insert = db.prepare(`INSERT INTO catalog_search (entity_type, entity_id, title, body, keywords, source_path) VALUES (?, ?, ?, ?, ?, ?)`);
    const files = db
        .prepare(`SELECT id, path, purpose, category, importance FROM files`)
        .all();
    for (const f of files) {
        insert.run("file", f.id, f.path, f.purpose ?? "", `${f.category ?? ""} ${f.importance ?? ""} ${synonymsFor(f.category)}`.trim(), f.path);
    }
    const symbols = db
        .prepare(`SELECT s.id, s.name, s.qualified_name, s.kind, s.purpose, s.architectural_role, f.path AS file_path, s.importance
       FROM symbols s JOIN files f ON f.id = s.file_id`)
        .all();
    for (const s of symbols) {
        insert.run("symbol", s.id, s.qualified_name ?? s.name, `${s.purpose ?? ""} ${s.architectural_role ?? ""}`.trim(), `${s.kind} ${s.importance ?? ""}`.trim(), s.file_path);
    }
    const capabilities = db
        .prepare(`SELECT id, name, category, description, implementation_summary FROM capabilities`)
        .all();
    for (const c of capabilities) {
        insert.run("capability", c.id, c.name, `${c.description ?? ""} ${c.implementation_summary ?? ""}`.trim(), `${c.category} ${synonymsFor(c.category)}`.trim(), null);
    }
    const flows = db.prepare(`SELECT id, name, category, description FROM flows`).all();
    for (const fl of flows) {
        insert.run("flow", fl.id, fl.name, fl.description ?? "", `${fl.category} ${synonymsFor(fl.category)}`.trim(), null);
    }
    const flowSteps = db
        .prepare(`SELECT fst.id, fst.title, fst.description, fl.name AS flow_name, COALESCE(f.path, sf.path) AS source_path
       FROM flow_steps fst
       JOIN flows fl ON fl.id = fst.flow_id
       LEFT JOIN files f ON f.id = fst.file_id
       LEFT JOIN symbols s ON s.id = fst.symbol_id
       LEFT JOIN files sf ON sf.id = s.file_id`)
        .all();
    for (const step of flowSteps) {
        insert.run("flow_step", step.id, `${step.flow_name}: ${step.title}`, step.description, step.flow_name, step.source_path);
    }
    const snippets = db
        .prepare(`SELECT sn.id, sn.title, sn.content, sn.explanation, sn.architectural_significance, f.path AS source_path
       FROM snippets sn JOIN files f ON f.id = sn.file_id`)
        .all();
    for (const sn of snippets) {
        insert.run("snippet", sn.id, sn.title, `${sn.explanation} ${sn.content}`, sn.architectural_significance ?? "", sn.source_path);
    }
    const skills = db
        .prepare(`SELECT sk.id, sk.name, sk.description, sf.path AS source_path FROM skills sk LEFT JOIN files sf ON sf.id = sk.source_file_id`)
        .all();
    for (const sk of skills) {
        insert.run("skill", sk.id, sk.name, sk.description ?? "", `skills ${synonymsFor("skills")}`, sk.source_path);
    }
    const tools = db
        .prepare(`SELECT id, name, side_effects, approval_policy, sandbox_policy FROM tools`)
        .all();
    for (const t of tools) {
        insert.run("tool", t.id, t.name, `${t.side_effects ?? ""} ${t.approval_policy ?? ""} ${t.sandbox_policy ?? ""}`.trim(), "tool-runtime " + synonymsFor("tool-runtime"), null);
    }
    const memorySystems = db
        .prepare(`SELECT id, name, category, write_path, retrieval_path, prompt_injection FROM memory_systems`)
        .all();
    for (const m of memorySystems) {
        insert.run("memory_system", m.id, m.name, `${m.write_path ?? ""} ${m.retrieval_path ?? ""} ${m.prompt_injection ?? ""}`.trim(), `${m.category} ${synonymsFor("memory")}`.trim(), null);
    }
    const findings = db
        .prepare(`SELECT id, category, title, description, recommendation FROM findings`)
        .all();
    for (const fd of findings) {
        insert.run("finding", fd.id, fd.title, `${fd.description} ${fd.recommendation ?? ""}`.trim(), fd.category, null);
    }
    const openQuestions = db
        .prepare(`SELECT id, category, question, likely_interpretation, reason_unresolved FROM open_questions`)
        .all();
    for (const q of openQuestions) {
        insert.run("open_question", q.id, q.question, `${q.likely_interpretation ?? ""} ${q.reason_unresolved ?? ""}`.trim(), q.category, null);
    }
}
async function main() {
    const db = openCatalog();
    try {
        rebuildSearchIndex(db);
        const count = db.prepare(`SELECT COUNT(*) AS n FROM catalog_search`).get();
        console.log(`Rebuilt catalog_search: ${count.n} rows.`);
    }
    finally {
        db.close();
    }
}
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
