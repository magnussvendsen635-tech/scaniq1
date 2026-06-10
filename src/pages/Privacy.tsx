import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useT } from "@/i18n/useT";
import { useKStore } from "@/store/useKStore";

export default function Privacy() {
  const t = useT();
  const lang = useKStore((s) => s.language).split("-")[0];
  const da = lang === "da";

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
        <p className="text-xs text-muted-foreground">
          {da ? "Sidst opdateret: 8. juni 2026" : "Last updated: June 8, 2026"} · ScanIQ · Kinetex Intelligens · scaniqapp1@gmail.com
        </p>

        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">{da ? "Medicinsk forbehold" : "Medical disclaimer"}</b>
          {da
            ? "ScanIQ giver ikke medicinske diagnoser eller garantier og er ikke et medicinsk værktøj. Kalorier, makroer og sundhedsscores er estimater og kan være unøjagtige. Konsulter en læge eller diætist før du foretager større ændringer."
            : "ScanIQ does not provide medical diagnoses or guarantees and is not a medical tool. Calories, macros and health scores are estimates and may be inaccurate. Consult a doctor or dietitian before making major changes."}
        </div>

        <Section title={da ? "1. Dataansvarlig" : "1. Data Controller"}>
          <p>
            {da
              ? "ScanIQ er drevet af Kinetex Intelligens. Hvis du har spørgsmål vedrørende dine data, kontakt os på "
              : "ScanIQ is operated by Kinetex Intelligens. If you have questions regarding your data, contact us at "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>.
            {" "}
            {da
              ? "Køb i appen håndteres af Apple App Store og Google Play, som er selvstændige dataansvarlige for betalingsdata."
              : "In-app purchases are handled by Apple App Store and Google Play, who are independent data controllers for payment data."}
          </p>
        </Section>

        <Section title={da ? "2. Data vi indsamler" : "2. Data We Collect"}>
          <ul className="list-disc pl-5 space-y-1">
            {(da
              ? ["Konto: email, hashet adgangskode, login-udbyder.", "Profil: vægt, højde, alder, køn, aktivitet og mål du indtaster.", "Måltider & træning: måltider, scanninger, madbilleder, vand, træning, vægthistorik, streaks.", "Brugsdata: app-interaktioner, scanningstælling, fejllogs, enhedstype, sprog.", "Betalinger: håndteres af Apple App Store og Google Play. Vi ser eller gemmer aldrig kortdetaljer."]
              : ["Account: email, hashed password, login provider.", "Profile: weight, height, age, gender, activity and goals you enter.", "Meals & workouts: meals, scans, food images, water, workouts, weight history, streaks.", "Usage data: app interactions, scan count, error logs, device type, language.", "Payments: handled by Apple App Store and Google Play. We never see or store card details."]
            ).map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Section>

        <Section title={da ? "3. AI & madbilleder" : "3. AI & Meal Images"}>
          <p>{da ? "Når du scanner et måltid sendes billedet til vores AI-udbyder (Google Gemini via Lovable AI Gateway) for at estimere ernæring. Vi gemmer ikke det originale billede medmindre du vælger at gemme måltidet, og billeder bruges ikke til at træne tredjepartsmodeller." : "When you scan a meal, the image is sent to our AI provider (Google Gemini via Lovable AI Gateway) to estimate nutrition. We do not store the original image unless you choose to save the meal, and images are not used to train third-party models."}</p>
        </Section>

        <Section title={da ? "4. Dine rettigheder (GDPR)" : "4. Your Rights (GDPR)"}>
          <p>{da ? "Du har til enhver tid ret til at tilgå, rette, slette eller eksportere dine data." : "You have the right to access, correct, delete, or export your data at any time."}</p>
          <p className="mt-2">
            {da ? "Du kan administrere dette i appen under Profil → Hjælp, eller ved at sende en email til " : "You can manage this in the app under Profile → Help, or by emailing "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>.
            {da ? " Vi svarer inden for 30 dage." : " We respond within 30 days."}
          </p>
        </Section>

        <Section title={da ? "5. Tredjeparter" : "5. Third Parties"}>
          <ul className="list-disc pl-5 space-y-1">
            {(da
              ? ["Lovable Cloud (Supabase): sikker database & login (EU-region).", "Lovable AI Gateway / Google Gemini: billedanalyse.", "Apple App Store / Google Play: betalinger og abonnementer.", "Apple Health / Google Fit: kun hvis du selv aktiverer det."]
              : ["Lovable Cloud (Supabase): secure database & login (EU region).", "Lovable AI Gateway / Google Gemini: image analysis.", "Apple App Store / Google Play: payments and subscriptions.", "Apple Health / Google Fit: only if you enable it yourself."]
            ).map((x) => <li key={x}>{x}</li>)}
          </ul>
          <p className="mt-2">{da ? "Vi sælger aldrig dine personoplysninger." : "We never sell your personal data."}</p>
        </Section>

        <Section title={da ? "6. Sikkerhed" : "6. Security"}>
          <ul className="list-disc pl-5 space-y-1">
            {(da
              ? ["Kryptering under overførsel (HTTPS/TLS) og i hvile.", "Row-Level Security — kun du kan læse dine data.", "Adgangskoder er hashet — vi ser dem aldrig i klartekst.", "Rate limiting og bot-beskyttelse."]
              : ["Encryption in transit (HTTPS/TLS) and at rest.", "Row-Level Security — only you can read your data.", "Passwords are hashed — we never see them in plain text.", "Rate limiting and bot protection."]
            ).map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Section>

        <Section title={da ? "7. Dataopbevaring" : "7. Data Retention"}>
          <ul className="list-disc pl-5 space-y-1">
            {(da
              ? ["Konto- og profildata: så længe din konto er aktiv.", "Måltider, scanninger, træning: så længe din konto er aktiv.", "Ved kontosletning: alle persondata slettes permanent inden for 30 dage.", "Betalingsregistre: opbevares i op til 7 år (lovkrav)."]
              : ["Account and profile data: as long as your account is active.", "Meals, scans, workouts: as long as your account is active.", "Upon account deletion: all personal data is permanently deleted within 30 days.", "Payment records: kept up to 7 years (legal requirement)."]
            ).map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Section>

        <Section title={da ? "8. Børn" : "8. Children"}>
          <p>{da ? "ScanIQ er ikke beregnet til brugere under 13 år. Hvis et barn har oprettet en konto, sletter vi den efter anmodning." : "ScanIQ is not intended for users under 13. If a child has created an account, we will delete it upon request."}</p>
        </Section>

        <Section title={da ? "9. Ændringer" : "9. Changes"}>
          <p>{da ? "Vi kan opdatere denne politik. Større ændringer meddeles i appen. Datoen øverst viser den nuværende version." : "We may update this policy. Major changes will be notified in the app. The date at the top shows the current version."}</p>
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
