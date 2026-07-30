# Agent Loop

## Capability: agent loop

**Status:** confirmed  **Category:** agent-runtime  **Maturity:** production

OpenClaw's embedded agent execution loop: admits a run, resolves a harness (embedded or plugin-provided), repeatedly dispatches provider attempts, recovers from failures, and resolves a terminal outcome.

> runEmbeddedAgent (entry) -> runEmbeddedAgentInternal (session/lane/hook setup, CLI-backend fork) -> executePreparedEmbeddedRun -> runPreparedEmbeddedLoop (while(true): dispatch -> normalize -> recover -> handle-assistant-failure -> finalize -> resolve-terminal).

## Flow: new agent request

**Status:** confirmed  **Category:** agent-runtime

1. **Capture lifecycle generation** (`runEmbeddedAgent`) `src/agents/embedded-agent-runner/run-orchestrator.ts:73-94`
   runEmbeddedAgent resolves runtime config if none was passed, captures/derives the run's lifecycle generation, and calls runEmbeddedAgentInternal inside withAgentRunLifecycleGeneration.
2. **Resolve session identity and admission** (`runEmbeddedAgentInternal`) `src/agents/embedded-agent-runner/run-orchestrator.ts:96-374`
   Backfills sessionKey, calls assertAgentHarnessRunAdmission, resolves the session target via resolveAgentRunSessionTarget, and builds the lane controller.
3. **Enqueue on session lane, then global lane** (`createEmbeddedRunLaneController`) `src/agents/embedded-agent-runner/run/lane-controller.ts`
   enqueueSession(...) then, inside it, enqueueGlobal(...) serialize this run against other runs on the same session and against the global concurrency limit.
4. **Check opt-in CLI-backend dispatch** (`runEmbeddedAgentViaCliBackendIfEligible`) `src/agents/embedded-agent-runner/cli-backend-dispatch.ts:38-43`
   If cliBackendDispatch === "subscription-auth" and the tool/session gates pass, the whole turn is delegated to an external CLI backend and its result returned directly, skipping the embedded loop entirely.
5. **Prepare workspace, plugins, model, hooks** `src/agents/embedded-agent-runner/run-orchestrator.ts`
   Resolves workspace/agent directories, ensures runtime plugins are loaded, resolves the initial provider/modelId, builds hook context, and runs before-agent-reply plugin hooks (which can short-circuit with a handled reply).
6. **Hand off to executePreparedEmbeddedRun** `src/agents/embedded-agent-runner/run-execution.ts`
   With workspace/model/hooks resolved, control passes to executePreparedEmbeddedRun, which (per its import site) leads into runPreparedEmbeddedLoop.
7. **Run the attempt loop to completion** (`runPreparedEmbeddedLoop`) `src/agents/embedded-agent-runner/run-loop.ts:56-672`
   See the 'agent loop' capability for the per-iteration dispatch/normalize/recover/finalize/resolve-terminal sequence.

## Flow: cancellation

**Status:** confirmed  **Category:** agent-runtime

1. **AbortController owned by the lane controller** (`createEmbeddedRunLaneController`) `src/agents/embedded-agent-runner/run/lane-controller.ts`
   createEmbeddedRunLaneController exposes laneTaskAbortController, the signal a queued/running task observes.
2. **Post-compaction loop guard can self-trigger an abort** `src/agents/embedded-agent-runner/run-loop.ts`
   run-loop.ts's observeToolOutcome feeds tool-call observations into postCompactionGuard.observe(...); if it detects a persisted post-compaction tool-loop, it calls laneTaskAbortController.abort(postCompactionAbortError) and also aborts the narrower postCompactionAbortController for the current attempt.
3. **Aborted outcome normalized into the terminal shape** (`normalizeAgentRunAttemptTerminal`) `src/agents/agent-run-terminal-outcome.ts`
   Whatever the abort source, the attempt's aborted/externalAbort flags flow into normalizeAgentRunAttemptTerminal so every caller reads cancellation the same way.

## Flow: provider fallback

**Status:** confirmed  **Category:** agent-runtime

1. **Retry limit reached without success** `src/agents/embedded-agent-runner/run-loop.ts`
   run-loop.ts's while(true) checks runLoopIterations against MAX_RUN_LOOP_ITERATIONS; once exceeded it builds a retry-limit decision.
2. **Decide whether to fail over** (`resolveRunFailoverDecision`) `src/agents/embedded-agent-runner/run/failover-policy.ts`
   resolveRunFailoverDecision({ stage: "retry_limit", fallbackConfigured, failoverReason }) returns a decision that either surfaces a terminal error or authorizes moving to the next configured fallback model/profile.
