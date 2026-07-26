-- =============================================================================
-- ScanIQ - complete baseline schema (public)
-- Generated from the live database. Recreates everything from scratch:
-- enums, tables, constraints, indexes, GRANTs, RLS policies, functions, triggers.
--
-- NOTE: this file is a documentation / recreation artifact. It is NOT meant to be
-- run against the existing ScanIQ database (everything already exists there).
-- Run it only against an empty project.
--
-- NOT covered here (cannot live in a plain public-schema migration):
--   * storage bucket "scan-images" (private) + its storage.objects policies
--   * auth provider configuration (email, Google, Apple)
--   * pg_cron job "process-email-queue" and the pgmq queues
--     (q_auth_emails, q_transactional_emails) - created at runtime by
--     public.enqueue_email() / public.email_queue_wake()
--   * vault secret "email_queue_service_role_key"
-- =============================================================================

-- ---------------------------------------------------------------- ENUM TYPES
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================ TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  scan_count integer DEFAULT 0 NOT NULL,
  is_premium boolean DEFAULT false NOT NULL,
  daily_scan_count integer DEFAULT 0 NOT NULL,
  last_scan_date date,
  last_scan_at timestamp with time zone,
  is_banned boolean DEFAULT false NOT NULL,
  banned_at timestamp with time zone,
  ban_reason text,
  signup_ip inet,
  device_id text,
  email_verified_at timestamp with time zone,
  acquisition_channel text
);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can view own profile"
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = id));

CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON public.profiles USING btree (device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_signup_ip ON public.profiles USING btree (signup_ip);

-- ============================================================ TABLE: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can delete user_roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "Only service role can insert user_roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only service role can update user_roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

-- ============================================================ TABLE: discount_codes
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  description text,
  discount_type text DEFAULT 'percentage'::text NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  currency text,
  max_uses integer,
  times_used integer DEFAULT 0 NOT NULL,
  expires_at timestamp with time zone,
  active boolean DEFAULT true NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);
ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_code_key UNIQUE (code);
ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete discount codes"
  ON public.discount_codes
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert discount codes"
  ON public.discount_codes
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update discount codes"
  ON public.discount_codes
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view discount codes"
  ON public.discount_codes
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================ TABLE: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  paddle_subscription_id text NOT NULL,
  paddle_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  environment text DEFAULT 'sandbox'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  amount_paid_cents integer,
  currency text DEFAULT 'USD'::text,
  discount_code_id uuid
);

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_paddle_subscription_id_key UNIQUE (paddle_subscription_id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text));

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS idx_subscriptions_created ON public.subscriptions USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_id ON public.subscriptions USING btree (paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);

-- ============================================================ TABLE: discount_redemptions
CREATE TABLE IF NOT EXISTS public.discount_redemptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code_id uuid NOT NULL,
  user_id uuid NOT NULL,
  subscription_id uuid,
  code_text text NOT NULL,
  amount_saved_cents integer DEFAULT 0 NOT NULL,
  currency text DEFAULT 'USD'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.discount_redemptions ADD CONSTRAINT discount_redemptions_pkey PRIMARY KEY (id);
ALTER TABLE public.discount_redemptions ADD CONSTRAINT discount_redemptions_code_id_fkey FOREIGN KEY (code_id) REFERENCES discount_codes(id) ON DELETE CASCADE;
ALTER TABLE public.discount_redemptions ADD CONSTRAINT discount_redemptions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.discount_redemptions ADD CONSTRAINT discount_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages redemptions"
  ON public.discount_redemptions
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users see own redemptions"
  ON public.discount_redemptions
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code ON public.discount_redemptions USING btree (code_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_created ON public.discount_redemptions USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_user ON public.discount_redemptions USING btree (user_id);

-- ============================================================ TABLE: ai_usage_daily
CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  day date DEFAULT ((now() AT TIME ZONE 'utc'::text))::date NOT NULL,
  count integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_usage_daily ADD CONSTRAINT ai_usage_daily_pkey PRIMARY KEY (user_id, endpoint, day);
ALTER TABLE public.ai_usage_daily ADD CONSTRAINT ai_usage_daily_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ai usage"
  ON public.ai_usage_daily
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

-- ============================================================ TABLE: blocked_users
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  ip_address text,
  device_fingerprint text,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_pkey PRIMARY KEY (id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view blocked_users"
  ON public.blocked_users
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage blocked_users delete"
  ON public.blocked_users
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage blocked_users insert"
  ON public.blocked_users
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage blocked_users update"
  ON public.blocked_users
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS blocked_users_device_idx ON public.blocked_users USING btree (device_fingerprint) WHERE (device_fingerprint IS NOT NULL);
CREATE INDEX IF NOT EXISTS blocked_users_ip_idx ON public.blocked_users USING btree (ip_address) WHERE (ip_address IS NOT NULL);
CREATE INDEX IF NOT EXISTS blocked_users_user_id_idx ON public.blocked_users USING btree (user_id) WHERE (user_id IS NOT NULL);

-- ============================================================ TABLE: email_send_log
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  message_id text,
  template_name text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL,
  error_message text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_pkey PRIMARY KEY (id);
ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'suppressed'::text, 'failed'::text, 'bounced'::text, 'complained'::text, 'dlq'::text])));

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert send log"
  ON public.email_send_log
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "Service role can read send log"
  ON public.email_send_log
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.role() = 'service_role'::text));

