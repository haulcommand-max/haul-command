-- Migration: Directory Elite Upgrades (VIP Lead Gen) and Anti-Gravity Gear Store

-- 1. Directory Elite Memberships
CREATE TABLE public.directory_elite_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled')),
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_subscription_id TEXT,
    
    -- VIP Configuration
    badge_type TEXT NOT NULL DEFAULT 'verified_elite' CHECK (badge_type IN ('verified_elite', 'corridor_master')),
    custom_cta_url TEXT,                 -- Allows brokers/escorts to link out directly to their own site
    spotlight_region TEXT,               -- The state or MSA where they always rank first
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_elite_active ON public.directory_elite_memberships(profile_id) WHERE status = 'active';

-- Modify the existing profiles or directories view to optionally sort by elite first

-- 2. Anti-Gravity Gear (E-Commerce Affiliates / Dropshipping)
CREATE TABLE public.store_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price_usd NUMERIC NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('height_poles', 'light_bars', 'banners_flags', 'safety_apparel', 'cb_radios_comms')),
    
    images JSONB,                        -- Array of image URLs
    is_active BOOLEAN DEFAULT true,
    
    -- Dropship / Affiliate mechanics
    fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('internal_fba', 'amazon_affiliate', 'custom_dropship')),
    affiliate_url TEXT,                  -- Where the user goes if it's an affiliate product
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.store_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    total_amount_usd NUMERIC NOT NULL,
    shipping_address JSONB,
    status TEXT NOT NULL CHECK (status IN ('pending_payment', 'processing', 'shipped', 'delivered', 'canceled')),
    stripe_payment_intent_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.store_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.store_products(id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price_usd NUMERIC NOT NULL
);

-- RLS
ALTER TABLE public.directory_elite_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Elite memberships visible to all"
    ON public.directory_elite_memberships FOR SELECT TO authenticated USING (true);

CREATE POLICY "Products visible to all"
    ON public.store_products FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users view own orders"
    ON public.store_orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

CREATE POLICY "Users view own order items"
    ON public.store_order_items FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.store_orders
            WHERE id = store_order_items.order_id AND buyer_id = auth.uid()
        )
    );

-- Seed Initial High-Margin Products
INSERT INTO public.store_products (title, description, price_usd, category, fulfillment_type, affiliate_url)
VALUES 
('Anti-Gravity Pro 30ft Aluminum Height Pole', 'Aerodynamic 30ft height pole with flexible carbon-fiber tip and non-conductive warning flag.', 450.00, 'height_poles', 'internal_fba', NULL),
('Code 3 Defender Series LED Light Bar', '52-inch amber LED light bar with multi-pattern flash modes. DOT compliant.', 899.00, 'light_bars', 'amazon_affiliate', 'https://amazon.com/...'),
('Heavy Haul "OVERSIZE LOAD" Mesh Banner 18x84', 'Wind-resistant heavy duty mesh. 4 brass grommets. Safety yellow with bold black lettering.', 65.00, 'banners_flags', 'internal_fba', NULL);
