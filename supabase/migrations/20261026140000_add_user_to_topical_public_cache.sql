ALTER TABLE public.topical_explanation_public_cache
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

WITH source_explanations AS (
    SELECT DISTINCT ON (cache_key)
        cache_key,
        answer,
        user_id
    FROM (
        SELECT cache_key, answer, user_id, created_at
        FROM public.topical_explanations
        UNION ALL
        SELECT cache_key, answer, NULL::UUID AS user_id, created_at
        FROM public.topical_guest_explanations
    ) AS existing_explanations
    ORDER BY cache_key, created_at DESC
)
UPDATE public.topical_explanation_public_cache AS public_cache
SET user_id = source_explanations.user_id
FROM source_explanations
WHERE public_cache.cache_key = source_explanations.cache_key
    AND public_cache.answer = source_explanations.answer
    AND source_explanations.user_id IS NOT NULL
    AND public_cache.user_id IS NULL;
