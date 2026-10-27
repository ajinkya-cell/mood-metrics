// clsx-style class joiner: strings, arrays, and { "class names": condition } objects
type ClassValue = string | number | null | undefined | false | ClassValue[] | Record<string, unknown>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") out.push(String(input));
    else if (Array.isArray(input)) out.push(cn(...input));
    else for (const [name, on] of Object.entries(input)) if (on) out.push(name);
  }
  return out.filter(Boolean).join(" ");
}
