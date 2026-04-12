-- ========================================================================================
-- HAUL COMMAND AD NETWORK & TRUST SCORE SCHEMA V1.1 (PR #5)
-- Goal: Monetization engine via RTB and Multi-Dimensional Trust Scoring
-- Dependencies: profiles, trust_edges, incidents, match_offers, matches
-- ========================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADVERTISER ACCOUNTS
-- Extends the profiles table for users participating in the ad network
CREATE TABLE IF NOT EXISTS public.advertiser_accounts (
    advertiser_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id text,
    trust_score int DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100), -- 0-100 Bayesian Shrinkage Score
    account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_review')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. ADVERTISER BUDGETS
-- Controls the RTB eligibility
CREATE TABLE IF NOT EXISTS public.advertiser_budgets (
    advertiser_id uuid PRIMARY KEY REFERENCES public.advertiser_accounts(advertiser_id) ON DELETE CASCADE,
    daily_budget_limit numeric(10, 2) DEFAULT 0.00,
    monthly_budget_limit numeric(10, 2) DEFAULT 0.00,
    spent_today numeric(10, 2) DEFAULT 0.00,
    spent_this_month numeric(10, 2) DEFAULT 0.00,
    remaining_balance numeric(10, 2) DEFAULT 0.00,
    currency text DEFAULT 'USD',
    updated_at timestamptz DEFAULT now()
);

-- 3. AD SLOTS (Inventory)
-- Defines where ads can be shown and the floor pricing rules
CREATE TABLE IF NOT EXISTS public.ad_slots (
    slot_id text PRIMARY KEY, -- e.g., 'load_board_top', 'escort_search_top'
    description text,
    intent_tier text CHECK (intent_tier IN ('tier_1', 'tier_2', 'tier_3')), -- For multiplier modeling
    floor_price numeric(10, 2) NOT NULL DEFAULT 1.00,
    ceiling_price numeric(10, 2) NOT NULL DEFAULT 50.00,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 4. QUALITY SCORE SNAPSHOTS
-- Historical tracking of trust subscores for anomaly detection and appeals
CREATE TABLE IF NOT EXISTS public.quality_score_snapshots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id uuid REFERENCES public.advertiser_accounts(advertiser_id) ON DELETE CASCADE,
    snapshot_date date DEFAULT CURRENT_DATE,
    
    -- Subscores (0.0 to 1.0 normalized per spec)
    reliability_raw numeric(6,4),
    responsiveness_raw numeric(6,4),
    integrity_raw numeric(6,4),
    customer_signal_raw numeric(6,4),
    compliance_raw numeric(6,4),
    market_fit_raw numeric(6,4),
    
    -- Computed Trust Score (0-100)
    calculated_trust_score int,
    bayesian_adjusted_score int,
    
    UNIQUE (advertiser_id, snapshot_date)
);

-- 5. IMPRESSION LOG (RTB Outcomes)
-- Records the winning bids and fairness adjustments applied
CREATE TABLE IF NOT EXISTS public.impression_log (
    impression_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id text NOT NULL, -- Correlates back to the RTB engine run
    advertiser_id uuid REFERENCES public.advertiser_accounts(advertiser_id) ON DELETE SET NULL,
    slot_id text REFERENCES public.ad_slots(slot_id),
    
    bid_amount numeric(10, 2), -- The original bid
    charge_amount numeric(10, 2), -- The actual cleared 1st price
    
    -- Telemetry on adjustments applied
    p_ctr numeric(6,4),
    p_cvr numeric(6,4),
    trust_multiplier numeric(6,4),
    fairness_multiplier numeric(6,4),
    
    served_at timestamptz DEFAULT now()
);

-- 6. LEAD EVENTS (PPL Conversions)
-- Logs high-value conversion actions mapped back to an impression
CREATE TABLE IF NOT EXISTS public.lead_events (
    lead_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    impression_id uuid REFERENCES public.impression_log(impression_id) ON DELETE CASCADE,
    advertiser_id uuid REFERENCES public.advertiser_accounts(advertiser_id) ON DELETE CASCADE,
    event_type text CHECK (event_type IN ('phone_call', 'direct_message', 'external_link_click', 'load_board_offer')),
    client_ip text,
    user_agent text,
    conversion_value numeric(10, 2) DEFAULT 0.00, -- Optional explicit value tracking
    occurred_at timestamptz DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE advertiser_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertiser_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE impression_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

-- Advertisers can read their own accounts and budgets
CREATE POLICY "Advertisers can view their own accounts" ON advertiser_accounts FOR SELECT USING (auth.uid() = advertiser_id);
CREATE POLICY "Advertisers can view their own budgets" ON advertiser_budgets FOR SELECT USING (auth.uid() = advertiser_id);

-- Everyone can read active ad slots
CREATE POLICY "Public can view active ad slots" ON ad_slots FOR SELECT USING (is_active = true);

-- Advertisers can view their historical snapshots
CREATE POLICY "Advertisers can view their own quality snapshots" ON quality_score_snapshots FOR SELECT USING (auth.uid() = advertiser_id);

-- Advertisers can read their own impressions and leads
CREATE POLICY "Advertisers can view their own impressions" ON impression_log FOR SELECT USING (auth.uid() = advertiser_id);
CREATE POLICY "Advertisers can view their own leads" ON lead_events FOR SELECT USING (auth.uid() = advertiser_id);

-- Edge Functions bypass RLS to perform RTB matching and Trust evaluation,
-- so no INSERT policies are strictly needed for users.

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_impression_log_adv on public.impression_log(advertiser_id, served_at);
CREATE INDEX idx_lead_events_adv on public.lead_events(advertiser_id, occurred_at);
CREATE INDEX idx_qss_adv_date on public.quality_score_snapshots(advertiser_id, snapshot_date);

-- ==========================================
-- SEED DATA: AD SLOTS
-- ==========================================

INSERT INTO public.ad_slots (slot_id, description, intent_tier, floor_price, ceiling_price) VALUES
  ('load_board_top', 'Top banner position on active load board', 'tier_1', 6.00, 40.00),
  ('escort_search_top', 'Promoted result in directory search', 'tier_1', 5.00, 40.00),
  ('permit_tools', 'Banner within state permit compliance tooling', 'tier_2', 4.00, 22.00),
  ('dashboard_idle', 'General awareness panel on user dashboard', 'tier_3', 2.00, 12.00)
ON CONFLICT (slot_id) DO NOTHING;
