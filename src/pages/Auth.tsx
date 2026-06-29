import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import { Seo } from "@/components/Seo";

export default function Auth() {
  const t = useT();
  const nav = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/app" replace />;

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { device_id, signup_ip },
          },
        });
        if (error) throw error;
        toast.success(t("auth.account_created"), { description: t("auth.welcome_in") });
        nav("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/`,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  };

  const handleApple = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/`,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast.error(err?.message ?? "Apple sign-in failed");
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
              Fortsæt med Apple
            </Button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.or")}</span>
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
              placeholder={t("auth.email")}
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
                placeholder={t("auth.password")}
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
                Glemt adgangskode?
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
                Jeg accepterer{" "}
                <a href="/privacy" target="_blank" rel="noopener" className="text-primary-glow underline">
                  privatlivspolitikken
                </a>{" "}
                og giver samtykke til behandling af mine data (GDPR).
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
                {mode === "signin" ? t("auth.sign_in") : mode === "signup" ? t("auth.sign_up") : "Send reset-link"}
              </span>
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full mt-5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          {mode === "forgot" ? "Tilbage til login" : mode === "signin" ? t("auth.no_account") : t("auth.have_account")}
        </button>

        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
          <a href="/pricing" className="hover:text-foreground underline-offset-4 hover:underline">Priser</a>
          <span>·</span>
          <a href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">Servicevilkår</a>
          <span>·</span>
          <a href="/refund" className="hover:text-foreground underline-offset-4 hover:underline">Refundering</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">Privatliv</a>
        </div>
      </div>
    </div>
  );
}
