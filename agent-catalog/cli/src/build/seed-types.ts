/**
 * Seed-data row shapes. Foreign keys are expressed as string keys that are
 * resolved to integer row ids at insert time (see inserters.ts), so seed
 * files can be authored independently of insertion order and without
 * knowing database-generated ids in advance.
 *
 * Key conventions:
 *  - file key = repo-root-relative path, e.g. "src/agents/loop.ts"
 *  - symbol key = "<file path>#<symbolName>"
 *  - module/capability/flow/tool/skill/memory-system/data-type/event key = its `name`
 */

export interface SeedRepository {
  name: string;
  rootPath: string;
  gitCommit: string | null;
  gitBranch: string | null;
  analyzedAt: string;
  catalogVersion: string;
}

export interface SeedFile {
  path: string;
  language?: string | null;
  category?: string | null;
  purpose?: string | null;
  importance?: string | null;
  inScope?: boolean;
  generated?: boolean;
  testFile?: boolean;
  sourceHash?: string | null;
}

export interface SeedSymbol {
  key: string;
  fileKey: string;
  name: string;
  qualifiedName?: string | null;
  kind: string;
  signature?: string | null;
  startLine?: number | null;
  endLine?: number | null;
  purpose?: string | null;
  architecturalRole?: string | null;
  visibility?: string | null;
  importance?: string | null;
  status: string;
  reusable?: boolean | null;
  applicationCoupling?: string | null;
}

export interface SeedModule {
  name: string;
  rootPath: string;
  category: string;
  purpose?: string | null;
  responsibilities?: string | null;
  nonResponsibilities?: string | null;
  publicSurface?: string | null;
  runtimeBehavior?: string | null;
  extractionRelevance?: string | null;
  extractionDifficulty?: string | null;
  status: string;
  files?: Array<{ fileKey: string; role?: string | null }>;
}

export interface SeedCapability {
  name: string;
  category: string;
  description?: string | null;
  implementationSummary?: string | null;
  reusable?: boolean | null;
  maturity?: string | null;
  status: string;
  symbols?: Array<{ symbolKey: string; role: string; sequenceOrder?: number | null }>;
}

export interface SeedEvidence {
  key: string;
  fileKey: string;
  symbolKey?: string | null;
  startLine?: number | null;
  endLine?: number | null;
  claim: string;
  evidenceType: string;
  confidence: number;
  notes?: string | null;
}

/** from/to refer to a table name ("symbol" | "file" | "module" | "capability" | "tool" | "skill" | "flow" | "data_type" | "event") plus that table's seed key. */
export interface SeedRelationship {
  fromType: string;
  fromKey: string;
  relationshipType: string;
  toType: string;
  toKey: string;
  description?: string | null;
  status: string;
  evidenceKey?: string | null;
}

export interface SeedFlow {
  name: string;
  category: string;
  description?: string | null;
  entrySymbolKey?: string | null;
  terminationCondition?: string | null;
  errorBehavior?: string | null;
  status: string;
}

export interface SeedFlowStep {
  flowName: string;
  stepOrder: number;
  symbolKey?: string | null;
  fileKey?: string | null;
  title: string;
  description: string;
  inputSummary?: string | null;
  outputSummary?: string | null;
  stateChange?: string | null;
  alternatePath?: string | null;
}

export interface SeedDataType {
  key: string;
  symbolKey?: string | null;
  name: string;
  category: string;
  purpose?: string | null;
  persistenceScope?: string | null;
  providerSpecific?: boolean | null;
  status: string;
  fields?: SeedDataField[];
}

export interface SeedDataField {
  name: string;
  typeText?: string | null;
  required?: boolean | null;
  description?: string | null;
  persisted?: boolean | null;
  sensitive?: boolean | null;
  providerSpecific?: boolean | null;
}

export interface SeedEvent {
  key: string;
  name: string;
  category: string;
  description?: string | null;
  payloadTypeKey?: string | null;
  persisted?: boolean | null;
  status: string;
  producerSymbolKeys?: string[];
  consumerSymbolKeys?: string[];
}

export interface SeedTool {
  name: string;
  implementationSymbolKey?: string | null;
  registrationSymbolKey?: string | null;
  inputSchema?: string | null;
  outputSchema?: string | null;
  sideEffects?: string | null;
  approvalPolicy?: string | null;
  sandboxPolicy?: string | null;
  cancellationSupport?: boolean | null;
  longRunning?: boolean | null;
  reusable?: boolean | null;
  status: string;
}

export interface SeedSkill {
  name: string;
  sourceFileKey?: string | null;
  loaderSymbolKey?: string | null;
  invocationSymbolKey?: string | null;
  description?: string | null;
  instructionSource?: string | null;
  toolExposure?: string | null;
  contextInjection?: string | null;
  lifecycle?: string | null;
  reusable?: boolean | null;
  status: string;
}

export interface SeedMemorySystem {
  name: string;
  category: string;
  storageBackend?: string | null;
  writePath?: string | null;
  retrievalPath?: string | null;
  rankingMethod?: string | null;
  promptInjection?: string | null;
  retentionPolicy?: string | null;
  status: string;
}

export interface SeedPersistenceEntity {
  name: string;
  category: string;
  storageBackend?: string | null;
  schemaLocation?: string | null;
  writerSymbols?: string | null;
  readerSymbols?: string | null;
  lifecycle?: string | null;
  concurrencyNotes?: string | null;
  recoveryNotes?: string | null;
  status: string;
}

export interface SeedSnippet {
  fileKey: string;
  symbolKey?: string | null;
  title: string;
  startLine: number;
  endLine: number;
  content: string;
  explanation: string;
  architecturalSignificance?: string | null;
}

export interface SeedFinding {
  category: string;
  title: string;
  description: string;
  significance?: string | null;
  recommendation?: string | null;
  status: string;
  evidenceKey?: string | null;
}

export interface SeedOpenQuestion {
  category: string;
  question: string;
  evidenceInspected?: string | null;
  reasonUnresolved?: string | null;
  likelyInterpretation?: string | null;
  verificationMethod?: string | null;
  priority?: string | null;
  status: string;
}

export interface CatalogSeed {
  repository: SeedRepository;
  files: SeedFile[];
  symbols: SeedSymbol[];
  modules: SeedModule[];
  capabilities: SeedCapability[];
  evidence: SeedEvidence[];
  relationships: SeedRelationship[];
  flows: SeedFlow[];
  flowSteps: SeedFlowStep[];
  dataTypes: SeedDataType[];
  events: SeedEvent[];
  tools: SeedTool[];
  skills: SeedSkill[];
  memorySystems: SeedMemorySystem[];
  persistenceEntities: SeedPersistenceEntity[];
  snippets: SeedSnippet[];
  findings: SeedFinding[];
  openQuestions: SeedOpenQuestion[];
}
