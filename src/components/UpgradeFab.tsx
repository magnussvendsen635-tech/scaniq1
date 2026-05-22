import { Link, useLocation } from "react-router-dom";
import { Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Small floating "Upgrade" pill sticky in the top-right corner of the app.
 * Hidden when the user already has an active subscription or is on the
 * Premium / Auth / Onboarding routes.
 */
export function UpgradeFab() {
  const { pathname } = useLocation();
  const { isActive } = useSubscription();

  const hiddenRoutes = ["/premium", "/auth", "/onboarding"];
  if (isActive || hiddenRoutes.includes(pathname)) return null;

  return (
    <Link
      to="/premium"
      aria-label="Upgrade to Scaniq Pro Premium"
      className="fixed z-50 top-[max(env(safe-area-inset-top),0.75rem)] right-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_6px_18px_-4px_rgba(245,158,91,0.65)] bg-gradient-to-r from-[#F59E5B] to-[#EA6A1F] hover:brightness-110 active:scale-95 transition-all"
    >
      <Crown className="w-3.5 h-3.5" strokeWidth={2.5} />
      Upgrade
    </Link>
  );
}
