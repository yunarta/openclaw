# Skill State & Persistence Across Inference Cycles

## Question
**When a skill modifies LLM instructions (e.g., becomes "agentic scrum squad"), how does that persist on next inference? Is SKILL.md re-sent each turn?**

---

## Answer: **Skill Content in Conversation History, NOT Re-read Each Turn**

### **Key Point: System Prompt Built ONCE**

```typescript
// src/agents/pi-embedded-runner/run/attempt.ts:741-770
const systemPromptText = buildEmbeddedSystemPrompt({
  skillsPrompt: effectiveSkillsPrompt,  // Skills LIST (descriptions only)
  // ... other params
});

// Applied once to session
applySystemPromptOverrideToSession(session, systemPromptText);
```

**System prompt includes:**
- Skills LIST (which skills available)
- NOT full SKILL.md content
- Just descriptions like: "$openclaw-release-maintainer: Maintainer workflow..."

---

## **How Skill Instructions Persist**

### **Turn 1: LLM Reads Skill**

```
System Prompt:
"## Skills (mandatory)
- $openclaw-scrum-squad: Make agent act as scrum squad..."

User: "Use the scrum squad skill"

LLM response:
"I'll read the scrum squad skill"

Tool call:
read("/workspace/.agents/skills/openclaw-scrum-squad/SKILL.md")

Tool result:
"# Scrum Squad Behavior
- Act as agile team
- Daily standups
- Sprint planning
- ..."

LLM response (after reading skill):
"Understood. I'll now operate as a scrum squad with daily standups..."
```

### **SessionManager Stores (in transcript):**
```json
[
  { "role": "user", "content": "Use the scrum squad skill" },
  { 
    "role": "assistant", 
    "content": [
      { "type": "text", "text": "I'll read the scrum squad skill" },
      { "type": "tool_use", "id": "...", "name": "read", "input": {...} }
    ]
  },
  { 
    "role": "user", 
    "content": [
      { 
        "type": "tool_result", 
        "tool_use_id": "...", 
        "content": "# Scrum Squad Behavior\n- Act as agile team\n..." 
      }
    ]
  },
  { 
    "role": "assistant", 
    "content": [
      { "type": "text", "text": "Understood. I'll now operate as a scrum squad..." }
    ]
  }
]
```

### **Turn 2: Next Inference (Same Session)**

```
System Prompt:
(SAME - built once)
"## Skills (mandatory)
- $openclaw-scrum-squad: Make agent act as scrum squad..."

Messages (from sessionManager):
[ turn1 user, turn1 assistant+tool_call, turn1 tool_result, turn1 assistant ]

(SKILL.MD CONTENT IS IN HISTORY, not re-read from system prompt)

User: "What's our sprint plan?"

LLM sees conversation history which includes:
- Tool result: "# Scrum Squad Behavior..."
- Assistant response: "I'll now operate as a scrum squad..."

LLM remembers skill behavior from HISTORY, not from re-reading
```

---

## **Code Flow: Persistence Through SessionManager**

### **Session Start**
```typescript
// Line 741: Build system prompt ONCE
const systemPromptText = buildEmbeddedSystemPrompt({
  skillsPrompt: effectiveSkillsPrompt,  // ← Skills LIST only
  ...
});

// Line 945: Apply to session
applySystemPromptOverrideToSession(session, systemPromptText);
session.agent.state.messages = [];  // ← Empty initially
```

### **Turn 1: LLM Reads Skill**
```typescript
// LLM sees: system prompt + empty history
// Decides to read skill
// Tool call: read(SKILL.md)

// SessionManager stores result:
sessionManager.appendToolResult({
  tool_use_id: "...",
  content: skillContent  // ← FULL SKILL.MD content stored
});

// Now session.agent.state.messages includes skill content
```

### **Turn 2: Next Inference**
```typescript
// System prompt is NOT rebuilt
// systemPromptText still = original build (line 741)

// But session.messages now includes:
[
  { tool_result: "# Scrum Squad Behavior..." },
  { assistant: "I'll operate as scrum squad..." }
]

// LLM receives:
// 1. System prompt (original, skills list only)
// 2. Conversation history (includes skill content from Turn 1)
//
// LLM context is:
// - System: "Skills available: ..."
// - History: [user asking, me reading skill, tool returns skill content, me responding]
//
// LLM remembers from HISTORY
```

---

## **What Gets Cached vs. What Changes**

