-- ==============================================================================
-- HAUL COMMAND - ADGRID MONETIZATION SCHEMA
-- Creates the self-serve advertising engine required to beat Google Ads.
-- Connects to the ADGRID_FORMULA_SPECS.yaml logic.
-- ==============================================================================

-- 1. AD_VERTISERS: Business entities funding the AdGrid self-serve campaigns
CREATE TABLE IF NOT EXISTS public.adgrid_advertisers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.hc_real_operators(id) ON DELETE CASCADE,
    account_status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'PROBATION', 'PENDING_PAYMENT')),
    billing_email VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255),
    wallet_balance_cents INTEGER DEFAULT 0,
    ltv_score NUMERIC(5,4) DEFAULT 0.5000, -- Tracks adgrid loyalty (ADGRID_FORMULA_SPECS)
    total_spend_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. ADGRID_CAMPAIGNS: The self-serve geo-fenced buckets
CREATE TABLE IF NOT EXISTS public.adgrid_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID REFERENCES public.adgrid_advertisers(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'DEPLETED', 'ARCHIVED')),
    
    -- Budget & Bidding (from ADGRID_FORMULA_SPECS mapping)
    daily_budget_cents INTEGER NOT NULL CHECK (daily_budget_cents >= 500), -- Minimum $5/day
    max_cpc_cents INTEGER NOT NULL CHECK (max_cpc_cents >= 25),            -- Minimum $0.25 CPC
    pacing_mode VARCHAR(50) DEFAULT 'STANDARD' CHECK (pacing_mode IN ('STANDARD', 'ACCELERATED')),
    
    -- Geo-Targeting: "Beat Google" feature
    target_countries TEXT[] DEFAULT '{}',
    target_states TEXT[] DEFAULT '{}',
    target_corridors TEXT[] DEFAULT '{}', -- e.g., 'I-10_TX_NM'
    
    -- Equipment/Service Match
    target_services TEXT[] DEFAULT '{}',  -- e.g., 'high_pole', 'chase_car'
    
    -- Performance Tracking
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    spend_today_cents INTEGER DEFAULT 0,
    
    start_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. ADGRID_CREATIVES: The actual sponsored profile listings or premium pins
CREATE TABLE IF NOT EXISTS public.adgrid_creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.adgrid_campaigns(id) ON DELETE CASCADE,
    creative_type VARCHAR(50) NOT NULL CHECK (creative_type IN ('SEARCH_TOP_SLOT', 'MAP_PREMIUM_PIN', 'CORRIDOR_SPONSOR')),
    
    -- The actual content shown (often linked to their profile slug)
    headline VARCHAR(100) NOT NULL,
    description TEXT,
    destination_url VARCHAR(255) NOT NULL, -- usually /directory/us/tx/atlas-heavy-haul
    
    -- Fatigue & CTR Tracking (ADGRID_FORMULA_SPECS)
    current_ctr NUMERIC(5,4) DEFAULT 0.0000,
    fatigue_score NUMERIC(5,4) DEFAULT 0.0000,
    status VARCHAR(50) DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'FATIGUED')),
    
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indices for rapid auction queries
CREATE INDEX IF NOT EXISTS idx_adgrid_campaigns_status ON public.adgrid_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_adgrid_creatives_campaign ON public.adgrid_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adgrid_advertisers_balance ON public.adgrid_advertisers(wallet_balance_cents);

-- RLS Policies
ALTER TABLE public.adgrid_advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adgrid_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adgrid_creatives ENABLE ROW LEVEL SECURITY;

-- Allow read access to engine
CREATE POLICY "Engine can read active campaigns" 
    ON public.adgrid_campaigns FOR SELECT USING (status = 'ACTIVE');

-- Advertisers can only view/manage their own campaigns
CREATE POLICY "Advertisers can manage own campaigns" 
    ON public.adgrid_campaigns FOR ALL 
    USING (advertiser_id IN (SELECT id FROM public.adgrid_advertisers WHERE profile_id = auth.uid()));
