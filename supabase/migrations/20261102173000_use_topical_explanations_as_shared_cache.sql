ALTER TABLE public.topical_explanations
    ALTER COLUMN user_id DROP NOT NULL,
    ALTER COLUMN question_url DROP NOT NULL,
    ALTER COLUMN mark_scheme_url DROP NOT NULL,
    ALTER COLUMN is_mcq DROP NOT NULL,
    ALTER COLUMN prompt_version DROP NOT NULL;

ALTER TABLE public.topical_explanations
    DROP CONSTRAINT IF EXISTS topical_explanations_user_id_cache_key_key;
ALTER TABLE public.topical_explanations
    DROP CONSTRAINT IF EXISTS topical_explanations_user_id_fkey;
ALTER TABLE public.topical_explanations
    ADD CONSTRAINT topical_explanations_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

WITH ranked_explanations AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY cache_key
            ORDER BY created_at DESC, id DESC
        ) AS row_number
    FROM public.topical_explanations
)
DELETE FROM public.topical_explanations AS explanations
USING ranked_explanations
WHERE explanations.id = ranked_explanations.id
    AND ranked_explanations.row_number > 1;

ALTER TABLE public.topical_explanations
    ADD CONSTRAINT topical_explanations_cache_key_key UNIQUE (cache_key);

DROP POLICY IF EXISTS "Users can view their own topical explanations"
    ON public.topical_explanations;
DROP POLICY IF EXISTS "Users can save their own topical explanations"
    ON public.topical_explanations;
DROP POLICY IF EXISTS "Anyone can view topical explanations"
    ON public.topical_explanations;

CREATE POLICY "Anyone can view topical explanations"
    ON public.topical_explanations FOR SELECT
    USING (true);

REVOKE ALL ON public.topical_explanations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.topical_explanations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topical_explanations TO service_role;
