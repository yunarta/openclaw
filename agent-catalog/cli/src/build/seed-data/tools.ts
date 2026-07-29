import type {
  SeedCapability,
  SeedFlow,
  SeedFlowStep,
  SeedDataType,
  SeedTool,
  SeedEvidence,
  SeedOpenQuestion,
  SeedSymbol,
} from "../seed-types.js";

export const toolSymbols: SeedSymbol[] = [
  {
    key: "sym:runToolLifecycle",
    fileKey: "src/agents/embedded-agent-subscribe.ts",
    name: "runToolLifecycle",
    kind: "function",
    startLine: 1436,
    endLine: 1476,
    signature:
      "runToolLifecycle: async <T>(toolParams: { toolName; toolCallId; args; replaySafe?; hideFromChannelProgress?; execute: () => Promise<T> }) => Promise<T>",
    purpose:
      "The tool-call dispatch lifecycle wrapper: emits a tool_execution_start event, awaits the caller-supplied execute() closure, then emits tool_execution_end with either the result (isError: false) or a normalized error result (isError: true) before rethrowing. Every tool invocation observed this pass goes through this wrapper.",
    architecturalRole: "dispatcher",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:toolSearchCatalogExecutor",
    fileKey: "src/agents/embedded-agent-runner/run/attempt-stream-prepare.ts",
    name: "toolSearchCatalogExecutor",
    kind: "function",
    startLine: 292,
    endLine: 330,
    signature:
      "const toolSearchCatalogExecutor: ToolSearchCatalogToolExecutor = async (toolParams) => { ... }",
    purpose:
      "Confirmed call site that resolves a matched tool object and invokes it: calls subscription.runToolLifecycle({ ...args, execute: () => toolParams.tool.execute(toolCallId, input, signal, onUpdate) }), then pushes the accepted result into the transcript projection queue. Named for the 'tool search catalog' path; whether every tool call (not only tool-search-catalog-resolved ones) funnels through this exact function was not fully confirmed this pass.",
    architecturalRole: "dispatcher",
    importance: "high",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:AnyAgentTool.execute",
    fileKey: "src/agents/tools/common.ts",
    name: "AnyAgentTool",
    kind: "type",
    startLine: 44,
    endLine: 69,
    signature:
      'type AnyAgentTool = Omit<AgentTool, "execute"> & { execute(this: void, toolCallId: string, params: unknown, signal?: AbortSignal, onUpdate?: AgentToolUpdateCallback): Promise<AgentToolResult<unknown>> }',
    purpose:
      "Type-erased tool-implementation contract every built-in tool satisfies. `execute` is the per-tool business logic invoked by runToolLifecycle's execute closure. AgentTool<TParameters extends TSchema, TResult> is the non-erased generic form imported from ../runtime/index.js, parameterizing the tool's argument schema as a TypeBox TSchema -- the same schema library used by the wire-level Tool type in packages/llm-core.",
    architecturalRole: "interface",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "medium",
  },
];

