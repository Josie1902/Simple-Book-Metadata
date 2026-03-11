export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "") // remove illegal characters
    .replace(/\s+/g, " ")         // collapse multiple spaces
    .trim()                        // trim edges
    .replace(/\.+$/, "");          // remove trailing dots
}