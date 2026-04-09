# OpenClaw Skill Selection & Composition

## Question
**When using a skill, is it orchestrator-based (explicit routing) or LLM-based (model decides)? And do skills contain only instructions or also helper scripts?**

---

## Answer: **LLM-Based Selection + Mixed Composition**

### **1. Skill Selection: LLM Decides (NOT Orchestrator)**

**System Prompt Guidance:**
```
## Skills (mandatory)
Before replying: scan <available_skills> <description> entries.
- If exactly one skill clearly applies: read its SKILL.md at <location> with `read`, then follow it.
- If multiple could apply: choose the most specific one, then read/follow it.
- If none clearly apply: do not read any SKILL.md.
Constraints: never read more than one skill up front; only read after selecting.
```

**Code Location:** `src/agents/system-prompt.ts:117-127`

**Flow:**
```
System prompt includes skill list with descriptions
        ↓
LLM reads available_skills in prompt
        ↓
LLM DECIDES if a skill applies (implicit decision)
        ↓
If yes: LLM generates tool call: read(SKILL.md)
        ↓
SessionManager executes read()
        ↓
SKILL.md content returned to LLM
        ↓
LLM follows skill instructions for next actions
```

**NO explicit orchestrator routing.** The system tells the LLM "here are available skills" and lets it decide.

---

## **2. Skill Composition: Instructions + Optional Scripts**

### **Skill Package Structure**

Skills can contain:

```
.agents/skills/
└── skill-id/
    ├── SKILL.md                (always)
    ├── scripts/                (optional)
    │   ├── helper.mjs
    │   └── helper.ts
    ├── agents/                 (optional)
    │   └── openai.yaml        (for OpenAI agent config)
    └── other files            (optional)
```

### **Example 1: Instructions Only** ❌

```
.agents/skills/
└── openclaw-release-maintainer/
    └── SKILL.md              (150 lines of instructions)
```

Content: Step-by-step workflow instructions with version checks, build commands, etc.

### **Example 2: Instructions + Helper Scripts** ✅

```
.agents/skills/
└── openclaw-test-heap-leaks/
    ├── SKILL.md              (instructions)
    ├── scripts/
    │   └── heapsnapshot-delta.mjs   (JavaScript utility)
    └── agents/
        └── openai.yaml
```

**SKILL.md contains:**
- Workflow steps
- **References to helper scripts** like:
  ```
  Use .agents/skills/openclaw-test-heap-leaks/scripts/heapsnapshot-delta.mjs
  to compare either two files directly or the earliest/latest pair per PID
  
  Example:
  - node .agents/skills/openclaw-test-heap-leaks/scripts/heapsnapshot-delta.mjs before.heapsnapshot after.heapsnapshot
  - node .agents/skills/openclaw-test-heap-leaks/scripts/heapsnapshot-delta.mjs --lane-dir .tmp/heapsnap/unit-fast-batch-2
  ```

**Script (heapsnapshot-delta.mjs):**
- 300+ lines of JavaScript
- Parses heap snapshot files
- Compares memory deltas
- Formats output for analysis

**How LLM uses it:**
1. LLM reads SKILL.md
2. SKILL.md says: "Run this command to analyze heapsnapshots"
3. LLM generates tool call: `exec(command: "node .agents/skills/.../heapsnapshot-delta.mjs ...")`
4. SessionManager executes
5. Script output returned to LLM
6. LLM analyzes the output

---

## **Key Differences from My Initial Understanding**

### **What I Said**
❌ "Skills are accessed via read() tool, then model follows guidance"

### **What Actually Happens**
✅ **"Skills are packages (SKILL.md + optional scripts) that LLM selects and follows"**

The LLM:
1. Reads SKILL.md content (via read tool)
2. Incorporates instructions into its reasoning
3. Follows those instructions (which may reference helper scripts)
4. Uses exec tool to run scripts mentioned in the skill
5. Processes script output

---

## **Code Evidence**

### **No Orchestrator Routing Logic**

**In `src/agents/pi-embedded-runner/run/attempt.ts`:**
```typescript
// Skills are loaded and included in system prompt
const { shouldLoadSkillEntries, skillEntries } = resolveEmbeddedRunSkillEntries({...});

const skillsPrompt = resolveSkillsPromptForRun({
  skillsSnapshot: params.skillsSnapshot,
  entries: shouldLoadSkillEntries ? skillEntries : undefined,
});

// Skills prompt is injected into system prompt
const systemPrompt = buildEmbeddedSystemPrompt({
  skillsPrompt: effectiveSkillsPrompt,  // ← Just text
  ...
});

// No skill selection logic after this
// LLM sees skills in prompt and decides implicitly
```

