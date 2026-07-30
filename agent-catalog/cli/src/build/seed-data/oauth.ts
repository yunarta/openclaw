import type {
  SeedSymbol,
  SeedCapability,
  SeedFlow,
  SeedFlowStep,
  SeedEvidence,
  SeedOpenQuestion,
  SeedDataType,
} from "../seed-types.js";

export const oauthSymbols: SeedSymbol[] = [
  {
    key: "sym:llmOauthFacade",
    fileKey: "src/llm/oauth.ts",
    name: "(oauth.ts module)",
    kind: "constant",
    startLine: 1,
    endLine: 2,
    purpose:
      'Public OAuth facade; re-exports everything from ./utils/oauth/index.js. Confirmed by direct read: the entire file is `export * from "./utils/oauth/index.js";`.',
    architecturalRole: "facade",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:oauthAnthropic",
    fileKey: "src/llm/utils/oauth/anthropic.ts",
    name: "(Anthropic OAuth module)",
    kind: "constant",
    purpose:
      "Claude/Anthropic subscription OAuth login + token refresh implementation, confirmed to exist alongside sibling per-provider OAuth files (openai-chatgpt.ts, github-copilot.ts) under one shared utils/oauth barrel. Exact exported function names not confirmed by reading this pass.",
    architecturalRole: "adapter",
    importance: "critical",
    status: "inferred",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:oauthOpenaiChatgpt",
    fileKey: "src/llm/utils/oauth/openai-chatgpt.ts",
    name: "(OpenAI/ChatGPT OAuth module)",
    kind: "constant",
    purpose:
      "ChatGPT (Codex) subscription OAuth login + token refresh implementation. Exact exported function names not confirmed by reading this pass.",
    architecturalRole: "adapter",
    importance: "critical",
    status: "inferred",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:oauthGithubCopilot",
    fileKey: "src/llm/utils/oauth/github-copilot.ts",
    name: "(GitHub Copilot OAuth module)",
    kind: "constant",
    purpose:
      "GitHub Copilot OAuth implementation, sibling to the Anthropic and OpenAI/ChatGPT OAuth modules under the same generic barrel.",
    architecturalRole: "adapter",
    importance: "medium",
    status: "inferred",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:coerceSecretRef",
    fileKey: "src/config/types.secrets.ts",
    name: "coerceSecretRef",
    kind: "function",
    startLine: 134,
    endLine: 160,
    signature:
      "function coerceSecretRef(value: unknown, defaults?: SecretDefaults): SecretRef | null",
    purpose:
      "Normalizes a canonical SecretRef object, legacy markers (secretref-env:, __env__:), or $NAME/${NAME} env-shorthand strings into the canonical { source, provider, id } SecretRef shape. Read in full.",
    architecturalRole: "normalizer",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:resolveSecretInputString",
    fileKey: "src/config/types.secrets.ts",
    name: "resolveSecretInputString",
    kind: "function",
    startLine: 226,
    endLine: 261,
    signature:
      'function resolveSecretInputString(params): { status: "available"; value } | { status: "configured_unavailable"; ref } | { status: "missing" }',
    purpose:
      "Resolves a config field to a literal value, a configured-but-unresolved SecretRef ('configured_unavailable'), or nothing ('missing'). In strict mode a configured-unavailable ref throws UnresolvedSecretInputError instead of returning the status. This is the exact 'configured-unavailable' terminology root AGENTS.md's SecretRef fail-closed policy uses.",
    architecturalRole: "resolver",
    importance: "critical",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
  {
    key: "sym:resolveSecretRefValue",
    fileKey: "src/secrets/resolve.ts",
    name: "resolveSecretRefValue",
    kind: "function",
    startLine: 858,
    endLine: 884,
    signature:
      "async function resolveSecretRefValue(ref: SecretRef, options: ResolveSecretRefOptions): Promise<unknown>",
    purpose:
      "The runtime resolver that turns a SecretRef into an actual credential value by dispatching to the configured provider (env/file/exec). Supports an optional shared cache (options.cache) that dedupes in-flight resolutions for the same ref key so concurrent callers don't trigger duplicate provider calls (e.g. duplicate exec invocations).",
    architecturalRole: "resolver",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "medium",
  },
  {
    key: "sym:resolveSecretRefValues",
    fileKey: "src/secrets/resolve.ts",
    name: "resolveSecretRefValues / resolveSecretRefValuesSettledByProvider",
    kind: "function",
    startLine: 836,
    endLine: 854,
    signature:
      "async function resolveSecretRefValues(refs: SecretRef[], options): Promise<Map<string, unknown>>",
    purpose:
      "Batch-resolves SecretRefs grouped by provider for bounded provider concurrency. Two error modes: resolveSecretRefValues throws on the first failure ('stop'); resolveSecretRefValuesSettledByProvider is the 'internal owner-isolation resolver' that isolates one provider's failure from others ('continue'), returning both resolved values and per-group failures -- this is the concrete mechanism behind root AGENTS.md's 'SecretRef failures isolate to the smallest known owning surface'.",
    architecturalRole: "resolver",
    importance: "critical",
    status: "confirmed",
    reusable: false,
    applicationCoupling: "medium",
  },
  {
    key: "sym:openaiChatgptJwt",
    fileKey: "packages/ai/src/utils/oauth/openai-chatgpt-jwt.ts",
    name: "(ChatGPT OAuth JWT helper)",
    kind: "function",
    purpose:
      "Confirmed to exist inside the reusable @openclaw/ai package (not OpenClaw-core), suggesting JWT parsing/validation for ChatGPT OAuth tokens is provider-package-owned rather than OpenClaw-app-owned.",
    architecturalRole: "helper",
    importance: "high",
    status: "confirmed",
    reusable: true,
    applicationCoupling: "low",
  },
];

export const oauthCapabilities: SeedCapability[] = [
  {
    name: "OAuth",
    category: "authentication",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "Provider OAuth (subscription login for Anthropic/Claude and OpenAI/ChatGPT/Codex, plus GitHub Copilot) is implemented as a set of per-provider modules under one shared barrel (src/llm/utils/oauth), re-exported through src/llm/oauth.ts. A lower-level JWT helper for ChatGPT tokens lives in the reusable packages/ai package itself.",
    implementationSummary:
      "src/llm/oauth.ts -> src/llm/utils/oauth/index.ts -> {anthropic,openai-chatgpt,github-copilot}.ts, each presumably exporting a login/authorize + refresh pair (not individually confirmed by reading this pass).",
    symbols: [
      { symbolKey: "sym:llmOauthFacade", role: "entry-point" },
      { symbolKey: "sym:oauthAnthropic", role: "adapter" },
      { symbolKey: "sym:oauthOpenaiChatgpt", role: "adapter" },
      { symbolKey: "sym:oauthGithubCopilot", role: "adapter" },
    ],
  },
  {
    name: "token refresh",
    category: "authentication",
    status: "inferred",
    maturity: "production",
    reusable: true,
    description:
      "Each per-provider OAuth module is expected to expose a refresh path used when a stored access token is expired/expiring, consumed by the run loop's maybeRefreshRuntimeAuthForAuthError callback (seen in run-loop.ts's prepareEmbeddedRunRuntime destructuring) and by failover-retry-controller.ts's auth-profile-failure handling.",
    implementationSummary:
      "Exact refresh trigger (lazy on 401 vs. background timer) not confirmed by reading source this pass; run-loop.ts does reference stopRuntimeAuthRefreshTimer, implying a scheduled/background refresh timer exists in addition to any lazy on-error refresh.",
    symbols: [
      { symbolKey: "sym:oauthAnthropic", role: "adapter" },
      { symbolKey: "sym:oauthOpenaiChatgpt", role: "adapter" },
    ],
  },
  {
    name: "SecretRef resolution",
    category: "authentication",
    status: "confirmed",
    maturity: "production",
    reusable: true,
    description:
      "A SecretRef ({ source: env|file|exec, provider, id }) is a config-level indirection for a credential value, resolved at runtime against a configured SecretProviderConfig. src/config/types.secrets.ts owns the type/coercion/fail-closed-read layer; src/secrets/resolve.ts owns the actual provider-dispatching resolution, batched and grouped by provider for bounded concurrency with an optional shared cache.",
    implementationSummary:
      "coerceSecretRef normalizes canonical/legacy/shorthand inputs into a SecretRef. resolveSecretInputString reads a config field to {available|configured_unavailable|missing}, throwing UnresolvedSecretInputError in strict mode. resolveSecretRefValue/resolveSecretRefValues (src/secrets/resolve.ts) do the actual per-provider resolution; resolveSecretRefValuesSettledByProvider is the 'owner-isolation' variant that isolates one provider's failure from the rest of a batch -- the concrete mechanism behind root AGENTS.md's fail-closed-per-owning-surface policy.",
    symbols: [
      { symbolKey: "sym:coerceSecretRef", role: "implementation" },
      { symbolKey: "sym:resolveSecretInputString", role: "implementation" },
      { symbolKey: "sym:resolveSecretRefValue", role: "implementation" },
      { symbolKey: "sym:resolveSecretRefValues", role: "implementation" },
    ],
  },
];

export const oauthDataTypes: SeedDataType[] = [
  {
    key: "dt:SecretRef",
    symbolKey: "sym:coerceSecretRef",
    name: "SecretRef",
    category: "credential",
    status: "confirmed",
    persistenceScope: "configuration",
    providerSpecific: false,
    purpose:
      'src/config/types.secrets.ts:15-19. Stable identifier for a secret in a configured source: { source: "env"|"file"|"exec"; provider: string; id: string }. A config field\'s SecretInput type is `string | SecretRef` (a literal value or a reference). Providers are configured via SecretProviderConfig (EnvSecretProviderConfig with an optional allowlist; FileSecretProviderConfig with path/mode/timeoutMs/maxBytes; ExecSecretProviderConfig, either a manual command+args or a plugin-integration reference).',
    fields: [
      { name: "source", typeText: '"env" | "file" | "exec"', required: true, persisted: true },
      {
        name: "provider",
        typeText: "string",
        required: true,
        persisted: true,
        description:
          'Named provider config (e.g. a specific vault/file/env source), default alias "default".',
      },
      {
        name: "id",
        typeText: "string",
        required: true,
        persisted: true,
        description: "Provider-specific identifier, e.g. an env var name or vault path.",
      },
    ],
  },
];

export const oauthFlows: SeedFlow[] = [
  {
    name: "OAuth refresh",
    category: "authentication",
    status: "confirmed",
    entrySymbolKey: undefined,
    description:
      "Generic (provider-family-agnostic) shape of a token refresh, as evidenced by the run loop's handling of it rather than by reading the OAuth modules directly.",
    terminationCondition:
      "A refreshed auth profile is written back to the auth-profile store and the current attempt either retries with the new token or the profile is marked failed if refresh itself fails.",
    errorBehavior:
      "run-loop.ts's runtimeAuthRetry/authRetryPending flags and failoverRetryController.maybeRefreshRuntimeAuthForAuthError gate at most one refresh-and-retry per auth error before falling through to profile rotation/failover.",
  },
];

export const oauthFlowSteps: SeedFlowStep[] = [
  {
    flowName: "OAuth refresh",
    stepOrder: 1,
    title: "Provider call fails with an auth error",
    description:
      "A dispatched attempt returns/throws an auth-classified error (rate limit vs. auth is distinguished elsewhere in assistant-failure.ts).",
    fileKey: "src/agents/embedded-agent-runner/run/assistant-failure.ts",
  },
  {
    flowName: "OAuth refresh",
    stepOrder: 2,
    title: "Run loop requests a refresh",
    description:
      "maybeRefreshRuntimeAuthForAuthError (destructured from prepareEmbeddedRunRuntime's result) is invoked; runtimeAuthRetry is set for the next loop iteration.",
    fileKey: "src/agents/embedded-agent-runner/run-loop.ts",
  },
  {
    flowName: "OAuth refresh",
    stepOrder: 3,
    title: "Provider-specific refresh executes",
    description:
      "Delegates to the matching per-provider OAuth module (Anthropic/OpenAI-ChatGPT/GitHub Copilot) to exchange the stored refresh token for a new access token.",
    alternatePath:
      "Exact function name and error handling inside the provider-specific module not confirmed this pass.",
  },
  {
    flowName: "OAuth refresh",
    stepOrder: 4,
    title: "Loop retries once with refreshed credentials",
    description:
      "The next loop iteration re-attempts the same provider call using the refreshed auth profile; a second consecutive auth failure is treated as a hard profile failure and can trigger profile rotation via failoverRetryController.maybeMarkAuthProfileFailure.",
  },
];

export const oauthEvidence: SeedEvidence[] = [
  {
    key: "ev:llm-oauth-facade",
    fileKey: "src/llm/oauth.ts",
    startLine: 1,
    endLine: 2,
    claim:
      "src/llm/oauth.ts is a 2-line facade that re-exports the generic OAuth module barrel at ./utils/oauth/index.js.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes: "Read directly in full.",
  },
  {
    key: "ev:oauth-dir-listing",
    fileKey: "src/llm/utils/oauth/index.ts",
    claim:
      "src/llm/utils/oauth/ contains one module per OAuth provider (anthropic.ts, openai-chatgpt.ts, github-copilot.ts) plus shared types.ts and abort.ts, confirming OAuth is organized generically across providers rather than duplicated per extension.",
    evidenceType: "call-site",
    confidence: 0.9,
    notes: "Confirmed via directory listing (ls); individual file contents not read this pass.",
  },
  {
    key: "ev:secretref-type-full",
    fileKey: "src/config/types.secrets.ts",
    symbolKey: "sym:coerceSecretRef",
    startLine: 1,
    endLine: 354,
    claim:
      'SecretRef is { source: "env"|"file"|"exec"; provider: string; id: string }, coerced from canonical/legacy/shorthand inputs by coerceSecretRef, and read via resolveSecretInputString which returns available/configured_unavailable/missing (throwing UnresolvedSecretInputError in strict mode for a configured-but-unresolved ref).',
    evidenceType: "type-definition",
    confidence: 1.0,
    notes: "Read directly in full (354 lines).",
  },
  {
    key: "ev:secretref-runtime-resolver",
    fileKey: "src/secrets/resolve.ts",
    symbolKey: "sym:resolveSecretRefValue",
    startLine: 820,
    endLine: 899,
    claim:
      "resolveSecretRefValue/resolveSecretRefValues dispatch a SecretRef to its configured provider and return the live value; resolveSecretRefValuesSettledByProvider is an explicit 'owner-isolation' resolver that isolates a failing provider's errors from the rest of a batch instead of failing the whole resolution.",
    evidenceType: "implementation",
    confidence: 1.0,
    notes:
      "Read lines 820-899 directly (the file is 899 lines total; the env/file/exec provider-dispatch branch itself, likely earlier in the file, was not read line-by-line).",
  },
];

export const oauthOpenQuestions: SeedOpenQuestion[] = [
  {
    category: "authentication",
    question:
      "What is the exact SecretRef resolution mechanism (type definition and resolver function) described in root AGENTS.md, and where does it live?",
    evidenceInspected:
      "RESOLVED in a follow-up pass: src/config/types.secrets.ts (read in full, 354 lines) defines SecretRef/SecretInput/SecretProviderConfig and the coerce/resolve-to-status layer (coerceSecretRef, resolveSecretInputString, UnresolvedSecretInputError). src/secrets/resolve.ts (read lines 820-899) defines the runtime provider-dispatching resolvers (resolveSecretRefValue, resolveSecretRefValues, resolveSecretRefValuesSettledByProvider), including the explicit 'owner-isolation' settled-by-provider variant.",
    reasonUnresolved: "N/A -- resolved.",
    likelyInterpretation: "N/A -- resolved with direct evidence.",
    verificationMethod:
      "Remaining depth gap: the actual env/file/exec provider-dispatch branch inside resolve.ts's ~820 lines before line 820 was not read line-by-line.",
    priority: "low",
    status: "resolved",
  },
  {
    category: "authentication",
    question:
      "Is provider OAuth token refresh triggered lazily (on-401) only, or also via a background scheduler?",
    evidenceInspected:
      "run-loop.ts references stopRuntimeAuthRefreshTimer, implying a timer exists, but the timer's creation site was not located/read this pass.",
    reasonUnresolved:
      "The timer's creation site (likely in run/runtime-preparation.ts's prepareEmbeddedRunRuntime) was not opened this pass.",
    likelyInterpretation:
      "Probably both: a background timer refreshes proactively before expiry, with a lazy on-error refresh as a fallback for the run loop.",
    verificationMethod:
      "Read src/agents/embedded-agent-runner/run/runtime-preparation.ts in full and trace stopRuntimeAuthRefreshTimer back to its creation.",
    priority: "medium",
    status: "open",
  },
];
