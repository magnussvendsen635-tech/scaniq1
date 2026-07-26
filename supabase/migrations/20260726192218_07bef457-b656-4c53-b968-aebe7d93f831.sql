-- 1) Subscriptions → RevenueCat
ALTER TABLE public.subscriptions RENAME COLUMN paddle_subscription_id TO revenuecat_subscription_id;
ALTER TABLE public.subscriptions RENAME COLUMN paddle_customer_id TO revenuecat_customer_id;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS entitlement_id text NOT NULL DEFAULT 'pro';

-- environment: sandbox | production
UPDATE public.subscriptions SET environment = 'production' WHERE environment = 'live';
ALTER TABLE public.subscriptions ALTER COLUMN environment SET DEFAULT 'production';

DROP INDEX IF EXISTS public.idx_subscriptions_paddle_id;
CREATE INDEX IF NOT EXISTS idx_subscriptions_revenuecat_id ON public.subscriptions(revenuecat_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- 2) Premium check defaults to production
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'production'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
  IF jwt_role = 'service_role' THEN
    NULL;
  ELSE
    IF auth.uid() IS NULL OR auth.uid() <> user_uuid THEN
      RAISE EXCEPTION 'access denied';
    END IF;
  END IF;

  RETURN exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and environment = check_env
      and (
        (status in ('active', 'trialing') and (current_period_end is null or current_period_end > now()))
        or (status = 'canceled' and current_period_end > now())
      )
  );
END;
$function$;

-- 3) Drop legacy discount tables (unused, from the old payment provider)
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS discount_code_id;
DROP TABLE IF EXISTS public.discount_redemptions;
DROP TABLE IF EXISTS public.discount_codes;