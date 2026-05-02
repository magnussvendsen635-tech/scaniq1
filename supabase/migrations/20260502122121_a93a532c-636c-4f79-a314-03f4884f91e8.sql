-- Restrict has_active_subscription so callers can only check their own status,
-- and revoke EXECUTE from anon/authenticated so it cannot be probed publicly.
-- Service role (used by edge functions / webhooks) retains access.

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := current_setting('request.jwt.claims', true)::jsonb->>'role';

  -- Service role bypass (used by edge functions and webhooks)
  IF jwt_role = 'service_role' THEN
    -- allowed
    NULL;
  ELSE
    -- Anyone else may only check their own subscription status
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

REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO service_role;