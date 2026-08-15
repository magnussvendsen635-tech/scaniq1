import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldQuestion, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { readAppleLog, clearAppleLog, type AppleAttempt } from "@/lib/authDiagnostics";
import { APPLE_NATIVE_CLIENT_ID, isNativeApple } from "@/lib/appleAuth";

/** Turn a raw backend/plugin error into one short, readable line. */
function humanize(entry: AppleAttempt): string {
  const raw = entry.message ?? "";
  if (/unacceptable audience/i.test(raw))
    return `Backend accepted no token for ${APPLE_NATIVE_CLIENT_ID} (audience not allow-listed).`;
  if (entry.code === "nonce_mismatch") return "Nonce mismatch between Apple and the app.";
  if (entry.code === "unexpected_audience") return "Apple returned a token for another app ID.";
  if (entry.code === "plugin_unavailable") return "Apple sign-in is not available in this build.";
  if (/no session|did not create a session/i.test(raw)) return "Token accepted, but no session was created.";
  if (!raw) return "Unknown error.";
  return raw.length > 140 ? `${raw.slice(0, 137)}…` : raw;
}

export function SignInStatusCard() {
  const { session } = useAuth();
  const [log, setLog] = useState<AppleAttempt[]>([]);

  const refresh = () => setLog(readAppleLog());
  useEffect(refresh, []);

  const provider = (session?.user?.app_metadata?.provider as string | undefined) ?? null;
  const lastSuccess = log.find((e) => e.status === "success");
  const lastError = log.find((e) => e.status === "error");
  const exchangeOk = !!lastSuccess && (!lastError || lastSuccess.at > lastError.at);

  const state: "ok" | "failed" | "none" = lastSuccess || lastError ? (exchangeOk ? "ok" : "failed") : "none";

  const Icon = state === "ok" ? CheckCircle2 : state === "failed" ? AlertTriangle : ShieldQuestion;

  return (
    <div className="k-card p-5 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon
            className={`w-5 h-5 mt-0.5 ${
              state === "ok" ? "text-primary" : state === "failed" ? "text-destructive" : "text-muted-foreground"
            }`}
          />
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Sign-in status</div>
            <div className="text-lg font-semibold">
              {state === "ok" && "Apple sign-in works"}
              {state === "failed" && "Apple sign-in failed"}
              {state === "none" && "No Apple sign-in attempts yet"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {session ? `Signed in via ${provider ?? "email"}` : "Not signed in"}
              {isNativeApple() ? " · native iOS" : " · web"}
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          aria-label="Refresh sign-in status"
          className="k-tap h-11 w-11 rounded-2xl border-2 border-border bg-card flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Token exchange</span>
          <span className="font-medium">
            {state === "ok" ? "Succeeded" : state === "failed" ? "Failed" : "Not tested"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Native audience</span>
          <span className="font-medium">{APPLE_NATIVE_CLIENT_ID}</span>
        </div>
        {lastSuccess && (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Last success</span>
            <span className="font-medium">{new Date(lastSuccess.at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {lastError && !exchangeOk && (
        <p className="mt-3 text-xs text-destructive">
          {humanize(lastError)}
          <span className="block text-muted-foreground mt-0.5">
            {new Date(lastError.at).toLocaleString()}
          </span>
        </p>
      )}

      {log.length > 0 && (
        <button
          onClick={() => {
            clearAppleLog();
            refresh();
          }}
          className="mt-3 text-xs text-muted-foreground underline"
        >
          Clear log
        </button>
      )}
    </div>
  );
}
