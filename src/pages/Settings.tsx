import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKStore, type Goal, type Activity } from "@/store/useKStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Shield } from "lucide-react";
import { toast } from "sonner";
import { LANGUAGES } from "@/data/languages";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/i18n/useT";
import { translate } from "@/i18n/translations";
import { HealthSyncCard } from "@/components/HealthSyncCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const nav = useNavigate();
  const t = useT();
  const { user: authUser } = useAuth();
  const { user, updateUser, language, setLanguage, calorieAccuracy, setCalorieAccuracy } = useKStore();
  const [form, setForm] = useState(user);
  const [langOpen, setLangOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    let cancelled = false;
    if (!authUser) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: authUser.id, _role: "admin" }).then(({ data, error }) => {
      if (!cancelled) setIsAdmin(!error && data === true);
    });
    return () => { cancelled = true; };
  }, [authUser]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  const save = () => {
    updateUser(form);
    toast.success(t("settings.saved"), { description: t("settings.saved_desc") });
    nav("/profile");
  };

  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
      </header>

      <div className="space-y-3">
        <Section title={t("settings.app")}>
          <button
            onClick={() => setLangOpen(true)}
            className="w-full px-5 py-3 flex items-center justify-between gap-4 hover:bg-surface-2 transition-colors text-left"
          >
            <span className="text-sm">{t("settings.language")}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-lg leading-none">{currentLang.flag}</span>
              <span>{currentLang.native}</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </Section>

        <Section title={t("settings.body")}>
          <Field label={t("settings.weight_kg")}>
            <NumInput value={form.weight} onChange={(n) => set("weight", n)} />
          </Field>
        </Section>

        <Section title={t("settings.health")}>
          <div className="px-4 py-3">
            <HealthSyncCard />
          </div>
        </Section>

        <Section title={t("settings.goal")}>
          <Field label={t("settings.objective")}>
            <SelectInput
              value={form.goal}
              onChange={(v) => set("goal", v as Goal)}
              options={[
                { value: "lose", label: t("goal.lose") },
                { value: "gain", label: t("goal.gain") },
                { value: "maintain", label: t("goal.maintain") },
              ]}
            />
          </Field>
          <Field label={t("settings.activity_level")}>
            <SelectInput
              value={form.activity}
              onChange={(v) => set("activity", v as Activity)}
              options={[
                { value: "sedentary", label: t("activity.sedentary") },
                { value: "light", label: t("activity.light") },
                { value: "moderate", label: t("activity.moderate") },
                { value: "active", label: t("activity.active") },
                { value: "athlete", label: t("activity.athlete") },
              ]}
            />
          </Field>
        </Section>

        <Section title={t("settings.daily_targets")}>
          <Field label={t("settings.calories")}>
            <NumInput value={form.calories} onChange={(n) => set("calories", n)} />
          </Field>
          <Field label={t("settings.protein")}>
            <NumInput value={form.protein} onChange={(n) => set("protein", n)} />
          </Field>
          <Field label={t("settings.carbs")}>
            <NumInput value={form.carbs} onChange={(n) => set("carbs", n)} />
          </Field>
          <Field label={t("settings.fat")}>
            <NumInput value={form.fat} onChange={(n) => set("fat", n)} />
          </Field>
        </Section>

        <Section title={t("settings.scan_accuracy")}>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t("settings.cal_adjust")}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t("settings.cal_adjust_sub")}
                </div>
              </div>
              <div className="text-sm font-semibold tabular-nums">
                {Math.round(calorieAccuracy * 100)}%
              </div>
            </div>
            <input
              type="range"
              min={80}
              max={150}
              step={1}
              value={Math.round(calorieAccuracy * 100)}
              onChange={(e) => setCalorieAccuracy(Number(e.target.value) / 100)}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>80%</span>
              <span>100%</span>
              <span>115% ({t("settings.recommended")})</span>
              <span>150%</span>
            </div>
          </div>
        </Section>

        <Button
          onClick={save}
          className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90 mt-3"
        >
          {t("settings.save_changes")}
        </Button>

        <Section title={t("settings.about")}>
          {isAdmin && (
            <button
              onClick={() => nav("/admin")}
              className="w-full px-5 py-3 flex items-center justify-between gap-4 hover:bg-surface-2 transition-colors text-left"
            >
              <span className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-glow" />
                {t("settings.admin_panel")}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => nav("/data-privacy")}
            className="w-full px-5 py-3 flex items-center justify-between gap-4 hover:bg-surface-2 transition-colors text-left"
          >
            <span className="text-sm">{t("settings.data_privacy")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => nav("/privacy")}
            className="w-full px-5 py-3 flex items-center justify-between gap-4 hover:bg-surface-2 transition-colors text-left"
          >
            <span className="text-sm">{t("settings.privacy_policy")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => nav("/terms")}
            className="w-full px-5 py-3 flex items-center justify-between gap-4 hover:bg-surface-2 transition-colors text-left"
          >
            <span className="text-sm">{t("settings.terms_of_service")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="px-5 py-3 flex items-center justify-between gap-4">
            <span className="text-sm">{t("settings.developer")}</span>
            <span className="text-sm text-muted-foreground">Kinetex Intelligens</span>
          </div>
        </Section>

      </div>

      <Dialog open={langOpen} onOpenChange={setLangOpen}>
        <DialogContent className="max-w-md p-0 bg-card border-border/60">
          <DialogHeader className="px-5 pt-5 pb-2">
            <DialogTitle>{t("settings.choose_language")}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <LanguagePicker
              value={language}
              onChange={(c) => {
                setLanguage(c);
                setLangOpen(false);
                toast.success(translate(c, "settings.language_updated"));
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="k-card overflow-hidden">
    <div className="px-5 pt-4 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
    <div className="divide-y divide-border/60">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="px-5 py-3 flex items-center justify-between gap-4">
    <span className="text-sm">{label}</span>
    <div className="w-40">{children}</div>
  </div>
);

const NumInput = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="w-full h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-right text-sm outline-none focus:ring-2 focus:ring-primary/60"
  />
);

const SelectInput = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-right text-sm outline-none focus:ring-2 focus:ring-primary/60"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);
