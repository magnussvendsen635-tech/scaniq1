UPDATE public.profiles SET is_premium = true, updated_at = now()
WHERE id IN ('b2fad6d5-edcb-41e1-bb3d-b92d45dec5c7','1708ede6-8cc8-414b-a46f-fa6f81c92d58');

INSERT INTO public.subscriptions (
  user_id, revenuecat_subscription_id, revenuecat_customer_id, product_id, price_id,
  status, current_period_start, current_period_end, cancel_at_period_end,
  environment, entitlement_id, amount_paid_cents, currency
)
SELECT u, 'appreview_' || u || '_com.scaniq.monthly', u::text, 'com.scaniq.monthly', 'com.scaniq.monthly',
       'active', now(), '2036-01-01T00:00:00Z'::timestamptz, false,
       'production', 'ScanIQ: Kalorietæller Pro', 0, 'USD'
FROM (VALUES ('b2fad6d5-edcb-41e1-bb3d-b92d45dec5c7'::uuid), ('1708ede6-8cc8-414b-a46f-fa6f81c92d58'::uuid)) AS t(u);

UPDATE public.subscriptions
SET status = 'active',
    current_period_end = '2036-01-01T00:00:00Z'::timestamptz,
    cancel_at_period_end = false,
    updated_at = now()
WHERE user_id IN ('b2fad6d5-edcb-41e1-bb3d-b92d45dec5c7','1708ede6-8cc8-414b-a46f-fa6f81c92d58');