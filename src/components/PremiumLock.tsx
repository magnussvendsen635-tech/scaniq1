import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Hard paywall lock: blurs content and redirects to /premium on tap.
 * Unlock state is driven exclusively by a server-verified active
 * subscription — there is no time-based or local override.
 */
export function PremiumLock({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  const { isActive } = useSubscription();

  if (isActive) return <div className={className}>{children}</div>;

  return (
    <div className={"relative " + className}>
      <div
        aria-hidden
        className="pointer-events-none select-none"
        style={{ filter: "blur(10px)", opacity: 0.55 }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => navigate("/premium")}
        aria-label="Opgradér til ScanIQ Pro"
        className="absolute inset-0 flex items-center justify-center cursor-pointer bg-background/10 hover:bg-background/20 transition-colors"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/60 shadow-md text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-primary-glow" strokeWidth={2.5} />
          Lås op med Pro
        </span>
      </button>
    </div>
  );
}
