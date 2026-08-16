DELETE FROM public.subscriptions s
WHERE s.status = 'canceled'
  AND s.current_period_end IS NULL
  AND EXISTS (
    SELECT 1 FROM public.subscriptions a
    WHERE a.user_id = s.user_id
      AND a.status = 'active'
      AND (a.current_period_end IS NULL OR a.current_period_end > now())
  );

UPDATE public.profiles p
SET is_premium = true
WHERE p.is_premium = false
  AND EXISTS (
    SELECT 1 FROM public.subscriptions a
    WHERE a.user_id = p.id
      AND a.status IN ('active','trialing','past_due')
      AND (a.current_period_end IS NULL OR a.current_period_end > now())
  );