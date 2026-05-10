import type { Exercise } from "@/data/exercises";

type Anim =
  | "run" | "walk" | "sprint" | "knees" | "jump" | "jack" | "squat" | "jumpsquat"
  | "lunge" | "pushup" | "pullup" | "press" | "deadlift" | "row" | "curl"
  | "cycle" | "rope" | "swim" | "punch" | "kick" | "stretch" | "plank"
  | "situp" | "climb" | "dance" | "ski" | "burpee" | "carry" | "bag" | "ball";

function pickAnim(ex: Exercise): Anim {
  const n = ex.name.toLowerCase();
  const c = ex.category;

  // Specific keywords first
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
  if (n.includes("plank") || n.includes("hollow") || n.includes("dead bug") || n.includes("bird dog")) return "plank";
  if (n.includes("sit-up") || n.includes("situp") || n.includes("crunch") || n.includes("twist") || n.includes("ab wheel") || n.includes("toes-to-bar") || n.includes("leg raise")) return "situp";
  if (n.includes("punch") || n.includes("shadow box") || n.includes("boxing") || n.includes("muay") || n.includes("mma") || n.includes("kickbox")) return n.includes("kick") ? "kick" : "bag";
  if (n.includes("kick")) return "kick";
  if (n.includes("yoga") || n.includes("stretch") || n.includes("pilates") || n.includes("mobility") || n.includes("tai chi") || n.includes("qi gong") || n.includes("foam") || n.includes("breath") || n.includes("flow") || n.includes("warmup") || n.includes("barre") || n.includes("ballet") || n.includes("wall slide") || n.includes("wall angel")) return "stretch";
  if (n.includes("climb") || n.includes("boulder") || n.includes("wall walk")) return "climb";
  if (n.includes("danc") || n.includes("zumba") || n.includes("salsa") || n.includes("aerobic")) return "dance";
  if (n.includes("ski") || n.includes("skate") || n.includes("snowboard") || n.includes("surf") || n.includes("board")) return "ski";
  if (n.includes("carry") || n.includes("yoke") || n.includes("walk") && n.includes("farmer")) return "carry";
  if (n.includes("ball") || n.includes("basketball") || n.includes("volley") || n.includes("tennis") || n.includes("padel") || n.includes("badminton") || n.includes("squash") || n.includes("ping") || n.includes("pickle")) return "ball";
  if (n.includes("sprint") || n.includes("hill") || n.includes("interval") && c === "Cardio") return "sprint";
  if (n.includes("walk") || n.includes("hike") || n.includes("nordic")) return "walk";
  if (n.includes("run") || n.includes("jog")) return "run";

  // Fallback by category
  if (c === "Cardio") return "run";
  if (c === "HIIT") return "jumpsquat";
  if (c === "Strength") return "press";
  if (c === "Mobility") return "stretch";
  return "run";
}

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

  // Decide which props to render
  const showBar = anim === "deadlift" || anim === "press";
  const showRope = anim === "rope";
  const showBag = anim === "bag";
  const showBall = anim === "ball";
  const showDumbbells = anim === "curl" || anim === "row" || anim === "carry";

  return (
    <div className="rounded-2xl bg-gradient-soft border border-border/50 p-4 mb-5">
      <div className="flex items-center gap-4">
        <svg
          viewBox="0 0 100 120"
          className={`w-28 h-32 shrink-0 anim-${anim}`}
          fill="none"
          stroke="hsl(var(--primary-glow))"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Ground line */}
          <line x1="5" y1="100" x2="95" y2="100" stroke="hsl(var(--border))" strokeWidth={1.5} />

          {/* Boxing bag (drawn before figure) */}
          {showBag && (
            <g className="prop-bag">
              <line x1="88" y1="10" x2="88" y2="22" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
              <rect x="80" y="22" width="16" height="32" rx="4" fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary-glow))" />
            </g>
          )}

          {/* Figure */}
          <g>
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
            {/* Feet */}
            <line x1="33" y1="95" x2="42" y2="95" />
            <line x1="58" y1="95" x2="67" y2="95" />
          </g>

          {/* Barbell across hands */}
          {showBar && (
            <g className="prop-bar">
              <line x1="22" y1="55" x2="78" y2="55" strokeWidth={4} />
              <circle cx="22" cy="55" r="5" fill="hsl(var(--primary) / 0.3)" />
              <circle cx="78" cy="55" r="5" fill="hsl(var(--primary) / 0.3)" />
            </g>
          )}

          {/* Dumbbells in each hand */}
          {showDumbbells && (
            <g>
              <circle cx="32" cy="55" r="4" fill="hsl(var(--primary) / 0.3)" />
              <circle cx="68" cy="55" r="4" fill="hsl(var(--primary) / 0.3)" />
            </g>
          )}

          {/* Jump rope arc */}
          {showRope && (
            <ellipse className="prop-rope" cx="50" cy="60" rx="32" ry="42" stroke="hsl(var(--primary-glow))" strokeWidth={1.5} strokeDasharray="3 4" />
          )}

          {/* Ball */}
          {showBall && (
            <circle className="prop-ball" cx="50" cy="80" r="6" fill="hsl(var(--primary) / 0.4)" stroke="hsl(var(--primary-glow))" />
          )}
        </svg>

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
