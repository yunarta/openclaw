import type {
  SeedDataType,
  SeedSkill,
  SeedEvidence,
  SeedOpenQuestion,
  SeedSymbol,
  SeedFlow,
  SeedFlowStep,
  SeedFinding,
} from "../seed-types.js";

export const skillSymbols: SeedSymbol[] = [
  {
    key: "sym:formatSkillsForPrompt",
    fileKey: "src/skills/loading/skill-contract.ts",
    name: "formatSkillsForPrompt",
    kind: "function",
    startLine: 38,
    endLine: 65,
    signature: "function formatSkillsForPrompt(skills: Skill[]): string",
    purpose:
      'Renders a compact <available_skills> XML catalog (name, description, location [file path], optional location_note, optional version -- NOT the SKILL.md body) injected into the system prompt, with explicit instructions telling the model to "Use the read tool to load a skill\'s file when the task matches its description." Comment notes this XML layout is deliberately byte-for-byte aligned with the upstream Anthropic Agent Skills formatter.',
    architecturalRole: "prompt-builder",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:resolveSkillDispatchTools",
    fileKey: "src/skills/runtime/tool-dispatch.ts",
    name: "resolveSkillDispatchTools",
    kind: "function",
    startLine: 51,
    endLine: 217,
    signature: "function resolveSkillDispatchTools(params): AnyAgentTool[]",
    purpose:
      'Policy-enforcement seam for a skill\'s command-dispatch: tool invocation (SkillCommandDispatchSpec { kind: "tool"; toolName }). Builds the tool set available to a skill-dispatched command by running the full normal tool-policy pipeline (profile/provider/global/agent/group/sender/sandbox/subagent/inherited allow-deny layers) so a skill cannot bypass the same security gates a direct tool call would go through. Comment references GHSA-mhm4-93fw-4qr2, confirming this is a deliberate security fix, not incidental design.',
    architecturalRole: "policy",
    importance: "high",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "high",
  },
];

export const skillDataTypes: SeedDataType[] = [
  {
    key: "dt:OpenClawSkillMetadata",
    name: "OpenClawSkillMetadata",
    category: "skill",
    status: "confirmed",
    persistenceScope: "process",
    providerSpecific: false,
    purpose:
      "Skill frontmatter metadata shape: always-on flag, environment/homepage hints, OS restriction, required binaries/env/config, and install specs for auto-installing missing dependencies.",
    fields: [
      {
        name: "always",
        typeText: "boolean | undefined",
        required: false,
        persisted: false,
        description: "Whether the skill is always active rather than discovered/matched.",
      },
      { name: "skillKey", typeText: "string | undefined", required: false, persisted: false },
      { name: "primaryEnv", typeText: "string | undefined", required: false, persisted: false },
      { name: "emoji", typeText: "string | undefined", required: false, persisted: false },
      { name: "homepage", typeText: "string | undefined", required: false, persisted: false },
      { name: "os", typeText: "string[] | undefined", required: false, persisted: false },
      {
        name: "requires",
        typeText:
          "{ bins?: string[]; anyBins?: string[]; env?: string[]; config?: string[] } | undefined",
        required: false,
        persisted: false,
        description: "Environment requirements gating whether the skill is usable.",
      },
      {
        name: "install",
        typeText: "SkillInstallSpec[] | undefined",
        required: false,
        persisted: false,
        description: "Auto-install specs (brew/node/go/uv/download).",
      },
    ],
  },
  {
    key: "dt:SkillInvocationPolicy",
    name: "SkillInvocationPolicy",
    category: "skill",
    status: "confirmed",
    persistenceScope: "process",
    providerSpecific: false,
    purpose: "Governs whether a skill can be invoked by the end user directly and/or by the model.",
    fields: [
      { name: "userInvocable", typeText: "boolean", required: true, persisted: false },
      { name: "disableModelInvocation", typeText: "boolean", required: true, persisted: false },
    ],
  },
  {
    key: "dt:SkillUsagePath",
    name: "SkillUsagePath",
    category: "skill",
    status: "confirmed",
    persistenceScope: "process",
    providerSpecific: false,
    purpose:
      "Identifies a skill for usage accounting/telemetry: the path visible to the tool runtime when it reads SKILL.md, the canonical source path, the skill name, and a bounded telemetry source label.",
    fields: [
      {
        name: "readPath",
        typeText: "string",
        required: true,
        persisted: false,
        description: "Path visible to the tool runtime when it reads SKILL.md.",
      },
      {
        name: "skillFile",
        typeText: "string",
        required: true,
        persisted: false,
        description: "Canonical source SKILL.md path used as the lifecycle identity.",
      },
      { name: "skillName", typeText: "string", required: true, persisted: false },
      {
        name: "skillSource",
        typeText: '"bundled" | "unknown" | "workspace"',
        required: true,
        persisted: false,
      },
    ],
  },
  {
    key: "dt:Skill",
    symbolKey: "sym:formatSkillsForPrompt",
    name: "Skill",
    category: "skill",
    status: "confirmed",
    persistenceScope: "session",
    providerSpecific: false,
    purpose:
      "src/skills/loading/skill-contract.ts:4-19. The canonical loaded-skill record (distinct from OpenClawSkillMetadata, which is the raw frontmatter): name, description, filePath, baseDir, sourceInfo, disableModelInvocation, plus a promptVersion (a deterministic marker rendered as <version> so the model can detect a changed SKILL.md and re-read it) and an optional locationNote / readContent (for non-filesystem skill locators like node://).",
    fields: [
      { name: "name", typeText: "string", required: true, persisted: false },
      {
        name: "description",
        typeText: "string",
        required: true,
        persisted: false,
        description:
          "Shown in the prompt catalog; this is what the model uses to decide whether a skill matches the current task.",
      },
      {
        name: "filePath",
        typeText: "string",
        required: true,
        persisted: false,
        description:
          "Shown in the prompt catalog as <location>; the model reads this path with its own file-read tool to load the full skill body.",
      },
      {
        name: "promptVersion",
        typeText: "string | undefined",
        required: false,
        persisted: false,
        description:
          "Deterministic marker rendered as <version>; the prompt instructs the model to re-read SKILL.md if this differs from a prior turn.",
      },
      { name: "disableModelInvocation", typeText: "boolean", required: true, persisted: false },
    ],
  },
];

