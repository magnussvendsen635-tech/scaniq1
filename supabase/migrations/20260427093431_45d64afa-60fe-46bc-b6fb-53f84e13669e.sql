ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS scan_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;