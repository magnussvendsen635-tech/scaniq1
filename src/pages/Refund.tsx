import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

export default function Refund() {
  const nav = useNavigate();
  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo
        title="Refunderingspolitik — ScanIQ"
        description="Refunderingspolitik for ScanIQ-abonnementer. 14 dages fortrydelsesret håndteret af Paddle."
        path="/refund"
      />
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center"
          aria-label="Tilbage"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Refunderingspolitik</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">
          Sidst opdateret: 6. juni 2026 · KCALLY (handelsnavn: ScanIQ) · scaniqapp1@gmail.com
        </p>

        <p className="text-xs">
          ScanIQ sælges af <b>KCALLY</b>. Web-køb behandles af vores online-forhandler{" "}
          <b>Paddle.com Market Limited</b>, som er <b>Merchant of Record</b> og
          står for fakturering, moms og refunderinger.
        </p>

        <section>
          <h2 className="text-base font-semibold mb-2">14 dages fortrydelsesret</h2>
          <p>
            Vi tilbyder en <b>14 dages pengene-tilbage-garanti</b> på alle nye
            Premium-abonnementer. Hvis du ikke er tilfreds med dit køb, kan du
            anmode om fuld refundering inden for 14 dage efter købsdatoen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Sådan anmoder du om refundering</h2>
          <p>
            Vores ordrer behandles af vores online-forhandler{" "}
            <b>Paddle.com</b>, som er Merchant of Record for alle køb foretaget
            via web. Du anmoder om refundering på en af følgende måder:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              Gå til{" "}
              <a className="text-primary-glow underline" href="https://paddle.net" target="_blank" rel="noopener">
                paddle.net
              </a>{" "}
              og log ind med den e-mail, du brugte ved købet.
            </li>
            <li>
              Eller kontakt os på{" "}
              <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">
                scaniqapp1@gmail.com
              </a>{" "}
              — så hjælper vi dig videre.
            </li>
          </ul>
          <p className="mt-2">
            Refunderinger behandles efter Paddles{" "}
            <a className="text-primary-glow underline" href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener">
              Refund Policy
            </a>{" "}
            og{" "}
            <a className="text-primary-glow underline" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener">
              Buyer Terms
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Køb via App Store / Google Play</h2>
          <p>
            Køb foretaget via Apple App Store eller Google Play håndteres af
            den respektive platform. Refundering anmodes direkte hos Apple
            (reportaproblem.apple.com) eller Google Play (play.google.com).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Opsigelse af abonnement</h2>
          <p>
            Du kan opsige dit abonnement når som helst via{" "}
            <b>Profil → Premium → Administrér abonnement</b>. Opsigelse træder
            i kraft ved periodens udløb, og du beholder Premium frem til den
            dato. Allerede betalte perioder refunderes ikke ved opsigelse
            efter de 14 dages fortrydelsesret, medmindre andet er aftalt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Kontakt</h2>
          <p>
            ScanIQ ·{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">
              scaniqapp1@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
