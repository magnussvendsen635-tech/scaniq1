
-- 1) Grant admin role to the project owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('e2a422ba-8399-4f77-97e9-334007dff5c3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Add revenue tracking columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS amount_paid_cents integer,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS discount_code_id uuid REFERENCES public.discount_codes(id) ON DELETE SET NULL;

-- 3) Discount redemptions tracking table
CREATE TABLE IF NOT EXISTS public.discount_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  code_text text NOT NULL,
  amount_saved_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.discount_redemptions TO authenticated;
GRANT ALL ON public.discount_redemptions TO service_role;

ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own redemptions"
  ON public.discount_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages redemptions"
  ON public.discount_redemptions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_discount_redemptions_user ON public.discount_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code ON public.discount_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_created ON public.discount_redemptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created ON public.subscriptions(created_at DESC);
