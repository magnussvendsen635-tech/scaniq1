ALTER TABLE public.reminder_preferences
ADD COLUMN IF NOT EXISTS calories boolean NOT NULL DEFAULT true;