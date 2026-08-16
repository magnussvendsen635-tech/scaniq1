/**
 * Single source of truth for "does this user have Premium right now?".
 *
 * Premium is granted when EITHER:
 *  - profiles.is_premium is true (manual/admin grant, RevenueCat sync), OR
 *  - there is a subscription row that is currently active.
 *
 * This mirrors `computeActive()` in src/hooks/useSubscription.ts so the UI and
 * the edge functions can never disagree (which caused "You're Premium" on the
 * Premium page while the scanner replied premium_required).
 */
export async function hasPremiumAccess(
  admin: any,
  userId: string,
  profileIsPremium?: boolean | null,
): Promise<boolean> {
  if (profileIsPremium) return true;

  if (profileIsPremium === undefined) {
    const { data: p } = await admin
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .maybeSingle();
    if (p?.is_premium) return true;
  }

  const { data: subs } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId);

  const now = Date.now();
  return (subs ?? []).some((s: any) => {
    const end = s.current_period_end ? new Date(s.current_period_end).getTime() : null;
    if (["active", "trialing", "past_due"].includes(s.status)) {
      return end === null || end > now;
    }
    if (s.status === "canceled") return end !== null && end > now;
    return false;
  });
}
