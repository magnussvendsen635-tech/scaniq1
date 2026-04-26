import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKStore, computePlan, type Goal, type Activity, type Pace, type Frequency, type Diet } from "@/store/useKStore";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Flame, TrendingDown, TrendingUp, Activity as ActivityIcon, ArrowRight, Loader2, Check, Zap, Scale, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_QUESTIONS = 10; // steps 0..9 (0 = language)

const goals: { id: Goal; title: string; sub: string; Icon: any }[] = [
  { id: "lose", title: "Lose Fat", sub: "Cut calories smartly", Icon: TrendingDown },
  { id: "gain", title: "Gain Muscle", sub: "Build lean mass", Icon: TrendingUp },
  { id: "maintain", title: "Maintain", sub: "Stay in shape", Icon: ActivityIcon },
];

const activities: { id: Activity; title: string; sub: string }[] = [
  { id: "sedentary", title: "Sedentary", sub: "Little / no exercise" },
  { id: "light", title: "Light", sub: "1–3 days / week" },
  { id: "moderate", title: "Moderate", sub: "3–5 days / week" },
  { id: "active", title: "Active", sub: "6–7 days / week" },
  { id: "athlete", title: "Athlete", sub: "2x daily training" },
];

const paces: { id: Pace; title: string; sub: string; Icon: any }[] = [
  { id: "aggressive", title: "Aggressive", sub: "Fastest results", Icon: Zap },
  { id: "balanced", title: "Balanced", sub: "Steady & sustainable", Icon: Scale },
  { id: "slow", title: "Slow & steady", sub: "Easiest to maintain", Icon: ActivityIcon },
];

const frequencies: { id: Frequency; title: string; sub: string }[] = [
  { id: "0-1", title: "0–1 times / week", sub: "Just getting started" },
  { id: "2-3", title: "2–3 times / week", sub: "Casual training" },
  { id: "4+", title: "4+ times / week", sub: "Consistent athlete" },
];

const diets: { id: Diet; title: string; sub: string; Icon: any }[] = [
  { id: "none", title: "No preference", sub: "I eat everything", Icon: ActivityIcon },
  { id: "high-protein", title: "High protein", sub: "Muscle-focused", Icon: TrendingUp },
  { id: "low-carb", title: "Low carb", sub: "Cut the carbs", Icon: TrendingDown },
  { id: "vegetarian", title: "Vegetarian", sub: "Plant-based", Icon: Leaf },
];

