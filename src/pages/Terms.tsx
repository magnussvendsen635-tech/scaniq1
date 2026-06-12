import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useT } from "@/i18n/useT";
import { useAutoTranslate } from "@/i18n/useAutoTranslate";

const SOURCE = [
  // 0 meta line
  "Last updated: June 8, 2026 · Kinetex Intelligens · scaniqapp1@gmail.com",
  // 1 callout title
  "Seller & Merchant of Record",
  // 2 callout body
  "ScanIQ is developed and operated by Kinetex Intelligens. When you purchase a subscription within the app, the transaction is processed directly by Apple Inc. via the App Store. Apple acts as the merchant for all in-app purchases; they handle the payment, issue the receipt, and manage any refund requests. Please refer to Apple's Media Services Terms and Conditions for information regarding in-app purchases and refunds.",
  // 3 medical title
  "Medical Disclaimer",
  // 4 medical body
  "ScanIQ is not a medical tool and does not provide medical diagnoses, treatment or guarantees of results. The content is for informational and general wellness purposes only. Always consult a doctor or dietitian before making major changes to your diet or exercise.",
  // 5-24 sections (title, body)
  "1. Acceptance of Terms",
  "By using ScanIQ, you accept these terms. If you do not accept them, you may not use the app.",
  "2. Calories & Nutrition are Estimates",
  "All calories, macros, health scores, and AI-generated assessments are estimates and may be inaccurate. You are responsible for assessing the content before acting on it. Do not use the app as the sole source of nutritional data in medical contexts.",
  "3. User Responsibility",
  "You are responsible for the accuracy of the data you enter.",
  "You may only use the app for lawful purposes.",
  "You may not attempt to hack, reverse engineer or abuse the service.",
  "You are responsible for keeping your login credentials secure.",
  "4. Subscription & Payment",
  "Premium is offered as a monthly or yearly subscription.",
  "The subscription renews automatically at the end of the period unless cancelled.",
  "Cancellation takes effect at the end of the period — you retain Premium access until that date.",
  "All in-app purchases are handled by Apple App Store and Google Play. Apple or Google is the merchant of record and handles payment, receipts and refunds.",
  "\"Restore Purchases\" only restores existing subscriptions; it does not provide refunds or free Premium.",
  "5. No Warranties",
  "The app is provided \"as is\". We make no warranties that the app is error-free, always available, or that it will lead to specific weight loss or health outcomes.",
  "6. Limitation of Liability",
  "To the extent permitted by law, ScanIQ's total liability is limited to the amount you paid for Premium in the last 12 months. We are not liable for indirect losses or health consequences of your use of the app.",
  "7. Changes to Terms",
  "We may update these terms. Major changes will be notified in the app. Continued use after changes constitutes acceptance of the new terms.",
  "8. Termination",
  "We may suspend or terminate your account in case of abuse or breach of terms. You may delete your account at any time under Profile → Help → Delete Account.",
  "9. Governing Law",
  "These terms are governed by Danish law.",
  "10. Contact",
];

export default function Terms() {
  const nav = useNavigate();
  const t = useT();
  const { translations: T } = useAutoTranslate(SOURCE);

  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo title={`${t("legal.terms_title")} — ScanIQ`} description="Terms of Service for ScanIQ." path="/terms" />
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center" aria-label={t("common.back")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t("legal.terms_title")}</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">{T[0]}</p>

        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1">{T[1]}</b>
          {T[2]}
        </div>

        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">{T[3]}</b>
          {T[4]}
        </div>

        <Section title={T[5]}><p>{T[6]}</p></Section>
        <Section title={T[7]}><p>{T[8]}</p></Section>
        <Section title={T[9]}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{T[10]}</li><li>{T[11]}</li><li>{T[12]}</li><li>{T[13]}</li>
          </ul>
        </Section>
        <Section title={T[14]}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{T[15]}</li><li>{T[16]}</li><li>{T[17]}</li><li>{T[18]}</li><li>{T[19]}</li>
          </ul>
        </Section>
        <Section title={T[20]}><p>{T[21]}</p></Section>
        <Section title={T[22]}><p>{T[23]}</p></Section>
        <Section title={T[24]}><p>{T[25]}</p></Section>
        <Section title={T[26]}><p>{T[27]}</p></Section>
        <Section title={T[28]}><p>{T[29]}</p></Section>
        <Section title={T[30]}>
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
