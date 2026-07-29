/** Plain-text formatting helpers shared by every command's default (non-JSON) output. */

export function heading(text: string): string {
  return text;
}

export function kv(label: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return `${label}: ${String(value)}`;
}

export function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function numberedList(items: string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join("\n");
}

export function section(title: string, body: string): string {
  if (!body.trim()) return "";
  return `${title}:\n${body}`;
}

export function truncate(text: string, maxLength = 240): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
