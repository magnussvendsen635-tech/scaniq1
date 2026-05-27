import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase recovery links land here with a session already established via the URL hash.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Adgangskoden skal være mindst 6 tegn");
      return;
    }
    if (password !== confirm) {
      toast.error("Adgangskoderne matcher ikke");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Adgangskode opdateret", { description: "Du er nu logget ind." });
      nav("/");
    } catch (err: any) {
      toast.error(err?.message ?? "Kunne ikke opdatere adgangskoden");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={56} />
          <h1 className="text-3xl font-semibold tracking-tight mt-4">Ny adgangskode</h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Vælg en ny adgangskode til din ScanIQ-konto.
          </p>
        </div>

        {!ready ? (
          <div className="text-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Bekræfter reset-link…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ny adgangskode"
                className="w-full h-12 rounded-2xl bg-card border border-border/60 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Gentag adgangskode"
                className="w-full h-12 rounded-2xl bg-card border border-border/60 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-2xl bg-[hsl(14_100%_55%)] hover:bg-[hsl(14_100%_50%)] text-white font-bold shadow-[0_8px_20px_-4px_hsl(14_100%_55%/0.5)]"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span className="text-white">Opdater adgangskode</span>}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
