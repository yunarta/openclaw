/** Stable, machine-readable JSON output. Keys are written in a fixed order by each command; this helper only owns final serialization. */
export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
