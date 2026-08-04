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
        title="How ScanIQ calculates your calories — sources"
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
        <h1 className="text-xl font-semibold tracking-tight">How we calculate your calories</h1>
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
          <h2 className="font-semibold mb-1">3. Weight-loss or weight-gain adjustment</h2>
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
          <h2 className="font-semibold mb-1">4. Macronutrient split</h2>
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
          <h2 className="font-semibold mb-1">5. Food and nutrition data</h2>
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
      </section>
    </div>
  );
}
