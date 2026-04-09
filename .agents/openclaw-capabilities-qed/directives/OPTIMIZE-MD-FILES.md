# OpenClaw MD Files Optimization Guide

**For:** Copilot agents helping users optimize their OpenClaw MD files

---

## What This Guide Is For

This guide helps you (Copilot agent) assist users in optimizing their OpenClaw workspace MD files based on their actual use case (coding agent, support agent, research agent, etc.).

**Key insight:** Default MD files are generic chatbot templates. Most content is irrelevant to specialized agents. By tailoring files to the actual use case, you can reduce token waste by 45-50% while improving agent focus.

---

## OpenClaw MD Files System

### The 9 Bootstrap Files

OpenClaw loads these files from `~/.openclaw/workspace/`:

| File | Purpose | Always Sent? | Cache Position | Sent to Subagents? |
|------|---------|---|---|---|
| **AGENTS.md** | Agent behavior, execution patterns | ✅ Every turn | Above (stable) | ✅ Yes |
| **SOUL.md** | Persona, tone, communication style | ✅ Every turn | Above (stable) | ✅ Yes |
| **IDENTITY.md** | Agent identity and specialization | ✅ Every turn | Above (stable) | ✅ Yes |
| **USER.md** | User identity, preferences, timezone | ✅ Every turn | Above (stable) | ✅ Yes |
| **TOOLS.md** | External tool guidance (informational) | ✅ Every turn | Above (stable) | ✅ Yes |
| **BOOTSTRAP.md** | Project notes, setup context | ✅ Every turn | Above (stable) | ❌ No |
| **HEARTBEAT.md** | Periodic health checks | ✅ Conditional* | Below (dynamic) | ❌ No |
| **MEMORY.md** | Long-term memory/knowledge base | ✅ Optional | Above (stable) | ✅ Yes |
| **memory.md** | Alt filename for MEMORY.md | ✅ Optional | Above (stable) | ✅ Yes |

*HEARTBEAT.md: Only if `agents.defaults.heartbeat.every` is configured with valid duration

### How They're Loaded

1. **Workspace startup:** Files read from disk once
2. **System prompt building:** Files embedded in stable system prompt section (mostly cached)
3. **Every inference:** Sent to model as part of system prompt
4. **During compaction:** System prompt NEVER compacted (conversation history compacted instead)

**Key:** These files are sent with EVERY inference. If content doesn't affect agent behavior for your use case, it's wasting tokens.

---

## Understanding Token Cost

```
Example: 100 inferences

Generic chatbot SOUL.md:   ~300 tokens × 100 = 30,000 tokens (wasted if coding agent)
Optimized coding SOUL.md:  ~150 tokens × 100 = 15,000 tokens (saved: 15,000)

Generic AGENTS.md:         ~800 tokens × 100 = 80,000 tokens (group chat guidance)
Optimized AGENTS.md:       ~400 tokens × 100 = 40,000 tokens (code patterns only)

Total savings: ~55,000 tokens per 100 inferences ≈ 45-50% reduction
```

---

## Optimization Strategy

### Step 1: Understand the User's Use Case

Ask the user:
- **What will this agent primarily do?**
  - Coding/development
  - Customer support
  - Research/writing
  - Teaching/education
  - Content creation
  - Other: ___

- **In what context?**
  - CLI tool
  - Discord/Slack bot
  - Web app
  - Local development

- **Any constraints?**
  - Token efficiency critical?
  - Multi-turn conversations (100+)?
  - Real-time responsiveness needed?

### Step 2: Audit Current MD Files

Read each file in `~/.openclaw/workspace/`:
- Mark sections relevant to the use case ✅
- Mark sections irrelevant ❌
- Note token-heavy irrelevant content (emojis, examples, etc.)

**Common irrelevant sections to remove:**
- Group chat behavior (for non-chat agents)
- Emoji reaction guidance (for CLI agents)
- General chatbot tone (for specialized agents)
- Generic external tool guidance (if agent has specific tools)
- Casual banter rules (for focused work agents)

### Step 3: Rewrite Each File

Keep ONLY content that affects agent behavior for the specific use case.

**Example: Coding Agent Optimization**

```markdown
### AGENTS.md (Coding Agent)

## Execution Model
1. Read code context first (never modify without understanding)
2. Validate understanding with tool calls (exec, read)
3. Make targeted changes (apply_patch, edit)
4. Run tests immediately after changes

## Error Handling
- Compiler errors: fix in-place, show final state
- Test failures: debug root cause
- Type errors: validate with exec before proposing

## Tool Priority
1. read — understand context
2. exec — validate/test
3. edit/apply_patch — make changes
4. Repeat until tests pass
```

