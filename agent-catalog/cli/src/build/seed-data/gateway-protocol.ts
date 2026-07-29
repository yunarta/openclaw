import type {
  SeedFile,
  SeedModule,
  SeedSymbol,
  SeedCapability,
  SeedDataType,
  SeedRelationship,
  SeedEvidence,
  SeedFinding,
  SeedOpenQuestion,
} from "../seed-types.js";

/**
 * Resolves the 'what does packages/gateway-protocol/ define, and how does it
 * relate to AssistantMessageEventStreamContract' open question. Read
 * packages/gateway-protocol/README.md in full and
 * packages/gateway-protocol/src/schema/agent.ts (398 lines) in full, then
 * traced the runtime bridge: src/infra/agent-events.ts (read in full, 745
 * lines) defines OpenClaw's own internal event bus with a payload shape
 * (runId/seq/stream/ts/data) that structurally mirrors, but does not import
 * from, gateway-protocol's AgentEventSchema. The embedded runner normalizes
 * each AssistantMessageEvent from the in-process
 * AssistantMessageEventStreamContract (packages/llm-core) into a plain
 * `data` object and calls emitAgentEvent({ runId, stream: "assistant", data
 * }); the gateway broadcast layer then forwards that payload to WS clients,
 * where it is validated only against the generic wire envelope. The union's
 * concrete per-variant shape never appears in gateway-protocol's schemas.
 */
export const gatewayProtocolFiles: SeedFile[] = [
  {
    path: "packages/gateway-protocol/README.md",
    category: "gateway-protocol",
    importance: "critical",
    purpose:
      "Read in full. Documents @openclaw/gateway-protocol as typed TypeBox schemas/validators for the OpenClaw Gateway WebSocket protocol (current wire version 4). Lists entry points (root, /schema, /frame-guards, /client-info, /connect-error-details, /gateway-error-details, /startup-unavailable, /version) and explicitly calls out ~60 intentionally-open Type.Unknown() passthrough fields, including frame `params`/`payload`/event `data`, whose concrete shape is owned by the selected method/event, not by this package.",
  },
  {
    path: "packages/gateway-protocol/src/schema/agent.ts",
    category: "gateway-protocol",
    importance: "critical",
    purpose:
      "Read in full (398 lines). Defines the agent/channel-action wire schemas: AgentEventSchema (the stream-event envelope: runId, seq, stream, ts, spawnedBy?, isHeartbeat?, data: Record<string,unknown>), AgentParamsSchema (the 'agent' RPC request: message, agentId, provider, model, sessionKey, promptMode, etc.), plus conversation/message-action/poll/wake request-response schemas. `data` on AgentEventSchema is an untyped Record -- the envelope is transport-generic and carries no knowledge of the AssistantMessageEvent union's per-variant fields.",
  },
  {
    path: "packages/gateway-protocol/src/index.ts",
    category: "gateway-protocol",
    importance: "high",
    purpose:
      "Confirmed to exist as the package's main TypeBox-backed entry point (per README): exports compiled runtime validators (validateRequestFrame, validate*Params), formatValidationErrors, and their inferred TypeScript types. Not read line-by-line this pass.",
  },
  {
    path: "packages/gateway-protocol/src/frame-guards.ts",
    category: "gateway-protocol",
    importance: "medium",
    purpose:
      "Confirmed to exist (per README + frame-guards.test.ts): dependency-free structural guards (e.g. isGatewayEventFrame) for envelope dispatch without paying the TypeBox runtime-compilation cost -- meant for CSP-sensitive or browser-bundle consumers. Not read line-by-line this pass.",
  },
  {
    path: "src/infra/agent-events.ts",
    category: "events",
    importance: "critical",
    purpose:
      "Read in full (745 lines). OpenClaw's own internal, in-process agent-event bus (independent of, but structurally mirroring, gateway-protocol's AgentEventSchema): AgentEventPayload { runId, seq, stream, ts, data: Record<string,unknown>, sessionKey?, sessionId?, agentId?, lifecycleGeneration? }. emitAgentEvent()/emitAgentEventForOwner() sequence and stamp events per runId (per-run monotonic seq via seqByRun), gate delivery by an owning 'lifecycleGeneration' (so events from a stale gateway generation after an in-process restart are dropped), and notify onAgentEvent/onAgentRuntimeEvent listeners. AgentEventStream is a named-plus-open string union: lifecycle | tool | assistant | usage | error | item | plan | approval | command_output | patch | compaction | thinking | (string & {}). This is the sole producer side of every event later re-validated by gateway-protocol's AgentEventSchema at the WS boundary.",
  },
];

