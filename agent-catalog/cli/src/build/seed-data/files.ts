import type { SeedFile } from "../seed-types.js";

/**
 * File inventory. Every path here was confirmed to exist during this
 * catalog pass via direct Read/Grep/Glob/ls (not inferred from naming
 * alone). `purpose` reflects what was actually observed; files that were
 * only confirmed to exist (not read in full) say so explicitly rather than
 * implying deep verification.
 */
export const files: SeedFile[] = [
  // --- @openclaw/llm-core: the type/validation foundation packages/ai re-exports ---
  {
    path: "packages/llm-core/package.json",
    category: "provider",
    importance: "critical",
    purpose:
      'Package manifest for @openclaw/llm-core, version "0.0.0-private". Confirmed to exist and be depended on by packages/ai (whose src/types.ts is a 1-line `export * from "@openclaw/llm-core"`). No provider/HTTP logic -- pure shared types plus a validation helper.',
  },
  {
    path: "packages/llm-core/src/types.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "The true source of AssistantMessage, ThinkingContent, ToolCall, Usage, Message, Tool (TypeBox-typed), Context, Model, and the AssistantMessageEvent discriminated union (12 variants). Read in full (691 lines) this pass.",
  },
  {
    path: "packages/llm-core/src/index.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist; the package's public entry barrel (not read line-by-line this pass).",
  },
  {
    path: "packages/llm-core/src/validation.ts",
    category: "tool-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist alongside types.ts and its own validation.test.ts; likely implements ValidateToolArgumentsFn (declared in types.ts line 691) against a Tool's TypeBox `parameters` schema. Not read line-by-line this pass.",
  },
  {
    path: "packages/llm-core/src/utils/diagnostics.ts",
    category: "events",
    importance: "medium",
    purpose:
      "Defines AssistantMessageDiagnostic and DiagnosticErrorInfo, re-exported from types.ts line 2. Holds redacted provider/runtime diagnostics attached to AssistantMessage.diagnostics. Not read line-by-line this pass.",
  },

  // --- Agent harness contract (src/agents/harness) ---
  {
    path: "src/agents/harness/types.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "Public AgentHarness contract: attempt params/results, support/capability negotiation types shared by the embedded runner and external harness plugins (Codex, Copilot).",
  },
  {
    path: "src/agents/harness/registry.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "Harness registry: registerAgentHarness/getRegisteredAgentHarness/listRegisteredAgentHarnesses/disposeRegisteredAgentHarnesses. The plugin-facing seam a provider plugin uses to install an alternative execution engine.",
  },
  {
    path: "src/agents/harness/builtin-openclaw.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "Registers the built-in 'openclaw' harness, which is a thin AgentHarness wrapper around runEmbeddedAttempt -- i.e. the embedded runner is itself just one harness implementation among several.",
  },
  {
    path: "src/agents/harness/lifecycle.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "runAgentHarnessLifecycleAttempt/runAgentHarnessLifecycleFinalization: wraps a harness attempt with context-engine support assertions, diagnostic trace propagation, and result-terminal normalization.",
  },
  {
    path: "src/agents/harness/selection.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist; selects/ranks a registered AgentHarness for a given provider/model/runtime request (file not read line-by-line this pass).",
  },
  {
    path: "src/agents/harness/policy.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist alongside harness registry/selection; likely governs harness-level execution policy (file not read in full this pass).",
  },
  {
    path: "src/agents/harness/result-classification.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "applyAgentHarnessResultClassification, used by lifecycle.ts to classify a harness attempt outcome (file not read in full this pass).",
  },
  {
    path: "src/agents/harness/settled-turn-finalization-result.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "Shared type/assertion for the settled-turn finalization result contract used by both lifecycle.ts and run-loop.ts.",
  },
  {
    path: "src/agents/harness/codex-app-server-extensions.ts",
    category: "provider",
    importance: "medium",
    purpose:
      "Confirmed to exist; Codex app-server specific harness extensions referenced from the lifecycle wrapper.",
  },

  // --- Embedded agent runner: top-level orchestration and loop ---
  {
    path: "src/agents/embedded-agent-runner/run-orchestrator.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "runEmbeddedAgent/runEmbeddedAgentInternal: the public entry point for a new embedded run. Resolves session identity, admission, lanes (concurrency queues), opt-in CLI-backend dispatch, before-agent-reply hooks, then hands off to executePreparedEmbeddedRun.",
  },
  {
    path: "src/agents/embedded-agent-runner/run-loop.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "runPreparedEmbeddedLoop: the actual while(true) attempt loop -- dispatch attempt, normalize, recover/retry (auth, compaction, failover), handle assistant failure, finalize, resolve terminal state or continue.",
  },
  {
    path: "src/agents/embedded-agent-runner/run-execution.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "executePreparedEmbeddedRun, called by run-orchestrator.ts after session/workspace/hook setup; bridges into runPreparedEmbeddedLoop (file referenced via import, not read line-by-line).",
  },
  {
    path: "src/agents/embedded-agent-runner/cli-backend-dispatch.ts",
    category: "provider",
    importance: "high",
    purpose:
      "runEmbeddedAgentViaCliBackendIfEligible: opt-in fork (cliBackendDispatch: \"subscription-auth\") that runs a turn through an external CLI backend (e.g. claude-cli) instead of the embedded direct-API passthrough, to avoid metered 'extra usage' billing on subscription OAuth tokens.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/cli-backend-dispatch-eligibility.ts",
    category: "provider",
    importance: "medium",
    purpose:
      "resolveEmbeddedCliBackendDispatchEligibility: shared eligibility gate used by cli-backend-dispatch.ts.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/cli-backend-dispatch-transcript.ts",
    category: "provider",
    importance: "low",
    purpose:
      "createCliDispatchTranscriptRecorder: transcript recording for CLI-backend-dispatched turns (confirmed to exist, not read in full).",
  },
  {
    path: "src/agents/embedded-agent-runner/run/attempt.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "Exports runEmbeddedAttempt, the function wrapped directly by the built-in 'openclaw' AgentHarness (builtin-openclaw.ts). This is the actual single-attempt execution unit inside the run loop (confirmed via import site, not read line-by-line this pass).",
  },
  {
    path: "src/agents/embedded-agent-runner/run/attempt-execution-phase.ts",
    category: "agent-runtime",
    importance: "high",
    purpose: "Exports runEmbeddedAttemptExecutionPhase (confirmed via grep of the export line).",
  },
  {
    path: "src/agents/embedded-agent-runner/run/attempt-dispatch-preparation.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "prepareAndDispatchEmbeddedRunAttempt: builds and dispatches one provider-call attempt inside the run loop.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/attempt-normalization.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "normalizeEmbeddedRunAttempt: normalizes a raw dispatched attempt into a common {action: complete|retry|...} shape consumed by the run loop.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/attempt-recovery.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "recoverEmbeddedRunAttempt: auth-refresh, compaction, and failover recovery for a failed/incomplete attempt; returns {action: complete|retry, ...} to the run loop.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/failover-policy.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "resolveRunFailoverDecision: decides whether/how to fail over (profile rotation, model fallback) given a failure stage and configured fallback availability.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/failover-retry-controller.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "createEmbeddedRunFailoverRetryController: tracks auth-profile failures, overload/rate-limit rotation limits, and same-model retry counters across loop iterations.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/retry-limit.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "handleRetryLimitExhaustion: builds the terminal error result once MAX_RUN_LOOP_ITERATIONS is exceeded.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/terminal-resolution.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "resolveEmbeddedRunTerminal: final per-iteration decision of whether the run loop is done (return result) or must continue (retry) -- the loop's completion-detection point.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/terminal-timeout.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "resolveEmbeddedRunTerminalTimeout: special-cases prompt-timeout terminal outcomes before the general terminal resolution runs.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/terminal-retry-state.ts",
    category: "agent-runtime",
    importance: "low",
    purpose:
      "createEmbeddedRunTerminalRetryState: mutable retry-state container threaded through terminal resolution across iterations.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/settled-turn-finalization.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "prepareTerminalWithSettledTurnFinalization: produces the single visible assistant answer for a settled (tool-call-only) turn, per AgentHarnessSettledTurnFinalizationResult.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/assistant-failure.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "handleEmbeddedAssistantFailure: decides retry vs. give-up for empty/errored assistant responses (silent-error retry, reasoning-only retry, rate-limit/overload handling).",
  },
  {
    path: "src/agents/embedded-agent-runner/run/runtime-preparation.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "prepareEmbeddedRunRuntime: resolves model, auth-profile store/candidates, and the selected AgentHarness for this run before the loop starts.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/runtime-resolution.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "resolveInitialEmbeddedRunModel: resolves the initial provider/model pair for a run from config, agent, and explicit params.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/session-bootstrap.ts",
    category: "session",
    importance: "high",
    purpose:
      "assertAgentHarnessRunAdmission/backfillSessionKey: admission control and session-key backfill executed before a run is allowed to start.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/session-prompt-state.ts",
    category: "session",
    importance: "medium",
    purpose:
      "createEmbeddedRunSessionPromptState: tracks the active prompt/session-id/session-file state threaded through the loop.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/lane-controller.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "createEmbeddedRunLaneController: per-session and global concurrency lanes (enqueueSession/enqueueGlobal) that serialize embedded runs -- the concurrency-control mechanism for the embedded runner.",
  },
  {
    path: "src/agents/embedded-agent-runner/lanes.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "resolveGlobalLane/resolveSessionLane: lane-key resolution consumed by the lane controller.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/progress-controller.ts",
    category: "events",
    importance: "medium",
    purpose:
      "createEmbeddedRunProgressController: exposes notifyExecutionPhase and fast-mode auto-reset hooks used to emit progress/phase events during a run.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/execution-phase-diagnostics.ts",
    category: "events",
    importance: "low",
    purpose: "withExecutionPhaseDiagnostics: wraps run params with diagnostic-phase tracking.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/prepared-runtime-context.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "bindRunToPreparedModelRuntime: rebinds in-flight run params to a freshly committed prepared-model-runtime generation (handles config hot-reload mid-admission).",
  },
  {
    path: "src/agents/embedded-agent-runner/run/fallbacks.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "hasEmbeddedRunConfiguredModelFallbacks: whether the run has configured model-fallback candidates available.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/recovery-message-action-capability.ts",
    category: "session",
    importance: "low",
    purpose:
      "createRecoveryMessageActionTurnCapability: reconstructs a message-action capability for a recovered/resumed run.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/attempt-stage-timing.ts",
    category: "events",
    importance: "low",
    purpose:
      "createEmbeddedRunStageTracker/createEmbeddedRunStageSummaryEmitter: startup-stage timing and log summary emission.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/idle-timeout-breaker.ts",
    category: "long-running",
    importance: "medium",
    purpose:
      "createIdleTimeoutBreakerState: run-loop-level (not per-attempt) cost-runaway breaker for repeated same-model idle timeouts; state deliberately lives above the attempt wrapper so it survives across retries.",
  },
  {
    path: "src/agents/embedded-agent-runner/post-compaction-loop-guard.ts",
    category: "long-running",
    importance: "medium",
    purpose:
      "createPostCompactionLoopGuard/PostCompactionLoopPersistedError: detects and aborts a tool-call loop that repeats after a context-compaction event.",
  },
  {
    path: "src/agents/embedded-agent-runner/replay-state.ts",
    category: "session",
    importance: "low",
    purpose:
      "createEmbeddedRunReplayState: tracks whether accumulated event/transcript replay state is still valid across retries.",
  },
  {
    path: "src/agents/embedded-agent-runner/provider-prompt-state.ts",
    category: "session",
    importance: "low",
    purpose: "clearProviderPromptState: per-run provider-side prompt-cache-state cleanup.",
  },
  {
    path: "src/agents/embedded-agent-runner/usage-accumulator.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "createUsageAccumulator: accumulates normalized token usage across retries/attempts within one run for usage accounting.",
  },
  {
    path: "src/agents/embedded-agent-runner/types.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "EmbeddedAgentRunResult and TraceAttempt types -- the run loop's return shape and per-attempt trace record.",
  },
  {
    path: "src/agents/embedded-agent-runner/logger.ts",
    category: "agent-runtime",
    importance: "low",
    purpose: "Subsystem logger for the embedded-agent-runner package.",
  },
  {
    path: "src/agents/embedded-agent-runner/abort.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist; abort-signal plumbing for the embedded runner (file not read line-by-line this pass).",
  },
  {
    path: "src/agents/embedded-agent-runner/compact.ts",
    category: "memory",
    importance: "critical",
    purpose:
      "Confirmed to exist; core context-compaction entry point for the embedded runner (file not read line-by-line this pass).",
  },
  {
    path: "src/agents/embedded-agent-runner/compact-reasons.ts",
    category: "memory",
    importance: "medium",
    purpose: "Confirmed to exist; enumerates reasons a compaction was triggered.",
  },
  {
    path: "src/agents/embedded-agent-runner/compaction-checkpoint.ts",
    category: "long-running",
    importance: "high",
    purpose:
      "Confirmed to exist; checkpoint handling specifically around a compaction boundary within a run.",
  },
  {
    path: "src/agents/embedded-agent-runner/compaction-runtime-context.ts",
    category: "memory",
    importance: "medium",
    purpose: "Confirmed to exist; runtime context passed into the compaction pipeline.",
  },
  {
    path: "src/agents/embedded-agent-runner/context-engine-maintenance.ts",
    category: "memory",
    importance: "medium",
    purpose:
      "waitForDeferredTurnMaintenanceForSession: lets a same-session run wait for a prior deferred transcript-maintenance operation before starting.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/compaction-runtime.ts",
    category: "memory",
    importance: "high",
    purpose:
      "createEmbeddedRunCompactionRuntime: builds the per-run compaction runtime bound to the resolved context engine.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/context-recovery-state.ts",
    category: "memory",
    importance: "medium",
    purpose:
      "createEmbeddedRunContextRecoveryState: tracks context-window-overflow recovery state across loop iterations.",
  },
  {
    path: "src/agents/embedded-agent-runner/run/codex-app-server-recovery.ts",
    category: "provider",
    importance: "medium",
    purpose:
      "hasCodexAppServerRecoveryRetryBudget: bounds automatic recovery retries specific to the Codex app-server harness.",
  },

  // --- Sub-agent / ACP spawn ---
  {
    path: "src/agents/acp-spawn.ts",
    category: "agent-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist; top-level ACP (Agent Client Protocol) spawn entry, the mechanism used to launch a delegated sub-agent/child session.",
  },
  {
    path: "src/agents/acp-spawn-runtime.ts",
    category: "agent-runtime",
    importance: "high",
    purpose: "Confirmed to exist; runtime execution for an ACP-spawned sub-agent.",
  },
  {
    path: "src/agents/acp-spawn-requester.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose: "Confirmed to exist; requester-side bookkeeping for an ACP spawn.",
  },
  {
    path: "src/agents/acp-spawn-target.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "Confirmed to exist; resolves the spawn target (which agent/session a delegated task runs against).",
  },
  {
    path: "src/agents/acp-spawn-admission.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose: "Confirmed to exist; admission control for ACP spawns.",
  },
  {
    path: "src/agents/acp-spawn-heartbeat.ts",
    category: "long-running",
    importance: "medium",
    purpose: "Confirmed to exist; heartbeat mechanism for a long-running ACP-spawned sub-agent.",
  },
  {
    path: "src/agents/acp-spawn-bootstrap-delivery.ts",
    category: "agent-runtime",
    importance: "low",
    purpose:
      "Confirmed to exist; delivers the bootstrap prompt/state to a newly spawned sub-agent.",
  },
  {
    path: "src/agents/acp-parent-stream-store.sqlite.ts",
    category: "persistence",
    importance: "high",
    purpose:
      "Confirmed to exist; SQLite-backed store for a parent run's view of a spawned child's event stream (acp_parent_stream_events table, confirmed in src/state/openclaw-agent-schema.sql).",
  },
  {
    path: "src/agents/tools/agents-list-tool.ts",
    category: "tool-runtime",
    importance: "medium",
    purpose:
      "Confirmed to exist; tool that lists sub-agent sessions available to spawn/delegate to.",
  },
  {
    path: "src/agents/tools/agents-wait-tool.ts",
    category: "tool-runtime",
    importance: "medium",
    purpose: "Confirmed to exist; tool that waits on a spawned sub-agent's completion.",
  },
  {
    path: "src/agents/tools/sessions-spawn-tool.ts",
    category: "tool-runtime",
    importance: "high",
    purpose:
      "Sub-agent spawn tool definition; dispatches to a spawnSubagentDirect-style runtime function (referenced during this pass; not read line-by-line).",
  },

  // --- Tool runtime ---
  {
    path: "src/tools/types.ts",
    category: "tool-runtime",
    importance: "critical",
    purpose:
      "ToolDescriptor: the public tool contract (name, description, inputSchema/outputSchema, owner ref [core|plugin|channel|mcp], executor ref, declarative ToolAvailabilityExpression over auth/config/env/plugin-enabled/context signals).",
  },
  {
    path: "src/agents/tools/agent-step.ts",
    category: "tool-runtime",
    importance: "medium",
    purpose:
      "Read in full this pass (160 lines). NOT the tool-call dispatcher (corrected from an earlier guess). Exports runAgentStep, the executor behind the sessions-send-style inter-session-messaging tool: annotates an inter-session prompt, sends it to a target session via either the in-process agentCommandFromIngress command path or a Gateway 'agent' RPC call, then waits for and returns the resulting assistant reply text.",
  },
  {
    path: "src/agents/embedded-agent-subscribe.ts",
    category: "tool-runtime",
    importance: "critical",
    purpose:
      "Exports runToolLifecycle (read directly, lines 1436-1476): wraps a tool execution with tool_execution_start / tool_execution_end lifecycle events (success or error) around an injected `execute()` closure -- the tool-call dispatch lifecycle wrapper. Also builds the large subscribeEmbeddedAgentSession() handler object consumed by the run loop (only this one exported function read in full; the rest of this large file was not read line-by-line).",
  },
  {
    path: "src/agents/embedded-agent-runner/run/attempt-stream-prepare.ts",
    category: "tool-runtime",
    importance: "high",
    purpose:
      "Confirmed call site (read lines 200-330): builds toolSearchCatalogExecutor, which calls subscription.runToolLifecycle({ ..., execute: () => toolParams.tool.execute(toolCallId, input, signal, onUpdate) }) -- i.e. this is where a resolved tool (AnyAgentTool) is actually invoked through the lifecycle wrapper. Named for the 'tool search catalog' path specifically; whether this is the single universal tool-dispatch path or one of several was not fully confirmed this pass.",
  },
  {
    path: "src/agents/tools/common.ts",
    category: "tool-runtime",
    importance: "critical",
    purpose:
      "Read lines 1-70 this pass. Defines AgentToolWithMeta and AnyAgentTool (type-erased AgentTool with `execute(toolCallId, params, signal?, onUpdate?): Promise<AgentToolResult<unknown>>`), plus jsonResult/textResult re-exports. AgentTool itself is imported from ../runtime/index.js.",
  },
  {
    path: "src/agents/runtime/index.ts",
    category: "tool-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist (55 lines); defines the base AgentTool/AgentToolProgress/AgentToolResult/AgentToolUpdateCallback types that src/agents/tools/common.ts's AnyAgentTool erases. Not read line-by-line this pass.",
  },
  {
    path: "src/agents/runtime/proxy.ts",
    category: "streaming",
    importance: "medium",
    purpose:
      "Read lines 1-55 this pass. 'Proxy stream function for apps that route LLM calls through a server': re-serializes AssistantMessageEvent as a bandwidth-reduced ProxyAssistantMessageEvent (partial field stripped) for a client app talking to a server that manages auth and proxies to LLM providers. Exports streamProxy(). Relevant to the gateway-protocol open question but not the same package as packages/gateway-protocol.",
  },
  {
    path: "src/agents/tools/ask-user-tool.ts",
    category: "tool-runtime",
    importance: "medium",
    purpose:
      "Confirmed to exist; built-in tool that pauses a run to ask the human user a question (approval/interaction primitive).",
  },
  {
    path: "src/agents/agent-tools.before-tool-call.approval.ts",
    category: "tool-runtime",
    importance: "critical",
    purpose:
      "Confirmed to exist; before-tool-call approval hook -- the tool-approval policy evaluation point in the tool dispatch path.",
  },
  {
    path: "src/agents/agent-tools.before-tool-call.diagnostics.ts",
    category: "tool-runtime",
    importance: "medium",
    purpose: "Confirmed to exist; diagnostics emitted at the before-tool-call hook point.",
  },
  {
    path: "src/agents/agent-tools.abort.ts",
    category: "tool-runtime",
    importance: "high",
    purpose: "Confirmed to exist; abort/cancellation plumbing specific to an in-flight tool call.",
  },
  {
    path: "src/agents/agent-tool-definition-adapter.ts",
    category: "tool-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist; adapts an internal tool definition into a provider-facing tool schema (test files reference after-tool-call firing-once and logging behavior).",
  },
  {
    path: "src/agents/tool-policy.ts",
    category: "tool-runtime",
    importance: "high",
    purpose:
      "normalizeToolName and related tool-policy helpers used by both the run loop and CLI-backend dispatch gate.",
  },
  {
    path: "src/agents/tool-result-error.ts",
    category: "tool-runtime",
    importance: "medium",
    purpose:
      "isToolResultError: classifies a tool result as an error for retry/finalization decisions.",
  },
  {
    path: "src/agents/tool-loop-detection-config.ts",
    category: "tool-runtime",
    importance: "medium",
    purpose:
      "resolveToolLoopDetectionConfig: per-agent configuration for the post-compaction tool-call loop guard.",
  },
  {
    path: "src/agents/cli-runner/tool-policy.ts",
    category: "tool-runtime",
    importance: "low",
    purpose:
      "stripOpenClawMcpToolPrefix: CLI-runner-specific tool-name normalization for the loopback MCP bridge.",
  },

  // --- Skills ---
  {
    path: "src/skills/types.ts",
    category: "skills",
    importance: "critical",
    purpose:
      "Skill metadata/contract types: OpenClawSkillMetadata (frontmatter: always, skillKey, primaryEnv, emoji, homepage, os, requires{bins,anyBins,env,config}, install specs), SkillInvocationPolicy (userInvocable/disableModelInvocation), SkillCommandSpec, SkillUsagePath (readPath points at a SKILL.md file).",
  },
  {
    path: "src/skills/loading/skill-contract.ts",
    category: "skills",
    importance: "critical",
    purpose:
      "Defines the Skill type re-exported by src/skills/types.ts (the canonical loaded-skill shape). Also home of formatSkillsForPrompt (read in full, lines 38-65): renders the compact <available_skills> XML catalog (name/description/location/version only, never full SKILL.md body) injected into the model prompt, with instructions telling the model to use its own file-read tool to load a skill's full content on demand and re-read if <version> changed. Code comment confirms this layout is deliberately kept byte-for-byte aligned with Anthropic's upstream Agent Skills formatter.",
  },
  {
    path: "src/skills/discovery",
    category: "skills",
    importance: "high",
    purpose:
      "Directory confirmed to exist: skill discovery (filesystem scan of skills/ and workspace-local skill sources).",
  },
  {
    path: "src/skills/loading",
    category: "skills",
    importance: "high",
    purpose:
      "Directory confirmed to exist: parses discovered SKILL.md files into loaded Skill records.",
  },
  {
    path: "src/skills/runtime",
    category: "skills",
    importance: "high",
    purpose: "Directory confirmed to exist: runtime activation/invocation of a loaded skill.",
  },
  {
    path: "src/skills/runtime/tool-dispatch.ts",
    category: "skills",
    importance: "critical",
    purpose:
      "resolveSkillDispatchTools (read in full, lines 51-217): policy-enforcement seam for a skill's command-dispatch: tool invocations. Runs the full normal tool-policy pipeline (profile/provider/global/agent/group/sender/sandbox/subagent/inherited allow-deny layers) before letting a skill invoke a tool. Code comment references security fix GHSA-mhm4-93fw-4qr2.",
  },
  {
    path: "src/skills/lifecycle",
    category: "skills",
    importance: "medium",
    purpose:
      "Directory confirmed to exist: skill lifecycle tracking (matches skill_lifecycle table in src/state/openclaw-state-schema.sql).",
  },
  {
    path: "src/skills/security",
    category: "security",
    importance: "medium",
    purpose: "Directory confirmed to exist: skill permission/security policy.",
  },
  {
    path: "src/skills/config",
    category: "configuration",
    importance: "low",
    purpose: "Directory confirmed to exist: skill-related configuration surface.",
  },
  {
    path: "src/skills/workshop",
    category: "skills",
    importance: "medium",
    purpose:
      "Directory confirmed to exist: matches skill_workshop_proposals/skill_workshop_proposal_rollbacks tables -- a proposal/review workflow for authoring or modifying skills.",
  },
  {
    path: "skills/video-frames/SKILL.md",
    category: "skills",
    importance: "low",
    purpose: "Example bundled skill content file (one of ~53 under top-level skills/).",
  },
  {
    path: "skills/summarize/SKILL.md",
    category: "skills",
    importance: "low",
    purpose: "Example bundled skill content file.",
  },
  {
    path: "skills/diagram-maker/SKILL.md",
    category: "skills",
    importance: "low",
    purpose: "Example bundled skill content file.",
  },

  // --- Memory / context engine ---
  {
    path: "src/context-engine/registry.ts",
    category: "memory",
    importance: "critical",
    purpose:
      "resolveContextEngine/resolveContextEngineOwnerPluginId: selects which registered context-engine implementation ('legacy' or a configured plugin-provided engine) a run uses for compaction/context management.",
  },
  {
    path: "src/context-engine/init.ts",
    category: "memory",
    importance: "high",
    purpose:
      "ensureContextEnginesInitialized: one-time initialization of the context-engine registry.",
  },
  {
    path: "src/context-engine/runtime-settings.ts",
    category: "memory",
    importance: "high",
    purpose:
      "buildContextEngineRuntimeSettings: builds the runtime settings object (token budgets, fallback/degraded reasons) passed to a context engine for a given run.",
  },
  {
    path: "src/context-engine/host-compat.ts",
    category: "memory",
    importance: "medium",
    purpose:
      "OPENCLAW_EMBEDDED_CONTEXT_ENGINE_HOST and assertContextEngineHostSupport: host-capability negotiation between a run's execution host (embedded vs. a harness) and the selected context engine.",
  },
  {
    path: "src/context-engine/types.ts",
    category: "memory",
    importance: "high",
    purpose:
      "Confirmed to exist; core context-engine type definitions (file not read line-by-line this pass).",
  },
  {
    path: "src/context-engine/legacy.ts",
    category: "memory",
    importance: "medium",
    purpose:
      "Confirmed to exist; the 'legacy' context-engine implementation (default when no plugin-provided engine is configured).",
  },
  {
    path: "src/context-engine/delegate.ts",
    category: "memory",
    importance: "low",
    purpose: "Confirmed to exist; delegation helper for context-engine operations.",
  },
  {
    path: "src/context-engine/quarantine-health.ts",
    category: "memory",
    importance: "low",
    purpose: "Confirmed to exist; health/quarantine tracking for a context engine.",
  },
  {
    path: "src/memory/root-memory-files.ts",
    category: "memory",
    importance: "medium",
    purpose:
      "Confirmed to exist under src/memory (the only file there); likely resolves root-level persistent memory files for a workspace/agent (file not read line-by-line this pass).",
  },

  // --- Sessions / persistence / long-running ---
  {
    path: "src/state/openclaw-state-schema.sql",
    category: "persistence",
    importance: "critical",
    purpose:
      "Canonical DDL for the shared state DB (state/openclaw.sqlite). Confirmed tables include auth_profile_stores, auth_profile_state, mcp_oauth_stores, diagnostic_events, skill_usage, skill_lifecycle, skill_workshop_proposals, audit_events, session_state_events, session_state_heads, session_watch_cursors, session_upstream_links, state_leases, exec_approvals_config, operator_approvals, schema_meta, device_pairing_*, onboarding_recommendations.",
  },
  {
    path: "src/state/openclaw-agent-schema.sql",
    category: "persistence",
    importance: "critical",
    purpose:
      "Canonical DDL for the per-agent DB (agents/<agentId>/agent/openclaw-agent.sqlite). Confirmed tables include schema_meta, state_leases, session_nodes, session_windows, conversations, conversation_deliveries, session_conversations, session_members, transcript_events, trajectory_runtime_events, acp_parent_stream_events, cache_entries, auth_profile_store, memory_index_meta, memory_index_sources, memory_index_chunks, memory_index_chunk_provenance, memory_embedding_cache, memory_index_state, standing_intents, session_transcript_index_state.",
  },
  {
    path: "src/state/openclaw-state-schema.generated.ts",
    category: "persistence",
    importance: "medium",
    generated: true,
    purpose: "Kysely-generated TypeScript types for the shared state DB schema.",
  },
  {
    path: "src/state/openclaw-agent-schema.generated.ts",
    category: "persistence",
    importance: "medium",
    generated: true,
    purpose: "Kysely-generated TypeScript types for the per-agent DB schema.",
  },
  {
    path: "src/state/openclaw-state-db.ts",
    category: "persistence",
    importance: "critical",
    purpose:
      "Confirmed to exist; the shared-state-DB connection/access module (file not read line-by-line this pass).",
  },
  {
    path: "src/state/openclaw-state-lease.ts",
    category: "long-running",
    importance: "critical",
    purpose:
      "Confirmed to exist; implements the state_leases table's lease acquire/release semantics -- the concurrency/locking primitive for shared runtime state.",
  },
  {
    path: "src/state/openclaw-agent-db.ts",
    category: "persistence",
    importance: "critical",
    purpose: "Confirmed to exist; the per-agent-DB connection/access module.",
  },
  {
    path: "src/state/openclaw-agent-db-lease.ts",
    category: "long-running",
    importance: "critical",
    purpose:
      "Confirmed to exist; per-agent-DB lease acquire/release, mirroring openclaw-state-lease.ts at agent scope.",
  },
  {
    path: "src/state/openclaw-agent-db-registry.ts",
    category: "persistence",
    importance: "high",
    purpose: "Confirmed to exist; registry of open per-agent DB handles.",
  },
  {
    path: "src/state/openclaw-agent-db-schema.ts",
    category: "persistence",
    importance: "medium",
    purpose: "Confirmed to exist; schema-version bootstrap/migration driver for the per-agent DB.",
  },
  {
    path: "src/state/openclaw-agent-db-session-migrations.ts",
    category: "persistence",
    importance: "medium",
    purpose: "Confirmed to exist; session-table-specific migration logic for the per-agent DB.",
  },
  {
    path: "src/state/openclaw-database-preflight.ts",
    category: "persistence",
    importance: "medium",
    purpose: "Confirmed to exist; pre-open integrity/preflight checks for a SQLite database file.",
  },
  {
    path: "src/state/agent-deletion-journal.ts",
    category: "persistence",
    importance: "low",
    purpose: "Confirmed to exist; durable journal for in-progress agent deletion.",
  },
  {
    path: "src/cron/active-jobs.ts",
    category: "long-running",
    importance: "critical",
    purpose:
      "Confirmed to exist; tracks/lists currently active scheduled (cron) jobs -- the background/scheduled-run mechanism distinct from an interactive agent run.",
  },
  {
    path: "src/cron/command-runner.ts",
    category: "long-running",
    importance: "high",
    purpose: "Confirmed to exist; executes a scheduled command/job.",
  },
  {
    path: "src/cron/delivery.ts",
    category: "long-running",
    importance: "medium",
    purpose:
      "Confirmed to exist; delivers a scheduled job's output to its configured target channel.",
  },
  {
    path: "src/cron/heartbeat-monitor.ts",
    category: "long-running",
    importance: "medium",
    purpose: "Confirmed to exist; heartbeat monitoring for scheduled/background jobs.",
  },
  {
    path: "src/cron/heartbeat-policy.ts",
    category: "long-running",
    importance: "low",
    purpose:
      "Confirmed to exist; heartbeat policy configuration for cron jobs (test file name suggests: heartbeat-policy.test.ts).",
  },
  {
    path: "src/agents/agent-run-terminal-outcome.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "normalizeAgentRunAttemptTerminal/projectAgentRunAttemptTerminal: the canonical closed terminal-outcome shape for a run attempt (per root AGENTS.md: 'Agent run terminal state: normalize/merge via this file; do not rederive timeout/cancel precedence in projections').",
  },
  {
    path: "src/agents/session-suspension.ts",
    category: "session",
    importance: "high",
    purpose:
      "resolveSessionSuspensionTarget/suspendSession: suspends a session on unrecoverable failure, with a defer mode so outer fallback attempts don't suspend until the final candidate fails.",
  },
  {
    path: "src/agents/run-session-target.ts",
    category: "session",
    importance: "high",
    purpose:
      "resolveAgentRunSessionTarget/applyAgentRunSessionTargetIdentity: resolves which session (existing or new) a run attaches to.",
  },
  {
    path: "src/agents/run-cleanup-timeout.ts",
    category: "long-running",
    importance: "medium",
    purpose:
      "runAgentCleanupStep: bounded-timeout wrapper for post-run cleanup steps (context-engine dispose, bundle-MCP retire).",
  },

  // --- Generic OAuth / auth (src/llm) ---
  {
    path: "src/llm/oauth.ts",
    category: "authentication",
    importance: "high",
    purpose:
      "Public OAuth facade; re-exports everything from ./utils/oauth/index.js. Confirmed by direct read (2-line file).",
  },
  {
    path: "src/llm/utils/oauth/index.ts",
    category: "authentication",
    importance: "critical",
    purpose:
      "Confirmed to exist; the actual generic OAuth module barrel re-exported by src/llm/oauth.ts.",
  },
  {
    path: "src/llm/utils/oauth/types.ts",
    category: "authentication",
    importance: "high",
    purpose: "Confirmed to exist; shared OAuth credential/token types.",
  },
  {
    path: "src/llm/utils/oauth/anthropic.ts",
    category: "authentication",
    importance: "critical",
    purpose:
      "Confirmed to exist; Anthropic/Claude subscription OAuth login+refresh implementation.",
  },
  {
    path: "src/llm/utils/oauth/openai-chatgpt.ts",
    category: "authentication",
    importance: "critical",
    purpose:
      "Confirmed to exist; OpenAI/ChatGPT (Codex) subscription OAuth login+refresh implementation.",
  },
  {
    path: "src/llm/utils/oauth/github-copilot.ts",
    category: "authentication",
    importance: "medium",
    purpose: "Confirmed to exist; GitHub Copilot OAuth implementation.",
  },
  {
    path: "src/llm/utils/oauth/abort.ts",
    category: "authentication",
    importance: "low",
    purpose: "Confirmed to exist; abort-signal support for an in-flight OAuth exchange.",
  },
  {
    path: "src/llm/model-registry.ts",
    category: "provider",
    importance: "high",
    purpose:
      "Confirmed to exist; registry of available models per provider (model-capability detection surface).",
  },
  {
    path: "src/llm/model-runtime-binding.ts",
    category: "provider",
    importance: "medium",
    purpose: "getModelLlmRuntime: resolves which LLM runtime implementation backs a given Model.",
  },
  {
    path: "src/llm/ai-transport-host.ts",
    category: "provider",
    importance: "medium",
    purpose:
      "Confirmed to exist; installs OpenClaw's host policy ports into @openclaw/ai's transport runtime (imported for side effect by src/llm/stream.ts).",
  },
  {
    path: "src/llm/types.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "Confirmed to exist; re-exported/aliased types including AssistantMessage, Model, Api, Context, ProviderStreamOptions, AssistantMessageEventStreamContract (referenced heavily by src/llm/stream.ts; not read line-by-line this pass).",
  },
  {
    path: "src/llm/stream.ts",
    category: "streaming",
    importance: "critical",
    purpose:
      "stream()/complete()/streamSimple()/completeSimple(): the facade OpenClaw's agent loop calls to get a normalized AssistantMessageEventStreamContract from @openclaw/ai, after ensuring the OpenClaw transport-runtime host is installed.",
  },
  {
    path: "src/secrets/apply.ts",
    category: "authentication",
    importance: "high",
    purpose:
      "Confirmed to exist; applies a resolved secret/credential into runtime config (file not read line-by-line this pass).",
  },
  {
    path: "src/config/types.secrets.ts",
    category: "authentication",
    importance: "critical",
    purpose:
      "Read in full (354 lines). Defines SecretRef ({source: env|file|exec, provider, id}), SecretInput (string | SecretRef), SecretProviderConfig (env/file/exec, including a plugin-integration exec variant), coerceSecretRef (normalizes canonical/legacy/shorthand inputs), resolveSecretInputString (available/configured_unavailable/missing), and UnresolvedSecretInputError (thrown by strict reads of an unresolved ref).",
  },
  {
    path: "src/secrets/resolve.ts",
    category: "authentication",
    importance: "critical",
    purpose:
      "899 lines; read lines 820-899 this pass. Exports resolveSecretRefValue/resolveSecretRefValues (throws on first provider failure) and resolveSecretRefValuesSettledByProvider (isolates one provider's failure from the rest of a batch -- the 'owner-isolation' resolver), each grouping refs by provider for bounded concurrency with an optional shared in-flight-promise cache.",
  },
  {
    path: "src/secrets/audit.ts",
    category: "security",
    importance: "medium",
    purpose: "Confirmed to exist; secret/credential audit logging.",
  },
  {
    path: "src/secrets/auth-profiles-scan.ts",
    category: "authentication",
    importance: "medium",
    purpose:
      "Confirmed to exist; scans configured auth profiles (matches root AGENTS.md's ~/.openclaw/agents/<agentId>/agent/auth-profiles.json).",
  },
  {
    path: "src/secrets/configure.ts",
    category: "authentication",
    importance: "medium",
    purpose: "Confirmed to exist; interactive/CLI secret configuration flow.",
  },
  {
    path: "src/secrets/plan.ts",
    category: "authentication",
    importance: "low",
    purpose: "Confirmed to exist; builds a plan for applying/rotating secrets.",
  },

  // --- @openclaw/ai (packages/ai): reusable provider/streaming library ---
  {
    path: "packages/ai/package.json",
    category: "provider",
    importance: "critical",
    purpose:
      "Package manifest for @openclaw/ai, described by its own authors as 'Reusable model provider adapters and streaming runtime from OpenClaw' (keywords: ai, anthropic, google, llm, mistral, openai, streaming). No dependency on core src/** -- this is the most extraction-ready provider layer in the repository.",
  },
  {
    path: "packages/ai/src/index.ts",
    category: "provider",
    importance: "critical",
    purpose: "Confirmed to exist; the package's public entry barrel.",
  },
  {
    path: "packages/ai/src/stream.ts",
    category: "streaming",
    importance: "critical",
    purpose:
      "Confirmed to exist; the package-local (non-OpenClaw-wrapped) streaming entry point that src/llm/stream.ts builds on.",
  },
  {
    path: "packages/ai/src/api-registry.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Confirmed to exist; registers/looks up provider implementations by Api family (e.g. anthropic-messages, openai-responses).",
  },
  {
    path: "packages/ai/src/providers.ts",
    category: "provider",
    importance: "high",
    purpose:
      "Confirmed to exist; registerBuiltInApiProviders and related provider-registration entry (imported by src/llm/stream.ts).",
  },
  {
    path: "packages/ai/src/transports.ts",
    category: "streaming",
    importance: "high",
    purpose: "Confirmed to exist; transport-layer barrel.",
  },
  {
    path: "packages/ai/src/types.ts",
    category: "agent-runtime",
    importance: "critical",
    purpose:
      "Confirmed to exist; the package's own Api/Model/AssistantMessage/Context type definitions (source of truth that src/llm/types.ts wraps).",
  },
  {
    path: "packages/ai/src/host.ts",
    category: "provider",
    importance: "medium",
    purpose:
      "Confirmed to exist; host-policy port definitions a consumer (like OpenClaw core) implements to customize transport behavior (proxy, TLS, private-network policy).",
  },
  {
    path: "packages/ai/src/model-utils.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; model-capability helper utilities.",
  },
  {
    path: "packages/ai/src/env-api-keys.ts",
    category: "authentication",
    importance: "medium",
    purpose:
      "Confirmed to exist; resolves provider API keys from environment variables (plain API-key fallback path).",
  },
  {
    path: "packages/ai/src/providers/anthropic.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Confirmed to exist; the Anthropic Messages API provider adapter (request construction, response handling).",
  },
  {
    path: "packages/ai/src/providers/anthropic-usage.ts",
    category: "provider",
    importance: "high",
    purpose:
      "Confirmed to exist; converts Anthropic's usage block into normalized token/cost usage.",
  },
  {
    path: "packages/ai/src/providers/anthropic-tool-projection.ts",
    category: "tool-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist; converts internal tool schema into Anthropic's tool-use request format.",
  },
  {
    path: "packages/ai/src/providers/anthropic-thinking-replay.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Confirmed to exist; file name indicates extended-thinking block replay -- almost certainly the mechanism that persists/re-sends Claude's thinking-block signature on multi-turn continuation, which is required by Anthropic's API to keep thinking blocks valid.",
  },
  {
    path: "packages/ai/src/providers/anthropic-refusal.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; handles Anthropic refusal-stop-reason responses.",
  },
  {
    path: "packages/ai/src/providers/anthropic-server-fallback.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; server-side fallback behavior specific to the Anthropic adapter.",
  },
  {
    path: "packages/ai/src/providers/anthropic-auth-headers.ts",
    category: "authentication",
    importance: "high",
    purpose:
      "Confirmed to exist; builds the Anthropic request auth headers (API key vs. OAuth bearer token).",
  },
  {
    path: "packages/ai/src/providers/anthropic-model-contract.ts",
    category: "provider",
    importance: "medium",
    purpose:
      "Confirmed to exist; per-model capability contract for Anthropic models (context window, thinking support, etc.).",
  },
  {
    path: "packages/ai/src/providers/openai-responses.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Confirmed to exist; the OpenAI Responses API provider adapter (the API family Codex/ChatGPT-style reasoning models use).",
  },
  {
    path: "packages/ai/src/providers/openai-reasoning-effort.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Confirmed to exist; maps a configured reasoning level onto OpenAI's reasoning-effort request parameter -- the reasoning-configuration mechanism for OpenAI/Codex-family models.",
  },
  {
    path: "packages/ai/src/providers/openai-chatgpt-responses.ts",
    category: "provider",
    importance: "high",
    purpose:
      "Confirmed to exist; ChatGPT-subscription-auth variant of the OpenAI Responses adapter.",
  },
  {
    path: "packages/ai/src/providers/openai-completions.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; legacy OpenAI Chat Completions API family adapter.",
  },
  {
    path: "packages/ai/src/providers/google.ts",
    category: "provider",
    importance: "medium",
    purpose:
      "Confirmed to exist; Google Gemini provider adapter (out of primary scope but shares the same registry/transport architecture).",
  },
  {
    path: "packages/ai/src/transports/anthropic-transport-stream.ts",
    category: "streaming",
    importance: "critical",
    purpose:
      "Confirmed to exist; the low-level Anthropic SSE stream reader/parser (message_start, content_block_start/delta, message_delta, etc.) -- the true stream-normalization implementation.",
  },
  {
    path: "packages/ai/src/transports/anthropic-payload-policy.ts",
    category: "streaming",
    importance: "medium",
    purpose: "Confirmed to exist; request-payload shaping policy for the Anthropic transport.",
  },
  {
    path: "packages/ai/src/transports/provider-transport-stream.ts",
    category: "streaming",
    importance: "high",
    purpose:
      "Confirmed to exist; shared/generic transport-stream helper used across multiple provider transports.",
  },
  {
    path: "packages/ai/src/transports/openai-responses-stream-internal.ts",
    category: "streaming",
    importance: "high",
    purpose:
      "Confirmed to exist; low-level OpenAI Responses SSE stream parser (Codex/reasoning-model family).",
  },
  {
    path: "packages/ai/src/transports/openai-responses-replay.ts",
    category: "streaming",
    importance: "medium",
    purpose: "Confirmed to exist; replay/continuation support for the OpenAI Responses transport.",
  },
  {
    path: "packages/ai/src/transports/host-policy.ts",
    category: "provider",
    importance: "medium",
    purpose:
      "Confirmed to exist; applies the host-policy ports (proxy/TLS/private-network) to an outgoing transport request.",
  },
  {
    path: "packages/ai/src/internal/runtime.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Confirmed to exist; defaultApiRegistry/defaultLlmRuntime -- the package-internal runtime object src/llm/stream.ts imports directly.",
  },
  {
    path: "packages/ai/src/internal/default-runtime.ts",
    category: "provider",
    importance: "high",
    purpose: "Confirmed to exist; default runtime implementation wiring.",
  },
  {
    path: "packages/ai/src/internal/retry-after.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; parses provider Retry-After signaling for backoff.",
  },
  {
    path: "packages/ai/src/internal/retry-sleep.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; retry/backoff sleep helper shared across provider adapters.",
  },
  {
    path: "packages/ai/src/utils/event-stream.ts",
    category: "streaming",
    importance: "critical",
    purpose:
      "createAssistantMessageEventStream: the shared push/end-able event-stream primitive every provider transport writes normalized events into. Existence confirmed directly; contents not read line-by-line this pass.",
  },
  {
    path: "packages/ai/src/utils/oauth/openai-chatgpt-jwt.ts",
    category: "authentication",
    importance: "high",
    purpose:
      "Confirmed to exist; ChatGPT OAuth JWT parsing/validation helper living in the reusable package (not OpenClaw-core-specific).",
  },

  // --- Codex extension ---
  {
    path: "extensions/codex/index.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Codex plugin entry. Confirmed via direct read: registers createCodexAppServerAgentHarness() through api.registerAgentHarness(), plus a media-understanding provider, a web-search provider, and a migration provider. Also conditionally registers Codex supervision tools.",
  },
  {
    path: "extensions/codex/package.json",
    category: "configuration",
    importance: "critical",
    purpose:
      'Confirmed dependency: "@openai/codex": "0.145.0" -- Codex is integrated by depending on OpenAI\'s own codex npm package/CLI, not a hand-rolled HTTP client.',
  },
  {
    path: "extensions/codex/src/session-catalog.ts",
    category: "session",
    importance: "high",
    purpose:
      "Confirmed to exist; catalogs/tracks native Codex CLI sessions (threads) for resume/continuation.",
  },
  {
    path: "extensions/codex/src/session-catalog-node-continue.ts",
    category: "session",
    importance: "medium",
    purpose: "Confirmed to exist; resumes ('continues') an existing Codex CLI session node.",
  },
  {
    path: "extensions/codex/src/session-catalog-node-adoption.ts",
    category: "session",
    importance: "medium",
    purpose:
      "Confirmed to exist; adopts an externally created Codex session into OpenClaw's session catalog.",
  },
  {
    path: "extensions/codex/src/native-thread-tool.ts",
    category: "tool-runtime",
    importance: "high",
    purpose:
      "Confirmed to exist; exposes a Codex 'native thread' as a tool surface -- ties the Codex app-server's own turn/thread model into OpenClaw's tool layer.",
  },
  {
    path: "extensions/codex/src/supervision-tools.ts",
    category: "tool-runtime",
    importance: "medium",
    purpose:
      "Confirmed to exist; createCodexSupervisionTools -- owner-only supervision tools for a running Codex session, referenced from index.ts.",
  },
  {
    path: "extensions/codex/src/conversation-binding.ts",
    category: "session",
    importance: "high",
    purpose:
      "Confirmed to exist; binds an OpenClaw conversation/session to a Codex app-server conversation.",
  },
  {
    path: "extensions/codex/src/conversation-turn-collector.ts",
    category: "streaming",
    importance: "high",
    purpose:
      "Confirmed to exist; collects streamed turn events from the Codex app-server into an OpenClaw-consumable form.",
  },
  {
    path: "extensions/codex/src/conversation-turn-input.ts",
    category: "prompt",
    importance: "medium",
    purpose: "Confirmed to exist; builds the turn input sent to a Codex app-server conversation.",
  },
  {
    path: "extensions/codex/src/conversation-control.ts",
    category: "agent-runtime",
    importance: "medium",
    purpose:
      "Confirmed to exist; conversation-level control operations (interrupt/cancel) against a Codex app-server session.",
  },
  {
    path: "extensions/codex/src/incognito-session.ts",
    category: "session",
    importance: "low",
    purpose: "Confirmed to exist; a non-persisted ('incognito') Codex session mode.",
  },
  {
    path: "extensions/codex/src/node-cli-sessions.ts",
    category: "session",
    importance: "medium",
    purpose: "Confirmed to exist; manages the underlying `codex` CLI Node process sessions.",
  },
  {
    path: "extensions/codex/src/web-search-provider.ts",
    category: "tool-runtime",
    importance: "low",
    purpose:
      "Confirmed to exist; registers Codex's web-search capability as an OpenClaw web-search provider.",
  },
  {
    path: "extensions/codex/src/commands.ts",
    category: "application-boundary",
    importance: "low",
    purpose:
      "Confirmed to exist; user-facing chat commands for controlling the Codex plugin (out of primary scope: channel/command surface).",
  },

  // --- Anthropic / Claude extension ---
  {
    path: "extensions/anthropic/package.json",
    category: "configuration",
    importance: "critical",
    purpose:
      "Confirmed by direct read: package name \"@openclaw/anthropic-provider\", description 'OpenClaw Anthropic provider, Claude CLI, and native session catalog plugin'. Only devDependency is @openclaw/plugin-sdk -- no runtime dependency on @anthropic-ai/sdk, confirming the Messages API wire protocol is NOT implemented in this extension (it lives in packages/ai).",
  },
  {
    path: "extensions/anthropic/index.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Confirmed to exist; the Anthropic/Claude plugin entry point (auth, catalog, CLI-backend, session-catalog registration; not read line-by-line this pass).",
  },
  {
    path: "extensions/anthropic/cli-backend.ts",
    category: "provider",
    importance: "critical",
    purpose:
      "Confirmed to exist; implements the Claude CLI backend referenced by embedded-agent-runner/cli-backend-dispatch.ts's `runCliAgent` path -- drives the actual `claude` CLI as a subprocess for subscription-auth-billed turns.",
  },
  {
    path: "extensions/anthropic/cli-auth-seam.ts",
    category: "authentication",
    importance: "high",
    purpose:
      "Confirmed to exist; auth seam connecting OpenClaw's stored Claude credentials to the CLI backend.",
  },
  {
    path: "extensions/anthropic/cli-catalog.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; model catalog specific to the Claude CLI backend.",
  },
  {
    path: "extensions/anthropic/cli-migration.ts",
    category: "configuration",
    importance: "low",
    purpose:
      "Confirmed to exist; doctor-style migration for stale Claude CLI configuration/session state.",
  },
  {
    path: "extensions/anthropic/session-catalog.ts",
    category: "session",
    importance: "high",
    purpose:
      "Confirmed to exist; catalogs native Claude Code CLI sessions for resume, mirroring extensions/codex/src/session-catalog.ts.",
  },
  {
    path: "extensions/anthropic/session-catalog-adoption.ts",
    category: "session",
    importance: "medium",
    purpose:
      "Confirmed to exist; adopts an externally created Claude CLI session into OpenClaw's catalog.",
  },
  {
    path: "extensions/anthropic/session-upstream-activity.ts",
    category: "session",
    importance: "medium",
    purpose:
      "Confirmed to exist; tracks upstream (external CLI-side) activity for a bound session.",
  },
  {
    path: "extensions/anthropic/claude-model-refs.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; canonical Claude model reference/id list.",
  },
  {
    path: "extensions/anthropic/claude-desktop-groups.ts",
    category: "configuration",
    importance: "low",
    purpose: "Confirmed to exist; Claude Desktop config-group compatibility helpers.",
  },
  {
    path: "extensions/anthropic/usage.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; Claude-specific usage accounting.",
  },
  {
    path: "extensions/anthropic/stream-wrappers.ts",
    category: "streaming",
    importance: "medium",
    purpose:
      "Confirmed to exist; wraps the shared provider stream with Anthropic/Claude-plugin-specific behavior.",
  },
  {
    path: "extensions/anthropic/provider-discovery.ts",
    category: "provider",
    importance: "medium",
    purpose: "Confirmed to exist; provider/model discovery for the Anthropic plugin.",
  },
  {
    path: "extensions/anthropic/register.runtime.ts",
    category: "provider",
    importance: "high",
    purpose:
      "Confirmed to exist; lazy runtime-registration entry point (plugin-sdk convention: heavy async-path registration kept out of the eager plugin entry).",
  },
  {
    path: "extensions/anthropic/setup-api.ts",
    category: "authentication",
    importance: "medium",
    purpose: "Confirmed to exist; onboarding/setup (login) API surface for the Anthropic plugin.",
  },
];
