
-- blocked_users: admin-managed via Data API
CREATE POLICY "Admins manage blocked_users insert" ON public.blocked_users
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage blocked_users update" ON public.blocked_users
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage blocked_users delete" ON public.blocked_users
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- page_views: let users read their own
CREATE POLICY "Users read own page_views" ON public.page_views
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Lock search_path on email queue helpers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
