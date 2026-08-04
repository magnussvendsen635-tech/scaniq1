import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Copy, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApple, signInWithAppleNative } from "@/lib/appleAuth";
import {
  clearAppleLog,
  getInstallInfo,
  readAppleLog,
  type AppleAttempt,
  type InstallInfo,
} from "@/lib/authDiagnostics";

interface SessionInfo {
  signedIn: boolean;
  userId?: string;
  email?: string;
  provider?: string;
  providers?: string;
  createdAt?: string;
  lastSignInAt?: string;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="px-5 py-3 flex items-start justify-between gap-4 border-b border-border/40 last:border-0">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm font-medium text-right break-all">{value}</span>
  </div>
);

const StatusIcon = ({ status }: { status: AppleAttempt["status"] }) => {
  if (status === "success") return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (status === "error") return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
  return <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />;
};

export default function AppleSignInDebug() {
  const nav = useNavigate();
  const [install] = useState<InstallInfo>(() => getInstallInfo());
  const [log, setLog] = useState<AppleAttempt[]>(() => readAppleLog());
  const [session, setSession] = useState<SessionInfo>({ signedIn: false });
  const [pluginAvailable, setPluginAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const platform = (() => {
    try {
      return Capacitor.getPlatform();
    } catch {
      return "unknown";
    }
  })();
  const native = (() => {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  })();

  const refresh = useCallback(async () => {
    setLog(readAppleLog());
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (!s) {
      setSession({ signedIn: false });
      return;
    }
    const u = s.user;
    setSession({
      signedIn: true,
      userId: u.id,
      email: u.email ?? "—",
      provider: (u.app_metadata as any)?.provider ?? "—",
      providers: ((u.app_metadata as any)?.providers ?? []).join(", ") || "—",
      createdAt: u.created_at,
      lastSignInAt: (u as any).last_sign_in_at ?? s.user.updated_at,
    });
  }, []);

  useEffect(() => {
    refresh();
    try {
      setPluginAvailable(Capacitor.isPluginAvailable("SignInWithApple"));
    } catch {
      setPluginAvailable(false);
    }
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const runTest = async () => {
    setBusy(true);
    try {
      if (!isNativeApple()) {
        toast.info("Native test unavailable", {
          description: "The Apple sheet only opens inside the ScanIQ iOS app.",
        });
        return;
      }
      const ok = await signInWithAppleNative();
      toast[ok ? "success" : "message"](ok ? "Signed in with Apple" : "Sign-in cancelled");
    } catch (e: any) {
      toast.error("Apple sign-in failed", { description: e?.message });
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const copy = async () => {
    const payload = {
      platform,
      native,
      pluginAvailable,
      install,
      session,
      log,
      generatedAt: new Date().toISOString(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success("Diagnostics copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const last = log.find((l) => l.status !== "started");

  return (
    <div className="k-page min-h-screen bg-background" style={{ paddingBottom: 100 }}>
      <header className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => nav(-1)}
          aria-label="Back"
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">Sign in with Apple — status</h1>
      </header>

      <section className="rounded-2xl bg-card border border-border/60 overflow-hidden mb-4">
        <Row label="Platform" value={`${platform}${native ? " (native)" : " (web)"}`} />
        <Row
          label="Apple plugin"
          value={pluginAvailable === null ? "…" : pluginAvailable ? "Available" : "Not available"}
        />
        <Row label="Fresh install" value={install.freshInstall ? "Yes — never signed in" : "No"} />
        <Row label="Install ID" value={install.installId} />
        <Row label="First launch" value={new Date(install.firstSeen).toLocaleString()} />
      </section>

      <section className="rounded-2xl bg-card border border-border/60 overflow-hidden mb-4">
        <Row
          label="Signed in"
          value={session.signedIn ? <span className="text-emerald-500">Yes</span> : "No"}
        />
        {session.signedIn && (
          <>
            <Row label="Provider" value={session.provider} />
            <Row label="Linked providers" value={session.providers} />
            <Row label="Email" value={session.email} />
            <Row label="User ID" value={session.userId} />
            <Row
              label="Last sign-in"
              value={session.lastSignInAt ? new Date(session.lastSignInAt).toLocaleString() : "—"}
            />
            <Row
              label="Account created"
              value={session.createdAt ? new Date(session.createdAt).toLocaleString() : "—"}
            />
          </>
        )}
      </section>

      <section className="rounded-2xl bg-card border border-border/60 overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
          <span className="text-sm font-semibold">Last Apple attempts</span>
          <span className="text-xs text-muted-foreground">
            {last ? `${last.status} · ${new Date(last.at).toLocaleTimeString()}` : "none yet"}
          </span>
        </div>
        {log.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground text-center">
            No Apple sign-in attempts recorded on this install.
          </div>
        ) : (
          log.map((l, i) => (
            <div key={`${l.at}-${i}`} className="px-5 py-3 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-2">
                <StatusIcon status={l.status} />
                <span className="text-sm font-medium capitalize">{l.status}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(l.at).toLocaleString()}
                </span>
              </div>
              {(l.message || l.code) && (
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  {l.code ? `[${l.code}] ` : ""}
                  {l.message}
                </p>
              )}
            </div>
          ))
        )}
      </section>

      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={runTest}
          disabled={busy}
          className="k-tap h-12 rounded-2xl bg-[hsl(24_95%_53%)] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Run Apple sign-in test
        </button>
        <button
          onClick={copy}
          className="k-tap h-11 rounded-xl bg-card border border-border/60 text-sm font-medium flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" /> Copy diagnostics
        </button>
        <button
          onClick={() => {
            clearAppleLog();
            setLog([]);
            toast.success("Log cleared");
          }}
          className="k-tap h-11 rounded-xl bg-card border border-border/60 text-sm font-medium flex items-center justify-center gap-2 text-muted-foreground"
        >
          <Trash2 className="w-4 h-4" /> Clear log
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-5 px-4 leading-relaxed">
        This page is stored only on this device. Nothing is uploaded and no tracking is performed.
      </p>
    </div>
  );
}
