import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2, Sparkles, RefreshCw, Gift } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import logo from "@/assets/scaniq-leaf-logo.png";

const featureKeys: TKey[] = [
  "premium.feat_scans",
  "premium.feat_macros",
  "premium.feat_workouts",
  "premium.feat_trends",
  "premium.feat_priority",
];

export default function Premium() {
  const nav = useNavigate();
  const t = useT();
  const { user } = useAuth();
  const { isActive, refetch } = useSubscription();
  const { openCheckout, loading } = usePaddleCheckout();
  const [plan, setPlan] = useState<"month" | "year">("year");
  const [restoring, setRestoring] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [code, setCode] = useState("");

  const upgrade = async () => {
    if (!user) {
      toast.error("Du skal være logget ind");
      return;
    }
    try {
      await openCheckout({
        priceId: plan === "month" ? "kcally_premium_monthly" : "kcally_premium_yearly",
        customerEmail: user.email,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/profile?checkout=success`,
      });
    } catch (e: any) {
      toast.error("Kunne ikke åbne betaling", { description: e?.message });
    }
  };

  const restore = async () => {
    setRestoring(true);
    try {
      await refetch();
      if (isActive) {
        toast.success("Dit abonnement er gendannet");
      } else {
        toast("Intet aktivt abonnement fundet", {
          description: "Hvis du lige har købt, så vent et øjeblik og prøv igen.",
        });
      }
    } finally {
      setRestoring(false);
    }
  };

  const redeem = async () => {
    if (!code.trim()) return;
    toast("Kode modtaget", {
      description: "Vi tjekker din kode. Du får besked, når den er aktiveret.",
    });
    setCode("");
    setRedeemOpen(false);
  };

  return (
    <div className="k-page bg-[hsl(40_40%_97%)] min-h-screen overflow-y-auto" style={{ paddingBottom: 100 }}>
      <PaymentTestModeBanner />

      <header className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => nav(-1)}
          aria-label="Tilbage"
          className="k-tap w-10 h-10 rounded-full bg-white border border-border/60 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{t("premium.title")}</h1>
      </header>

      {/* Hero */}
      <section className="rounded-3xl bg-white border border-border/50 p-7 mb-6 text-center shadow-[0_8px_30px_-12px_hsl(24_95%_55%/0.25)]">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,hsl(24_95%_60%/0.45)_0%,transparent_70%)] blur-xl scale-125" />
          <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-[0_6px_20px_hsl(24_95%_55%/0.35)]">
            <img src={logo} alt="ScanIQ" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("premium.unlock")}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
          {t("premium.unlock_sub")}
        </p>
      </section>

      {/* Features */}
      <section className="rounded-3xl bg-white border border-border/50 p-5 mb-6 shadow-sm">
        <div className="space-y-3">
          {featureKeys.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[hsl(24_95%_53%/0.12)] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[hsl(24_95%_45%)]" strokeWidth={3} />
              </div>
              <span className="text-sm font-medium text-foreground/90">{t(k)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="grid grid-cols-2 gap-3 mb-5">
        <PlanOption
          active={plan === "month"}
          onClick={() => setPlan("month")}
          title={t("premium.monthly")}
          price="$19"
          unit={t("premium.per_month")}
          sub={t("premium.cancel_anytime")}
        />
        <PlanOption
          active={plan === "year"}
          onClick={() => setPlan("year")}
          title={t("premium.yearly")}
          price="$179"
          unit={t("premium.per_year")}
          sub={t("premium.lifetime")}
          badge="Most Popular"
          highlight
        />
      </section>

      <Button
        onClick={upgrade}
        disabled={isActive || loading}
        className="w-full h-14 rounded-2xl bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white text-base font-semibold tracking-tight shadow-[0_10px_24px_-8px_hsl(24_95%_55%/0.6)] transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5 mr-2" />
        )}
        {isActive ? t("premium.youre_premium") : t("premium.upgrade_now")}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center mt-3 px-6 leading-relaxed">
        Abonnementet fornyes automatisk. Du kan opsige når som helst.
      </p>

      {/* Footer actions */}
      <footer className="mt-8 pt-6 border-t border-border/50">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <FooterAction
            icon={<RefreshCw className="w-4 h-4" />}
            label={restoring ? "Gendanner…" : "Gendan køb"}
            onClick={restore}
            disabled={restoring}
          />
          <FooterAction
            icon={<Gift className="w-4 h-4" />}
            label="Indløs kode"
            onClick={() => setRedeemOpen(true)}
          />
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <button
            onClick={() => nav("/terms")}
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Servicevilkår
          </button>
          <span className="text-border">·</span>
          <button
            onClick={() => nav("/privacy")}
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Privatlivspolitik
          </button>
        </div>
      </footer>

      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Indløs kode</DialogTitle>
            <DialogDescription>
              Indtast din kampagne- eller gavekode for at aktivere Premium.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="rounded-xl h-12"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRedeemOpen(false)}>
              Annullér
            </Button>
            <Button
              onClick={redeem}
              disabled={!code.trim()}
              className="bg-[hsl(24_95%_53%)] hover:bg-[hsl(24_95%_48%)] text-white rounded-xl"
            >
              Indløs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PlanOption = ({
  active,
  onClick,
  title,
  price,
  unit,
  sub,
  badge,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  price: string;
  unit: string;
  sub: string;
  badge?: string;
  highlight?: boolean;
}) => (
  <button
    onClick={onClick}
    className={
      "k-tap p-5 text-left relative rounded-2xl transition-all border " +
      (active
        ? "border-[hsl(24_95%_53%)] bg-white shadow-[0_8px_24px_-10px_hsl(24_95%_55%/0.5)] ring-2 ring-[hsl(24_95%_53%/0.25)]"
        : "border-border/60 bg-white shadow-sm hover:shadow-md") +
      (highlight && !active ? " ring-1 ring-[hsl(24_95%_53%/0.3)]" : "")
    }
  >
    {badge && (
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider bg-[hsl(24_95%_53%)] text-white rounded-full px-2.5 py-0.5 shadow-sm whitespace-nowrap">
        {badge}
      </span>
    )}
    <div className="text-[11px] tracking-wider uppercase font-semibold text-muted-foreground">
      {title}
    </div>
    <div className="mt-2 flex items-baseline gap-1">
      <span className="text-3xl font-bold tracking-tight">{price}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
    <div className="text-xs mt-1 text-muted-foreground">{sub}</div>
  </button>
);

const FooterAction = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="k-tap flex items-center justify-center gap-2 h-11 rounded-xl bg-white border border-border/60 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-border transition-all disabled:opacity-60"
  >
    {icon}
    {label}
  </button>
);
