/**
 * QED: Complete Agent Execution Lifecycle (Detailed from Code Trace)
 *
 * Based on thorough trace through:
 * - src/agents/pi-embedded-runner/run/attempt.ts
 * - src/agents/skills-runtime.ts
 * - src/agents/pi-tool-definition-adapter.ts
 * - @mariozechner/pi-coding-agent SDK
 */

// ============================================================================
// PHASE 1: AGENT START & SKILL INITIALIZATION
// ============================================================================

// Entry: src/agents/pi-embedded-runner/run/attempt.ts::runEmbeddedAttempt()

// Step 1a: Resolve whether to load skills
function resolveEmbeddedRunSkillEntries(params: {
  cfg: OpenClawConfig;
  workspaceDir: string;
  agentId?: string;
  snapshot?: { resolvedSkills?: SkillEntry[] };
}): {
  shouldLoadSkillEntries: boolean;
  skillEntries?: SkillEntry[];
} {
  // Check if skills are cached in snapshot
  if (params.snapshot?.resolvedSkills) {
    return {
      shouldLoadSkillEntries: false,
      skillEntries: params.snapshot.resolvedSkills,
    };
  }

  // Otherwise, will load from workspace
  return {
    shouldLoadSkillEntries: true,
  };
}

// Step 1b: Load skill entries from workspace
function loadWorkspaceSkillEntries(params: {
  workspaceDir: string;
  agentId?: string;
}): SkillEntry[] {
  // Scans: ${workspaceDir}/.agents/skills/
  // For each directory with SKILL.md:
  // - Create SkillEntry { id, location, title, description }
  // - Apply skill eligibility checks
  // - Apply agent-specific filters (from agent config)

  const skillsDir = `${params.workspaceDir}/.agents/skills`;
  const entries: SkillEntry[] = [];

  for (const dir of fs.readdirSync(skillsDir)) {
    const skillMdPath = path.join(skillsDir, dir, "SKILL.md");
    if (fs.existsSync(skillMdPath)) {
      entries.push({
        id: dir,
        location: skillMdPath,
        title: dir.replace(/-/g, " "),
        description: "Skill",
      });
    }
  }

  return entries;
}

// Step 1c: Generate skills prompt (injected into system prompt)
function resolveSkillsPromptForRun(params: {
  skillsSnapshot?: SkillsSnapshot;
  skillEntries?: SkillEntry[];
}): string {
  const entries = params.skillsSnapshot?.entries || params.skillEntries || [];

  const skillsList = entries
    .map((skill) => `- $${skill.id}: ${skill.description}`)
    .join("\n");

  // This gets INJECTED INTO SYSTEM PROMPT
  return `
## Skills (mandatory)
Before replying: scan <available_skills> entries.
If exactly one skill clearly applies: read its SKILL.md, then follow it.
If multiple could apply: choose the most specific, then read/follow.
If none clearly apply: do not read any SKILL.md.

<available_skills>
${skillsList}
</available_skills>
`;
}

// ============================================================================
// PHASE 2: TOOL CREATION & CONFIGURATION
// ============================================================================

// Entry: src/agents/pi-tools.ts::createOpenClawCodingTools()

interface AnyAgentTool {
  name: string;
  label?: string;
  description: string;
  parameters?: object;
  execute: (toolCallId: string, params: unknown) => Promise<unknown>;
}

function createOpenClawCodingTools(params: {
  cfg: OpenClawConfig;
  agentDir?: string;
  sessionKey?: string;
  sandboxInfo?: SandboxInfo;
}): AnyAgentTool[] {
  // Creates built-in tools
  const tools: AnyAgentTool[] = [
    {
      name: "read",
      description: "Read file contents",
      execute: async (toolCallId, { file_path }) => {
        // Implementation with boundary checks
      },
    },
    {
      name: "write",
      description: "Create or overwrite files",
      execute: async (toolCallId, { file_path, content }) => {
        // Implementation
      },
    },
    {
      name: "exec",
      description: "Run shell commands",
      execute: async (toolCallId, { command, yieldMs }) => {
        // Implementation with approval gates
      },
    },
    {
      name: "process",
      description: "Background process control",
      execute: async (toolCallId, { action, id }) => {
        // Implementation
      },
    },
    {
      name: "message",
      description: "Send messages to channel",
      execute: async (toolCallId, { to, message }) => {
        // Implementation with routing
      },
    },
    // ... more tools: cron, edit, apply_patch, etc.
  ];

  // Apply configuration-based filtering
  applyConfigToolPolicy(tools, params.cfg);

  return tools;
}

