-- Nibras (AI chat + topical explanations) shared daily quota.
--
-- Every signed-in account shares ONE pool of 7 Nibras requests per UTC day, where a
-- request is any AI chat message or any topical explanation/follow-up that has to be
-- generated. Requests answered from the explanation cache never reach the API, so they
-- are never reserved here and never count against the limit.
-- Tester accounts are exempt (unlimited); the API skips the reservation for them.
--
-- This replaces the previous, never-wired-up quota objects:
--   public.ai_chat_daily_usage            (limit 5, chat only)
--   public.topical_user_explanation_usage (limit 5, explanations only)

CREATE TABLE IF NOT EXISTS public.nibras_daily_usage (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count BETWEEN 0 AND 7),
    PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.nibras_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.nibras_daily_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nibras_daily_usage TO service_role;

-- Carry over any counts already recorded today by the legacy quota tables so a user
-- does not receive a fresh allowance mid-day. Guarded so the migration stays re-runnable
-- once the legacy tables below have been dropped.
DO $$
BEGIN
    IF to_regclass('public.ai_chat_daily_usage') IS NOT NULL
        AND to_regclass('public.topical_user_explanation_usage') IS NOT NULL THEN
        INSERT INTO public.nibras_daily_usage (user_id, usage_date, usage_count)
        SELECT
            user_id,
            usage_date,
            LEAST(7, SUM(used))::INTEGER
        FROM (
            SELECT user_id, usage_date, message_count AS used FROM public.ai_chat_daily_usage
            UNION ALL
            SELECT user_id, usage_date, explanation_count AS used FROM public.topical_user_explanation_usage
        ) AS legacy_usage
        GROUP BY user_id, usage_date
        ON CONFLICT (user_id, usage_date) DO NOTHING;
    END IF;
END;
$$;

-- Atomically reserve one request for the current UTC day.
-- Returns whether the request is allowed, the running count, the daily limit, and the
-- day the count belongs to (used later to refund a failed request).
CREATE OR REPLACE FUNCTION public.reserve_nibras_usage(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, used INTEGER, limit_value INTEGER, usage_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit CONSTANT INTEGER := 7;
    v_usage_date DATE := (now() AT TIME ZONE 'UTC')::DATE;
    v_used INTEGER;
BEGIN
    INSERT INTO public.nibras_daily_usage AS usage (user_id, usage_date, usage_count)
    VALUES (p_user_id, v_usage_date, 1)
    ON CONFLICT (user_id, usage_date) DO UPDATE
    SET usage_count = usage.usage_count + 1
    WHERE usage.usage_count < v_limit
    RETURNING usage.usage_count INTO v_used;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, v_used, v_limit, v_usage_date;
        RETURN;
    END IF;

    SELECT daily.usage_count
    INTO v_used
    FROM public.nibras_daily_usage AS daily
    WHERE daily.user_id = p_user_id
      AND daily.usage_date = v_usage_date;

    RETURN QUERY SELECT FALSE, COALESCE(v_used, v_limit), v_limit, v_usage_date;
END;
$$;

-- Refund a reservation whose upstream request failed, so a failed attempt does not burn
-- part of the daily allowance.
CREATE OR REPLACE FUNCTION public.release_nibras_usage(p_user_id UUID, p_usage_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_used INTEGER;
BEGIN
    UPDATE public.nibras_daily_usage
    SET usage_count = usage_count - 1
    WHERE user_id = p_user_id
      AND usage_date = p_usage_date
      AND usage_count > 0
    RETURNING usage_count INTO v_used;

    IF FOUND AND v_used = 0 THEN
        DELETE FROM public.nibras_daily_usage
        WHERE user_id = p_user_id
          AND usage_date = p_usage_date;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_nibras_usage(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_nibras_usage(UUID, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_nibras_usage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_nibras_usage(UUID, DATE) TO service_role;

-- Remove the superseded per-feature quota objects.
DROP FUNCTION IF EXISTS public.reserve_ai_chat_message(UUID);
DROP FUNCTION IF EXISTS public.release_ai_chat_message(UUID, DATE);
DROP FUNCTION IF EXISTS public.reserve_topical_user_explanation(UUID);
DROP TABLE IF EXISTS public.ai_chat_daily_usage;
DROP TABLE IF EXISTS public.topical_user_explanation_usage;
