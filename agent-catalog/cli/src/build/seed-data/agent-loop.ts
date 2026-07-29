import type {
  SeedSymbol,
  SeedCapability,
  SeedEvidence,
  SeedFlow,
  SeedFlowStep,
  SeedSnippet,
  SeedRelationship,
} from "../seed-types.js";

export const agentLoopSymbols: SeedSymbol[] = [
  {
    key: "sym:runEmbeddedAgent",
    fileKey: "src/agents/embedded-agent-runner/run-orchestrator.ts",
    name: "runEmbeddedAgent",
    kind: "function",
    signature:
      "function runEmbeddedAgent(paramsInput: RunEmbeddedAgentParams): Promise<EmbeddedAgentRunResult>",
    startLine: 73,
    endLine: 94,
    purpose:
      "Public entry point for starting a new embedded agent run. Captures/propagates the run's lifecycle generation and delegates to runEmbeddedAgentInternal.",
    architecturalRole: "entry-point",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:runEmbeddedAgentInternal",
    fileKey: "src/agents/embedded-agent-runner/run-orchestrator.ts",
    name: "runEmbeddedAgentInternal",
    kind: "function",
    signature:
      "async function runEmbeddedAgentInternal(paramsInput: RunEmbeddedAgentInternalParams): Promise<EmbeddedAgentRunResult>",
    startLine: 96,
    endLine: 374,
    purpose:
      "Resolves session identity/admission, sets up per-session and global concurrency lanes, checks opt-in CLI-backend dispatch, acquires the prepared model runtime, runs before-agent-reply plugin hooks, then calls executePreparedEmbeddedRun.",
    architecturalRole: "orchestrator",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:runPreparedEmbeddedLoop",
    fileKey: "src/agents/embedded-agent-runner/run-loop.ts",
    name: "runPreparedEmbeddedLoop",
    kind: "function",
    signature:
      "async function runPreparedEmbeddedLoop(input: PreparedEmbeddedRunInput): Promise<EmbeddedAgentRunResult>",
    startLine: 56,
    endLine: 672,
    purpose:
      "The actual run loop. A while(true) that, each iteration: dispatches one provider-call attempt, normalizes it (complete|retry), runs recovery (auth refresh / compaction / failover, complete|retry), handles assistant failure/retry, finalizes a settled turn, resolves terminal timeout, and resolves the final terminal outcome (complete|continue).",
    architecturalRole: "loop",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:prepareAndDispatchEmbeddedRunAttempt",
    fileKey: "src/agents/embedded-agent-runner/run/attempt-dispatch-preparation.ts",
    name: "prepareAndDispatchEmbeddedRunAttempt",
    kind: "function",
    signature:
      "async function prepareAndDispatchEmbeddedRunAttempt(params): Promise<{ dispatchedAttempt, runtimePlan, startupStagesEmitted }>",
    purpose:
      "Builds and dispatches one attempt within a run-loop iteration: resolves the runtime plan and invokes the selected harness's attempt contract.",
    architecturalRole: "dispatcher",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:normalizeEmbeddedRunAttempt",
    fileKey: "src/agents/embedded-agent-runner/run/attempt-normalization.ts",
    name: "normalizeEmbeddedRunAttempt",
    kind: "function",
    signature:
      'async function normalizeEmbeddedRunAttempt(params): Promise<{ action: "complete" | "retry" | ..., ... }>',
    purpose:
      "Normalizes a raw dispatched attempt result into the loop's common action shape (complete/retry/continue-to-recovery), tracking usage and bootstrap-prompt-warning state across iterations.",
    architecturalRole: "normalizer",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:recoverEmbeddedRunAttempt",
    fileKey: "src/agents/embedded-agent-runner/run/attempt-recovery.ts",
    name: "recoverEmbeddedRunAttempt",
    kind: "function",
    signature:
      'async function recoverEmbeddedRunAttempt(params): Promise<{ action: "complete" | "retry", ... }>',
    purpose:
      "Given a normalized (non-complete) attempt, attempts auth refresh, context compaction, and/or provider failover before deciding whether the loop should retry or must complete with an error.",
    architecturalRole: "recovery",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:resolveRunFailoverDecision",
    fileKey: "src/agents/embedded-agent-runner/run/failover-policy.ts",
    name: "resolveRunFailoverDecision",
    kind: "function",
    signature:
      "function resolveRunFailoverDecision(params: { stage: string; fallbackConfigured: boolean; failoverReason: FailoverReason | null }): FailoverDecision",
    purpose:
      "Central provider-fallback policy decision: given a failure stage (e.g. retry_limit) and whether model fallbacks are configured, decides whether to fail over to another model/profile.",
    architecturalRole: "policy",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "medium",
  },
  {
    key: "sym:handleEmbeddedAssistantFailure",
    fileKey: "src/agents/embedded-agent-runner/run/assistant-failure.ts",
    name: "handleEmbeddedAssistantFailure",
    kind: "function",
    signature:
      'async function handleEmbeddedAssistantFailure(params): Promise<{ action: "retry" | "continue", thinkLevel, authRetryPending, ... }>',
    purpose:
      "Decides retry-vs-give-up for an assistant response that failed or came back empty: handles silent-error retries, reasoning-only-response retries, rate-limit/overload profile rotation, and same-model idle-timeout retries.",
    architecturalRole: "recovery",
    importance: "high",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:resolveEmbeddedRunTerminal",
    fileKey: "src/agents/embedded-agent-runner/run/terminal-resolution.ts",
    name: "resolveEmbeddedRunTerminal",
    kind: "function",
    signature:
      'async function resolveEmbeddedRunTerminal(params): Promise<{ action: "retry"; ... } | { action: "complete"; result: EmbeddedAgentRunResult }>',
    purpose:
      "The loop's completion-detection point: given the finalized terminal attempt state, decides whether the run is truly done or must loop again (e.g. one more reasoning-only/empty-response retry).",
    architecturalRole: "completion-detector",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:createEmbeddedRunLaneController",
    fileKey: "src/agents/embedded-agent-runner/run/lane-controller.ts",
    name: "createEmbeddedRunLaneController",
    kind: "factory",
    signature:
      "function createEmbeddedRunLaneController(params): { enqueueGlobal, enqueueSession, noteLaneTaskProgress, throwIfAborted, laneTaskAbortController }",
    purpose:
      "Concurrency control: builds per-session and global FIFO lanes a run is enqueued onto (enqueueSession then enqueueGlobal), and exposes the AbortController used to cancel the queued/running task.",
    architecturalRole: "concurrency-control",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "medium",
  },
  {
    key: "sym:runEmbeddedAgentViaCliBackendIfEligible",
    fileKey: "src/agents/embedded-agent-runner/cli-backend-dispatch.ts",
    name: "runEmbeddedAgentViaCliBackendIfEligible",
    kind: "function",
    signature:
      "async function runEmbeddedAgentViaCliBackendIfEligible(params: RunEmbeddedAgentParams): Promise<EmbeddedAgentRunResult | undefined>",
    startLine: 38,
    endLine: 43,
    purpose:
      'Opt-in fork point (cliBackendDispatch === "subscription-auth") that runs a whole turn through an external CLI backend (e.g. the actual claude CLI) instead of the embedded direct-API path, to keep usage on plan limits rather than metered billing. Returns undefined when not eligible so the caller falls through to the native embedded path.',
    architecturalRole: "dispatcher",
    importance: "high",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
  {
    key: "sym:registerAgentHarness",
    fileKey: "src/agents/harness/registry.ts",
    name: "registerAgentHarness",
    kind: "function",
    startLine: 31,
    purpose:
      "Registers an AgentHarness implementation (built-in 'openclaw' or a plugin-provided one such as Codex's app-server harness or Copilot's) into the process-global harness registry.",
    architecturalRole: "registry",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:getRegisteredAgentHarness",
    fileKey: "src/agents/harness/registry.ts",
    name: "getRegisteredAgentHarness",
    kind: "function",
    startLine: 47,
    purpose: "Looks up a registered AgentHarness by id.",
    architecturalRole: "registry",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:listRegisteredAgentHarnesses",
    fileKey: "src/agents/harness/registry.ts",
    name: "listRegisteredAgentHarnesses",
    kind: "function",
    startLine: 52,
    purpose: "Lists all currently registered harnesses, used for harness selection.",
    architecturalRole: "registry",
    importance: "medium",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:disposeRegisteredAgentHarnesses",
    fileKey: "src/agents/harness/registry.ts",
    name: "disposeRegisteredAgentHarnesses",
    kind: "function",
    startLine: 92,
    purpose: "Disposes all registered harnesses (process shutdown / test teardown).",
    architecturalRole: "registry",
    importance: "low",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:AgentHarness",
    fileKey: "src/agents/harness/types.ts",
    name: "AgentHarness",
    kind: "interface",
    purpose:
      "The pluggable execution-engine contract: an id, optional pluginId, support/capability negotiation, and an attempt contract (AgentHarnessAttemptParams -> AgentHarnessAttemptResult). Implemented by the built-in embedded runner ('openclaw') and by provider plugins (Codex's app-server harness).",
    architecturalRole: "interface",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:AgentHarnessAttemptParams",
    fileKey: "src/agents/harness/types.ts",
    name: "AgentHarnessAttemptParams",
    kind: "type",
    startLine: 86,
    endLine: 89,
    purpose:
      "Input to a single harness attempt: an Omit of the internal EmbeddedRunAttemptParams shape, minus trajectoryRecorder.",
    architecturalRole: "data-shape",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "medium",
  },
  {
    key: "sym:AgentHarnessAttemptResult",
    fileKey: "src/agents/harness/types.ts",
    name: "AgentHarnessAttemptResult",
    kind: "type",
    startLine: 90,
    endLine: 92,
    purpose:
      "Union of the canonical attempt result shape (EmbeddedRunAttemptResult) and a deprecated legacy shape carrying separate aborted/timedOut/idleTimedOut/promptError fields instead of a single `terminal` field.",
    architecturalRole: "data-shape",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "medium",
  },
  {
    key: "sym:createEmbeddedRunReplayState",
    fileKey: "src/agents/embedded-agent-runner/replay-state.ts",
    name: "createEmbeddedRunReplayState",
    kind: "factory",
    purpose:
      "Creates the mutable replay-validity state accumulated and threaded through run-loop iterations (accumulatedReplayState), used to decide whether prior streamed/persisted events are still valid to replay to a client after a retry.",
    architecturalRole: "state",
    importance: "medium",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "medium",
  },
  {
    key: "sym:createUsageAccumulator",
    fileKey: "src/agents/embedded-agent-runner/usage-accumulator.ts",
    name: "createUsageAccumulator",
    kind: "factory",
    purpose:
      "Accumulates normalized token usage across every attempt/retry within a single run, for final usage-accounting on the run result.",
    architecturalRole: "usage-accounting",
    importance: "medium",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:normalizeAgentRunAttemptTerminal",
    fileKey: "src/agents/agent-run-terminal-outcome.ts",
    name: "normalizeAgentRunAttemptTerminal",
    kind: "function",
    purpose:
      "Normalizes/merges the terminal outcome of a run attempt (completed / aborted / blocked / error, with timeout/cancel precedence) into one canonical shape. Root AGENTS.md: callers must not rederive timeout/cancel precedence themselves.",
    architecturalRole: "normalizer",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "medium",
  },
];

export const agentLoopCapabilities: SeedCapability[] = [
  {
    name: "agent loop",
    category: "agent-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "OpenClaw's embedded agent execution loop: admits a run, resolves a harness (embedded or plugin-provided), repeatedly dispatches provider attempts, recovers from failures, and resolves a terminal outcome.",
    implementationSummary:
      "runEmbeddedAgent (entry) -> runEmbeddedAgentInternal (session/lane/hook setup, CLI-backend fork) -> executePreparedEmbeddedRun -> runPreparedEmbeddedLoop (while(true): dispatch -> normalize -> recover -> handle-assistant-failure -> finalize -> resolve-terminal).",
    symbols: [
      { symbolKey: "sym:runEmbeddedAgent", role: "entry-point", sequenceOrder: 1 },
      { symbolKey: "sym:runEmbeddedAgentInternal", role: "implementation", sequenceOrder: 2 },
      {
        symbolKey: "sym:runEmbeddedAgentViaCliBackendIfEligible",
        role: "dispatcher",
        sequenceOrder: 3,
      },
      { symbolKey: "sym:runPreparedEmbeddedLoop", role: "implementation", sequenceOrder: 4 },
      {
        symbolKey: "sym:prepareAndDispatchEmbeddedRunAttempt",
        role: "dispatcher",
        sequenceOrder: 5,
      },
      { symbolKey: "sym:normalizeEmbeddedRunAttempt", role: "implementation", sequenceOrder: 6 },
      { symbolKey: "sym:recoverEmbeddedRunAttempt", role: "implementation", sequenceOrder: 7 },
      { symbolKey: "sym:handleEmbeddedAssistantFailure", role: "implementation", sequenceOrder: 8 },
      { symbolKey: "sym:resolveEmbeddedRunTerminal", role: "implementation", sequenceOrder: 9 },
      { symbolKey: "sym:createUsageAccumulator", role: "helper" },
      { symbolKey: "sym:normalizeAgentRunAttemptTerminal", role: "helper" },
    ],
  },
  {
    name: "provider fallback",
    category: "agent-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Decides whether/how a failed attempt should fail over to another auth profile or model, distinct from a same-model retry.",
    implementationSummary:
      "resolveRunFailoverDecision (failover-policy.ts) is consulted at the retry-limit boundary and from recoverEmbeddedRunAttempt; createEmbeddedRunFailoverRetryController (failover-retry-controller.ts) tracks rotation counts/limits across iterations.",
    symbols: [
      { symbolKey: "sym:resolveRunFailoverDecision", role: "policy" },
      { symbolKey: "sym:recoverEmbeddedRunAttempt", role: "implementation" },
    ],
  },
  {
    name: "retry",
    category: "agent-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: false,
    description:
      "Same-model / same-attempt retry handling: empty-response retries, reasoning-only-response retries, silent-error retries, idle-timeout retries, all bounded by MAX_RUN_LOOP_ITERATIONS.",
    implementationSummary:
      "run-loop.ts tracks runLoopIterations against resolveMaxRunRetryIterations(profileCandidates.length); handleEmbeddedAssistantFailure and resolveEmbeddedRunTerminal each decide whether a given failure mode is retryable.",
    symbols: [
      { symbolKey: "sym:runPreparedEmbeddedLoop", role: "implementation" },
      { symbolKey: "sym:handleEmbeddedAssistantFailure", role: "implementation" },
      { symbolKey: "sym:resolveEmbeddedRunTerminal", role: "policy" },
    ],
  },
  {
    name: "cancellation",
    category: "agent-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "An in-flight run is cancelled via an AbortController owned by the lane controller (laneTaskAbortController), which the tool-outcome/post-compaction-loop-guard path can also trigger from inside a running turn.",
    implementationSummary:
      "createEmbeddedRunLaneController exposes laneTaskAbortController; run-loop.ts's observeToolOutcome calls laneTaskAbortController.abort(...) when the post-compaction loop guard detects a persisted-loop condition. Exact propagation from an external HTTP/API cancel request into this AbortController was not traced this pass.",
    symbols: [{ symbolKey: "sym:createEmbeddedRunLaneController", role: "implementation" }],
  },
  {
    name: "usage accounting",
    category: "agent-runtime",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Token usage is normalized per attempt and accumulated across an entire run (including retries) into one final usage total.",
    implementationSummary:
      "createUsageAccumulator (usage-accumulator.ts) collects normalizeUsage(...) output from each attempt; normalizeUsage lives in src/agents/usage.ts.",
    symbols: [{ symbolKey: "sym:createUsageAccumulator", role: "implementation" }],
  },
];

export const agentLoopFlows: SeedFlow[] = [
  {
    name: "new agent request",
    category: "agent-runtime",
    status: "confirmed",
    entrySymbolKey: "sym:runEmbeddedAgent",
    description:
      "Starting a brand-new embedded agent run from a caller (channel, gateway, CLI) up through the first provider attempt.",
    terminationCondition:
      "Either runEmbeddedAgentViaCliBackendIfEligible short-circuits with a CLI-backend result, or executePreparedEmbeddedRun hands off into the run loop, which itself terminates per the 'agent loop' capability.",
    errorBehavior:
      "Errors before the loop starts (admission, hook, workspace resolution) propagate as rejected promises; errors inside the loop are handled by the recovery/failover machinery.",
  },
  {
    name: "cancellation",
    category: "agent-runtime",
    status: "confirmed",
    entrySymbolKey: "sym:createEmbeddedRunLaneController",
    description: "How an abort signal reaches and stops a running embedded attempt.",
    terminationCondition:
      "laneTaskAbortController.abort() is called; the current attempt observes the abort signal and the loop resolves an aborted terminal outcome via normalizeAgentRunAttemptTerminal.",
    errorBehavior:
      "An aborted run resolves with terminal.outcome reflecting cancellation rather than throwing; downstream callers read this from EmbeddedAgentRunResult.",
  },
  {
    name: "provider fallback",
    category: "agent-runtime",
    status: "confirmed",
    entrySymbolKey: "sym:resolveRunFailoverDecision",
    description:
      "Deciding to and executing a switch to a different model/profile after repeated failures.",
    terminationCondition:
      "resolveRunFailoverDecision returns a decision consumed either at the retry-limit boundary (handleRetryLimitExhaustion) or inside recoverEmbeddedRunAttempt, which then updates the loop's provider/modelId for the next iteration.",
    errorBehavior:
      "If no fallback is configured and the failure is not retryable, the loop returns a terminal error result instead of looping again.",
  },
];

export const agentLoopFlowSteps: SeedFlowStep[] = [
  {
    flowName: "new agent request",
    stepOrder: 1,
    symbolKey: "sym:runEmbeddedAgent",
    title: "Capture lifecycle generation",
    description:
      "runEmbeddedAgent resolves runtime config if none was passed, captures/derives the run's lifecycle generation, and calls runEmbeddedAgentInternal inside withAgentRunLifecycleGeneration.",
    inputSummary:
      "RunEmbeddedAgentParams (prompt, sessionId/sessionKey, provider/model overrides, config, ...)",
    outputSummary: "Promise<EmbeddedAgentRunResult>",
  },
  {
    flowName: "new agent request",
    stepOrder: 2,
    symbolKey: "sym:runEmbeddedAgentInternal",
    title: "Resolve session identity and admission",
    description:
      "Backfills sessionKey, calls assertAgentHarnessRunAdmission, resolves the session target via resolveAgentRunSessionTarget, and builds the lane controller.",
    stateChange: "Session target (agentId/sessionId/sessionKey) is fixed for this run.",
  },
  {
    flowName: "new agent request",
    stepOrder: 3,
    symbolKey: "sym:createEmbeddedRunLaneController",
    title: "Enqueue on session lane, then global lane",
    description:
      "enqueueSession(...) then, inside it, enqueueGlobal(...) serialize this run against other runs on the same session and against the global concurrency limit.",
    stateChange: "Run is now the active task on its session lane and holds a global lane slot.",
  },
  {
    flowName: "new agent request",
    stepOrder: 4,
    symbolKey: "sym:runEmbeddedAgentViaCliBackendIfEligible",
    title: "Check opt-in CLI-backend dispatch",
    description:
      'If cliBackendDispatch === "subscription-auth" and the tool/session gates pass, the whole turn is delegated to an external CLI backend and its result returned directly, skipping the embedded loop entirely.',
    alternatePath:
      "Eligible: returns EmbeddedAgentRunResult here and the flow ends. Not eligible: returns undefined and the flow continues to step 5.",
  },
  {
    flowName: "new agent request",
    stepOrder: 5,
    title: "Prepare workspace, plugins, model, hooks",
    description:
      "Resolves workspace/agent directories, ensures runtime plugins are loaded, resolves the initial provider/modelId, builds hook context, and runs before-agent-reply plugin hooks (which can short-circuit with a handled reply).",
    fileKey: "src/agents/embedded-agent-runner/run-orchestrator.ts",
  },
  {
    flowName: "new agent request",
    stepOrder: 6,
    title: "Hand off to executePreparedEmbeddedRun",
    description:
      "With workspace/model/hooks resolved, control passes to executePreparedEmbeddedRun, which (per its import site) leads into runPreparedEmbeddedLoop.",
    fileKey: "src/agents/embedded-agent-runner/run-execution.ts",
    outputSummary: "EmbeddedAgentRunResult once the run loop terminates.",
  },
  {
    flowName: "new agent request",
    stepOrder: 7,
    symbolKey: "sym:runPreparedEmbeddedLoop",
    title: "Run the attempt loop to completion",
    description:
      "See the 'agent loop' capability for the per-iteration dispatch/normalize/recover/finalize/resolve-terminal sequence.",
    stateChange: "Loop returns a terminal EmbeddedAgentRunResult.",
  },

  {
    flowName: "cancellation",
    stepOrder: 1,
    symbolKey: "sym:createEmbeddedRunLaneController",
    title: "AbortController owned by the lane controller",
    description:
      "createEmbeddedRunLaneController exposes laneTaskAbortController, the signal a queued/running task observes.",
  },
  {
    flowName: "cancellation",
    stepOrder: 2,
    title: "Post-compaction loop guard can self-trigger an abort",
    description:
      "run-loop.ts's observeToolOutcome feeds tool-call observations into postCompactionGuard.observe(...); if it detects a persisted post-compaction tool-loop, it calls laneTaskAbortController.abort(postCompactionAbortError) and also aborts the narrower postCompactionAbortController for the current attempt.",
    fileKey: "src/agents/embedded-agent-runner/run-loop.ts",
  },
  {
    flowName: "cancellation",
    stepOrder: 3,
    symbolKey: "sym:normalizeAgentRunAttemptTerminal",
    title: "Aborted outcome normalized into the terminal shape",
    description:
      "Whatever the abort source, the attempt's aborted/externalAbort flags flow into normalizeAgentRunAttemptTerminal so every caller reads cancellation the same way.",
    alternatePath:
      "Exact wiring from an external (e.g. HTTP API cancel) caller into laneTaskAbortController.abort() was not traced this pass -- see open_questions.",
  },

  {
    flowName: "provider fallback",
    stepOrder: 1,
    title: "Retry limit reached without success",
    description:
      "run-loop.ts's while(true) checks runLoopIterations against MAX_RUN_LOOP_ITERATIONS; once exceeded it builds a retry-limit decision.",
    fileKey: "src/agents/embedded-agent-runner/run-loop.ts",
  },
  {
    flowName: "provider fallback",
    stepOrder: 2,
    symbolKey: "sym:resolveRunFailoverDecision",
    title: "Decide whether to fail over",
    description:
      'resolveRunFailoverDecision({ stage: "retry_limit", fallbackConfigured, failoverReason }) returns a decision that either surfaces a terminal error or authorizes moving to the next configured fallback model/profile.',
  },
  {
    flowName: "provider fallback",
    stepOrder: 3,
    symbolKey: "sym:recoverEmbeddedRunAttempt",
    title: "Mid-attempt failover via recovery",
    description:
      'Independently of the retry-limit path, recoverEmbeddedRunAttempt can itself decide to fail over (e.g. on an auth or overload error) and returns { action: "retry", lastRetryFailoverReason, ... } so the next loop iteration uses the new provider/model.',
  },
];

export const agentLoopEvidence: SeedEvidence[] = [
  {
    key: "ev:run-loop-while-true",
    fileKey: "src/agents/embedded-agent-runner/run-loop.ts",
    symbolKey: "sym:runPreparedEmbeddedLoop",
    startLine: 274,
    endLine: 623,
    claim:
      "The embedded agent loop is a single while(true) inside runPreparedEmbeddedLoop that dispatches one provider attempt per iteration and either returns a terminal result or `continue`s.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes:
      "Read directly; loop body spans lines 274-623 of run-loop.ts, confirmed via full file read.",
  },
  {
    key: "ev:builtin-harness-wraps-embedded",
    fileKey: "src/agents/harness/builtin-openclaw.ts",
    startLine: 1,
    endLine: 10,
    claim:
      "The built-in 'openclaw' AgentHarness is a thin wrapper around runEmbeddedAttempt (src/agents/embedded-agent-runner/run/attempt.ts) -- the embedded runner is registered as just one harness implementation among several.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:codex-registers-harness",
    fileKey: "extensions/codex/index.ts",
    startLine: 155,
    endLine: 163,
    claim:
      "The Codex plugin registers createCodexAppServerAgentHarness() via api.registerAgentHarness(), i.e. Codex integration is implemented as an alternative AgentHarness, not as a request/response provider adapter.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:cli-backend-dispatch-purpose",
    fileKey: "src/agents/embedded-agent-runner/cli-backend-dispatch.ts",
    startLine: 1,
    endLine: 43,
    claim:
      "runEmbeddedAgentViaCliBackendIfEligible is a narrow opt-in fork (cliBackendDispatch: \"subscription-auth\") to avoid Anthropic's metered 'extra usage' billing when running direct anthropic-messages calls on subscription OAuth tokens; the default path is the embedded runner calling the provider API directly through the 'openclaw' harness.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly, including the header comment explaining the billing rationale.",
  },
  {
    key: "ev:lane-controller-concurrency",
    fileKey: "src/agents/embedded-agent-runner/run-orchestrator.ts",
    startLine: 140,
    endLine: 192,
    claim:
      "Concurrency control for embedded runs is a two-level lane system: enqueueSession(...) serializes runs on the same session, nested inside enqueueGlobal(...) which serializes against a global lane.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly.",
  },
];

export const agentLoopSnippets: SeedSnippet[] = [
  {
    fileKey: "src/agents/embedded-agent-runner/cli-backend-dispatch.ts",
    symbolKey: "sym:runEmbeddedAgentViaCliBackendIfEligible",
    title: "Opt-in CLI-backend dispatch gate",
    startLine: 1,
    endLine: 43,
    content: `/**
 * Opt-in CLI-backend dispatch for one-shot embedded runs.
 *
 * Embedded runs targeting a CLI runtime provider normally fall through to the
 * openclaw harness and call the provider API directly with that runtime's
 * credentials (\`cli_runtime_passthrough_openclaw\`). Anthropic routes direct
 * anthropic-messages calls on subscription OAuth tokens to metered "extra
 * usage" billing: without extra-usage balance the passthrough fails closed
 * with a billing error, and with it the run silently draws paid usage instead
 * of the plan limits the CLI runtime was configured for. Callers that
 * tolerate CLI latency opt in via \`cliBackendDispatch: "subscription-auth"\`
 * to run through the CLI backend on plan limits instead.
 */
...
export async function runEmbeddedAgentViaCliBackendIfEligible(
  params: RunEmbeddedAgentParams,
): Promise<EmbeddedAgentRunResult | undefined> {
  const dispatch = resolveEmbeddedCliBackendDispatch(params);
  return dispatch ? await runEmbeddedAgentViaCliBackend(params, dispatch) : undefined;
}`,
    explanation:
      "Shows the exact architectural fork between OpenClaw's two ways of running a turn against a subscription-authenticated provider: direct API passthrough (default, embedded/'openclaw' harness) vs. an external CLI process (opt-in, for billing reasons).",
    architecturalSignificance:
      "Documents a non-obvious, billing-driven dual-path design that a REST gateway reimplementation must consciously decide whether to reproduce.",
  },
  {
    fileKey: "src/agents/harness/builtin-openclaw.ts",
    title: "Built-in harness wraps the embedded runner",
    startLine: 1,
    endLine: 9,
    content: `/**
 * Built-in OpenClaw harness registration.
 *
 * Harness selection uses this factory to expose the embedded OpenClaw runtime
 * through the same AgentHarness contract as external harness plugins.
 */
import { OPENCLAW_EMBEDDED_CONTEXT_ENGINE_HOST } from "../../context-engine/host-compat.js";
import { runEmbeddedAttempt } from "../embedded-agent-runner/run/attempt.js";
import { projectSettledTurnFinalizationAttemptResult } from "./settled-turn-finalization-result.js";
import type { AgentHarness, AgentHarnessAttemptParams } from "./types.js";`,
    explanation:
      "Proves the embedded runner and any 'native' provider harness (Codex, Copilot) are peers under one AgentHarness contract, not a special-cased default with harnesses as an afterthought.",
    architecturalSignificance:
      "This is the seam a standalone gateway's ProviderAdapter interface should mirror.",
  },
];

export const agentLoopRelationships: SeedRelationship[] = [
  {
    fromType: "symbol",
    fromKey: "sym:runEmbeddedAgent",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:runEmbeddedAgentInternal",
    status: "confirmed",
    description:
      "runEmbeddedAgent delegates to runEmbeddedAgentInternal inside withAgentRunLifecycleGeneration.",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runEmbeddedAgentInternal",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:runEmbeddedAgentViaCliBackendIfEligible",
    status: "confirmed",
    description:
      "Checked once admission/lanes are set up, before falling through to the embedded loop.",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runEmbeddedAgentInternal",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:createEmbeddedRunLaneController",
    status: "confirmed",
    description: "Builds the lane controller used to enqueue this run.",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runPreparedEmbeddedLoop",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:prepareAndDispatchEmbeddedRunAttempt",
    status: "confirmed",
    description: "First step of each loop iteration.",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runPreparedEmbeddedLoop",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:normalizeEmbeddedRunAttempt",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runPreparedEmbeddedLoop",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:recoverEmbeddedRunAttempt",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runPreparedEmbeddedLoop",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:handleEmbeddedAssistantFailure",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runPreparedEmbeddedLoop",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:resolveEmbeddedRunTerminal",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:recoverEmbeddedRunAttempt",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:resolveRunFailoverDecision",
    status: "confirmed",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runPreparedEmbeddedLoop",
    relationshipType: "calls",
    toType: "symbol",
    toKey: "sym:resolveRunFailoverDecision",
    status: "confirmed",
    description: "Called directly at the retry-limit boundary as well as from within recovery.",
  },
  {
    fromType: "symbol",
    fromKey: "sym:runPreparedEmbeddedLoop",
    relationshipType: "persists",
    toType: "symbol",
    toKey: "sym:createUsageAccumulator",
    status: "confirmed",
  },
  {
    fromType: "capability",
    fromKey: "agent loop",
    relationshipType: "depends-on",
    toType: "capability",
    toKey: "provider fallback",
    status: "confirmed",
  },
  {
    fromType: "capability",
    fromKey: "agent loop",
    relationshipType: "depends-on",
    toType: "capability",
    toKey: "retry",
    status: "confirmed",
  },
  {
    fromType: "module",
    fromKey: "agent-runtime-core",
    relationshipType: "depends-on",
    toType: "module",
    toKey: "agent-harness-registry",
    status: "confirmed",
  },
  {
    fromType: "module",
    fromKey: "agent-harness-registry",
    relationshipType: "depends-on",
    toType: "module",
    toKey: "llm-facade",
    status: "confirmed",
    description:
      "The built-in harness ultimately calls into src/llm/stream.ts for direct-API provider calls.",
  },
  {
    fromType: "module",
    fromKey: "provider-codex",
    relationshipType: "registers",
    toType: "module",
    toKey: "agent-harness-registry",
    status: "confirmed",
  },
];
