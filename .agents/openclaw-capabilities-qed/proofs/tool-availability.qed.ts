/**
 * QED: Tool Discovery & Availability in OpenClaw
 *
 * Shows how tools are discovered, filtered, and made available to agents.
 */

// ============================================================================
// STEP 1: Tool Definitions with Profiles
// ============================================================================

// File: src/agents/tool-catalog.ts

type ToolProfileId = "minimal" | "coding" | "messaging" | "full";

interface CoreToolDefinition {
  id: string;
  label: string;
  description: string;
  sectionId: string;
  profiles: ToolProfileId[];
  includeInOpenClawGroup?: boolean;
}

// Tools are defined ONCE with their profiles
const CORE_TOOL_DEFINITIONS: CoreToolDefinition[] = [
  {
    id: "read",
    label: "read",
    description: "Read file contents",
    sectionId: "fs",
    profiles: ["coding"], // ← Only in "coding" profile
  },
  {
    id: "exec",
    label: "exec",
    description: "Run shell commands",
    sectionId: "runtime",
    profiles: ["coding"], // ← Only in "coding" profile
  },
  {
    id: "message",
    label: "message",
    description: "Send messages",
    sectionId: "messaging",
    profiles: ["messaging", "full"], // ← In "messaging" OR "full"
  },
  {
    id: "sessions_spawn",
    label: "sessions_spawn",
    description: "Spawn sub-agents",
    sectionId: "sessions",
    profiles: ["coding", "full"], // ← In "coding" OR "full"
  },
];

// ============================================================================
// STEP 2: Selecting Tools by Profile
// ============================================================================

// When an agent is created, its profile determines which tools it gets:

function selectToolsByProfile(profile: ToolProfileId): CoreToolDefinition[] {
  return CORE_TOOL_DEFINITIONS.filter((tool) => tool.profiles.includes(profile));
}

// Example:
const codingAgentTools = selectToolsByProfile("coding");
// Result: [read, exec, sessions_spawn]
// Missing: message (only in "messaging" or "full")

const messagingAgentTools = selectToolsByProfile("messaging");
// Result: [message]
// Missing: read, exec (only in "coding" or "full")

const fullAgentTools = selectToolsByProfile("full");
// Result: [read, exec, message, sessions_spawn]
// Everything

// ============================================================================
// STEP 3: Context-Based Filtering (Effective Inventory)
// ============================================================================

// File: src/agents/tools-effective-inventory.ts

interface ResolveEffectiveToolInventoryParams {
  agentId?: string;
  messageProvider?: string; // Telegram, Discord, Signal, etc.
  senderIsOwner?: boolean; // Is the sender the owner?
  senderId?: string;
  currentChannelId?: string;
  groupId?: string | null;
  modelHasVision?: boolean;
  disableMessageTool?: boolean;
}

// Pseudo-implementation of filtering logic
function resolveEffectiveToolInventory(
  params: ResolveEffectiveToolInventoryParams,
  profile: ToolProfileId,
): CoreToolDefinition[] {
  let tools = selectToolsByProfile(profile);

  // Filter: Message tool requires messaging-capable channel
  if (
    params.messageProvider &&
    !["telegram", "discord", "signal", "slack"].includes(params.messageProvider)
  ) {
    tools = tools.filter((t) => t.id !== "message");
  }

  // Filter: Some tools require owner status
  if (!params.senderIsOwner && params.senderId) {
    // Tools like 'exec' might require owner
    // (could check agent config for specific requirements)
  }

  // Filter: Explicit disable
  if (params.disableMessageTool) {
    tools = tools.filter((t) => t.id !== "message");
  }

  // Filter: Vision models might get vision-specific tools
  if (!params.modelHasVision) {
    tools = tools.filter((t) => t.id !== "image_generate"); // hypothetical
  }

  return tools;
}

// Example: Agent on Telegram, coding profile, non-owner sender
const telegramNonOwnerTools = resolveEffectiveToolInventory(
  {
    messageProvider: "telegram",
    senderIsOwner: false,
    senderId: "user-123",
  },
  "coding",
);
// Result: [read, exec, sessions_spawn]
// Note: 'message' filtered out because it needs special handling for non-owners

// ============================================================================
// STEP 4: Tool Policy (Allow/Deny Rules)
// ============================================================================

// File: src/agents/pi-tools.policy.ts, config schema

interface ToolPolicy {
  policy: "allow" | "deny"; // Default allow or deny?
  rules: {
    [toolId: string]: {
      allow?: boolean;
      deny?: boolean;
      requireOwner?: boolean;
      requireChannel?: string[];
    };
  };
}

// Example agent config:
const agentConfig = {
  tools: {
    policy: "allow", // Default: allow tools unless explicitly denied
    rules: {
      exec: { allow: true }, // Explicitly allow
      gateway: { deny: true }, // Explicitly deny (never allow)
      sessions_spawn: { requireOwner: true }, // Only for owner
    },
  },
};

