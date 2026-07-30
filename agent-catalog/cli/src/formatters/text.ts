/** Plain-text formatting helpers shared by every command's default (non-JSON) output. */

export function truncate(text: string, maxLength = 240): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}