export const gatewayProtocolModules: SeedModule[] = [
  {
    name: "gateway-wire-protocol",
    rootPath: "packages/gateway-protocol",
    category: "gateway-protocol",
    status: "confirmed",
    purpose:
      "Standalone, publishable (@openclaw/gateway-protocol) TypeBox schema package defining the OpenClaw Gateway's client<->server WebSocket wire protocol: request/response/event frame envelopes, RPC method params/results (agent, sessions, chat, cron, approvals, channels, plugins, etc.), and runtime validators compiled from those schemas.",
    responsibilities:
      "Frame envelope validation (validateRequestFrame and friends); per-method params/result schemas and their inferred TS types; a generic, intentionally-untyped agent stream-event envelope (AgentEventSchema: runId/seq/stream/ts/data); TypeBox-free lightweight guards, client capability/version constants, and structured error-detail readers for CSP-sensitive consumers; a wire PROTOCOL_VERSION integer versioned independently of the package's calendar release version.",
    nonResponsibilities:
      "Does not define or validate the concrete internal shape of any one event stream's `data` payload (e.g. the 12-variant AssistantMessageEvent union) -- that remains entirely an in-process contract owned by packages/llm-core and src/infra/agent-events.ts. Does not itself run a WebSocket server or dispatch methods -- it is a schema/validator library consumed by src/gateway/**.",
    publicSurface:
      "AgentEventSchema, AgentParamsSchema, validateRequestFrame, validate*Params, formatValidationErrors, isGatewayEventFrame, PROTOCOL_VERSION/MIN_CLIENT_PROTOCOL_VERSION.",
    runtimeBehavior:
      "src/gateway/** imports these schemas/validators to check inbound frames and to type outbound RPC results; src/infra/agent-events.ts independently produces its own AgentEventPayload objects (same shape, no import relationship) that the gateway broadcast layer (src/gateway/server-broadcast.ts and friends) forwards to WS clients, where the generic envelope shape happens to satisfy AgentEventSchema.",
    extractionRelevance:
      "high -- a standalone agentic REST API gateway needs an equivalent generic event envelope (run/seq/stream/ts/opaque-data) plus per-method request/response schemas; this package is a directly reusable reference design for that boundary, including its deliberate choice to keep the streamed payload's concrete shape out of the transport schema.",
    extractionDifficulty: "low",
    files: [
      { fileKey: "packages/gateway-protocol/README.md", role: "documentation" },
      { fileKey: "packages/gateway-protocol/src/schema/agent.ts", role: "interface" },
      { fileKey: "packages/gateway-protocol/src/index.ts", role: "entry-point" },
      { fileKey: "packages/gateway-protocol/src/frame-guards.ts", role: "implementation" },
    ],
  },
];

