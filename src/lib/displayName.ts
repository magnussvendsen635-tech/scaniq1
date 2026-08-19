/**
 * Shared rules for deciding whether a stored value is a real, human name.
 *
 * The signup trigger fills `profiles.display_name` with the email local part
 * when no real name exists (e.g. "l_m" for l_m@example.com). That is not a name
 * and must never be shown as one, nor accepted as "the user already told us".
 */

const PLACEHOLDERS = /^(test|tester|user|bruger|demo|guest|admin|null|undefined|none|na|n\/a)$/i;

/** True when `value` looks like an actual human name (letters, spaces, - ' ’). */
export function isRealName(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  if (v.length < 2) return false;
  if (PLACEHOLDERS.test(v)) return false;
  // Must be letter-based words; rejects things like "L_M", "u123", "a.b".
  return /^[\p{L}][\p{L}'’-]*(\s+[\p{L}][\p{L}'’-]*)*$/u.test(v);
}

/** True when `value` is just the local part of `email` (trigger fallback). */
export function isEmailLocalPart(value: string | null | undefined, email: string | null | undefined): boolean {
  const local = (email ?? "").split("@")[0].trim().toLowerCase();
  if (!local) return false;
  return (value ?? "").trim().toLowerCase() === local;
}

/** Returns a usable name, or null when the value is a placeholder/email prefix. */
export function sanitizeName(
  value: string | null | undefined,
  email?: string | null,
): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (isEmailLocalPart(v, email)) return null;
  if (!isRealName(v)) return null;
  return v;
}

/** First name for greetings, or "" when there is no real name to show. */
export function firstNameOf(value: string | null | undefined, email?: string | null): string {
  const full = sanitizeName(value, email);
  if (!full) return "";
  const first = full.split(/\s+/)[0] ?? "";
  return isRealName(first) ? first : "";
}
