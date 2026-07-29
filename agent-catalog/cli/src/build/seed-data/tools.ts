import type {
  SeedCapability,
  SeedFlow,
  SeedFlowStep,
  SeedDataType,
  SeedTool,
  SeedEvidence,
  SeedOpenQuestion,
} from "../seed-types.js";

export const toolCapabilities: SeedCapability[] = [
  {
    name: "tool registration",
    category: "tool-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "A tool is declared as a ToolDescriptor: name, description, inputSchema/outputSchema (JSON Schema-shaped JsonObject), an owner ref (core/plugin/channel/mcp), an optional distinct executor ref, and a declarative availability expression (allOf/anyOf over auth/config/env/plugin-enabled/context signals).",
    implementationSummary:
      "src/tools/types.ts defines ToolDescriptor and its component types; individual tools are implemented under src/agents/tools/*.ts (ask-user, agents-list, agents-wait, sessions-spawn, cron, gateway, dashboard, etc.).",
    symbols: [],
  },
  {
    name: "tool dispatch",
    category: "tool-runtime",
    status: "inferred",
    maturity: "production",
    reusable: false,
    description:
      "When a provider stream emits a tool-call event, it is matched against a registered ToolDescriptor and routed to that tool's executor. The exact dispatcher function was not located and read line-by-line this pass (see open_questions) -- src/agents/agent-tools.before-tool-call.approval.ts is confirmed to sit on this path as the approval gate.",
    implementationSummary:
      "Best-effort reconstruction from file names and the ToolDescriptor executor-ref shape: normalize provider tool-call -> resolve ToolDescriptor by name -> validate args against inputSchema -> evaluate availability/approval -> execute via the executor ref's target (core/plugin/channel/mcp) -> normalize result -> append to continuation.",
    symbols: [],
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
    status: "inferred",
    maturity: "production",
    reusable: false,
    description: "Execution context and cancellation for a running tool call.",
    implementationSummary:
      "src/agents/agent-tools.abort.ts confirmed to exist for tool-call-scoped cancellation. Sandbox/isolation mechanics were not located this pass.",
    symbols: [],
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
    status: "inferred",
    description:
      "Best-effort reconstruction of the canonical tool-call flow from a normalized provider tool-call event to a model-visible tool-result message, based on the ToolDescriptor contract and the confirmed approval/abort hook points. Individual dispatcher/executor symbols were not read line-by-line this pass -- see open_questions before treating this as ground truth.",
    terminationCondition:
      "A tool-result message (success or normalized error) is appended to the run's continuation state and the loop proceeds to the next provider call.",
    errorBehavior:
      "isToolResultError (src/agents/tool-result-error.ts) classifies a tool result as an error for downstream retry/finalization decisions.",
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
      "The stream-normalization layer (src/llm/stream.ts / packages/ai transports) emits a tool-call event as part of the AssistantMessageEventStreamContract.",
  },
  {
    flowName: "tool call",
    stepOrder: 2,
    title: "Resolve the ToolDescriptor by name",
    description:
      "The tool-call's name is matched against the run's currently available tool set (itself already filtered by each ToolDescriptor's availability expression).",
    fileKey: "src/tools/types.ts",
  },
  {
    flowName: "tool call",
    stepOrder: 3,
    title: "Validate decoded arguments against inputSchema",
    description:
      "Not directly confirmed by reading a validator this pass; assumed from the presence of a typed inputSchema (JsonObject) on ToolDescriptor.",
    alternatePath: "See open_questions: exact validation library/point not located.",
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
    title: "Execute via the tool's executor ref",
    description:
      "Routed to a core executorId, a plugin's toolName, a channel's actionId, or an MCP server's toolName, per ToolExecutorRef.",
    fileKey: "src/tools/types.ts",
  },
  {
    flowName: "tool call",
    stepOrder: 6,
    title: "Normalize errors / classify result",
    description: "isToolResultError classifies the outcome for retry/finalization purposes.",
    fileKey: "src/agents/tool-result-error.ts",
  },
  {
    flowName: "tool call",
    stepOrder: 7,
    title: "Append tool-result message to continuation",
    description:
      "The run loop's per-attempt continuation state gains a tool-result message before the next provider call in the same attempt/turn.",
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
      "Public descriptor contract for OpenClaw tool metadata: keeps ownership, execution, and availability metadata in one shared shape so descriptor producers and the descriptor cache agree.",
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
        description: "JSON-Schema-shaped input schema.",
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
];

export const toolOpenQuestions: SeedOpenQuestion[] = [
  {
    category: "tool-runtime",
    question:
      "What is the exact function that dispatches a normalized provider tool-call event to a resolved ToolDescriptor's executor?",
    evidenceInspected:
      "Searched src/agents for dispatchToolCall/executeToolCall/runTool/invokeTool export patterns; no match found with the patterns tried. src/agents/tools/agent-step.ts is a strong candidate by name but was not opened this pass.",
    reasonUnresolved:
      "Research budget was reallocated to the agent loop, provider architecture, and persistence schema after early subagent research failures (account spend limit); this symbol was not personally verified before the pivot to writing the catalog.",
    likelyInterpretation:
      "Likely src/agents/tools/agent-step.ts or a sibling file in src/agents/embedded-agent-runner/run/ (e.g. attempt-tool-construction-plan.ts, attempt-tool-catalog.ts, attempt-client-tools.ts -- all confirmed to exist by directory listing).",
    verificationMethod:
      "Read src/agents/tools/agent-step.ts and src/agents/embedded-agent-runner/run/attempt-tool-construction-plan.ts in full; grep for where the tool-call event's `name` field is looked up against the tool registry.",
    priority: "high",
    status: "open",
  },
  {
    category: "tool-runtime",
    question:
      "Is a tool call's inputSchema validated with a specific library (zod, ajv, a custom JSON-Schema validator), and where?",
    evidenceInspected:
      "ToolDescriptor.inputSchema is typed as JsonObject (a plain JSON-Schema-shaped object), not a zod schema, suggesting validation happens via a generic JSON-Schema validator rather than zod inference -- but this is inferred, not confirmed by reading a validator call site.",
    reasonUnresolved: "Not traced this pass.",
    likelyInterpretation:
      "A shared JSON-Schema validation helper somewhere under src/tools or src/plugin-sdk.",
    verificationMethod:
      "grep -rn 'inputSchema' src/agents src/tools src/plugin-sdk for the validation call site.",
    priority: "medium",
    status: "open",
  },
  {
    category: "tool-runtime",
    question:
      "Is tool execution sandboxed (subprocess isolation, filesystem/network restriction), and if so, how?",
    evidenceInspected:
      "src/security/ directory exists at the repo root (confirmed via initial top-level listing) but was not opened this pass.",
    reasonUnresolved: "Not traced this pass.",
    likelyInterpretation:
      "Likely partial: shell/exec-family tools probably run through an exec-approval/sandbox policy (exec_approvals_config table confirmed in src/state/openclaw-state-schema.sql), while most tools run in-process with no OS-level sandbox.",
    verificationMethod:
      "Read src/security/*.ts and cross-reference the exec_approvals_config table's writer/reader symbols.",
    priority: "high",
    status: "open",
  },
];