CREATE POLICY "Service role can update send log"
  ON public.email_send_log
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log USING btree (message_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique ON public.email_send_log USING btree (message_id) WHERE (status = 'sent'::text);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log USING btree (recipient_email);

-- ============================================================ TABLE: email_send_state
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id integer DEFAULT 1 NOT NULL,
  retry_after_until timestamp with time zone,
  batch_size integer DEFAULT 10 NOT NULL,
  send_delay_ms integer DEFAULT 200 NOT NULL,
  auth_email_ttl_minutes integer DEFAULT 15 NOT NULL,
  transactional_email_ttl_minutes integer DEFAULT 60 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.email_send_state ADD CONSTRAINT email_send_state_pkey PRIMARY KEY (id);
ALTER TABLE public.email_send_state ADD CONSTRAINT email_send_state_id_check CHECK ((id = 1));

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage send state"
  ON public.email_send_state
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

-- ============================================================ TABLE: email_unsubscribe_tokens
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  token text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  used_at timestamp with time zone
);

ALTER TABLE public.email_unsubscribe_tokens ADD CONSTRAINT email_unsubscribe_tokens_pkey PRIMARY KEY (id);
ALTER TABLE public.email_unsubscribe_tokens ADD CONSTRAINT email_unsubscribe_tokens_email_key UNIQUE (email);
ALTER TABLE public.email_unsubscribe_tokens ADD CONSTRAINT email_unsubscribe_tokens_token_key UNIQUE (token);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert tokens"
  ON public.email_unsubscribe_tokens
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "Service role can mark tokens as used"
  ON public.email_unsubscribe_tokens
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "Service role can read tokens"
  ON public.email_unsubscribe_tokens
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.role() = 'service_role'::text));

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens USING btree (token);

-- ============================================================ TABLE: favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  calories numeric DEFAULT 0 NOT NULL,
  protein numeric DEFAULT 0 NOT NULL,
  carbs numeric DEFAULT 0 NOT NULL,
  fat numeric DEFAULT 0 NOT NULL,
  health_score numeric DEFAULT 0 NOT NULL,
  fiber numeric,
  sugar numeric,
  sodium numeric,
  saturated_fat numeric,
  cholesterol numeric,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.favorites ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);
ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_name_key UNIQUE (user_id, name);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delete own favs"
  ON public.favorites
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "insert own favs"
  ON public.favorites
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "select own favs"
  ON public.favorites
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "update own favs"
  ON public.favorites
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites USING btree (user_id, created_at DESC);

-- ============================================================ TABLE: meals
CREATE TABLE IF NOT EXISTS public.meals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  calories numeric DEFAULT 0 NOT NULL,
  protein numeric DEFAULT 0 NOT NULL,
  carbs numeric DEFAULT 0 NOT NULL,
  fat numeric DEFAULT 0 NOT NULL,
  health_score numeric DEFAULT 0 NOT NULL,
  category text,
  fiber numeric,
  sugar numeric,
  sodium numeric,
  saturated_fat numeric,
  cholesterol numeric,
  eaten_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.meals ADD CONSTRAINT meals_pkey PRIMARY KEY (id);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delete own meals"
  ON public.meals
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "insert own meals"
  ON public.meals
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "select own meals"
  ON public.meals
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "update own meals"
  ON public.meals
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS idx_meals_user_eaten ON public.meals USING btree (user_id, eaten_at DESC);

-- ============================================================ TABLE: page_views
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  path text NOT NULL,
  user_id uuid,
  session_id text,
  referrer text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.page_views ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read page views"
  ON public.page_views
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Insert page views with matching user"
  ON public.page_views
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((user_id IS NULL) OR (user_id = auth.uid())));

