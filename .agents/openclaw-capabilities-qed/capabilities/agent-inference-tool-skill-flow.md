# Agent Inference: Tool & Skill Flow

## Question
**How do agents and inference use tools and skills? What's the complete execution flow?**

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Agent Run Starts                                                        │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
    ┌────────────▼────────────┐
    │ 1. Discover Skills      │  (resolveEmbeddedRunSkillEntries)
    │ 2. Build System Prompt  │  (buildEmbeddedSystemPrompt)
    │ 3. Resolve Tools        │  (resolveEffectiveToolInventory)
    └────────────┬────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ Create Agent Session          │  (createAgentSession)
    │ - Pass tools                  │
    │ - Set system prompt           │
    │ - Initialize skill runtime    │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ Inference Loop                │
    │                               │
    │ Model receives:               │
    │ - System prompt               │
    │ - Structured tool definitions │
    │ - Skill descriptions          │
    │ - User message                │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ Model Outputs                 │
    │ - Text reply                  │
    │ - Tool calls (optional)       │
    │ - Skill reads (optional)      │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ Tool/Skill Execution          │
    │ - Execute tool (exec, read)   │
    │ - Read skill (SKILL.md)       │
    │ - Capture result              │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ Result → Model                │
    │ - Append to conversation      │
    │ - Model continues thinking    │
    └────────────┬──────────────────┘
                 │
                 └──→ Loop back to inference (if continue needed)
```

---

## Phase 1: Skill Discovery

**Entry Point:** `src/agents/pi-embedded-runner/run/attempt.ts`

| Step | Function | What Happens |
|------|----------|--------------|
| 1a | `resolveEmbeddedRunSkillEntries()` | Discover available skills from `.agents/skills/` |
| 1b | `resolveSkillsPromptForRun()` | Generate skill guidance text for system prompt |
| 1c | Skill filtering | Filter by agent config, permissions |

**Output:**
- Skill list (skill IDs, descriptions, locations)
- Skills prompt text (included in system prompt)

---

## Phase 2: System Prompt Assembly

**Entry Point:** `src/agents/pi-embedded-runner/run/attempt.ts`

| Step | Function | What Happens |
|------|----------|--------------|
| 2a | `buildSystemPromptParams()` | Gather all prompt parameters |
| 2b | `buildEmbeddedSystemPrompt()` | Build system prompt string |
| 2c | Tool name extraction | Extract tool names → used to enable/disable sections |
| 2d | Skills section | Add discovered skills to prompt |

**Output:**
- Complete system prompt (text)
- Tool guidance ("Call tools as listed...")
- Skill guidance ("Read SKILL.md if skill applies...")

---

## Phase 3: Tool Resolution

**Entry Point:** `src/agents/tools-effective-inventory.ts`

| Step | Function | What Happens |
|------|----------|--------------|
| 3a | `resolveEffectiveToolInventory()` | Filter tools by profile + context |
| 3b | `resolveEffectiveToolPolicy()` | Apply allow/deny rules |
| 3c | `toClientToolDefinitions()` | Convert to structured definitions |

**Output:**
- Structured tool definitions (name, description, input_schema)
- Ready for model API

---

## Phase 4: Session Creation

**Entry Point:** `createAgentSession()` (from `@mariozechner/pi-coding-agent`)

```typescript
const session = await createAgentSession({
  model: params.model,           // e.g., "claude-3-5-sonnet"
  tools: builtInTools,           // OpenClaw built-in tools
  customTools: allCustomTools,   // Including converted tools from Phase 3
  sessionManager: manager,       // Handles tool execution
  settingsManager: settings,     // Agent configuration
  // ... more params
});

// Apply system prompt to session
applySystemPromptOverrideToSession(session, systemPromptText);
```

**Session now contains:**
- System prompt
- Tool definitions
- Session history
- Skill registry

---

## Phase 5: Inference Loop (Model Interaction)

### 5a: Model Receives Prompt

```
System Prompt:
┌─────────────────────────────────┐
│ You are a personal assistant... │
│                                 │
│ ## Tooling                       │
│ Structured tool definitions are  │
│ the source of truth for tool...  │
│                                 │
│ ## Skills (mandatory)            │
│ Before replying: scan skills...  │
│ - If exactly one skill applies.. │
│                                 │
│ [Structured Tool Definitions]:   │
│ - name: "read"                  │
│   description: "Read file..."    │
│   input_schema: {...}            │
│ - name: "exec"                  │
│   description: "Run command..."  │
│   input_schema: {...}            │
│ - name: "message"               │
│   ...                            │
│                                 │
│ [Skill Entries]                  │
│ - @openclaw-release-maintainer   │
│ - @openclaw-qa-testing           │
│                                 │
│ # Project Context                │
│ [SOUL.md, AGENTS.md, etc.]      │
└─────────────────────────────────┘

