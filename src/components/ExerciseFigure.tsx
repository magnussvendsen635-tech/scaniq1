import type { Exercise } from "@/data/exercises";

import imgRun from "@/assets/exercises/run.jpg";
import imgWalk from "@/assets/exercises/walk.jpg";
import imgSprint from "@/assets/exercises/sprint.jpg";
import imgKnees from "@/assets/exercises/knees.jpg";
import imgJump from "@/assets/exercises/jump.jpg";
import imgJack from "@/assets/exercises/jack.jpg";
import imgSquat from "@/assets/exercises/squat.jpg";
import imgJumpsquat from "@/assets/exercises/jumpsquat.jpg";
import imgLunge from "@/assets/exercises/lunge.jpg";
import imgPushup from "@/assets/exercises/pushup.jpg";
import imgPullup from "@/assets/exercises/pullup.jpg";
import imgPress from "@/assets/exercises/press.jpg";
import imgDeadlift from "@/assets/exercises/deadlift.jpg";
import imgRow from "@/assets/exercises/row.jpg";
import imgCurl from "@/assets/exercises/curl.jpg";
import imgCycle from "@/assets/exercises/cycle.jpg";
import imgRope from "@/assets/exercises/rope.jpg";
import imgSwim from "@/assets/exercises/swim.jpg";
import imgPunch from "@/assets/exercises/punch.jpg";
import imgKick from "@/assets/exercises/kick.jpg";
import imgStretch from "@/assets/exercises/stretch.jpg";
import imgPlank from "@/assets/exercises/plank.jpg";
import imgSitup from "@/assets/exercises/situp.jpg";
import imgClimb from "@/assets/exercises/climb.jpg";
import imgDance from "@/assets/exercises/dance.jpg";
import imgSki from "@/assets/exercises/ski.jpg";
import imgBurpee from "@/assets/exercises/burpee.jpg";
import imgCarry from "@/assets/exercises/carry.jpg";
import imgBag from "@/assets/exercises/bag.jpg";
import imgBall from "@/assets/exercises/ball.jpg";

type Anim =
  | "run" | "walk" | "sprint" | "knees" | "jump" | "jack" | "squat" | "jumpsquat"
  | "lunge" | "pushup" | "pullup" | "press" | "deadlift" | "row" | "curl"
  | "cycle" | "rope" | "swim" | "punch" | "kick" | "stretch" | "plank"
  | "situp" | "climb" | "dance" | "ski" | "burpee" | "carry" | "bag" | "ball";

function pickAnim(ex: Exercise): Anim {
  const n = ex.name.toLowerCase();
  const c = ex.category;

  if (n.includes("plank") || n.includes("hollow") || n.includes("dead bug") || n.includes("bird dog")) return "plank";
  if (n.includes("rope") || n.includes("skipping")) return "rope";
  if (n.includes("cycl") || n.includes("bike") || n.includes("spin")) return "cycle";
  if (n.includes("row")) return "row";
  if (n.includes("swim") || n.includes("aqua") || n.includes("water polo")) return "swim";
  if (n.includes("burpee") || n.includes("man maker") || n.includes("devil press")) return "burpee";
  if (n.includes("jumping jack") || n.includes("plank jack")) return "jack";
  if (n.includes("high knee") || n.includes("mountain climber") || n.includes("march")) return "knees";
  if (n.includes("box jump") || n.includes("tuck jump") || n.includes("broad jump") || n.includes("jump touch")) return "jump";
  if (n.includes("jump squat") || n.includes("squat jump")) return "jumpsquat";
  if (n.includes("squat") || n.includes("wall sit")) return "squat";
  if (n.includes("lunge") || n.includes("step-up") || n.includes("step up")) return "lunge";
  if (n.includes("push-up") || n.includes("push up") || n.includes("pushup")) return "pushup";
  if (n.includes("pull-up") || n.includes("chin-up") || n.includes("lat pulldown") || n.includes("pull up")) return "pullup";
  if (n.includes("deadlift") || n.includes("clean") || n.includes("snatch") || n.includes("good morning") || n.includes("stone")) return "deadlift";
  if (n.includes("press") || n.includes("thruster") || n.includes("overhead") || n.includes("jerk")) return "press";
  if (n.includes("curl")) return "curl";
  if (n.includes("sit-up") || n.includes("situp") || n.includes("crunch") || n.includes("twist") || n.includes("ab wheel") || n.includes("toes-to-bar") || n.includes("leg raise")) return "situp";
  if (n.includes("punch") || n.includes("shadow box") || n.includes("boxing") || n.includes("muay") || n.includes("mma") || n.includes("kickbox")) return n.includes("kick") ? "kick" : "bag";
  if (n.includes("kick")) return "kick";
  if (n.includes("yoga") || n.includes("stretch") || n.includes("pilates") || n.includes("mobility") || n.includes("tai chi") || n.includes("qi gong") || n.includes("foam") || n.includes("breath") || n.includes("flow") || n.includes("warmup") || n.includes("barre") || n.includes("ballet") || n.includes("wall slide") || n.includes("wall angel")) return "stretch";
  if (n.includes("climb") || n.includes("boulder") || n.includes("wall walk")) return "climb";
  if (n.includes("danc") || n.includes("zumba") || n.includes("salsa") || n.includes("aerobic")) return "dance";
  if (n.includes("ski") || n.includes("skate") || n.includes("snowboard") || n.includes("surf") || n.includes("board")) return "ski";
  if (n.includes("carry") || n.includes("yoke") || (n.includes("walk") && n.includes("farmer"))) return "carry";
  if (n.includes("ball") || n.includes("basketball") || n.includes("volley") || n.includes("tennis") || n.includes("padel") || n.includes("badminton") || n.includes("squash") || n.includes("ping") || n.includes("pickle")) return "ball";
  if (n.includes("sprint") || n.includes("hill") || (n.includes("interval") && c === "Cardio")) return "sprint";
  if (n.includes("walk") || n.includes("hike") || n.includes("nordic")) return "walk";
  if (n.includes("run") || n.includes("jog")) return "run";

  if (c === "Cardio") return "run";
  if (c === "HIIT") return "jumpsquat";
  if (c === "Strength") return "press";
  if (c === "Mobility") return "stretch";
  return "run";
}