// ============================================================================
// PHASE 3: TOOL TRANSFORMATION TO STRUCTURED FORMAT
// ============================================================================

// Entry: src/agents/pi-tool-definition-adapter.ts
// This is the KEY TRANSFORMATION

interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (
    toolCallId: string,
    params: unknown,
    signal: AbortSignal,
    onUpdate: (update: unknown) => void,
  ) => Promise<AgentToolResult>;
}

function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => {
    // CREATE WRAPPER that adds hook integration
    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters || {},

      // THE IMPORTANT WRAPPER FUNCTION
      execute: async (toolCallId, params, signal, onUpdate) => {
        try {
          // Step 1: Run before_tool_call hook
          const { shouldProceed, adjustedParams } = await runBeforeToolCallHook({
            toolName: tool.name,
            params,
            toolCallId,
          });

          if (!shouldProceed) {
            return {
              content: [
                {
                  type: "text",
                  text: "Tool call blocked by policy",
                },
              ],
            };
          }

          // Step 2: Execute underlying tool with adjusted params
          const result = await tool.execute(toolCallId, adjustedParams || params);

          // Step 3: Normalize result to AgentToolResult format
          const normalized = normalizeToolExecutionResult({
            toolName: tool.name,
            result,
          });

          return normalized;
        } catch (error) {
          // Step 4: Error handling
          if (error instanceof AbortError) {
            return {
              content: [
                {
                  type: "text",
                  text: "Tool execution aborted",
                  is_error: true,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                is_error: true,
              },
            ],
          };
        }
      },
    };
  });
}

// Normalize any tool result to standard AgentToolResult format
function normalizeToolExecutionResult(params: {
  toolName: string;
  result: unknown;
}): AgentToolResult {
  // Input could be:
  // - Plain string
  // - Object { stdout, stderr, code }
  // - Array of strings
  // - Already formatted AgentToolResult

  if (
    typeof params.result === "object" &&
    params.result !== null &&
    "content" in params.result
  ) {
    // Already in AgentToolResult format
    return params.result as AgentToolResult;
  }

  if (typeof params.result === "string") {
    // Wrap string in content array
    return {
      content: [{ type: "text", text: params.result }],
    };
  }

  if (Array.isArray(params.result)) {
    // Wrap array items
    return {
      content: params.result.map((item) => ({
        type: "text",
        text: typeof item === "string" ? item : JSON.stringify(item),
      })),
    };
  }

  // Fallback: stringify
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(params.result),
      },
    ],
  };
}

// ============================================================================
// PHASE 4: SESSION CREATION WITH TOOLS
// ============================================================================

// Entry: src/agents/pi-embedded-runner/run/attempt.ts:932-945
// Uses: @mariozechner/pi-coding-agent SDK

interface AgentSession {
  agent: {
    state: {
      systemPrompt: string;
      messages: AgentMessage[];
    };
    streamFn: (context: unknown) => AsyncIterable<unknown>;
    tools: ToolDefinition[];
  };
  prompt: (message: string, options?: { images?: string[] }) => Promise<void>;
  steer: (action: string) => void;
  abort: () => void;
}

async function createAgentSessionWithTools(params: {
  systemPrompt: string;
  skillEntries: SkillEntry[];
  tools: AnyAgentTool[];
  sessionManager: SessionManager;
  model: ModelInfo;
}): Promise<AgentSession> {
  // Transform tools to ToolDefinition format
  const toolDefinitions = toToolDefinitions(params.tools);

  // Create session via SDK
  const session = await createAgentSession({
    // SDK location: @mariozechner/pi-coding-agent
    cwd: params.sessionManager.workspaceDir,
    model: params.model,
    thinkingLevel: "some", // Extended thinking level
    tools: [], // builtInTools (empty)
    customTools: toolDefinitions, // ← ALL our transformed tools
    sessionManager: params.sessionManager,
    settingsManager: new SettingsManager(),
    resourceLoader: new DefaultResourceLoader(),
  });

  // Override system prompt with our custom one
  applySystemPromptOverrideToSession(session, params.systemPrompt);

  return session;
}

