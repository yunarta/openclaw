import type {
  SeedFile,
  SeedModule,
  SeedSymbol,
  SeedDataType,
  SeedEvidence,
  SeedFinding,
  SeedOpenQuestion,
} from "../seed-types.js";

/**
 * Resolves the 'tool execution sandboxing' open question. src/agents/sandbox/
 * is a large (~50-file), production-grade subsystem: a pluggable backend
 * registry (Docker container isolation or SSH remote execution), a
 * filesystem bridge with path-safety, and a per-tool allow/deny policy
 * layered on top. Read the barrel (sandbox.ts), tool-policy.ts (in full),
 * and config/types.sandbox.ts (in full) this pass; the backend
 * implementations (docker-backend.ts, ssh-backend.ts) were only confirmed
 * to exist and skimmed via their exports, not read line-by-line.
 */
export const sandboxFiles: SeedFile[] = [
  {
    path: "src/agents/sandbox.ts",
    category: "security",
    importance: "critical",
    purpose:
      "Read in full (81 lines). Public sandbox barrel: re-exports config/backend/Docker/SSH/filesystem/tool-policy contracts so callers use one surface. Confirms a pluggable backend architecture (registerSandboxBackend/getSandboxBackendFactory) with Docker and SSH as the two backends, plus isToolAllowed as the tool-policy check.",
  },
  {
    path: "src/agents/sandbox/tool-policy.ts",
    category: "security",
    importance: "critical",
    purpose:
      "Read in full (275 lines). isToolAllowed/classifyToolAgainstSandboxToolPolicy/resolveSandboxToolPolicyForAgent: merges global, per-agent, and default allow/deny/alsoAllow glob-pattern lists (with source diagnostics: which scope a given rule came from) into a normalized SandboxToolPolicy, then classifies a tool name against it.",
  },
  {
    path: "src/agents/sandbox/config.ts",
    category: "security",
    importance: "high",
    purpose:
      "Read lines 1-25 this pass. Sandbox configuration resolver: merges global and agent settings into normalized Docker, SSH, browser, prune, scope, and tool-policy config. Exports resolveSandboxConfigForAgent/resolveSandboxScope (confirmed via barrel re-export).",
  },
  {
    path: "src/agents/sandbox/backend.ts",
    category: "security",
    importance: "critical",
    purpose:
      "Confirmed exports (grep): registerSandboxBackend, getSandboxBackendFactory, getSandboxBackendManager, getSandboxBackendWorkdirResolver, requireSandboxBackendFactory -- the pluggable backend registry every concrete backend (Docker, SSH) installs itself into. Not read line-by-line.",
  },
  {
    path: "src/agents/sandbox/docker-backend.ts",
    category: "security",
    importance: "critical",
    purpose:
      "Confirmed to exist (docker-backend.ts + docker-backend.test.ts); the Docker container-isolation sandbox backend implementation. Not read line-by-line this pass.",
  },
  {
    path: "src/agents/sandbox/ssh-backend.ts",
    category: "security",
    importance: "high",
    purpose:
      "Confirmed to exist (ssh-backend.ts + ssh-backend.test.ts); the SSH remote-execution sandbox backend implementation (runs sandboxed work on a separate host over SSH instead of a local container). Not read line-by-line this pass.",
  },
  {
    path: "src/agents/sandbox/fs-bridge.ts",
    category: "security",
    importance: "high",
    purpose:
      "Confirmed to exist alongside fs-bridge-path-safety.ts, fs-bridge.boundary.test.ts, fs-bridge.anchored-ops.test.ts, remote-fs-bridge.ts. Bridges filesystem operations between host and sandbox with path-safety/boundary enforcement. Not read line-by-line this pass.",
  },
  {
    path: "src/agents/sandbox/validate-sandbox-security.ts",
    category: "security",
    importance: "high",
    purpose:
      "Confirmed to exist (plus validate-sandbox-security.test.ts); a dedicated security-validation pass for sandbox configuration, distinct from the audit-*.ts files under src/security/ (which are OpenClaw's own configuration-hygiene auditor, not the sandbox mechanism itself). Not read line-by-line this pass.",
  },
  {
    path: "src/agents/sandbox/registry.ts",
    category: "security",
    importance: "medium",
    purpose:
      "Confirmed exports (grep): readRegistry/updateRegistry/readRegistryEntry and legacy-registry migration/inspection functions -- persists which sandbox backend/container is associated with which scope, plus a migration path for an older registry file format. Not read line-by-line this pass.",
  },
  {
    path: "src/agents/sandbox/workspace-mounts.ts",
    category: "security",
    importance: "medium",
    purpose:
      "Confirmed to exist (plus workspace-mounts.test.ts); resolves which host directories are bind-mounted into a sandbox container/session. Not read line-by-line this pass.",
  },
  {
    path: "src/agents/sandbox/sanitize-env-vars.ts",
    category: "security",
    importance: "medium",
    purpose:
      "Confirmed to exist (plus sanitize-env-vars.test.ts); strips/filters environment variables before they reach a sandboxed exec, presumably to avoid leaking host secrets into the sandbox. Not read line-by-line this pass.",
  },
  {
    path: "src/config/types.sandbox.ts",
    category: "configuration",
    importance: "critical",
    purpose:
      "Read in full (128 lines). Defines SandboxDockerSettings (image, workdir, readOnlyRoot, tmpfs, network, user, capDrop, resource limits [pidsLimit/memory/memorySwap/cpus/gpus/ulimits], seccompProfile, apparmorProfile, dns, extraHosts, binds, plus explicit dangerouslyAllow* escape hatches that default to blocking reserved-path mounts, external bind sources, and container-namespace joins), SandboxBrowserSettings, SandboxPruneSettings, and SandboxSshSettings (target, strictHostKeyChecking default true, SecretRef-backed identity/certificate/known_hosts data).",
  },
  {
    path: "src/security",
    category: "security",
    importance: "medium",
    purpose:
      "Top-level directory, confirmed via listing. Mostly audit-*.ts files: OpenClaw's own configuration-hygiene / security-posture auditor (e.g. audit-exec-sandbox-host.ts, audit-exec-safe-bins.ts, audit-gateway-exposure.ts) -- a scanner that reports risky configuration, NOT the sandbox execution mechanism itself (that lives in src/agents/sandbox/). Distinguishing these two was the resolution to the 'is tool execution sandboxed' open question.",
  },
];

