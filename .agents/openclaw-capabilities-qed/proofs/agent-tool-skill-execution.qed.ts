/**
 * QED: Agent Tool & Skill Execution Flow
 *
 * Shows the complete lifecycle from agent start through tool execution
 */

// ============================================================================
// PART 1: SKILL DISCOVERY (Phase 1)
// ============================================================================

// File: src/agents/pi-embedded-runner/run/attempt.ts:~470
// File: src/agents/skills.ts
// File: src/agents/pi-embedded-runner/skills-runtime.ts

interface SkillEntry {
  id: string; // e.g., "openclaw-release-maintainer"
  location: string; // Path to SKILL.md
  title?: string;
  description?: string;
}

// Step 1a: Discover available skills from workspace
function resolveEmbeddedRunSkillEntries(params: {
  cfg: OpenClawConfig;
  workspaceDir: string;
  agentId?: string;
}): Promise<SkillEntry[]> {
  // Looks in: ~/.openclaw/workspace/.agents/skills/
  // For each directory with SKILL.md, creates entry
  // Filters by agent config (skill_selector, etc.)

  // Pseudo-implementation:
  const skillsDir = `${params.workspaceDir}/.agents/skills`;
  const skillDirs = fs.readdirSync(skillsDir);

  const skills: SkillEntry[] = [];
  for (const dir of skillDirs) {
    const skillMdPath = path.join(skillsDir, dir, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
      skills.push({
        id: dir,
        location: skillMdPath,
        title: dir.replace(/-/g, ' '),
      });
    }
  }

  return skills;
}

// Step 1b: Generate skills prompt for system prompt
function resolveSkillsPromptForRun(params: {
  skillEntries: SkillEntry[];
  agentId?: string;
}): string {
  // Creates markdown describing available skills
  // Included in system prompt as "## Skills (mandatory)" section

  const skillsList = params.skillEntries
    .map((skill) => `- $${skill.id}: ${skill.description || 'Skill'}`)
    .join('\n');

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
// PART 2: TOOL RESOLUTION (Phase 3)
// ============================================================================

// File: src/agents/tools-effective-inventory.ts
// File: src/agents/pi-tools.policy.ts

interface StructuredToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

// Step 3a: Resolve effective tool inventory
function resolveEffectiveToolInventory(params: {
  agentId?: string;
  messageProvider?: string;
  senderIsOwner?: boolean;
  currentChannelId?: string;
}): StructuredToolDefinition[] {
  // Pseudo-flow:
  // 1. Get base tools by profile (coding, messaging, full)
  // 2. Filter by context (sender, channel, model)
  // 3. Apply tool policy (allow/deny rules)
  // 4. Convert to structured definitions

  return [
    {
      name: "read",
      description: "Read file contents",
      input_schema: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Path to file" },
        },
        required: ["file_path"],
      },
    },
    {
      name: "exec",
      description: "Run shell commands with output capture",
      input_schema: {
        type: "object",
        properties: {
          command: { type: "string" },
          yieldMs: { type: "number" },
        },
        required: ["command"],
      },
    },
    {
      name: "message",
      description: "Send messages to current channel",
      input_schema: {
        type: "object",
        properties: {
          to: { type: "string" },
          message: { type: "string" },
        },
        required: ["to", "message"],
      },
    },
  ];
}

// ============================================================================
// PART 3: SYSTEM PROMPT ASSEMBLY (Phase 2)
// ============================================================================

// File: src/agents/pi-embedded-runner/run/attempt.ts:~760
// File: src/agents/system-prompt.ts

function buildEmbeddedSystemPrompt(params: {
  skillsPrompt?: string;
  toolNames: string[]; // ['read', 'exec', 'message']
  contextFiles?: Array<{ path: string; content: string }>;
}): string {
  return `
You are a personal assistant operating inside OpenClaw.

## Tooling
Structured tool definitions are the source of truth for tool names, descriptions, and parameters.
Tool names are case-sensitive. Call tools exactly as listed in the structured tool definitions.

${params.skillsPrompt || ""}

## Project Context
[SOUL.md, AGENTS.md, and other bootstrap files...]

## Workspace
Your working directory is: /home/user/.openclaw/workspace
`;
}

