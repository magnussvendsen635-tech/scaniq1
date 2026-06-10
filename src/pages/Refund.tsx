import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useT } from "@/i18n/useT";
import { useKStore } from "@/store/useKStore";

export default function Refund() {
  const nav = useNavigate();
  const t = useT();
  const lang = useKStore((s) => s.language).split("-")[0];
  const da = lang === "da";

  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo title={`${t("legal.refund_title")} — ScanIQ`} description="Refund policy for ScanIQ subscriptions." path="/refund" />
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center" aria-label={t("common.back")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t("legal.refund_title")}</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">
          {da ? "Sidst opdateret: 8. juni 2026" : "Last updated: June 8, 2026"} · Kinetex Intelligens · scaniqapp1@gmail.com
        </p>

        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1">{da ? "Sælger & Merchant of Record" : "Seller & Merchant of Record"}</b>
          {da
            ? "ScanIQ er udviklet og drevet af Kinetex Intelligens. Når du køber et abonnement i appen, behandles transaktionen direkte af Apple Inc. via App Store. Apple er sælger og merchant of record for alle køb i appen; de håndterer betalingen, udsteder kvitteringen og behandler refundering. Se Apples Media Services Vilkår for information om køb i appen og refundering."
            : "ScanIQ is developed and operated by Kinetex Intelligens. When you purchase a subscription within the app, the transaction is processed directly by Apple Inc. via the App Store. Apple acts as the merchant for all in-app purchases; they handle the payment, issue the receipt, and manage any refund requests. Please refer to Apple's Media Services Terms and Conditions for information regarding in-app purchases and refunds."}
        </div>

        <section>
          <h2 className="text-base font-semibold mb-2">{da ? "Refundering af køb i appen (Apple App Store)" : "Refunds for In-App Purchases (Apple App Store)"}</h2>
          <p>
            {da
              ? "Da Apple er sælger af alle abonnementer købt i appen, skal alle anmodninger om refundering sendes direkte til Apple på "
              : "Because Apple is the seller of all subscriptions purchased in the app, all refund requests must be submitted directly to Apple at "}
            <a className="text-primary-glow underline" href="https://reportaproblem.apple.com" target="_blank" rel="noopener">reportaproblem.apple.com</a>.
            {" "}
            {da
              ? "Apple beslutter selv om refundering imødekommes i henhold til Apples Media Services Vilkår."
              : "Apple decides whether a refund is granted according to Apple's Media Services Terms and Conditions."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">{da ? "Refundering af køb på Google Play" : "Refunds for Google Play Purchases"}</h2>
          <p>
            {da
              ? "For abonnementer købt via Google Play håndteres refundering direkte af Google. Indsend din anmodning på "
              : "For subscriptions purchased via Google Play, refunds are handled directly by Google. Submit your request at "}
            <a className="text-primary-glow underline" href="https://play.google.com" target="_blank" rel="noopener">play.google.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">{da ? "Opsigelse af abonnement" : "Subscription Cancellation"}</h2>
          <p>
            {da
              ? "Du kan opsige dit abonnement når som helst i din Apple App Store- eller Google Play-konto. Opsigelsen træder i kraft ved slutningen af den aktuelle betalingsperiode, og du beholder Premium-adgang indtil da. Allerede betalte perioder refunderes ikke."
              : "You can cancel your subscription at any time in your Apple App Store or Google Play account. Cancellation takes effect at the end of the current billing period, and you retain Premium access until that date. Already paid periods are not refunded."}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">{da ? "Kontakt" : "Contact"}</h2>
          <p>
            {da ? "Hvis du har spørgsmål, kan du skrive til os på " : "If you have questions, contact us at "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>
            {da ? " — bemærk dog at vi ikke kan udstede refundering for køb i appen direkte, da Apple og Google er merchant of record." : " — note that we cannot issue refunds for in-app purchases directly, as Apple and Google are the merchant of record."}
          </p>
        </section>
      </div>
    </div>
  );
}
