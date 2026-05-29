import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "loading" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        const data = await r.json();
        if (data?.email) setEmail(data.email);
        if (data?.used) setState("already");
        else if (r.ok && data?.valid) setState("valid");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("confirming");
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    if (error) { setError(error.message); setState("error"); return; }
    setState("done");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          {state === "loading" || state === "confirming" ? <Loader2 className="w-6 h-6 animate-spin" /> :
           state === "done" ? <CheckCircle2 className="w-6 h-6 text-green-600" /> :
           state === "invalid" || state === "error" ? <XCircle className="w-6 h-6 text-destructive" /> :
           <MailX className="w-6 h-6 text-muted-foreground" />}
        </div>
        {state === "loading" && <p className="text-muted-foreground">Indlæser…</p>}
        {state === "valid" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Afmeld nyhedsbrev</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Bekræft at du vil afmelde {email && <strong>{email}</strong>} fra alle e-mails fra ScanIQ.
            </p>
            <Button onClick={confirm} className="w-full">Bekræft afmelding</Button>
          </>
        )}
        {state === "confirming" && <p>Afmelder…</p>}
        {state === "done" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Afmeldt</h1>
            <p className="text-sm text-muted-foreground">Du modtager ikke flere e-mails fra os.</p>
          </>
        )}
        {state === "already" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Allerede afmeldt</h1>
            <p className="text-sm text-muted-foreground">Denne adresse er allerede afmeldt.</p>
          </>
        )}
        {state === "invalid" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Ugyldigt link</h1>
            <p className="text-sm text-muted-foreground">Linket er udløbet eller forkert.</p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Noget gik galt</h1>
            <p className="text-sm text-muted-foreground">{error || "Prøv igen senere."}</p>
          </>
        )}
      </div>
    </div>
  );
}
