update public.profiles set is_premium = true where id = 'f3f55588-09bc-4760-9ded-00c5c17b5a85';

update public.subscriptions
set status='active', cancel_at_period_end=false,
    current_period_start=now(), current_period_end=now() + interval '10 years',
    updated_at=now()
where user_id='f3f55588-09bc-4760-9ded-00c5c17b5a85';

insert into public.subscriptions (user_id, revenuecat_subscription_id, revenuecat_customer_id, product_id, price_id, status, current_period_start, current_period_end, environment, entitlement_id)
select 'f3f55588-09bc-4760-9ded-00c5c17b5a85', 'manual-appreview', 'manual-appreview', 'com.scaniq.monthly', 'com.scaniq.monthly', 'active', now(), now() + interval '10 years', 'production', 'pro'
where not exists (select 1 from public.subscriptions where user_id='f3f55588-09bc-4760-9ded-00c5c17b5a85');