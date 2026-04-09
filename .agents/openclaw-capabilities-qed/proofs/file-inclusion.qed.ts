/**
 * QED: File Inclusion in OpenClaw
 *
 * Demonstrates:
 * 1. ✅ Config-level $include directives WORK
 * 2. ✅ Bootstrap file loading WORKS
 * 3. ❌ Recursive file inclusion in system prompt DOES NOT WORK
 */

// ============================================================================
// PART 1: Config-level $include (WORKS)
// ============================================================================

import { resolveConfigIncludes } from "src/config/includes.js";

// Assume config directory has:
// - base.json5: { "version": 1, "defaults": { ... } }
// - custom.json5: { "overrides": { ... } }

const configWithInclude = {
  $include: ["./base.json5", "./custom.json5"],
  locale: "en",
};

// This DOES work - $include is resolved and merged
// Result:
// {
//   version: 1,
//   defaults: { ... },
//   overrides: { ... },
//   locale: "en"
// }

// ============================================================================
// PART 2: Bootstrap File Loading (WORKS)
// ============================================================================

import { loadWorkspaceBootstrapFiles } from "src/agents/workspace.js";

async function demonstrateBootstrapLoading() {
  const workspaceDir = "/home/user/.openclaw/workspace";

  // These files are loaded from known locations:
  // - AGENTS.md
  // - SOUL.md
  // - TOOLS.md
  // - BOOTSTRAP.md
  // etc.

  const files = await loadWorkspaceBootstrapFiles(workspaceDir);
  // files[0].name = "AGENTS.md"
  // files[0].path = "/home/user/.openclaw/workspace/AGENTS.md"
  // files[0].content = "# Agent Setup Instructions..."
  // files[1].name = "SOUL.md"
  // files[1].content = "You are a helpful assistant. Read DIRECTIVE.md for rules."
  //                     ^^^^^^^^^^^ This line is NOT processed for "Read" directives ❌
}

// ============================================================================
// PART 3: System Prompt Assembly (WORKS, but no inline directives)
// ============================================================================

import { buildBootstrapContextFiles } from "src/agents/pi-embedded-helpers.js";
import type { WorkspaceBootstrapFile } from "src/agents/workspace.js";

function demonstrateSystemPromptAssembly() {
  const bootstrapFiles: WorkspaceBootstrapFile[] = [
    {
      name: "AGENTS.md",
      path: "/workspace/AGENTS.md",
      content: "# Instructions\nRead SOUL.md",
      missing: false,
    },
    {
      name: "SOUL.md",
      path: "/workspace/SOUL.md",
      // The content below contains a "Read" directive that is NOT parsed
      content: `
You are a helpful AI.
Read DIRECTIVE.md for additional rules.
      `.trim(),
      missing: false,
    },
  ];

  const contextFiles = buildBootstrapContextFiles(bootstrapFiles, {
    maxChars: 20_000,
    totalMaxChars: 150_000,
  });

  // contextFiles = [
  //   {
  //     path: "/workspace/AGENTS.md",
  //     content: "# Instructions\nRead SOUL.md"  // ← "Read SOUL.md" is literal text
  //   },
  //   {
  //     path: "/workspace/SOUL.md",
  //     content: "You are a helpful AI.\nRead DIRECTIVE.md for additional rules."
  //              // ← "Read DIRECTIVE.md" is literal text, NOT a directive
  //   }
  // ]

  // The system prompt includes these files as-is.
  // It does NOT parse "Read X.md" and include X.md.
  // That would require a directive parser (which doesn't exist).
}

// ============================================================================
// PART 4: What would be needed for recursive file inclusion
// ============================================================================

/**
 * This is what DOES NOT exist yet:
 * A directive parser that could recognize and process "Read X.md" in files.
 */

interface ReadDirective {
  command: "Read";
  filePath: string;
  reason?: string; // e.g., "for additional rules"
}

function parseReadDirective(line: string): ReadDirective | null {
  // Pattern: "Read X.md" or "Read X.md — reason text"
  const match = line.match(/^\s*Read\s+([^\s—\n]+)(?:\s*—(.*))?$/);
  if (!match) return null;

  return {
    command: "Read",
    filePath: match[1],
    reason: match[2]?.trim(),
  };
}

// Example usage (NOT implemented in OpenClaw):
const exampleLine = "Read DIRECTIVE.md — for additional rules";
const directive = parseReadDirective(exampleLine);
// directive = {
//   command: "Read",
//   filePath: "DIRECTIVE.md",
//   reason: "for additional rules"
// }

// To make this work in the system prompt, you'd need to:
// 1. Parse loaded file content for "Read X.md" directives
// 2. Resolve file paths relative to workspace root
// 3. Load referenced files recursively
// 4. Guard against circular includes (SOUL.md → AGENTS.md → SOUL.md)
// 5. Respect token budgets when adding recursive files
// 6. Merge content into system prompt

/**
 * Integration point (pseudocode):
 *
 * async function resolveBootstrapFilesWithRecursion(files, workspaceDir) {
 *   const seen = new Set<string>();
 *   const queue = [...files];
 *   const result = [];
 *
 *   while (queue.length > 0) {
 *     const file = queue.shift();
 *     if (seen.has(file.path)) continue; // circular guard
 *
 *     result.push(file);
 *     seen.add(file.path);
 *
 *     // Parse for "Read X.md" directives
 *     for (const line of file.content.split('\n')) {
 *       const directive = parseReadDirective(line);
 *       if (directive) {
 *         const referenced = await loadFile(
 *           path.join(workspaceDir, directive.filePath)
 *         );
 *         queue.push(referenced);
 *       }
 *     }
 *   }
 *   return result;
 * }
 */

// ============================================================================
// SUMMARY
// ============================================================================

/*
✅ WORKS:
- Config $include directives in JSON5 files
- Bootstrap file loading from standard workspace locations
- System prompt assembly with truncation/budgeting

❌ DOES NOT WORK:
- Recursive file inclusion based on "Read X.md" directives in markdown
- Parsing inline directives in system prompt files
- Circular include detection for markdown file references

This is a feature that could be added, but does not currently exist.
*/
