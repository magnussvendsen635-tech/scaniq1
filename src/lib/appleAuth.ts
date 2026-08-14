import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { logAppleAttempt, markSignedInOnce } from "@/lib/authDiagnostics";
import type { Session } from "@supabase/supabase-js";

/**
 * Apple's native ASAuthorization flow issues an ID token whose audience is the
 * signed app's Bundle ID. This value must also be present in the backend Apple
 * provider's accepted Client IDs.
 */
export const APPLE_NATIVE_CLIENT_ID = "com.kinetex.scaniq";

interface AppleIdentityTokenClaims {
  aud?: string | string[];
  nonce?: string;
}

interface AppleAuthorizationResponse {
  response?: {
    identityToken?: string;
    givenName?: string | null;
    familyName?: string | null;
  };
}

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

function readIdentityTokenClaims(identityToken: string): AppleIdentityTokenClaims | null {
  try {
    const encodedPayload = identityToken.split(".")[1];
    if (!encodedPayload) return null;
    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(paddedPayload)) as AppleIdentityTokenClaims;
  } catch {
    return null;
  }
}

function tokenAudiences(claims: AppleIdentityTokenClaims): string[] {
  if (Array.isArray(claims.aud)) return claims.aud.map(String);
  return claims.aud ? [String(claims.aud)] : [];
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "");
}

function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return "";
  return String(error.code ?? "");
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
async function waitForSession(timeoutMs = 8000): Promise<Session | null> {
  const existing = (await supabase.auth.getSession()).data.session;
  if (existing) return existing;

  return new Promise<Session | null>((resolve) => {
    let done = false;
    const finish = (session: Session | null) => {
      if (done) return;
      done = true;
      try { sub?.subscription.unsubscribe(); } catch { /* ignore */ }
      clearInterval(poll);
      clearTimeout(timer);
      resolve(session);
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

  // Note: we do NOT hard-block on Capacitor.isPluginAvailable() — it can report
  // false before the bridge finishes registering plugins (and in some simulator
  // runs), which produced a bogus "not available in this build" error. Instead we
  // load the plugin and only fail if it is truly missing.
  let SignInWithApple: typeof import("@capacitor-community/apple-sign-in")["SignInWithApple"] | undefined;
  try {
    ({ SignInWithApple } = await import("@capacitor-community/apple-sign-in"));
  } catch {
    SignInWithApple = undefined;
  }

  if (!SignInWithApple || typeof SignInWithApple.authorize !== "function") {
    const message = "Sign in with Apple is not available in this build. Please use email sign-in.";
    logAppleAttempt({ ...base, status: "error", message, code: "plugin_unavailable" });
    throw new Error(message);
  }

  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  let result: AppleAuthorizationResponse;
  try {
    result = await withTimeout(
      SignInWithApple.authorize({
        // Required by the plugin's shared API, but ignored by its native iOS
        // implementation. ASAuthorizationAppleIDProvider always issues the ID
        // token for the signed app's Bundle ID: com.kinetex.scaniq.
        clientId: APPLE_NATIVE_CLIENT_ID,
        redirectURI: "",
        scopes: "name email",
        nonce: hashedNonce,
      }),
      45000,
      "Apple sign-in",
    );
  } catch (error: unknown) {
    const msg = errorMessage(error);
    const code = errorCode(error);
    // User tapped Cancel / dismissed the Apple sheet — not an error.
    // ASAuthorizationError.canceled = 1001, .unknown on dismiss = 1000.
    if (/cancel|1001|1000/i.test(msg) || code === "1001" || code === "1000") {
      logAppleAttempt({ ...base, status: "cancelled", message: msg || "User cancelled", code });
      return false;
    }
    logAppleAttempt({ ...base, status: "error", message: msg || "Apple sheet failed", code });
    throw error;
  }

  const identityToken: string | undefined = result?.response?.identityToken;
  if (!identityToken) {
    logAppleAttempt({ ...base, status: "error", message: "Apple did not return an identity token." });
    throw new Error("Apple did not return an identity token.");
  }

  // ASAuthorizationAppleIDProvider derives the native audience from the signed
  // Bundle ID. Reject any unexpected token before sending it to the backend.
  const claims = readIdentityTokenClaims(identityToken);
  if (!claims) {
    const message = "Apple returned an unreadable identity token.";
    logAppleAttempt({ ...base, status: "error", message, code: "invalid_identity_token" });
    throw new Error(message);
  }

  const audiences = tokenAudiences(claims);
  const audience = audiences.join(",");
  logAppleAttempt({ ...base, status: "started", message: `id_token aud=${audience || "unknown"}` });
  if (!audiences.includes(APPLE_NATIVE_CLIENT_ID)) {
    const message = `Apple returned a token for an unexpected app (aud=${audience || "missing"}).`;
    logAppleAttempt({ ...base, status: "error", message, code: "unexpected_audience" });
    throw new Error(message);
  }

  // Apple puts the SHA-256 hash sent to ASAuthorization in the token. Supabase
  // receives the original nonce below and performs the same hash comparison.
  // Rejecting a mismatch here prevents exchanging a token from another attempt.
  if (claims.nonce !== hashedNonce) {
    const message = "Apple returned an identity token with an invalid nonce.";
    logAppleAttempt({ ...base, status: "error", message, code: "nonce_mismatch" });
    throw new Error(message);
  }

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
        ? `${error.message} (aud=${audience}) — the backend Apple provider must accept ${APPLE_NATIVE_CLIENT_ID}.`
        : error.message,
      code: errorCode(error),
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
