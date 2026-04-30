
-- ============= MEALS =============
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  health_score NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  fiber NUMERIC,
  sugar NUMERIC,
  sodium NUMERIC,
  saturated_fat NUMERIC,
  cholesterol NUMERIC,
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_meals_user_eaten ON public.meals(user_id, eaten_at DESC);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own meals" ON public.meals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own meals" ON public.meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own meals" ON public.meals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own meals" ON public.meals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= WORKOUTS =============
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0,
  calories_burned NUMERIC NOT NULL DEFAULT 0,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workouts_user_perf ON public.workouts(user_id, performed_at DESC);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own workouts" ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own workouts" ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own workouts" ON public.workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own workouts" ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= WEIGHTS =============
CREATE TABLE public.weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight_kg NUMERIC NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_weights_user_logged ON public.weights(user_id, logged_at DESC);
ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own weights" ON public.weights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own weights" ON public.weights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own weights" ON public.weights FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own weights" ON public.weights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= WATER LOGS =============
CREATE TABLE public.water_logs (
  user_id UUID NOT NULL,
  day DATE NOT NULL,
  ml INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own water" ON public.water_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own water" ON public.water_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own water" ON public.water_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own water" ON public.water_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= FAVORITES =============
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  health_score NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC,
  sugar NUMERIC,
  sodium NUMERIC,
  saturated_fat NUMERIC,
  cholesterol NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
CREATE INDEX idx_favorites_user ON public.favorites(user_id, created_at DESC);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own favs" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own favs" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own favs" ON public.favorites FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own favs" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============= USER SETTINGS =============
CREATE TABLE public.user_settings (
  user_id UUID NOT NULL PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'en',
  age INTEGER NOT NULL DEFAULT 28,
  weight_kg NUMERIC NOT NULL DEFAULT 75,
  target_weight_kg NUMERIC NOT NULL DEFAULT 70,
  height_cm NUMERIC NOT NULL DEFAULT 175,
  goal TEXT NOT NULL DEFAULT 'lose',
  activity TEXT NOT NULL DEFAULT 'moderate',
  pace TEXT NOT NULL DEFAULT 'balanced',
  frequency TEXT NOT NULL DEFAULT '2-3',
  diet TEXT NOT NULL DEFAULT 'none',
  calories_target INTEGER NOT NULL DEFAULT 2200,
  protein_target INTEGER NOT NULL DEFAULT 150,
  carbs_target INTEGER NOT NULL DEFAULT 220,
  fat_target INTEGER NOT NULL DEFAULT 70,
  water_goal_ml INTEGER NOT NULL DEFAULT 2500,
  auto_adjust_goal BOOLEAN NOT NULL DEFAULT true,
  reminders_enabled BOOLEAN NOT NULL DEFAULT false,
  reminders_water BOOLEAN NOT NULL DEFAULT true,
  reminders_meals BOOLEAN NOT NULL DEFAULT true,
  reminders_weight BOOLEAN NOT NULL DEFAULT true,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger to update updated_at on user_settings
CREATE TRIGGER trg_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_water_logs_updated_at
BEFORE UPDATE ON public.water_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
