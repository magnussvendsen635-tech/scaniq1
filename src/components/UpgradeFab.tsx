import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useT } from "@/i18n/useT";

/**
 * Floating "Upgrade" pill in the top-right corner.
 * Hidden when the user already has an active subscription or is on
 * the Premium / Auth / Onboarding routes.
 */
export function UpgradeFab() {
  const { pathname } = useLocation();
  const { isActive } = useSubscription();
  const t = useT();

  const hiddenRoutes = ["/premium", "/auth", "/onboarding"];
  if (isActive || hiddenRoutes.includes(pathname)) return null;

  return (
    <Link
      to="/premium"
      aria-label={t("profile.go_premium")}
      className="scan-hide-on-scan fixed z-50 top-[max(env(safe-area-inset-top),0.75rem)] right-3 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider text-white border-0 outline-none ring-0 shadow-[0_6px_18px_-4px_rgba(245,158,91,0.55)] bg-gradient-to-r from-[#F59E5B] to-[#EA6A1F] hover:brightness-110 active:scale-95 transition-all"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
      <span>{t("premium.upgrade_now")}</span>
    </Link>
  );
}
