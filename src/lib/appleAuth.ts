import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Runs the native Apple sign-in sheet and sets the Supabase session.
 * Returns true when the user is signed in, false when the user cancelled.
 * Throws on real errors so the caller can show a message.
 */
export async function signInWithAppleNative(): Promise<boolean> {
  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");

  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  let result: any;
  try {
    result = await SignInWithApple.authorize({
      clientId: "site.scaniq.app",
      redirectURI: "",
      scopes: "name email",
      nonce: hashedNonce,
    });
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? "");
    // User tapped Cancel on the Apple sheet — not an error.
    if (/cancel/i.test(msg) || e?.code === "1001") return false;
    throw e;
  }

  const identityToken: string | undefined = result?.response?.identityToken;
  if (!identityToken) throw new Error("Apple did not return an identity token.");

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

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
