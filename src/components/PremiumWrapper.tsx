import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useT } from "@/i18n/useT";
import logo from "@/assets/scaniq-leaf-logo.png";

interface PremiumWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  /** Deprecated: kept for compatibility, ignored. Hard paywall is always on. */
  disabled?: boolean;
}

/**
 * Hard paywall gate: content is blurred and clicking redirects to /premium.
 * Unlock state is driven exclusively by a server-verified active subscription
 * (useSubscription.isActive). No local flag or timer can bypass the lock.
 */
export function PremiumWrapper({
  children,
  className = "",
  title,
  description,
}: PremiumWrapperProps) {
  const navigate = useNavigate();
  const t = useT();
  const lockedTitle = title ?? t("premium.locked_title");
  const lockedDesc = description ?? t("premium.locked_desc");
  const { isActive, loading } = useSubscription();

  // Skeleton only when no cached state exists. Non-payers hit the locked
  // branch immediately via cached isActive=false, so the paywall is never bypassed.
  if (loading && !isActive) {
    return (
      <div className={"relative " + className} aria-busy="true">
        <div className="absolute inset-0 rounded-3xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (isActive) return <div className={className}>{children}</div>;

  const goPremium = () => navigate("/premium");

  return (
    <div className={"relative " + className}>
      <div
        aria-hidden
        className="select-none"
        style={{ filter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)", opacity: 0.5, pointerEvents: "auto" }}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={goPremium}
        aria-label={t("premium.lock_aria")}
        className="absolute inset-0 flex items-center justify-center p-4 cursor-pointer bg-background/20 hover:bg-background/30 transition-colors"
      >
        <div className="w-full max-w-sm rounded-3xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] p-5 text-center">
          <div className="mx-auto mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#F59E5B] to-[#EA6A1F] shadow-[0_8px_22px_-6px_rgba(245,158,91,0.7)]">
            <Lock className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-base font-semibold mb-1">{lockedTitle}</div>
          <p className="text-xs text-muted-foreground mb-4">{lockedDesc}</p>
          <span
            className="inline-flex items-center gap-2 pl-1 pr-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider text-white shadow-[0_6px_18px_-4px_rgba(245,158,91,0.65)] bg-gradient-to-r from-[#F59E5B] to-[#EA6A1F]"
          >
            <span
              className="inline-flex items-center justify-center overflow-hidden shrink-0"
              style={{ width: 26, height: 26, borderRadius: 9999 }}
            >
              <img
                src={logo}
                alt=""
                style={{
                  width: "140%",
                  height: "140%",
                  objectFit: "cover",
                  borderRadius: 9999,
                  display: "block",
                }}
              />
            </span>
            {t("premium.upgrade_btn")}
          </span>
        </div>
      </button>
    </div>
  );
}
