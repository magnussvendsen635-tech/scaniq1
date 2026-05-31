-- =========================================================
-- 1. ADMIN ROLE INFRASTRUCTURE (user_roles + has_role)
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- Seed admin role for the existing admin email if present
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE email = 'magnussvendsen635@gmail.com'
ON CONFLICT DO NOTHING;

-- =========================================================
-- 2. PROFILES — anti-fraud + ban + email verification fields
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS signup_ip inet,
  ADD COLUMN IF NOT EXISTS device_id text,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_signup_ip ON public.profiles(signup_ip);
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON public.profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Admin RLS: full access to all profiles
DO $$ BEGIN
  CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updated trigger: capture device_id + signup_ip from auth metadata,
-- preserve email confirmation timestamp.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ip inet;
BEGIN
  BEGIN
    v_ip := NULLIF(NEW.raw_user_meta_data->>'signup_ip','')::inet;
  EXCEPTION WHEN others THEN v_ip := NULL; END;

  INSERT INTO public.profiles (id, email, display_name, avatar_url, device_id, signup_ip, email_verified_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(NEW.raw_user_meta_data->>'device_id',''),
    v_ip,
    NEW.email_confirmed_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: keep email_verified_at in sync with auth.users.email_confirmed_at
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
    UPDATE public.profiles
       SET email_verified_at = NEW.email_confirmed_at
     WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_email_verified();

-- Harden self-update: prevent users from flipping is_banned via the client.
CREATE OR REPLACE FUNCTION public.prevent_premium_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE jwt_role text;
BEGIN
  jwt_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
  IF jwt_role = 'service_role' THEN RETURN NEW; END IF;

  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
    IF OLD.is_premium IS DISTINCT FROM NEW.is_premium THEN
      RAISE EXCEPTION 'is_premium can only be changed by the server';
    END IF;
    -- Only admins may change ban status via Data API; regular users cannot.
    IF (OLD.is_banned IS DISTINCT FROM NEW.is_banned
        OR OLD.banned_at IS DISTINCT FROM NEW.banned_at
        OR OLD.ban_reason IS DISTINCT FROM NEW.ban_reason)
       AND NOT public.has_role(auth.uid(),'admin') THEN
      RAISE EXCEPTION 'is_banned can only be changed by an admin';
    END IF;
    NEW.scan_count := OLD.scan_count;
    NEW.daily_scan_count := OLD.daily_scan_count;
    NEW.last_scan_date := OLD.last_scan_date;
    NEW.last_scan_at := OLD.last_scan_at;
    -- Lock immutable audit fields for self-updates
    IF NOT public.has_role(auth.uid(),'admin') THEN
      NEW.signup_ip := OLD.signup_ip;
      NEW.device_id := OLD.device_id;
      NEW.email_verified_at := OLD.email_verified_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_self_upgrade ON public.profiles;
CREATE TRIGGER profiles_prevent_self_upgrade
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_premium_self_upgrade();

-- =========================================================
-- 3. PAYOUTS TABLE (referral / bonus payouts)
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.payout_status AS ENUM ('pending','approved','paid','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'DKK',
  status public.payout_status NOT NULL DEFAULT 'pending',
  paypal_transaction_id text,
  payout_date timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  paid_at timestamptz,
  paid_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_payout_date ON public.payouts(payout_date DESC);

GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own payouts"
    ON public.payouts FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all payouts"
    ON public.payouts FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(),'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert payouts"
    ON public.payouts FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(),'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update payouts"
    ON public.payouts FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(),'admin'))
    WITH CHECK (public.has_role(auth.uid(),'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete payouts"
    ON public.payouts FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(),'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TRIGGER payouts_set_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();