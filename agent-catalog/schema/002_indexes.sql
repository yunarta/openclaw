-- Agent Catalog schema: 002_indexes.sql
--
-- Indexes on foreign keys and on columns the CLI/helper filter or sort by
-- (--status, --category, --importance, --path, name lookups, ordering).

CREATE INDEX idx_files_repository ON files(repository_id);
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_importance ON files(importance);
CREATE INDEX idx_files_in_scope ON files(in_scope);
CREATE INDEX idx_files_path ON files(path);

CREATE INDEX idx_symbols_file ON symbols(file_id);
CREATE INDEX idx_symbols_name ON symbols(name);
CREATE INDEX idx_symbols_kind ON symbols(kind);
CREATE INDEX idx_symbols_importance ON symbols(importance);
CREATE INDEX idx_symbols_status ON symbols(status);
CREATE INDEX idx_symbols_reusable ON symbols(reusable);
CREATE INDEX idx_symbols_coupling ON symbols(application_coupling);

CREATE INDEX idx_modules_category ON modules(category);
CREATE INDEX idx_modules_name ON modules(name);
CREATE INDEX idx_module_files_file ON module_files(file_id);

CREATE INDEX idx_capabilities_category ON capabilities(category);
CREATE INDEX idx_capabilities_status ON capabilities(status);
CREATE INDEX idx_capability_symbols_symbol ON capability_symbols(symbol_id);

CREATE INDEX idx_relationships_from ON relationships(from_type, from_id);
CREATE INDEX idx_relationships_to ON relationships(to_type, to_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_evidence ON relationships(evidence_id);

CREATE INDEX idx_flows_category ON flows(category);
CREATE INDEX idx_flows_status ON flows(status);
CREATE INDEX idx_flow_steps_flow ON flow_steps(flow_id, step_order);
CREATE INDEX idx_flow_steps_symbol ON flow_steps(symbol_id);
CREATE INDEX idx_flow_steps_file ON flow_steps(file_id);

CREATE INDEX idx_data_types_category ON data_types(category);
CREATE INDEX idx_data_types_symbol ON data_types(symbol_id);
CREATE INDEX idx_data_fields_type ON data_fields(data_type_id);

CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_name ON events(name);
CREATE INDEX idx_events_payload_type ON events(payload_type_id);
CREATE INDEX idx_event_producers_symbol ON event_producers(symbol_id);
CREATE INDEX idx_event_consumers_symbol ON event_consumers(symbol_id);

CREATE INDEX idx_tools_name ON tools(name);
CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_tools_impl_symbol ON tools(implementation_symbol_id);
CREATE INDEX idx_tools_registration_symbol ON tools(registration_symbol_id);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_status ON skills(status);
CREATE INDEX idx_skills_source_file ON skills(source_file_id);

CREATE INDEX idx_memory_systems_category ON memory_systems(category);
CREATE INDEX idx_persistence_entities_category ON persistence_entities(category);

CREATE INDEX idx_snippets_file ON snippets(file_id);
CREATE INDEX idx_snippets_symbol ON snippets(symbol_id);
CREATE INDEX idx_snippets_hash ON snippets(content_hash);

CREATE INDEX idx_evidence_file ON evidence(file_id);
CREATE INDEX idx_evidence_symbol ON evidence(symbol_id);
CREATE INDEX idx_evidence_confidence ON evidence(confidence);

CREATE INDEX idx_findings_category ON findings(category);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_evidence ON findings(evidence_id);

CREATE INDEX idx_open_questions_category ON open_questions(category);
CREATE INDEX idx_open_questions_priority ON open_questions(priority);
CREATE INDEX idx_open_questions_status ON open_questions(status);