/**
 * A representative sample of the ~53 bundled skills under top-level skills/,
 * confirmed to exist via directory listing this pass. Descriptions are not
 * independently verified against each SKILL.md's actual frontmatter (only
 * three example files were opened conceptually via listing, not read) --
 * status is "inferred" except where noted.
 */
export const seedSkills: SeedSkill[] = [
  {
    name: "video-frames",
    sourceFileKey: "skills/video-frames/SKILL.md",
    status: "confirmed",
    description: "Bundled skill directory confirmed to exist under skills/video-frames/SKILL.md.",
    instructionSource: "SKILL.md",
  },
  {
    name: "summarize",
    sourceFileKey: "skills/summarize/SKILL.md",
    status: "confirmed",
    description: "Bundled skill directory confirmed to exist under skills/summarize/SKILL.md.",
    instructionSource: "SKILL.md",
  },
  {
    name: "diagram-maker",
    sourceFileKey: "skills/diagram-maker/SKILL.md",
    status: "confirmed",
    description: "Bundled skill directory confirmed to exist under skills/diagram-maker/SKILL.md.",
    instructionSource: "SKILL.md",
  },
];

export const skillFlows: SeedFlow[] = [
  {
    name: "skill invocation",
    category: "skills",
    status: "confirmed",
    entrySymbolKey: "sym:formatSkillsForPrompt",
    description:
      "How a skill goes from 'available' to 'actually used' by the model: a compact catalog entry in the prompt, then a lazy full-content read, then (for command-dispatch: tool skills specifically) a policy-gated tool dispatch.",
    terminationCondition:
      "The model has read the skill's SKILL.md content (via its own read tool) and/or the skill's dispatched tool call has completed.",
    errorBehavior:
      "Not confirmed this pass for the read-based path; resolveSkillDispatchTools' policy pipeline can filter/deny specific tools for the command-dispatch: tool path.",
  },
];

export const skillFlowSteps: SeedFlowStep[] = [
  {
    flowName: "skill invocation",
    stepOrder: 1,
    title: "Compact skill catalog injected into the prompt",
    description:
      "formatSkillsForPrompt renders every eligible Skill as a <skill> entry (name, description, location, optional location_note/version) inside an <available_skills> block, with instructions telling the model to use its read tool when a skill's description matches the task, and to re-read if <version> changed since a prior turn.",
    symbolKey: "sym:formatSkillsForPrompt",
  },
  {
    flowName: "skill invocation",
    stepOrder: 2,
    title: "Model reads the full SKILL.md on demand",
    description:
      "The model issues a normal file-read tool call against the <location> path from the catalog entry -- there is no dedicated 'load skill' tool; skill loading reuses the same read tool as any other file read. (Inferred from the prompt instruction text and SkillUsagePath.readPath's doc comment; the exact read-tool call site was not traced this pass.)",
    alternatePath:
      "If disableModelInvocation is true, the skill never appears in the catalog for model-driven selection (still usable via other paths, e.g. explicit user invocation).",
  },
  {
    flowName: "skill invocation",
    stepOrder: 3,
    title: "Optional: command-dispatch: tool skills route through the tool-policy pipeline",
    description:
      "For a skill declaring command-dispatch: tool (SkillCommandDispatchSpec), resolveSkillDispatchTools rebuilds the caller's effective tool set through the same profile/provider/global/agent/group/sender/sandbox/subagent/inherited policy layers a direct tool call would go through, then dispatches.",
    symbolKey: "sym:resolveSkillDispatchTools",
    fileKey: "src/skills/runtime/tool-dispatch.ts",
  },
];

