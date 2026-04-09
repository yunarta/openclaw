# Optimizing Default MD Files for Agent Use Case

## Problem

Default MD files (AGENTS.md, SOUL.md, IDENTITY.md, etc.) are **generic templates** designed for a general-purpose chatbot. They contain guidance irrelevant to specialized use cases:

**Example from default AGENTS.md:**
```markdown
### 💬 Know When to Speak!

In group chats where you receive every message, be **smart about when to contribute**:
- Respond when: Directly mentioned or asked
- Stay silent when: It's just casual banter between humans

### 😊 React Like a Human!

On platforms that support reactions (Discord, Slack), use emoji reactions naturally...
```

**Problem:** If you're using OpenClaw as a **coding agent**, this guidance is 100% irrelevant. It wastes tokens and dilutes focus.

---

## Solution: Tailor MD Files to Your Use Case

### **Principle: Every Line Must Earn Its Place**

Each MD file should contain ONLY guidance that affects agent behavior for YOUR use case.

---

## Example: Coding Agent Optimization

### ❌ Default (Generic Chatbot)

```markdown
# AGENTS.md

## Group Chat Behavior
- Know when to speak
- React with emojis
- Don't dominate conversations

## Tooling
Blah blah generic tool guidance...

## Workspace
Your working directory is...
```

### ✅ Optimized (Coding Agent)

```markdown
# AGENTS.md

## Code Quality Standards
- Always read the file before editing
- Run tests after changes
- Use apply_patch for refactors, not full rewrites
- Prefer incremental changes over large rewrites

## Error Handling
- Compiler/lint errors: fix immediately, don't explain
- Test failures: debug root cause, don't blame the test
- Type errors: use exec to check types before proposing

## Coding Patterns
- Use `exec npm test` to validate changes
- Use `read` before `write` to understand context
- Use `apply_patch` for targeted changes
- Chain operations: read → understand → modify → test

## When to Propose vs Execute
- Simple fixes: execute directly (no proposal)
- Large refactors: propose plan first, get approval
- Breaking changes: always propose, never auto-execute

## File Operations
- Prefer `edit` for single changes
- Prefer `apply_patch` for multi-file coordination
- Avoid `write` (destructive) unless rebuilding entire file
```

---

## File-by-File Optimization Guide

### **AGENTS.md** (System Behavior)

**Keep:** Behavior specific to YOUR use case
- Coding patterns (for coding agent)
- Group chat rules (for group chat agent)
- Customer service tone (for support agent)

**Remove:** Generic chatbot guidance
- "Know when to speak in group chats" (irrelevant if not group chat)
- "React with emojis" (irrelevant if CLI-only)
- "Avoid the triple-tap" (irrelevant if not messaging)

**Example coding-agent AGENTS.md:**
```markdown
# Agent Behavior for Coding Tasks

## Code-First Approach
1. Read the code context before proposing changes
2. Validate understanding with tool calls (exec, read)
3. Make targeted changes using apply_patch or edit
4. Verify changes with tests

## Error Resolution
- Compiler errors: fix in-place, show final state
- Test failures: debug root cause, don't ignore
- Type errors: validate with exec before submitting

## Tool Usage Priority
1. `read` — understand what exists
2. `exec` — validate/test changes
3. `edit` or `apply_patch` — make changes
4. Repeat until green

## Communication Style
- Show code, not explanations
- Errors as signals, not excuses
- Minimal narration (execution focus)
```

---

### **SOUL.md** (Persona & Tone)

**Keep:** Tone specific to YOUR agent
- "Direct, no-nonsense" (for coding)
- "Warm and empathetic" (for support)
- "Explain like I'm 5" (for education)

**Remove:** Generic tone guidance
- "Be friendly and casual" (maybe not for coding)
- "Use emojis to be fun" (irrelevant for CLI)
- "Be playful and witty" (depends on your style)

**Example coding-agent SOUL.md:**
```markdown
# Persona: Focused Coding Assistant

## Tone
- Direct and technical (no fluff)
- Problem-solver first, explainer second
- Show work, not reasoning
- Action-oriented: "I'll fix this" not "This could be fixed"

## Communication Style
- Code and errors as primary signals
- Minimal small-talk
- Questions that unblock, not rhetorical
- Keep replies focused on the task

## What I Value
- Clean, maintainable code
- Test-driven validation
- Incremental improvements
- Root cause analysis (not band-aids)
```

---

### **IDENTITY.md** (Who You Are)

**Keep:** Specific identity for your role
```markdown
# I am a TypeScript/Python coding assistant

Specialized in:
- Full-stack web development
- Testing and validation
- Refactoring and code quality
- Bug investigation

I work best with:
- Repos with clear directory structure
- Projects with existing test suites
- Clear error messages and logs
```

**Remove:** Generic identity
- "I'm OpenClaw, a helpful assistant"
- "I can answer any question"
- "I help with coding and general tasks"

