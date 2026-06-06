-- Restrict UPDATE on profiles to safe, user-editable columns only.
-- Sensitive columns (is_premium, is_banned, scan counters, signup_ip, etc.)
-- can no longer be changed via the Data API by regular users.
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;
GRANT UPDATE (display_name, avatar_url, updated_at) ON public.profiles TO authenticated;
-- service_role keeps full privileges (used by edge functions / webhooks).
GRANT ALL ON public.profiles TO service_role;