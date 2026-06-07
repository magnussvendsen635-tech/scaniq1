
-- 1) Discount codes: only admins can read
DROP POLICY IF EXISTS "Authenticated users can view active discount codes" ON public.discount_codes;
CREATE POLICY "Admins can view discount codes"
  ON public.discount_codes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Page views insert: tighten check
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Insert page views with matching user"
  ON public.page_views FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 3) Profiles: column-level protection. Revoke broad UPDATE and grant only safe columns.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;
-- service_role keeps full access (granted via GRANT ALL elsewhere)
GRANT ALL ON public.profiles TO service_role;
