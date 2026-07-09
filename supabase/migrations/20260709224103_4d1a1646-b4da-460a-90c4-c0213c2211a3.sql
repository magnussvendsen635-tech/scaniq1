
CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, endpoint, day)
);

GRANT SELECT ON public.ai_usage_daily TO authenticated;
GRANT ALL ON public.ai_usage_daily TO service_role;

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ai usage"
  ON public.ai_usage_daily FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_quota(
  _user_id UUID,
  _endpoint TEXT,
  _limit INTEGER
) RETURNS TABLE(allowed BOOLEAN, used INTEGER, quota_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_utc DATE := (now() AT TIME ZONE 'utc')::date;
  new_count INTEGER;
BEGIN
  INSERT INTO public.ai_usage_daily (user_id, endpoint, day, count, updated_at)
  VALUES (_user_id, _endpoint, today_utc, 1, now())
  ON CONFLICT (user_id, endpoint, day)
  DO UPDATE SET count = public.ai_usage_daily.count + 1, updated_at = now()
  RETURNING count INTO new_count;

  IF new_count > _limit THEN
    -- rollback the increment so users can try again tomorrow with correct counters
    UPDATE public.ai_usage_daily
       SET count = count - 1
     WHERE user_id = _user_id AND endpoint = _endpoint AND day = today_utc;
    RETURN QUERY SELECT FALSE, new_count - 1, _limit;
  ELSE
    RETURN QUERY SELECT TRUE, new_count, _limit;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_ai_quota(UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_quota(UUID, TEXT, INTEGER) TO service_role;
