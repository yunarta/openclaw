# Provider Comparison: Codex vs. Claude

## Codex provider

**Status:** confirmed  **Category:** provider  **Maturity:** production

Codex is integrated as a full AgentHarness backed by OpenAI's own @openai/codex npm package (pinned to 0.145.0), driven as a subprocess ('app server'), not as a hand-rolled request/response adapter.

> extensions/codex/index.ts registers createCodexAppServerAgentHarness() via api.registerAgentHarness(); session lifecycle/resume is tracked in extensions/codex/src/session-catalog*.ts; turn streaming is collected in conversation-turn-collector.ts.

## Claude provider

**Status:** confirmed  **Category:** provider  **Maturity:** production

Claude/Anthropic has two paths: (1) default -- the embedded runner calls the Anthropic Messages API directly via packages/ai's anthropic provider adapter, using credentials from extensions/anthropic; (2) opt-in -- an external `claude` CLI process via extensions/anthropic/cli-backend.ts, selected only for subscription-auth billing reasons.

> packages/ai/src/providers/anthropic.ts + packages/ai/src/transports/anthropic-transport-stream.ts implement the wire protocol; extensions/anthropic owns auth/catalog/CLI-backend/session-catalog. No @anthropic-ai/sdk runtime dependency anywhere in extensions/anthropic (confirmed via package.json).

## Stream normalization

**Status:** confirmed  **Category:** streaming  **Maturity:** production

Every provider's wire-format stream (Anthropic SSE, OpenAI Responses SSE, etc.) is parsed by a per-family transport module in packages/ai/src/transports/*.ts and normalized into one AssistantMessageEvent sequence (12 variants: start/text_*/thinking_*/toolcall_*/done/error, packages/llm-core/src/types.ts:397-418), delivered through an AssistantMessageEventStreamContract, exposed by src/llm/stream.ts's stream().

> createAssistantMessageEventStream (packages/ai/src/utils/event-stream.ts) is the shared push/end-able stream primitive every transport writes into. The event union itself is defined once in @openclaw/llm-core and re-exported by @openclaw/ai and src/llm -- there is exactly one event contract for the whole provider stack, not a per-provider one.

## Reasoning events

**Status:** confirmed  **Category:** provider  **Maturity:** production

The shared ThinkingContent type (packages/llm-core/src/types.ts:243-251) exposes real reasoning text by default (`thinking: string`), plus an opaque provider-specific replay token (`thinkingSignature`) and a `redacted` flag for safety-filtered content. Per-provider behavior still differs: Anthropic replays the thinking-block signature on continuation (anthropic-thinking-replay.ts); OpenAI/Codex family maps a configurable reasoning-effort level onto the Responses API's reasoning.effort parameter (openai-reasoning-effort.ts) and Codex's own app-server manages its reasoning continuation state internally, outside OpenClaw's direct visibility once delegated to the harness. Google's ToolCall.thoughtSignature is a separate, tool-call-scoped opaque thought-context token.

> ThinkingContent is the type-level source of truth for 'is reasoning hidden/summarized/exposed': exposed as text, with an orthogonal opaque-signature mechanism only for continuation. See findings 'reasoning continuation state' and 'reasoning configuration' for remaining per-provider confidence gaps.

### Flow: Codex request

**Status:** confirmed  **Category:** provider

1. **Run loop resolves the Codex harness** (`createCodexAppServerAgentHarness`) `extensions/codex/index.ts`
   prepareEmbeddedRunRuntime resolves agentHarness to the registered Codex app-server harness for the selected provider/model.
2. **Harness dispatches to the app-server subprocess** `extensions/codex/src/conversation-binding.ts`
   The harness attempt contract drives the codex CLI's app-server process/session for this conversation.
3. **Turn events collected** `extensions/codex/src/conversation-turn-collector.ts`
   conversation-turn-collector.ts accumulates the app-server's streamed turn events (including any native-thread tool activity) into an OpenClaw-consumable attempt result.

### Flow: Claude request

**Status:** confirmed  **Category:** provider

1. **Caller invokes stream()** (`stream`) `src/llm/stream.ts:79-87`
   The embedded run loop (via the 'openclaw' harness -> runEmbeddedAttempt) calls src/llm/stream.ts's stream(model, context, options) for an Anthropic-family model.
2. **Ensure transport host installed** (`ensureTransportRuntimeHost`) `src/llm/stream.ts:24-31`
   Lazily configures OpenClaw's proxy/TLS/network host policy into @openclaw/ai on first use.
3. **Resolve runtime and dispatch** `src/llm/stream.ts`
   resolveRuntime(model) picks defaultLlmRuntime (or a model-specific runtime), whose .stream() looks up the anthropic-messages adapter via defaultApiRegistry.
4. **Build request and auth headers** `packages/ai/src/providers/anthropic.ts`
   packages/ai/src/providers/anthropic.ts constructs the Messages API request body; packages/ai/src/providers/anthropic-auth-headers.ts attaches either an API key or an OAuth bearer token.
5. **Read and parse the SSE stream** (`(Anthropic transport stream reader)`) `packages/ai/src/transports/anthropic-transport-stream.ts`
   The transport module reads the response body as SSE and parses message_start/content_block_*/message_delta/message_stop events.
6. **Push normalized events** (`createAssistantMessageEventStream`) `packages/ai/src/utils/event-stream.ts`
   Each parsed Anthropic event is translated into the shared internal event shape and pushed onto the AssistantMessageEventStreamContract the caller is iterating.

## Key asymmetry

Codex is integrated as a full **AgentHarness** (drives the `@openai/codex` CLI's app-server as a subprocess). Claude/Anthropic is integrated primarily as a **provider adapter** (the embedded runner calls the Anthropic Messages API directly through `packages/ai`), with an *opt-in* CLI-backend fork (`cliBackendDispatch: "subscription-auth"`) used only to keep usage on subscription plan limits rather than metered billing. These are not equivalent lifecycle models -- see `OPEN-QUESTIONS.md` for what remains unverified about each.

## Open questions

- [high] What is the exact SecretRef resolution mechanism (type definition and resolver function) described in root AGENTS.md, and where does it live?
  Likely: Likely a discriminated-union type in src/secrets/ or src/plugin-sdk/ with a resolver that turns a {provider, kind, ref} tuple into a live credential value, given the 'fail-closed on unknown ownership' semantics described in root AGENTS.md.
- [medium] Is provider OAuth token refresh triggered lazily (on-401) only, or also via a background scheduler?
  Likely: Probably both: a background timer refreshes proactively before expiry, with a lazy on-error refresh as a fallback for the run loop.

