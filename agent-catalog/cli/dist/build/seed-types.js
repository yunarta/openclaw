/**
 * Seed-data row shapes. Foreign keys are expressed as string keys that are
 * resolved to integer row ids at insert time (see inserters.ts), so seed
 * files can be authored independently of insertion order and without
 * knowing database-generated ids in advance.
 *
 * Key conventions:
 *  - file key = repo-root-relative path, e.g. "src/agents/loop.ts"
 *  - symbol key = "<file path>#<symbolName>"
 *  - module/capability/flow/tool/skill/memory-system/data-type/event key = its `name`
 */
export {};
