ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_scan_at timestamptz;

-- Update the trigger to also protect last_scan_at from client-side modification
CREATE OR REPLACE FUNCTION public.prevent_premium_self_upgrade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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