export const gatewayProtocolSymbols: SeedSymbol[] = [
  {
    key: "sym:emitAgentEvent",
    fileKey: "src/infra/agent-events.ts",
    name: "emitAgentEvent",
    kind: "function",
    startLine: 687,
    endLine: 690,
    signature: 'function emitAgentEvent(event: Omit<AgentEventPayload, "seq" | "ts">): void',
    purpose:
      "The single entry point every agent-run producer (assistant-stream normalization, tool lifecycle, lifecycle/usage/approval events) calls to publish one event onto the internal bus; enrichAgentEvent() assigns the per-run sequence number and timestamp before notifying listeners that the gateway broadcast layer forwards to WS clients as a wire-level AgentEventSchema-shaped frame.",
    architecturalRole: "orchestrator",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:AgentEventSchema",
    fileKey: "packages/gateway-protocol/src/schema/agent.ts",
    name: "AgentEventSchema",
    kind: "type",
    startLine: 54,
    endLine: 62,
    signature:
      "const AgentEventSchema = closedObject({ runId, seq, stream, ts, spawnedBy?, isHeartbeat?, data: Record<string, unknown> })",
    purpose:
      "The wire-level TypeBox schema for one streamed agent event. `data` is deliberately Type.Unknown() -- the envelope validates transport shape only; the selected `stream` name's concrete payload contract is owned upstream by src/infra/agent-events.ts's producers, not by this package.",
    architecturalRole: "interface",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
];

export const gatewayProtocolCapabilities: SeedCapability[] = [
  {
    name: "gateway wire protocol",
    category: "gateway-protocol",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "A standalone TypeBox schema package (@openclaw/gateway-protocol, wire protocol version 4) defines the OpenClaw Gateway's WebSocket request/response/event frame envelopes and per-method params/result schemas, decoupled from the internal agent-run event model.",
    implementationSummary:
      "Generic stream-event envelope AgentEventSchema (runId/seq/stream/ts/data:Unknown) validated at the transport boundary; the internal producer src/infra/agent-events.ts emits structurally-matching AgentEventPayload objects with no import dependency on gateway-protocol, keeping the internal AssistantMessageEvent union's concrete shape entirely out of the wire schema.",
    symbols: [
      { symbolKey: "sym:AgentEventSchema", role: "interface" },
      { symbolKey: "sym:emitAgentEvent", role: "orchestrator" },
    ],
  },
];

export const gatewayProtocolDataTypes: SeedDataType[] = [
  {
    key: "dt:AgentEventPayload",
    name: "AgentEventPayload",
    category: "runtime",
    status: "confirmed",
    persistenceScope: "transient",
    providerSpecific: false,
    purpose:
      "src/infra/agent-events.ts:52-68. Internal, in-process shape of one sequenced agent event, produced by emitAgentEvent() and consumed by gateway broadcast listeners. Structurally mirrors, but is not type-linked to, gateway-protocol's AgentEventSchema.",
    fields: [
      { name: "runId", typeText: "string", required: true, persisted: false },
      { name: "seq", typeText: "number", required: true, persisted: false },
      {
        name: "stream",
        typeText: "AgentEventStream",
        required: true,
        persisted: false,
        description:
          "lifecycle | tool | assistant | usage | error | item | plan | approval | command_output | patch | compaction | thinking | (string & {}).",
      },
      { name: "ts", typeText: "number", required: true, persisted: false },
      {
        name: "data",
        typeText: "Record<string, unknown>",
        required: true,
        persisted: false,
        description: "Untyped at this layer; shape owned by the stream-specific producer.",
      },
      { name: "sessionKey", typeText: "string | undefined", required: false, persisted: false },
      { name: "sessionId", typeText: "string | undefined", required: false, persisted: false },
      { name: "agentId", typeText: "string | undefined", required: false, persisted: false },
    ],
  },
];

export const gatewayProtocolRelationships: SeedRelationship[] = [
  {
    fromType: "data_type",
    fromKey: "dt:AssistantMessageEventStreamContract",
    relationshipType: "normalized-then-transported-as",
    toType: "data_type",
    toKey: "dt:AgentEventPayload",
    description:
      'The embedded runner (src/agents/embedded-agent-subscribe.ts\'s emitAssistantStreamDataSafely) consumes each AssistantMessageEvent off the in-process AssistantMessageEventStreamContract, builds a plain `data` object, and calls emitAgentEvent({ runId, stream: "assistant", data }) -- crossing from the typed llm-core union into the untyped internal event bus.',
    status: "confirmed",
    evidenceKey: "ev:gateway-protocol-agent-schema-full",
  },
  {
    fromType: "data_type",
    fromKey: "dt:AgentEventPayload",
    relationshipType: "validated-at-wire-boundary-by",
    toType: "symbol",
    toKey: "sym:AgentEventSchema",
    description:
      "Gateway broadcast listeners forward AgentEventPayload objects to WS clients; gateway-protocol's AgentEventSchema validates only the generic envelope fields, leaving `data` as an opaque Record<string, unknown> at every layer.",
    status: "confirmed",
    evidenceKey: "ev:gateway-protocol-agent-schema-full",
  },
];

export const gatewayProtocolEvidence: SeedEvidence[] = [
  {
    key: "ev:gateway-protocol-readme-full",
    fileKey: "packages/gateway-protocol/README.md",
    startLine: 1,
    endLine: 159,
    claim:
      "@openclaw/gateway-protocol is a standalone TypeBox schema/validator package for the Gateway WebSocket wire protocol (version 4), with ~60 fields intentionally left as untyped passthroughs including all stream event `data` payloads.",
    evidenceType: "documentation",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:gateway-protocol-agent-schema-full",
    fileKey: "packages/gateway-protocol/src/schema/agent.ts",
    symbolKey: "sym:AgentEventSchema",
    startLine: 1,
    endLine: 398,
    claim:
      "AgentEventSchema is the wire envelope for streamed agent events (runId/seq/stream/ts/data:Unknown); AgentParamsSchema is the 'agent' RPC request shape. Neither schema encodes the AssistantMessageEvent union's concrete per-variant fields.",
    evidenceType: "type-definition",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:agent-events-bus-full",
    fileKey: "src/infra/agent-events.ts",
    symbolKey: "sym:emitAgentEvent",
    startLine: 1,
    endLine: 745,
    claim:
      "src/infra/agent-events.ts defines OpenClaw's internal agent-run event bus (AgentEventPayload, emitAgentEvent, per-run sequencing, lifecycle-generation-gated delivery) as the sole producer feeding gateway-protocol-validated WS frames; it has no import dependency on packages/gateway-protocol.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:embedded-subscribe-assistant-bridge",
    fileKey: "src/agents/embedded-agent-subscribe.ts",
    startLine: 279,
    endLine: 304,
    claim:
      'emitAssistantStreamDataSafely() is the concrete bridge point: it takes normalized assistant-stream `data` and calls emitAgentEvent({ runId, stream: "assistant", data }), the exact moment an AssistantMessageEvent-derived payload enters the internal-then-wire event pipeline.',
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly (lines 279-304).",
  },
];

export const gatewayProtocolFindings: SeedFinding[] = [
  {
    category: "architecture",
    title:
      "The agent-run event model and the Gateway wire protocol are two deliberately decoupled layers",
    description:
      "packages/llm-core's AssistantMessageEvent (12-variant discriminated union) is a purely in-process, typed contract consumed via AssistantMessageEventStreamContract. src/infra/agent-events.ts normalizes any such event into an untyped { runId, seq, stream, ts, data } record on its own internal bus. packages/gateway-protocol's AgentEventSchema validates only that same generic envelope shape at the WS transport boundary, with `data` left as Type.Unknown() by explicit design (per its README's 'Intentionally open fields' section). No package in this chain re-exports or type-links the other two -- the coupling is structural/conventional, not type-level.",
    significance:
      "High. A standalone extraction should preserve this three-layer separation: (1) a typed in-process provider-normalized event stream, (2) an internal untyped-at-the-edges event bus with run/seq/lifecycle bookkeeping, (3) a transport-layer schema that validates the envelope but deliberately does not know the union's shape. Collapsing these into one typed wire contract would lose the extensibility the current design gets from open `data` fields (new event streams need no wire-schema change).",
    recommendation:
      "In EXTRACTION-GUIDE.md, model the standalone gateway's event delivery the same way: keep the provider-normalized event union internal to the agent-loop layer, bridge it through a thin run/seq-stamped bus, and expose only a generic envelope schema (run id, sequence, stream name, timestamp, opaque payload) at the public REST/WS boundary.",
    status: "confirmed",
  },
];

export const gatewayProtocolOpenQuestions: SeedOpenQuestion[] = [];