const IMAGES: Record<Anim, string> = {
  run: imgRun, walk: imgWalk, sprint: imgSprint, knees: imgKnees, jump: imgJump,
  jack: imgJack, squat: imgSquat, jumpsquat: imgJumpsquat, lunge: imgLunge,
  pushup: imgPushup, pullup: imgPullup, press: imgPress, deadlift: imgDeadlift,
  row: imgRow, curl: imgCurl, cycle: imgCycle, rope: imgRope, swim: imgSwim,
  punch: imgPunch, kick: imgKick, stretch: imgStretch, plank: imgPlank,
  situp: imgSitup, climb: imgClimb, dance: imgDance, ski: imgSki,
  burpee: imgBurpee, carry: imgCarry, bag: imgBag, ball: imgBall,
};

// Steps som korte numererede punkter (max 4)
const STEPS: Record<Anim, string[]> = {
  run: ["Start i let tempo", "Land på forfoden", "Pump armene afslappet", "Hold opret holdning"],
  walk: ["Lange skridt i jævnt tempo", "Skuldre tilbage, kig frem", "Rul af på foden"],
  sprint: ["Eksplosivt fra start", "Drev knæene højt", "Pump armene kraftigt"],
  knees: ["Stå opret med spændt kerne", "Løft knæene op til hoftehøjde", "Skift hurtigt mellem ben"],
  jump: ["Bøj let i knæene", "Spring eksplosivt op", "Land blødt med bøjede knæ"],
  jack: ["Stå med fødder samlet", "Spring fødder ud, arme op", "Saml igen i ét hop"],
  squat: ["Fødder i skulderbredde", "Sænk hoften som i en stol", "Hold ryggen lige", "Pres op gennem hælene"],
  jumpsquat: ["Squat ned med kontrol", "Eksplodér op i et hop", "Land blødt og gentag"],
  lunge: ["Tag et stort skridt frem", "Sænk bagerste knæ mod gulvet", "Pres op og skift ben"],
  pushup: ["Hænder lidt bredere end skuldre", "Sænk brystet til lige over gulvet", "Pres op og lås albuerne"],
  pullup: ["Greb i skulderbredde", "Træk dig op til hagen er over stangen", "Sænk roligt og kontrolleret"],
  press: ["Hold vægten ved skuldre", "Pres lige op over hovedet", "Lås albuerne, sænk kontrolleret"],
  deadlift: ["Fødder i hoftebredde, vægt over midtfoden", "Brystet frem, ryggen lige", "Løft ved at strække hofter og knæ", "Sænk kontrolleret tilbage"],
  row: ["Bøj let i knæene", "Træk håndtaget mod maven", "Klem skulderbladene sammen", "Sænk roligt"],
  curl: ["Albuerne ind til siden", "Curl vægten op uden at gynge", "Sænk langsomt til start"],
  cycle: ["Sid stabilt på sadlen", "Tråd jævnt rundt", "Hold tempoet og træk vejret roligt"],
  rope: ["Hold håndledene afslappede", "Små hop på forfoden", "Drej tovet med håndleddene"],
  swim: ["Lange roterende armtag", "Smalle, rolige benspark", "Træk vejret til siden hver 3. tag"],
  punch: ["Stå i kampstilling", "Slå skiftevis venstre/højre", "Vrid hoften med hvert slag"],
  kick: ["Stå i balance på ét ben", "Spark eksplosivt", "Kontrolleret retur til start"],
  stretch: ["Bevæg dig langsomt og kontrolleret", "Hold positionen 20-30 sek", "Træk vejret roligt"],
  plank: ["Spænd hele kroppen", "Hold lige linje fra hæl til hoved", "Træk vejret roligt"],
  situp: ["Lig på ryggen, bøj knæene", "Rul kontrolleret op", "Sænk langsomt ned"],
  climb: ["Tre punkter på væggen", "Flyt én lem ad gangen", "Hold hofterne tæt på væggen"],
  dance: ["Følg rytmen", "Hold kernen aktiv", "Bevæg hofter, arme og fødder flydende"],
  ski: ["Bøj let i knæene", "Hold balancen", "Overfør vægten side til side"],
  burpee: ["Squat ned, hænder i gulvet", "Hop ud i planke + push-up", "Hop ind igen", "Spring op med hænderne over hovedet"],
  carry: ["Stå opret med spændt kerne", "Hold vægten tæt på kroppen", "Små stabile skridt"],
  bag: ["Stå i kampstilling", "Slå serier på sækken", "Træk vejret med hvert slag"],
  ball: ["Hold blikket på bolden", "Følg igennem med hele kroppen", "Hold balancen efter slaget"],
};