CREATE POLICY "Users read own page_views"
  ON public.page_views
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views USING btree (created_at DESC);

-- ============================================================ TABLE: payouts
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  amount_cents integer DEFAULT 0 NOT NULL,
  currency text DEFAULT 'DKK'::text NOT NULL,
  status payout_status DEFAULT 'pending'::payout_status NOT NULL,
  paypal_transaction_id text,
  payout_date timestamp with time zone,
  approved_at timestamp with time zone,
  approved_by uuid,
  paid_at timestamp with time zone,
  paid_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.payouts ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);
ALTER TABLE public.payouts ADD CONSTRAINT payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete payouts"
  ON public.payouts
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert payouts"
  ON public.payouts
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payouts"
  ON public.payouts
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all payouts"
  ON public.payouts
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own payouts"
  ON public.payouts
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS idx_payouts_payout_date ON public.payouts USING btree (payout_date DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.payouts USING btree (user_id);

-- ============================================================ TABLE: push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions USING btree (user_id);

-- ============================================================ TABLE: reminder_preferences
CREATE TABLE IF NOT EXISTS public.reminder_preferences (
  user_id uuid NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  water boolean DEFAULT true NOT NULL,
  meals boolean DEFAULT true NOT NULL,
  weight boolean DEFAULT true NOT NULL,
  timezone text DEFAULT 'Europe/Copenhagen'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  calories boolean DEFAULT true NOT NULL
);

ALTER TABLE public.reminder_preferences ADD CONSTRAINT reminder_preferences_pkey PRIMARY KEY (user_id);
ALTER TABLE public.reminder_preferences ADD CONSTRAINT reminder_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own reminder preferences"
  ON public.reminder_preferences
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own reminder preferences"
  ON public.reminder_preferences
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own reminder preferences"
  ON public.reminder_preferences
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can view their own reminder preferences"
  ON public.reminder_preferences
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

-- ============================================================ TABLE: scans
CREATE TABLE IF NOT EXISTS public.scans (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  product_name text NOT NULL,
  calories numeric DEFAULT 0 NOT NULL,
  protein numeric,
  carbs numeric,
  fat numeric,
  image_url text,
  scanned_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.scans ADD CONSTRAINT scans_pkey PRIMARY KEY (id);
ALTER TABLE public.scans ADD CONSTRAINT scans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own scans"
  ON public.scans
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert their own scans"
  ON public.scans
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own scans"
  ON public.scans
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own scans"
  ON public.scans
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS scans_user_id_scanned_at_idx ON public.scans USING btree (user_id, scanned_at DESC);

-- ============================================================ TABLE: suppressed_emails
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.suppressed_emails ADD CONSTRAINT suppressed_emails_pkey PRIMARY KEY (id);
ALTER TABLE public.suppressed_emails ADD CONSTRAINT suppressed_emails_email_key UNIQUE (email);
ALTER TABLE public.suppressed_emails ADD CONSTRAINT suppressed_emails_reason_check CHECK ((reason = ANY (ARRAY['unsubscribe'::text, 'bounce'::text, 'complaint'::text])));

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert suppressed emails"
  ON public.suppressed_emails
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "Service role can read suppressed emails"
  ON public.suppressed_emails
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.role() = 'service_role'::text));

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails USING btree (email);

-- ============================================================ TABLE: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid NOT NULL,
  language text DEFAULT 'en'::text NOT NULL,
  age integer DEFAULT 28 NOT NULL,
  weight_kg numeric DEFAULT 75 NOT NULL,
  target_weight_kg numeric DEFAULT 70 NOT NULL,
  height_cm numeric DEFAULT 175 NOT NULL,
  goal text DEFAULT 'lose'::text NOT NULL,
  activity text DEFAULT 'moderate'::text NOT NULL,
  pace text DEFAULT 'balanced'::text NOT NULL,
  frequency text DEFAULT '2-3'::text NOT NULL,
  diet text DEFAULT 'none'::text NOT NULL,
  calories_target integer DEFAULT 2200 NOT NULL,
  protein_target integer DEFAULT 150 NOT NULL,
  carbs_target integer DEFAULT 220 NOT NULL,
  fat_target integer DEFAULT 70 NOT NULL,
  water_goal_ml integer DEFAULT 2500 NOT NULL,
  auto_adjust_goal boolean DEFAULT true NOT NULL,
  reminders_enabled boolean DEFAULT false NOT NULL,
  reminders_water boolean DEFAULT true NOT NULL,
  reminders_meals boolean DEFAULT true NOT NULL,
  reminders_weight boolean DEFAULT true NOT NULL,
  streak integer DEFAULT 0 NOT NULL,
  last_active_date date,
  onboarded boolean DEFAULT false NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete own settings"
  ON public.user_settings
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "insert own settings"
  ON public.user_settings
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "select own settings"
  ON public.user_settings
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "update own settings"
  ON public.user_settings
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