function applySystemPromptOverrideToSession(
  session: AgentSession,
  systemPrompt: string,
): void {
  // Set on agent state
  session.agent.state.systemPrompt = systemPrompt;

  // Also set rebuild function (in case model rebuilds it)
  const mutable = session as unknown as {
    _baseSystemPrompt?: string;
    _rebuildSystemPrompt?: (toolNames: string[]) => string;
  };
  mutable._baseSystemPrompt = systemPrompt;
  mutable._rebuildSystemPrompt = () => systemPrompt;
}

// ============================================================================
// PHASE 5: EVENT SUBSCRIPTION & INFERENCE LOOP
// ============================================================================

// Entry: src/agents/pi-embedded-runner/run/attempt.ts:~1830

async function subscribeAndRunInference(params: {
  session: AgentSession;
  userMessage: string;
}): Promise<{
  assistantTexts: string[];
  toolMetas: ToolExecutionMeta[];
  usage: UsageStats;
}> {
  // Subscribe to agent events
  const subscription = subscribeEmbeddedPiSession(params.session);

  // This sets up handlers for:
  // - tool_execution_start
  // - tool_execution_update
  // - tool_execution_end
  // - message_start, message_update, message_end
  // - auto_compaction_start/end
  // - agent_start/end

  // Submit prompt to model
  await params.session.prompt(params.userMessage);

  // THE INFERENCE LOOP HAPPENS AUTOMATICALLY:
  // 1. Model receives: system prompt + tools + user message
  // 2. Model generates response (could include tool_use blocks)
  // 3. If model emits tool_use: Pi-agent SDK handles it
  //    a. Calls: ToolDefinition.execute()
  //    b. Gets result: AgentToolResult
  //    c. Appends to session: tool_result message
  //    d. Continues or completes
  // 4. Events emitted throughout → subscription captures them

  // Collect results
  return {
    assistantTexts: subscription.assistantTexts,
    toolMetas: subscription.toolMetas,
    usage: subscription.getUsageTotals(),
  };
}

// ============================================================================
// PHASE 6: EVENT HANDLING & TOOL EXECUTION TRACKING
// ============================================================================

// File: src/agents/pi-embedded-runner/pi-embedded-subscribe.ts

interface ToolExecutionMeta {
  toolCallId: string;
  toolName: string;
  params: unknown;
  result?: AgentToolResult;
  status: "pending" | "executing" | "completed" | "error";
  startTime: number;
  endTime?: number;
}

function createEmbeddedPiSessionEventHandler(params: {
  session: AgentSession;
}): {
  assistantTexts: string[];
  toolMetas: ToolExecutionMeta[];
  handlers: {
    onToolExecutionStart: (event: unknown) => void;
    onToolExecutionEnd: (event: unknown) => void;
    onMessageEnd: (event: unknown) => void;
  };
} {
  const state = {
    assistantTexts: [] as string[],
    toolMetas: [] as ToolExecutionMeta[],
  };

  return {
    ...state,
    handlers: {
      // TOOL EXECUTION START
      onToolExecutionStart: (event: {
        tool_call_id: string;
        tool_name: string;
        tool_input: unknown;
      }) => {
        const meta: ToolExecutionMeta = {
          toolCallId: event.tool_call_id,
          toolName: event.tool_name,
          params: event.tool_input,
          status: "executing",
          startTime: Date.now(),
        };

        state.toolMetas.push(meta);

        // Pi-agent SDK will now call: ToolDefinition.execute()
      },

      // TOOL EXECUTION END
      onToolExecutionEnd: (event: {
        tool_call_id: string;
        content: unknown;
        error?: string;
      }) => {
        const meta = state.toolMetas.find((m) => m.toolCallId === event.tool_call_id);
        if (meta) {
          meta.status = event.error ? "error" : "completed";
          meta.endTime = Date.now();
          meta.result = {
            content: Array.isArray(event.content) ? event.content : [event.content],
          };
        }

        // Result automatically appended to session transcript
      },

      // MESSAGE END (final response)
      onMessageEnd: (event: { content: Array<{ type: string; text?: string }> }) => {
        // Collect all text blocks
        for (const block of event.content) {
          if (block.type === "text" && block.text) {
            state.assistantTexts.push(block.text);
          }
        }
      },
    },
  };
}