export default function Onboarding() {
  const nav = useNavigate();
  const { user, updateUser, setOnboarded } = useKStore();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>(user.goal);
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

  const next = () => setStep((s) => s + 1);

  const generate = async () => {
    setStep(TOTAL_QUESTIONS); // loading step
    const msgs = ["Analyzing your answers…", "Calibrating your metabolism…", "Creating your plan…"];
    for (const m of msgs) {
      setLoadingMsg(m);
      await new Promise((r) => setTimeout(r, 900));
    }
    const p = computePlan({ weight, height, goal, activity });
    setPlan(p);
    setStep(TOTAL_QUESTIONS + 1); // plan step
  };

  const finish = () => {
    if (!plan) return;
    updateUser({ age, weight, targetWeight, height, goal, activity, pace, frequency, diet, ...plan });
    setOnboarded(true);
    nav("/", { replace: true });
  };

  const isLastQuestion = step === TOTAL_QUESTIONS - 1;
  const progressIndex = Math.min(step + 1, TOTAL_QUESTIONS);

  return (
    <div className="min-h-screen w-full max-w-md mx-auto px-6 pt-12 pb-10 flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <Logo size={36} withText />
        <span className="text-xs text-muted-foreground tracking-widest">{progressIndex} / {TOTAL_QUESTIONS}</span>
      </header>

      {/* progress bar */}
      <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden mb-10">
        <div
          className="h-full bg-gradient-primary transition-all duration-500"
          style={{ width: `${(progressIndex / TOTAL_QUESTIONS) * 100}%` }}
        />
      </div>

      <div className="flex-1 animate-fade-in" key={step}>
        {step === 0 && (
          <Step title="What's your goal?" sub="We'll tune your plan around it.">
            <div className="space-y-3">
              {goals.map(({ id, title, sub, Icon }) => (
                <SelectCard key={id} active={goal === id} onClick={() => setGoal(id)} title={title} sub={sub} Icon={Icon} />
              ))}
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step title="What's your age?" sub="Helps us personalize your metabolism.">
            <NumberInput value={age} onChange={setAge} suffix="yrs" min={13} max={100} />
          </Step>
        )}

        {step === 2 && (
          <Step title="What's your height?" sub="A quick measurement.">
            <NumberInput value={height} onChange={setHeight} suffix="cm" min={120} max={230} />
          </Step>
        )}

        {step === 3 && (
          <Step title="What's your current weight?" sub="So we can calculate macros.">
            <NumberInput value={weight} onChange={setWeight} suffix="kg" min={30} max={250} />
          </Step>
        )}

        {step === 4 && (
          <Step title="What's your target weight?" sub="Where do you want to be?">
            <NumberInput value={targetWeight} onChange={setTargetWeight} suffix="kg" min={30} max={250} />
          </Step>
        )}

        {step === 5 && (
          <Step title="How fast do you want to reach your goal?" sub="Pick a pace that fits your life.">
            <div className="space-y-3">
              {paces.map(({ id, title, sub, Icon }) => (
                <SelectCard key={id} active={pace === id} onClick={() => setPace(id)} title={title} sub={sub} Icon={Icon} />
              ))}
            </div>
          </Step>
        )}

        {step === 6 && (
          <Step title="How often do you work out?" sub="Be honest — we adjust the plan.">
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
                    <div className="font-medium">{f.title}</div>
                    <div className="text-xs text-muted-foreground">{f.sub}</div>
                  </div>
                  {frequency === f.id && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 7 && (
          <Step title="What type of diet do you follow?" sub="We'll match your macros.">
            <div className="space-y-3">
              {diets.map(({ id, title, sub, Icon }) => (
                <SelectCard key={id} active={diet === id} onClick={() => setDiet(id)} title={title} sub={sub} Icon={Icon} />
              ))}
            </div>
          </Step>
        )}

        {step === 8 && (
          <Step title="Activity level" sub="How active are you weekly?">
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
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.sub}</div>
                  </div>
                  {activity === a.id && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
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
            <div className="text-sm text-muted-foreground">Personalizing your KCALLY experience</div>
          </div>
        )}

        {step === TOTAL_QUESTIONS + 1 && plan && (
          <Step title="Your plan is ready" sub="Tuned to your body and goal.">
            <div className="grid grid-cols-2 gap-3">
              <PlanCard label="Calories" value={plan.calories} unit="kcal" big />
              <PlanCard label="Protein" value={plan.protein} unit="g" />
              <PlanCard label="Carbs" value={plan.carbs} unit="g" />
              <PlanCard label="Fat" value={plan.fat} unit="g" />
            </div>
          </Step>
        )}
      </div>

      <div className="pt-8">
        {step < TOTAL_QUESTIONS && (
          <Button
            size="lg"
            className="w-full h-14 rounded-2xl bg-gradient-primary hover:opacity-90 text-base font-semibold shadow-glow"
            onClick={isLastQuestion ? generate : next}
          >
            {isLastQuestion ? "Create my plan" : "Continue"}
            <ArrowRight className="ml-1 w-5 h-5" />
          </Button>
        )}
        {step === TOTAL_QUESTIONS + 1 && (
          <Button
            size="lg"
            className="w-full h-14 rounded-2xl bg-gradient-primary hover:opacity-90 text-base font-semibold shadow-glow"
            onClick={finish}
          >
            Start training
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