3. **Mid-attempt failover via recovery** (`recoverEmbeddedRunAttempt`) `src/agents/embedded-agent-runner/run/attempt-recovery.ts`
   Independently of the retry-limit path, recoverEmbeddedRunAttempt can itself decide to fail over (e.g. on an auth or overload error) and returns { action: "retry", lastRetryFailoverReason, ... } so the next loop iteration uses the new provider/model.

## Related capabilities

### retry

**Status:** confirmed  **Category:** agent-runtime  **Maturity:** production

Same-model / same-attempt retry handling: empty-response retries, reasoning-only-response retries, silent-error retries, idle-timeout retries, all bounded by MAX_RUN_LOOP_ITERATIONS.

> run-loop.ts tracks runLoopIterations against resolveMaxRunRetryIterations(profileCandidates.length); handleEmbeddedAssistantFailure and resolveEmbeddedRunTerminal each decide whether a given failure mode is retryable.

### usage accounting

**Status:** confirmed  **Category:** agent-runtime  **Maturity:** production

Token usage is normalized per attempt and accumulated across an entire run (including retries) into one final usage total.

> createUsageAccumulator (usage-accumulator.ts) collects normalizeUsage(...) output from each attempt; normalizeUsage lives in src/agents/usage.ts.

## Findings

- **OpenClaw is a plugin host over a reusable provider package, not a single monolithic agent loop** -- The 'agent loop' the task asked to locate is actually two layers: (1) a generic AgentHarness plugin contract (src/agents/harness/) that any provider can implement, and (2) one specific implementation of that contract -- the embedded runner (src/agents/embedded-agent-runner/) -- registered as the built-in 'openclaw' harness. Codex is a second, independent implementation of the same contract, driving the actual @openai/codex CLI as a subprocess rather than reimplementing its protocol.
  Recommendation: Treat AgentHarness (src/agents/harness/types.ts) as the primary interface to study when designing the gateway's ProviderAdapter contract.
- **packages/ai (@openclaw/ai) is the single best extraction candidate in the repository** -- packages/ai has zero dependency on OpenClaw core, is already published as a standalone npm package, and its own package.json describes it as 'Reusable model provider adapters and streaming runtime from OpenClaw'. It implements the actual wire protocols (Anthropic Messages, OpenAI Responses/Completions, Google, Azure, Bedrock, Mistral) and stream normalization that a standalone gateway needs.
  Recommendation: Start the gateway's Provider Router / Codex Adapter / Claude Adapter layers by depending on @openclaw/ai and writing a thin host-policy + harness layer around it, mirroring src/llm/stream.ts and src/agents/harness/builtin-openclaw.ts.
- **packages/ai re-exports @openclaw/llm-core, a third standalone package that is the true type foundation** -- packages/ai/src/types.ts is a 2-line file: `export * from "@openclaw/llm-core"`. The actual AssistantMessage/ToolCall/ThinkingContent/Usage/AssistantMessageEvent/Model/Tool type definitions all live in packages/llm-core/src/types.ts (691 lines), a separate workspace package (name: "@openclaw/llm-core", private, version 0.0.0-private) with its own package.json, dist build, and a dedicated validation.ts. packages/ai depends on it for types; the actual provider adapters (packages/ai/src/providers/*.ts) presumably import both.
  Recommendation: Update EXTRACTION-GUIDE.md's agent-contract layer to name packages/llm-core as the primary source, not just packages/ai/src/types.ts.
- **The agent-run event model and the Gateway wire protocol are two deliberately decoupled layers** -- packages/llm-core's AssistantMessageEvent (12-variant discriminated union) is a purely in-process, typed contract consumed via AssistantMessageEventStreamContract. src/infra/agent-events.ts normalizes any such event into an untyped { runId, seq, stream, ts, data } record on its own internal bus. packages/gateway-protocol's AgentEventSchema validates only that same generic envelope shape at the WS transport boundary, with `data` left as Type.Unknown() by explicit design (per its README's 'Intentionally open fields' section). No package in this chain re-exports or type-links the other two -- the coupling is structural/conventional, not type-level.
  Recommendation: In EXTRACTION-GUIDE.md, model the standalone gateway's event delivery the same way: keep the provider-normalized event union internal to the agent-loop layer, bridge it through a thin run/seq-stamped bus, and expose only a generic envelope schema (run id, sequence, stream name, timestamp, opaque payload) at the public REST/WS boundary.

