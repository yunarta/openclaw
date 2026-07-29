# Tool Runtime

## Tool registration

**Status:** confirmed  **Category:** tool-runtime  **Maturity:** production

Two related but distinct contracts exist: ToolDescriptor (src/tools/types.ts) is a JSON-serializable metadata/availability descriptor (owner/executor refs, plain-JsonObject inputSchema, declarative availability expression) used for discovery/planning; AgentTool / AnyAgentTool (src/agents/runtime/index.ts, src/agents/tools/common.ts) is the actual runtime implementation contract, typing its parameters as a TypeBox TSchema and exposing execute(toolCallId, params, signal, onUpdate).

> Individual tools are implemented under src/agents/tools/*.ts (ask-user, agents-list, agents-wait, sessions-spawn, cron, gateway, dashboard, etc.), each presumably satisfying AgentTool and registered into the set createOpenClawCodingTools() (src/agents/agent-tools.ts:1190) assembles into an AnyAgentTool[] for a run.

## Tool dispatch

**Status:** confirmed  **Category:** tool-runtime  **Maturity:** production

Confirmed this pass: runToolLifecycle (src/agents/embedded-agent-subscribe.ts:1436-1476) wraps every observed tool invocation with tool_execution_start/tool_execution_end lifecycle events. At least one caller, toolSearchCatalogExecutor (attempt-stream-prepare.ts:292-330), resolves a matched AnyAgentTool and calls it via `execute: () => toolParams.tool.execute(toolCallId, input, signal, onUpdate)` inside runToolLifecycle.

> receive normalized provider tool-call event -> resolve the matching AnyAgentTool -> runToolLifecycle emits tool_execution_start -> tool.execute(...) runs -> runToolLifecycle emits tool_execution_end (success or normalized error) -> result pushed into the transcript projection queue -> appended to the continuation as a tool-result message.

## Tool approval

**Status:** confirmed  **Category:** tool-runtime  **Maturity:** production

A before-tool-call hook evaluates whether a tool call may proceed before execution.

> src/agents/agent-tools.before-tool-call.approval.ts confirmed to exist as the approval-evaluation module; src/agents/tools/ask-user-tool.ts is a built-in tool that itself pauses a run to ask the human for a decision, suggesting approval can escalate into a user-facing question rather than being purely automatic.

## Tool execution

**Status:** confirmed  **Category:** tool-runtime  **Maturity:** production

Execution context: runToolLifecycle's execute closure receives a toolCallId, decoded arguments, an AbortSignal (either the tool-call-specific signal or the run's abort controller), and an onUpdate progress callback -- confirmed directly from AnyAgentTool.execute's signature and its call site in attempt-stream-prepare.ts.

> src/agents/agent-tools.abort.ts confirmed to exist for tool-call-scoped cancellation, consistent with the signal parameter threaded through execute(). Sandbox/isolation mechanics (OS-level, not just AbortSignal-based cancellation) were not located this pass -- see the 'sandboxing' capability/open question.

## MCP

**Status:** inferred  **Category:** tool-runtime  **Maturity:** production

OpenClaw supports Model Context Protocol servers as a tool source, evidenced by src/mcp/ (top-level directory, confirmed via initial repo listing), src/agents/agent-bundle-mcp-*.ts (bundle-scoped MCP manager/runtime/tools files), and the ToolDescriptor owner/executor ref kind "mcp" with a serverId field. Exact dispatch-time behavior for MCP-sourced tools vs. native tools was not traced this pass.

> src/tools/types.ts's ToolOwnerRef/ToolExecutorRef both have an explicit { kind: "mcp"; serverId } case, confirming MCP tools are a first-class owner/executor kind in the same ToolDescriptor contract as native tools -- not a bolted-on side path.

## Flow: tool call

**Status:** confirmed  **Category:** tool-runtime

1. **Receive normalized provider tool-call event** 
   The stream-normalization layer (src/llm/stream.ts / packages/ai transports) emits toolcall_start/toolcall_delta/toolcall_end events (packages/llm-core/src/types.ts:410-412) as part of the AssistantMessageEventStreamContract; toolcall_end carries the fully parsed ToolCall.
2. **Resolve the matching AnyAgentTool** `src/tools/types.ts`
   The tool-call's name is matched against the run's currently available tool set (itself already filtered by each ToolDescriptor's availability expression / the effective-tool-policy machinery).
3. **Validate/decode arguments** 
   AgentTool<TParameters extends TSchema> types tool parameters as a TypeBox schema at the implementation level (src/agents/tools/common.ts), and packages/llm-core's wire-level Tool.parameters is likewise a TypeBox TSchema validated by ValidateToolArgumentsFn (packages/llm-core/src/types.ts:691) -- confirming TypeBox as the schema/validation library used for tool arguments. The exact call site invoking ValidateToolArgumentsFn against a live ToolCall was not located this pass.
4. **Evaluate approval policy** `src/agents/agent-tools.before-tool-call.approval.ts`
   src/agents/agent-tools.before-tool-call.approval.ts runs before execution; can escalate to ask-user-tool.ts for an explicit human decision.
5. **Dispatch through runToolLifecycle** (`runToolLifecycle`) `src/agents/embedded-agent-subscribe.ts:1436-1476`
   runToolLifecycle emits tool_execution_start, then calls the resolved AnyAgentTool's execute(toolCallId, params, signal, onUpdate).
6. **Normalize errors / classify result** `src/agents/tool-result-error.ts`
   runToolLifecycle emits tool_execution_end with isError: false and the result on success, or isError: true with a normalized error result on failure (rethrowing after emitting). isToolResultError (src/agents/tool-result-error.ts) further classifies the outcome for retry/finalization purposes.
7. **Append tool-result message to continuation** 
   The accepted result is pushed into the transcript projection queue (toolSearchTargetTranscriptProjections) and the run loop's per-attempt continuation state gains a tool-result message before the next provider call in the same attempt/turn.

## Flow: tool approval

**Status:** inferred  **Category:** tool-runtime


## Open questions

- [high] Is tool execution sandboxed (subprocess isolation, filesystem/network restriction), and if so, how?
  Likely: Likely partial: shell/exec-family tools probably run through an exec-approval/sandbox policy (exec_approvals_config table confirmed in src/state/openclaw-state-schema.sql), while most tools run in-process with no OS-level sandbox.
- [low] Is a tool call's inputSchema validated with a specific library (zod, ajv, a custom JSON-Schema validator), and where?
  Likely: packages/llm-core/src/validation.ts (confirmed to exist, has its own validation.test.ts) almost certainly implements ValidateToolArgumentsFn.
- [medium] What is the exact function that dispatches a normalized provider tool-call event to a resolved ToolDescriptor's executor?
  Likely: toolSearchCatalogExecutor's name ('tool search catalog') suggests OpenClaw may have more than one tool-resolution path (e.g. a smaller always-in-context tool set vs. a larger searchable catalog); whether every tool call funnels through this exact function or whether a second, simpler direct-dispatch path also exists was not fully ruled out.

