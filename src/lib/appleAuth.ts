import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { logAppleAttempt, markSignedInOnce } from "@/lib/authDiagnostics";

/**
 * Native "Sign in with Apple" for iOS/iPadOS.
 *
 * Inside the Capacitor WKWebView a browser-redirect OAuth flow cannot return a
 * session (the redirect target `capacitor://localhost` is not a valid Apple
 * return URL), which is why the reviewer was bounced back to the login screen.
 * On native we therefore use Apple's own ASAuthorization sheet and exchange the
 * resulting identity token for a Supabase session with `signInWithIdToken`.
 */

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isNativeApple(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

function randomNonce(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** True when the native Apple plugin is actually registered in this build. */
export function isApplePluginAvailable(): boolean {
  try {
    return Capacitor.isPluginAvailable("SignInWithApple");
  } catch {
    return false;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/** Resolve as soon as the SDK reports a session (listener + polling fallback). */
async function waitForSession(timeoutMs = 8000) {
  const existing = (await supabase.auth.getSession()).data.session;
  if (existing) return existing;

  return new Promise<any>((resolve) => {
    let done = false;
    const finish = (s: any) => {
      if (done) return;
      done = true;
      try { sub?.subscription.unsubscribe(); } catch { /* ignore */ }
      clearInterval(poll);
      clearTimeout(timer);
      resolve(s);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) finish(s);
    });
    const poll = setInterval(async () => {
      const s = (await supabase.auth.getSession()).data.session;
      if (s) finish(s);
    }, 250);
    const timer = setTimeout(() => finish(null), timeoutMs);
  });
}

/**
 * Runs the native Apple sign-in sheet and sets the Supabase session.
 * Returns true when the user is signed in, false when the user cancelled.
 * Throws on real errors so the caller can show a message.
 */
export async function signInWithAppleNative(): Promise<boolean> {
  const platform = (() => {
    try {
      return Capacitor.getPlatform();
    } catch {
      return "unknown";
    }
  })();
  const base = { platform, native: isNativePlatform() };
  logAppleAttempt({ ...base, status: "started" });

  if (!isApplePluginAvailable()) {
    const message = "Sign in with Apple is not available in this build. Please use email sign-in.";
    logAppleAttempt({ ...base, status: "error", message, code: "plugin_unavailable" });
    throw new Error(message);
  }

  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");

  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  let result: any;
  try {
    result = await withTimeout(
      SignInWithApple.authorize({
        clientId: "com.kinetex.scaniq",
        redirectURI: "",
        scopes: "name email",
        nonce: hashedNonce,
      }) as Promise<any>,
      45000,
      "Apple sign-in",
    );
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "");
    const code = String(e?.code ?? "");
    // User tapped Cancel / dismissed the Apple sheet — not an error.
    // ASAuthorizationError.canceled = 1001, .unknown on dismiss = 1000.
    if (/cancel|1001|1000/i.test(msg) || code === "1001" || code === "1000") {
      logAppleAttempt({ ...base, status: "cancelled", message: msg || "User cancelled", code });
      return false;
    }
    logAppleAttempt({ ...base, status: "error", message: msg || "Apple sheet failed", code });
    throw e;
  }

  const identityToken: string | undefined = result?.response?.identityToken;
  if (!identityToken) {
    logAppleAttempt({ ...base, status: "error", message: "Apple did not return an identity token." });
    throw new Error("Apple did not return an identity token.");
  }

  // Diagnostics: the native token's audience must be the iOS bundle id.
  const audience = (() => {
    try {
      const payload = JSON.parse(
        atob(identityToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      return Array.isArray(payload?.aud) ? payload.aud.join(",") : String(payload?.aud ?? "");
    } catch {
      return "";
    }
  })();
  logAppleAttempt({ ...base, status: "started", message: `id_token aud=${audience || "unknown"}` });

  const { data: signInData, error } = await withTimeout(
    supabase.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
      nonce: rawNonce,
    }),
    30000,
    "Apple sign-in",
  );
  if (error) {
    const audienceIssue = /audience/i.test(error.message);
    logAppleAttempt({
      ...base,
      status: "error",
      message: audienceIssue
        ? `${error.message} (aud=${audience}) — add this bundle id to the Apple provider's authorized client IDs.`
        : error.message,
      code: String((error as any)?.code ?? ""),
    });
    throw error;
  }

  // The reviewer's symptom ("bounced back to the login screen") happens when the
  // session is not persisted yet. Wait until the SDK reports a session before
  // telling the caller we are signed in.
  const session = signInData?.session ?? (await waitForSession());
  if (!session) {
    logAppleAttempt({ ...base, status: "error", message: "No session after Apple sign-in." });
    throw new Error("Apple sign-in did not create a session. Please try again.");
  }

  logAppleAttempt({ ...base, status: "success" });
  markSignedInOnce();

  // Apple only shares the full name on the very first authorization.
  const given = result?.response?.givenName;
  const family = result?.response?.familyName;
  const fullName = [given, family].filter(Boolean).join(" ").trim();
  if (fullName) {
    try {
      await supabase.auth.updateUser({ data: { full_name: fullName } });
    } catch {
      /* best-effort */
    }
  }

  return true;
}
