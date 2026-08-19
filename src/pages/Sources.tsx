import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

/**
 * Scientific sources behind ScanIQ's calorie and macro recommendations.
 * Linked from onboarding, the profile page and the plan result screen so the
 * basis for every number shown in the app is always one tap away.
 */
export default function Sources() {
  const nav = useNavigate();

  return (
    <div className="k-page min-h-screen overflow-y-auto max-w-2xl mx-auto px-5 pb-24 pt-2">
      <Seo
        title="Health & Nutrition Sources — ScanIQ"
        description="The scientific references behind ScanIQ's calorie and macronutrient recommendations, including the Mifflin-St Jeor equation and WHO/FAO/UNU activity factors."
        path="/sources"
      />
      <header className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => nav(-1)}
          aria-label="Back"
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">Health &amp; Nutrition Sources</h1>
      </header>

      <section className="space-y-5 text-sm leading-relaxed">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">
            ScanIQ is a general wellness and food-tracking app. It does not diagnose, treat or
            prevent any disease, and it does not provide medical advice. Talk to your doctor or a
            registered dietitian before making changes to your diet, especially if you are pregnant,
            breastfeeding, under 18, or living with a medical condition or eating disorder.
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-1">1. Resting energy expenditure (BMR)</h2>
          <p className="text-muted-foreground">
            Your basal metabolic rate is estimated with the <strong>Mifflin-St Jeor equation</strong>:
          </p>
          <pre className="mt-2 rounded-xl bg-muted/60 p-3 text-xs overflow-x-auto">{`Men:   BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age(years) + 5
Women: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age(years) − 161`}</pre>
          <p className="text-xs text-muted-foreground mt-2">
            Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. “A new predictive
            equation for resting energy expenditure in healthy individuals.”{" "}
            <em>The American Journal of Clinical Nutrition</em>, 1990;51(2):241–247.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://pubmed.ncbi.nlm.nih.gov/2305711/"
            target="_blank"
            rel="noopener noreferrer"
          >
            pubmed.ncbi.nlm.nih.gov/2305711
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">2. Activity factor (TDEE)</h2>
          <p className="text-muted-foreground">
            BMR is multiplied by a physical activity level (PAL) of 1.2 (sedentary) to 1.9 (very
            active), following the WHO/FAO/UNU human energy requirements report and the US Institute
            of Medicine Dietary Reference Intakes.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            FAO/WHO/UNU. <em>Human energy requirements.</em> FAO Food and Nutrition Technical Report
            Series 1, Rome, 2004.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://www.fao.org/4/y5686e/y5686e00.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            fao.org/4/y5686e
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">3. World Health Organization guidance</h2>
          <p className="text-muted-foreground">
            WHO healthy-diet guidance supports the general nutrition context shown alongside
            ScanIQ's estimates, including guidance on a varied diet and limiting free sugars,
            saturated fat and sodium. It does not replace individual medical advice and is not used
            as the BMR equation.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://www.who.int/news-room/fact-sheets/detail/healthy-diet"
            target="_blank"
            rel="noopener noreferrer"
          >
            who.int — Healthy diet
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">4. Weight-loss or weight-gain adjustment</h2>
          <p className="text-muted-foreground">
            A goal of losing weight subtracts roughly 500 kcal/day (about 0.5 kg per week) and a
            gaining goal adds roughly 350 kcal/day, in line with the CDC’s guidance that a safe rate
            of weight loss is 0.5–1 kg (1–2 lb) per week. ScanIQ never recommends a target below
            1200 kcal/day for women or 1500 kcal/day for men.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            cdc.gov — Losing weight
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">5. Macronutrient split</h2>
          <p className="text-muted-foreground">
            Protein, carbohydrate and fat targets stay inside the Acceptable Macronutrient
            Distribution Ranges (AMDR) from the Institute of Medicine: 10–35% of energy from protein,
            45–65% from carbohydrate and 20–35% from fat.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Institute of Medicine. <em>Dietary Reference Intakes for Energy, Carbohydrate, Fiber,
            Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids.</em> Washington DC: National
            Academies Press, 2005.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://nap.nationalacademies.org/catalog/10490"
            target="_blank"
            rel="noopener noreferrer"
          >
            nap.nationalacademies.org/catalog/10490
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">6. Food and nutrition data</h2>
          <p className="text-muted-foreground">
            Nutrition values come from the product’s own label where available, and otherwise from
            public food databases (Open Food Facts) combined with AI image estimation. Values shown
            for photo-based scans are estimates and can differ from the actual meal.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://world.openfoodfacts.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            openfoodfacts.org
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">7. Protein and fat targets</h2>
          <p className="text-muted-foreground">
            ScanIQ sets protein at <strong>2 g per kg of body weight</strong> and fat at{" "}
            <strong>25% of daily energy</strong> (9 kcal/g); carbohydrate fills the remaining
            energy. The protein level follows position-stand guidance for physically active adults
            (1.4–2.0 g/kg/day) and stays inside the IOM AMDR range above.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Jäger R, Kerksick CM, Campbell BI, et al. “International Society of Sports Nutrition
            Position Stand: protein and exercise.” <em>Journal of the International Society of
            Sports Nutrition</em>, 2017;14:20.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://pubmed.ncbi.nlm.nih.gov/28642676/"
            target="_blank"
            rel="noopener noreferrer"
          >
            pubmed.ncbi.nlm.nih.gov/28642676
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">8. Daily water goal</h2>
          <p className="text-muted-foreground">
            The default hydration goal is <strong>2,500 ml per day</strong> and can be set manually
            between 500 and 6,000 ml. It reflects the EFSA adequate intake for total water (2.0 L/day
            for women, 2.5 L/day for men, from drinks and food). It is a general reference value, not
            a personal medical recommendation.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            EFSA Panel on Dietetic Products, Nutrition and Allergies. “Scientific Opinion on Dietary
            Reference Values for water.” <em>EFSA Journal</em>, 2010;8(3):1459.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://www.efsa.europa.eu/en/efsajournal/pub/1459"
            target="_blank"
            rel="noopener noreferrer"
          >
            efsa.europa.eu — Dietary reference values for water
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">9. Daily nutrition score (1–10)</h2>
          <p className="text-muted-foreground">
            The score on the home screen is <strong>not a medical or clinical score</strong>. It is a
            simple in-app rating of how closely the day’s logged food matches your own calorie and
            macro targets: protein vs. target (0–3 points), share of energy from fat inside the
            20–35% AMDR band (0–3 points), carbohydrate vs. target (0–2 points) and total calories
            vs. target (0–2 points). The 20–35% fat band comes from the IOM AMDR reference in section 5.
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-1">10. Processing level (NOVA group)</h2>
          <p className="text-muted-foreground">
            Foods are grouped 1–4 using the <strong>NOVA classification</strong> of food processing.
            The group is an estimate based on the visible product, its ingredient list and label.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Monteiro CA, Cannon G, Levy RB, et al. “Ultra-processed foods: what they are and how to
            identify them.” <em>Public Health Nutrition</em>, 2019;22(5):936–941. FAO, <em>Ultra-processed
            foods, diet quality and health using the NOVA classification system</em>, Rome, 2019.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://www.fao.org/3/ca5644en/ca5644en.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            fao.org — NOVA classification system
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">11. Exercise energy expenditure</h2>
          <p className="text-muted-foreground">
            Calories burned in the workout timer are estimated as{" "}
            <strong>minutes × a fixed kcal/minute value per exercise</strong>. Those per-minute values
            are derived from the metabolic equivalent (MET) values of the Compendium of Physical
            Activities for an average adult, so they are approximations and are not adjusted to your
            individual physiology.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Ainsworth BE, Haskell WL, Herrmann SD, et al. “2011 Compendium of Physical Activities.”{" "}
            <em>Medicine &amp; Science in Sports &amp; Exercise</em>, 2011;43(8):1575–1581.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://pubmed.ncbi.nlm.nih.gov/21681120/"
            target="_blank"
            rel="noopener noreferrer"
          >
            pubmed.ncbi.nlm.nih.gov/21681120
          </a>
        </div>

        <div>
          <h2 className="font-semibold mb-1">12. Accuracy of AI photo estimates</h2>
          <p className="text-muted-foreground">
            Photo-based results are produced by an AI vision model. When a nutrition label or barcode
            is available, the label values and the Open Food Facts database take priority; otherwise
            portion size, hidden oils and dressings are estimated visually. Macros are sanity-checked
            against the Atwater factors (protein 4 kcal/g, carbohydrate 4 kcal/g, fat 9 kcal/g) and
            calories are recomputed when they disagree. Treat every photo estimate as an approximation.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Merrill AL, Watt BK. <em>Energy value of foods: basis and derivation.</em> USDA Agriculture
            Handbook No. 74, Washington DC, 1973.
          </p>
          <a
            className="text-xs underline underline-offset-4 text-primary"
            href="https://www.ars.usda.gov/ARSUserFiles/80400525/Data/Classics/ah74.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            usda.gov — Energy value of foods (Atwater factors)
          </a>
        </div>
      </section>
    </div>
  );
}
