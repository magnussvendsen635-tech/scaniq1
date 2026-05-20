import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Download, Trash2, FileText, Shield, Cookie } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CONSENT_KEY = "scaniq_cookie_consent_v1";

export default function DataPrivacy() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const tables = [
        "profiles",
        "user_settings",
        "meals",
        "favorites",
        "workouts",
        "weights",
        "water_logs",
        "reminder_preferences",
        "subscriptions",
      ] as const;
      const data: Record<string, any> = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email },
      };
      for (const t of tables) {
        const col = t === "profiles" ? "id" : "user_id";
        const { data: rows } = await (supabase.from(t as any).select("*").eq(col, user.id) as any);
        data[t] = rows ?? [];
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kcally-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dine data er downloadet");
    } catch {
      toast.error("Kunne ikke eksportere data");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("Er du sikker på, at du vil slette din konto? Dette kan ikke fortrydes.")) return;
    if (!confirm("Sidste advarsel: Alle dine data slettes permanent. Fortsæt?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Din konto er slettet");
      await signOut();
      nav("/auth", { replace: true });
    } catch {
      toast.error("Kunne ikke slette automatisk – kontakt support");
    } finally {
      setDeleting(false);
    }
  };

  const resetCookies = () => {
    try {
      localStorage.removeItem(CONSENT_KEY);
      toast.success("Cookie-valg nulstillet — banneret vises igen");
    } catch {
      toast.error("Kunne ikke nulstille");
    }
  };

  return (
    <div className="k-page pb-32">
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Data & privatliv</h1>
      </header>

      <p className="text-xs text-muted-foreground mb-4 px-1 leading-relaxed">
        Vi følger GDPR. Du har fuld kontrol over dine data — se, eksportér eller slet dem når som helst.
      </p>

      <Section title="Juridisk">
        <Row Icon={Shield} title="Privatlivspolitik" sub="Hvilke data vi gemmer & hvorfor" onClick={() => nav("/privacy")} />
        <Row Icon={FileText} title="Servicevilkår" sub="Brugervilkår & ansvarsbegrænsning" onClick={() => nav("/terms")} />
        <Row Icon={Cookie} title="Cookie-indstillinger" sub="Nulstil dit cookie-valg" onClick={resetCookies} />
      </Section>

      <Section title="Dine data (GDPR)">
        <button onClick={handleExport} disabled={exporting} className="row disabled:opacity-50">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-soft">
            <Download className="w-4.5 h-4.5 text-primary-glow" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Anmod om data-eksport</div>
            <div className="text-xs text-muted-foreground">
              Download alle dine data som JSON (dataportabilitet)
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="row hover:bg-destructive/10 disabled:opacity-50">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-destructive/15">
            <Trash2 className="w-4.5 h-4.5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-destructive">Slet konto</div>
            <div className="text-xs text-muted-foreground">
              Permanent sletning af konto & alle data
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </Section>
    </div>
  );
}

const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="mb-3">
    {title && (
      <div className="px-2 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
    )}
    <div className="k-card divide-y divide-border/60 overflow-hidden [&_.row]:w-full [&_.row]:p-4 [&_.row]:flex [&_.row]:items-center [&_.row]:gap-4 [&_.row]:hover:bg-surface-2 [&_.row]:transition-colors">
      {children}
    </div>
  </div>
);

const Row = ({
  Icon,
  title,
  sub,
  onClick,
}: {
  Icon: any;
  title: string;
  sub: string;
  onClick: () => void;
}) => (
  <button onClick={onClick} className="row">
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-soft">
      <Icon className="w-4.5 h-4.5 text-primary-glow" />
    </div>
    <div className="flex-1 text-left">
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground" />
  </button>
);