// Policy decision function
function applyToolPolicy(
  tool: CoreToolDefinition,
  policy: ToolPolicy,
  params: { senderIsOwner?: boolean },
): boolean {
  const rule = policy.rules[tool.id];

  // If there's an explicit rule for this tool
  if (rule) {
    if (rule.deny === true) return false; // Denied
    if (rule.allow === true) return true; // Allowed
    if (rule.requireOwner && !params.senderIsOwner) return false; // Requires owner
  }

  // Fall back to policy default
  return policy.policy === "allow";
}

// Example: Is 'exec' available?
const execAllowed = applyToolPolicy(
  { id: "exec" } as CoreToolDefinition,
  agentConfig as ToolPolicy,
  { senderIsOwner: true },
);
// Result: true (explicitly allowed in config)

const gatewayAllowed = applyToolPolicy(
  { id: "gateway" } as CoreToolDefinition,
  agentConfig as ToolPolicy,
  { senderIsOwner: true },
);
// Result: false (explicitly denied)

const spawnNonOwner = applyToolPolicy(
  { id: "sessions_spawn" } as CoreToolDefinition,
  agentConfig as ToolPolicy,
  { senderIsOwner: false },
);
// Result: false (requires owner, but sender isn't owner)

// ============================================================================
// STEP 5: Structured Tool Definitions for Model
// ============================================================================

// File: src/agents/pi-tool-definition-adapter.ts

interface StructuredToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Convert internal tool to structured definition for model
function adaptToolForModel(tool: CoreToolDefinition): StructuredToolDefinition {
  return {
    name: tool.id,
    description: tool.description,
    input_schema: {
      type: "object",
      properties: {
        // Schema depends on tool type (exec, read, etc.)
        command: { type: "string" },
        path: { type: "string" },
      },
    },
  };
}

// ============================================================================
// STEP 6: System Prompt Guidance
// ============================================================================

// File: src/agents/system-prompt.ts:496-530

const systemPromptToolingGuidance = `
## Tooling
Structured tool definitions are the source of truth for tool names, descriptions, and parameters.
Tool names are case-sensitive. Call tools exactly as listed in the structured tool definitions.
If a tool is present in the structured tool definitions, it is available unless a later tool call reports a policy/runtime restriction.

For long-running work, use exec/process carefully. Do not emulate scheduling with sleep loops.
If a task is more complex or takes longer, spawn a sub-agent.
`;

// The model sees the structured tool definitions + this guidance
// It then decides WHEN to call which tools based on:
// 1. User request ("run this command")
// 2. Tool availability (tool is in the list)
// 3. System prompt guidance ("For long-running work, spawn a sub-agent")

// ============================================================================
// COMPLETE EXAMPLE FLOW
// ============================================================================

console.log("=== Tool Availability for a Coding Agent on Telegram ===\n");

const userRequest = "Run `npm install` and then send me the result";
const agentProfile = "coding";
const context = {
  messageProvider: "telegram",
  senderIsOwner: true,
  currentChannelId: "private-chat",
};

// Step 1: Select by profile
const step1 = selectToolsByProfile(agentProfile);
console.log("1. Tools by profile (coding):", step1.map((t) => t.id));
// [read, exec, sessions_spawn]

// Step 2: Filter by context
const step2 = resolveEffectiveToolInventory(context as any, agentProfile as any);
console.log("2. After context filtering:", step2.map((t) => t.id));
// [read, exec, sessions_spawn, message] (message added for Telegram channel)

// Step 3: Apply policy
const step3 = step2.filter((tool) =>
  applyToolPolicy(tool, agentConfig as any, { senderIsOwner: true }),
);
console.log("3. After policy rules:", step3.map((t) => t.id));
// [read, exec, sessions_spawn, message] (gateway was denied, but it wasn't in the list anyway)

// Step 4: Convert to structured definitions
const step4 = step3.map(adaptToolForModel);
console.log("4. Structured definitions:", step4.map((t) => t.name));

// Step 5: Model receives:
// - Structured tool definitions (step 4)
// - System prompt tooling guidance
// - User request: "Run `npm install` and send result"

// Step 6: Model decides:
// - User said "run npm install" → calls `exec`
// - User said "send result" → calls `message`
// Both are available, so both are called

console.log("\n=== Model calls ===");
console.log("1. exec(command: 'npm install')");
console.log("2. message(to: sender, message: result)");

// ============================================================================
// KEY INSIGHTS
// ============================================================================

/*
1. Tools are discovered once and defined with profiles
2. Profiles determine the BASE set of tools (coding, messaging, full)
3. Context filtering (channel, sender, model) narrows further
4. Tool policy applies explicit allow/deny rules
5. Structured definitions are passed to model with descriptions
6. Model decides WHEN to call tools based on:
   - Availability (is tool in the list?)
   - User request (did they ask for it?)
   - System prompt guidance (should I use this tool?)
   - Tool descriptions (what does this tool do?)

The decision tree:
```
Agent Profile (coding/messaging/full)
    ↓ [Select by profile]
Context (channel, sender, model)
    ↓ [Filter by context]
Tool Policy (allow/deny rules)
    ↓ [Apply rules]
Structured Definitions + System Prompt
    ↓ [Send to model]
Model decides WHEN to call tools
    ↓
Tool Execution
```
*/
