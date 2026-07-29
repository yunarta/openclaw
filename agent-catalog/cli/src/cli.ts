#!/usr/bin/env node
import { runCapability } from "./commands/capability.js";
import { runFlow } from "./commands/flow.js";
import { runModule } from "./commands/module.js";
import { runRelated } from "./commands/related.js";
import { runSearch } from "./commands/search.js";
import { runSnippet } from "./commands/snippet.js";
import { runStats } from "./commands/stats.js";
import { runSymbol } from "./commands/symbol.js";
import type { CommandFlags, CommandHandler } from "./commands/types.js";
import { openCatalog } from "./db.js";

const HANDLERS: Record<string, CommandHandler> = {
  search: runSearch,
  symbol: runSymbol,
  flow: runFlow,
  module: runModule,
  capability: runCapability,
  snippet: runSnippet,
  related: runRelated,
  stats: runStats,
};

const USAGE = `Usage: agent-catalog <command> [query] [--json] [--limit N] [--status S] [--category C] [--importance I] [--path P]

Commands:
  search <query>       Full-text search across the whole catalog
  symbol <name>        Look up a symbol by name
  flow <name>          Show a flow's ordered steps
  module <name>        Show a module's ownership summary and files
  capability <name>    Show a capability's entry points and related symbols
  snippet <query>      Find snippets by title, symbol, or explanation text
  related <symbol>     Show relationships, capabilities, and flows for a symbol
  stats                Row counts and integrity check
`;

function parseArgs(argv: string[]): {
  command: string | undefined;
  query: string;
  flags: CommandFlags;
} {
  const flags: CommandFlags = { json: false, limit: 20 };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      flags.json = true;
    } else if (arg === "--limit") {
      flags.limit = Number(argv[++i] ?? "20") || 20;
    } else if (arg === "--status") {
      flags.status = argv[++i];
    } else if (arg === "--category") {
      flags.category = argv[++i];
    } else if (arg === "--importance") {
      flags.importance = argv[++i];
    } else if (arg === "--path") {
      flags.path = argv[++i];
    } else if (arg.startsWith("--")) {
      console.error(`Unknown flag: ${arg}`);
      process.exitCode = 1;
    } else {
      positional.push(arg);
    }
  }

  const [command, ...rest] = positional;
  return { command, query: rest.join(" "), flags };
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(USAGE);
    return;
  }

  const { command, query, flags } = parseArgs(argv);
  const handler = command ? HANDLERS[command] : undefined;
  if (!handler) {
    console.error(`Unknown command: ${command ?? "(none)"}\n`);
    process.stderr.write(USAGE);
    process.exitCode = 1;
    return;
  }

  const db = openCatalog(undefined, { readOnly: true });
  try {
    handler({ db, query, flags });
  } finally {
    db.close();
  }
}

main();
