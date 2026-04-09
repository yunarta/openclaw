# Tool Discovery & Availability

## Question
**How does OpenClaw decide which tools are available to an agent and when to use them?**

---

## Answer

OpenClaw uses a **layered tool discovery system**:

1. **Tool Definitions** — Define what tools exist and their profiles
2. **Tool Profiles** — Select which tools based on agent mode
3. **Effective Inventory** — Filter tools by context (permissions, channel, sender, etc.)
4. **Tool Policy** — Final gating (allow/deny rules)
5. **Structured Definitions** — Pass tool definitions to the model

---

## Layer 1: Tool Definitions & Profiles

**File:** `src/agents/tool-catalog.ts`

Tools are defined with **profiles** (which determine inclusion):

```typescript
type ToolProfileId = "minimal" | "coding" | "messaging" | "full";

const CORE_TOOL_DEFINITIONS = [
  {
    id: "read",
    profiles: ["coding"],  // Only in "coding" or "full" profile
  },
  {
    id: "exec",
    profiles: ["coding"],
  },
  {
    id: "message",
    profiles: ["messaging", "full"],  // In "messaging" or "full"
  },
  {
    id: "sessions_spawn",
    profiles: ["coding", "full"],
  },
  // ... more tools
];
```

**Profile meanings:**
- `minimal` — Very restricted tool set (rarely used)
- `coding` — Coding/execution tools (read, write, exec, etc.)
- `messaging` — Message-related tools (message, sessions_send, etc.)
- `full` — Everything (default for most agents)

---

## Layer 2: Effective Tool Inventory Resolution

**File:** `src/agents/tools-effective-inventory.ts::resolveEffectiveToolInventory()`

Filters tools based on **context parameters**:

```typescript
type ResolveEffectiveToolInventoryParams = {
  agentId?: string;
  messageProvider?: string;     // Telegram, Discord, Signal, etc.
  senderIsOwner?: boolean;       // Is sender the owner?
  senderId?: string;
  currentChannelId?: string;
  groupId?: string;
  modelHasVision?: boolean;      // Model capability check
  disableMessageTool?: boolean;  // Explicit disable
  // ... more parameters
};
```

**What happens:**
1. Resolves which **tool profile** to use for this agent
2. Loads core tool definitions matching that profile
3. Adds plugin-provided tools
4. Adds channel-specific tools
5. Filters by permissions (sender, owner check)
6. Applies tool policy rules

---

## Layer 3: Tool Policy Pipeline

**File:** `src/agents/tool-policy-pipeline.ts` + `src/agents/pi-tools.policy.ts`

Applies **allow/deny rules**:

```typescript
{
  "tools": {
    "policy": "allow",  // or "deny"
    "rules": {
      "exec": { "allow": true },
      "gateway": { "deny": true },  // Never allow gateway tool
      "sessions_spawn": { "requireOwner": true }
    }
  }
}
```

**Policy decision tree:**
```
Is tool in allow list? → YES → Include
Is tool in deny list? → YES → Exclude
Does tool require owner? → Check sender
Is tool channel-compatible? → Check current channel
Is tool model-compatible? → Check model capabilities
→ Final decision: ALLOW or DENY
```

---

## Layer 4: Structured Tool Definitions → Model

**Files:**
- `src/agents/pi-tool-definition-adapter.ts` — Converts OpenClaw tools to model format
- `src/agents/pi-embedded-runner/run/attempt.ts` — Passes tools to model

Once tools are resolved, they're converted to **structured tool definitions** that the model understands:

```json
{
  "name": "exec",
  "description": "Run shell commands...",
  "input_schema": {
    "type": "object",
    "properties": {
      "command": { "type": "string" },
      "yieldMs": { "type": "number" }
    }
  }
}
```

The model then decides **when to call tools** based on:
- User request ("run this command")
- System prompt guidance ("Use exec for long-running work")
- Tool availability ("exec is in the list")
- Tool descriptions ("exec: Run shell commands")

---

## Complete Flow

```
Agent Config (tool profile)
        ↓
Tool Catalog (definitions)
        ↓
Effective Inventory Resolver (context-aware filtering)
        ↓
Tool Policy Pipeline (allow/deny rules)
        ↓
Structured Tool Definitions (serialize for model)
        ↓
Model receives tools + system prompt guidance
        ↓
Model decides WHEN to call which tools
```

---

## Example: When is `exec` available?

**Available if ALL of:**
1. ✅ Profile includes "coding" tools
2. ✅ Sender is owner (or exec doesn't require owner)
3. ✅ Channel supports exec (not messaging-only)
4. ✅ Tool policy doesn't deny it
5. ✅ Sandbox allows it (if sandboxed)

**Example unavailability:**
- Agent running in "minimal" profile → no exec
- Non-owner sender + exec requires owner → no exec
- Sandboxed agent + exec blocked by policy → no exec
- User on WhatsApp + exec not channel-compatible → no exec

---

## Code Paths

| Concept | File | Function |
|---------|------|----------|
| Tool definitions | `src/agents/tool-catalog.ts` | `CORE_TOOL_DEFINITIONS` |
| Tool profiles | `src/agents/tool-catalog.ts` | `ToolProfileId` type |
| Effective inventory | `src/agents/tools-effective-inventory.ts` | `resolveEffectiveToolInventory()` |
| Tool policy | `src/agents/pi-tools.policy.ts` | `resolveEffectiveToolPolicy()` |
| Structured definitions | `src/agents/pi-tool-definition-adapter.ts` | `adaptToolsForModel()` |
| System prompt tooling guidance | `src/agents/system-prompt.ts:496-530` | Tooling section |

---

## How Agent Config Controls Tools

**In agent config:**

```json5
{
  "agents": {
    "myagent": {
      "toolProfile": "coding",      // Selects which tools available
      "tools": {
        "policy": "allow",
        "rules": {
          "exec": { "deny": true }  // Block exec specifically
        }
      }
    }
  }
}
```

---

## TL;DR

1. **Tool profile** (coding/messaging/full) determines base set
2. **Context** (sender, channel, permissions) filters further
3. **Tool policy** applies explicit allow/deny rules
4. **Structured definitions** are passed to model with full metadata
5. **Model** calls tools based on user request + system prompt guidance