| Component | Built When | Rebuilt | Persists How |
|-----------|-----------|---------|--------------|
| **System Prompt** | Session start (line 741) | NO | Static for session |
| **Skills List** | In system prompt | NO | Static in system prompt |
| **Full SKILL.md** | When LLM reads it | NO | In conversation history |
| **LLM's Understanding** | After reading skill | YES* | Through conversation history |
| **Conversation History** | Continuously | YES | SessionManager persistence |

*"YES" = evolves as LLM responds and takes actions based on skill

---

## **Multi-Turn Example: Scrum Squad Behavior**

### **Turn 1**
```
User: "Use scrum squad skill and set up our first sprint"

System Prompt:
"## Skills (mandatory)
- $openclaw-scrum-squad: Organize work as agile scrum squad..."

LLM:
1. Reads available_skills
2. Sees scrum-squad skill
3. Generates: read(SKILL.md)
4. Receives: "# Scrum Squad\n- Daily standups\n- Sprint cycles..."
5. Incorporates understanding
6. Response: "Understood. Setting up sprint structure with standups..."

SessionManager stores:
- Tool call (read SKILL.md)
- Tool result (skill content)
- Assistant response (based on skill)
```

### **Turn 2**
```
User: "What's our current sprint status?"

System Prompt:
(UNCHANGED - still just skills list)

Conversation History:
[
  Turn 1 user message
  Turn 1 tool_call: read(SKILL.md)
  Turn 1 tool_result: (FULL SKILL.MD CONTENT)  ← HERE
  Turn 1 assistant response
]

LLM:
- Reads system prompt (skills list)
- Reads conversation history (includes full SKILL.md from Turn 1)
- Understands: "I previously committed to scrum squad behavior"
- Responds: "Based on our sprint structure..."
  (Still acting as scrum squad because history shows it did that)
```

### **Turn 3**
```
User: "Switch to waterfall method"

System Prompt:
(STILL UNCHANGED)

Conversation History:
[
  Turn 1-2 history (including scrum squad skill content)
  Turn 2 user message
  Turn 2 assistant response
]

LLM:
- User asks to switch methods
- System prompt STILL says "scrum-squad skill available"
- But conversation history shows LLM committed to scrum squad
- LLM must decide: 
  - Follow skill (which is STILL in history)?
  - Or switch as user asks?
  - (Depends on conflict resolution, likely user wins explicit request)

KEY: If there's no explicit switch command, LLM continues
with scrum squad behavior because:
1. System prompt still lists it
2. Conversation history shows it implemented it
3. No new instruction to override
```

---

## **What If Skill Gets Updated?**

### **Scenario: SKILL.md Modified During Session**

```
Turn 1: LLM reads SKILL.md (version A)
  → Tool result stores VERSION A content
  → LLM acts based on VERSION A

Turn 2: Admin updates SKILL.md to version B
  → System prompt NOT rebuilt
  → Conversation history still has VERSION A
  → LLM continues with VERSION A behavior
  → (Not aware of VERSION B change)

Turn 3: If session is restarted
  → System prompt rebuilt
  → Skills list still same (descriptions don't change)
  → But if LLM reads SKILL.md again: NEW version B returned
```

**Conclusion:** Skill updates do NOT affect running sessions. Only new reads get new version.

---

## **System Prompt Override During Run**

There's ONE exception - context engine can update system prompt mid-run:

```typescript
// Line 1302-1307
if (assembled.systemPromptAddition) {
  systemPromptText = prependSystemPromptAddition({
    systemPrompt: systemPromptText,
    systemPromptAddition: assembled.systemPromptAddition,
  });
  applySystemPromptOverrideToSession(activeSession, systemPromptText);
}
```

But this is for **context engine dynamic adjustments**, NOT for skills.

---

## **Key Insights**

1. **System prompt built ONCE** at session start
2. **Skills list is static** in that system prompt
3. **Full SKILL.md content** is in conversation history (after read)
4. **LLM "remembers" skill** from conversation history, NOT by re-reading
5. **Skill changes during session?** Don't affect current session (only new reads get new version)
6. **Multi-turn behavior** persists because history includes both:
   - What skill said (tool result)
   - What LLM did about it (assistant response)

---

## **Code References**

- **System prompt build:** `src/agents/pi-embedded-runner/run/attempt.ts:741-770`
- **Session creation:** `src/agents/pi-embedded-runner/run/attempt.ts:945`
- **Skill reading:** LLM decides via system prompt guidance
- **Tool result storage:** `SessionManager.appendToolResult()` via pi-agent SDK
- **Next turn:** Conversation history loaded from `sessionManager.messages`
