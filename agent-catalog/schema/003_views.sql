-- Agent Catalog schema: 003_views.sql
--
-- Read-optimized views used by the CLI and helper library. Views are the
-- preferred read surface: prefer querying a view over re-joining base
-- tables ad hoc, so query shape stays consistent across the CLI, the
-- helper library, and any future consumer.

CREATE VIEW critical_symbols AS
SELECT
    s.id,
    s.name,
    s.qualified_name,
    s.kind,
    f.path,
    s.start_line,
    s.end_line,
    s.purpose,
    s.architectural_role
FROM symbols s
JOIN files f ON f.id = s.file_id
WHERE s.importance = 'critical';

CREATE VIEW capability_map AS
SELECT
    c.id AS capability_id,
    c.name AS capability_name,
    c.category AS capability_category,
    c.status AS capability_status,
    c.maturity,
    c.reusable AS capability_reusable,
    cs.role,
    cs.sequence_order,
    s.id AS symbol_id,
    s.name AS symbol_name,
    s.kind AS symbol_kind,
    s.importance AS symbol_importance,
    f.path AS file_path,
    s.start_line,
    s.end_line
FROM capabilities c
LEFT JOIN capability_symbols cs ON cs.capability_id = c.id
LEFT JOIN symbols s ON s.id = cs.symbol_id
LEFT JOIN files f ON f.id = s.file_id
ORDER BY c.name, cs.sequence_order, cs.role;

CREATE VIEW flow_map AS
SELECT
    fl.id AS flow_id,
    fl.name AS flow_name,
    fl.category AS flow_category,
    fl.status AS flow_status,
    fl.termination_condition,
    fl.error_behavior,
    fst.step_order,
    fst.title AS step_title,
    fst.description AS step_description,
    fst.input_summary,
    fst.output_summary,
    fst.state_change,
    fst.alternate_path,
    s.name AS symbol_name,
    COALESCE(f.path, sf.path) AS file_path,
    s.start_line,
    s.end_line
FROM flows fl
LEFT JOIN flow_steps fst ON fst.flow_id = fl.id
LEFT JOIN symbols s ON s.id = fst.symbol_id
LEFT JOIN files sf ON sf.id = s.file_id
LEFT JOIN files f ON f.id = fst.file_id
ORDER BY fl.name, fst.step_order;

CREATE VIEW tool_map AS
SELECT
    t.id AS tool_id,
    t.name AS tool_name,
    t.status,
    t.input_schema,
    t.output_schema,
    t.side_effects,
    t.approval_policy,
    t.sandbox_policy,
    t.cancellation_support,
    t.long_running,
    t.reusable,
    impl.name AS implementation_symbol,
    impl_f.path AS implementation_file,
    impl.start_line AS implementation_start_line,
    impl.end_line AS implementation_end_line,
    reg.name AS registration_symbol,
    reg_f.path AS registration_file,
    reg.start_line AS registration_start_line,
    reg.end_line AS registration_end_line
FROM tools t
LEFT JOIN symbols impl ON impl.id = t.implementation_symbol_id
LEFT JOIN files impl_f ON impl_f.id = impl.file_id
LEFT JOIN symbols reg ON reg.id = t.registration_symbol_id
LEFT JOIN files reg_f ON reg_f.id = reg.file_id
ORDER BY t.name;

CREATE VIEW skill_map AS
SELECT
    sk.id AS skill_id,
    sk.name,
    sk.description,
    sk.instruction_source,
    sk.tool_exposure,
    sk.context_injection,
    sk.lifecycle,
    sk.reusable,
    sk.status,
    sf.path AS source_path,
    loader.name AS loader_symbol,
    loader_f.path AS loader_file,
    loader.start_line AS loader_start_line,
    loader.end_line AS loader_end_line,
    inv.name AS invocation_symbol,
    inv_f.path AS invocation_file,
    inv.start_line AS invocation_start_line,
    inv.end_line AS invocation_end_line
FROM skills sk
LEFT JOIN files sf ON sf.id = sk.source_file_id
LEFT JOIN symbols loader ON loader.id = sk.loader_symbol_id
LEFT JOIN files loader_f ON loader_f.id = loader.file_id
LEFT JOIN symbols inv ON inv.id = sk.invocation_symbol_id
LEFT JOIN files inv_f ON inv_f.id = inv.file_id
ORDER BY sk.name;

CREATE VIEW memory_map AS
SELECT
    id AS memory_system_id,
    name,
    category,
    storage_backend,
    write_path,
    retrieval_path,
    ranking_method,
    prompt_injection,
    retention_policy,
    status
FROM memory_systems
ORDER BY category, name;

CREATE VIEW extraction_candidates AS
SELECT
    s.id AS symbol_id,
    s.name,
    s.kind,
    f.path AS file_path,
    s.start_line,
    s.end_line,
    s.importance,
    s.application_coupling,
    s.purpose,
    s.architectural_role,
    s.status
FROM symbols s
JOIN files f ON f.id = s.file_id
WHERE s.reusable = 1
  AND s.application_coupling IN ('low', 'medium')
ORDER BY
    CASE s.application_coupling WHEN 'low' THEN 0 ELSE 1 END,
    CASE s.importance
        WHEN 'critical' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        ELSE 3
    END,
    s.name;

CREATE VIEW unresolved_high_priority AS
SELECT
    id,
    category,
    question,
    evidence_inspected,
    reason_unresolved,
    likely_interpretation,
    verification_method,
    priority,
    status
FROM open_questions
WHERE priority = 'high'
  AND status NOT IN ('resolved', 'wontfix')
ORDER BY category, id;

CREATE VIEW source_evidence_map AS
SELECT
    e.id AS evidence_id,
    e.claim,
    e.evidence_type,
    e.confidence,
    f.path AS file_path,
    e.start_line,
    e.end_line,
    s.name AS symbol_name,
    e.notes
FROM evidence e
JOIN files f ON f.id = e.file_id
LEFT JOIN symbols s ON s.id = e.symbol_id
ORDER BY e.confidence DESC, f.path, e.start_line;