// ============================================================================
// PHASE 7: SESSION PERSISTENCE
// ============================================================================

// SessionManager auto-handles this via Pi-agent SDK

// When tool completes:
// - Pi-agent creates: { role: "user", content: tool_result }
// - SessionManager appends to: session.messages[]
// - SessionManager persists to: sessionFile (JSON lines)

// Next inference cycle:
// - session.messages includes: [user msg, assistant response, tool_use, tool_result]
// - Model sees full history
// - Model decides next action (more tools or final response)

// ============================================================================
// KEY INSIGHT: HOW TOOLS ARE DISCOVERED BY MODEL
// ============================================================================

// Tools are NOT discovered via scanning or routing logic
// Instead:

// 1. createAgentSession() receives: customTools: ToolDefinition[]
// 2. Pi-agent SDK binds tools to model provider
// 3. Provider (Anthropic, OpenAI, Gemini) receives tool schemas
// 4. Model natively generates tool_use blocks if appropriate
// 5. NO explicit routing - model decides implicitly

// Example flow:
/*
User: "Read SOUL.md"
        ↓
System Prompt says: "Call tools as listed..."
Tool Definition available: { name: "read", parameters: {...} }
        ↓
Model (Claude) sees: read tool available + user request mentions file
        ↓
Model generates: tool_use { name: "read", input: { file_path: "..." } }
        ↓
Pi-agent SDK parses tool_use
        ↓
Calls: ToolDefinition.execute("read", { file_path: "..." })
        ↓
Wrapper runs before_tool_call hook → executes underlying read() → normalizes result
        ↓
Returns: AgentToolResult
        ↓
SessionManager appends: tool_result message
        ↓
Next inference cycle with tool result in history
*/

// ============================================================================
// KEY INSIGHT: SKILLS ARE NOT TOOLS
// ============================================================================

// Skills are markdown documents injected into system prompt
// When model reads skill:

// 1. System prompt says: "@openclaw-release-maintainer" skill available
// 2. User asks: "Use the release skill"
// 3. Model: "I'll read that skill"
// 4. Model generates: tool_use { name: "read", input: { file_path: "/.../.agents/skills/openclaw-release-maintainer/SKILL.md" } }
// 5. read() tool executes → returns file content
// 6. Tool result contains: SKILL.md content (the workflow steps)
// 7. Model incorporates skill instructions into reasoning
// 8. Model follows skill guidance for next actions

// Skills are workflow documentation, NOT executable tools

// ============================================================================
// COMPLETE LIFECYCLE DIAGRAM
// ============================================================================

