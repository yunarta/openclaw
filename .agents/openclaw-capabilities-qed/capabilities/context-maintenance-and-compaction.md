# Context Maintenance & Compaction Across Long Conversations

## Question
**How does OpenClaw maintain context across long conversations? Is it simple sliding window? Token budget? What's the actual strategy?**

---

## Answer: **NOT Sliding Window — Smart Multi-Stage Compaction with Intelligent Routing**

### **Key Finding: Three-Part Strategy**

```
BEFORE sending to model:
  1. Preemptive overflow check
  2. Smart routing decision (compact? truncate? both?)
  3. Execute chosen strategy (compress history, truncate results, or both)
```

**Result:** Context maintained intelligently for **much longer conversations** than simple sliding window allows.

---

## **Part 1: Trigger Detection — Preemptive Compaction Check**

### **When Does Compaction Happen?**

**Location:** `src/agents/pi-embedded-runner/run/preemptive-compaction.ts:40-90`

**Before each model inference, OpenClaw checks:**

```typescript
function shouldPreemptivelyCompactBeforePrompt(params: {
  messages: AgentMessage[];           // Current conversation history
  systemPrompt?: string;              // System prompt text
  prompt: string;                     // User message about to send
  contextTokenBudget: number;         // Model's context window
  reserveTokens: number;              // Safety buffer (e.g., 1024 for output)
}): {
  route: PreemptiveCompactionRoute;   // Decision: fits/compact/truncate/both
  shouldCompact: boolean;
  estimatedPromptTokens: number;
  overflowTokens: number;             // How many tokens over budget
  toolResultReducibleChars: number;   // How much tool results can shrink
}
```

**The Check:**
```
Estimated tokens = (messages + system prompt + new user message) × SAFETY_MARGIN (1.2)

If estimated ≤ (context budget - reserve):
  → Route: "fits" (no compaction needed)

Else (overflow detected):
  → Check tool result truncation potential
  → Route to: "truncate_only" OR "compact_only" OR "compact_then_truncate"
```

### **Safety Margin Rationale**

- Token estimation uses char/4 heuristic (not perfectly accurate)
- SAFETY_MARGIN=1.2 adds 20% buffer to avoid underestimation
- Prevents "thought it fit, but actually overflowed" errors

---

## **Part 2: Smart Routing Strategy**

### **Three Mitigation Routes**

| Route | When | Action | Result |
|-------|------|--------|--------|
| **fits** | estimated ≤ budget | None | Continue to model directly |
| **truncate_tool_results_only** | overflow BUT tool results are large enough | Shrink tool result blocks to fit | Keep full history + recent results |
| **compact_only** | overflow AND tool results can't absorb it | Summarize old messages | Remove conversation detail, keep summaries |
| **compact_then_truncate** | overflow AND neither strategy alone sufficient | Both (1) summarize old messages AND (2) shrink tool results | Maximum compression applied |

### **Decision Logic**

```typescript
// From preemptive-compaction.ts:73-80
if (overflowTokens > 0) {
  if (toolResultReducibleChars <= 0) {
    route = "compact_only";  // Can't truncate results, must compact
  } else if (toolResultReducibleChars >= truncateOnlyThresholdChars) {
    route = "truncate_tool_results_only";  // Results are huge, just trim them
  } else {
    route = "compact_then_truncate";  // Both strategies needed
  }
}
```

---

## **Part 3: Compaction Execution — Intelligent History Compression**

### **NOT Naive Summarization**

OpenClaw uses **three complementary strategies:**

1. **Preserve Tool Boundaries** (Split Messages by Token Share)
2. **Multi-Level Fallback** (Try summarization, fall back to simpler approaches)
3. **Smart Message Pruning** (Remove oldest messages while repairing orphaned state)

### **Strategy A: Intelligent Chunking**

**File:** `src/agents/compaction.ts:splitMessagesByTokenShare()`

```typescript
function splitMessagesByTokenShare(
  messages: AgentMessage[],
  parts: number  // How many chunks to create
): AgentMessage[][]
```

**What it does:**
- Divides messages into N chunks by token count distribution
- **Preserves tool_use/tool_result pairs** — never splits a tool call from its result
- Each chunk maintains semantic coherence

**Why it matters:**
```
WRONG (breaks semantic links):
  Chunk 1: [messages..., tool_use(read_file)]
  [SUMMARY BOUNDARY]
  Chunk 2: [tool_result(file content), messages...]
  
RIGHT (preserves pairing):
  Chunk 1: [messages..., tool_use(read_file), tool_result, messages...]
  [SUMMARY BOUNDARY]
  Chunk 2: [messages...]
```

### **Strategy B: Three-Level Fallback on Summarization**

**File:** `src/agents/compaction.ts:summarizeWithFallback()` and `src/agents/pi-hooks/compaction-safeguard.ts:799-855`

#### **Level 1: Provider-Based Summarization**

If configured, tries a specialized compaction provider first:

```typescript
if (providerId) {
  const compactionProvider = getCompactionProvider(providerId);
  providerResult = await provider.summarize(allMessages);
  if (providerResult !== undefined) {
    return providerSummary;  // ← Provider succeeded
  }
  // Provider failed or returned empty → fall through
}
```

