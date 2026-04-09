# Recursive File Inclusion in System Prompt

## Question
**Does OpenClaw support recursive file inclusion when given instructions like "Read SOUL.md" in AGENTS.md, which then includes DIRECTIVE.md if SOUL.md references it?**

For example:
```markdown
# AGENTS.md
Read SOUL.md — this is who you are.

# SOUL.md  
Read DIRECTIVE.md — follow these rules.
```

Expected behavior: AGENTS.md → includes SOUL.md → includes DIRECTIVE.md → all three combined in system prompt.

---

## Answer
**NO** — This capability is **NOT implemented** in OpenClaw.

---

## What OpenClaw DOES Support

### 1. **Config-level `$include` directives** ✅
- **Where:** JSON5 config files (`config.json5`, `hooks.json5`, etc.)
- **Mechanism:** `src/config/includes.ts` 
- **Syntax:**
  ```json5
  {
    "$include": "./base.json5",           // single
    "$include": ["./a.json5", "./b.json5"] // multiple
  }
  ```
- **Features:**
  - Recursive processing
  - Circular include detection
  - Path traversal protection
  - Deep merge semantics

### 2. **Bootstrap file loading** ✅
- **Where:** `~/.openclaw/workspace/` or custom workspace
- **Known files:**
  - `SOUL.md` — agent personality/identity
  - `AGENTS.md` — agent setup instructions
  - `TOOLS.md` — tool documentation
  - `IDENTITY.md` — identity info
  - `USER.md` — user context
  - `BOOTSTRAP.md` — startup context
  - `MEMORY.md` — memory state
  - `HEARTBEAT.md` — dynamic context
- **Mechanism:** `src/agents/workspace.ts::loadWorkspaceBootstrapFiles()`
- **Behavior:** 
  - Loads each file from fixed locations
  - Includes content as-is in system prompt
  - Applies token budgets and truncation
  - **NO inline directive parsing**

---

## What's Missing

**Inline file reference parsing:** The system does NOT:
- Scan loaded files for "Read X.md" patterns
- Parse markdown directives for file includes
- Recursively resolve file references within loaded content
- Validate or enforce directive syntax

---

## Code Paths

| Capability | File | Function |
|-----------|------|----------|
| Config `$include` | `src/config/includes.ts` | `resolveConfigIncludes()`, `IncludeProcessor.process()` |
| Bootstrap loading | `src/agents/workspace.ts` | `loadWorkspaceBootstrapFiles()` |
| Context building | `src/agents/pi-embedded-helpers/bootstrap.ts` | `buildBootstrapContextFiles()` |
| System prompt assembly | `src/agents/system-prompt.ts` | (constructs prompt sections) |

---

## Potential Implementation Path

To add recursive file inclusion in system prompt, would need:

1. **Directive parser** — Recognize patterns like `Read SOUL.md` in markdown
2. **File resolver** — Resolve relative paths from workspace root
3. **Circular include guard** — Detect cycles like SOUL.md → AGENTS.md → SOUL.md
4. **Token budget respect** — Ensure recursive includes don't exceed context limits
5. **Integration point** — Hook into `src/agents/bootstrap-files.ts` or `buildBootstrapContextFiles()`

---

## Test Coverage

- No existing tests for this feature (because it doesn't exist)
- Config-level `$include` tests: `src/config/includes.test.ts`
- Bootstrap file tests: `src/agents/bootstrap-files.test.ts`
