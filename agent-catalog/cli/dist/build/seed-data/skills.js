export const skillDataTypes = [
    {
        key: "dt:OpenClawSkillMetadata",
        name: "OpenClawSkillMetadata",
        category: "skill",
        status: "confirmed",
        persistenceScope: "process",
        providerSpecific: false,
        purpose: "Skill frontmatter metadata shape: always-on flag, environment/homepage hints, OS restriction, required binaries/env/config, and install specs for auto-installing missing dependencies.",
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
                typeText: "{ bins?: string[]; anyBins?: string[]; env?: string[]; config?: string[] } | undefined",
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
        purpose: "Identifies a skill for usage accounting/telemetry: the path visible to the tool runtime when it reads SKILL.md, the canonical source path, the skill name, and a bounded telemetry source label.",
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
];
/**
 * A representative sample of the ~53 bundled skills under top-level skills/,
 * confirmed to exist via directory listing this pass. Descriptions are not
 * independently verified against each SKILL.md's actual frontmatter (only
 * three example files were opened conceptually via listing, not read) --
 * status is "inferred" except where noted.
 */
export const seedSkills = [
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
export const skillEvidence = [
    {
        key: "ev:skill-metadata-shape",
        fileKey: "src/skills/types.ts",
        startLine: 1,
        endLine: 70,
        claim: "Skills are represented as SKILL.md files with OpenClawSkillMetadata frontmatter (always/skillKey/primaryEnv/os/requires/install) and a separate SkillInvocationPolicy (userInvocable/disableModelInvocation) governing who can trigger them.",
        evidenceType: "type-definition",
        confidence: 1.0,
        notes: "Read directly.",
    },
    {
        key: "ev:skills-directory-count",
        fileKey: "skills/video-frames/SKILL.md",
        claim: "The top-level skills/ directory contains dozens of individually named skill directories, each with a SKILL.md file (confirmed for video-frames, summarize, diagram-maker, xurl, blucli among others via find).",
        evidenceType: "call-site",
        confidence: 0.9,
        notes: "Confirmed via `ls skills/` and `find skills -iname SKILL.md`; full enumeration of all ~53 not performed this pass.",
    },
];
export const skillOpenQuestions = [
    {
        category: "skills",
        question: "Exactly how is a skill's SKILL.md content injected into the model's prompt -- fully upfront, or lazily via a tool call the model issues?",
        evidenceInspected: "src/skills/types.ts's SkillUsagePath.readPath field ('Path visible to the tool runtime when it reads SKILL.md') suggests lazy, tool-mediated reads rather than eager full-content injection, but this is inferred from a field comment, not confirmed by reading the loader/runtime code.",
        reasonUnresolved: "src/skills/loading and src/skills/runtime subdirectories were confirmed to exist but not opened this pass.",
        likelyInterpretation: "Likely a hybrid: a short skill index/description is always in context (for model-selection), with the full SKILL.md body fetched on demand via a tool when the skill is actually invoked -- consistent with the 'Skill' tool pattern referenced in root AGENTS.md ('Skills own workflows').",
        verificationMethod: "Read src/skills/loading/*.ts and src/skills/runtime/*.ts in full, and find the model-facing tool (if any) that reads a SKILL.md body on demand.",
        priority: "high",
        status: "open",
    },
    {
        category: "skills",
        question: "How does model-selection of a skill work when disableModelInvocation is false -- is it description-based (model reads a catalog and chooses), rule-based, or route-based?",
        evidenceInspected: "Not traced this pass.",
        reasonUnresolved: "src/skills/discovery was confirmed to exist but not opened.",
        likelyInterpretation: "Likely description-based: a compact per-skill description is included in the system prompt or a dedicated Skill tool's own description, and the model chooses by issuing a tool call naming the skill.",
        verificationMethod: "Read src/skills/discovery/*.ts and search for where skill descriptions are assembled into a prompt or tool schema.",
        priority: "medium",
        status: "open",
    },
];