vs.

```markdown
### AGENTS.md (Default Chatbot - REMOVE THESE SECTIONS)

## Group Chat Behavior
In group chats where you receive every message, be smart about when to contribute...

## Emoji Reactions
On platforms that support reactions (Discord, Slack), use emoji reactions naturally...

## Know When to Speak
Respond when: Directly mentioned...
Stay silent when: It's just casual banter...
```

### Step 4: File-by-File Optimization Guide

#### **AGENTS.md**
**Keep:** Behavior specific to use case
- Execution patterns (read → validate → execute → test for coding)
- Error handling strategies
- Decision-making guidance
- When to propose vs. when to execute
- Tool usage priority

**Remove:** Generic chatbot guidance
- Group chat behavior
- Emoji reactions
- Casual tone rules
- Generic "be helpful" guidance

#### **SOUL.md**
**Keep:** Tone/persona specific to use case
- "Direct and technical" (coding agent)
- "Warm and empathetic" (support agent)
- "Curious and thorough" (research agent)

**Remove:** Generic tone
- "Be friendly and casual"
- "Use emojis to be fun"
- Generic personality traits

#### **IDENTITY.md**
**Keep:** Specific role and specialization
```markdown
# I am a TypeScript coding assistant

Specialized in:
- Web development (React, Node.js)
- Testing and validation
- Performance optimization
- Type safety

Best with: Repos with clear structure, existing test suites
```

**Remove:** Generic identity
- "I'm OpenClaw, a helpful assistant"
- "I can answer any question"

#### **TOOLS.md**
**Keep:** Tools actually used
- For coding: npm, git, testing frameworks
- For support: ticketing APIs, knowledge bases
- For research: search APIs, data sources

**Remove:** Irrelevant external tools
- Social media guidance (if not relevant)
- Customer support ticketing (if coding agent)
- Generic "how to use external tools"

#### **USER.md**
**Keep:** Actual user context
- Name, timezone, preferences
- Workflow conventions
- Do NOT edit this frequently

#### **BOOTSTRAP.md**
**Keep:** Project-specific context
- Project structure diagram
- Key commands (build, test, deploy)
- Important patterns and conventions
- What NOT to change

**Remove:** Generic tips
- "Remember to commit" (obvious)
- "Be careful with deletions" (obvious)
- Generic workspace warnings

#### **HEARTBEAT.md**
**Keep:** Checks relevant to agent's job
```markdown
# Every 10 minutes check:
- Are there failing tests?
- Did the build break?
- Any uncommitted changes?
```

**Remove:** Generic heartbeat
- "How are you feeling?"
- "Is there anything to chat about?"

---

## Nested Files with bootstrap-extra-files

If user has monorepo or modular structure, use the `bootstrap-extra-files` hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": [
            "packages/*/AGENTS.md",
            "modules/*/SOUL.md",
            "extensions/**/TOOLS.md"
          ]
        }
      }
    }
  }
}
```

**Glob patterns:**
- `*/AGENTS.md` — Match in direct subdirectories
- `**/AGENTS.md` — Match at any depth (recursive)
- `packages/*/AGENTS.md` — Match in packages/ subdirectories
- `{modules,extensions}/**/AGENTS.md` — Multiple patterns

**Allowed filenames:** Only VALID_BOOTSTRAP_NAMES:
```
AGENTS.md, SOUL.md, TOOLS.md, IDENTITY.md, USER.md, 
HEARTBEAT.md, BOOTSTRAP.md, MEMORY.md, memory.md
```

**Cannot use:** DIRECTIVE.md, CONFIG.md, INI.md, etc. (not in whitelist)

---

## Instructions for Copilot Agent

When helping user optimize their MD files:

### Phase 1: Intake
```
Ask user:
1. What is your agent's primary purpose?
2. What platforms/contexts will it operate in?
3. Are there token constraints (long conversations, real-time)?
4. Any specific specialization or industry?
```

### Phase 2: Audit
```
Read current files from ~/.openclaw/workspace/:
- AGENTS.md (lines: __, irrelevant sections: __)
- SOUL.md (lines: __, token waste: __)
- IDENTITY.md (relevant: __, irrelevant: __)
- TOOLS.md (used tools: __, unused: __)
- BOOTSTRAP.md (relevant: __, bloat: __)
- HEARTBEAT.md (if enabled)