/*
┌─ Agent Run Starts ──────────────────┐
│ runEmbeddedAttempt() called         │
└────────────────┬─────────────────────┘
                 │
    ┌────────────▼──────────────┐
    │ PHASE 1: Skill Discovery  │
    │                           │
    │ resolveEmbeddedRunSkillEntries()
    │   → Load .agents/skills/  │
    │   → Return SkillEntry[]   │
    │                           │
    │ resolveSkillsPromptForRun()
    │   → Format markdown       │
    │   → Skills prompt text    │
    └────────────┬──────────────┘
                 │
    ┌────────────▼──────────────────────┐
    │ PHASE 2: Tool Creation & Config   │
    │                                   │
    │ createOpenClawCodingTools()       │
    │   → Create AnyAgentTool[]         │
    │   → Apply config policy           │
    │   → ~7 core tools (read, exec...) │
    └────────────┬──────────────────────┘
                 │
    ┌────────────▼────────────────────────────┐
    │ PHASE 3: Tool Transformation            │
    │                                         │
    │ toToolDefinitions(AnyAgentTool[])      │
    │   → Create wrapper execute()            │
    │   → Add hook integration                │
    │   → Add error handling                  │
    │   → Add result normalization            │
    │   → Return ToolDefinition[]             │
    └────────────┬────────────────────────────┘
                 │
    ┌────────────▼─────────────────────────┐
    │ PHASE 4: Session Creation            │
    │                                      │
    │ buildEmbeddedSystemPrompt()         │
    │   → Combine with skills prompt       │
    │   → Build complete system prompt     │
    │                                      │
    │ createAgentSession()                 │
    │   → Pass: customTools: ToolDef[]    │
    │   → Pass: systemPrompt              │
    │   → Pass: sessionManager            │
    │   → Create: AgentSession            │
    │                                      │
    │ applySystemPromptOverrideToSession()
    │   → Set prompt on session            │
    └────────────┬─────────────────────────┘
                 │
    ┌────────────▼────────────────────┐
    │ PHASE 5: Event Subscription     │
    │                                 │
    │ subscribeEmbeddedPiSession()    │
    │   → Attach event handlers       │
    │   → Initialize tracking state   │
    │   → Return subscription object  │
    └────────────┬────────────────────┘
                 │
    ┌────────────▼────────────────────────┐
    │ PHASE 6: Model Inference Loop      │
    │                                    │
    │ session.prompt(userMessage)        │
    │   → Model receives:                │
    │     - System prompt                │
    │     - Tool definitions (schemas)   │
    │     - User message                 │
    │                                    │
    │ Model decides to call tool         │
    │   (No explicit routing - implicit) │
    │                                    │
    │ Pi-agent SDK detects tool_use     │
    │   → Calls: ToolDefinition.exec()  │
    └────────────┬────────────────────────┘
                 │
    ┌────────────▼────────────────────────┐
    │ PHASE 7: Tool Execution            │
    │                                    │
    │ ToolDefinition.execute() wrapper:  │
    │ 1. Before hook (check policy)      │
    │ 2. Call underlying tool.execute()  │
    │ 3. Normalize result                │
    │ 4. Error handling                  │
    │ → Return: AgentToolResult          │
    └────────────┬────────────────────────┘
                 │
    ┌────────────▼─────────────────────────┐
    │ PHASE 8: Result Handling & Feedback  │
    │                                      │
    │ Pi-agent SDK receives AgentToolResult
    │   → Emits: tool_execution_end event  │
    │   → SessionManager appends to        │
    │     session.messages                 │
    │   → Persists to sessionFile          │
    │                                      │
    │ subscription captures event          │
    │   → Updates toolMeta in state       │
    │   → State reflects: completed       │
    │                                      │
    │ Next inference cycle:                │
    │   → Model sees updated history       │
    │   → with tool_result included        │
    │   → Decides: more tools or reply    │
    └────────────┬─────────────────────────┘
                 │
      ┌──────────▼──────────────┐
      │ Loop continues until:   │
      │ - Model generates text  │
      │ - Max calls reached     │
      │ - Error/abort           │
      └──────────┬───────────────┘
                 │
    ┌────────────▼───────────────────┐
    │ CLEANUP & RESULT AGGREGATION   │
    │                                │
    │ Collect from subscription:     │
    │   - assistantTexts[]           │
    │   - toolMetas[]                │
    │   - usage statistics           │
    │                                │
    │ subscription.unsubscribe()     │
    │   → Clean up state             │
    │                                │
    │ Return: EmbeddedRunAttemptResult│
    └────────────────────────────────┘
*/

// ============================================================================
// EXECUTION SUMMARY
// ============================================================================

/*
The key architectural points:

1. SKILLS
   - Discovered from workspace
   - Formatted as markdown text
   - INJECTED INTO SYSTEM PROMPT
   - Model learns about them from text guidance
   - NOT treated as structured tools

2. TOOLS
   - Created with AnyAgentTool interface
   - TRANSFORMED to ToolDefinition via wrapper
   - Wrapper adds hooks, error handling, result normalization
   - PASSED to createAgentSession() as customTools
   - SDK binds them to model provider
   - Model sees tool schemas + system prompt guidance

3. ROUTING
   - NO EXPLICIT ROUTING CODE
   - Model provider (Anthropic/OpenAI/Gemini) handles routing
   - Model naturally generates tool_use blocks
   - Pi-agent SDK parses and executes them

4. EXECUTION
   - ToolDefinition.execute() wrapper is called by SDK
   - Wrapper runs hooks → underlying execute() → normalize result
   - Result becomes tool_result message in transcript

5. FEEDBACK
   - SessionManager auto-appends results
   - Next inference cycle has updated history
   - Loop continues until done

The system is event-driven and uses the Pi-agent SDK to handle
the model binding and tool execution orchestration.
*/
