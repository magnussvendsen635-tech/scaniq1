import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <header className="flex items-center gap-3 mb-6">
        <Link to="/settings" className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">Last updated: 6 May 2026 · Developer: Prime Studio</p>

        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">Health disclaimer</b>
          Scaniq is not medical advice and does not replace consultation with a doctor or
          dietitian. Calorie and nutrition results are estimates and may be inaccurate. Consult a
          healthcare professional before making significant changes to your diet, exercise, or
          health routine.
        </div>

        <p>
          Scaniq ("we", "us", "the app") is a mobile fitness app that helps you track calories,
          scan meals, log workouts, and monitor progress. We respect your privacy and we are
          committed to protecting your personal data in line with the EU General Data Protection
          Regulation (GDPR).
        </p>

        <Section title="1. Who we are">
          <p>
            Scaniq is operated by Prime Studio. If you have any questions about this policy or
            your data, contact us at <a className="text-primary-glow underline" href="mailto:support.kcally@gmail.com">support.kcally@gmail.com</a>.
          </p>
        </Section>

        <Section title="2. What data we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Account data:</b> email, password (hashed), and login provider.</li>
            <li><b>Profile data:</b> weight, height, age, sex, activity level and goals you enter.</li>
            <li><b>Food & fitness data:</b> meals, scans, photos you take of food, water intake, workouts, weight history, streaks.</li>
            <li><b>Usage data:</b> app interactions, scan counts, error logs, device type, language.</li>
            <li><b>Payment data:</b> handled by our payment provider (Paddle). We never see or store full card details.</li>
          </ul>
        </Section>

        <Section title="3. Why we collect it (purposes)">
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and secure your account.</li>
            <li>To personalize calorie targets, macros and meal suggestions.</li>
            <li>To analyze food photos with AI and estimate calories.</li>
            <li>To sync your data across devices.</li>
            <li>To process subscriptions and prevent abuse.</li>
            <li>To improve the app and fix bugs.</li>
          </ul>
        </Section>

        <Section title="4. Legal basis (GDPR Art. 6)">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Contract:</b> running the core app features you signed up for.</li>
            <li><b>Consent:</b> optional features such as health-data sync, push notifications and AI photo analysis. You can withdraw consent at any time.</li>
            <li><b>Legitimate interest:</b> security, fraud prevention, improving the service.</li>
            <li><b>Legal obligation:</b> tax and accounting records related to payments.</li>
          </ul>
        </Section>

        <Section title="5. AI & food photos">
          <p>
            When you scan a meal, the photo is sent to our AI provider (Google Gemini via Lovable AI Gateway)
            for nutrition estimation. Photos are processed only to return a result and are not used to train
            third-party models. We keep the result (calories, macros) — not the original photo — unless you
            choose to save it.
          </p>
        </Section>

        <Section title="6. Third-party services">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Lovable Cloud (Supabase):</b> secure database & authentication (EU region).</li>
            <li><b>Lovable AI Gateway / Google Gemini:</b> food image analysis.</li>
            <li><b>Paddle:</b> payment processing and subscription billing.</li>
            <li><b>Apple Health / Google Fit:</b> only if you explicitly enable sync.</li>
          </ul>
          <p className="mt-2">We do <b>NOT</b> sell your personal data to anyone.</p>
        </Section>

        <Section title="7. Data retention">
          <ul className="list-disc pl-5 space-y-1">
            <li>Account & profile data: kept while your account is active.</li>
            <li>Meals, scans, workouts: kept while your account is active so you can see your history.</li>
            <li>If you delete your account, all personal data is permanently erased within 30 days.</li>
            <li>Payment records: kept for up to 7 years where required by law.</li>
          </ul>
        </Section>

        <Section title="8. Your rights">
          <p>Under GDPR you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the data we hold about you.</li>
            <li>Correct data that is wrong.</li>
            <li>Delete your account and data ("right to be forgotten").</li>
            <li>Export your data (data portability).</li>
            <li>Object to or restrict certain processing.</li>
            <li>Withdraw consent at any time.</li>
            <li>File a complaint with your local data protection authority (in Denmark: Datatilsynet).</li>
          </ul>
          <p className="mt-2">
            To use any of these rights, email <a className="text-primary-glow underline" href="mailto:support.kcally@gmail.com">support.kcally@gmail.com</a>.
            We respond within 30 days.
          </p>
        </Section>

        <Section title="9. Security">
          <p>We protect your data with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Encryption in transit (HTTPS/TLS) and at rest.</li>
            <li>Row-level security so only you can read your data.</li>
            <li>Hashed passwords — we never see them in plain text.</li>
            <li>Rate limiting and bot protection.</li>
            <li>Regular security reviews.</li>
          </ul>
        </Section>

        <Section title="10. Children">
          <p>Scaniq is not intended for users under 16. If you believe a child has used the app, contact us and we will delete the account.</p>
        </Section>

        <Section title="11. International transfers">
          <p>
            Some of our service providers (e.g. AI provider) may process data outside the EU.
            When this happens, we rely on Standard Contractual Clauses approved by the European
            Commission to keep your data protected.
          </p>
        </Section>

        <Section title="12. Changes to this policy">
          <p>
            We may update this policy. If we make significant changes, we will notify you in the
            app. The "last updated" date at the top always shows the current version.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Prime Studio · <a className="text-primary-glow underline" href="mailto:support.kcally@gmail.com">support.kcally@gmail.com</a>
          </p>
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
