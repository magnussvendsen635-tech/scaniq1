import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useT } from "@/i18n/useT";
import { useAutoTranslate } from "@/i18n/useAutoTranslate";

const SOURCE = [
  "Last updated: June 8, 2026",
  "Seller & Merchant of Record",
  "ScanIQ is developed and operated by Kinetex Intelligens. When you purchase a subscription within the app, the transaction is processed directly by Apple Inc. via the App Store. Apple acts as the merchant for all in-app purchases; they handle the payment, issue the receipt, and manage any refund requests. Please refer to Apple's Media Services Terms and Conditions for information regarding in-app purchases and refunds.",
  "Refunds for In-App Purchases (Apple App Store)",
  "Because Apple is the seller of all subscriptions purchased in the app, all refund requests must be submitted directly to Apple at",
  "Apple decides whether a refund is granted according to Apple's Media Services Terms and Conditions.",
  "Refunds for Google Play Purchases",
  "For subscriptions purchased via Google Play, refunds are handled directly by Google. Submit your request at",
  "Subscription Cancellation",
  "You can cancel your subscription at any time in your Apple App Store or Google Play account. Cancellation takes effect at the end of the current billing period, and you retain Premium access until that date. Already paid periods are not refunded.",
  "Contact",
  "If you have questions, contact us at",
  "— note that we cannot issue refunds for in-app purchases directly, as Apple and Google are the merchant of record.",
];

export default function Refund() {
  const nav = useNavigate();
  const t = useT();
  const { translations: T } = useAutoTranslate(SOURCE);

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
        <p className="text-xs text-muted-foreground">{T[0]} · Kinetex Intelligens · scaniqapp1@gmail.com</p>

        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs leading-relaxed">
          <b className="block mb-1">{T[1]}</b>
          {T[2]}
        </div>

        <section>
          <h2 className="text-base font-semibold mb-2">{T[3]}</h2>
          <p>
            {T[4]}{" "}
            <a className="text-primary-glow underline" href="https://reportaproblem.apple.com" target="_blank" rel="noopener">reportaproblem.apple.com</a>.{" "}
            {T[5]}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">{T[6]}</h2>
          <p>
            {T[7]}{" "}
            <a className="text-primary-glow underline" href="https://play.google.com" target="_blank" rel="noopener">play.google.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">{T[8]}</h2>
          <p>{T[9]}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">{T[10]}</h2>
          <p>
            {T[11]}{" "}
            <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">scaniqapp1@gmail.com</a>{" "}
            {T[12]}
          </p>
        </section>
      </div>
    </div>
  );
}
