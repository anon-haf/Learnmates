CREATE TABLE IF NOT EXISTS public.topical_guest_explanations (
    ip_hash TEXT NOT NULL CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
    cache_key TEXT NOT NULL CHECK (cache_key ~ '^[0-9a-f]{64}$'),
    question_url TEXT NOT NULL,
    mark_scheme_url TEXT NOT NULL,
    is_mcq BOOLEAN NOT NULL,
    prompt_version TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (ip_hash, cache_key)
);

ALTER TABLE public.topical_guest_explanations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.topical_guest_explanations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topical_guest_explanations TO service_role;
