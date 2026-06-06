import { Link, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import logo from "@/assets/scaniq-leaf-logo.png";

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
      aria-label="Upgrade to ScanIQ Pro Premium"
      className="fixed z-50 top-[max(env(safe-area-inset-top),0.75rem)] right-3 inline-flex items-center gap-2 pl-1 pr-4 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider text-white shadow-[0_6px_18px_-4px_rgba(245,158,91,0.65)] bg-gradient-to-r from-[#F59E5B] to-[#EA6A1F] hover:brightness-110 active:scale-95 transition-all"
    >
      <img
        src={logo}
        alt=""
        className="shrink-0"
        style={{ width: 32, height: 32, objectFit: "contain", background: "transparent", display: "block" }}
      />
      Upgrade
    </Link>
  );
}
