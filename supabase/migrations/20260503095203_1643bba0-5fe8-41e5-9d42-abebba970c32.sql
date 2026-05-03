
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address text,
  device_fingerprint text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blocked_users_user_id_idx ON public.blocked_users(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS blocked_users_ip_idx ON public.blocked_users(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS blocked_users_device_idx ON public.blocked_users(device_fingerprint) WHERE device_fingerprint IS NOT NULL;

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- No policies = only service_role can access (used by edge functions)

CREATE OR REPLACE FUNCTION public.is_blocked(_user_id uuid, _ip text DEFAULT NULL, _device text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (_user_id IS NOT NULL AND user_id = _user_id)
       OR (_ip IS NOT NULL AND ip_address = _ip)
       OR (_device IS NOT NULL AND device_fingerprint = _device)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_blocked FROM PUBLIC, anon, authenticated;
