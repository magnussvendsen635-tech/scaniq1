import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SubscriptionRow {
  id: string;
  status: string;
  price_id: string;
  product_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
}

const cacheKey = (userId: string) => `scaniq.sub.${userId}`;

const readCache = (userId: string | undefined): { hit: boolean; isActive: boolean } => {
  if (!userId) return { hit: false, isActive: false };
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return { hit: false, isActive: false };
    const parsed = JSON.parse(raw) as { isActive: boolean; periodEnd: string | null };
    if (parsed.isActive && parsed.periodEnd && new Date(parsed.periodEnd) <= new Date()) {
      return { hit: true, isActive: false };
    }
    return { hit: true, isActive: !!parsed.isActive };
  } catch {
    return { hit: false, isActive: false };
  }
};

const writeCache = (userId: string, sub: SubscriptionRow | null, isActive: boolean) => {
  try {
    localStorage.setItem(
      cacheKey(userId),
      JSON.stringify({ isActive, periodEnd: sub?.current_period_end ?? null })
    );
  } catch {}
};

const computeActive = (sub: SubscriptionRow | null) =>
  !!sub && (
    (["active", "trialing", "past_due"].includes(sub.status) &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) ||
    (sub.status === "canceled" && !!sub.current_period_end &&
      new Date(sub.current_period_end) > new Date())
  );

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const initial = readCache(user?.id);
  const [cachedActive, setCachedActive] = useState<boolean>(initial.isActive);
  const [loading, setLoading] = useState<boolean>(!initial.hit);
  const [verified, setVerified] = useState<boolean>(false);

  const fetchSub = async () => {
    if (!user) {
      setSubscription(null);
      setCachedActive(false);
      setLoading(false);
      setVerified(true);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = (data as SubscriptionRow | null) ?? null;
    const active = computeActive(row);
    setSubscription(row);
    setCachedActive(active);
    setLoading(false);
    setVerified(true);
    writeCache(user.id, row, active);
  };

  useEffect(() => {
    const seed = readCache(user?.id);
    setCachedActive(seed.isActive);
    setLoading(!seed.hit);
    setVerified(false);
    fetchSub();
    if (!user) return;
    const channel = supabase
      .channel(`sub-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => fetchSub()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isActive = verified ? computeActive(subscription) : cachedActive;

  return { subscription, isActive, loading, verified, refetch: fetchSub };
}
