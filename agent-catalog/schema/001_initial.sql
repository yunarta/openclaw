-- Agent Catalog schema: 001_initial.sql
--
-- Core normalized tables for the OpenClaw agentic runtime architecture
-- catalog. This file is the authoritative DDL; it is applied by
-- cli/src/build/build-database.ts to produce catalog.sqlite. Row content
-- lives in cli/src/build/seed-data/*.ts, not in this file.
--
-- Foreign keys are enforced at the connection level by the application
-- (PRAGMA foreign_keys = ON) since SQLite does not enforce them by default.

CREATE TABLE repositories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    root_path TEXT NOT NULL,
    git_commit TEXT,
    git_branch TEXT,
    analyzed_at TEXT NOT NULL,
    catalog_version TEXT NOT NULL
);

CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    repository_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    language TEXT,
    category TEXT,
    purpose TEXT,
    importance TEXT,
    in_scope INTEGER NOT NULL DEFAULT 1,
    generated INTEGER NOT NULL DEFAULT 0,
    test_file INTEGER NOT NULL DEFAULT 0,
    source_hash TEXT,
    FOREIGN KEY(repository_id) REFERENCES repositories(id),
    UNIQUE(repository_id, path)
);

-- category (suggested): agent-runtime, provider, authentication,
--   tool-runtime, memory, skills, session, prompt, streaming, long-running,
--   persistence, security, events, configuration, test, application-boundary,
--   out-of-scope
-- importance (suggested): critical, high, medium, low

CREATE TABLE symbols (
    id INTEGER PRIMARY KEY,
    file_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    qualified_name TEXT,
    kind TEXT NOT NULL,
    signature TEXT,
    start_line INTEGER,
    end_line INTEGER,
    purpose TEXT,
    architectural_role TEXT,
    visibility TEXT,
    importance TEXT,
    status TEXT NOT NULL,
    reusable INTEGER,
    application_coupling TEXT,
    FOREIGN KEY(file_id) REFERENCES files(id)
);

-- kind (suggested): function, class, interface, type, enum, constant,
--   method, factory, registry, schema, command, event, hook
-- status (suggested): confirmed, inferred, configuration-dependent, legacy,
--   unused-suspected
-- application_coupling (suggested): low, medium, high

CREATE TABLE modules (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    root_path TEXT NOT NULL,
    category TEXT NOT NULL,
    purpose TEXT,
    responsibilities TEXT,
    non_responsibilities TEXT,
    public_surface TEXT,
    runtime_behavior TEXT,
    extraction_relevance TEXT,
    extraction_difficulty TEXT,
    status TEXT NOT NULL
);

CREATE TABLE module_files (
    module_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    role TEXT,
    PRIMARY KEY(module_id, file_id),
    FOREIGN KEY(module_id) REFERENCES modules(id),
    FOREIGN KEY(file_id) REFERENCES files(id)
);

CREATE TABLE capabilities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    implementation_summary TEXT,
    reusable INTEGER,
    maturity TEXT,
    status TEXT NOT NULL
);

CREATE TABLE capability_symbols (
    capability_id INTEGER NOT NULL,
    symbol_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    sequence_order INTEGER,
    PRIMARY KEY(capability_id, symbol_id, role),
    FOREIGN KEY(capability_id) REFERENCES capabilities(id),
    FOREIGN KEY(symbol_id) REFERENCES symbols(id)
);

-- role (suggested): entry-point, interface, implementation, dispatcher,
--   adapter, serializer, persistence, policy, event-producer,
--   event-consumer, helper, test

-- evidence must exist before relationships/findings, which reference it.
CREATE TABLE evidence (
    id INTEGER PRIMARY KEY,
    file_id INTEGER NOT NULL,
    symbol_id INTEGER,
    start_line INTEGER,
    end_line INTEGER,
    claim TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY(file_id) REFERENCES files(id),
    FOREIGN KEY(symbol_id) REFERENCES symbols(id)
);

-- evidence_type (suggested): implementation, type-definition, test,
--   configuration, documentation, call-site, runtime-inference
-- confidence: 1.0 directly confirmed by implementation; 0.9 confirmed by
--   implementation and tests; 0.75 strongly inferred from call sites;
--   0.5 plausible but incomplete; below 0.5 not used, use open_questions.

CREATE TABLE relationships (
    id INTEGER PRIMARY KEY,
    from_type TEXT NOT NULL,
    from_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL,
    to_type TEXT NOT NULL,
    to_id INTEGER NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    evidence_id INTEGER,
    FOREIGN KEY(evidence_id) REFERENCES evidence(id)
);

-- from_type/to_type name a catalog table (symbol, file, module, capability,
-- tool, skill, flow, data_type, event); from_id/to_id are polymorphic so no
-- direct FK is declared on them -- validate via the CLI/helper, not SQLite.
-- relationship_type (suggested): calls, called-by, imports, implements,
--   extends, registers, creates, dispatches-to, persists, loads, emits,
--   consumes, validates, approves, wraps, adapts, converts, retries,
--   resumes, cancels, delegates-to, injects, depends-on, configured-by,
--   tested-by

CREATE TABLE flows (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    entry_symbol_id INTEGER,
    termination_condition TEXT,
    error_behavior TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY(entry_symbol_id) REFERENCES symbols(id)
);

CREATE TABLE flow_steps (
    id INTEGER PRIMARY KEY,
    flow_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    symbol_id INTEGER,
    file_id INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    state_change TEXT,
    alternate_path TEXT,
    FOREIGN KEY(flow_id) REFERENCES flows(id),
    FOREIGN KEY(symbol_id) REFERENCES symbols(id),
    FOREIGN KEY(file_id) REFERENCES files(id),
    UNIQUE(flow_id, step_order)
);

CREATE TABLE data_types (
    id INTEGER PRIMARY KEY,
    symbol_id INTEGER,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    purpose TEXT,
    persistence_scope TEXT,
    provider_specific INTEGER,
    status TEXT NOT NULL,
    FOREIGN KEY(symbol_id) REFERENCES symbols(id)
);

-- category (relevant): message, event, session, run, turn, task, job,
--   tool-call, tool-result, memory, checkpoint, provider-request,
--   provider-response, credential, skill, prompt, configuration

CREATE TABLE data_fields (
    id INTEGER PRIMARY KEY,
    data_type_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type_text TEXT,
    required INTEGER,
    description TEXT,
    persisted INTEGER,
    sensitive INTEGER,
    provider_specific INTEGER,
    FOREIGN KEY(data_type_id) REFERENCES data_types(id)
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    payload_type_id INTEGER,
    persisted INTEGER,
    status TEXT NOT NULL,
    FOREIGN KEY(payload_type_id) REFERENCES data_types(id)
);

CREATE TABLE event_producers (
    event_id INTEGER NOT NULL,
    symbol_id INTEGER NOT NULL,
    PRIMARY KEY(event_id, symbol_id),
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(symbol_id) REFERENCES symbols(id)
);

CREATE TABLE event_consumers (
    event_id INTEGER NOT NULL,
    symbol_id INTEGER NOT NULL,
    PRIMARY KEY(event_id, symbol_id),
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(symbol_id) REFERENCES symbols(id)
);

CREATE TABLE tools (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    implementation_symbol_id INTEGER,
    registration_symbol_id INTEGER,
    input_schema TEXT,
    output_schema TEXT,
    side_effects TEXT,
    approval_policy TEXT,
    sandbox_policy TEXT,
    cancellation_support INTEGER,
    long_running INTEGER,
    reusable INTEGER,
    status TEXT NOT NULL,
    FOREIGN KEY(implementation_symbol_id) REFERENCES symbols(id),
    FOREIGN KEY(registration_symbol_id) REFERENCES symbols(id)
);

CREATE TABLE skills (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    source_file_id INTEGER,
    loader_symbol_id INTEGER,
    invocation_symbol_id INTEGER,
    description TEXT,
    instruction_source TEXT,
    tool_exposure TEXT,
    context_injection TEXT,
    lifecycle TEXT,
    reusable INTEGER,
    status TEXT NOT NULL,
    FOREIGN KEY(source_file_id) REFERENCES files(id),
    FOREIGN KEY(loader_symbol_id) REFERENCES symbols(id),
    FOREIGN KEY(invocation_symbol_id) REFERENCES symbols(id)
);

CREATE TABLE memory_systems (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    storage_backend TEXT,
    write_path TEXT,
    retrieval_path TEXT,
    ranking_method TEXT,
    prompt_injection TEXT,
    retention_policy TEXT,
    status TEXT NOT NULL
);

-- category (suggested): conversation-history, working-memory,
--   session-summary, long-term-memory, semantic-memory, episodic-memory,
--   user-memory, task-memory, checkpoint

CREATE TABLE persistence_entities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    storage_backend TEXT,
    schema_location TEXT,
    writer_symbols TEXT,
    reader_symbols TEXT,
    lifecycle TEXT,
    concurrency_notes TEXT,
    recovery_notes TEXT,
    status TEXT NOT NULL
);

CREATE TABLE snippets (
    id INTEGER PRIMARY KEY,
    file_id INTEGER NOT NULL,
    symbol_id INTEGER,
    title TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    content TEXT NOT NULL,
    explanation TEXT NOT NULL,
    architectural_significance TEXT,
    content_hash TEXT,
    FOREIGN KEY(file_id) REFERENCES files(id),
    FOREIGN KEY(symbol_id) REFERENCES symbols(id)
);

CREATE TABLE findings (
    id INTEGER PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    significance TEXT,
    recommendation TEXT,
    status TEXT NOT NULL,
    evidence_id INTEGER,
    FOREIGN KEY(evidence_id) REFERENCES evidence(id)
);

CREATE TABLE open_questions (
    id INTEGER PRIMARY KEY,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    evidence_inspected TEXT,
    reason_unresolved TEXT,
    likely_interpretation TEXT,
    verification_method TEXT,
    priority TEXT,
    status TEXT NOT NULL
);

-- Full-text search over the catalog. Populated by an explicit rebuild step
-- (cli/src/build/rebuild-search.ts), not by triggers -- see SCHEMA.md for
-- rationale. entity_type/entity_id let callers resolve a hit back to its
-- source row.
CREATE VIRTUAL TABLE catalog_search USING fts5(
    entity_type,
    entity_id UNINDEXED,
    title,
    body,
    keywords,
    source_path
);
