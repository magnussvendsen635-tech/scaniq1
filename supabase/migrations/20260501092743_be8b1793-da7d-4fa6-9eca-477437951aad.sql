CREATE OR REPLACE FUNCTION public.prevent_premium_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := current_setting('request.jwt.claims', true)::jsonb->>'role';

  -- Service role (used by edge function webhooks) bypasses these checks
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF current_setting('request.jwt.claims', true) IS NOT NULL
     AND OLD.is_premium IS DISTINCT FROM NEW.is_premium THEN
    RAISE EXCEPTION 'is_premium can only be changed by the server';
  END IF;
  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
    NEW.scan_count := OLD.scan_count;
    NEW.daily_scan_count := OLD.daily_scan_count;
    NEW.last_scan_date := OLD.last_scan_date;
    NEW.last_scan_at := OLD.last_scan_at;
  END IF;
  RETURN NEW;
END;
$function$;