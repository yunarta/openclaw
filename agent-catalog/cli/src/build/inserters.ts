import type { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import type {
  CatalogSeed,
  SeedRepository,
  SeedFile,
  SeedSymbol,
  SeedModule,
  SeedCapability,
  SeedEvidence,
  SeedRelationship,
  SeedFlow,
  SeedFlowStep,
  SeedDataType,
  SeedEvent,
  SeedTool,
  SeedSkill,
  SeedMemorySystem,
  SeedPersistenceEntity,
  SeedSnippet,
  SeedFinding,
  SeedOpenQuestion,
} from "./seed-types.js";

const bool = (v: boolean | null | undefined): number | null => (v === null || v === undefined ? null : v ? 1 : 0);

/** Resolves polymorphic (type, key) references used by the relationships table. */
export class KeyRegistry {
  private tables = new Map<string, Map<string, number>>();

  register(type: string, key: string, id: number): void {
    let table = this.tables.get(type);
    if (!table) {
      table = new Map();
      this.tables.set(type, table);
    }
    if (table.has(key)) {
      throw new Error(`Duplicate seed key for ${type}: ${key}`);
    }
    table.set(key, id);
  }

  resolve(type: string, key: string): number {
    const id = this.tables.get(type)?.get(key);
    if (id === undefined) {
      throw new Error(`Unresolved seed reference: ${type}:${key}`);
    }
    return id;
  }

  tryResolve(type: string, key: string | null | undefined): number | null {
    if (!key) return null;
    return this.resolve(type, key);
  }
}

export function insertRepository(db: DatabaseSync, repo: SeedRepository): number {
  const stmt = db.prepare(
    `INSERT INTO repositories (name, root_path, git_commit, git_branch, analyzed_at, catalog_version)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const info = stmt.run(repo.name, repo.rootPath, repo.gitCommit, repo.gitBranch, repo.analyzedAt, repo.catalogVersion);
  return Number(info.lastInsertRowid);
}

export function insertFiles(db: DatabaseSync, repositoryId: number, files: SeedFile[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO files (repository_id, path, language, category, purpose, importance, in_scope, generated, test_file, source_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const f of files) {
    const info = stmt.run(
      repositoryId,
      f.path,
      f.language ?? null,
      f.category ?? null,
      f.purpose ?? null,
      f.importance ?? null,
      bool(f.inScope ?? true),
      bool(f.generated ?? false),
      bool(f.testFile ?? false),
      f.sourceHash ?? null,
    );
    reg.register("file", f.path, Number(info.lastInsertRowid));
  }
}

export function insertSymbols(db: DatabaseSync, symbols: SeedSymbol[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO symbols (file_id, name, qualified_name, kind, signature, start_line, end_line, purpose, architectural_role, visibility, importance, status, reusable, application_coupling)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const s of symbols) {
    const info = stmt.run(
      reg.resolve("file", s.fileKey),
      s.name,
      s.qualifiedName ?? null,
      s.kind,
      s.signature ?? null,
      s.startLine ?? null,
      s.endLine ?? null,
      s.purpose ?? null,
      s.architecturalRole ?? null,
      s.visibility ?? null,
      s.importance ?? null,
      s.status,
      bool(s.reusable),
      s.applicationCoupling ?? null,
    );
    reg.register("symbol", s.key, Number(info.lastInsertRowid));
  }
}

export function insertModules(db: DatabaseSync, modules: SeedModule[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO modules (name, root_path, category, purpose, responsibilities, non_responsibilities, public_surface, runtime_behavior, extraction_relevance, extraction_difficulty, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const linkStmt = db.prepare(`INSERT INTO module_files (module_id, file_id, role) VALUES (?, ?, ?)`);
  for (const m of modules) {
    const info = stmt.run(
      m.name,
      m.rootPath,
      m.category,
      m.purpose ?? null,
      m.responsibilities ?? null,
      m.nonResponsibilities ?? null,
      m.publicSurface ?? null,
      m.runtimeBehavior ?? null,
      m.extractionRelevance ?? null,
      m.extractionDifficulty ?? null,
      m.status,
    );
    const moduleId = Number(info.lastInsertRowid);
    reg.register("module", m.name, moduleId);
    for (const link of m.files ?? []) {
      linkStmt.run(moduleId, reg.resolve("file", link.fileKey), link.role ?? null);
    }
  }
}

export function insertCapabilities(db: DatabaseSync, capabilities: SeedCapability[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO capabilities (name, category, description, implementation_summary, reusable, maturity, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const linkStmt = db.prepare(
    `INSERT INTO capability_symbols (capability_id, symbol_id, role, sequence_order) VALUES (?, ?, ?, ?)`,
  );
  for (const c of capabilities) {
    const info = stmt.run(c.name, c.category, c.description ?? null, c.implementationSummary ?? null, bool(c.reusable), c.maturity ?? null, c.status);
    const capabilityId = Number(info.lastInsertRowid);
    reg.register("capability", c.name, capabilityId);
    for (const link of c.symbols ?? []) {
      linkStmt.run(capabilityId, reg.resolve("symbol", link.symbolKey), link.role, link.sequenceOrder ?? null);
    }
  }
}

export function insertEvidence(db: DatabaseSync, evidence: SeedEvidence[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO evidence (file_id, symbol_id, start_line, end_line, claim, evidence_type, confidence, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const e of evidence) {
    const info = stmt.run(
      reg.resolve("file", e.fileKey),
      reg.tryResolve("symbol", e.symbolKey),
      e.startLine ?? null,
      e.endLine ?? null,
      e.claim,
      e.evidenceType,
      e.confidence,
      e.notes ?? null,
    );
    reg.register("evidence", e.key, Number(info.lastInsertRowid));
  }
}

export function insertRelationships(db: DatabaseSync, relationships: SeedRelationship[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO relationships (from_type, from_id, relationship_type, to_type, to_id, description, status, evidence_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const r of relationships) {
    stmt.run(
      r.fromType,
      reg.resolve(r.fromType, r.fromKey),
      r.relationshipType,
      r.toType,
      reg.resolve(r.toType, r.toKey),
      r.description ?? null,
      r.status,
      reg.tryResolve("evidence", r.evidenceKey),
    );
  }
}

export function insertFlows(db: DatabaseSync, flows: SeedFlow[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO flows (name, category, description, entry_symbol_id, termination_condition, error_behavior, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const f of flows) {
    const info = stmt.run(
      f.name,
      f.category,
      f.description ?? null,
      reg.tryResolve("symbol", f.entrySymbolKey),
      f.terminationCondition ?? null,
      f.errorBehavior ?? null,
      f.status,
    );
    reg.register("flow", f.name, Number(info.lastInsertRowid));
  }
}

export function insertFlowSteps(db: DatabaseSync, steps: SeedFlowStep[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO flow_steps (flow_id, step_order, symbol_id, file_id, title, description, input_summary, output_summary, state_change, alternate_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const s of steps) {
    stmt.run(
      reg.resolve("flow", s.flowName),
      s.stepOrder,
      reg.tryResolve("symbol", s.symbolKey),
      reg.tryResolve("file", s.fileKey),
      s.title,
      s.description,
      s.inputSummary ?? null,
      s.outputSummary ?? null,
      s.stateChange ?? null,
      s.alternatePath ?? null,
    );
  }
}

export function insertDataTypes(db: DatabaseSync, dataTypes: SeedDataType[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO data_types (symbol_id, name, category, purpose, persistence_scope, provider_specific, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const fieldStmt = db.prepare(
    `INSERT INTO data_fields (data_type_id, name, type_text, required, description, persisted, sensitive, provider_specific)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const dt of dataTypes) {
    const info = stmt.run(
      reg.tryResolve("symbol", dt.symbolKey),
      dt.name,
      dt.category,
      dt.purpose ?? null,
      dt.persistenceScope ?? null,
      bool(dt.providerSpecific),
      dt.status,
    );
    const dataTypeId = Number(info.lastInsertRowid);
    reg.register("data_type", dt.key, dataTypeId);
    for (const field of dt.fields ?? []) {
      fieldStmt.run(
        dataTypeId,
        field.name,
        field.typeText ?? null,
        bool(field.required),
        field.description ?? null,
        bool(field.persisted),
        bool(field.sensitive),
        bool(field.providerSpecific),
      );
    }
  }
}

export function insertEvents(db: DatabaseSync, events: SeedEvent[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO events (name, category, description, payload_type_id, persisted, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const producerStmt = db.prepare(`INSERT INTO event_producers (event_id, symbol_id) VALUES (?, ?)`);
  const consumerStmt = db.prepare(`INSERT INTO event_consumers (event_id, symbol_id) VALUES (?, ?)`);
  for (const e of events) {
    const info = stmt.run(e.name, e.category, e.description ?? null, reg.tryResolve("data_type", e.payloadTypeKey), bool(e.persisted), e.status);
    const eventId = Number(info.lastInsertRowid);
    reg.register("event", e.key, eventId);
    for (const symbolKey of e.producerSymbolKeys ?? []) {
      producerStmt.run(eventId, reg.resolve("symbol", symbolKey));
    }
    for (const symbolKey of e.consumerSymbolKeys ?? []) {
      consumerStmt.run(eventId, reg.resolve("symbol", symbolKey));
    }
  }
}

export function insertTools(db: DatabaseSync, tools: SeedTool[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO tools (name, implementation_symbol_id, registration_symbol_id, input_schema, output_schema, side_effects, approval_policy, sandbox_policy, cancellation_support, long_running, reusable, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const t of tools) {
    const info = stmt.run(
      t.name,
      reg.tryResolve("symbol", t.implementationSymbolKey),
      reg.tryResolve("symbol", t.registrationSymbolKey),
      t.inputSchema ?? null,
      t.outputSchema ?? null,
      t.sideEffects ?? null,
      t.approvalPolicy ?? null,
      t.sandboxPolicy ?? null,
      bool(t.cancellationSupport),
      bool(t.longRunning),
      bool(t.reusable),
      t.status,
    );
    reg.register("tool", t.name, Number(info.lastInsertRowid));
  }
}

export function insertSkills(db: DatabaseSync, skills: SeedSkill[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO skills (name, source_file_id, loader_symbol_id, invocation_symbol_id, description, instruction_source, tool_exposure, context_injection, lifecycle, reusable, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const s of skills) {
    const info = stmt.run(
      s.name,
      reg.tryResolve("file", s.sourceFileKey),
      reg.tryResolve("symbol", s.loaderSymbolKey),
      reg.tryResolve("symbol", s.invocationSymbolKey),
      s.description ?? null,
      s.instructionSource ?? null,
      s.toolExposure ?? null,
      s.contextInjection ?? null,
      s.lifecycle ?? null,
      bool(s.reusable),
      s.status,
    );
    reg.register("skill", s.name, Number(info.lastInsertRowid));
  }
}

export function insertMemorySystems(db: DatabaseSync, items: SeedMemorySystem[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO memory_systems (name, category, storage_backend, write_path, retrieval_path, ranking_method, prompt_injection, retention_policy, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const m of items) {
    const info = stmt.run(
      m.name,
      m.category,
      m.storageBackend ?? null,
      m.writePath ?? null,
      m.retrievalPath ?? null,
      m.rankingMethod ?? null,
      m.promptInjection ?? null,
      m.retentionPolicy ?? null,
      m.status,
    );
    reg.register("memory_system", m.name, Number(info.lastInsertRowid));
  }
}

export function insertPersistenceEntities(db: DatabaseSync, items: SeedPersistenceEntity[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO persistence_entities (name, category, storage_backend, schema_location, writer_symbols, reader_symbols, lifecycle, concurrency_notes, recovery_notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const p of items) {
    const info = stmt.run(
      p.name,
      p.category,
      p.storageBackend ?? null,
      p.schemaLocation ?? null,
      p.writerSymbols ?? null,
      p.readerSymbols ?? null,
      p.lifecycle ?? null,
      p.concurrencyNotes ?? null,
      p.recoveryNotes ?? null,
      p.status,
    );
    reg.register("persistence_entity", p.name, Number(info.lastInsertRowid));
  }
}

export function insertSnippets(db: DatabaseSync, snippets: SeedSnippet[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO snippets (file_id, symbol_id, title, start_line, end_line, content, explanation, architectural_significance, content_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const s of snippets) {
    const hash = createHash("sha256").update(s.content).digest("hex").slice(0, 16);
    stmt.run(
      reg.resolve("file", s.fileKey),
      reg.tryResolve("symbol", s.symbolKey),
      s.title,
      s.startLine,
      s.endLine,
      s.content,
      s.explanation,
      s.architecturalSignificance ?? null,
      hash,
    );
  }
}

export function insertFindings(db: DatabaseSync, findings: SeedFinding[], reg: KeyRegistry): void {
  const stmt = db.prepare(
    `INSERT INTO findings (category, title, description, significance, recommendation, status, evidence_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const f of findings) {
    stmt.run(f.category, f.title, f.description, f.significance ?? null, f.recommendation ?? null, f.status, reg.tryResolve("evidence", f.evidenceKey));
  }
}

export function insertOpenQuestions(db: DatabaseSync, items: SeedOpenQuestion[]): void {
  const stmt = db.prepare(
    `INSERT INTO open_questions (category, question, evidence_inspected, reason_unresolved, likely_interpretation, verification_method, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const q of items) {
    stmt.run(q.category, q.question, q.evidenceInspected ?? null, q.reasonUnresolved ?? null, q.likelyInterpretation ?? null, q.verificationMethod ?? null, q.priority ?? null, q.status);
  }
}

export function insertAll(db: DatabaseSync, seed: CatalogSeed): void {
  const reg = new KeyRegistry();
  const repositoryId = insertRepository(db, seed.repository);
  insertFiles(db, repositoryId, seed.files, reg);
  insertSymbols(db, seed.symbols, reg);
  insertModules(db, seed.modules, reg);
  insertCapabilities(db, seed.capabilities, reg);
  insertEvidence(db, seed.evidence, reg);
  insertFlows(db, seed.flows, reg);
  insertFlowSteps(db, seed.flowSteps, reg);
  insertDataTypes(db, seed.dataTypes, reg);
  insertEvents(db, seed.events, reg);
  insertTools(db, seed.tools, reg);
  insertSkills(db, seed.skills, reg);
  insertMemorySystems(db, seed.memorySystems, reg);
  insertPersistenceEntities(db, seed.persistenceEntities, reg);
  insertSnippets(db, seed.snippets, reg);
  insertFindings(db, seed.findings, reg);
  insertOpenQuestions(db, seed.openQuestions);
  // Relationships reference every other table, so they must be inserted last.
  insertRelationships(db, seed.relationships, reg);
}
