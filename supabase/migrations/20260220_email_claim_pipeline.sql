-- 20260220_email_claim_pipeline.sql
-- Claim listing pipeline: token management + nudge state machine

CREATE TABLE IF NOT EXISTS public.listing_claim_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_type text NOT NULL CHECK (listing_type IN ('escort','carrier','broker')),
    listing_id uuid NOT NULL,
    email text NOT NULL,
    token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    used_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_tokens_lookup ON public.listing_claim_tokens(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_claim_tokens_email ON public.listing_claim_tokens(email);

CREATE TABLE IF NOT EXISTS public.directory_claim_state (
    listing_type text NOT NULL,
    listing_id uuid NOT NULL,
    claim_status text DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed','nudge_1','nudge_2','nudge_3','nudge_4','claimed','expired')),
    last_nudge_at timestamptz,
    nudge_count integer DEFAULT 0,
    next_nudge_at timestamptz,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (listing_type, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_claim_state_next ON public.directory_claim_state(next_nudge_at) WHERE claim_status NOT IN ('claimed','expired');

-- RLS
ALTER TABLE public.listing_claim_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_claim_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role on claim_tokens" ON public.listing_claim_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role on claim_state" ON public.directory_claim_state FOR ALL TO service_role USING (true) WITH CHECK (true);