-- ============================================================ TABLE: water_logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  user_id uuid NOT NULL,
  day date NOT NULL,
  ml integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.water_logs ADD CONSTRAINT water_logs_pkey PRIMARY KEY (user_id, day);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delete own water"
  ON public.water_logs
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "insert own water"
  ON public.water_logs
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "select own water"
  ON public.water_logs
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "update own water"
  ON public.water_logs
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

-- ============================================================ TABLE: weights
CREATE TABLE IF NOT EXISTS public.weights (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  weight_kg numeric NOT NULL,
  logged_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.weights ADD CONSTRAINT weights_pkey PRIMARY KEY (id);

ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delete own weights"
  ON public.weights
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "insert own weights"
  ON public.weights
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "select own weights"
  ON public.weights
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "update own weights"
  ON public.weights
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS idx_weights_user_logged ON public.weights USING btree (user_id, logged_at DESC);

-- ============================================================ TABLE: workouts
CREATE TABLE IF NOT EXISTS public.workouts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  minutes integer DEFAULT 0 NOT NULL,
  calories_burned numeric DEFAULT 0 NOT NULL,
  performed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.workouts ADD CONSTRAINT workouts_pkey PRIMARY KEY (id);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delete own workouts"
  ON public.workouts
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "insert own workouts"
  ON public.workouts
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "select own workouts"
  ON public.workouts
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "update own workouts"
  ON public.workouts
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE INDEX IF NOT EXISTS idx_workouts_user_perf ON public.workouts USING btree (user_id, performed_at DESC);

-- ------------------------------------------------------------- FUNCTIONS

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_quota(_user_id uuid, _endpoint text, _limit integer);

 RETURNS TABLE(allowed boolean, used integer, quota_limit integer);

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public';

AS $function$;

DECLARE;

  today_utc DATE := (now() AT TIME ZONE 'utc')::date;

  new_count INTEGER;

BEGIN;

  INSERT INTO public.ai_usage_daily (user_id, endpoint, day, count, updated_at);

  VALUES (_user_id, _endpoint, today_utc, 1, now());

  ON CONFLICT (user_id, endpoint, day);

  DO UPDATE SET count = public.ai_usage_daily.count + 1, updated_at = now();

  RETURNING count INTO new_count;

  IF new_count > _limit THEN;

    -- rollback the increment so users can try again tomorrow with correct counters;

    UPDATE public.ai_usage_daily;

       SET count = count - 1;

     WHERE user_id = _user_id AND endpoint = _endpoint AND day = today_utc;

    RETURN QUERY SELECT FALSE, new_count - 1, _limit;

  ELSE;

    RETURN QUERY SELECT TRUE, new_count, _limit;

  END IF;

END;

$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint);

 RETURNS boolean;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public', 'pgmq';

AS $function$;

BEGIN;

  RETURN pgmq.delete(queue_name, message_id);

EXCEPTION WHEN undefined_table THEN;

  RETURN FALSE;

END;

$function$;

CREATE OR REPLACE FUNCTION public.email_queue_dispatch();

 RETURNS void;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO '';

AS $function$;

BEGIN;

  IF NOT EXISTS (SELECT 1 FROM pgmq.q_auth_emails);

     AND NOT EXISTS (SELECT 1 FROM pgmq.q_transactional_emails) THEN;

    BEGIN;

      -- Serialize disarm against email_queue_wake on a shared advisory lock, then;

      -- re-read under it: an enqueue racing the unschedule either committed (we;

      -- see its row and leave the cron) or waits and re-arms after we commit.;

      PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000001);

      IF EXISTS (SELECT 1 FROM pgmq.q_auth_emails);

         OR EXISTS (SELECT 1 FROM pgmq.q_transactional_emails) THEN;

        RETURN;

      END IF;

      PERFORM cron.unschedule('process-email-queue');

    EXCEPTION WHEN OTHERS THEN;

      RAISE WARNING 'email_queue_dispatch: cron unschedule failed: %', SQLERRM;

    END;

    RETURN;

  END IF;

  IF (SELECT retry_after_until FROM public.email_send_state WHERE id = 1) > now() THEN;

    RETURN;

  END IF;

  PERFORM net.http_post(;

    url := 'https://uqnwhypjrisbfkouwcge.supabase.co/functions/v1/process-email-queue',;

    headers := jsonb_build_object(;

      'Content-Type', 'application/json',;

      'Lovable-Context', 'cron',;

      'Authorization', 'Bearer ' || (;

        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';

      );

    ),;

    body := '{}'::jsonb;

  );

