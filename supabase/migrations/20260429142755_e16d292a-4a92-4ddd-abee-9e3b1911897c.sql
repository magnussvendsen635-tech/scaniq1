-- Add daily scan tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_scan_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_scan_date date;

-- Prevent users from self-upgrading to premium via the client.
-- Only service-role (edge functions / backend) can change is_premium.
CREATE OR REPLACE FUNCTION public.prevent_premium_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the request comes from the authenticated client role and is_premium changed, block it.
  IF current_setting('request.jwt.claims', true) IS NOT NULL
     AND OLD.is_premium IS DISTINCT FROM NEW.is_premium THEN
    RAISE EXCEPTION 'is_premium can only be changed by the server';
  END IF;
  -- Same for scan counters — should only be updated server-side
  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
    NEW.scan_count := OLD.scan_count;
    NEW.daily_scan_count := OLD.daily_scan_count;
    NEW.last_scan_date := OLD.last_scan_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_premium_self_upgrade ON public.profiles;
CREATE TRIGGER profiles_prevent_premium_self_upgrade
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_premium_self_upgrade();