**No code like:**
```typescript
// NOT PRESENT in codebase:
if (userRequest.includes("release")) {
  selectSkill("openclaw-release-maintainer");  // ← DOESN'T EXIST
}
```

### **LLM Selection Guidance in System Prompt**

**In `src/agents/system-prompt.ts:111-127`:**
```typescript
function buildSkillsSection(params: { skillsPrompt?: string; readToolName: string }) {
  const trimmed = params.skillsPrompt?.trim();
  if (!trimmed) return [];
  
  return [
    "## Skills (mandatory)",
    "Before replying: scan <available_skills> <description> entries.",  // ← LLM scans
    `- If exactly one skill clearly applies: read its SKILL.md at <location> with \`${params.readToolName}\`, then follow it.`,
    "- If multiple could apply: choose the most specific one, then read/follow it.",  // ← LLM chooses
    "- If none clearly apply: do not read any SKILL.md.",
    // ...
  ];
}
```

**The guidance tells LLM to:**
1. Scan available_skills
2. **Choose** (LLM decision, not orchestrator)
3. Read selected SKILL.md
4. Follow instructions

---

## **Complete Example: Release Skill Flow**

```
User: "Prepare a v2026.4.9 stable release"
        ↓
System prompt includes:
"- $openclaw-release-maintainer: Maintainer workflow for releases..."
        ↓
LLM sees skill is relevant
        ↓
LLM: "I'll read the release skill"
        ↓
Tool call: read("/workspace/.agents/skills/openclaw-release-maintainer/SKILL.md")
        ↓
SessionManager executes → returns skill content (150 lines)
        ↓
LLM reads instructions, sees:
"- Before creating a release tag, make every version location above match..."
"- Run publish-time validation:
    pnpm build
    pnpm ui:build
    pnpm release:check
    pnpm test:install:smoke"
        ↓
LLM: "I'll run the build checks"
        ↓
Tool call: exec(command: "pnpm build")
Tool call: exec(command: "pnpm ui:build")
Tool call: exec(command: "pnpm release:check")
        ↓
LLM processes results, follows rest of skill instructions
```

---

## **Complete Example: Heap Leak Investigation**

```
User: "Investigate memory growth in tests"
        ↓
System prompt includes:
"- $openclaw-test-heap-leaks: Investigate memory growth..."
        ↓
LLM sees skill is relevant
        ↓
LLM: "I'll use the heap leaks skill"
        ↓
Tool call: read("/workspace/.agents/skills/openclaw-test-heap-leaks/SKILL.md")
        ↓
SessionManager executes → returns skill content (with script references)
        ↓
LLM reads instructions, sees:
"Use .agents/skills/openclaw-test-heap-leaks/scripts/heapsnapshot-delta.mjs
to compare snapshots..."
        ↓
LLM: "I'll run the analysis"
        ↓
Tool call: exec(command: "node .agents/skills/openclaw-test-heap-leaks/scripts/heapsnapshot-delta.mjs --lane-dir .tmp/heapsnap/unit-fast-batch-2")
        ↓
SessionManager executes script
        ↓
Script output: Memory delta analysis
        ↓
LLM analyzes output, follows skill guidance for next steps
```

---

## **Summary Table**

| Aspect | Details |
|--------|---------|
| **Selection** | **LLM-based** (implicit, not orchestrator routing) |
| **Mechanism** | System prompt lists available skills; LLM scans & chooses |
| **Composition** | SKILL.md (always) + optional helper scripts |
| **Helper Scripts** | JavaScript, TypeScript, shell - whatever needed |
| **Invocation** | LLM reads SKILL.md, follows instructions (which reference scripts), uses exec tool for scripts |
| **No Routing** | No hardcoded if-this-then-use-that logic |
| **Guidance** | "If skill applies, read it, then follow it" |

---

## **Files for Reference**

- **Skill discovery:** `src/agents/skills.ts`, `src/agents/pi-embedded-runner/skills-runtime.ts`
- **Skills prompt generation:** `src/agents/system-prompt.ts:111-127`
- **Example skills:** `.agents/skills/openclaw-release-maintainer/SKILL.md`, `.agents/skills/openclaw-test-heap-leaks/`
- **Execution flow:** `src/agents/pi-embedded-runner/run/attempt.ts` (no skill routing logic)