export const toolCapabilities: SeedCapability[] = [
  {
    name: "tool registration",
    category: "tool-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Two related but distinct contracts exist: ToolDescriptor (src/tools/types.ts) is a JSON-serializable metadata/availability descriptor (owner/executor refs, plain-JsonObject inputSchema, declarative availability expression) used for discovery/planning; AgentTool / AnyAgentTool (src/agents/runtime/index.ts, src/agents/tools/common.ts) is the actual runtime implementation contract, typing its parameters as a TypeBox TSchema and exposing execute(toolCallId, params, signal, onUpdate).",
    implementationSummary:
      "Individual tools are implemented under src/agents/tools/*.ts (ask-user, agents-list, agents-wait, sessions-spawn, cron, gateway, dashboard, etc.), each presumably satisfying AgentTool and registered into the set createOpenClawCodingTools() (src/agents/agent-tools.ts:1190) assembles into an AnyAgentTool[] for a run.",
    symbols: [{ symbolKey: "sym:AnyAgentTool.execute", role: "interface" }],
  },
  {
    name: "tool dispatch",
    category: "tool-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "Confirmed this pass: runToolLifecycle (src/agents/embedded-agent-subscribe.ts:1436-1476) wraps every observed tool invocation with tool_execution_start/tool_execution_end lifecycle events. At least one caller, toolSearchCatalogExecutor (attempt-stream-prepare.ts:292-330), resolves a matched AnyAgentTool and calls it via `execute: () => toolParams.tool.execute(toolCallId, input, signal, onUpdate)` inside runToolLifecycle.",
    implementationSummary:
      "receive normalized provider tool-call event -> resolve the matching AnyAgentTool -> runToolLifecycle emits tool_execution_start -> tool.execute(...) runs -> runToolLifecycle emits tool_execution_end (success or normalized error) -> result pushed into the transcript projection queue -> appended to the continuation as a tool-result message.",
    symbols: [
      { symbolKey: "sym:runToolLifecycle", role: "dispatcher" },
      { symbolKey: "sym:toolSearchCatalogExecutor", role: "dispatcher" },
      { symbolKey: "sym:AnyAgentTool.execute", role: "implementation" },
    ],
  },
  {
    name: "tool approval",
    category: "tool-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "A before-tool-call hook evaluates whether a tool call may proceed before execution.",
    implementationSummary:
      "src/agents/agent-tools.before-tool-call.approval.ts confirmed to exist as the approval-evaluation module; src/agents/tools/ask-user-tool.ts is a built-in tool that itself pauses a run to ask the human for a decision, suggesting approval can escalate into a user-facing question rather than being purely automatic.",
    symbols: [],
  },
  {
    name: "tool execution",
    category: "tool-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "Execution context: runToolLifecycle's execute closure receives a toolCallId, decoded arguments, an AbortSignal (either the tool-call-specific signal or the run's abort controller), and an onUpdate progress callback -- confirmed directly from AnyAgentTool.execute's signature and its call site in attempt-stream-prepare.ts.",
    implementationSummary:
      "src/agents/agent-tools.abort.ts confirmed to exist for tool-call-scoped cancellation, consistent with the signal parameter threaded through execute(). Sandbox/isolation mechanics (OS-level, not just AbortSignal-based cancellation) were not located this pass -- see the 'sandboxing' capability/open question.",
    symbols: [{ symbolKey: "sym:AnyAgentTool.execute", role: "implementation" }],
  },
  {
    name: "MCP",
    category: "tool-runtime",
    status: "inferred",
    maturity: "production",
    reusable: true,
    description:
      'OpenClaw supports Model Context Protocol servers as a tool source, evidenced by src/mcp/ (top-level directory, confirmed via initial repo listing), src/agents/agent-bundle-mcp-*.ts (bundle-scoped MCP manager/runtime/tools files), and the ToolDescriptor owner/executor ref kind "mcp" with a serverId field. Exact dispatch-time behavior for MCP-sourced tools vs. native tools was not traced this pass.',
    implementationSummary:
      'src/tools/types.ts\'s ToolOwnerRef/ToolExecutorRef both have an explicit { kind: "mcp"; serverId } case, confirming MCP tools are a first-class owner/executor kind in the same ToolDescriptor contract as native tools -- not a bolted-on side path.',
    symbols: [],
  },
];

export const toolFlows: SeedFlow[] = [
  {
    name: "tool call",
    category: "tool-runtime",
    status: "confirmed",
    entrySymbolKey: "sym:runToolLifecycle",
    description:
      "The canonical tool-call flow from a normalized provider tool-call event to a model-visible tool-result message. Steps 4 (approval) and the executor-ref-based routing generality in step 5 remain partly inferred -- see step-level status.",
    terminationCondition:
      "A tool-result message (success or normalized error) is appended to the run's continuation state and the loop proceeds to the next provider call.",
    errorBehavior:
      "isToolResultError (src/agents/tool-result-error.ts) classifies a tool result as an error for downstream retry/finalization decisions; runToolLifecycle emits tool_execution_end with isError: true and a normalized error result before rethrowing.",
  },
  {
    name: "tool approval",
    category: "tool-runtime",
    status: "inferred",
    description:
      "Best-effort reconstruction of the approval-evaluation step within the tool-call flow.",
    terminationCondition:
      "Approval is granted (execution proceeds), denied (a denial tool-result is returned without executing), or escalated to the user via ask-user-tool.ts.",
    errorBehavior: "Not confirmed this pass.",
  },
];

