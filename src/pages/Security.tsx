import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useT } from "@/i18n/useT";
import { useAutoTranslate } from "@/i18n/useAutoTranslate";

const SOURCE = [
  "Last updated: June 8, 2026",
  "This page is maintained by ScanIQ to answer common security and privacy questions. It is not an independent certification or audit report.",
  // 2
  "Security overview",
  "ScanIQ is built on Lovable Cloud. The sections below describe the security controls that are enabled today.",
  // 4
  "Access and authentication",
  "You sign in with email and password, Sign in with Apple, or Sign in with Google.",
  "Passwords are hashed and never stored in plain text.",
  "Each account can only read its own data; other users cannot access your meals, scans, weight history or settings.",
  "After 7 days of inactivity on the web app, your session is automatically signed out.",
  // 9
  "Data protection",
  "All data is encrypted in transit using HTTPS/TLS.",
  "Database data is encrypted at rest by the backend provider.",
  "Row-Level Security (RLS) is enabled on every user table, so queries are scoped to your account.",
  "Food images are not kept unless you choose to save the meal.",
  // 14
  "Payments and subscriptions",
  "All payments are handled by the Apple App Store.",
  "ScanIQ does not collect or store card numbers or billing addresses.",
  // 17
  "Subprocessors and integrations",
  "Lovable Cloud: database, authentication and storage.",
  "Lovable AI Gateway / Google Gemini: image analysis for food scans.",
  "Apple App Store: in-app purchases and subscriptions.",
  "Apple Health / Google Fit: only if you connect it yourself.",
  "We do not sell your personal data.",
  // 23
  "Email and notifications",
  "Transactional emails (welcome, receipts) are sent from ScanIQ domains.",
  "You can manage push-notification preferences in the app at any time.",
  // 26
  "Data retention and deletion",
  "Your data is kept while your account is active.",
  "When you delete your account from Profile → Delete account, all personal data is permanently removed within 30 days.",
  "Payment records may be kept for up to 7 years to meet legal requirements.",
  // 30
  "Vulnerability reporting",
  "If you discover a security issue, please contact us at",
  "We will acknowledge receipt and investigate promptly.",
  // 33
  "Your responsibility",
  "Keep your password and device secure.",
  "Use a strong, unique password and do not share your account.",
  "Report suspicious activity to us immediately.",
];

export default function Security() {
  const t = useT();
  const { translations: T } = useAutoTranslate(SOURCE);

  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo title="Security — ScanIQ" description="Security, privacy and data protection practices for ScanIQ users." path="/security" />
      <header className="flex items-center gap-3 mb-6">
        <Link to="/settings" className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("legal.security_title") || "Security"}</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">{T[0]} · ScanIQ · Kinetex Intelligens</p>

        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs leading-relaxed">
          {T[1]}
        </div>

        <Section title={T[2]}>
          <p>{T[3]}</p>
        </Section>

        <Section title={T[4]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[5], T[6], T[7], T[8]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[9]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[10], T[11], T[12], T[13]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[14]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[15], T[16]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[17]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[18], T[19], T[20], T[21], T[22]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[23]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[24], T[25]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[26]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[27], T[28], T[29]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Section>

        <Section title={T[30]}>
          <p>
            {T[31]}{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>.{" "}
            {T[32]}
          </p>
        </Section>

        <Section title={T[33]}>
          <ul className="list-disc pl-5 space-y-1">
            {[T[34], T[35], T[36]].map((x, i) => <li key={i}>{x}</li>)}
          </ul>
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
