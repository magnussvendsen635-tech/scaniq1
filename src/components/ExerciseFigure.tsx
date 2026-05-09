import { useT } from "@/i18n/useT";
import type { Exercise } from "@/data/exercises";

/**
 * Animated stick-figure that demonstrates an exercise.
 * Animation style is picked from the exercise category.
 */
export function ExerciseFigure({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const cat = exercise.category;
  const name = exercise.name.toLowerCase();

  // Pick an animation key
  let anim: "run" | "jump" | "squat" | "stretch" | "lift" | "kick" = "run";
  if (cat === "Cardio") anim = name.includes("walk") ? "run" : "run";
  else if (cat === "HIIT") anim = name.includes("squat") ? "squat" : "jump";
  else if (cat === "Strength") anim = "lift";
  else if (cat === "Mobility") anim = "stretch";
  else if (cat === "Sport") anim = "kick";

  // Localized "how to" description per animation type
  const howToKey: Record<typeof anim, string> = {
    run: t("workouts.howto_run") || "Hold en oprejst holdning. Skift fødder rytmisk og pump armene afslappet.",
    jump: t("workouts.howto_jump") || "Stå let bøjet i knæene. Eksplosivt op, blødt ned med bøjede ben.",
    squat: t("workouts.howto_squat") || "Fødder i skulderbredde. Sænk hoften som om du sætter dig — ryggen lige.",
    stretch: t("workouts.howto_stretch") || "Bevæg dig langsomt og kontrolleret. Hold positionen og træk vejret roligt.",
    lift: t("workouts.howto_lift") || "Spænd kernen. Løft kontrolleret op, og sænk langsomt ned igen.",
    kick: t("workouts.howto_kick") || "Stå i balance på ét ben. Spark eksplosivt og kontrolleret tilbage til start.",
  };

  return (
    <div className="rounded-2xl bg-gradient-soft border border-border/50 p-4 mb-5">
      <div className="flex items-center gap-4">
        <svg
          viewBox="0 0 100 120"
          className={`w-24 h-28 shrink-0 anim-${anim}`}
          fill="none"
          stroke="hsl(var(--primary-glow))"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Head */}
          <circle cx="50" cy="20" r="9" />
          {/* Torso */}
          <line x1="50" y1="29" x2="50" y2="65" />
          {/* Arms */}
          <line className="arm-l" x1="50" y1="38" x2="32" y2="55" />
          <line className="arm-r" x1="50" y1="38" x2="68" y2="55" />
          {/* Legs */}
          <line className="leg-l" x1="50" y1="65" x2="38" y2="95" />
          <line className="leg-r" x1="50" y1="65" x2="62" y2="95" />
          {/* Feet (small) */}
          <line x1="36" y1="95" x2="42" y2="95" />
          <line x1="58" y1="95" x2="64" y2="95" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            {t("workouts.howto") || "Sådan gør du"}
          </div>
          <p className="text-sm leading-snug">{howToKey[anim]}</p>
        </div>
      </div>
    </div>
  );
}
