import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";

export default function Refund() {
  const nav = useNavigate();
  return (
    <div className="k-page max-w-2xl mx-auto pb-32">
      <Seo
        title="Refund Policy — ScanIQ"
        description="Refund policy for ScanIQ subscriptions. 14-day money-back guarantee handled by Paddle."
        path="/refund"
      />
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Refund Policy</h1>
      </header>

      <div className="k-card p-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p className="text-xs text-muted-foreground">
          Last updated: June 8, 2026 · Kinetex Intelligens (under formation) · scaniqapp1@gmail.com
        </p>

        <p className="text-xs">
          ScanIQ is sold by <b>Kinetex Intelligens (under formation)</b>. Web purchases are
          processed by our online reseller <b>Paddle.com Market Limited</b>, which is the{" "}
          <b>Merchant of Record</b> and handles invoicing, tax, and refunds.
        </p>

        <section>
          <h2 className="text-base font-semibold mb-2">14-Day Money-Back Guarantee</h2>
          <p>
            We offer a <b>14-day money-back guarantee</b> on all new Premium subscriptions.
            If you are not satisfied with your purchase, you may request a full refund
            within 14 days of the purchase date.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">How to Request a Refund</h2>
          <p>
            Our orders are processed by our online reseller <b>Paddle.com</b>, which is the
            Merchant of Record for all web purchases. You can request a refund in one of
            the following ways:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              Go to{" "}
              <a className="text-primary-glow underline" href="https://paddle.net" target="_blank" rel="noopener">
                paddle.net
              </a>{" "}
              and log in with the email used for the purchase.
            </li>
            <li>
              Or contact us at{" "}
              <a className="text-primary-glow underline" href="mailto:scaniqapp1@gmail.com">
                scaniqapp1@gmail.com
              </a>{" "}
              — and we will assist you.
            </li>
          </ul>
          <p className="mt-2">
            Refunds are processed according to Paddle's{" "}
            <a className="text-primary-glow underline" href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener">
              Refund Policy
            </a>{" "}
            and{" "}
            <a className="text-primary-glow underline" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener">
              Buyer Terms
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Purchases via App Store / Google Play</h2>
          <p>
            Purchases made via the Apple App Store or Google Play are handled by the
            respective platform. Refund requests must be made directly to Apple
            (reportaproblem.apple.com) or Google Play (play.google.com).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Subscription Cancellation</h2>
          <p>
            You can cancel your subscription at any time via{" "}
            <b>Profile → Premium → Manage Subscription</b>. Cancellation takes effect at
            the end of the period, and you retain Premium access until that date. Already
            paid periods are not refunded after the 14-day cancellation window, unless
            otherwise agreed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Contact</h2>
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