// ============================================================================
// PART 4: SESSION CREATION WITH TOOLS (Phase 4)
// ============================================================================

// File: src/agents/pi-embedded-runner/run/attempt.ts:~932-945

interface AgentSession {
  agent: {
    state: {
      systemPrompt: string;
    };
  };
  // ... more properties
}

// Step 4a: Convert tools to client format
function toClientToolDefinitions(
  tools: StructuredToolDefinition[],
): Array<{
  name: string;
  description: string;
  input_schema: object;
}> {
  // Converts internal tool format to format expected by model API
  // (Claude, OpenAI, etc.)

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));
}

// Step 4b: Create agent session with tools
async function createAgentSessionWithTools(params: {
  systemPrompt: string;
  tools: StructuredToolDefinition[];
  userMessage: string;
}): Promise<{
  session: AgentSession;
  skillsRegistry: SkillEntry[];
}> {
  // Pseudo-implementation using @mariozechner/pi-coding-agent

  const clientTools = toClientToolDefinitions(params.tools);

  const session = await createAgentSession({
    // From @mariozechner/pi-coding-agent
    model: "claude-3-5-sonnet-20241022",
    tools: clientTools, // ← Tools passed here
    sessionManager: new SessionManager(),
    settingsManager: new SettingsManager(),
  });

  // Override system prompt
  applySystemPromptOverrideToSession(session, params.systemPrompt);

  // Add initial user message
  session.agent.addMessage({
    role: "user",
    content: params.userMessage,
  });

  return { session, skillsRegistry: [] };
}

// ============================================================================
// PART 5: INFERENCE LOOP - MODEL INTERACTION (Phase 5)
// ============================================================================

// The model receives:
// 1. System prompt (text)
// 2. Structured tool definitions (JSON)
// 3. User message

// Model outputs one of:
// - Text reply
// - Tool calls
// - Skill reads (actually tool calls with read tool)

type ModelOutput =
  | { type: "text"; content: string }
  | { type: "tool_call"; name: string; input: object }
  | { type: "complete"; message: string };

function simulateModelInference(params: {
  systemPrompt: string;
  tools: StructuredToolDefinition[];
  userMessage: string;
}): ModelOutput {
  // Model receives entire prompt + tools + message
  // Decides next action based on:
  // 1. System prompt guidance
  // 2. Tool availability
  // 3. User request

  // Example: User says "Read SOUL.md"
  if (params.userMessage.includes("Read SOUL.md")) {
    return {
      type: "tool_call",
      name: "read",
      input: { file_path: "/home/user/.openclaw/workspace/SOUL.md" },
    };
  }

  // Example: User says "Use release skill"
  if (params.userMessage.includes("release")) {
    // Model decides to read the skill first
    return {
      type: "tool_call",
      name: "read",
      input: { file_path: "/workspace/.agents/skills/openclaw-release-maintainer/SKILL.md" },
    };
  }

  return { type: "text", content: "How can I help?" };
}

// ============================================================================
// PART 6: TOOL EXECUTION (Phase 6)
// ============================================================================

// File: SessionManager (from @mariozechner/pi-coding-agent)
// File: src/agents/pi-tools.ts (OpenClaw-specific tools)

interface ToolCall {
  id: string;
  name: string;
  input: object;
}

interface ToolResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// Step 6a: Tool dispatch
function executeToolCall(toolCall: ToolCall): ToolResult {
  // SessionManager receives tool call from model
  // Routes to appropriate handler

  switch (toolCall.name) {
    case "read":
      return executeReadTool(toolCall);
    case "exec":
      return executeExecTool(toolCall);
    case "message":
      return executeMessageTool(toolCall);
    default:
      return {
        tool_use_id: toolCall.id,
        content: "Unknown tool",
        is_error: true,
      };
  }
}

