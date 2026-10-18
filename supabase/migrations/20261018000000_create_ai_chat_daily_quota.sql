CREATE TABLE IF NOT EXISTS public.ai_chat_daily_usage (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count BETWEEN 0 AND 5),
    PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.ai_chat_daily_usage ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_daily_usage TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_ai_chat_message(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, used INTEGER, usage_date DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usage_date DATE := (now() AT TIME ZONE 'UTC')::DATE;
    v_used INTEGER;
BEGIN
    INSERT INTO public.ai_chat_daily_usage AS usage (user_id, usage_date, message_count)
    VALUES (p_user_id, v_usage_date, 1)
    ON CONFLICT (user_id, usage_date) DO UPDATE
    SET message_count = usage.message_count + 1
    WHERE usage.message_count < 5
    RETURNING message_count INTO v_used;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, v_used, v_usage_date;
    ELSE
        SELECT daily_usage.message_count
        INTO v_used
        FROM public.ai_chat_daily_usage AS daily_usage
        WHERE daily_usage.user_id = p_user_id
          AND daily_usage.usage_date = v_usage_date;

        RETURN QUERY SELECT FALSE, COALESCE(v_used, 5), v_usage_date;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_ai_chat_message(p_user_id UUID, p_usage_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_used INTEGER;
BEGIN
    UPDATE public.ai_chat_daily_usage
    SET message_count = message_count - 1
    WHERE user_id = p_user_id
      AND usage_date = p_usage_date
      AND message_count > 0
    RETURNING message_count INTO v_used;

    IF FOUND AND v_used = 0 THEN
        DELETE FROM public.ai_chat_daily_usage
        WHERE user_id = p_user_id
          AND usage_date = p_usage_date;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_chat_message(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_ai_chat_message(UUID, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_chat_message(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_chat_message(UUID, DATE) TO service_role;