export const sandboxModules: SeedModule[] = [
  {
    name: "tool-sandbox-runtime",
    rootPath: "src/agents/sandbox",
    category: "security",
    status: "confirmed",
    purpose:
      "Production-grade, pluggable tool-execution sandbox: isolates shell/exec-family tool calls in a Docker container or on a remote SSH host, layered under a per-tool allow/deny policy.",
    responsibilities:
      "Backend registry (Docker, SSH) and selection; Docker container hardening (readOnlyRoot, capDrop, seccomp/apparmor, resource limits, network mode, bind-mount safety with 'dangerouslyAllow*' opt-outs); SSH remote execution with host-key verification and SecretRef-backed credentials; filesystem bridging with path-safety between host and sandbox; per-tool allow/deny/alsoAllow policy merged across default/global/agent scope with glob-pattern matching; environment-variable sanitization before exec; workspace bind-mount resolution; a sandbox registry persisting backend/container associations per scope.",
    nonResponsibilities:
      "Does not decide tool APPROVAL (a human-in-the-loop gate) -- that is src/agents/agent-tools.before-tool-call.approval.ts, a separate, complementary layer. Does not audit configuration hygiene -- that is src/security/'s audit-*.ts scanners.",
    publicSurface:
      "src/agents/sandbox.ts (barrel): resolveSandboxConfigForAgent, registerSandboxBackend/getSandboxBackendFactory, isToolAllowed, ensureSandboxWorkspaceForSession, resolveSandboxContext.",
    runtimeBehavior:
      "resolveSandboxConfigForAgent merges global+agent Docker/SSH/browser/prune/tool-policy settings; a tool call is checked against isToolAllowed(policy, name) before/around dispatch; if sandboxed, execution is routed through the registered backend factory (Docker exec into a managed container, or an SSH command to a remote host) rather than running in-process on the host.",
    extractionRelevance:
      "high -- directly answers the task's sandboxing requirement and is a strong, concrete design (registry + policy + hardened Docker defaults) a standalone gateway's Tool Runtime could largely reuse.",
    extractionDifficulty: "medium",
    files: [
      { fileKey: "src/agents/sandbox.ts", role: "entry-point" },
      { fileKey: "src/agents/sandbox/tool-policy.ts", role: "policy" },
      { fileKey: "src/agents/sandbox/config.ts", role: "implementation" },
      { fileKey: "src/agents/sandbox/backend.ts", role: "registry" },
      { fileKey: "src/agents/sandbox/docker-backend.ts", role: "adapter" },
      { fileKey: "src/agents/sandbox/ssh-backend.ts", role: "adapter" },
      { fileKey: "src/agents/sandbox/fs-bridge.ts", role: "implementation" },
      { fileKey: "src/agents/sandbox/validate-sandbox-security.ts", role: "policy" },
      { fileKey: "src/agents/sandbox/registry.ts", role: "persistence" },
      { fileKey: "src/agents/sandbox/workspace-mounts.ts", role: "implementation" },
      { fileKey: "src/agents/sandbox/sanitize-env-vars.ts", role: "policy" },
      { fileKey: "src/config/types.sandbox.ts", role: "interface" },
    ],
  },
];

