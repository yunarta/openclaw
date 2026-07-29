# Architecture Summary

Generated from `catalog.sqlite`. Do not hand-edit; run `npm run generate-reports` after changing seed data.

## Catalog statistics

| Table | Rows |
| --- | --- |
| files | 229 |
| symbols | 53 |
| modules | 15 |
| capabilities | 30 |
| flows | 11 |
| flow_steps | 36 |
| snippets | 5 |
| evidence | 28 |
| findings | 8 |
| open_questions | 12 |

## The two-layer runtime shape

OpenClaw's agent runtime is two layers: a pluggable **AgentHarness** contract (`src/agents/harness/`) that any execution engine implements, and one built-in implementation of it -- the **embedded runner** (`src/agents/embedded-agent-runner/`) -- registered as the `"openclaw"` harness. Codex is a second, independent harness implementation that drives the actual `@openai/codex` CLI as a subprocess.

## The reusable core

`packages/ai` (published as `@openclaw/ai`) implements the actual provider wire protocols and stream normalization, with zero dependency on OpenClaw core. `src/llm/stream.ts` is a thin OpenClaw-specific facade over it.

## Module map

| Module | Extraction relevance | Extraction difficulty | Status |
| --- | --- | --- | --- |
| agent-runtime-core | high -- this is the closest thing to a standalone 'agent run service' loop in the repository, but it is heavily entangled with OpenClaw-specific concepts (lanes, hooks, session targets, workspace resolution). | high | confirmed |
| agent-harness-registry | high -- this is the cleanest seam for a standalone gateway's 'ProviderAdapter'/harness abstraction. | medium | confirmed |
| ai-provider-package | critical -- explicitly designed and described by its own authors as reusable; the single best extraction candidate for a standalone gateway's Provider Router + Codex/Claude adapters. | low | confirmed |
| llm-facade | medium -- useful as a template for how a standalone gateway would wire its own host policy into @openclaw/ai, but the module itself is OpenClaw-process-specific. | low | confirmed |
| provider-codex | medium -- the harness-registration pattern is reusable, but the plugin's internals are tightly bound to the OpenClaw plugin SDK and its own session-catalog conventions. | medium | confirmed |
| provider-anthropic | medium -- auth/catalog patterns are reusable; the CLI-backend and native session-catalog code is OpenClaw-specific. | medium | confirmed |
| tool-runtime | high -- the declarative ToolDescriptor/availability-expression contract is a clean, reusable design for a standalone gateway's Tool Runtime. | medium | confirmed |
| sub-agent-delegation | medium -- the parent/child event-stream persistence pattern is a reusable idea for a gateway's sub-agent/delegated-task feature; the ACP protocol coupling itself is OpenClaw-specific. | high | confirmed |
| skill-runtime | medium -- the SKILL.md-as-contract pattern is portable, but discovery/lifecycle is wired into OpenClaw's shared-state DB (skill_usage, skill_lifecycle tables). | medium | confirmed |
| memory-context-engine | medium -- the registry/pluggable-engine pattern is reusable; exact compaction algorithm not verified line-by-line this pass. | medium | confirmed |
| session-persistence | high -- the schema and lease pattern are a strong direct model for a standalone gateway's run/session/event persistence, modulo OpenClaw-specific tables (skills, boards, device pairing). | low | confirmed |
| long-running-jobs | medium -- a standalone gateway's Job Runtime would need an equivalent scheduler, but this module's exact durability guarantees were not verified. | medium | confirmed |
| auth-and-secrets | medium -- the OAuth helpers (src/llm/utils/oauth) are directly reusable; the SecretRef/credential-application layer is more OpenClaw-config-specific. | medium | confirmed |

See `SCHEMA.md` for the full table reference and the CLI (`node cli/dist/cli.js capability "<name>"`, `flow "<name>"`, `module "<name>"`) for query access to everything summarized here.
