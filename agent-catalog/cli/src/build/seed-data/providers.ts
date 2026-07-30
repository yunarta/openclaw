import type {
  SeedSymbol,
  SeedCapability,
  SeedEvidence,
  SeedFlow,
  SeedFlowStep,
  SeedSnippet,
  SeedDataType,
  SeedRelationship,
  SeedFinding,
} from "../seed-types.js";

export const providerSymbols: SeedSymbol[] = [
  {
    key: "sym:llm.stream",
    fileKey: "src/llm/stream.ts",
    name: "stream",
    kind: "function",
    signature:
      "function stream<TApi extends Api>(model: Model<TApi>, context: Context, options?: ProviderStreamOptions): AssistantMessageEventStreamContract",
    startLine: 79,
    endLine: 87,
    purpose:
      "OpenClaw's public streaming entry point. Defers the actual call until the transport-runtime host is configured, then resolves the model's runtime (getModelLlmRuntime or the default @openclaw/ai runtime) and calls its .stream().",
    architecturalRole: "entry-point",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:llm.complete",
    fileKey: "src/llm/stream.ts",
    name: "complete",
    kind: "function",
    signature:
      "async function complete<TApi extends Api>(model: Model<TApi>, context: Context, options?: ProviderStreamOptions): Promise<AssistantMessage>",
    startLine: 89,
    endLine: 96,
    purpose:
      "Non-streaming variant of stream(): awaits the transport-runtime host, then resolves the model's runtime and calls its .complete().",
    architecturalRole: "entry-point",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:llm.streamSimple",
    fileKey: "src/llm/stream.ts",
    name: "streamSimple",
    kind: "function",
    startLine: 98,
    purpose: "Simplified streaming entry point taking SimpleStreamOptions.",
    architecturalRole: "entry-point",
    importance: "medium",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:llm.completeSimple",
    fileKey: "src/llm/stream.ts",
    name: "completeSimple",
    kind: "function",
    startLine: 108,
    purpose: "Simplified non-streaming entry point taking SimpleStreamOptions.",
    architecturalRole: "entry-point",
    importance: "medium",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:ensureTransportRuntimeHost",
    fileKey: "src/llm/stream.ts",
    name: "ensureTransportRuntimeHost",
    kind: "function",
    startLine: 24,
    endLine: 31,
    purpose:
      "Lazily imports and runs configureAiTransportRuntimeHost() exactly once, installing OpenClaw's host policy (proxy/TLS/private-network rules, auth wiring) into @openclaw/ai before any provider call executes.",
    architecturalRole: "bootstrap",
    importance: "high",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:registerBuiltInApiProviders",
    fileKey: "packages/ai/src/providers.ts",
    name: "registerBuiltInApiProviders",
    kind: "function",
    purpose:
      "Registers every built-in provider adapter (anthropic, openai-responses, openai-completions, google, azure, mistral, ...) into an ApiRegistry. Called once at module load by src/llm/stream.ts against defaultApiRegistry.",
    architecturalRole: "registry",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:defaultApiRegistry",
    fileKey: "packages/ai/src/internal/runtime.ts",
    name: "defaultApiRegistry",
    kind: "constant",
    purpose:
      'The process-default registry mapping an Api family (e.g. "anthropic-messages", "openai-responses") to its provider adapter implementation.',
    architecturalRole: "registry",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:defaultLlmRuntime",
    fileKey: "packages/ai/src/internal/runtime.ts",
    name: "defaultLlmRuntime",
    kind: "constant",
    purpose:
      "The default LLM runtime object exposing .stream()/.complete(), built on defaultApiRegistry. src/llm/stream.ts falls back to this when a model has no runtime-specific binding.",
    architecturalRole: "runtime",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:createAssistantMessageEventStream",
    fileKey: "packages/ai/src/utils/event-stream.ts",
    name: "createAssistantMessageEventStream",
    kind: "factory",
    purpose:
      "Creates the push/end-able AssistantMessageEventStreamContract object that every provider adapter's normalized stream is delivered through -- the canonical event-stream primitive for the whole system.",
    architecturalRole: "event-stream",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:anthropicTransportStream",
    fileKey: "packages/ai/src/transports/anthropic-transport-stream.ts",
    name: "(Anthropic transport stream reader)",
    kind: "function",
    purpose:
      "Low-level reader/parser for Anthropic's Messages API SSE stream (message_start, content_block_start/delta/stop, message_delta, message_stop, ping, error), producing the normalized internal event sequence. Exact exported symbol name not confirmed this pass (file confirmed to exist via directory listing and via its live-test counterpart src/agents/anthropic-transport-stream.live.test.ts; contents not read line-by-line).",
    architecturalRole: "stream-parser",
    importance: "critical",
    status: "inferred",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:anthropicThinkingReplay",
    fileKey: "packages/ai/src/providers/anthropic-thinking-replay.ts",
    name: "(Anthropic thinking-block replay helper)",
    kind: "function",
    purpose:
      "File name strongly indicates this persists/re-sends an extended-thinking block's opaque signature on the next turn, which Anthropic's API requires to keep prior thinking blocks valid on continuation. Exact exported symbol name and behavior not confirmed by reading this pass -- see open_questions.",
    architecturalRole: "continuation-state",
    importance: "critical",
    status: "inferred",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:openaiReasoningEffort",
    fileKey: "packages/ai/src/providers/openai-reasoning-effort.ts",
    name: "(OpenAI reasoning-effort mapper)",
    kind: "function",
    purpose:
      "File name indicates this maps a configured reasoning level onto OpenAI/Codex-family models' `reasoning.effort` request parameter -- the reasoning-configuration mechanism for that Api family. Exact exported symbol name not confirmed this pass.",
    architecturalRole: "request-builder",
    importance: "critical",
    status: "inferred",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:createCodexAppServerAgentHarness",
    fileKey: "extensions/codex/index.ts",
    name: "createCodexAppServerAgentHarness",
    kind: "factory",
    purpose:
      "Builds the AgentHarness implementation that drives the @openai/codex CLI's app-server as OpenClaw's execution engine for Codex-backed runs. Registered via api.registerAgentHarness() in the plugin's onLoad handler.",
    architecturalRole: "adapter",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:AssistantMessageEvent",
    fileKey: "packages/llm-core/src/types.ts",
    name: "AssistantMessageEvent",
    kind: "type",
    startLine: 397,
    endLine: 418,
    signature: 'type AssistantMessageEvent = { type: "start"; ... } | ... (12 variants)',
    purpose:
      "The canonical stream event discriminated union: start, text_start, text_delta, text_end, thinking_start, thinking_delta, thinking_end, toolcall_start, toolcall_delta, toolcall_end, done, error. Every provider adapter in packages/ai normalizes into this shape.",
    architecturalRole: "event-contract",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:ThinkingContent",
    fileKey: "packages/llm-core/src/types.ts",
    name: "ThinkingContent",
    kind: "interface",
    startLine: 243,
    endLine: 251,
    signature:
      'interface ThinkingContent { type: "thinking"; thinking: string; thinkingSignature?: string; redacted?: boolean }',
    purpose:
      "Provider reasoning/thinking content block. `thinking` carries real reasoning text; `thinkingSignature` is an opaque provider replay token (e.g. OpenAI Responses reasoning item ID); `redacted` marks safety-filtered content whose encrypted payload lives in thinkingSignature instead.",
    architecturalRole: "data-shape",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:llmcore.Tool",
    fileKey: "packages/llm-core/src/types.ts",
    name: "Tool",
    kind: "interface",
    startLine: 376,
    endLine: 380,
    signature:
      "interface Tool<TParameters extends TSchema = TSchema> { name: string; description: string; parameters: TParameters }",
    purpose:
      "Wire-facing tool declaration sent to a provider; `parameters` is a TypeBox TSchema, validated against an incoming ToolCall by ValidateToolArgumentsFn (types.ts:691).",
    architecturalRole: "data-shape",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:ValidateToolArgumentsFn",
    fileKey: "packages/llm-core/src/types.ts",
    name: "ValidateToolArgumentsFn",
    kind: "type",
    startLine: 691,
    endLine: 691,
    signature: "type ValidateToolArgumentsFn = (tool: Tool, toolCall: ToolCall) => unknown",
    purpose:
      "Function-shape contract for validating a ToolCall's arguments against its declaring Tool's TypeBox parameters schema. Concrete implementation expected in packages/llm-core/src/validation.ts (not read line-by-line this pass).",
    architecturalRole: "interface",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
];

export const providerCapabilities: SeedCapability[] = [
  {
    name: "Codex provider",
    category: "provider",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "Codex is integrated as a full AgentHarness backed by OpenAI's own @openai/codex npm package (pinned to 0.145.0), driven as a subprocess ('app server'), not as a hand-rolled request/response adapter.",
    implementationSummary:
      "extensions/codex/index.ts registers createCodexAppServerAgentHarness() via api.registerAgentHarness(); session lifecycle/resume is tracked in extensions/codex/src/session-catalog*.ts; turn streaming is collected in conversation-turn-collector.ts.",
    symbols: [
      { symbolKey: "sym:createCodexAppServerAgentHarness", role: "entry-point" },
      { symbolKey: "sym:registerAgentHarness", role: "dispatcher" },
    ],
  },
  {
    name: "Claude provider",
    category: "provider",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Claude/Anthropic has two paths: (1) default -- the embedded runner calls the Anthropic Messages API directly via packages/ai's anthropic provider adapter, using credentials from extensions/anthropic; (2) opt-in -- an external `claude` CLI process via extensions/anthropic/cli-backend.ts, selected only for subscription-auth billing reasons.",
    implementationSummary:
      "packages/ai/src/providers/anthropic.ts + packages/ai/src/transports/anthropic-transport-stream.ts implement the wire protocol; extensions/anthropic owns auth/catalog/CLI-backend/session-catalog. No @anthropic-ai/sdk runtime dependency anywhere in extensions/anthropic (confirmed via package.json).",
    symbols: [
      { symbolKey: "sym:anthropicTransportStream", role: "implementation" },
      { symbolKey: "sym:anthropicThinkingReplay", role: "implementation" },
    ],
  },
  {
    name: "stream normalization",
    category: "streaming",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Every provider's wire-format stream (Anthropic SSE, OpenAI Responses SSE, etc.) is parsed by a per-family transport module in packages/ai/src/transports/*.ts and normalized into one AssistantMessageEvent sequence (12 variants: start/text_*/thinking_*/toolcall_*/done/error, packages/llm-core/src/types.ts:397-418), delivered through an AssistantMessageEventStreamContract, exposed by src/llm/stream.ts's stream().",
    implementationSummary:
      "createAssistantMessageEventStream (packages/ai/src/utils/event-stream.ts) is the shared push/end-able stream primitive every transport writes into. The event union itself is defined once in @openclaw/llm-core and re-exported by @openclaw/ai and src/llm -- there is exactly one event contract for the whole provider stack, not a per-provider one.",
    symbols: [
      { symbolKey: "sym:llm.stream", role: "entry-point" },
      { symbolKey: "sym:createAssistantMessageEventStream", role: "event-producer" },
      { symbolKey: "sym:anthropicTransportStream", role: "adapter" },
      { symbolKey: "sym:AssistantMessageEvent", role: "interface" },
    ],
  },
  {
    name: "reasoning events",
    category: "provider",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "The shared ThinkingContent type (packages/llm-core/src/types.ts:243-251) exposes real reasoning text by default (`thinking: string`), plus an opaque provider-specific replay token (`thinkingSignature`) and a `redacted` flag for safety-filtered content. Per-provider behavior still differs: Anthropic replays the thinking-block signature on continuation (anthropic-thinking-replay.ts); OpenAI/Codex family maps a configurable reasoning-effort level onto the Responses API's reasoning.effort parameter (openai-reasoning-effort.ts) and Codex's own app-server manages its reasoning continuation state internally, outside OpenClaw's direct visibility once delegated to the harness. Google's ToolCall.thoughtSignature is a separate, tool-call-scoped opaque thought-context token.",
    implementationSummary:
      "ThinkingContent is the type-level source of truth for 'is reasoning hidden/summarized/exposed': exposed as text, with an orthogonal opaque-signature mechanism only for continuation. See findings 'reasoning continuation state' and 'reasoning configuration' for remaining per-provider confidence gaps.",
    symbols: [
      { symbolKey: "sym:ThinkingContent", role: "interface" },
      { symbolKey: "sym:anthropicThinkingReplay", role: "implementation" },
      { symbolKey: "sym:openaiReasoningEffort", role: "implementation" },
    ],
  },
];

export const providerFlows: SeedFlow[] = [
  {
    name: "Claude request",
    category: "provider",
    status: "confirmed",
    entrySymbolKey: "sym:llm.stream",
    description:
      "A direct (non-CLI-backend) Claude turn: from OpenClaw's internal Context to the first normalized streamed event.",
    terminationCondition:
      "packages/ai's Anthropic provider adapter returns a complete AssistantMessage or the stream ends.",
    errorBehavior:
      "Anthropic-specific errors (rate limit, overload, refusal) are classified by packages/ai/src/providers/anthropic-refusal.ts and anthropic-server-fallback.ts before surfacing to the embedded run loop's recovery/failover logic.",
  },
  {
    name: "Codex request",
    category: "provider",
    status: "confirmed",
    entrySymbolKey: "sym:createCodexAppServerAgentHarness",
    description:
      "A Codex-backed turn: the run loop resolves the Codex AgentHarness and calls its attempt contract, which drives the codex app-server subprocess through a full tool-using turn before returning.",
    terminationCondition:
      "The Codex app-server reports the conversation turn complete; conversation-turn-collector.ts assembles the collected events into the harness attempt result.",
    errorBehavior:
      "hasCodexAppServerRecoveryRetryBudget (run/codex-app-server-recovery.ts) bounds automatic recovery retries specific to this harness.",
  },
];

export const providerFlowSteps: SeedFlowStep[] = [
  {
    flowName: "Claude request",
    stepOrder: 1,
    symbolKey: "sym:llm.stream",
    title: "Caller invokes stream()",
    description:
      "The embedded run loop (via the 'openclaw' harness -> runEmbeddedAttempt) calls src/llm/stream.ts's stream(model, context, options) for an Anthropic-family model.",
  },
  {
    flowName: "Claude request",
    stepOrder: 2,
    symbolKey: "sym:ensureTransportRuntimeHost",
    title: "Ensure transport host installed",
    description:
      "Lazily configures OpenClaw's proxy/TLS/network host policy into @openclaw/ai on first use.",
  },
  {
    flowName: "Claude request",
    stepOrder: 3,
    title: "Resolve runtime and dispatch",
    description:
      "resolveRuntime(model) picks defaultLlmRuntime (or a model-specific runtime), whose .stream() looks up the anthropic-messages adapter via defaultApiRegistry.",
    fileKey: "src/llm/stream.ts",
  },
  {
    flowName: "Claude request",
    stepOrder: 4,
    title: "Build request and auth headers",
    description:
      "packages/ai/src/providers/anthropic.ts constructs the Messages API request body; packages/ai/src/providers/anthropic-auth-headers.ts attaches either an API key or an OAuth bearer token.",
    fileKey: "packages/ai/src/providers/anthropic.ts",
  },
  {
    flowName: "Claude request",
    stepOrder: 5,
    symbolKey: "sym:anthropicTransportStream",
    title: "Read and parse the SSE stream",
    description:
      "The transport module reads the response body as SSE and parses message_start/content_block_*/message_delta/message_stop events.",
  },
  {
    flowName: "Claude request",
    stepOrder: 6,
    symbolKey: "sym:createAssistantMessageEventStream",
    title: "Push normalized events",
    description:
      "Each parsed Anthropic event is translated into the shared internal event shape and pushed onto the AssistantMessageEventStreamContract the caller is iterating.",
  },

  {
    flowName: "Codex request",
    stepOrder: 1,
    symbolKey: "sym:createCodexAppServerAgentHarness",
    title: "Run loop resolves the Codex harness",
    description:
      "prepareEmbeddedRunRuntime resolves agentHarness to the registered Codex app-server harness for the selected provider/model.",
  },
  {
    flowName: "Codex request",
    stepOrder: 2,
    title: "Harness dispatches to the app-server subprocess",
    description:
      "The harness attempt contract drives the codex CLI's app-server process/session for this conversation.",
    fileKey: "extensions/codex/src/conversation-binding.ts",
  },
  {
    flowName: "Codex request",
    stepOrder: 3,
    title: "Turn events collected",
    description:
      "conversation-turn-collector.ts accumulates the app-server's streamed turn events (including any native-thread tool activity) into an OpenClaw-consumable attempt result.",
    fileKey: "extensions/codex/src/conversation-turn-collector.ts",
  },
];

export const providerEvidence: SeedEvidence[] = [
  {
    key: "ev:llm-stream-facade",
    fileKey: "src/llm/stream.ts",
    startLine: 1,
    endLine: 96,
    claim:
      "src/llm/stream.ts is a thin OpenClaw-specific facade over @openclaw/ai (packages/ai): it registers built-in providers into @openclaw/ai's defaultApiRegistry at module load and installs OpenClaw's transport host policy lazily before the first call.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:packages-ai-reusable",
    fileKey: "packages/ai/package.json",
    startLine: 1,
    endLine: 29,
    claim:
      "packages/ai is published as @openclaw/ai and described by its own authors as 'Reusable model provider adapters and streaming runtime from OpenClaw'; it has no dependency on OpenClaw core (src/**).",
    evidenceType: "documentation",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:anthropic-plugin-no-sdk-dep",
    fileKey: "extensions/anthropic/package.json",
    startLine: 1,
    endLine: 16,
    claim:
      "extensions/anthropic has no runtime dependency on @anthropic-ai/sdk (only a devDependency on @openclaw/plugin-sdk), confirming the Anthropic Messages API wire protocol is implemented in packages/ai, not in the provider plugin.",
    evidenceType: "configuration",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:codex-package-dependency",
    fileKey: "extensions/codex/package.json",
    startLine: 11,
    endLine: 11,
    claim:
      'extensions/codex depends on "@openai/codex": "0.145.0" -- Codex is integrated by depending on OpenAI\'s own codex package/CLI.',
    evidenceType: "configuration",
    confidence: 1.0,
    notes: "Grep-confirmed dependency line.",
  },
  {
    key: "ev:llm-core-reexport",
    fileKey: "packages/ai/src/types.ts",
    startLine: 1,
    endLine: 2,
    claim:
      'packages/ai/src/types.ts is a 2-line file: `export * from "@openclaw/llm-core"`. The actual type definitions live in the separate packages/llm-core workspace package.',
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:assistant-message-event-union",
    fileKey: "packages/llm-core/src/types.ts",
    symbolKey: "sym:AssistantMessageEvent",
    startLine: 397,
    endLine: 418,
    claim:
      "The full AssistantMessageEvent discriminated union has exactly 12 variants: start, text_start, text_delta, text_end, thinking_start, thinking_delta, thinking_end, toolcall_start, toolcall_delta, toolcall_end, done, error.",
    evidenceType: "type-definition",
    confidence: 1.0,
    notes: "Read directly in full; resolves open question 'full event union'.",
  },
  {
    key: "ev:thinking-content-shape",
    fileKey: "packages/llm-core/src/types.ts",
    symbolKey: "sym:ThinkingContent",
    startLine: 243,
    endLine: 251,
    claim:
      "ThinkingContent exposes real reasoning text (`thinking: string`) by default, with a separate opaque `thinkingSignature` used only for provider continuation/replay, and a `redacted` boolean for safety-filtered content (whose encrypted payload then lives in thinkingSignature).",
    evidenceType: "type-definition",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:tool-typebox-parameters",
    fileKey: "packages/llm-core/src/types.ts",
    symbolKey: "sym:llmcore.Tool",
    startLine: 373,
    endLine: 380,
    claim:
      'The wire-facing Tool interface types `parameters` as a TypeBox TSchema (`import type { TSchema } from "typebox"`), not a plain JSON-Schema object -- distinct from src/tools/types.ts\'s ToolDescriptor.inputSchema, which is a plain JsonObject.',
    evidenceType: "type-definition",
    confidence: 1.0,
    notes:
      "Read directly. The bridge between ToolDescriptor.inputSchema (JsonObject) and this Tool.parameters (TSchema) was not located this pass -- see open_questions.",
  },
];

export const providerSnippets: SeedSnippet[] = [
  {
    fileKey: "src/llm/stream.ts",
    symbolKey: "sym:llm.stream",
    title: "OpenClaw's provider-agnostic stream() facade",
    startLine: 1,
    endLine: 20,
    content: `// Streams LLM responses through registered providers and normalizes events.
// This facade owns the process-default AI runtime wiring: it installs the
// OpenClaw host policy ports and registers built-in providers exactly once,
// before any caller imports the stream API.
import { defaultApiRegistry, defaultLlmRuntime } from "@openclaw/ai/internal/runtime";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";
import { getModelLlmRuntime } from "./model-runtime-binding.js";
import "./ai-transport-host.js";
import type {
  Api,
  AssistantMessage,
  AssistantMessageEventStreamContract,
  Context,
  Model,
  ProviderStreamOptions,
  SimpleStreamOptions,
} from "./types.js";
import { createAssistantMessageEventStream } from "./utils/event-stream.js";

registerBuiltInApiProviders(defaultApiRegistry);`,
    explanation:
      "Shows the exact package boundary: OpenClaw core imports @openclaw/ai as an external package (via its published subpaths /internal/runtime and /providers) rather than duplicating provider logic in src/.",
    architecturalSignificance:
      "This is the strongest evidence in the whole repository that a standalone gateway's Provider Router could depend on @openclaw/ai largely as-is.",
  },
  {
    fileKey: "packages/llm-core/src/types.ts",
    symbolKey: "sym:ThinkingContent",
    title: "ThinkingContent: reasoning text vs. opaque replay signature vs. redaction",
    startLine: 242,
    endLine: 251,
    content: `/** Provider reasoning/thinking content block, including opaque replay signatures. */
export interface ThinkingContent {
  type: "thinking";
  thinking: string;
  thinkingSignature?: string; // e.g., for OpenAI responses, the reasoning item ID
  /** When true, the thinking content was redacted by safety filters. The opaque
   *  encrypted payload is stored in \`thinkingSignature\` so it can be passed back
   *  to the API for multi-turn continuity. */
  redacted?: boolean;
}`,
    explanation:
      "Directly settles the catalog's required 'hidden reasoning vs. summary vs. neither' question: reasoning is exposed as real text (`thinking`) by default; `thinkingSignature` is a separate, opaque, provider-specific continuation token; `redacted` is the only case where the readable text is withheld, and even then the encrypted payload is preserved (not discarded) so the model can keep referencing it on the next turn.",
    architecturalSignificance:
      "One shared, provider-agnostic reasoning contract for the whole stack -- Anthropic/OpenAI/Google-specific reasoning quirks are handled by mapping into/out of this one shape, not by exposing three different reasoning models to callers.",
  },
  {
    fileKey: "packages/llm-core/src/types.ts",
    symbolKey: "sym:AssistantMessageEvent",
    title: "The full 12-variant stream event union",
    startLine: 397,
    endLine: 418,
    content: `export type AssistantMessageEvent =
  | { type: "start"; partial: AssistantMessage }
  | { type: "text_start"; contentIndex: number; partial: AssistantMessage }
  | { type: "text_delta"; contentIndex: number; delta: string; partial?: AssistantMessage }
  | { type: "text_end"; contentIndex: number; content: string; partial: AssistantMessage }
  | { type: "thinking_start"; contentIndex: number; partial: AssistantMessage }
  | { type: "thinking_delta"; contentIndex: number; delta: string; partial: AssistantMessage }
  | { type: "thinking_end"; contentIndex: number; content: string; partial: AssistantMessage }
  | { type: "toolcall_start"; contentIndex: number; partial: AssistantMessage }
  | { type: "toolcall_delta"; contentIndex: number; delta: string; partial: AssistantMessage }
  | { type: "toolcall_end"; contentIndex: number; toolCall: ToolCall; partial: AssistantMessage }
  | { type: "done"; reason: Extract<StopReason, "stop" | "length" | "toolUse">; message: AssistantMessage }
  | { type: "error"; reason: Extract<StopReason, "aborted" | "error">; error: AssistantMessage };`,
    explanation:
      "The complete, verbatim event contract every provider adapter streams through. Note text_delta is the only variant allowed to omit `partial` (to avoid one full AssistantMessage snapshot per token); every other delta/end event always carries the current partial snapshot.",
    architecturalSignificance:
      "This is the exact shape a REST gateway's SSE/WebSocket event envelope should be designed around -- it is already transport-agnostic and provider-agnostic.",
  },
];

export const providerDataTypes: SeedDataType[] = [
  {
    key: "dt:AssistantMessageEventStreamContract",
    name: "AssistantMessageEventStreamContract",
    category: "event",
    status: "confirmed",
    persistenceScope: "run",
    providerSpecific: false,
    purpose:
      "packages/llm-core/src/types.ts:420-427 (re-exported through packages/ai and src/llm). The canonical push/end-able event-stream object type returned by stream(): push(event), end(result?), result(): Promise<AssistantMessage>. Created via createAssistantMessageEventStream().",
    fields: [
      {
        name: "push",
        typeText: "(event: AssistantMessageEvent) => void",
        required: true,
        persisted: false,
        description: "Queue one stream event for consumers.",
      },
      {
        name: "end",
        typeText: "(result?: AssistantMessage) => void",
        required: true,
        persisted: false,
        description: "Complete the stream and optionally resolve the final message.",
      },
      {
        name: "result",
        typeText: "() => Promise<AssistantMessage>",
        required: true,
        persisted: false,
        description: "Final assistant message produced by the stream.",
      },
    ],
  },
  {
    key: "dt:Model",
    name: "Model",
    category: "configuration",
    status: "confirmed",
    persistenceScope: "session",
    providerSpecific: false,
    purpose:
      "packages/llm-core/src/types.ts:618-668. Generic model reference parameterized by Api family (Model<TApi extends Api>): id/name/api/provider/baseUrl, reasoning capability + per-level thinkingLevelMap, input modalities, cost table, contextWindow (+ optional runtime-capped contextTokens), maxTokens, provider-specific params/headers, and a TApi-conditional `compat` field (OpenAICompletionsCompat | OpenAIResponsesCompat | AnthropicMessagesCompat | never).",
    fields: [
      { name: "id", typeText: "string", required: true, persisted: true },
      { name: "name", typeText: "string", required: true, persisted: true },
      { name: "api", typeText: "TApi", required: true, persisted: true },
      { name: "provider", typeText: "Provider", required: true, persisted: true },
      { name: "baseUrl", typeText: "string", required: true, persisted: true },
      { name: "reasoning", typeText: "boolean", required: true, persisted: true },
      {
        name: "thinkingLevelMap",
        typeText: "ThinkingLevelMap | undefined",
        required: false,
        persisted: true,
        description:
          "Maps OpenClaw thinking levels to provider/model-specific values; null marks a level unsupported.",
      },
      { name: "input", typeText: '("text" | "image")[]', required: true, persisted: true },
      {
        name: "cost",
        typeText: "{input;output;cacheRead;cacheWrite} ($/million tokens)",
        required: true,
        persisted: true,
      },
      { name: "contextWindow", typeText: "number", required: true, persisted: true },
      {
        name: "contextTokens",
        typeText: "number | undefined",
        required: false,
        persisted: true,
        description: "Optional effective runtime cap for compaction/session budgeting.",
      },
      { name: "maxTokens", typeText: "number", required: true, persisted: true },
      {
        name: "compat",
        typeText:
          "OpenAICompletionsCompat | OpenAIResponsesCompat | AnthropicMessagesCompat | never",
        required: false,
        persisted: true,
        providerSpecific: true,
        description:
          "Compatibility overrides for OpenAI-compatible / Anthropic-compatible endpoints; auto-detected from baseUrl if unset.",
      },
    ],
  },
];

export const providerFindings: SeedFinding[] = [
  {
    category: "reasoning continuation state",
    title: "Anthropic thinking-block replay is confirmed to exist but not confirmed in detail",
    description:
      "packages/ai/src/providers/anthropic-thinking-replay.ts exists and its name strongly implies it persists/re-sends an extended-thinking block's opaque signature so Anthropic accepts the prior thinking block on the next turn. The exact fields it manipulates, whether raw thinking text is ever exposed to OpenClaw callers, and whether it is persisted to SQLite were not verified by reading the file this pass.",
    significance:
      "This is exactly the kind of 'hidden reasoning vs. summary vs. none' distinction the catalog is required to get right; right now the answer is inferred, not confirmed.",
    recommendation:
      "Read packages/ai/src/providers/anthropic-thinking-replay.ts and packages/ai/src/providers/anthropic.ts in full and update this finding + the symbol's status to 'confirmed'.",
    status: "open",
    evidenceKey: undefined,
  },
  {
    category: "reasoning configuration",
    title: "OpenAI/Codex reasoning-effort mapping confirmed to exist, not read in detail",
    description:
      "packages/ai/src/providers/openai-reasoning-effort.ts exists (file name only). It is expected to translate an OpenClaw-internal reasoning/think level into OpenAI Responses API's reasoning.effort parameter, but the exact levels and defaults were not verified.",
    significance:
      "Needed to accurately answer 'is reasoning effort configurable, and how' for the OpenAI/Codex family specifically (as opposed to Codex's own app-server reasoning state, which is a separate, harness-level concern).",
    recommendation:
      "Read the file and cross-reference src/auto-reply/thinking.ts (ThinkLevel/ReasoningLevel types referenced elsewhere in this pass) to map OpenClaw's reasoning levels onto provider-specific parameters.",
    status: "open",
    evidenceKey: undefined,
  },
];

export const providerRelationships: SeedRelationship[] = [
  {
    fromType: "symbol",
    fromKey: "sym:llm.stream",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:ensureTransportRuntimeHost",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:llm.stream",
    relationshipType: "depends-on",
    toType: "symbol",
    toKey: "sym:defaultLlmRuntime",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:defaultLlmRuntime",
    relationshipType: "depends-on",
    toType: "symbol",
    toKey: "sym:defaultApiRegistry",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:llm.stream",
    relationshipType: "emits",
    toType: "symbol",
    toKey: "sym:createAssistantMessageEventStream",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:anthropicTransportStream",
    relationshipType: "converts",
    toType: "symbol",
    toKey: "sym:createAssistantMessageEventStream",
    status: "inferred",
    description:
      "The transport parser is expected to push its parsed events onto the shared event-stream primitive; not directly confirmed by reading both files together this pass.",
  },
  {
    fromType: "module",
    fromKey: "provider-codex",
    relationshipType: "registers",
    toType: "symbol",
    toKey: "sym:createCodexAppServerAgentHarness",
    status: "confirmed",
  },
  {
    fromType: "module",
    fromKey: "llm-facade",
    relationshipType: "depends-on",
    toType: "module",
    toKey: "ai-provider-package",
    status: "confirmed",
  },
  {
    fromType: "module",
    fromKey: "provider-anthropic",
    relationshipType: "depends-on",
    toType: "module",
    toKey: "ai-provider-package",
    status: "confirmed",
    description:
      "extensions/anthropic has no @anthropic-ai/sdk dependency, so its Claude requests must go through packages/ai's anthropic adapter.",
  },
  {
    fromType: "module",
    fromKey: "ai-provider-package",
    relationshipType: "depends-on",
    toType: "module",
    toKey: "llm-core-foundation",
    status: "confirmed",
    description:
      'packages/ai/src/types.ts is a 1-line `export * from "@openclaw/llm-core"`; the package depends on llm-core for every shared type.',
  },
  {
    fromType: "symbol",
    fromKey: "sym:llmcore.Tool",
    relationshipType: "validates",
    toType: "symbol",
    toKey: "sym:ValidateToolArgumentsFn",
    status: "confirmed",
    description:
      "A Tool's TypeBox `parameters` schema is validated against an incoming ToolCall by ValidateToolArgumentsFn.",
  },
];
