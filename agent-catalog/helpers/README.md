# Agent Catalog Helper Library

`agent-catalog.ts` exposes a small, typed `AgentCatalog` interface over
`../catalog.sqlite`, so future agents and scripts can query the catalog
without hand-writing SQL or depending on the CLI's process boundary.

Every query is parameterized (`db.prepare(sql).all(...)`); nothing here
builds SQL by concatenating caller input.

## Usage

Requires Node.js `>=22.5.0` (for built-in `node:sqlite`) and a TypeScript
runtime. From the repo root:

```ts
import { openAgentCatalog } from "./agent-catalog/helpers/agent-catalog.js";

const catalog = openAgentCatalog(); // defaults to ../catalog.sqlite
try {
  const hits = await catalog.search("tool approval");
  const loop = await catalog.getCapability("agent loop");
  const flow = await catalog.getFlow("tool call");
  const symbols = await catalog.getSymbol("runEmbeddedAgent");
  const related = await catalog.getRelatedSymbols("runPreparedEmbeddedLoop");
  const snippets = await catalog.getSnippetsForSymbol("runEmbeddedAgentViaCliBackendIfEligible");
  const candidates = await catalog.getExtractionCandidates();
} finally {
  catalog.close();
}
```

Run it with `tsx`/`ts-node`, or compile it with the same `tsconfig.json`
conventions as `../cli/tsconfig.json` (target `ES2022`, module/moduleResolution
`NodeNext`, `strict: true`).

## API

See `agent-catalog.ts` for the full `AgentCatalog` interface:

- `search(query, options?)` — full-text search across the whole catalog (FTS5, `catalog_search`).
- `getSymbol(name)` — exact/partial symbol lookup, joined with its file.
- `getCapability(name)` — a capability plus its ordered/roled symbol list (`capability_map` view).
- `getFlow(name)` — a flow plus its ordered steps (`flow_map` view).
- `getRelatedSymbols(symbol)` — outgoing/incoming `relationships` rows for a symbol, with names resolved.
- `getSnippetsForSymbol(symbol)` — code snippets attached to a symbol.
- `getExtractionCandidates()` — reusable, low/medium-coupling symbols (`extraction_candidates` view).
- `close()` — closes the underlying SQLite connection.

## Regenerating the database

The helper only reads `catalog.sqlite`. To rebuild it from schema + seed
data:

```bash
cd agent-catalog/cli
npm install
npm run build
npm run build-db
```