export const skillFindings: SeedFinding[] = [
  {
    category: "skills",
    title: "Skill prompt injection mirrors Anthropic's own Agent Skills XML format",
    description:
      "src/skills/loading/skill-contract.ts's formatSkillsForPrompt has a code comment stating its XML layout is deliberately kept byte-for-byte aligned with 'the upstream Agent Skills formatter' (Anthropic's Agent Skills feature), specifically to avoid importing the full upstream session runtime package just for formatting. Skills are injected as a compact index (name/description/location/version), never the full SKILL.md body -- the model is instructed to lazily read the full file with its own read tool when a skill's description matches the task.",
    significance:
      "Confirms model-selection is description-based (the model reads the compact catalog and chooses by description match), and that content injection is lazy/tool-mediated, not eager -- this resolves two open questions ('is content injected upfront or lazily' and 'how does model-selection work') from a single piece of evidence.",
    recommendation:
      "A standalone gateway's Skill Runtime should adopt the same compact-catalog-then-lazy-read pattern, and can reuse the upstream Agent Skills XML shape directly for prompt compatibility with Claude-family models.",
    status: "confirmed",
  },
];

export const skillEvidence: SeedEvidence[] = [
  {
    key: "ev:skill-metadata-shape",
    fileKey: "src/skills/types.ts",
    startLine: 1,
    endLine: 70,
    claim:
      "Skills are represented as SKILL.md files with OpenClawSkillMetadata frontmatter (always/skillKey/primaryEnv/os/requires/install) and a separate SkillInvocationPolicy (userInvocable/disableModelInvocation) governing who can trigger them.",
    evidenceType: "type-definition",
    confidence: 1.0,
    notes: "Read directly.",
  },
  {
    key: "ev:skills-directory-count",
    fileKey: "skills/video-frames/SKILL.md",
    claim:
      "The top-level skills/ directory contains dozens of individually named skill directories, each with a SKILL.md file (confirmed for video-frames, summarize, diagram-maker, xurl, blucli among others via find).",
    evidenceType: "call-site",
    confidence: 0.9,
    notes:
      "Confirmed via `ls skills/` and `find skills -iname SKILL.md`; full enumeration of all ~53 not performed this pass.",
  },
  {
    key: "ev:format-skills-for-prompt-full",
    fileKey: "src/skills/loading/skill-contract.ts",
    symbolKey: "sym:formatSkillsForPrompt",
    startLine: 1,
    endLine: 65,
    claim:
      "formatSkillsForPrompt injects a compact <available_skills> XML catalog (name/description/location/location_note?/version?) into the prompt, explicitly instructing the model to use its read tool to load a skill's full file when the task matches, and to re-read if the version marker changed.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes:
      "Read directly in full. Resolves both the skill-prompt-injection and skill-model-selection open questions.",
  },
  {
    key: "ev:skill-dispatch-tools-security",
    fileKey: "src/skills/runtime/tool-dispatch.ts",
    symbolKey: "sym:resolveSkillDispatchTools",
    startLine: 46,
    endLine: 50,
    claim:
      "resolveSkillDispatchTools' own code comment identifies it as a deliberate security fix (GHSA-mhm4-93fw-4qr2) keeping skill command-dispatch:tool invocations aligned with the normal tool-policy pipeline (allow/deny, group, sandbox, subagent layers).",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly in full (217 lines).",
  },
];

export const skillOpenQuestions: SeedOpenQuestion[] = [
  {
    category: "skills",
    question:
      "Exactly how is a skill's SKILL.md content injected into the model's prompt -- fully upfront, or lazily via a tool call the model issues?",
    evidenceInspected:
      "RESOLVED in a follow-up pass: formatSkillsForPrompt (src/skills/loading/skill-contract.ts:38-65, read in full) confirms only a compact catalog entry (name/description/location/version) is injected; the prompt text explicitly instructs the model to use its own read tool to load the full SKILL.md when the task matches the description.",
    reasonUnresolved: "N/A -- resolved.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod:
      "Remaining depth gap: the exact call site that assembles the list of Skill records passed into formatSkillsForPrompt (i.e. the discovery/filtering step before formatting) was not traced this pass.",
    priority: "low",
    status: "resolved",
  },
  {
    category: "skills",
    question:
      "How does model-selection of a skill work when disableModelInvocation is false -- is it description-based (model reads a catalog and chooses), rule-based, or route-based?",
    evidenceInspected:
      "RESOLVED in a follow-up pass: formatSkillsForPrompt's injected prompt text is description-based selection -- the model is shown every eligible skill's name/description/location and told to use its read tool 'when the task matches its description.' No rule-engine or router was found; selection is left to the model's own judgment against the description text.",
    reasonUnresolved: "N/A -- resolved.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod: "N/A -- resolved.",
    priority: "low",
    status: "resolved",
  },
];