END;

$function$;

CREATE OR REPLACE FUNCTION public.email_queue_wake();

 RETURNS trigger;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO '';

AS $function$;

BEGIN;

  -- Runs inside the enqueue transaction; the outer handler guarantees nothing;

  -- below can roll back the customer's email. Shared advisory lock serializes;

  -- arming against email_queue_dispatch's disarm.;

  PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000001);

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue') THEN;

    BEGIN;

      PERFORM cron.schedule('process-email-queue', '5 seconds', $cron$ SELECT public.email_queue_dispatch(); $cron$);

    EXCEPTION WHEN OTHERS THEN;

      RAISE WARNING 'email_queue_wake: cron schedule failed: %', SQLERRM;

    END;

  END IF;

  BEGIN;

    PERFORM net.http_post(;

      url := 'https://uqnwhypjrisbfkouwcge.supabase.co/functions/v1/process-email-queue',;

      headers := jsonb_build_object(;

        'Content-Type', 'application/json',;

        'Lovable-Context', 'cron',;

        'Authorization', 'Bearer ' || (;

          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';

        );

      ),;

      body := '{}'::jsonb;

    );

  EXCEPTION WHEN OTHERS THEN NULL;

  END;

  RETURN NULL;

EXCEPTION WHEN OTHERS THEN;

  RAISE WARNING 'email_queue_wake failed (enqueue preserved): %', SQLERRM;

  RETURN NULL;

END;

$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb);

 RETURNS bigint;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public', 'pgmq';

AS $function$;

BEGIN;

  RETURN pgmq.send(queue_name, payload);

EXCEPTION WHEN undefined_table THEN;

  PERFORM pgmq.create(queue_name);

  RETURN pgmq.send(queue_name, payload);

END;

$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user();

 RETURNS trigger;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public';

AS $function$;

DECLARE;

  v_ip inet;

BEGIN;

  BEGIN;

    v_ip := NULLIF(NEW.raw_user_meta_data->>'signup_ip','')::inet;

  EXCEPTION WHEN others THEN v_ip := NULL; END;

  INSERT INTO public.profiles (id, email, display_name, avatar_url, device_id, signup_ip, email_verified_at);

  VALUES (;

    NEW.id,;

    NEW.email,;

    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),;

    NEW.raw_user_meta_data->>'avatar_url',;

    NULLIF(NEW.raw_user_meta_data->>'device_id',''),;

    v_ip,;

    NEW.email_confirmed_at;

  );

  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;

END;

$function$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text);

 RETURNS boolean;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public';

AS $function$;

DECLARE;

  jwt_role text;

BEGIN;

  jwt_role := current_setting('request.jwt.claims', true)::jsonb->>'role';

  -- Service role bypass (used by edge functions and webhooks);

  IF jwt_role = 'service_role' THEN;

    -- allowed;

    NULL;

  ELSE;

    -- Anyone else may only check their own subscription status;

    IF auth.uid() IS NULL OR auth.uid() <> user_uuid THEN;

      RAISE EXCEPTION 'access denied';

    END IF;

  END IF;

  RETURN exists (;

    select 1 from public.subscriptions;

    where user_id = user_uuid;

      and environment = check_env;

      and (;

        (status in ('active', 'trialing') and (current_period_end is null or current_period_end > now()));

        or (status = 'canceled' and current_period_end > now());

      );

  );

END;

$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role);

 RETURNS boolean;

 LANGUAGE sql;

 STABLE SECURITY DEFINER;

 SET search_path TO 'public';

AS $function$;

  SELECT EXISTS (;

    SELECT 1 FROM public.user_roles;

    WHERE user_id = _user_id AND role = _role;

  );

$function$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid);

 RETURNS boolean;

 LANGUAGE sql;

 STABLE SECURITY DEFINER;

 SET search_path TO 'public';

AS $function$;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');

$function$;

