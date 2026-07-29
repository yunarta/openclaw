import type { DatabaseSync } from "node:sqlite";

export interface CommandFlags {
  json: boolean;
  limit: number;
  status?: string;
  category?: string;
  importance?: string;
  path?: string;
}

export interface CommandContext {
  db: DatabaseSync;
  query: string;
  flags: CommandFlags;
}

export type CommandHandler = (ctx: CommandContext) => void;