**Benefit:** External summarization service (if configured) can use specialized compression algorithms.

#### **Level 2: LLM-Based Summarization with Quality Guards**

If provider fails/not configured, use language model:

```typescript
// From compaction-safeguard.ts:859-880
const model = ctx.model ?? runtime?.model;
const authResult = await resolveModelAuth(ctx, model);

// Summarize with instructions about identifier preservation
const summary = await llm.summarize(messagesToSummarize, {
  identifierPolicy: "strict",  // Don't lose API keys, UUIDs, etc.
  customInstructions: userCustomInstructions,
  qualityGuard: qualityGuardEnabled  // Retry if summary quality is poor
});
```

**Quality Guard (Optional):**
- After summarization, asks model: "Is this summary complete and accurate?"
- If no, retries up to 3 times (configurable)
- Prevents lossy compression

#### **Level 3: Final Fallback — Structured Fallback Summary**

If both strategies fail, build minimal fallback:

```typescript
if (summarizationFailed) {
  const fallback = buildStructuredFallbackSummary(previousSummary);
  // Returns: "[Previous summary preserved] [New markers] [File ops]"
}
```

**This ensures compaction never completely fails** — at worst, previous summary is preserved with metadata.

---

## **Part 3B: Smart Message Pruning**

**File:** `src/agents/compaction.ts:pruneHistoryForContextShare()`

After summarizing, iteratively removes oldest message chunks while:

1. **Keeps recent N turns** (default 3, configurable)
2. **Repairs orphaned tool_results** — if a tool_use is removed but its tool_result remains, either:
   - Remove the orphaned result
   - Move it to a "recent results" boundary section
3. **Preserves system context** — keeps bootstrap files, critical instructions
4. **Tracks max history share** — ensures summary doesn't exceed 50% of context (configurable)

```typescript
function pruneHistoryForContextShare(params: {
  messages: AgentMessage[];
  contextShare: number;              // e.g., 0.5 = 50% of budget
  contextWindowTokens: number;
  toolResultSafetyMargin?: number;
  keepRecentTurns?: number;           // e.g., 3 recent turns
  maxRecompactionAttempts?: number;
}): AgentMessage[]
```

**Flow:**
1. Estimate tokens in messages (with safety margin)
2. If exceeds contextShare limit:
   - Find oldest chunk to remove
   - Check for orphaned tool_results
   - Repair by removing orphans or moving to boundary
   - Retry until within limit

---

## **Part 4: Hook Integration — When Compaction Runs**

### **Extension-Based Architecture**

**File:** `src/agents/pi-embedded-runner/extensions.ts:88-111`

Compaction is an **extension** that hooks into the Pi agent lifecycle:

```typescript
function buildEmbeddedExtensionFactories(params) {
  if (resolveCompactionMode(params.cfg) === "safeguard") {
    setCompactionSafeguardRuntime(sessionManager, {
      maxHistoryShare: 0.5,
      contextWindowTokens: 8192,
      identifierPolicy: "strict",
      qualityGuardEnabled: true,
      recentTurnsPreserve: 3,
    });
    factories.push(compactionSafeguardExtension);
  }
}
```

### **Hook Point: session_before_compact**

**File:** `src/agents/pi-hooks/compaction-safeguard.ts:724-875`

```typescript
export default function compactionSafeguardExtension(api: ExtensionAPI): void {
  api.on("session_before_compact", async (event, ctx) => {
    // This event is emitted by Pi agent when compaction is needed
    const preparation = event.preparation;
    
    // preparation contains:
    // - messagesToSummarize: oldest messages
    // - turnPrefixMessages: split-turn prefix (if turn was split)
    // - previousSummary: summary from last compaction
    // - fileOps: list of file read/write operations
    // - tokensBefore: token count before compaction
    
    // Execute compaction (provider path → LLM path → fallback)
    return { compaction: { summary, firstKeptEntryId, tokensBefore } };
  });
}
```

---

## **Complete Flow: Long Conversation Example**

### **Setup**
```
Context window: 8,192 tokens
Reserve tokens: 1,024 (for model output)
Effective budget: 7,168 tokens
Safety margin: 1.2 (20% buffer)
```

### **Turn 1: "Hello, help me organize my project"**
```
Prompt tokens estimate: 850 (messages + system + prompt) × 1.2 = 1,020 tokens
Budget: 7,168
Overflow: 0
Route: "fits"
Action: Send to model directly ✓
```

### **Turn 50: After 50 back-and-forths**
```
Prompt tokens estimate: 7,500 × 1.2 = 9,000 tokens
Budget: 7,168
Overflow: 1,832 tokens
Tool result chars: 450,000 (large execution outputs)
Truncation threshold: ~7,328 chars
Truncation potential: 400,000 chars

Decision:
- Overflow: 1,832 tokens
- Tool results reducible: 400,000 chars (>>threshold)
Route: "truncate_tool_results_only"
Action: Trim tool results to ~8KB each ✓
History stays intact, model keeps full conversation context
```

