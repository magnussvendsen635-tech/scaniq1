import type { ReactNode } from "react";

/**
 * Globally unlocked: full access for all users.
 * Previously this wrapped content in a blurred premium gate; now it just
 * renders the children unchanged.
 */
export function PremiumLock({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
