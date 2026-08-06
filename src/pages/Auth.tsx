import { useEffect, useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { isNativeApple, isNativePlatform, signInWithAppleNative } from "@/lib/appleAuth";
import { markSignedInOnce } from "@/lib/authDiagnostics";
import { useKStore } from "@/store/useKStore";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import { Seo } from "@/components/Seo";

/** Only allow same-origin relative paths as a post-login redirect target. */
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default function Auth() {
  const t = useT();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const returnTo = `${window.location.origin}${next ?? "/"}`;
  const { session, loading } = useAuth();
  const onboarded = useKStore((s) => s.onboarded);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [appleError, setAppleError] = useState<string | null>(null);

  // Navigate only once the session is actually hydrated, otherwise the route
  // guard bounces the user straight back to the login screen.
  const destination = next ?? (onboarded ? "/app" : "/onboarding");
  useEffect(() => {
    if (session) setBusy(false);
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (session) return <Navigate to={destination} replace />;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      if (!email) return;
      setBusy(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your inbox", {
          description: "We've sent you a link to reset your password.",
        });
        setMode("signin");
      } catch (err: any) {
        toast.error(err?.message ?? "Could not send reset email");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!email || !password) return;
    if (mode === "signup" && !consent) {
      toast.error("You must accept the privacy policy to create an account.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { getDeviceId, getClientIp } = await import("@/lib/deviceId");
        const device_id = getDeviceId();
        const signup_ip = await getClientIp();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: returnTo,
            data: { device_id, signup_ip },
          },
        });
        if (error) throw error;
        // Supabase returns a user with empty identities[] when the email is already registered
        // (to prevent user enumeration). Detect that and guide the user to sign in / reset instead.
        const alreadyRegistered =
          !!data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
        if (alreadyRegistered) {
          toast.error("Email already registered", {
            description: "This email already has an account. Try logging in, or use 'Forgot password' to reset it.",
            duration: 10000,
          });
          setMode("signin");
        } else {
          toast.success("Check your email", {
            description: "We've sent you a confirmation link. Click it to activate your account, then log in.",
            duration: 8000,
          });
          setMode("signin");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        markSignedInOnce();
        nav(next ?? "/app", { replace: true });
      }
    } catch (err: any) {
      const code = err?.code || err?.name;
      const msg = err?.message ?? "Auth failed";
      if (code === "email_not_confirmed" || /not confirmed/i.test(msg)) {
        toast.error("Email not confirmed", {
          description: "Check your inbox for the confirmation link.",
          action: {
            label: "Resend",
            onClick: async () => {
              try {
                const { error } = await supabase.auth.resend({
                  type: "signup",
                  email,
                  options: { emailRedirectTo: returnTo },
                });
                if (error) throw error;
                toast.success("Confirmation email sent");
              } catch (e: any) {
                toast.error(e?.message ?? "Could not resend");
              }
            },
          },
          duration: 10000,
        });
      } else if (code === "invalid_credentials" || /invalid login/i.test(msg)) {
        toast.error("Wrong email or password", {
          description: "Double-check your credentials or use 'Forgot password'.",
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: returnTo,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  };

  const handleApple = async () => {
    setBusy(true);
    setAppleError(null);
    try {
      // Native iOS/iPadOS: use Apple's own ASAuthorization sheet. A web redirect
      // flow cannot return a session inside the Capacitor WebView, so we must
      // never fall back to it on native — that is what bounced reviewers back
      // to the login screen.
      if (isNativePlatform()) {
        if (!isNativeApple()) {
          throw new Error("Sign in with Apple is only available on iOS. Please use email sign-in.");
        }
        const signedIn = await signInWithAppleNative();
        if (signedIn) {
          markSignedInOnce();
          nav(destination, { replace: true });
          return;
        }
        // User cancelled the Apple sheet — no error, just reset.
        setBusy(false);
        return;
      }
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: returnTo,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      const raw = String(err?.message ?? "");
      const message = /no session|did not create a session/i.test(raw)
        ? "We couldn't complete your sign-in with Apple. Your session was not created. Please try again."
        : /identity token/i.test(raw)
        ? "Apple did not return a valid identity token. Please try again."
        : /not available in this build|only available on iOS/i.test(raw)
        ? raw
        : /timed out/i.test(raw)
        ? "Sign in with Apple took too long to respond. Please try again."
        : /network|fetch/i.test(raw)
        ? "Network problem while signing in with Apple. Check your connection and try again."
        : raw || "Apple sign-in failed. Please try again.";
      setAppleError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };




  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <Seo
        title="Sign in or create account — ScanIQ"
        description="Sign in to ScanIQ or create a free account to scan food, track calories and hit your nutrition goals."
        path="/auth"
      />
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={180} />
          <h1 className="text-3xl font-semibold tracking-tight mt-4">
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Forgot password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {mode === "signin" ? "Sign in to continue your streak." : mode === "signup" ? "Start tracking your nutrition today." : "Enter your email and we'll send you a link to reset your password."}
          </p>
        </div>

        {mode !== "forgot" && (
          <>
            {!isNativePlatform() && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full h-12 rounded-2xl border-border bg-card mb-4 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.617 0 3.077.554 4.226 1.64l3.157-3.157C17.453 1.661 14.91.5 12 .5 7.392.5 3.397 3.137 1.45 7l3.677 2.853C6.064 7.045 8.798 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.275c0-.815-.073-1.6-.21-2.353H12v4.448h6.452c-.28 1.5-1.124 2.768-2.396 3.62l3.674 2.85c2.149-1.985 3.77-4.918 3.77-8.565z"/>
                <path fill="#FBBC05" d="M5.127 14.147A7.49 7.49 0 0 1 4.736 12c0-.747.135-1.47.391-2.147L1.45 7C.527 8.488 0 10.184 0 12c0 1.816.527 3.512 1.45 5l3.677-2.853z"/>
                <path fill="#34A853" d="M12 23.5c3.24 0 5.96-1.073 7.945-2.918l-3.674-2.85c-1.02.685-2.323 1.093-4.271 1.093-3.202 0-5.936-2.045-6.873-4.853L1.45 16.999C3.397 20.863 7.392 23.5 12 23.5z"/>
              </svg>
              Continue with Google
            </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleApple}
              disabled={busy}
              className="w-full h-12 rounded-2xl border-border bg-card mb-4 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </Button>

            {appleError && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <p className="leading-relaxed">{appleError}</p>
                <button
                  type="button"
                  onClick={handleApple}
                  disabled={busy}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-destructive/40 px-3 py-2 font-semibold disabled:opacity-60"
                >
                  {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                  Try again
                </button>
              </div>
            )}



            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-12 rounded-2xl bg-card border border-border/60 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          {mode !== "forgot" && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 rounded-2xl bg-card border border-border/60 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
          )}
          {mode === "signin" && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Forgot password?
              </button>
            </div>
          )}
          {mode === "signup" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed pt-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span>
                I accept the{" "}
                <a href="/privacy" target="_blank" rel="noopener" className="text-primary-glow underline">
                  privacy policy
                </a>{" "}
                and consent to the processing of my data (GDPR).
              </span>
            </label>
          )}
          <Button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-2xl bg-[hsl(14_100%_55%)] hover:bg-[hsl(14_100%_50%)] text-white font-bold shadow-[0_8px_20px_-4px_hsl(14_100%_55%/0.5)]"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <span className="text-white">
                {mode === "signin" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
              </span>
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full mt-5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          {mode === "forgot" ? "Back to login" : mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>

        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
          <a href="/pricing" className="hover:text-foreground underline-offset-4 hover:underline">Pricing</a>
          <span>·</span>
          <a href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">Terms</a>
          <span>·</span>
          <a href="/refund" className="hover:text-foreground underline-offset-4 hover:underline">Refund</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">Privacy</a>
        </div>
      </div>
    </div>
  );
}