// Hvilke muskler øvelsen primært rammer
const MUSCLES: Record<Anim, string[]> = {
  run: ["Ben", "Glutes", "Kondition"],
  walk: ["Ben", "Kondition"],
  sprint: ["Ben", "Glutes", "Kondition"],
  knees: ["Mave", "Hofter", "Kondition"],
  jump: ["Ben", "Glutes", "Eksplosiv kraft"],
  jack: ["Helkrop", "Kondition"],
  squat: ["Quads", "Glutes", "Mave"],
  jumpsquat: ["Quads", "Glutes", "Eksplosiv kraft"],
  lunge: ["Quads", "Glutes", "Balance"],
  pushup: ["Bryst", "Triceps", "Skuldre"],
  pullup: ["Ryg", "Biceps", "Underarme"],
  press: ["Skuldre", "Triceps", "Mave"],
  deadlift: ["Ryg", "Glutes", "Baglår"],
  row: ["Ryg", "Biceps", "Bagre skuldre"],
  curl: ["Biceps", "Underarme"],
  cycle: ["Ben", "Glutes", "Kondition"],
  rope: ["Lægge", "Skuldre", "Kondition"],
  swim: ["Helkrop", "Ryg", "Skuldre"],
  punch: ["Skuldre", "Mave", "Kondition"],
  kick: ["Ben", "Hofter", "Mave"],
  stretch: ["Mobilitet", "Restitution"],
  plank: ["Mave", "Skuldre", "Glutes"],
  situp: ["Mave", "Hoftebøjer"],
  climb: ["Underarme", "Ryg", "Mave"],
  dance: ["Helkrop", "Kondition"],
  ski: ["Quads", "Glutes", "Balance"],
  burpee: ["Helkrop", "Kondition"],
  carry: ["Greb", "Mave", "Skuldre"],
  bag: ["Skuldre", "Mave", "Kondition"],
  ball: ["Helkrop", "Koordination"],
};

// Foreslået reps × sæt baseret på kategori
function repsSets(ex: Exercise): { reps: string; sets: string } | null {
  switch (ex.category) {
    case "Strength":
      return { reps: "8-12 reps", sets: "3-4 sæt" };
    case "HIIT":
      return { reps: "30-45 sek", sets: "4-6 runder" };
    case "Mobility":
      return { reps: "20-30 sek hold", sets: "2-3 runder" };
    case "Cardio":
    case "Sport":
    default:
      return null;
  }
}

export function ExerciseFigure({ exercise }: { exercise: Exercise }) {
  const anim = pickAnim(exercise);
  const steps = STEPS[anim];
  const muscles = MUSCLES[anim];
  const rs = repsSets(exercise);

  return (
    <div className="rounded-2xl bg-gradient-soft border border-border/50 overflow-hidden mb-5">
      <div className="aspect-[16/10] bg-background/40 flex items-center justify-center">
        <img
          src={IMAGES[anim]}
          alt={exercise.name}
          loading="lazy"
          width={512}
          height={512}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="p-4 space-y-3">
        {/* Muskelgrupper */}
        <div className="flex flex-wrap gap-1.5">
          {muscles.map((m) => (
            <span
              key={m}
              className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold"
            >
              {m}
            </span>
          ))}
        </div>

        {/* Reps + sæt */}
        {rs && (
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-card/60 border border-border/50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reps</div>
              <div className="text-sm font-semibold">{rs.reps}</div>
            </div>
            <div className="flex-1 rounded-xl bg-card/60 border border-border/50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Sæt</div>
              <div className="text-sm font-semibold">{rs.sets}</div>
            </div>
          </div>
        )}

        {/* Step-by-step */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
            Sådan gør du
          </div>
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-snug">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
