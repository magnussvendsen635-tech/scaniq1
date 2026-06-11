import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKStore, computePlan, type Goal, type Activity, type Pace, type Frequency, type Diet, type Sex } from "@/store/useKStore";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { LanguagePicker } from "@/components/LanguagePicker";
import { translate, type TKey } from "@/i18n/translations";
import { Flame, TrendingDown, TrendingUp, Activity as ActivityIcon, ArrowRight, ArrowLeft, ChevronRight, Loader2, Check, Zap, Scale, Leaf, Heart, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isHealthAvailable, requestHealthPermissions } from "@/lib/health";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

const TOTAL_QUESTIONS = 14; // 0=lang, 1=name, 2=sex, ... 12=AppleHealth, 13=Acquisition survey

const SURVEY_OPTIONS: { id: string; key: TKey }[] = [
  { id: "tiktok", key: "survey.tiktok" },
  { id: "instagram", key: "survey.instagram" },
  { id: "ai_search", key: "survey.ai_search" },
  { id: "influencer", key: "survey.influencer" },
  { id: "friends", key: "survey.friends" },
  { id: "app_store", key: "survey.app_store" },
  { id: "google", key: "survey.google" },
  { id: "other", key: "survey.other" },
];

export default function Onboarding() {
  const nav = useNavigate();
  const { user, updateUser, setOnboarded, language, setLanguage } = useKStore();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState(language);
  const tt = (k: TKey) => translate(lang, k);
  const [name, setName] = useState(user.name ?? "");
  const [goal, setGoal] = useState<Goal>(user.goal);
  const [sex, setSex] = useState<Sex>(user.sex);
  const [age, setAge] = useState(user.age);
  const [weight, setWeight] = useState(user.weight);
  const [targetWeight, setTargetWeight] = useState(user.targetWeight);
  const [height, setHeight] = useState(user.height);
  const [activity, setActivity] = useState<Activity>(user.activity);
  const [pace, setPace] = useState<Pace>(user.pace);
  const [frequency, setFrequency] = useState<Frequency>(user.frequency);
  const [diet, setDiet] = useState<Diet>(user.diet);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [plan, setPlan] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);

  // Sync language live so other components reading from store update.
  useEffect(() => { setLanguage(lang); }, [lang, setLanguage]);

  const goals: { id: Goal; titleKey: TKey; subKey: TKey; Icon: any }[] = [
    { id: "lose", titleKey: "goal.lose", subKey: "onboarding.goal_lose_sub", Icon: TrendingDown },
    { id: "gain", titleKey: "goal.gain", subKey: "onboarding.goal_gain_sub", Icon: TrendingUp },
    { id: "maintain", titleKey: "goal.maintain", subKey: "onboarding.goal_maintain_sub", Icon: ActivityIcon },
  ];

  const activities: { id: Activity; titleKey: TKey; subKey: TKey }[] = [
    { id: "sedentary", titleKey: "activity.sedentary", subKey: "onboarding.act_sedentary_sub" },
    { id: "light", titleKey: "activity.light", subKey: "onboarding.act_light_sub" },
    { id: "moderate", titleKey: "activity.moderate", subKey: "onboarding.act_moderate_sub" },
    { id: "active", titleKey: "activity.active", subKey: "onboarding.act_active_sub" },
    { id: "athlete", titleKey: "activity.athlete", subKey: "onboarding.act_athlete_sub" },
  ];

  const paces: { id: Pace; titleKey: TKey; subKey: TKey; Icon: any }[] = [
    { id: "aggressive", titleKey: "onboarding.pace_aggressive", subKey: "onboarding.pace_aggressive_sub", Icon: Zap },
    { id: "balanced", titleKey: "onboarding.pace_balanced", subKey: "onboarding.pace_balanced_sub", Icon: Scale },
    { id: "slow", titleKey: "onboarding.pace_slow", subKey: "onboarding.pace_slow_sub", Icon: ActivityIcon },
  ];

  const frequencies: { id: Frequency; titleKey: TKey; subKey: TKey }[] = [
    { id: "0-1", titleKey: "onboarding.freq_low", subKey: "onboarding.freq_low_sub" },
    { id: "2-3", titleKey: "onboarding.freq_mid", subKey: "onboarding.freq_mid_sub" },
    { id: "4+", titleKey: "onboarding.freq_high", subKey: "onboarding.freq_high_sub" },
  ];

  const diets: { id: Diet; titleKey: TKey; subKey: TKey; Icon: any }[] = [
    { id: "none", titleKey: "onboarding.diet_none", subKey: "onboarding.diet_none_sub", Icon: ActivityIcon },
    { id: "high-protein", titleKey: "onboarding.diet_protein", subKey: "onboarding.diet_protein_sub", Icon: TrendingUp },
    { id: "low-carb", titleKey: "onboarding.diet_lowcarb", subKey: "onboarding.diet_lowcarb_sub", Icon: TrendingDown },
    { id: "vegetarian", titleKey: "onboarding.diet_veg", subKey: "onboarding.diet_veg_sub", Icon: Leaf },
  ];

  const next = () => setStep((s) => s + 1);

  const generate = async () => {
    setStep(TOTAL_QUESTIONS);
    const msgs: TKey[] = ["onboarding.loading_1", "onboarding.loading_2", "onboarding.loading_3"];
    for (const m of msgs) {
      setLoadingMsg(tt(m));
      await new Promise((r) => setTimeout(r, 900));
    }
    const p = computePlan({ weight, height, goal, activity, sex, age });
    setPlan(p);
    setStep(TOTAL_QUESTIONS + 1);
  };

  const finish = () => {
    if (!plan) return;
    setLanguage(lang);
    updateUser({ name: name.trim(), age, weight, targetWeight, height, goal, sex, activity, pace, frequency, diet, ...plan });
    setOnboarded(true);
    nav("/premium", { replace: true });
  };

  const progressIndex = Math.min(step + 1, TOTAL_QUESTIONS);

  return (
    <div className="min-h-screen w-full max-w-md mx-auto px-6 pt-12 pb-10 flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <Logo size={36} withText />
        <span className="text-xs text-muted-foreground tracking-widest">{progressIndex} / {TOTAL_QUESTIONS}</span>
      </header>

      <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden mb-10">
        <div
          className="h-full bg-gradient-primary transition-all duration-500"
          style={{ width: `${(progressIndex / TOTAL_QUESTIONS) * 100}%` }}
        />
      </div>

      <div className="flex-1 animate-fade-in" key={step}>
        {step === 0 && (
          <Step title={tt("onboarding.choose_language")} sub={tt("onboarding.choose_language_sub")}>
            <LanguagePicker value={lang} onChange={setLang} />
          </Step>
        )}

        {step === 1 && (
          <Step title="Hvad hedder du?" sub="Så kan vi hilse personligt på dig hver dag.">
            <div className="k-card p-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dit fornavn"
                autoFocus
                maxLength={30}
                className="bg-transparent w-full text-center text-3xl font-semibold tracking-tight outline-none k-gradient-text placeholder:text-muted-foreground/40 placeholder:font-normal"
              />
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step title="Hvad er dit køn?" sub="Vi bruger dette til at beregne præcise kalorier og makroer for dig.">
            <div className="space-y-3">
              <SelectCard active={sex === "male"} onClick={() => setSex("male")} title="Mand" sub="Beregner BMR for mandlig fysiologi" Icon={UserIcon} />
              <SelectCard active={sex === "female"} onClick={() => setSex("female")} title="Kvinde" sub="Beregner BMR for kvindelig fysiologi" Icon={UserIcon} />
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step title={tt("onboarding.q_goal")} sub={tt("onboarding.q_goal_sub")}>
            <div className="space-y-3">
              {goals.map(({ id, titleKey, subKey, Icon }) => (
                <SelectCard key={id} active={goal === id} onClick={() => setGoal(id)} title={tt(titleKey)} sub={tt(subKey)} Icon={Icon} />
              ))}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step title={tt("onboarding.q_age")} sub={tt("onboarding.q_age_sub")}>
            <NumberInput value={age} onChange={setAge} suffix={tt("onboarding.suffix_yrs")} min={13} max={100} />
          </Step>
        )}

        {step === 5 && (
          <Step title={tt("onboarding.q_height")} sub={tt("onboarding.q_height_sub")}>
            <NumberInput value={height} onChange={setHeight} suffix={tt("onboarding.suffix_cm")} min={120} max={230} />
          </Step>
        )}

        {step === 6 && (
          <Step title={tt("onboarding.q_weight")} sub={tt("onboarding.q_weight_sub")}>
            <NumberInput value={weight} onChange={setWeight} suffix={tt("onboarding.suffix_kg")} min={30} max={250} />
          </Step>
        )}

        {step === 7 && (
          <Step title={tt("onboarding.q_target")} sub={tt("onboarding.q_target_sub")}>
            <NumberInput value={targetWeight} onChange={setTargetWeight} suffix={tt("onboarding.suffix_kg")} min={30} max={250} />
          </Step>
        )}

        {step === 8 && (
          <Step title={tt("onboarding.q_pace")} sub={tt("onboarding.q_pace_sub")}>
            <div className="space-y-3">
              {paces.map(({ id, titleKey, subKey, Icon }) => (
                <SelectCard key={id} active={pace === id} onClick={() => setPace(id)} title={tt(titleKey)} sub={tt(subKey)} Icon={Icon} />
              ))}
            </div>
          </Step>
        )}

        {step === 9 && (
          <Step title={tt("onboarding.q_freq")} sub={tt("onboarding.q_freq_sub")}>
            <div className="space-y-2.5">
              {frequencies.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFrequency(f.id)}
                  className={cn(
                    "k-card k-tap w-full p-4 flex items-center justify-between text-left",
                    frequency === f.id && "ring-2 ring-primary"
                  )}
                >
                  <div>
                    <div className="font-medium">{tt(f.titleKey)}</div>
                    <div className="text-xs text-muted-foreground">{tt(f.subKey)}</div>
                  </div>
                  {frequency === f.id && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 10 && (
          <Step title={tt("onboarding.q_diet")} sub={tt("onboarding.q_diet_sub")}>
            <div className="space-y-3">
              {diets.map(({ id, titleKey, subKey, Icon }) => (
                <SelectCard key={id} active={diet === id} onClick={() => setDiet(id)} title={tt(titleKey)} sub={tt(subKey)} Icon={Icon} />
              ))}
            </div>
          </Step>
        )}

        {step === 11 && (
          <Step title={tt("onboarding.q_activity")} sub={tt("onboarding.q_activity_sub")}>
            <div className="space-y-2.5">
              {activities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActivity(a.id)}
                  className={cn(
                    "k-card k-tap w-full p-4 flex items-center justify-between text-left",
                    activity === a.id && "ring-2 ring-primary"
                  )}
                >
                  <div>
                    <div className="font-medium">{tt(a.titleKey)}</div>
                    <div className="text-xs text-muted-foreground">{tt(a.subKey)}</div>
                  </div>
                  {activity === a.id && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 12 && (
          <Step title={tt("onboarding.health_title")} sub={tt("onboarding.health_sub")}>
            <div className="k-card p-6 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-soft flex items-center justify-center">
                <Heart className="w-10 h-10 text-primary-glow" fill="currentColor" />
              </div>
              <Button
                size="lg"
                className="w-full h-14 rounded-2xl bg-[hsl(14_100%_55%)] hover:bg-[hsl(14_100%_50%)] text-white text-base font-bold shadow-[0_8px_20px_-4px_hsl(14_100%_55%/0.5)] border-0"
                onClick={async () => {
                  if (!isHealthAvailable()) {
                    toast.info(tt("onboarding.health_later"), { description: "Apple Health er kun tilgængelig i den native app." });
                    generate();
                    return;
                  }
                  const ok = await requestHealthPermissions();
                  if (ok) toast.success(tt("settings.health_connected"));
                  generate();
                }}
              >
                <Heart className="w-5 h-5 mr-2" fill="currentColor" />
                {tt("onboarding.health_connect")}
              </Button>
              <button
                onClick={generate}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                {tt("onboarding.health_later")}
              </button>
            </div>
          </Step>
        )}

        {step === TOTAL_QUESTIONS && (
          <div className="flex flex-col items-center justify-center text-center pt-24 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-primary opacity-20 blur-2xl absolute inset-0" />
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <div className="text-lg font-medium animate-fade-in" key={loadingMsg}>{loadingMsg}</div>
            <div className="text-sm text-muted-foreground">{tt("onboarding.personalizing")}</div>
          </div>
        )}

        {step === TOTAL_QUESTIONS + 1 && plan && (
          <Step title={tt("onboarding.plan_ready")} sub={tt("onboarding.plan_ready_sub")}>
            <div className="grid grid-cols-2 gap-3">
              <PlanCard label={tt("settings.calories")} value={plan.calories} unit={tt("common.kcal")} big />
              <PlanCard label={tt("home.protein")} value={plan.protein} unit="g" />
              <PlanCard label={tt("home.carbs")} value={plan.carbs} unit="g" />
              <PlanCard label={tt("home.fat")} value={plan.fat} unit="g" />
            </div>
          </Step>
        )}
      </div>

      <div className="pt-8 flex gap-3">
        {step < TOTAL_QUESTIONS && step > 0 && step !== 12 && (
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-2xl px-5 text-base font-semibold"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            aria-label={tt("common.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {step < TOTAL_QUESTIONS && step !== 12 && (
          <Button
            size="lg"
            className="group flex-1 h-14 rounded-2xl bg-[hsl(14_100%_55%)] hover:bg-[hsl(14_100%_50%)] text-white text-base font-bold shadow-[0_8px_20px_-4px_hsl(14_100%_55%/0.5)] border-0"
            onClick={next}
          >
            <span className="text-white">{tt("common.continue")}</span>
            <span className="ml-2 inline-flex items-center -space-x-2 transition-transform group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.75} />
              <ChevronRight className="w-5 h-5 text-white opacity-60" strokeWidth={2.75} />
            </span>
          </Button>
        )}
        {step === TOTAL_QUESTIONS + 1 && (
          <Button
            size="lg"
            className="w-full h-14 rounded-2xl bg-gradient-primary hover:opacity-90 text-base font-semibold shadow-glow"
            onClick={finish}
          >
            {tt("onboarding.start_training")}
            <Flame className="ml-2 w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

const Step = ({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) => (
  <div>
    <h1 className="text-3xl font-semibold tracking-tight mb-2">{title}</h1>
    <p className="text-muted-foreground mb-8">{sub}</p>
    {children}
  </div>
);

const SelectCard = ({
  active,
  onClick,
  title,
  sub,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  Icon: any;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "k-card k-tap w-full p-5 flex items-center gap-4 text-left",
      active && "ring-2 ring-primary shadow-glow"
    )}
  >
    <div className="w-12 h-12 rounded-2xl bg-gradient-soft flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary-glow" />
    </div>
    <div className="flex-1">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground">{sub}</div>
    </div>
    {active && <Check className="w-5 h-5 text-primary" />}
  </button>
);

const NumberInput = ({ value, onChange, suffix, min, max }: { value: number; onChange: (n: number) => void; suffix: string; min: number; max: number }) => (
  <div className="k-card p-8 flex flex-col items-center">
    <div className="flex items-baseline gap-2 mb-6">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent w-32 text-center text-6xl font-semibold tracking-tight outline-none k-gradient-text"
      />
      <span className="text-2xl text-muted-foreground">{suffix}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[hsl(var(--primary))]"
    />
  </div>
);

const PlanCard = ({ label, value, unit, big = false }: { label: string; value: number; unit: string; big?: boolean }) => (
  <div className={cn("k-card p-5", big && "col-span-2 bg-gradient-soft")}>
    <div className="text-xs text-muted-foreground tracking-widest uppercase">{label}</div>
    <div className="mt-2 flex items-baseline gap-1.5">
      <span className={cn("font-semibold tracking-tight", big ? "text-5xl k-gradient-text" : "text-3xl")}>{value}</span>
      <span className="text-sm text-muted-foreground">{unit}</span>
    </div>
  </div>
);
