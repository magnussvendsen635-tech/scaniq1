import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useKStore, computePlan, type Goal, type Activity, type Pace, type Frequency, type Diet, type Sex } from "@/store/useKStore";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { LanguagePicker } from "@/components/LanguagePicker";
import { translate, type TKey } from "@/i18n/translations";
import { Flame, TrendingDown, TrendingUp, Activity as ActivityIcon, ArrowRight, ArrowLeft, ChevronRight, Loader2, Check, Zap, Scale, Leaf, Heart, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

const TOTAL_QUESTIONS = 13; // 0=lang, 1=name, 2=sex, ... 12=Acquisition survey

const SPRING = { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.7 };
const PAGE_SPRING = { type: "spring" as const, stiffness: 320, damping: 34, mass: 0.8 };

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
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
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
  const [channel, setChannel] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [doneSteps, setDoneSteps] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showCheck, setShowCheck] = useState(false);
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

  const next = () => { hapticMedium(); setDir(1); setStep((s) => s + 1); };
  const back = () => { hapticLight(); setDir(-1); setStep((s) => Math.max(0, s - 1)); };
  const pick = <T,>(setter: (v: T) => void) => (v: T) => { hapticLight(); setter(v); };

  const loadingSteps: TKey[] = ["onboarding.loading_1", "onboarding.loading_2", "onboarding.loading_3"];

  /** Never let a translation/haptics/timer hiccup leave the user on a spinner. */
  const safeT = (k: TKey) => { try { return translate(lang, k); } catch { return ""; } };

  /** Always ends on the plan screen, even if a step throws. */
  const generate = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    try { hapticMedium(); } catch { /* haptics are optional */ }
    setDir(1);
    setStep(TOTAL_QUESTIONS);
    setDoneSteps(0);
    setLoadProgress(0);
    setShowCheck(false);
    setStalled(false);

    // Compute the plan up front: it is pure math and must never depend on the animation.
    let p: { calories: number; protein: number; carbs: number; fat: number } | null = null;
    try {
      p = computePlan({ weight, height, goal, activity, sex, age });
      setPlan(p);
    } catch (e) {
      console.error("computePlan failed", e);
    }

    try {
      const items = [...loadingSteps, "onboarding.personalizing" as TKey];
      for (let i = 0; i < items.length; i++) {
        if (cancelledRef.current) return;
        setLoadingMsg(safeT(items[i]));
        await new Promise((r) => setTimeout(r, reduce ? 120 : 600));
        setDoneSteps(i + 1);
        setLoadProgress(((i + 1) / items.length) * 100);
      }
      if (cancelledRef.current) return;
      setShowCheck(true);
      try { hapticSuccess(); } catch { /* haptics are optional */ }
      await new Promise((r) => setTimeout(r, reduce ? 200 : 900));
    } catch (e) {
      console.error("Onboarding loading sequence failed", e);
    } finally {
      generatingRef.current = false;
      if (!cancelledRef.current && p) {
        setLoadProgress(100);
        setDoneSteps(4);
        setStep(TOTAL_QUESTIONS + 1);
      }
    }
  };

  // Watchdog: if the loader is still on screen after 8s (throttled timers in a
  // backgrounded webview, a stalled promise), show a manual way forward.
  useEffect(() => {
    if (step !== TOTAL_QUESTIONS) return;
    const id = setTimeout(() => setStalled(true), 8000);
    return () => clearTimeout(id);
  }, [step]);

  useEffect(() => () => { cancelledRef.current = true; }, []);

  /** Manual escape hatch from a stuck loader. */
  const skipLoading = () => {
    generatingRef.current = false;
    let p = plan;
    if (!p) {
      try {
        p = computePlan({ weight, height, goal, activity, sex, age });
        setPlan(p);
      } catch (e) {
        console.error("computePlan failed", e);
        toast.error(safeT("common.error") || "Something went wrong");
        return;
      }
    }
    setStep(TOTAL_QUESTIONS + 1);
  };


  const finish = async () => {
    if (!plan) return;
    hapticSuccess();
    setLanguage(lang);
    updateUser({ name: name.trim(), age, weight, targetWeight, height, goal, sex, activity, pace, frequency, diet, ...plan });
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from("profiles").update({ acquisition_channel: channel || null }).eq("id", authUser.id);
      }
    } catch (e) {
      console.warn("Failed to save acquisition channel", e);
    }
    setOnboarded(true);
    nav("/app", { replace: true });
  };

  const progressIndex = Math.min(step + 1, TOTAL_QUESTIONS);

  const pageVariants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? -32 : 32 }),
  };

  const listStagger = {
    center: { transition: { staggerChildren: reduce ? 0 : 0.045, delayChildren: 0.04 } },
  };
  const itemVariants = {
    enter: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    center: { opacity: 1, y: 0, transition: SPRING },
    exit: { opacity: 0 },
  };

  return (
    <div className="min-h-screen w-full max-w-md mx-auto px-6 pt-12 pb-10 flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <motion.div
          animate={reduce ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: "transform" }}
        >
          <Logo size={36} withText />
        </motion.div>
        <span className="text-xs text-muted-foreground tracking-widest tabular-nums">
          <AnimatedNumber value={progressIndex} /> / {TOTAL_QUESTIONS}
        </span>
      </header>

      <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden mb-10">
        <motion.div
          className="h-full bg-gradient-primary"
          initial={false}
          animate={{ width: `${(progressIndex / TOTAL_QUESTIONS) * 100}%` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 28 }}
          style={{ willChange: "width" }}
        />
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduce ? { duration: 0.15 } : PAGE_SPRING}
            style={{ willChange: "transform, opacity" }}
          >
            {step === 0 && (
              <Step title={tt("onboarding.choose_language")} sub={tt("onboarding.choose_language_sub")}>
                <LanguagePicker value={lang} onChange={(c) => { hapticLight(); setLang(c); }} />
              </Step>
            )}

            {step === 1 && (
              <Step title={tt("onboarding.q_name")} sub={tt("onboarding.q_name_sub")}>
                <motion.div
                  className="k-card p-6 transition-shadow duration-300 focus-within:ring-2 focus-within:ring-primary/70 focus-within:shadow-glow"
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={tt("onboarding.q_name_placeholder")}
                    autoFocus
                    maxLength={30}
                    className="bg-transparent w-full text-center text-3xl font-semibold tracking-tight outline-none k-gradient-text placeholder:text-muted-foreground/40 placeholder:font-normal transition-all duration-200 placeholder:transition-opacity focus:placeholder:opacity-40"
                  />
                </motion.div>
              </Step>
            )}

            {step === 2 && (
              <Step title={tt("onboarding.q_sex")} sub={tt("onboarding.q_sex_sub")}>
                <motion.div className="space-y-3" variants={listStagger} initial="enter" animate="center">
                  <motion.div variants={itemVariants}>
                    <SelectCard active={sex === "male"} onClick={() => pick(setSex)("male")} title={tt("onboarding.sex_male")} sub={tt("onboarding.sex_male_sub")} Icon={UserIcon} />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <SelectCard active={sex === "female"} onClick={() => pick(setSex)("female")} title={tt("onboarding.sex_female")} sub={tt("onboarding.sex_female_sub")} Icon={UserIcon} />
                  </motion.div>
                </motion.div>
              </Step>
            )}

            {step === 3 && (
              <Step title={tt("onboarding.q_goal")} sub={tt("onboarding.q_goal_sub")}>
                <motion.div className="space-y-3" variants={listStagger} initial="enter" animate="center">
                  {goals.map(({ id, titleKey, subKey, Icon }) => (
                    <motion.div key={id} variants={itemVariants}>
                      <SelectCard active={goal === id} onClick={() => pick(setGoal)(id)} title={tt(titleKey)} sub={tt(subKey)} Icon={Icon} />
                    </motion.div>
                  ))}
                </motion.div>
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
                <motion.div className="space-y-3" variants={listStagger} initial="enter" animate="center">
                  {paces.map(({ id, titleKey, subKey, Icon }) => (
                    <motion.div key={id} variants={itemVariants}>
                      <SelectCard active={pace === id} onClick={() => pick(setPace)(id)} title={tt(titleKey)} sub={tt(subKey)} Icon={Icon} />
                    </motion.div>
                  ))}
                </motion.div>
              </Step>
            )}

            {step === 9 && (
              <Step title={tt("onboarding.q_freq")} sub={tt("onboarding.q_freq_sub")}>
                <motion.div className="space-y-2.5" variants={listStagger} initial="enter" animate="center">
                  {frequencies.map((f) => (
                    <motion.button
                      key={f.id}
                      variants={itemVariants}
                      onClick={() => pick(setFrequency)(f.id)}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      animate={{ scale: 1 }}
                      transition={SPRING}
                      className={cn(
                        "k-card k-tap w-full p-4 flex items-center justify-between text-left transition-shadow duration-200",
                        frequency === f.id && "ring-2 ring-primary shadow-glow"
                      )}
                      style={{ willChange: "transform" }}
                    >
                      <div>
                        <div className="font-medium">{tt(f.titleKey)}</div>
                        <div className="text-xs text-muted-foreground">{tt(f.subKey)}</div>
                      </div>
                      <AnimatePresence>
                        {frequency === f.id && (
                          <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={SPRING}>
                            <Check className="w-5 h-5 text-primary" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              </Step>
            )}

            {step === 10 && (
              <Step title={tt("onboarding.q_diet")} sub={tt("onboarding.q_diet_sub")}>
                <motion.div className="space-y-3" variants={listStagger} initial="enter" animate="center">
                  {diets.map(({ id, titleKey, subKey, Icon }) => (
                    <motion.div key={id} variants={itemVariants}>
                      <SelectCard active={diet === id} onClick={() => pick(setDiet)(id)} title={tt(titleKey)} sub={tt(subKey)} Icon={Icon} />
                    </motion.div>
                  ))}
                </motion.div>
              </Step>
            )}

            {step === 11 && (
              <Step title={tt("onboarding.q_activity")} sub={tt("onboarding.q_activity_sub")}>
                <motion.div className="space-y-2.5" variants={listStagger} initial="enter" animate="center">
                  {activities.map((a) => (
                    <motion.button
                      key={a.id}
                      variants={itemVariants}
                      onClick={() => pick(setActivity)(a.id)}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      transition={SPRING}
                      className={cn(
                        "k-card k-tap w-full p-4 flex items-center justify-between text-left transition-shadow duration-200",
                        activity === a.id && "ring-2 ring-primary shadow-glow"
                      )}
                      style={{ willChange: "transform" }}
                    >
                      <div>
                        <div className="font-medium">{tt(a.titleKey)}</div>
                        <div className="text-xs text-muted-foreground">{tt(a.subKey)}</div>
                      </div>
                      <AnimatePresence>
                        {activity === a.id && (
                          <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={SPRING}>
                            <Check className="w-5 h-5 text-primary" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              </Step>
            )}

            {step === 12 && (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{tt("survey.title")}</h1>
                  <button
                    onClick={generate}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full"
                  >
                    {tt("survey.skip")}
                  </button>
                </div>
                <p className="text-muted-foreground mb-8">{tt("survey.sub")}</p>
                <motion.div className="space-y-2.5" variants={listStagger} initial="enter" animate="center">
                  {SURVEY_OPTIONS.map((o) => (
                    <motion.button
                      key={o.id}
                      variants={itemVariants}
                      onClick={() => pick(setChannel)(o.id)}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      transition={SPRING}
                      className={cn(
                        "k-card k-tap w-full p-4 flex items-center justify-between text-left transition-shadow duration-200",
                        channel === o.id && "ring-2 ring-primary shadow-glow"
                      )}
                      style={{ willChange: "transform" }}
                    >
                      <div className="font-medium">{tt(o.key)}</div>
                      <AnimatePresence>
                        {channel === o.id && (
                          <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={SPRING}>
                            <Check className="w-5 h-5 text-primary" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            )}

            {step === TOTAL_QUESTIONS && (
              <div className="flex flex-col items-center justify-center text-center pt-16 gap-6">
                <AnimatePresence mode="wait">
                  {!showCheck ? (
                    <motion.div key="load" className="flex flex-col items-center gap-6 w-full" exit={{ opacity: 0, scale: 0.96 }}>
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-primary opacity-20 blur-2xl absolute inset-0" />
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                      </div>
                      <div className="text-lg font-medium">{loadingMsg}</div>

                      <div className="h-1.5 w-full max-w-xs bg-surface-3 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-primary"
                          initial={false}
                          animate={{ width: `${loadProgress}%` }}
                          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 26 }}
                          style={{ willChange: "width" }}
                        />
                      </div>

                      <div className="w-full max-w-xs space-y-2.5 text-left">
                        {[...loadingSteps, "onboarding.personalizing" as TKey].map((k, i) => (
                          <motion.div
                            key={k}
                            className="flex items-center gap-3 text-sm"
                            animate={{ opacity: i < doneSteps ? 1 : 0.4 }}
                            transition={{ duration: 0.25 }}
                          >
                            <motion.span
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                i < doneSteps ? "bg-primary text-primary-foreground" : "bg-surface-3"
                              )}
                              animate={i < doneSteps && !reduce ? { scale: [0.7, 1.15, 1] } : { scale: 1 }}
                              transition={SPRING}
                            >
                              {i < doneSteps && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                            </motion.span>
                            <span className={cn(i < doneSteps ? "text-foreground" : "text-muted-foreground")}>{tt(k)}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="done"
                      className="flex flex-col items-center gap-5 pt-8"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={SPRING}
                    >
                      <motion.div
                        className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
                        initial={{ scale: 0.5 }}
                        animate={reduce ? { scale: 1 } : { scale: [0.5, 1.12, 1] }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <Check className="w-12 h-12 text-primary-foreground" strokeWidth={3} />
                      </motion.div>
                      <div className="text-lg font-medium">{tt("onboarding.plan_ready_sub")}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step === TOTAL_QUESTIONS + 1 && plan && (
              <Step title={tt("onboarding.plan_ready")} sub={tt("onboarding.plan_ready_sub")}>
                <motion.div className="grid grid-cols-2 gap-3" variants={listStagger} initial="enter" animate="center">
                  <motion.div variants={itemVariants} className="col-span-2">
                    <PlanCard label={tt("settings.calories")} value={plan.calories} unit={tt("common.kcal")} big />
                  </motion.div>
                  <motion.div variants={itemVariants}><PlanCard label={tt("home.protein")} value={plan.protein} unit="g" /></motion.div>
                  <motion.div variants={itemVariants}><PlanCard label={tt("home.carbs")} value={plan.carbs} unit="g" /></motion.div>
                  <motion.div variants={itemVariants}><PlanCard label={tt("home.fat")} value={plan.fat} unit="g" /></motion.div>
                </motion.div>
                {/* Apple 1.4.1: the basis of the recommendation must be stated. */}
                <motion.p variants={itemVariants} className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  These targets are an estimate calculated with the Mifflin-St Jeor equation
                  (Mifflin et al., Am J Clin Nutr 1990) and WHO/FAO/UNU activity factors. ScanIQ is a
                  general wellness app and does not provide medical advice. Consult your doctor or a
                  registered dietitian before changing your diet.{" "}
                  <a href="/sources" className="underline underline-offset-4 text-primary">
                    View sources
                  </a>
                </motion.p>
              </Step>

            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pt-8 flex gap-3">
        {step < TOTAL_QUESTIONS && step > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={reduce ? undefined : { scale: 0.97 }} transition={{ duration: 0.15 }}>
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-2xl px-5 text-base font-semibold"
              onClick={back}
              aria-label={tt("common.back")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
        {step < TOTAL_QUESTIONS && (
          <motion.div
            className="flex-1"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0.15 } : SPRING}
            whileTap={reduce ? undefined : { scale: 0.97 }}
          >
            <Button
              size="lg"
              disabled={step === 13 && !channel}
              className="group w-full h-14 rounded-2xl bg-[hsl(14_100%_55%)] hover:bg-[hsl(14_100%_50%)] text-white text-base font-bold shadow-[0_8px_20px_-4px_hsl(14_100%_55%/0.5)] border-0 disabled:opacity-50"
              onClick={step === 13 ? generate : next}
            >
              <span className="text-white">{tt("common.continue")}</span>
              <span className="ml-2 inline-flex items-center -space-x-2 transition-transform group-hover:translate-x-1">
                <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.75} />
                <ChevronRight className="w-5 h-5 text-white opacity-60" strokeWidth={2.75} />
              </span>
            </Button>
          </motion.div>
        )}
        {step === TOTAL_QUESTIONS + 1 && (
          <motion.div
            className="w-full"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0.15 } : SPRING}
            whileTap={reduce ? undefined : { scale: 0.97 }}
          >
            <Button
              size="lg"
              className="w-full h-14 rounded-2xl bg-gradient-primary hover:opacity-90 text-base font-semibold shadow-glow"
              onClick={finish}
            >
              {tt("onboarding.start_training")}
              <Flame className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const AnimatedNumber = ({ value }: { value: number }) => (
  <span className="inline-block relative align-baseline">
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6, position: "absolute" }}
        transition={{ duration: 0.22 }}
        className="inline-block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
);

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
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.button
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      animate={reduce ? undefined : { scale: active ? 1.02 : 1 }}
      transition={SPRING}
      style={{ willChange: "transform" }}
      className={cn(
        "k-card k-tap w-full p-5 min-h-[76px] flex items-center gap-4 text-left transition-shadow duration-200",
        active && "ring-4 ring-primary/70 shadow-glow bg-gradient-soft"
      )}
    >
      <motion.div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200",
          active ? "bg-primary text-primary-foreground" : "bg-gradient-soft"
        )}
        animate={reduce ? undefined : { scale: active ? 1.12 : 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 18 }}
      >
        <Icon className={cn("w-7 h-7 transition-colors duration-200", active ? "text-primary-foreground" : "text-primary-glow")} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base leading-tight">{title}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{sub}</div>
      </div>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={SPRING}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"
          >
            <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const NumberInput = ({ value, onChange, suffix, min, max }: { value: number; onChange: (n: number) => void; suffix: string; min: number; max: number }) => {
  const reduce = useReducedMotion();
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const step = (n: number) => { hapticLight(); onChange(clamp(n)); };
  return (
    <div className="k-card p-6 flex flex-col items-center transition-shadow duration-300 focus-within:ring-2 focus-within:ring-primary/70 focus-within:shadow-glow">
      <div className="flex items-center justify-between w-full gap-3 mb-6">
        <motion.button
          type="button"
          onClick={() => step(value - 1)}
          whileTap={reduce ? undefined : { scale: 0.9 }}
          transition={SPRING}
          className="k-tap w-14 h-14 rounded-2xl bg-gradient-soft flex items-center justify-center text-3xl font-bold text-primary active:bg-primary/10"
          aria-label="Decrease"
        >
          −
        </motion.button>
        <div className="flex items-baseline gap-2 flex-1 justify-center">
          <motion.input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            inputMode="numeric"
            animate={reduce ? undefined : { scale: 1 }}
            whileFocus={reduce ? undefined : { scale: 1.04 }}
            transition={SPRING}
            className="bg-transparent w-28 text-center text-6xl font-semibold tracking-tight outline-none k-gradient-text"
          />
          <span className="text-xl text-muted-foreground font-medium">{suffix}</span>
        </div>
        <motion.button
          type="button"
          onClick={() => step(value + 1)}
          whileTap={reduce ? undefined : { scale: 0.9 }}
          transition={SPRING}
          className="k-tap w-14 h-14 rounded-2xl bg-gradient-soft flex items-center justify-center text-3xl font-bold text-primary active:bg-primary/10"
          aria-label="Increase"
        >
          +
        </motion.button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 accent-[hsl(var(--primary))] touch-none"
      />
    </div>
  );
};

const PlanCard = ({ label, value, unit, big = false }: { label: string; value: number; unit: string; big?: boolean }) => (
  <div className={cn("k-card p-5 h-full", big && "bg-gradient-soft")}>
    <div className="text-xs text-muted-foreground tracking-widest uppercase">{label}</div>
    <div className="mt-2 flex items-baseline gap-1.5">
      <span className={cn("font-semibold tracking-tight", big ? "text-5xl k-gradient-text" : "text-3xl")}>{value}</span>
      <span className="text-sm text-muted-foreground">{unit}</span>
    </div>
  </div>
);
