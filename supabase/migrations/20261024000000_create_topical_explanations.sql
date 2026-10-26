CREATE TABLE IF NOT EXISTS public.topical_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    question_url TEXT NOT NULL,
    mark_scheme_url TEXT NOT NULL,
    is_mcq BOOLEAN NOT NULL,
    prompt_version TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, cache_key)
);

ALTER TABLE public.topical_explanations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own topical explanations" ON public.topical_explanations;
CREATE POLICY "Users can view their own topical explanations"
    ON public.topical_explanations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save their own topical explanations" ON public.topical_explanations;
CREATE POLICY "Users can save their own topical explanations"
    ON public.topical_explanations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.topical_explanations TO authenticated;

CREATE TABLE IF NOT EXISTS public.topical_guest_explanation_usage (
    ip_hash TEXT NOT NULL CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
    usage_date DATE NOT NULL,
    explanation_count INTEGER NOT NULL DEFAULT 0 CHECK (explanation_count BETWEEN 0 AND 5),
    PRIMARY KEY (ip_hash, usage_date)
);

ALTER TABLE public.topical_guest_explanation_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.topical_guest_explanation_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topical_guest_explanation_usage TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_topical_guest_explanation(p_ip_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
    v_usage_date DATE := (now() AT TIME ZONE 'UTC')::DATE;
BEGIN
    INSERT INTO public.topical_guest_explanation_usage AS usage
        (ip_hash, usage_date, explanation_count)
    VALUES (p_ip_hash, v_usage_date, 1)
    ON CONFLICT (ip_hash, usage_date) DO UPDATE
    SET explanation_count = usage.explanation_count + 1
    WHERE usage.explanation_count < 5
    RETURNING explanation_count INTO v_count;

    RETURN COALESCE(v_count > 0, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_topical_guest_explanation(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_topical_guest_explanation(TEXT) TO service_role;