export const toolFlowSteps: SeedFlowStep[] = [
  {
    flowName: "tool call",
    stepOrder: 1,
    title: "Receive normalized provider tool-call event",
    description:
      "The stream-normalization layer (src/llm/stream.ts / packages/ai transports) emits toolcall_start/toolcall_delta/toolcall_end events (packages/llm-core/src/types.ts:410-412) as part of the AssistantMessageEventStreamContract; toolcall_end carries the fully parsed ToolCall.",
  },
  {
    flowName: "tool call",
    stepOrder: 2,
    title: "Resolve the matching AnyAgentTool",
    description:
      "The tool-call's name is matched against the run's currently available tool set (itself already filtered by each ToolDescriptor's availability expression / the effective-tool-policy machinery).",
    fileKey: "src/tools/types.ts",
  },
  {
    flowName: "tool call",
    stepOrder: 3,
    title: "Validate/decode arguments",
    description:
      "AgentTool<TParameters extends TSchema> types tool parameters as a TypeBox schema at the implementation level (src/agents/tools/common.ts), and packages/llm-core's wire-level Tool.parameters is likewise a TypeBox TSchema validated by ValidateToolArgumentsFn (packages/llm-core/src/types.ts:691) -- confirming TypeBox as the schema/validation library used for tool arguments. The exact call site invoking ValidateToolArgumentsFn against a live ToolCall was not located this pass.",
    alternatePath: "See open_questions: exact ValidateToolArgumentsFn call site not located.",
  },
  {
    flowName: "tool call",
    stepOrder: 4,
    title: "Evaluate approval policy",
    description:
      "src/agents/agent-tools.before-tool-call.approval.ts runs before execution; can escalate to ask-user-tool.ts for an explicit human decision.",
    fileKey: "src/agents/agent-tools.before-tool-call.approval.ts",
  },
  {
    flowName: "tool call",
    stepOrder: 5,
    title: "Dispatch through runToolLifecycle",
    description:
      "runToolLifecycle emits tool_execution_start, then calls the resolved AnyAgentTool's execute(toolCallId, params, signal, onUpdate).",
    symbolKey: "sym:runToolLifecycle",
    fileKey: "src/agents/embedded-agent-subscribe.ts",
  },
  {
    flowName: "tool call",
    stepOrder: 6,
    title: "Normalize errors / classify result",
    description:
      "runToolLifecycle emits tool_execution_end with isError: false and the result on success, or isError: true with a normalized error result on failure (rethrowing after emitting). isToolResultError (src/agents/tool-result-error.ts) further classifies the outcome for retry/finalization purposes.",
    fileKey: "src/agents/tool-result-error.ts",
  },
  {
    flowName: "tool call",
    stepOrder: 7,
    title: "Append tool-result message to continuation",
    description:
      "The accepted result is pushed into the transcript projection queue (toolSearchTargetTranscriptProjections) and the run loop's per-attempt continuation state gains a tool-result message before the next provider call in the same attempt/turn.",
  },
];

export const toolDataTypes: SeedDataType[] = [
  {
    key: "dt:ToolDescriptor",
    symbolKey: undefined,
    name: "ToolDescriptor",
    category: "tool-call",
    status: "confirmed",
    persistenceScope: "process",
    providerSpecific: false,
    purpose:
      "Public descriptor contract for OpenClaw tool metadata: keeps ownership, execution, and availability metadata in one shared shape so descriptor producers and the descriptor cache agree. Distinct from AgentTool/AnyAgentTool (the runtime implementation contract) -- see dt:AgentTool.",
    fields: [
      {
        name: "name",
        typeText: "string",
        required: true,
        persisted: false,
        sensitive: false,
        description: "Tool name, matched against provider tool-call events.",
      },
      {
        name: "title",
        typeText: "string | undefined",
        required: false,
        persisted: false,
        sensitive: false,
      },
      {
        name: "description",
        typeText: "string",
        required: true,
        persisted: false,
        sensitive: false,
        description: "Sent to the provider as the tool's description.",
      },
      {
        name: "inputSchema",
        typeText: "JsonObject",
        required: true,
        persisted: false,
        sensitive: false,
        description:
          "JSON-Schema-shaped input schema (plain object, not TypeBox -- see dt:AgentTool for the TypeBox-typed runtime contract).",
      },
      {
        name: "outputSchema",
        typeText: "JsonObject | undefined",
        required: false,
        persisted: false,
        sensitive: false,
      },
      {
        name: "owner",
        typeText:
          '{ kind: "core" } | { kind: "plugin"; pluginId } | { kind: "channel"; channelId; pluginId? } | { kind: "mcp"; serverId }',
        required: true,
        persisted: false,
        sensitive: false,
        description: "Owner family responsible for defining the descriptor.",
      },
      {
        name: "executor",
        typeText:
          '{ kind: "core"; executorId } | { kind: "plugin"; pluginId; toolName } | { kind: "channel"; channelId; actionId } | { kind: "mcp"; serverId; toolName } | undefined',
        required: false,
        persisted: false,
        sensitive: false,
        description: "Runtime executor target after availability planning.",
      },
      {
        name: "availability",
        typeText: "ToolAvailabilityExpression | undefined",
        required: false,
        persisted: false,
        sensitive: false,
        description:
          "Boolean expression (allOf/anyOf) over always/auth/config/env/plugin-enabled/context signals.",
      },
      {
        name: "annotations",
        typeText: "JsonObject | undefined",
        required: false,
        persisted: false,
        sensitive: false,
      },
      {
        name: "sortKey",
        typeText: "string | undefined",
        required: false,
        persisted: false,
        sensitive: false,
      },
    ],
  },
  {
    key: "dt:AgentTool",
    symbolKey: "sym:AnyAgentTool.execute",
    name: "AgentTool / AnyAgentTool",
    category: "tool-call",
    status: "confirmed",
    persistenceScope: "process",
    providerSpecific: false,
    purpose:
      "The runtime tool-implementation contract (distinct from ToolDescriptor). AgentTool<TParameters extends TSchema, TResult> parameterizes its arguments as a TypeBox schema; AnyAgentTool type-erases that generic into a uniform execute(toolCallId, params, signal?, onUpdate?) method every built-in tool implements.",
    fields: [
      {
        name: "execute",
        typeText: "(toolCallId, params, signal?, onUpdate?) => Promise<AgentToolResult<unknown>>",
        required: true,
        persisted: false,
      },
      { name: "displaySummary", typeText: "string | undefined", required: false, persisted: false },
      {
        name: "catalogMode",
        typeText: '"direct-only" | undefined',
        required: false,
        persisted: false,
        description:
          "Keeps a tool model-visible when hidden catalog bridges cannot preserve its result contract.",
      },
      {
        name: "requiredClientCaps",
        typeText: "string[] | undefined",
        required: false,
        persisted: false,
        description: "Gateway client capabilities required before this tool can be assembled.",
      },
    ],
  },
];

