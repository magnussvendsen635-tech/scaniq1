import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

export default function Terms() {
  const nav = useNavigate();
  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo
        title="Terms of Service — ScanIQ"
        description="Terms and conditions for using ScanIQ — AI-powered calorie and nutrition tracker."
        path="/terms"
      />
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Terms of Service</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">
          Last updated: June 8, 2026 · Kinetex Intelligens (under formation) · scaniqapp1@gmail.com
        </p>

        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1">Seller &amp; Merchant of Record</b>
          ScanIQ is sold by <b>Kinetex Intelligens</b> ("we", "us"). When you purchase a
          subscription, you enter an agreement with Kinetex Intelligens for the use of the
          service. Our order process for web purchases is handled by our online reseller{" "}
          <b>Paddle.com Market Limited</b>. Paddle is the Merchant of Record (MoR) and
          reseller for all web orders: Paddle processes the payment, appears as the
          merchant on your bank statement, issues the invoice, collects sales tax/VAT, and
          handles all refunds and payment-related customer inquiries. See Paddle's{" "}
          <a className="underline" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener">Buyer Terms</a>{" "}
          and{" "}
          <a className="underline" href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener">Refund Policy</a>.
        </div>

        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">Medical Disclaimer</b>
          ScanIQ is <b>not a medical tool</b> and does not provide medical diagnoses,
          treatment, or guarantees of results. The content is for informational and general
          wellness purposes only. Always consult a doctor or dietitian before making major
          changes to your diet or exercise.
        </div>

        <Section title="1. Acceptance of Terms">
          <p>By using ScanIQ, you accept these terms. If you do not accept them, you may not use the app.</p>
        </Section>

        <Section title="2. Calories & Nutrition are Estimates">
          <p>
            All calories, macros, health scores, and AI-generated assessments are{" "}
            <b>estimates</b> and may be inaccurate. You are responsible for assessing the
            content before acting on it. Do not use the app as the sole source of
            nutritional data in medical contexts.
          </p>
        </Section>

        <Section title="3. User Responsibility">
          <ul className="list-disc pl-5 space-y-1">
            <li>You are responsible for the accuracy of the data you enter.</li>
            <li>You may only use the app for lawful purposes.</li>
            <li>You may not attempt to hack, reverse engineer, or abuse the service.</li>
            <li>You are responsible for keeping your login credentials secure.</li>
          </ul>
        </Section>

        <Section title="4. Subscription & Payment">
          <ul className="list-disc pl-5 space-y-1">
            <li>Premium is offered as a <b>monthly</b> or <b>yearly</b> subscription.</li>
            <li>The subscription <b>renews automatically</b> at the end of the period unless cancelled.</li>
            <li>Cancellation takes effect at the <b>end of the period</b> — you retain Premium access until that date.</li>
            <li>Web purchases are handled by <b>Paddle.com</b> as Merchant of Record.</li>
            <li>
              <b>14-day money-back guarantee:</b> You may request a full refund within 14 days of purchase via{" "}
              <a className="text-primary-glow underline" href="https://paddle.net" target="_blank" rel="noopener">paddle.net</a>{" "}
              or by contacting us. See our full{" "}
              <a className="text-primary-glow underline" href="/refund">Refund Policy</a>.
            </li>
            <li>Purchases via App Store / Google Play are handled by those platforms.</li>
            <li>"Restore Purchase" only restores existing subscriptions; it does not provide refunds or free Premium.</li>
          </ul>
        </Section>

        <Section title="5. No Warranties">
          <p>
            The app is provided "as is". We make no warranties that the app is error-free,
            always available, or that it will lead to specific weight loss or health outcomes.
          </p>
        </Section>

        <Section title="6. Limitation of Liability">
          <p>
            To the extent permitted by law, ScanIQ's total liability is limited to the
            amount you paid for Premium in the last 12 months. We are not liable for
            indirect losses or health consequences of your use of the app.
          </p>
        </Section>

        <Section title="7. Changes to Terms">
          <p>
            We may update these terms. Major changes will be notified in the app. Continued
            use after changes constitutes acceptance of the new terms.
          </p>
        </Section>

        <Section title="8. Termination">
          <p>
            We may suspend or terminate your account in case of abuse or breach of terms.
            You may delete your account at any time under <b>Profile → Help → Delete Account</b>.
          </p>
        </Section>

        <Section title="9. Governing Law">
          <p>These terms are governed by Danish law.</p>
        </Section>

        <Section title="10. Contact">
          <p>
            ScanIQ ·{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">
              scaniqapp1@gmail.com
            </a>
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
