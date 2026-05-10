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

const HOW_TO: Record<Anim, string> = {
  run: "Hold opret holdning. Lette skridt, pump armene afslappet og land på forfoden.",
  walk: "Gå i jævnt tempo med lange skridt. Hold skuldrene tilbage og kig frem.",
  sprint: "Eksplosivt fra start — drev knæene højt og pump armene kraftigt.",
  knees: "Løft knæene højt skiftevis i hurtigt tempo. Hold kernen spændt.",
  jump: "Bøj knæene let og spring eksplosivt op. Land blødt med bøjede knæ.",
  jack: "Spring fødderne ud og samtidigt armene op. Saml igen i ét hop.",
  squat: "Fødder i skulderbredde. Sænk hoften som om du sætter dig — ryggen lige.",
  jumpsquat: "Squat ned, eksplodér op i et hop, land blødt og gentag flydende.",
  lunge: "Tag et stort skridt frem og sænk bagerste knæ mod gulvet. Skift ben.",
  pushup: "Hænder lidt bredere end skuldre. Sænk brystet kontrolleret og pres op.",
  pullup: "Greb i skulderbredde. Træk dig op til hagen er over stangen, sænk roligt.",
  press: "Pres vægten lige op over hovedet. Lås albuerne, sænk kontrolleret.",
  deadlift: "Lige ryg, brystet frem. Løft ved at strække hofter og knæ samtidig.",
  row: "Træk håndtaget mod maven, klem skulderbladene sammen, sænk roligt.",
  curl: "Albuerne ind til siden. Curl vægten op uden at gynge med kroppen.",
  cycle: "Sid stabilt og tråd jævnt rundt. Hold tempoet og træk vejret roligt.",
  rope: "Hold håndledene afslappede. Små hop på forfoden — sjippetovet drejes med håndleddene.",
  swim: "Lange roterende armtag, smalle benspark og rolig vejrtrækning til siden.",
  punch: "Stå i kampstilling. Slå skiftevis venstre/højre — vrid hoften med hvert slag.",
  kick: "Stå i balance på ét ben. Spark eksplosivt og kontrolleret tilbage til start.",
  stretch: "Bevæg dig langsomt og kontrolleret. Hold positionen og træk vejret roligt.",
  plank: "Spænd hele kroppen. Lige linje fra hæl til hoved — træk vejret roligt.",
  situp: "Læg dig på ryggen, bøj knæene. Rul kontrolleret op, og sænk langsomt ned.",
  climb: "Tre punkter på væggen — flyt én lem ad gangen. Hold hofterne tæt på væggen.",
  dance: "Følg rytmen, hold kernen aktiv og bevæg hofter, arme og fødder flydende.",
  ski: "Bøj let i knæene, hold balancen og overfør vægten side til side.",
  burpee: "Squat ned, hop ud i planke, push-up, hop ind igen og spring op med hænderne over hovedet.",
  carry: "Stå opret, spændt kerne, små stabile skridt. Hold vægten tæt på kroppen.",
  bag: "Stå i kampstilling. Slå serier på sækken — træk vejret med hvert slag.",
  ball: "Hold blikket på bolden. Følg igennem med hele kroppen i hvert slag/kast.",
};

export function ExerciseFigure({ exercise }: { exercise: Exercise }) {
  const anim = pickAnim(exercise);

  return (
    <div className="rounded-2xl bg-gradient-soft border border-border/50 p-4 mb-5">
      <div className="flex items-center gap-4">
        <img
          src={IMAGES[anim]}
          alt={exercise.name}
          loading="lazy"
          width={512}
          height={512}
          className="w-32 h-32 shrink-0 rounded-xl object-contain bg-background"
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Sådan gør du
          </div>
          <p className="text-sm leading-snug">{HOW_TO[anim]}</p>
        </div>
      </div>
    </div>
  );
}