export const seedTools: SeedTool[] = [
  {
    name: "ask-user",
    implementationSymbolKey: undefined,
    status: "inferred",
    approvalPolicy: "escalates to an explicit human decision",
    sandboxPolicy: undefined,
    cancellationSupport: undefined,
    longRunning: true,
    reusable: false,
    sideEffects:
      "Pauses the run and blocks on a user-facing question/response; no filesystem/network/credential access implied by its own name.",
  },
  {
    name: "sessions-spawn",
    implementationSymbolKey: undefined,
    status: "inferred",
    approvalPolicy: undefined,
    sandboxPolicy: undefined,
    cancellationSupport: undefined,
    longRunning: true,
    reusable: false,
    sideEffects:
      "Creates/launches a delegated sub-agent session (ACP spawn); mutates application state (new session/run record) and can invoke other agents.",
  },
  {
    name: "agents-wait",
    implementationSymbolKey: undefined,
    status: "inferred",
    approvalPolicy: undefined,
    sandboxPolicy: undefined,
    cancellationSupport: undefined,
    longRunning: true,
    reusable: false,
    sideEffects:
      "Waits on a previously spawned sub-agent's completion; no direct filesystem/network/credential access implied.",
  },
];

export const toolEvidence: SeedEvidence[] = [
  {
    key: "ev:tool-descriptor-shape",
    fileKey: "src/tools/types.ts",
    startLine: 50,
    endLine: 61,
    claim:
      "ToolDescriptor is the public tool contract: name/description/inputSchema/outputSchema, an owner ref distinguishing core/plugin/channel/mcp ownership, an optional distinct executor ref, and a declarative availability expression over auth/config/env/plugin-enabled/context signals.",
    evidenceType: "type-definition",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:run-tool-lifecycle",
    fileKey: "src/agents/embedded-agent-subscribe.ts",
    symbolKey: "sym:runToolLifecycle",
    startLine: 1436,
    endLine: 1476,
    claim:
      "runToolLifecycle wraps a tool execution with tool_execution_start / tool_execution_end lifecycle events, catching and normalizing errors before rethrowing.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:tool-search-catalog-executor-calls-lifecycle",
    fileKey: "src/agents/embedded-agent-runner/run/attempt-stream-prepare.ts",
    symbolKey: "sym:toolSearchCatalogExecutor",
    startLine: 292,
    endLine: 330,
    claim:
      "toolSearchCatalogExecutor resolves a tool object and invokes subscription.runToolLifecycle with an execute closure that calls toolParams.tool.execute(toolCallId, input, signal, onUpdate).",
    evidenceType: "call-site",
    confidence: 0.9,
    notes:
      "Read directly. Confidence 0.9 rather than 1.0 because this confirms one call path (the 'tool search catalog' resolution path) rather than proving it is the only path every tool call takes.",
  },
  {
    key: "ev:agent-tool-typebox-parameters",
    fileKey: "src/agents/tools/common.ts",
    symbolKey: "sym:AnyAgentTool.execute",
    startLine: 1,
    endLine: 69,
    claim:
      'AgentToolWithMeta<TParameters extends TSchema, TResult> and AnyAgentTool both type tool parameters via TypeBox (`import type { TSchema } from "typebox"`), matching the wire-level Tool.parameters type in packages/llm-core -- TypeBox is used consistently as the schema/validation library for tool arguments across both layers.',
    evidenceType: "type-definition",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
];

export const toolOpenQuestions: SeedOpenQuestion[] = [
  {
    category: "tool-runtime",
    question:
      "What is the exact function that dispatches a normalized provider tool-call event to a resolved ToolDescriptor's executor?",
    evidenceInspected:
      "RESOLVED in a follow-up pass: runToolLifecycle (src/agents/embedded-agent-subscribe.ts:1436-1476) is the confirmed lifecycle-wrapping dispatcher, called from toolSearchCatalogExecutor (src/agents/embedded-agent-runner/run/attempt-stream-prepare.ts:292-330) with `execute: () => toolParams.tool.execute(toolCallId, input, signal, onUpdate)`. Both read directly.",
    reasonUnresolved: "N/A -- resolved, with one residual nuance below.",
    likelyInterpretation:
      "toolSearchCatalogExecutor's name ('tool search catalog') suggests OpenClaw may have more than one tool-resolution path (e.g. a smaller always-in-context tool set vs. a larger searchable catalog); whether every tool call funnels through this exact function or whether a second, simpler direct-dispatch path also exists was not fully ruled out.",
    verificationMethod:
      "grep -rn 'runToolLifecycle' src/agents to enumerate every call site and confirm whether toolSearchCatalogExecutor is the only one.",
    priority: "medium",
    status: "resolved",
  },
  {
    category: "tool-runtime",
    question:
      "Is a tool call's inputSchema validated with a specific library (zod, ajv, a custom JSON-Schema validator), and where?",
    evidenceInspected:
      'RESOLVED (library identified) in a follow-up pass: both the wire-level Tool.parameters (packages/llm-core/src/types.ts:376-380, validated by ValidateToolArgumentsFn at line 691) and the runtime AgentTool/AnyAgentTool contract (src/agents/tools/common.ts, `import type { TSchema } from "typebox"`) type tool arguments as TypeBox schemas, not zod or a bespoke JSON-Schema validator. ToolDescriptor.inputSchema (src/tools/types.ts) remains a plain JsonObject, so a descriptor-to-TypeBox bridge still exists somewhere (not located).',
    reasonUnresolved:
      "The exact call site invoking ValidateToolArgumentsFn against a live ToolCall, and the ToolDescriptor.inputSchema-to-TypeBox bridge, were not located this pass.",
    likelyInterpretation:
      "packages/llm-core/src/validation.ts (confirmed to exist, has its own validation.test.ts) almost certainly implements ValidateToolArgumentsFn.",
    verificationMethod: "Read packages/llm-core/src/validation.ts in full.",
    priority: "low",
    status: "investigating",
  },
  {
    category: "tool-runtime",
    question:
      "Is tool execution sandboxed (subprocess isolation, filesystem/network restriction), and if so, how?",
    evidenceInspected:
      "RESOLVED in a follow-up pass: src/agents/sandbox.ts (read in full) and src/agents/sandbox/tool-policy.ts (read in full) confirm a pluggable Docker/SSH backend registry plus a per-tool allow/deny policy. src/config/types.sandbox.ts (read in full) confirms the Docker hardening surface (readOnlyRoot, capDrop, seccomp/AppArmor, resource limits, hardened bind-mount defaults). src/security/ was correctly identified as a SEPARATE thing (a configuration-hygiene auditor), not the sandbox mechanism -- so the earlier likely-interpretation guessing at exec_approvals_config as the sandbox mechanism was a red herring.",
    reasonUnresolved:
      "N/A -- resolved. See the tool-sandbox-runtime module and 'sandboxing' capability for the full picture.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod:
      "Remaining depth gap: docker-backend.ts, ssh-backend.ts, fs-bridge.ts, and validate-sandbox-security.ts were confirmed to exist and skimmed via exports but not read line-by-line; a future pass could read those for exact command-construction detail.",
    priority: "low",
    status: "resolved",
  },
];