// Step 6b: Individual tool executors
function executeReadTool(toolCall: ToolCall): ToolResult {
  const input = toolCall.input as { file_path: string };

  try {
    // Boundary check (can't read outside workspace)
    if (!input.file_path.startsWith("/home/user/.openclaw/workspace")) {
      return {
        tool_use_id: toolCall.id,
        content: "Access denied: outside workspace",
        is_error: true,
      };
    }

    const content = fs.readFileSync(input.file_path, "utf-8");
    return {
      tool_use_id: toolCall.id,
      content,
    };
  } catch (error) {
    return {
      tool_use_id: toolCall.id,
      content: `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
      is_error: true,
    };
  }
}

function executeExecTool(toolCall: ToolCall): ToolResult {
  const input = toolCall.input as { command: string };

  try {
    // Check approval if needed
    // Check sandbox restrictions if needed

    const result = execSync(input.command, { encoding: "utf-8" });
    return {
      tool_use_id: toolCall.id,
      content: result,
    };
  } catch (error) {
    return {
      tool_use_id: toolCall.id,
      content: `Command failed: ${error instanceof Error ? error.message : String(error)}`,
      is_error: true,
    };
  }
}

function executeMessageTool(toolCall: ToolCall): ToolResult {
  const input = toolCall.input as { to: string; message: string };

  try {
    // Route message through appropriate channel
    // (Telegram, Discord, etc.)

    sendMessageToChannel(input.to, input.message);
    return {
      tool_use_id: toolCall.id,
      content: "Message sent",
    };
  } catch (error) {
    return {
      tool_use_id: toolCall.id,
      content: `Failed to send: ${error instanceof Error ? error.message : String(error)}`,
      is_error: true,
    };
  }
}

// ============================================================================
// PART 7: SKILL HANDLING (Special Case)
// ============================================================================

// Skills are NOT separate from tools
// They're accessed via the "read" tool, then model follows them

// Example flow:
// 1. User: "Use the release maintainer skill"
// 2. Model sees system prompt says "@openclaw-release-maintainer" is available
// 3. Model: "I'll read that skill"
// 4. Model calls: read("/workspace/.agents/skills/openclaw-release-maintainer/SKILL.md")
// 5. SessionManager executes → returns skill content
// 6. Result fed back to model
// 7. Model: "Now I understand the process. Here's what I'll do..."
// 8. Model continues with next tool calls or reply

async function handleSkillIntegration(params: {
  skillId: string;
  workspaceDir: string;
  model: any; // Agent model
}): Promise<string> {
  // Skill is read via read() tool
  const skillPath = `${params.workspaceDir}/.agents/skills/${params.skillId}/SKILL.md`;

  const toolCall: ToolCall = {
    id: "skill-read-1",
    name: "read",
    input: { file_path: skillPath },
  };

  const result = executeToolCall(toolCall);

  // Result (skill content) is fed back to model
  // Model incorporates it into reasoning
  params.model.addToolResult(result);

  return result.content;
}

// ============================================================================
// PART 8: RESULT FEEDBACK LOOP (Phase 8)
// ============================================================================

async function inferenceLoopWithTools(params: {
  userMessage: string;
  systemPrompt: string;
  tools: StructuredToolDefinition[];
  skills: SkillEntry[];
}): Promise<string> {
  // Initial model setup
  const sessionParams = {
    systemPrompt: params.systemPrompt,
    tools: params.tools,
    userMessage: params.userMessage,
  };

  const { session } = await createAgentSessionWithTools(sessionParams);

  let continueLoop = true;
  let conversationHistory = [params.userMessage];
  let toolCallCount = 0;
  const maxToolCalls = 10; // Safety limit

  while (continueLoop && toolCallCount < maxToolCalls) {
    // Get model output
    const modelOutput = simulateModelInference({
      systemPrompt: params.systemPrompt,
      tools: params.tools,
      userMessage: conversationHistory[conversationHistory.length - 1],
    });

    if (modelOutput.type === "text") {
      // Model provided text response
      return modelOutput.content;
    } else if (modelOutput.type === "tool_call") {
      // Model wants to call a tool
      const toolCall: ToolCall = {
        id: `tool-call-${toolCallCount}`,
        name: modelOutput.name,
        input: modelOutput.input,
      };

      // Execute tool
      const result = executeToolCall(toolCall);
      toolCallCount++;

      // Add result to conversation
      conversationHistory.push(`Tool ${toolCall.name} result: ${result.content}`);

      // Loop: Model will continue with next turn
      continue;
    } else if (modelOutput.type === "complete") {
      // Model is done
      continueLoop = false;
      return modelOutput.message;
    }
  }

  return "Inference loop completed";
}

// ============================================================================
// COMPLETE EXAMPLE EXECUTION
// ============================================================================

async function completeAgentWorkflow() {
  console.log("=== Agent Workflow: Complete Example ===\n");

  // User request
  const userMessage = "Read the agent's soul document and summarize it";

  // Phase 1: Discover skills
  const skills = await resolveEmbeddedRunSkillEntries({
    cfg: {} as any,
    workspaceDir: "/home/user/.openclaw/workspace",
  });
  console.log("Phase 1: Discovered skills:", skills.map((s) => s.id));

  // Phase 2: Resolve tools
  const tools = resolveEffectiveToolInventory({
    agentId: "default",
    messageProvider: "direct",
    senderIsOwner: true,
  });
  console.log("Phase 2: Available tools:", tools.map((t) => t.name));

  // Phase 3: Build system prompt
  const skillsPrompt = resolveSkillsPromptForRun({ skillEntries: skills });
  const systemPrompt = buildEmbeddedSystemPrompt({
    skillsPrompt,
    toolNames: tools.map((t) => t.name),
  });
  console.log("Phase 3: System prompt built (", systemPrompt.length, "chars)");

  // Phase 4: Create session
  console.log("Phase 4: Creating agent session with", tools.length, "tools");

  // Phase 5-8: Run inference loop
  console.log("Phase 5-8: Starting inference loop...\n");

  const result = await inferenceLoopWithTools({
    userMessage,
    systemPrompt,
    tools,
    skills,
  });

  console.log("\nFinal result:\n", result);
}

// ============================================================================
// KEY INSIGHTS
// ============================================================================

/*
1. TOOL DISCOVERY
   - Tools are discovered per-run based on profile + context
   - Skill list is generated separately

2. SYSTEM PROMPT
   - Contains tool guidance ("Call tools as listed...")
   - Contains skill guidance ("Read SKILL.md if applicable...")
   - Does NOT contain full tool definitions

3. TOOL DEFINITIONS
   - Passed separately to model with full input schemas
   - Model uses these to decide when/how to call tools

4. MODEL INTERACTION
   - Model sees: system prompt + tool definitions + user message
   - Model decides: should I call a tool?
   - If yes: emit tool_use with name + input
   - SessionManager executes the tool
   - Result fed back to model
   - Model continues or replies

5. SKILLS
   - NOT separate from tools
   - Accessed via read() tool
   - Content returned to model
   - Model then follows skill instructions

6. EXECUTION FLOW
   Agent Start
     ↓
   Discover Skills/Tools
     ↓
   Build System Prompt (with guidance)
     ↓
   Create Session (with tool definitions)
     ↓
   Model Inference (decides to call tool)
     ↓
   Tool Execution (SessionManager)
     ↓
   Result Feedback (fed back to model)
     ↓
   Loop until model replies or max calls reached
*/