CREATE OR REPLACE FUNCTION public.is_blocked(_user_id uuid, _ip text DEFAULT NULL::text, _device text DEFAULT NULL::text);

 RETURNS boolean;

 LANGUAGE sql;

 STABLE SECURITY DEFINER;

 SET search_path TO 'public';

AS $function$;

  SELECT EXISTS (;

    SELECT 1 FROM public.blocked_users;

    WHERE (_user_id IS NOT NULL AND user_id = _user_id);

       OR (_ip IS NOT NULL AND ip_address = _ip);

       OR (_device IS NOT NULL AND device_fingerprint = _device);

  );

$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb);

 RETURNS bigint;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public', 'pgmq';

AS $function$;

DECLARE new_id BIGINT;

BEGIN;

  SELECT pgmq.send(dlq_name, payload) INTO new_id;

  PERFORM pgmq.delete(source_queue, message_id);

  RETURN new_id;

EXCEPTION WHEN undefined_table THEN;

  BEGIN;

    PERFORM pgmq.create(dlq_name);

  EXCEPTION WHEN OTHERS THEN;

    NULL;

  END;

  SELECT pgmq.send(dlq_name, payload) INTO new_id;

  BEGIN;

    PERFORM pgmq.delete(source_queue, message_id);

  EXCEPTION WHEN undefined_table THEN;

    NULL;

  END;

  RETURN new_id;

END;

$function$;

CREATE OR REPLACE FUNCTION public.prevent_premium_self_upgrade();

 RETURNS trigger;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public';

AS $function$;

DECLARE jwt_role text;

BEGIN;

  jwt_role := current_setting('request.jwt.claims', true)::jsonb->>'role';

  IF jwt_role = 'service_role' THEN RETURN NEW; END IF;

  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN;

    IF OLD.is_premium IS DISTINCT FROM NEW.is_premium THEN;

      RAISE EXCEPTION 'is_premium can only be changed by the server';

    END IF;

    -- Only admins may change ban status via Data API; regular users cannot.;

    IF (OLD.is_banned IS DISTINCT FROM NEW.is_banned;

        OR OLD.banned_at IS DISTINCT FROM NEW.banned_at;

        OR OLD.ban_reason IS DISTINCT FROM NEW.ban_reason);

       AND NOT public.has_role(auth.uid(),'admin') THEN;

      RAISE EXCEPTION 'is_banned can only be changed by an admin';

    END IF;

    NEW.scan_count := OLD.scan_count;

    NEW.daily_scan_count := OLD.daily_scan_count;

    NEW.last_scan_date := OLD.last_scan_date;

    NEW.last_scan_at := OLD.last_scan_at;

    -- Lock immutable audit fields for self-updates;

    IF NOT public.has_role(auth.uid(),'admin') THEN;

      NEW.signup_ip := OLD.signup_ip;

      NEW.device_id := OLD.device_id;

      NEW.email_verified_at := OLD.email_verified_at;

    END IF;

  END IF;

  RETURN NEW;

END;

$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer);

 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb);

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public', 'pgmq';

AS $function$;

BEGIN;

  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;

EXCEPTION WHEN undefined_table THEN;

  PERFORM pgmq.create(queue_name);

  RETURN;

END;

$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at();

 RETURNS trigger;

 LANGUAGE plpgsql;

 SET search_path TO 'public';

AS $function$;

BEGIN;

  NEW.updated_at = now();

  RETURN NEW;

END;

$function$;

CREATE OR REPLACE FUNCTION public.sync_email_verified();

 RETURNS trigger;

 LANGUAGE plpgsql;

 SECURITY DEFINER;

 SET search_path TO 'public';

AS $function$;

BEGIN;

  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN;

    UPDATE public.profiles;

       SET email_verified_at = NEW.email_confirmed_at;

     WHERE id = NEW.id;

  END IF;

  RETURN NEW;

END;

$function$;

-- -------------------------------------------------------------- TRIGGERS

CREATE TRIGGER discount_codes_set_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payouts_set_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_prevent_premium_self_upgrade BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_premium_self_upgrade();
CREATE TRIGGER profiles_prevent_self_upgrade BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_premium_self_upgrade();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER scans_set_updated_at BEFORE UPDATE ON public.scans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_water_logs_updated_at BEFORE UPDATE ON public.water_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_reminder_preferences_updated_at BEFORE UPDATE ON public.reminder_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------- LEGACY
-- discount_codes / discount_redemptions are leftovers from the removed Paddle
-- checkout flow. They are unused by the current iOS In-App Purchase flow and can
-- be dropped once no historical rows are needed.
