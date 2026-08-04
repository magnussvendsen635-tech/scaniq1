/**
 * Lightweight, local-only diagnostics for "Sign in with Apple".
 *
 * Everything is stored in localStorage on the device — no network calls, no
 * tracking, no personal data beyond what the user already sees in the app.
 * Used by /debug/apple-signin to answer three questions:
 *   1. Is this a fresh install?
 *   2. What happened during the last Apple sign-in attempt?
 *   3. Am I signed in right now, and with which provider?
 */

const LOG_KEY = "scaniq.apple_signin_log_v1";
const INSTALL_KEY = "scaniq.install_v1";
const MAX_ENTRIES = 10;

export type AppleAttemptStatus = "started" | "success" | "cancelled" | "error";

export interface AppleAttempt {
  at: string;
  status: AppleAttemptStatus;
  message?: string;
  code?: string;
  platform: string;
  native: boolean;
}

export interface InstallInfo {
  installId: string;
  firstSeen: string;
  /** True until the first successful sign-in happens on this install. */
  freshInstall: boolean;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

export function getInstallInfo(): InstallInfo {
  const raw = safeGet(INSTALL_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as InstallInfo;
    } catch {
      /* rewrite below */
    }
  }
  const info: InstallInfo = {
    installId: (crypto.randomUUID?.() ?? String(Date.now())).slice(0, 8),
    firstSeen: new Date().toISOString(),
    freshInstall: true,
  };
  safeSet(INSTALL_KEY, JSON.stringify(info));
  return info;
}

export function markSignedInOnce() {
  const info = getInstallInfo();
  if (info.freshInstall) safeSet(INSTALL_KEY, JSON.stringify({ ...info, freshInstall: false }));
}

export function readAppleLog(): AppleAttempt[] {
  const raw = safeGet(LOG_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AppleAttempt[]) : [];
  } catch {
    return [];
  }
}

export function logAppleAttempt(entry: Omit<AppleAttempt, "at">) {
  const next = [{ at: new Date().toISOString(), ...entry }, ...readAppleLog()].slice(0, MAX_ENTRIES);
  safeSet(LOG_KEY, JSON.stringify(next));
}

export function clearAppleLog() {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    /* ignore */
  }
}