Estimate current token cost per inference
```

### Phase 3: Recommend Changes
```
For each file:
1. Show current content (relevant sections in green, irrelevant in red)
2. Explain token savings
3. Propose rewritten version
4. Show before/after line count

Example:
AGENTS.md:
  Current: 850 tokens (includes group chat, emoji reactions, generic guidance)
  Proposed: 420 tokens (code patterns, error handling, tool priority)
  Savings: 430 tokens × 100 inferences = 43,000 tokens
```

### Phase 4: Generate Optimized Files
```
For each file:
1. Show full rewritten content
2. User can copy/paste directly
3. Ask for feedback before finalizing
4. Offer to add/remove sections
```

### Phase 5: Validation
```
After user updates files:
1. Confirm files are readable
2. Test with sample prompt
3. Check token count reduction
4. Ask: "Is agent behavior what you expected?"
5. Iterate if needed
```

---

## Common Agent Optimization Templates

### Coding Agent
**AGENTS.md focus:**
- Read → understand → validate → execute → test cycle
- Error handling (compiler, test, type errors)
- Tool priority (read, exec, edit/patch)
- Minimal narration

**SOUL.md:**
- Direct, technical tone
- Show code, not explanations
- Action-oriented

**TOOLS.md:**
- npm/pnpm/yarn (depending on project)
- git (branching, committing)
- Testing framework (jest, vitest, etc.)

**Expected token savings:** 45-50%

---

### Support Agent
**AGENTS.md focus:**
- Customer empathy and understanding
- When to escalate vs. resolve
- Documentation references
- Following ticket templates

**SOUL.md:**
- Warm, professional, patient
- Listen before solving
- Explain clearly, no jargon

**TOOLS.md:**
- Ticketing system API
- Knowledge base lookup
- Customer database queries

**Expected token savings:** 40-45%

---

### Research Agent
**AGENTS.md focus:**
- Thorough investigation approach
- Citation requirements
- Source validation
- Multi-perspective analysis

**SOUL.md:**
- Curious, thorough, accurate
- Acknowledge uncertainty
- Support claims with evidence

**TOOLS.md:**
- Web search APIs
- Academic databases
- Citation tools

**Expected token savings:** 35-40%

---

## Checklist for Copilot Agent

Before submitting optimized files:

- [ ] User's use case clearly understood
- [ ] All irrelevant sections removed
- [ ] Tone/persona matches use case
- [ ] File-specific content optimized
- [ ] TOOLS.md contains only used tools
- [ ] BOOTSTRAP.md has project structure + key commands
- [ ] Token savings estimated (should be 30-50%)
- [ ] User can copy/paste files directly
- [ ] User asked if more changes needed
- [ ] Offered nested files (bootstrap-extra-files) if monorepo

---

## Red Flags to Avoid

❌ **Don't:**
- Keep generic chatbot group chat guidance for non-chat agents
- Add sections user didn't ask for ("improvements")
- Over-explain or over-comment
- Leave token-wasting examples (emojis, casual tone for technical agents)
- Assume one use case (always ask user first)

✅ **Do:**
- Ask user their use case explicitly
- Show before/after token costs
- Keep rewritten content concise and focused
- Offer quick wins (remove obvious irrelevant sections first)
- Let user iterate ("Does this feel right?")

---

## Files to Modify

**User should edit:**
```
~/.openclaw/workspace/AGENTS.md
~/.openclaw/workspace/SOUL.md
~/.openclaw/workspace/IDENTITY.md
~/.openclaw/workspace/USER.md
~/.openclaw/workspace/TOOLS.md
~/.openclaw/workspace/BOOTSTRAP.md
~/.openclaw/workspace/HEARTBEAT.md (if enabled)
```

**Optional: Config changes**
```
~/.openclaw/config.json

If monorepo:
Add bootstrap-extra-files hook to load nested AGENTS.md, SOUL.md, etc.
```

---

## Resources

- **Default templates location:** `/docs/reference/templates/`
- **Config schema:** `openclaw config schema --json`
- **Current settings:** `openclaw config get agents.defaults`
- **Test changes:** Run agent once, observe system prompt behavior

---

## Summary

Goal: Remove irrelevant content → Reduce tokens → Improve focus

**Process:**
1. Understand use case
2. Audit current files
3. Identify irrelevant sections
4. Rewrite for specificity
5. Validate token savings
6. User copies/tests

**Expected outcome:** 30-50% system prompt reduction, better agent focus
