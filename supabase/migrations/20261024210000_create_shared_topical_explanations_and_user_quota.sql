CREATE TABLE IF NOT EXISTS public.topical_explanation_public_cache (
    cache_key TEXT PRIMARY KEY CHECK (cache_key ~ '^[0-9a-f]{64}$'),
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.topical_explanation_public_cache (cache_key, answer, created_at)
SELECT DISTINCT ON (cache_key)
    cache_key,
    answer,
    created_at
FROM (
    SELECT cache_key, answer, created_at
    FROM public.topical_explanations
    UNION ALL
    SELECT cache_key, answer, created_at
    FROM public.topical_guest_explanations
) AS existing_explanations
ORDER BY cache_key, created_at DESC
ON CONFLICT (cache_key) DO NOTHING;

ALTER TABLE public.topical_explanation_public_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view pre-explained topical answers"
    ON public.topical_explanation_public_cache;
CREATE POLICY "Anyone can view pre-explained topical answers"
    ON public.topical_explanation_public_cache FOR SELECT
    USING (true);

REVOKE ALL ON public.topical_explanation_public_cache FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.topical_explanation_public_cache TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topical_explanation_public_cache TO service_role;

CREATE TABLE IF NOT EXISTS public.topical_user_explanation_usage (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    explanation_count INTEGER NOT NULL DEFAULT 0 CHECK (explanation_count BETWEEN 0 AND 5),
    PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.topical_user_explanation_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.topical_user_explanation_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topical_user_explanation_usage TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_topical_user_explanation(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
    v_usage_date DATE := (now() AT TIME ZONE 'UTC')::DATE;
BEGIN
    INSERT INTO public.topical_user_explanation_usage AS usage
        (user_id, usage_date, explanation_count)
    VALUES (p_user_id, v_usage_date, 1)
    ON CONFLICT (user_id, usage_date) DO UPDATE
    SET explanation_count = usage.explanation_count + 1
    WHERE usage.explanation_count < 5
    RETURNING explanation_count INTO v_count;

    RETURN COALESCE(v_count > 0, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_topical_user_explanation(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_topical_user_explanation(UUID) TO service_role;
