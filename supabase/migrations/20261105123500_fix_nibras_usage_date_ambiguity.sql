-- Keep the returned reservation date from shadowing the usage_date table column
-- inside the PL/pgSQL quota function.
DROP FUNCTION public.reserve_nibras_usage(UUID);

CREATE FUNCTION public.reserve_nibras_usage(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, used INTEGER, limit_value INTEGER, reservation_date DATE)
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
    ON CONFLICT ON CONSTRAINT nibras_daily_usage_pkey DO UPDATE
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

REVOKE ALL ON FUNCTION public.reserve_nibras_usage(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_nibras_usage(UUID) TO service_role;
