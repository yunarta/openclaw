import type {
  SeedSymbol,
  SeedCapability,
  SeedFlow,
  SeedFlowStep,
  SeedEvidence,
  SeedOpenQuestion,
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
];

export const oauthOpenQuestions: SeedOpenQuestion[] = [
  {
    category: "authentication",
    question:
      "What is the exact SecretRef resolution mechanism (type definition and resolver function) described in root AGENTS.md, and where does it live?",
    evidenceInspected:
      "Searched for 'SecretRef' conceptually via root AGENTS.md description only; did not grep/read src/secrets/*.ts or src/plugin-sdk/*.ts for the actual type this pass.",
    reasonUnresolved:
      "Time/resource-constrained research pass prioritized the agent loop, provider architecture, and persistence schema over this specific mechanism.",
    likelyInterpretation:
      "Likely a discriminated-union type in src/secrets/ or src/plugin-sdk/ with a resolver that turns a {provider, kind, ref} tuple into a live credential value, given the 'fail-closed on unknown ownership' semantics described in root AGENTS.md.",
    verificationMethod:
      "grep -rn 'SecretRef' src/secrets src/plugin-sdk, then read the resolver function and its call sites.",
    priority: "high",
    status: "open",
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
