import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useT } from "@/i18n/useT";
import { useKStore } from "@/store/useKStore";

const MERCHANT_BLOCK_EN = `ScanIQ is developed and operated by Kinetex Intelligens. When you purchase a subscription within the app, the transaction is processed directly by Apple Inc. via the App Store. Apple acts as the merchant for all in-app purchases; they handle the payment, issue the receipt, and manage any refund requests. Please refer to Apple's Media Services Terms and Conditions for information regarding in-app purchases and refunds.`;
const MERCHANT_BLOCK_DA = `ScanIQ er udviklet og drevet af Kinetex Intelligens. Når du køber et abonnement i appen, behandles transaktionen direkte af Apple Inc. via App Store. Apple er sælger og merchant of record for alle køb i appen; de håndterer betalingen, udsteder kvitteringen og behandler refundering. Se Apples Media Services Vilkår for information om køb i appen og refundering.`;

export default function Terms() {
  const nav = useNavigate();
  const t = useT();
  const lang = useKStore((s) => s.language).split("-")[0];
  const da = lang === "da";

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
        <p className="text-xs text-muted-foreground">
          {da ? "Sidst opdateret: 8. juni 2026" : "Last updated: June 8, 2026"} · Kinetex Intelligens · scaniqapp1@gmail.com
        </p>

        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1">{da ? "Sælger & Merchant of Record" : "Seller & Merchant of Record"}</b>
          {da ? MERCHANT_BLOCK_DA : MERCHANT_BLOCK_EN}
        </div>

        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">{da ? "Medicinsk forbehold" : "Medical Disclaimer"}</b>
          {da
            ? "ScanIQ er ikke et medicinsk værktøj og giver ikke medicinske diagnoser, behandling eller resultatgarantier. Indholdet er kun til information og almen velvære. Kontakt altid en læge eller diætist før du foretager større ændringer i kost eller motion."
            : "ScanIQ is not a medical tool and does not provide medical diagnoses, treatment or guarantees of results. The content is for informational and general wellness purposes only. Always consult a doctor or dietitian before making major changes to your diet or exercise."}
        </div>

        <Section title={da ? "1. Accept af vilkår" : "1. Acceptance of Terms"}>
          <p>{da ? "Ved at bruge ScanIQ accepterer du disse vilkår. Hvis du ikke accepterer dem, må du ikke bruge appen." : "By using ScanIQ, you accept these terms. If you do not accept them, you may not use the app."}</p>
        </Section>

        <Section title={da ? "2. Kalorier & ernæring er estimater" : "2. Calories & Nutrition are Estimates"}>
          <p>{da ? "Alle kalorier, makroer, sundhedsscores og AI-genererede vurderinger er estimater og kan være unøjagtige. Du er ansvarlig for at vurdere indholdet før du handler på det. Brug ikke appen som eneste kilde til ernæringsdata i medicinske sammenhænge." : "All calories, macros, health scores, and AI-generated assessments are estimates and may be inaccurate. You are responsible for assessing the content before acting on it. Do not use the app as the sole source of nutritional data in medical contexts."}</p>
        </Section>

        <Section title={da ? "3. Brugeransvar" : "3. User Responsibility"}>
          <ul className="list-disc pl-5 space-y-1">
            {(da
              ? ["Du er ansvarlig for nøjagtigheden af de data du indtaster.", "Du må kun bruge appen til lovlige formål.", "Du må ikke forsøge at hacke, reverse engineere eller misbruge tjenesten.", "Du er ansvarlig for at holde dine login-oplysninger sikre."]
              : ["You are responsible for the accuracy of the data you enter.", "You may only use the app for lawful purposes.", "You may not attempt to hack, reverse engineer or abuse the service.", "You are responsible for keeping your login credentials secure."]
            ).map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Section>

        <Section title={da ? "4. Abonnement & betaling" : "4. Subscription & Payment"}>
          <ul className="list-disc pl-5 space-y-1">
            {(da
              ? ["Premium tilbydes som månedligt eller årligt abonnement.", "Abonnementet fornyes automatisk ved udgangen af perioden, medmindre du opsiger det.", "Opsigelse træder i kraft ved slutningen af perioden — du beholder Premium-adgang indtil da.", "Alle køb i appen håndteres af Apple App Store og Google Play. Apple eller Google er merchant of record og behandler betaling, kvittering og refundering.", "\"Gendan køb\" gendanner kun eksisterende abonnementer; det giver ikke refundering eller gratis Premium."]
              : ["Premium is offered as a monthly or yearly subscription.", "The subscription renews automatically at the end of the period unless cancelled.", "Cancellation takes effect at the end of the period — you retain Premium access until that date.", "All in-app purchases are handled by Apple App Store and Google Play. Apple or Google is the merchant of record and handles payment, receipts and refunds.", "\"Restore Purchases\" only restores existing subscriptions; it does not provide refunds or free Premium."]
            ).map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Section>

        <Section title={da ? "5. Ingen garantier" : "5. No Warranties"}>
          <p>{da ? "Appen leveres \"som den er\". Vi giver ingen garantier for at appen er fejlfri, altid tilgængelig eller at den vil føre til specifikke vægttab eller helbredsresultater." : "The app is provided \"as is\". We make no warranties that the app is error-free, always available, or that it will lead to specific weight loss or health outcomes."}</p>
        </Section>

        <Section title={da ? "6. Ansvarsbegrænsning" : "6. Limitation of Liability"}>
          <p>{da ? "I det omfang det er tilladt ved lov er ScanIQ's samlede ansvar begrænset til det beløb du har betalt for Premium i de seneste 12 måneder. Vi er ikke ansvarlige for indirekte tab eller helbredsmæssige konsekvenser af din brug af appen." : "To the extent permitted by law, ScanIQ's total liability is limited to the amount you paid for Premium in the last 12 months. We are not liable for indirect losses or health consequences of your use of the app."}</p>
        </Section>

        <Section title={da ? "7. Ændringer af vilkår" : "7. Changes to Terms"}>
          <p>{da ? "Vi kan opdatere disse vilkår. Større ændringer vil blive meddelt i appen. Fortsat brug efter ændringer udgør accept af de nye vilkår." : "We may update these terms. Major changes will be notified in the app. Continued use after changes constitutes acceptance of the new terms."}</p>
        </Section>

        <Section title={da ? "8. Opsigelse" : "8. Termination"}>
          <p>{da ? "Vi kan suspendere eller opsige din konto i tilfælde af misbrug eller brud på vilkårene. Du kan slette din konto til enhver tid under Profil → Hjælp → Slet konto." : "We may suspend or terminate your account in case of abuse or breach of terms. You may delete your account at any time under Profile → Help → Delete Account."}</p>
        </Section>

        <Section title={da ? "9. Gældende lov" : "9. Governing Law"}>
          <p>{da ? "Disse vilkår er underlagt dansk lov." : "These terms are governed by Danish law."}</p>
        </Section>

        <Section title={da ? "10. Kontakt" : "10. Contact"}>
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
