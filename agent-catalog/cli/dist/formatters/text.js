/** Plain-text formatting helpers shared by every command's default (non-JSON) output. */
export function heading(text) {
    return text;
}
export function kv(label, value) {
    if (value === null || value === undefined || value === "")
        return "";
    return `${label}: ${String(value)}`;
}
export function bulletList(items) {
    return items.map((item) => `- ${item}`).join("\n");
}
export function numberedList(items) {
    return items.map((item, i) => `${i + 1}. ${item}`).join("\n");
}
export function section(title, body) {
    if (!body.trim())
        return "";
    return `${title}:\n${body}`;
}
export function truncate(text, maxLength = 240) {
    if (text.length <= maxLength)
        return text;
    return `${text.slice(0, maxLength - 1)}…`;
}
