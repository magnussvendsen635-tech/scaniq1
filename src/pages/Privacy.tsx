import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useT } from "@/i18n/useT";
import { useAutoTranslate } from "@/i18n/useAutoTranslate";

const SOURCE = [
  "Last updated: June 8, 2026",
  "Medical disclaimer",
  "ScanIQ does not provide medical diagnoses or guarantees and is not a medical tool. Calories, macros and health scores are estimates and may be inaccurate. Consult a doctor or dietitian before making major changes.",
  // 3
  "1. Data Controller",
  "ScanIQ is operated by Kinetex Intelligens. If you have questions regarding your data, contact us at",
  "In-app purchases are handled by Apple App Store and Google Play, who are independent data controllers for payment data.",
  // 6
  "2. Data We Collect",
  "Account: email, hashed password, login provider.",
  "Profile: weight, height, age, gender, activity and goals you enter.",
  "Meals & workouts: meals, scans, food images, water, workouts, weight history, streaks.",
  "Usage data: app interactions, scan count, error logs, device type, language.",
  "Payments: handled by Apple App Store and Google Play. We never see or store card details.",
  // 12
  "3. AI & Meal Images",
  "When you scan a meal, the image is sent to our AI provider (Google Gemini via Lovable AI Gateway) to estimate nutrition. We do not store the original image unless you choose to save the meal, and images are not used to train third-party models.",
  // 14
  "4. Your Rights (GDPR)",
  "You have the right to access, correct, delete, or export your data at any time.",
  "You can manage this in the app under Profile → Help, or by emailing",
  "We respond within 30 days.",
  // 18
  "5. Third Parties",
  "Lovable Cloud (Supabase): secure database & login (EU region).",
  "Lovable AI Gateway / Google Gemini: image analysis.",
  "Apple App Store / Google Play: payments and subscriptions.",
  "Apple Health / Google Fit: only if you enable it yourself.",
  "We never sell your personal data.",
  // 24
  "6. Security",
  "Encryption in transit (HTTPS/TLS) and at rest.",
  "Row-Level Security — only you can read your data.",
  "Passwords are hashed — we never see them in plain text.",
  "Rate limiting and bot protection.",
  // 29
  "7. Data Retention",
  "Account and profile data: as long as your account is active.",
  "Meals, scans, workouts: as long as your account is active.",
  "Upon account deletion: all personal data is permanently deleted within 30 days.",
  "Payment records: kept up to 7 years (legal requirement).",
  // 34
  "8. Children",
  "ScanIQ is not intended for users under 13. If a child has created an account, we will delete it upon request.",
  // 36
  "9. Changes",
  "We may update this policy. Major changes will be notified in the app. The date at the top shows the current version.",
  // 38
  "10. Contact",
];

export default function Privacy() {
  const t = useT();
  const { translations: T } = useAutoTranslate(SOURCE);

  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo title={`${t("legal.privacy_title")} — ScanIQ`} description="How ScanIQ handles your personal data." path="/privacy" />
      <header className="flex items-center gap-3 mb-6">
        <Link to="/settings" className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("legal.privacy_title")}</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">{T[0]} · ScanIQ · Kinetex Intelligens · scaniqapp1@gmail.com</p>

        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">{T[1]}</b>
          {T[2]}
        </div>

        <Section title={T[3]}>
          <p>
            {T[4]}{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>.{" "}
            {T[5]}
          </p>
        </Section>

        <Section title={T[6]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[7], T[8], T[9], T[10], T[11]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[12]}><p>{T[13]}</p></Section>

        <Section title={T[14]}>
          <p>{T[15]}</p>
          <p className="mt-2">
            {T[16]}{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>. {T[17]}
          </p>
        </Section>

        <Section title={T[18]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[19], T[20], T[21], T[22]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
          <p className="mt-2">{T[23]}</p>
        </Section>

        <Section title={T[24]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[25], T[26], T[27], T[28]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[29]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[30], T[31], T[32], T[33]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[34]}><p>{T[35]}</p></Section>
        <Section title={T[36]}><p>{T[37]}</p></Section>
        <Section title={T[38]}>
          <p>ScanIQ · Kinetex Intelligens · <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a></p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
      <div className="text-foreground/80 space-y-2">{children}</div>
    </section>
  );
}
