-- ============================================================
-- Security hardening: lock down SECURITY DEFINER functions
-- ============================================================

-- 1. Revoke EXECUTE from anon/public on all SECURITY DEFINER helper functions
--    They are re-granted below to the correct roles.
REVOKE EXECUTE ON FUNCTION public.check_and_increment_ai_quota(uuid, text, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid, text, text) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_premium_self_upgrade() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_email_verified() FROM anon, public, authenticated;

-- 2. Grant EXECUTE to the roles that actually need each function
--    Authenticated users need role checks and AI quota checks.
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_quota(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

--    Service role needs everything the backend/edge functions call.
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_quota(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_premium_self_upgrade() TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_email_verified() TO service_role;

-- ============================================================
-- Add lightweight login activity tracking
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_login_ip inet;

-- Ensure profiles RLS policy still allows users to update their own row
-- (existing policy already covers this; no change needed).

-- Create a SECURITY DEFINER helper to update last-login info on sign-in.
-- Edge functions/auth hooks can call this with service_role.
CREATE OR REPLACE FUNCTION public.record_login(_user_id uuid, _ip inet)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
     SET last_login_at = now(),
         last_login_ip = _ip
   WHERE id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.record_login(uuid, inet) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_login(uuid, inet) FROM anon, public, authenticated;

-- ============================================================
-- Default table grants: tighten user_roles table access
-- ============================================================
-- user_roles is already protected by RLS; this just makes the default grant explicit.
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