User Message:
"Read SOUL.md and tell me about the agent personality"
```

### 5b: Model Decides Action

The model sees:
1. **System prompt guidance** — "Call tools exactly as listed"
2. **Structured tool definitions** — Read tool is available with input_schema
3. **Skill guidance** — "If skill applies, read its SKILL.md"
4. **User message** — "Read SOUL.md..."

Model decides:
- ✅ Use `read` tool to read SOUL.md
- ❌ Don't use skills (user didn't ask for one)
- ✅ Provide analysis in reply

### 5c: Model Output

```json
{
  "type": "message",
  "content": [
    {
      "type": "text",
      "text": "I'll read SOUL.md to understand the agent..."
    },
    {
      "type": "tool_use",
      "id": "toolu_01234567890",
      "name": "read",
      "input": {
        "file_path": "/home/user/.openclaw/workspace/SOUL.md"
      }
    }
  ]
}
```

---

## Phase 6: Tool Execution

**Entry Point:** `SessionManager.run()` (handles tool calls)

| Step | Handler | What Happens |
|------|---------|--------------|
| 6a | Tool dispatcher | Receives tool call from model |
| 6b | Tool router | Routes to appropriate handler (exec, read, message, etc.) |
| 6c | Tool executor | Executes with arguments from model |
| 6d | Result capture | Captures output (stdout, file content, etc.) |
| 6e | Error handling | If error, formats as tool_result |

**Tool execution example:**
```typescript
// Model called: read({ file_path: "SOUL.md" })

// Handler receives call:
const toolCall = {
  name: "read",
  input: { file_path: "/home/user/.openclaw/workspace/SOUL.md" }
};

// Executor runs:
const content = fs.readFileSync(toolCall.input.file_path, 'utf-8');

// Result prepared:
const toolResult = {
  type: "tool_result",
  tool_use_id: "toolu_01234567890",
  content: content,  // File contents
};
```

---

## Phase 7: Skill Handling (Special Case)

### If Model Wants to Read a Skill

**User message:** "Use the release maintainer skill"

**Model output:**
```
I'll read the release maintainer skill first.

[tool_use: name="read", input={"file_path": "/path/to/.agents/skills/openclaw-release-maintainer/SKILL.md"}]
```

**Skill execution:**
1. File is read (same as normal `read` tool)
2. Content returned to model
3. Model incorporates skill instructions into its reasoning
4. Model then follows skill guidance for next actions

**Key point:** Skills are NOT separate from tools — they're accessed via the `read` tool, then the model follows them.

---

## Phase 8: Result Feedback Loop

```
┌─────────────────────────────────────┐
│ Model receives tool result          │
│ - Tool output                       │
│ - Success/error status              │
│ - Timing info (if available)        │
└──────────────┬──────────────────────┘
               │
      ┌────────▼────────┐
      │ Model decides:  │
      │ - Continue?     │
      │ - Call more?    │
      │ - Reply ready?  │
      └────────┬────────┘
               │
      ┌────────▼─────────────────┐
      │ If continue:             │
      │ - Call another tool      │
      │ - Call skill             │
      │ - Refine thinking        │
      │                          │
      │ If complete:             │
      │ - Generate final reply   │
      │ - Return to user         │
      └──────────────────────────┘
```

---

## Complete Example: Multi-Step Flow

```
User: "Update the release notes for v1.2.3"
         ↓
Model reads system prompt → sees @openclaw-release-maintainer skill
         ↓
Model decides → "I should use the release skill"
         ↓
Tool call: read("/path/to/openclaw-release-maintainer/SKILL.md")
         ↓
SessionManager executes → returns skill content
         ↓
Model receives skill instructions
         ↓
Model: "Now I understand the release process. Let me check the CHANGELOG"
         ↓
Tool call: read("/path/to/CHANGELOG.md")
         ↓
SessionManager executes → returns changelog
         ↓
Model: "I'll now update the release notes following the skill"
         ↓
Tool call: edit("/path/to/CHANGELOG.md", patch)
         ↓
SessionManager executes → applies patch
         ↓
Model: "Done. Release notes updated for v1.2.3"
         ↓
Final reply sent to user
```

---

## Key Code Paths

| Concept | Files |
|---------|-------|
| Skill discovery | `src/agents/skills.ts`, `src/agents/pi-embedded-runner/skills-runtime.ts` |
| Tool resolution | `src/agents/tools-effective-inventory.ts`, `src/agents/tool-policy-pipeline.ts` |
| System prompt building | `src/agents/system-prompt.ts`, `src/agents/pi-embedded-runner/system-prompt.ts` |
| Session creation | `src/agents/pi-embedded-runner/run/attempt.ts:932-945` |
| Tool execution | SessionManager (from `@mariozechner/pi-coding-agent`) + `src/agents/pi-tools.ts` |
| Skill handling | `read` tool + model reasoning |

---

## TL;DR Flow

```
1. Discover skills & tools
2. Build system prompt (with tool + skill guidance)
3. Create session (pass tools + prompt to model)
4. Model thinks + decides to call tool/skill
5. Tool/skill executes
6. Result fed back to model
7. Model continues or replies
```

Skills are **not separate from tools** — they're accessed via `read` tool, then the model follows their guidance.
Tools are **passed separately** from the system prompt (structured definitions).
Model decides **when** to call based on user request + system guidance.
