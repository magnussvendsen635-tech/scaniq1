import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

export default function Privacy() {
  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo
        title="Privatlivspolitik — ScanIQ"
        description="Sådan behandler ScanIQ dine personoplysninger. GDPR-overholdelse, datalagring og dine rettigheder."
        path="/privacy"
      />
      <header className="flex items-center gap-3 mb-6">
        <Link to="/settings" className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Privatlivspolitik & Vilkår</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">Last updated: June 8, 2026 · ScanIQ · scaniqapp1@gmail.com</p>

        {/* Sundhedsforbehold */}
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">Sundhedsforbehold</b>
          ScanIQ giver <b>ingen medicinske diagnoser eller garantier</b> og er ikke et lægeligt
          værktøj. Kalorier, makroer og sundhedsscores er <b>estimater</b> og kan være unøjagtige.
          Vi lover <b>ikke hurtigt vægttab</b> eller bestemte resultater. Tal med en læge eller
          diætist før du foretager større ændringer i kost, træning eller helbred.
        </div>

        <Section title="1. Kort version (ScanIQ-reglerne)">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Dine data ejer du.</b> Vi sælger eller deler dem aldrig uden din tilladelse.</li>
            <li>Vi indhenter <b>samtykke</b> før vi gemmer dine data.</li>
            <li>Du kan altid <b>se, eksportere og slette</b> dine data – fra Hjælp-siden.</li>
            <li>Sundhedsdata sendes og opbevares <b>krypteret</b>.</li>
            <li>Login er <b>påkrævet</b> – ingen gæsteadgang.</li>
            <li>Ingen medicinske diagnoser, garantier eller vildledende vægttabs-løfter.</li>
          </ul>
        </Section>

        <Section title="2. Hvem vi er (dataansvarlig)">
          <p>
            ScanIQ-appen drives og leveres af <b>KCALLY</b> (handelsnavn:
            ScanIQ), som er <b>dataansvarlig</b> for behandlingen af dine
            personoplysninger. Spørgsmål om dine data eller denne politik
            kan sendes til{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>.
            Betalinger på web håndteres af <b>Paddle.com Market Limited</b>
            som Merchant of Record og selvstændig dataansvarlig for
            betalingsdata.
          </p>
        </Section>

        <Section title="3. Hvilke data vi indsamler">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Konto:</b> e-mail, hashet adgangskode, login-udbyder.</li>
            <li><b>Profil:</b> vægt, højde, alder, køn, aktivitet og mål du selv indtaster.</li>
            <li><b>Mad & træning:</b> måltider, scanninger, billeder af mad, vand, træning, vægthistorik, streaks.</li>
            <li><b>Brugsdata:</b> app-interaktioner, scan-tæller, fejllogs, enhedstype, sprog.</li>
            <li><b>Betaling:</b> håndteres af Paddle. Vi ser eller gemmer aldrig fulde kortdata.</li>
          </ul>
        </Section>

        <Section title="4. Hvorfor vi indsamler det">
          <ul className="list-disc pl-5 space-y-1">
            <li>For at oprette og sikre din konto.</li>
            <li>For at personliggøre kaloriemål, makroer og forslag.</li>
            <li>For at analysere madbilleder med AI og estimere kalorier.</li>
            <li>For at synkronisere dine data på tværs af enheder.</li>
            <li>For at håndtere abonnementer og forhindre misbrug.</li>
            <li>For at forbedre appen og rette fejl.</li>
          </ul>
        </Section>

        <Section title="5. Retsgrundlag (GDPR art. 6)">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Aftale:</b> de kernefunktioner du tilmeldte dig.</li>
            <li><b>Samtykke:</b> AI-billedanalyse, push, helbredssync. Kan trækkes tilbage når som helst.</li>
            <li><b>Legitim interesse:</b> sikkerhed, misbrugsbeskyttelse, forbedringer.</li>
            <li><b>Lovkrav:</b> bogføring og skat ved betalinger.</li>
          </ul>
        </Section>

        <Section title="6. AI & madbilleder">
          <p>
            Når du scanner et måltid sendes billedet til vores AI-leverandør (Google Gemini via
            Lovable AI Gateway) for at estimere ernæring. Billedet bruges <b>kun</b> til at give dig
            et resultat – det bruges <b>ikke</b> til at træne tredjeparts modeller. Vi gemmer
            resultatet (kalorier, makroer), <b>ikke</b> det originale billede – medmindre du selv
            vælger at gemme måltidet.
          </p>
        </Section>

        <Section title="7. Tredjeparter">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Lovable Cloud (Supabase):</b> sikker database & login (EU-region).</li>
            <li><b>Lovable AI Gateway / Google Gemini:</b> billedanalyse.</li>
            <li><b>Paddle:</b> betalinger og abonnementer.</li>
            <li><b>Apple Health / Google Fit:</b> kun hvis du selv aktiverer det.</li>
          </ul>
          <p className="mt-2">Vi <b>sælger aldrig</b> dine personlige data.</p>
        </Section>

        <Section title="8. Sikkerhed & kryptering">
          <ul className="list-disc pl-5 space-y-1">
            <li>Kryptering i transit (HTTPS/TLS) og at rest.</li>
            <li>Row-Level Security – kun du kan læse dine data.</li>
            <li>Adgangskoder hashes – vi ser dem aldrig i klartekst.</li>
            <li>Rate limiting og bot-beskyttelse.</li>
            <li>Regelmæssige sikkerhedsgennemgange.</li>
          </ul>
        </Section>

        <Section title="9. Dine rettigheder (GDPR)">
          <ul className="list-disc pl-5 space-y-1">
            <li>Adgang til de data vi har om dig.</li>
            <li>Rettelse af forkerte data.</li>
            <li>Sletning af konto og data ("retten til at blive glemt").</li>
            <li>Eksport af dine data (dataportabilitet).</li>
            <li>Indsigelse mod eller begrænsning af behandling.</li>
            <li>Tilbagekaldelse af samtykke når som helst.</li>
            <li>Klage til Datatilsynet.</li>
          </ul>
          <p className="mt-2">
            Du kan eksportere eller slette dine data direkte i appen under <b>Hjælp → Konto</b>,
            eller skrive til <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>. Vi svarer inden for 30 dage.
          </p>
        </Section>

        <Section title="10. Opbevaringstid">
          <ul className="list-disc pl-5 space-y-1">
            <li>Konto- og profildata: så længe din konto er aktiv.</li>
            <li>Måltider, scans, træning: så længe din konto er aktiv.</li>
            <li>Ved kontosletning: alle persondata slettes permanent inden 30 dage.</li>
            <li>Betalingsregistre: opbevares op til 7 år (lovkrav).</li>
          </ul>
        </Section>

        <Section title="11. Børn">
          <p>ScanIQ er ikke beregnet til brugere under 13 år. Hvis et barn har oprettet en konto, sletter vi den ved henvendelse.</p>
        </Section>

        <Section title="12. App Store & Google Play vilkår">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Ingen medicinske diagnoser</b> eller behandlingsgarantier.</li>
            <li>Ingen vildledende eller urealistiske <b>vægttabs-løfter</b>.</li>
            <li>Privatlivspolitik er tilgængelig her og påkrævet for app-distribution.</li>
            <li>Appen skal være stabil – fejl rapporteres til support og rettes hurtigst muligt.</li>
          </ul>
        </Section>

        <Section title="13. Login & sikkerhed">
          <p>
            Login er <b>påkrævet</b> for at bruge appen – der er ingen gæsteadgang. Dette
            beskytter dine data og sikrer at kun du kan tilgå dem. Brug en stærk adgangskode og
            log ud på delte enheder.
          </p>
        </Section>

        <Section title="14. Internationale overførsler">
          <p>
            Nogle leverandører (fx AI) kan behandle data uden for EU. Vi bruger
            EU-Kommissionens standardkontraktbestemmelser (SCC) til at sikre beskyttelsen.
          </p>
        </Section>

        <Section title="15. Ændringer">
          <p>Vi kan opdatere denne politik. Større ændringer varsles i appen. Datoen øverst viser den aktuelle version.</p>
        </Section>

        <Section title="16. Kontakt">
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
