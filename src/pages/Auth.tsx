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

export default function Auth() {
  const t = useT();
  const nav = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === "signup" && !consent) {
      toast.error("Du skal acceptere privatlivspolitikken for at oprette en konto.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
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
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={56} />
          <h1 className="text-3xl font-semibold tracking-tight mt-4">
            {mode === "signin" ? t("auth.welcome_back") : t("auth.create_account")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {mode === "signin" ? t("auth.sign_in_sub") : t("auth.sign_up_sub")}
          </p>
        </div>

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
          {t("auth.continue_google")}
        </Button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.or")}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

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
                {mode === "signin" ? t("auth.sign_in") : t("auth.sign_up")}
              </span>
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full mt-5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          {mode === "signin" ? t("auth.no_account") : t("auth.have_account")}
        </button>
      </div>
    </div>
  );
}
