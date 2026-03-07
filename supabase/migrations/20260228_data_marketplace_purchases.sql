-- Migration: Self-serve data marketplace purchases table
-- Tracks completed data product purchases and links to API keys

CREATE TABLE IF NOT EXISTS public.data_marketplace_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL,
    customer_email text NOT NULL,
    product_sku text NOT NULL,
    tier text NOT NULL,
    stripe_session_id text UNIQUE,
    stripe_customer_id text,
    stripe_subscription_id text,
    api_key_prefix text,
    country_code text DEFAULT 'US',
    amount_usd numeric(10,2) DEFAULT 0,
    status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused', 'expired')),
    cancelled_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dmp_customer ON public.data_marketplace_purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_dmp_sku ON public.data_marketplace_purchases(product_sku);
CREATE INDEX IF NOT EXISTS idx_dmp_stripe_sub ON public.data_marketplace_purchases(stripe_subscription_id);

-- RLS
ALTER TABLE public.data_marketplace_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_dmp" ON public.data_marketplace_purchases FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_dmp" ON public.data_marketplace_purchases FOR SELECT USING (customer_id = auth.uid());