---

### **TOOLS.md** (External Tool Guidance)

**Keep:** Tools relevant to your workflow
```markdown
# Tools and Environment

## NPM/Package Management
- Run `npm test` after changes
- Use `npm list` to check versions
- Lock files track dependencies

## Git Workflow
- Commit after logical units of work
- Push only tested, working code
- Branch for major refactors
```

**Remove:** Irrelevant tools
- "How to use Google" (if you're a coding agent)
- "Social media strategies" (if you're not)
- "Customer support ticketing" (if you're not)

---

### **BOOTSTRAP.md** (Project Setup & Context)

**Keep:** Project-specific notes
```markdown
# Project: MyTypescriptLib

## Quick Start
- Node 22+, pnpm 9+
- Run `pnpm install && pnpm test` to validate

## Key Commands
- `pnpm build` — compile to dist/
- `pnpm test` — run vitest
- `pnpm lint` — check code quality

## Project Structure
```
src/
  core/     ← Core library code
  types/    ← TypeScript types
  utils/    ← Helper functions
test/       ← Test files (*.test.ts)
dist/       ← Built output (gitignored)
```

## Important Patterns
- Use Result<T, E> for error handling (not exceptions)
- All public APIs need tests
- Prefer small focused functions over classes
- Document breaking changes in CHANGELOG.md
```

**Remove:** Generic setup notes
- "Remember to commit your changes" (obvious)
- "Be careful with deletions" (obvious)
- Generic workspace tips

---

### **HEARTBEAT.md** (Periodic Checks)

**Keep:** Use-case specific checks
```markdown
# Coding Agent Heartbeat Checks

Every 10 minutes, check:
- Are there failing tests? (run `pnpm test`)
- Did a compilation break? (run `pnpm build`)
- Are there uncommitted changes? (run `git status`)

If any issue found: report and offer to fix
If all good: HEARTBEAT_OK
```

**Remove:** Generic heartbeat guidance
- "How are you feeling?" (irrelevant)
- "Is there anything to chat about?" (irrelevant)

---

## Optimization Checklist

Before committing default MD files:

- [ ] **AGENTS.md**: Only coding-specific behavior? Remove group chat/emoji/casual tone guidance?
- [ ] **SOUL.md**: Persona matches actual use case (coding vs support vs chat)?
- [ ] **IDENTITY.md**: Specific tech stack and specialization, not generic?
- [ ] **TOOLS.md**: Lists tools YOU actually use, not irrelevant external tools?
- [ ] **BOOTSTRAP.md**: Project structure + key commands, not generic tips?
- [ ] **HEARTBEAT.md**: Checks relevant to your agent's job?
- [ ] **Total tokens**: Did removing irrelevant content reduce system prompt size?

---

## Token Impact Analysis

### Generic Chatbot (Default)
```
AGENTS.md:   ~800 tokens (group chat, reactions, etc.)
SOUL.md:     ~300 tokens (casual tone)
IDENTITY.md: ~200 tokens (generic)
TOOLS.md:    ~400 tokens (unrelated external tools)
BOOTSTRAP.md:~250 tokens (generic tips)
────────────────────────
Total:      ~1,950 tokens (unnecessary!)
```

### Optimized Coding Agent
```
AGENTS.md:   ~400 tokens (code patterns only)
SOUL.md:     ~150 tokens (direct, technical tone)
IDENTITY.md: ~150 tokens (TypeScript/Python focus)
TOOLS.md:    ~200 tokens (npm, git, testing)
BOOTSTRAP.md:~200 tokens (project structure)
────────────────────────
Total:      ~1,100 tokens (45% reduction!)
```

**Savings per inference:** ~850 tokens
**Per 100 inferences:** ~85,000 tokens = real cost savings

---

## Key Principle

**Every sentence in MD files is sent with EVERY inference.**

- If a sentence doesn't affect agent behavior for your use case → DELETE IT
- If guidance applies to a scenario you never use → DELETE IT
- If token count is high → audit aggressively

The goal: **Minimal, focused, use-case-optimized MD files.**

---

## Implementation Steps

1. **Audit current MD files** — Mark irrelevant sections
2. **Rewrite for your use case** — Keep ONLY relevant guidance
3. **Measure token impact** — Before/after system prompt size
4. **Validate behavior** — Run sessions, ensure agent still behaves correctly
5. **Commit optimized versions** — Use these going forward

**Files affected:**
- `~/.openclaw/workspace/AGENTS.md`
- `~/.openclaw/workspace/SOUL.md`
- `~/.openclaw/workspace/IDENTITY.md`
- `~/.openclaw/workspace/TOOLS.md`
- `~/.openclaw/workspace/BOOTSTRAP.md`
- `~/.openclaw/workspace/HEARTBEAT.md` (if enabled)