### **Turn 120: After many more turns**
```
Prompt estimate: 8,800 × 1.2 = 10,560 tokens
Budget: 7,168
Overflow: 3,392 tokens
Tool results already trimmed
Tool result truncation potential: 50,000 chars
Truncation threshold: ~13,568 chars

Decision:
- Overflow: 3,392 tokens
- Tool results reducible: 50,000 chars (< threshold)
Route: "compact_then_truncate"
Action:
  1. Summarize oldest 60 turns (keep recent 3 turns)
     - Split by token share (preserve tool pairs)
     - Use provider summarization (if configured)
     - Fall back to LLM summarization
     - Quality guard (optional retry)
  2. Replace old turns with summary paragraph
  3. Also trim remaining tool result blocks
Result: Context dropped from 10,560 tokens to ~6,500 tokens
Model continues with: [system prompt] + [summary] + [recent 3 turns] + [new message]
```

### **Turn 200+: After many compactions**
```
System prompt: 2,000 tokens (unchanged, cached)
Summary from compaction 1: 800 tokens
Summary from compaction 2: 600 tokens
Recent 3 turns: 2,000 tokens
New message: 150 tokens
Total: ~5,550 tokens
Budget: 7,168 tokens
Overflow: 0
Route: "fits"

Compaction happened at turns 120, 160, 190 (automatically)
Model can continue indefinitely because summaries compress old context
```

---

## **Key Architectural Insights**

### **NOT a Sliding Window**
```
Sliding window (naive):
  [msg 1..50] [msg 51..100] [msg 101..150]  → Keep 150 only, forget 1-149

OpenClaw's approach:
  [summary of 1..99] + [full 100..150]  → Remember context via summary, keep detail for recent turns
```

### **Token Estimation with Safety**
- Uses `char / 4` heuristic (fast, often underestimates)
- Applies SAFETY_MARGIN=1.2 to compensate
- Explicitly handles estimation errors in fallback logic

### **Tool Pair Preservation**
- A tool_use without its tool_result is useless (model doesn't know what command returned)
- splitMessagesByTokenShare respects boundaries
- pruneHistoryForContextShare repairs orphaned pairs

### **Multiple Trigger Points**
1. **Preemptive** (before inference) — `shouldPreemptivelyCompactBeforePrompt()`
2. **Extension-based** (during inference) — `session_before_compact` hook
3. **Timeout-based** (slow summarization) — `compaction-safety-timeout.ts`
4. **Overflow** (context exceeded) — fallback to simpler strategies

### **Configurable, Not Hardcoded**
```typescript
// From extensions.ts and config
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard",                    // "default" or "safeguard"
        provider: "claude-compaction",        // optional external provider
        maxHistoryShare: 0.5,                 // keep summary ≤ 50% of context
        identifierPolicy: "strict",           // preserve secrets/UUIDs
        customInstructions: "...",            // user guidance for summaries
        qualityGuard: {
          enabled: true,
          maxRetries: 2
        },
        recentTurnsPreserve: 3                // always keep last 3 turns
      }
    }
  }
}
```

---

## **Code References**

### **Preemptive Compaction**
- **Detection:** `src/agents/pi-embedded-runner/run/preemptive-compaction.ts:40-90`
- **Called from:** `src/agents/pi-embedded-runner/run/attempt.ts:1852`
- **Routes:** "fits", "compact_only", "truncate_tool_results_only", "compact_then_truncate"

### **Compaction Execution**
- **Chunking:** `src/agents/compaction.ts:splitMessagesByTokenShare()`
- **Summarization:** `src/agents/compaction.ts:summarizeInStages()`
- **Pruning:** `src/agents/compaction.ts:pruneHistoryForContextShare()`
- **Safeguard Extension:** `src/agents/pi-hooks/compaction-safeguard.ts:724-875`

### **Configuration**
- **Extension factories:** `src/agents/pi-embedded-runner/extensions.ts:80-118`
- **Settings:** `cfg?.agents?.defaults?.compaction`
- **Token budget:** `src/agents/context-window-guard.ts`
- **Safety timeouts:** `src/agents/pi-embedded-runner/compaction-safety-timeout.ts`

### **Token Estimation**
- **Constants:** `BASE_CHUNK_RATIO=0.4`, `MIN_CHUNK_RATIO=0.15`, `SAFETY_MARGIN=1.2`
- **Function:** `estimateMessagesTokens()` from `src/agents/compaction.ts`
- **Preemptive calc:** `estimatePrePromptTokens()` in `preemptive-compaction.ts`

---

## **Summary: NOT Naive, But Intelligent**

**Sliding Window:** Keep last N messages (loses context after N)
**OpenClaw's Approach:**
- Detects overflow **before** it happens
- Routes smartly between truncation and summarization
- Preserves semantic boundaries (tool pairs)
- Falls back gracefully if summarization fails
- Configurable quality guards to prevent lossy compression
- Enables conversations **10x+ longer** than context window

Result: **Context maintained across hundreds of turns** while keeping model understanding of earlier context via summaries.
