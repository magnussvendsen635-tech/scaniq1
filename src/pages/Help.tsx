import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Mail, Trash2, Bug, HelpCircle, Activity, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";

const SUPPORT_EMAIL = "scaniqapp1@gmail.com";

const FAQ_KEYS: { q: TKey; a: TKey }[] = [
  { q: "help.faq_q1", a: "help.faq_a1" },
  { q: "help.faq_q2", a: "help.faq_a2" },
  { q: "help.faq_q3", a: "help.faq_a3" },
  { q: "help.faq_q4", a: "help.faq_a4" },
  { q: "help.faq_q5", a: "help.faq_a5" },
  { q: "help.faq_q6", a: "help.faq_a6" },
];

export default function Help() {
  const nav = useNavigate();
  const t = useT();
  const { user, signOut } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const tables = ["profiles", "user_settings", "meals", "favorites", "workouts", "weights", "water_logs", "reminder_preferences", "subscriptions"] as const;
      const data: Record<string, any> = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email },
      };
      for (const tbl of tables) {
        const col = tbl === "profiles" ? "id" : "user_id";
        const { data: rows } = await (supabase.from(tbl as any).select("*").eq(col, user.id) as any);
        data[tbl] = rows ?? [];
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scaniq-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("help.export_done"));
    } catch {
      toast.error(t("help.export_failed"));
    } finally {
      setExporting(false);
    }
  };

  const mailto = (subject: string, body = "") =>
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(t("help.confirm_delete_1"))) return;
    if (!confirm(t("help.confirm_delete_2"))) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success(t("help.deleted"));
      await signOut();
      nav("/auth", { replace: true });
    } catch {
      const body = t("help.delete_email_body")
        .replace("{id}", user.id)
        .replace("{email}", user.email ?? "");
      window.location.href = mailto(t("help.delete_email_subject"), body);
      toast.error(t("help.delete_failed_email"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="k-page pb-32">
      <Seo
        title={`${t("help.title")} — ScanIQ`}
        description="ScanIQ help, FAQ, privacy and account management."
        path="/help"
      />
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} aria-label={t("common.back")} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t("help.title")}</h1>
      </header>

      <div className="mb-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
        <b className="block mb-1 text-amber-300">{t("help.disclaimer")}</b>
        {t("help.disclaimer_body")}
      </div>

      <Section>
        <a href={mailto(t("help.support_subject"))} className="row">
          <Icon Cmp={Mail} />
          <div className="flex-1">
            <div className="font-medium">{t("help.contact_support")}</div>
            <div className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
        <a href={mailto(t("help.bug_subject"), t("help.bug_body"))} className="row">
          <Icon Cmp={Bug} />
          <div className="flex-1">
            <div className="font-medium">{t("help.report_bug")}</div>
            <div className="text-xs text-muted-foreground">{t("help.report_bug_sub")}</div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
      </Section>

      <Section title={t("help.service_status")}>
        <div className="row !cursor-default">
          <Icon Cmp={Activity} />
          <div className="flex-1">
            <div className="font-medium">{t("help.status_ok")}</div>
            <div className="text-xs text-muted-foreground">{t("help.status_ok_sub")}</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </Section>

      <Section title={t("help.faq")}>
        {FAQ_KEYS.map((f, i) => (
          <button key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left">
            <div className="row">
              <Icon Cmp={HelpCircle} />
              <div className="flex-1">
                <div className="font-medium text-sm">{t(f.q)}</div>
                {openFaq === i && <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{t(f.a)}</div>}
              </div>
              <ChevronDown className={"w-4 h-4 text-muted-foreground transition-transform " + (openFaq === i ? "rotate-180" : "")} />
            </div>
          </button>
        ))}
      </Section>

      <Section title={t("help.about")}>
        <div className="px-4 py-4 space-y-2">
          <div className="font-medium">ScanIQ</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("help.about_body")}</p>
          <div className="text-xs text-muted-foreground">{t("help.version")}</div>
          <button onClick={() => nav("/privacy")} className="text-xs text-primary-glow underline">{t("help.privacy_link")}</button>
        </div>
      </Section>

      <Section title={t("help.account")}>
        <button onClick={handleExport} disabled={exporting} className="row disabled:opacity-50">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-soft">
            <Download className="w-4.5 h-4.5 text-primary-glow" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">{t("help.export")}</div>
            <div className="text-xs text-muted-foreground">{t("help.export_sub")}</div>
          </div>
        </button>
        <button onClick={handleDelete} disabled={deleting} className="row hover:bg-destructive/10 disabled:opacity-50">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-destructive/15">
            <Trash2 className="w-4.5 h-4.5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-destructive">{t("help.delete")}</div>
            <div className="text-xs text-muted-foreground">{t("help.delete_sub")}</div>
          </div>
        </button>
      </Section>
    </div>
  );
}

const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="mb-3">
    {title && <div className="px-2 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>}
    <div className="k-card divide-y divide-border/60 overflow-hidden [&_.row]:w-full [&_.row]:p-4 [&_.row]:flex [&_.row]:items-center [&_.row]:gap-4 [&_.row]:hover:bg-surface-2 [&_.row]:transition-colors">
      {children}
    </div>
  </div>
);

const Icon = ({ Cmp }: { Cmp: any }) => (
  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-soft">
    <Cmp className="w-4.5 h-4.5 text-primary-glow" />
  </div>
);
