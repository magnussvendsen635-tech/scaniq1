import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

export default function Privacy() {
  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo
        title="Privacy Policy — ScanIQ"
        description="How ScanIQ handles your personal data. GDPR compliance, data collection, and your rights."
        path="/privacy"
      />
      <header className="flex items-center gap-3 mb-6">
        <Link to="/settings" className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">Last updated: June 8, 2026 · ScanIQ · scaniqapp1@gmail.com</p>

        {/* Medical disclaimer */}
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">Medical disclaimer</b>
          ScanIQ <b>does not provide medical diagnoses or guarantees</b> and is not a medical
          tool. Calories, macros and health scores are <b>estimates</b> and may be inaccurate.
          We do <b>not promise rapid weight loss</b> or specific results. Consult a doctor or
          dietitian before making major changes to diet, exercise or health.
        </div>

        <Section title="1. Data Controller">
          <p>
            ScanIQ is operated by <b>Kinetex Intelligens (under formation)</b>. If you have
            questions regarding your data, contact us at{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>.
            Web payments are handled by <b>Paddle.com Market Limited</b> as Merchant of Record
            and independent data controller for payment data.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Account:</b> email, hashed password, login provider.</li>
            <li><b>Profile:</b> weight, height, age, gender, activity and goals you enter.</li>
            <li><b>Meals &amp; workouts:</b> meals, scans, food images, water, workouts, weight history, streaks.</li>
            <li><b>Usage data:</b> app interactions, scan count, error logs, device type, language.</li>
            <li><b>Payments:</b> handled by Paddle. We never see or store full card details.</li>
          </ul>
        </Section>

        <Section title="3. AI & Meal Images">
          <p>
            When you scan a meal, the image is sent to our AI provider (Google Gemini via
            Lovable AI Gateway) to estimate nutrition. We do not store the original image
            unless you choose to save the meal, and images are not used to train third-party
            models.
          </p>
        </Section>

        <Section title="4. Your Rights (GDPR)">
          <p>You have the right to access, correct, delete, or export your data at any time.</p>
          <p className="mt-2">
            You can manage this in the app under <b>Profile → Help</b>, or by emailing{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>.
            We respond within 30 days.
          </p>
        </Section>

        <Section title="5. Disclaimer">
          <p>
            ScanIQ does not provide medical diagnoses or treatment guarantees. All nutritional
            data are estimates. Consult a healthcare professional before making significant
            changes to your diet or fitness.
          </p>
        </Section>

        <Section title="6. Third Parties">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Lovable Cloud (Supabase):</b> secure database &amp; login (EU region).</li>
            <li><b>Lovable AI Gateway / Google Gemini:</b> image analysis.</li>
            <li><b>Paddle:</b> payments and subscriptions.</li>
            <li><b>Apple Health / Google Fit:</b> only if you enable it yourself.</li>
          </ul>
          <p className="mt-2">We <b>never sell</b> your personal data.</p>
        </Section>

        <Section title="7. Security">
          <ul className="list-disc pl-5 space-y-1">
            <li>Encryption in transit (HTTPS/TLS) and at rest.</li>
            <li>Row-Level Security — only you can read your data.</li>
            <li>Passwords are hashed — we never see them in plain text.</li>
            <li>Rate limiting and bot protection.</li>
          </ul>
        </Section>

        <Section title="8. Data Retention">
          <ul className="list-disc pl-5 space-y-1">
            <li>Account and profile data: as long as your account is active.</li>
            <li>Meals, scans, workouts: as long as your account is active.</li>
            <li>Upon account deletion: all personal data is permanently deleted within 30 days.</li>
            <li>Payment records: kept up to 7 years (legal requirement).</li>
          </ul>
        </Section>

        <Section title="9. Children">
          <p>ScanIQ is not intended for users under 13. If a child has created an account, we will delete it upon request.</p>
        </Section>

        <Section title="10. Changes">
          <p>We may update this policy. Major changes will be notified in the app. The date at the top shows the current version.</p>
        </Section>

        <Section title="11. Contact">
          <p>ScanIQ · <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a></p>
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
