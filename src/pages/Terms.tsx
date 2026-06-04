import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

export default function Terms() {
  const nav = useNavigate();
  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo
        title="Servicevilkår — ScanIQ"
        description="Vilkår og betingelser for brug af ScanIQ — AI-drevet kalorie- og ernæringstracker."
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
        <h1 className="text-2xl font-semibold tracking-tight">Servicevilkår</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">
          Sidst opdateret: 4. juni 2026 · Sælger: KCALLY · Kontakt: scaniqapp1@gmail.com
        </p>

        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1">Forhandler & betalingsbehandler</b>
          Vores ordreproces håndteres af vores online-forhandler{" "}
          <b>Paddle.com</b>. Paddle.com er <b>Merchant of Record</b> for alle
          vores ordrer på web og fremgår som betalingsmodtager på din
          kontoudtog. Paddle behandler alle kundehenvendelser vedrørende
          betaling og håndterer refunderinger. Se Paddles{" "}
          <a className="underline" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener">Buyer Terms</a>.
        </div>

        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1 text-amber-300">Ikke medicinsk rådgivning</b>
          ScanIQ er <b>ikke et lægeligt værktøj</b> og giver ingen diagnoser, behandling eller
          garantier for resultater. Indholdet er kun til oplysende og generelle wellness-formål.
          Tal altid med en læge eller diætist før du foretager større ændringer i kost eller
          træning.
        </div>

        <Section title="1. Accept af vilkårene">
          <p>
            Ved at bruge ScanIQ accepterer du disse vilkår. Hvis du ikke accepterer dem, må du
            ikke bruge appen.
          </p>
        </Section>

        <Section title="2. Kalorier & næring er estimater">
          <p>
            Alle kalorier, makroer, sundhedsscores og AI-genererede vurderinger er <b>estimater</b>
            og kan være unøjagtige. Du er selv ansvarlig for at vurdere indholdet før du handler
            på det. Brug ikke appen som eneste kilde til ernæringsdata i medicinske sammenhænge.
          </p>
        </Section>

        <Section title="3. Brugeransvar">
          <ul className="list-disc pl-5 space-y-1">
            <li>Du er ansvarlig for nøjagtigheden af de data du indtaster.</li>
            <li>Du må kun bruge appen til lovlige formål.</li>
            <li>Du må ikke forsøge at hacke, reverse engineere eller misbruge tjenesten.</li>
            <li>Du er ansvarlig for at holde dine login-oplysninger sikre.</li>
          </ul>
        </Section>

        <Section title="4. Abonnement & betaling">
          <ul className="list-disc pl-5 space-y-1">
            <li>Premium tilbydes som <b>månedligt</b> eller <b>årligt</b> abonnement.</li>
            <li>Abonnementet fornyes <b>automatisk</b> ved periodens udløb, medmindre du opsiger det inden da.</li>
            <li>Opsigelse træder i kraft ved <b>periodens udløb</b> – du beholder Premium frem til den dato.</li>
            <li>
              Web-køb håndteres af <b>Paddle.com</b> som Merchant of Record. Vilkår, fakturering,
              skat og opsigelse følger Paddles{" "}
              <a className="text-primary-glow underline" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener">Buyer Terms</a>.
            </li>
            <li>
              <b>14 dages pengene-tilbage-garanti</b>: Du kan anmode om fuld refundering inden for
              14 dage efter købet via{" "}
              <a className="text-primary-glow underline" href="https://paddle.net" target="_blank" rel="noopener">paddle.net</a>{" "}
              eller ved at kontakte os. Se vores fulde{" "}
              <a className="text-primary-glow underline" href="/refund">Refunderingspolitik</a>.
            </li>
            <li>Køb via App Store / Google Play håndteres af de respektive platforme efter deres regler.</li>
            <li>Restore Purchase gendanner kun et eksisterende abonnement – det giver hverken refusioner eller gratis Premium.</li>
          </ul>
        </Section>


        <Section title="5. Ingen garantier">
          <p>
            Appen leveres "som den er". Vi giver ingen garantier for at appen er fejlfri, altid
            tilgængelig eller at den fører til et bestemt vægttab eller helbredsresultat.
          </p>
        </Section>

        <Section title="6. Ansvarsbegrænsning">
          <p>
            I det omfang loven tillader det, er By Kinetix Intelligence samlede ansvar begrænset til det
            beløb du har betalt for Premium de seneste 12 måneder. Vi er ikke ansvarlige for
            indirekte tab eller helbredsmæssige konsekvenser af din brug af appen.
          </p>
        </Section>

        <Section title="7. Ændringer af vilkårene">
          <p>
            Vi kan opdatere disse vilkår. Større ændringer varsles i appen. Fortsat brug efter
            ændringer betyder accept af de nye vilkår.
          </p>
        </Section>

        <Section title="8. Opsigelse">
          <p>
            Vi kan suspendere eller opsige din konto ved misbrug eller brud på vilkårene. Du kan
            slette din konto når som helst under <b>Profil → Hjælp → Slet konto</b>.
          </p>
        </Section>

        <Section title="9. Lovvalg">
          <p>Disse vilkår er underlagt dansk lov.</p>
        </Section>

        <Section title="10. Kontakt">
          <p>
            By Kinetix Intelligence ·{" "}
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
