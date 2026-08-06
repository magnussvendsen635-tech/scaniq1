DO $$
DECLARE u uuid := 'f3f55588-09bc-4760-9ded-00c5c17b5a85';
BEGIN
  UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = u;

  UPDATE public.profiles SET display_name = 'Apple Review', is_premium = true, email_verified_at = now() WHERE id = u;

  INSERT INTO public.user_settings (user_id, age, height_cm, weight_kg, target_weight_kg, goal, activity, diet, pace, frequency, language, onboarded, calories_target, protein_target, carbs_target, fat_target, water_goal_ml, streak)
  VALUES (u, 30, 180, 82, 76, 'lose', 'moderate', 'balanced', 'steady', '3-4', 'en', true, 2200, 150, 230, 70, 2500, 5)
  ON CONFLICT (user_id) DO UPDATE SET onboarded = true, language = 'en';

  INSERT INTO public.scans (user_id, product_name, calories, protein, carbs, fat, scanned_at)
  SELECT u, s.name, s.kcal, s.p, s.c, s.f, now() - (s.d || ' days')::interval
  FROM (VALUES
    ('Greek yogurt with berries', 210, 18, 22, 4, 0),
    ('Grilled chicken salad', 430, 42, 18, 20, 0),
    ('Coca-Cola Zero Sugar', 1, 0, 0, 0, 1),
    ('Oatmeal with banana', 350, 11, 62, 7, 1),
    ('Salmon, rice and broccoli', 620, 45, 58, 22, 2),
    ('Protein bar', 200, 20, 18, 6, 3)
  ) AS s(name, kcal, p, c, f, d)
  WHERE NOT EXISTS (SELECT 1 FROM public.scans WHERE user_id = u);

  INSERT INTO public.weights (user_id, weight_kg, logged_at)
  SELECT u, w.kg, now() - (w.d || ' days')::interval
  FROM (VALUES (85.0,28),(84.2,21),(83.5,14),(82.8,7),(82.0,0)) AS w(kg, d)
  WHERE NOT EXISTS (SELECT 1 FROM public.weights WHERE user_id = u);

  INSERT INTO public.water_logs (user_id, day, ml)
  SELECT u, (now() AT TIME ZONE 'utc')::date - g, 1500 + g*200
  FROM generate_series(0,4) g
  ON CONFLICT DO NOTHING;
END $$;