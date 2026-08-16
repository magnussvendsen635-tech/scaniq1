INSERT INTO public.subscriptions (user_id, revenuecat_subscription_id, revenuecat_customer_id, product_id, price_id, status, current_period_start, current_period_end, environment, entitlement_id)
SELECT p.id, 'appreview-'||p.id, p.id::text, 'com.scaniq.monthly', 'com.scaniq.monthly', 'active', now(), timestamptz '2036-01-01', 'production', 'pro'
FROM public.profiles p
WHERE p.email = 'c6mpkb5f4b@privaterelay.appleid.com'
  AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id AND s.status = 'active');

UPDATE public.profiles SET is_premium = true WHERE email = 'c6mpkb5f4b@privaterelay.appleid.com';