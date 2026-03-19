-- ============================================================
-- DATA PURCHASES TABLE + INDEXES + RLS
-- Supports the self-serve data product engine
-- ============================================================

begin;

CREATE TABLE IF NOT EXISTS public.data_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    product_id text NOT NULL,
    product_type text NOT NULL,
    country_code text NOT NULL,
    corridor_code text,
    stripe_session_id text,
    status text NOT NULL DEFAULT 'pending',  -- pending, active, expired, cancelled
    purchased_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_purchases_user ON public.data_purchases (user_id, product_id, status);
CREATE INDEX IF NOT EXISTS idx_data_purchases_product ON public.data_purchases (product_id, country_code, status);
CREATE INDEX IF NOT EXISTS idx_data_purchases_stripe ON public.data_purchases (stripe_session_id);

ALTER TABLE public.data_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY data_purchases_own ON public.data_purchases FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY data_purchases_service ON public.data_purchases FOR ALL USING (auth.role() = 'service_role');

commit;
