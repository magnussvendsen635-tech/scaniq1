import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKStore, type Goal, type Activity } from "@/store/useKStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { LANGUAGES } from "@/data/languages";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Settings() {
  const nav = useNavigate();
  const { user, updateUser, language, setLanguage } = useKStore();
  const [form, setForm] = useState(user);
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  const save = () => {
    updateUser(form);
    toast.success("Saved", { description: "Your plan is updated everywhere." });
    nav("/profile");
  };

  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="space-y-3">
        <Section title="Body">
          <Field label="Weight (kg)">
            <NumInput value={form.weight} onChange={(n) => set("weight", n)} />
          </Field>
        </Section>

        <Section title="Goal">
          <Field label="Objective">
            <SelectInput
              value={form.goal}
              onChange={(v) => set("goal", v as Goal)}
              options={[
                { value: "lose", label: "Lose Fat" },
                { value: "gain", label: "Gain Muscle" },
                { value: "maintain", label: "Maintain" },
              ]}
            />
          </Field>
          <Field label="Activity level">
            <SelectInput
              value={form.activity}
              onChange={(v) => set("activity", v as Activity)}
              options={[
                { value: "sedentary", label: "Sedentary" },
                { value: "light", label: "Light" },
                { value: "moderate", label: "Moderate" },
                { value: "active", label: "Active" },
                { value: "athlete", label: "Athlete" },
              ]}
            />
          </Field>
        </Section>

        <Section title="Daily targets">
          <Field label="Calories (kcal)">
            <NumInput value={form.calories} onChange={(n) => set("calories", n)} />
          </Field>
          <Field label="Protein (g)">
            <NumInput value={form.protein} onChange={(n) => set("protein", n)} />
          </Field>
          <Field label="Carbs (g)">
            <NumInput value={form.carbs} onChange={(n) => set("carbs", n)} />
          </Field>
          <Field label="Fat (g)">
            <NumInput value={form.fat} onChange={(n) => set("fat", n)} />
          </Field>
        </Section>

        <Button
          onClick={save}
          className="w-full h-14 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-90 mt-3"
        >
          Save Changes
        </Button>
      </div>
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
