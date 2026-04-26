import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { useT } from "@/i18n/useT";
import type { ReactNode } from "react";

/**
 * Wraps content that requires premium. Renders the children blurred and shows
 * a "Get Premium" pill on top that links to /premium.
 */
export function PremiumLock({ children, className = "" }: { children: ReactNode; className?: string }) {
  const t = useT();
  return (
    <div className={"relative " + className}>
      <div className="pointer-events-none select-none blur-[6px] opacity-60">{children}</div>
      <Link
        to="/premium"
        className="absolute inset-0 flex items-center justify-center rounded-3xl bg-background/30 backdrop-blur-[2px] k-tap"
        aria-label={t("home.get_premium")}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-primary text-white text-xs font-semibold shadow-glow">
          <Crown className="w-3.5 h-3.5" />
          {t("home.get_premium")}
        </span>
      </Link>
      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-card/80 border border-border/60 flex items-center justify-center backdrop-blur-sm">
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}