export const sandboxSymbols: SeedSymbol[] = [
  {
    key: "sym:isToolAllowed",
    fileKey: "src/agents/sandbox/tool-policy.ts",
    name: "isToolAllowed",
    kind: "function",
    startLine: 218,
    endLine: 221,
    signature: "function isToolAllowed(policy: SandboxToolPolicy, name: string): boolean",
    purpose:
      "The tool-sandbox-policy gate: true unless the tool name is blocked by a deny-glob match or (when an allowlist is set) fails to match any allow-glob.",
    architecturalRole: "policy",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:resolveSandboxToolPolicyForAgent",
    fileKey: "src/agents/sandbox/tool-policy.ts",
    name: "resolveSandboxToolPolicyForAgent",
    kind: "function",
    startLine: 223,
    endLine: 274,
    signature:
      "function resolveSandboxToolPolicyForAgent(cfg?: OpenClawConfig, agentId?: string): SandboxToolPolicyResolved",
    purpose:
      "Merges default, global (tools.sandbox.tools.{allow,deny,alsoAllow}), and per-agent (agents.entries.*.tools.sandbox.tools.*) settings into one normalized allow/deny policy plus source diagnostics (which scope each rule came from). Per-agent settings take precedence over global, which takes precedence over the built-in DEFAULT_TOOL_ALLOW/DEFAULT_TOOL_DENY lists.",
    architecturalRole: "policy",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "medium",
  },
  {
    key: "sym:registerSandboxBackend",
    fileKey: "src/agents/sandbox/backend.ts",
    name: "registerSandboxBackend",
    kind: "function",
    startLine: 56,
    purpose:
      "Registers a concrete sandbox backend implementation (Docker or SSH) into the process-global backend registry, looked up later by id via getSandboxBackendFactory.",
    architecturalRole: "registry",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
];

export const sandboxDataTypes: SeedDataType[] = [
  {
    key: "dt:SandboxDockerSettings",
    name: "SandboxDockerSettings",
    category: "configuration",
    status: "confirmed",
    persistenceScope: "configuration",
    providerSpecific: false,
    purpose:
      "src/config/types.sandbox.ts:4-65. Full Docker sandbox hardening surface: image, workdir, readOnlyRoot + tmpfs, network mode, user (uid:gid), capDrop, resource limits (pidsLimit/memory/memorySwap/cpus/gpus/ulimits), seccompProfile, apparmorProfile, dns, extraHosts, binds, and three explicit 'dangerouslyAllow*' opt-outs that default to the safe/blocking behavior.",
    fields: [
      { name: "image", typeText: "string | undefined", required: false, persisted: true },
      {
        name: "readOnlyRoot",
        typeText: "boolean | undefined",
        required: false,
        persisted: true,
        description: "Run container rootfs read-only.",
      },
      {
        name: "network",
        typeText: "string | undefined",
        required: false,
        persisted: true,
        description: "Container network mode (bridge|none|custom).",
      },
      {
        name: "capDrop",
        typeText: "string[] | undefined",
        required: false,
        persisted: true,
        description: "Drop Linux capabilities.",
      },
      { name: "pidsLimit", typeText: "number | undefined", required: false, persisted: true },
      { name: "memory", typeText: "string | number | undefined", required: false, persisted: true },
      { name: "cpus", typeText: "number | undefined", required: false, persisted: true },
      { name: "seccompProfile", typeText: "string | undefined", required: false, persisted: true },
      { name: "apparmorProfile", typeText: "string | undefined", required: false, persisted: true },
      {
        name: "binds",
        typeText: "string[] | undefined",
        required: false,
        persisted: true,
        description: "host:container:mode bind mounts.",
      },
      {
        name: "dangerouslyAllowReservedContainerTargets",
        typeText: "boolean | undefined",
        required: false,
        persisted: true,
        description:
          "Default-blocked: allow bind mounts targeting reserved paths like /workspace or /agent.",
      },
      {
        name: "dangerouslyAllowExternalBindSources",
        typeText: "boolean | undefined",
        required: false,
        persisted: true,
        description:
          "Default-blocked: allow bind mount sources outside the runtime-allowlisted workspace roots.",
      },
      {
        name: "dangerouslyAllowContainerNamespaceJoin",
        typeText: "boolean | undefined",
        required: false,
        persisted: true,
        description:
          'Default-blocked: allow Docker network: "container:<id>" namespace joins, which would otherwise break sandbox isolation.',
      },
    ],
  },
  {
    key: "dt:SandboxSshSettings",
    name: "SandboxSshSettings",
    category: "configuration",
    status: "confirmed",
    persistenceScope: "configuration",
    providerSpecific: false,
    purpose:
      "src/config/types.sandbox.ts:105-128. Remote-host sandbox execution over SSH, as an alternative backend to Docker.",
    fields: [
      {
        name: "target",
        typeText: "string | undefined",
        required: false,
        persisted: true,
        description: "user@host[:port].",
      },
      {
        name: "strictHostKeyChecking",
        typeText: "boolean | undefined",
        required: false,
        persisted: true,
        description: "Default: true.",
      },
      {
        name: "identityData",
        typeText: "SecretInput | undefined",
        required: false,
        persisted: true,
        sensitive: true,
        description: "Inline or SecretRef-backed private key contents.",
      },
      {
        name: "certificateData",
        typeText: "SecretInput | undefined",
        required: false,
        persisted: true,
        sensitive: true,
      },
      {
        name: "knownHostsData",
        typeText: "SecretInput | undefined",
        required: false,
        persisted: true,
        sensitive: true,
      },
    ],
  },
  {
    key: "dt:SandboxToolPolicy",
    name: "SandboxToolPolicy",
    category: "configuration",
    status: "confirmed",
    persistenceScope: "configuration",
    providerSpecific: false,
    purpose:
      "src/agents/sandbox/tool-policy.ts. Normalized { allow: string[]; deny: string[] } glob-pattern lists (tool-group names are expanded via expandToolGroups before matching) plus per-field source diagnostics (SandboxToolPolicySource: which of default/global/agent scope produced the effective value).",
    fields: [
      {
        name: "allow",
        typeText: "string[]",
        required: true,
        persisted: true,
        description:
          "Glob patterns; empty array means allow-all (explicit repo convention, confirmed in mergeAllowlist's comment).",
      },
      { name: "deny", typeText: "string[]", required: true, persisted: true },
    ],
  },
];

export const sandboxEvidence: SeedEvidence[] = [
  {
    key: "ev:sandbox-barrel",
    fileKey: "src/agents/sandbox.ts",
    startLine: 1,
    endLine: 81,
    claim:
      "src/agents/sandbox.ts is a public barrel confirming a pluggable sandbox-backend architecture (registerSandboxBackend/getSandboxBackendFactory) with config, Docker, SSH, filesystem-bridge, and tool-policy contracts unified behind one export surface.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:sandbox-tool-policy-full",
    fileKey: "src/agents/sandbox/tool-policy.ts",
    symbolKey: "sym:isToolAllowed",
    startLine: 1,
    endLine: 275,
    claim:
      "Sandbox tool access is governed by a merged allow/deny glob-pattern policy resolved from default, global (tools.sandbox.tools.*), and per-agent (agents.entries.*.tools.sandbox.tools.*) config, with per-field source diagnostics.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:sandbox-docker-settings-full",
    fileKey: "src/config/types.sandbox.ts",
    startLine: 4,
    endLine: 65,
    claim:
      "The Docker sandbox backend supports read-only rootfs, Linux capability dropping, seccomp/AppArmor profiles, resource limits (pids/memory/cpu/gpu/ulimits), network isolation, and DNS/host overrides, with dangerous bind-mount and namespace-join behaviors defaulting to blocked (require an explicit 'dangerouslyAllow*' opt-in to enable).",
    evidenceType: "type-definition",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
];

export const sandboxFindings: SeedFinding[] = [
  {
    category: "security-sensitive",
    title:
      "Tool execution has two distinct, complementary security layers: approval and sandboxing",
    description:
      "src/agents/agent-tools.before-tool-call.approval.ts decides whether a human must approve a tool call before it runs (a human-in-the-loop gate). src/agents/sandbox/ decides, independently, what environment a tool call runs IN if it is allowed to run at all -- in-process on the host, in an isolated Docker container, or on a remote SSH host -- further filtered by a per-tool allow/deny policy (isToolAllowed). These are separate axes: a tool can be sandboxed but not require approval, require approval but not be sandboxed, both, or neither.",
    significance:
      "A standalone gateway's Tool Runtime needs both axes modeled independently, not collapsed into one 'is this tool safe' flag.",
    recommendation:
      "In EXTRACTION-GUIDE.md's ToolRuntime interface, keep approval policy and sandbox policy as separate, independently configurable concerns, mirroring src/agents/sandbox/tool-policy.ts's allow/deny shape for the sandbox axis.",
    status: "confirmed",
  },
];

export const sandboxOpenQuestions: SeedOpenQuestion[] = [];
