# OpenClaw Capabilities QED Registry

**Purpose:** Store research findings about OpenClaw capabilities as proof-of-function code and documentation.

**Format:** Each capability gets one markdown file with findings + one or more QED proof files.

---

## Capabilities Checked

### 1. **Recursive File Inclusion in System Prompt** ❌ NOT IMPLEMENTED
   - **Question:** Does OpenClaw recursively include files when it encounters "Read X.md" instructions in SOUL.md/AGENTS.md?
   - **Answer:** **NO**
   - **Evidence:** 
     - `src/agents/bootstrap-files.ts` loads bootstrap files from known locations
     - `src/agents/pi-embedded-helpers/bootstrap.ts::buildBootstrapContextFiles()` includes file content as-is
     - No directive parser for inline "Read X.md" instructions
   - **QED:** See `proofs/file-inclusion.qed.ts`

### 2. **Tool Discovery & Availability** ✅ FULLY IMPLEMENTED
   - **Question:** How does OpenClaw decide which tools are available to an agent and when to use them?
   - **Answer:** **Layered system** — Profile → Context Filtering → Tool Policy → Structured Definitions
   - **Evidence:**
     - `src/agents/tool-catalog.ts` — Tool definitions with profiles (minimal, coding, messaging, full)
     - `src/agents/tools-effective-inventory.ts` — Context-aware filtering (sender, channel, permissions)
     - `src/agents/pi-tools.policy.ts` — Allow/deny rules per-tool
     - `src/agents/system-prompt.ts:496-530` — Tooling guidance in system prompt
   - **QED:** See `proofs/tool-availability.qed.ts`

### 3. **Agent Inference: Tool & Skill Execution Flow** ✅ FULLY IMPLEMENTED
   - **Question:** How do agents and inference use tools and skills? What's the complete execution flow?
   - **Answer:** **8-phase flow** — Discovery → Prompt Assembly → Session Creation → Model Inference → Tool Execution → Result Feedback
   - **Key findings:**
     - Tools are discovered in Phase 1, system prompt built in Phase 2
     - System prompt contains **guidance**, not full tool definitions
     - Tool definitions (with schemas) passed **separately** to model
     - Skills are **NOT separate** — accessed via `read()` tool, then model follows guidance
     - Inference is a loop: Model → Call Tool → Execute → Feedback → Continue/Reply
   - **Evidence:**
     - `src/agents/pi-embedded-runner/run/attempt.ts:~470` — Skill discovery
     - `src/agents/pi-embedded-runner/run/attempt.ts:~760` — System prompt assembly
     - `src/agents/pi-embedded-runner/run/attempt.ts:~932-945` — Session creation with tools
     - `SessionManager` (from `@mariozechner/pi-coding-agent`) — Tool execution
   - **QED:** See `capabilities/agent-inference-tool-skill-flow.md` + `proofs/agent-tool-skill-execution.qed.ts`

### 4. **Context Maintenance & Compaction** ✅ FULLY IMPLEMENTED
   - **Question:** How does OpenClaw maintain context across long conversations? Sliding window? Token budget? What's the actual strategy?
   - **Answer:** **NOT sliding window** — **Smart multi-stage compaction with intelligent routing**
   - **Key findings:**
     - Preemptive compaction check before each inference (`shouldPreemptivelyCompactBeforePrompt()`)
     - Smart routing: truncate-only vs. compact-only vs. compact-then-truncate based on context overflow
     - NOT naive summarization — three-level fallback (provider → LLM → structured fallback)
     - Preserves tool_use/tool_result semantic boundaries during message splitting
     - Configurable: max history share, quality guards, recent turns to preserve
     - Multi-trigger: preemptive overflow check, extension hook, timeout-based fallback
   - **Evidence:**
     - `src/agents/pi-embedded-runner/run/preemptive-compaction.ts:40-90` — Overflow detection & routing
     - `src/agents/compaction.ts` — Core compaction functions (chunking, summarization, pruning)
     - `src/agents/pi-hooks/compaction-safeguard.ts:724-875` — Extension hook for safeguard-mode summarization
     - `src/agents/pi-embedded-runner/extensions.ts:88-111` — Extension factory registration
     - Constants: `SAFETY_MARGIN=1.2`, `BASE_CHUNK_RATIO=0.4`, `MIN_CHUNK_RATIO=0.15`
   - **QED:** See `capabilities/context-maintenance-and-compaction.md` + `proofs/context-maintenance.qed.ts`

---

## Storage & Access

- Each capability as `.md` file with question + answer + evidence + links to QED
- QED proofs in `proofs/` with same name as capability file
- You can ask new questions anytime; I'll search, document, and commit findings
