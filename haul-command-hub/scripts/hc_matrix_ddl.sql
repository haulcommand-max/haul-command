CREATE TABLE IF NOT EXISTS public.hc_global_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table TEXT DEFAULT 'internal',
    source_id TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    entity_type TEXT DEFAULT 'pilot-car',
    country_code TEXT DEFAULT 'US',
    admin1_code TEXT,
    city TEXT,
    phone_normalized TEXT,
    email TEXT,
    website_url TEXT,
    is_claimed BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_global_operator_slug UNIQUE (slug)
);

ALTER TABLE public.hc_global_operators ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Global Operators are publicly readable" ON hc_global_operators;
    CREATE POLICY "Global Operators are publicly readable" 
    ON public.hc_global_operators FOR SELECT 
    USING (true);
END $$;

CREATE INDEX IF NOT EXISTS idx_hc_global_geo ON public.hc_global_operators (country_code, admin1_code);
CREATE INDEX IF NOT EXISTS idx_hc_global_entity ON public.hc_global_operators (entity_type);
