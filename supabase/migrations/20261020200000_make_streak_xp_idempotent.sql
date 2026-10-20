-- Make streak and question-view awards idempotent and serialize capped awards per user/action.
DROP INDEX IF EXISTS public.xp_events_download_idempotency_idx;

CREATE UNIQUE INDEX IF NOT EXISTS xp_events_idempotency_idx
  ON public.xp_events (user_id, action, ref_id)
  WHERE ref_id IS NOT NULL
    AND action IN (
      'download',
      'paper_download',
      'topical_paper_download',
      'active_time',
      'streak_visit',
      'question_view'
    );

CREATE OR REPLACE FUNCTION public.fn_award_capped_xp(
  p_user_id UUID,
  p_action TEXT,
  p_ref_id TEXT DEFAULT NULL,
  p_amount INTEGER DEFAULT 0,
  p_daily_cap INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_today_total INTEGER;
  v_awarded INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 0;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_user_id::TEXT || ':' || p_action, 0)
  );

  v_window_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

  SELECT COALESCE(SUM(xp_awarded), 0)::INTEGER
    INTO v_today_total
    FROM public.xp_events
   WHERE user_id = p_user_id
     AND action = p_action
     AND created_at >= v_window_start;

  v_awarded := GREATEST(0, LEAST(p_amount, p_daily_cap - v_today_total));
  IF v_awarded <= 0 THEN
    RETURN 0;
  END IF;

  IF p_ref_id IS NOT NULL
     AND p_action IN (
       'download',
       'paper_download',
       'topical_paper_download',
       'active_time',
       'streak_visit',
       'question_view'
     )
     AND EXISTS (
       SELECT 1
         FROM public.xp_events
        WHERE user_id = p_user_id
          AND action = p_action
          AND ref_id = p_ref_id
     ) THEN
    RETURN 0;
  END IF;

  BEGIN
    INSERT INTO public.xp_events (user_id, action, xp_awarded, ref_id, metadata)
    VALUES (p_user_id, p_action, v_awarded, p_ref_id, COALESCE(p_metadata, '{}'::JSONB));
  EXCEPTION
    WHEN unique_violation THEN
      RETURN 0;
  END;

  INSERT INTO public.user_xp (user_id, total_xp, updated_at)
  VALUES (p_user_id, v_awarded, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp = public.user_xp.total_xp + EXCLUDED.total_xp,
        updated_at = NOW();

  RETURN v_awarded;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_award_capped_xp(UUID, TEXT, TEXT, INTEGER, INTEGER, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_award_capped_xp(UUID, TEXT, TEXT, INTEGER, INTEGER, JSONB) TO service_role;
