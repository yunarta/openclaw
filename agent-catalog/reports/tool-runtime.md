# Tool Runtime

## Tool registration

**Status:** confirmed  **Category:** tool-runtime  **Maturity:** production

A tool is declared as a ToolDescriptor: name, description, inputSchema/outputSchema (JSON Schema-shaped JsonObject), an owner ref (core/plugin/channel/mcp), an optional distinct executor ref, and a declarative availability expression (allOf/anyOf over auth/config/env/plugin-enabled/context signals).

> src/tools/types.ts defines ToolDescriptor and its component types; individual tools are implemented under src/agents/tools/*.ts (ask-user, agents-list, agents-wait, sessions-spawn, cron, gateway, dashboard, etc.).

## Tool dispatch

**Status:** inferred  **Category:** tool-runtime  **Maturity:** production

When a provider stream emits a tool-call event, it is matched against a registered ToolDescriptor and routed to that tool's executor. The exact dispatcher function was not located and read line-by-line this pass (see open_questions) -- src/agents/agent-tools.before-tool-call.approval.ts is confirmed to sit on this path as the approval gate.

> Best-effort reconstruction from file names and the ToolDescriptor executor-ref shape: normalize provider tool-call -> resolve ToolDescriptor by name -> validate args against inputSchema -> evaluate availability/approval -> execute via the executor ref's target (core/plugin/channel/mcp) -> normalize result -> append to continuation.

## Tool approval

**Status:** confirmed  **Category:** tool-runtime  **Maturity:** production

A before-tool-call hook evaluates whether a tool call may proceed before execution.

> src/agents/agent-tools.before-tool-call.approval.ts confirmed to exist as the approval-evaluation module; src/agents/tools/ask-user-tool.ts is a built-in tool that itself pauses a run to ask the human for a decision, suggesting approval can escalate into a user-facing question rather than being purely automatic.

## Tool execution

**Status:** inferred  **Category:** tool-runtime  **Maturity:** production

Execution context and cancellation for a running tool call.

> src/agents/agent-tools.abort.ts confirmed to exist for tool-call-scoped cancellation. Sandbox/isolation mechanics were not located this pass.

## MCP

**Status:** inferred  **Category:** tool-runtime  **Maturity:** production

OpenClaw supports Model Context Protocol servers as a tool source, evidenced by src/mcp/ (top-level directory, confirmed via initial repo listing), src/agents/agent-bundle-mcp-*.ts (bundle-scoped MCP manager/runtime/tools files), and the ToolDescriptor owner/executor ref kind "mcp" with a serverId field. Exact dispatch-time behavior for MCP-sourced tools vs. native tools was not traced this pass.

> src/tools/types.ts's ToolOwnerRef/ToolExecutorRef both have an explicit { kind: "mcp"; serverId } case, confirming MCP tools are a first-class owner/executor kind in the same ToolDescriptor contract as native tools -- not a bolted-on side path.

## Flow: tool call

**Status:** inferred  **Category:** tool-runtime

1. **Receive normalized provider tool-call event** 
   The stream-normalization layer (src/llm/stream.ts / packages/ai transports) emits a tool-call event as part of the AssistantMessageEventStreamContract.
2. **Resolve the ToolDescriptor by name** `src/tools/types.ts`
   The tool-call's name is matched against the run's currently available tool set (itself already filtered by each ToolDescriptor's availability expression).
3. **Validate decoded arguments against inputSchema** 
   Not directly confirmed by reading a validator this pass; assumed from the presence of a typed inputSchema (JsonObject) on ToolDescriptor.
4. **Evaluate approval policy** `src/agents/agent-tools.before-tool-call.approval.ts`
   src/agents/agent-tools.before-tool-call.approval.ts runs before execution; can escalate to ask-user-tool.ts for an explicit human decision.
5. **Execute via the tool's executor ref** `src/tools/types.ts`
   Routed to a core executorId, a plugin's toolName, a channel's actionId, or an MCP server's toolName, per ToolExecutorRef.
6. **Normalize errors / classify result** `src/agents/tool-result-error.ts`
   isToolResultError classifies the outcome for retry/finalization purposes.
7. **Append tool-result message to continuation** 
   The run loop's per-attempt continuation state gains a tool-result message before the next provider call in the same attempt/turn.

## Flow: tool approval

**Status:** inferred  **Category:** tool-runtime


## Open questions

- [high] What is the exact function that dispatches a normalized provider tool-call event to a resolved ToolDescriptor's executor?
  Likely: Likely src/agents/tools/agent-step.ts or a sibling file in src/agents/embedded-agent-runner/run/ (e.g. attempt-tool-construction-plan.ts, attempt-tool-catalog.ts, attempt-client-tools.ts -- all confirmed to exist by directory listing).
- [high] Is tool execution sandboxed (subprocess isolation, filesystem/network restriction), and if so, how?
  Likely: Likely partial: shell/exec-family tools probably run through an exec-approval/sandbox policy (exec_approvals_config table confirmed in src/state/openclaw-state-schema.sql), while most tools run in-process with no OS-level sandbox.
- [medium] Is a tool call's inputSchema validated with a specific library (zod, ajv, a custom JSON-Schema validator), and where?
  Likely: A shared JSON-Schema validation helper somewhere under src/tools or src/plugin-sdk.

