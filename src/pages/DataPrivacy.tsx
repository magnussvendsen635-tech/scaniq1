import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Download, Trash2, FileText, Shield, Cookie } from "lucide-react";
import { isNativeShell } from "@/lib/nativePlatform";
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
      a.download = `scaniq-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded");
    } catch {
      toast.error("Could not export your data");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    if (!confirm("Final warning: all your data will be permanently deleted. Continue?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Your account has been deleted");
      await signOut();
      nav("/auth", { replace: true });
    } catch {
      toast.error("Could not delete automatically — please contact support");
    } finally {
      setDeleting(false);
    }
  };

  const resetCookies = () => {
    try {
      localStorage.removeItem(CONSENT_KEY);
      toast.success("Cookie choice reset — the banner will show again");
    } catch {
      toast.error("Could not reset");
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
        <h1 className="text-2xl font-semibold tracking-tight">Data & privacy</h1>
      </header>

      <p className="text-xs text-muted-foreground mb-4 px-1 leading-relaxed">
        We follow GDPR. You have full control of your data — view, export or delete it at any time.
      </p>

      <Section title="Legal">
        <Row Icon={Shield} title="Privacy policy" sub="What data we store and why" onClick={() => nav("/privacy")} />
        <Row Icon={FileText} title="Terms of service" sub="User terms and limitation of liability" onClick={() => nav("/terms")} />
        {!isNativeShell() && (
          <Row Icon={Cookie} title="Cookie settings" sub="Reset your cookie choice" onClick={resetCookies} />
        )}
      </Section>

      <Section title="Your data (GDPR)">
        <button onClick={handleExport} disabled={exporting} className="row disabled:opacity-50">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-soft">
            <Download className="w-4.5 h-4.5 text-primary-glow" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">Request data export</div>
            <div className="text-xs text-muted-foreground">
              Download all your data as JSON (data portability)
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="row hover:bg-destructive/10 disabled:opacity-50">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-destructive/15">
            <Trash2 className="w-4.5 h-4.5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-destructive">Delete account</div>
            <div className="text-xs text-muted-foreground">
              Permanently delete your account and all data
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
