-- 🏗️ HAUL COMMAND OS: COMMERCIAL ENGINE (v1.0)
-- "The Revenue Stacking Layer"
-- Implements Layer 2 (Tools) & Layer 3 (Infrastructure Monetization)

-- ==========================================
-- LAYER 2A: OPERATOR SUBSCRIPTIONS
-- "Cash Flow Stabilization"
-- ==========================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL, -- 'Operator Basic', 'Operator Pro'
    monthly_price NUMERIC(10, 2) NOT NULL,
    features_json JSONB, -- ['job_alerts', 'calculator_pro', 'deadhead_tool']
    is_active BOOLEAN DEFAULT true
);

INSERT INTO subscription_plans (plan_name, monthly_price, features_json) VALUES
('Operator Basic', 0.00, '["basic_load_board"]'),
('Operator Pro', 79.00, '["job_alerts", "calculator_pro", "deadhead_profit_tool", "earnings_estimator", "rate_guide", "early_dispatch"]');

CREATE TABLE operator_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT CHECK (status IN ('active', 'past_due', 'cancelled')),
    start_date DATE DEFAULT CURRENT_DATE,
    next_billing_date DATE,
    payment_method_id UUID, -- Stripe/HallPay ref
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- LAYER 2B: PREMIUM DIRECTORY LISTINGS
-- "Not paying for exposure, paying for routing priority"
-- ==========================================

CREATE TABLE directory_listing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name TEXT NOT NULL, -- 'Free', 'Featured', 'Verified', 'Top Tier'
    monthly_price NUMERIC(10, 2) NOT NULL,
    routing_priority_boost INTEGER DEFAULT 0, -- 0-100 score boost
    badge_label TEXT -- 'Verified', 'Preferred'
);

INSERT INTO directory_listing_tiers (tier_name, monthly_price, routing_priority_boost, badge_label) VALUES
('Basic', 0.00, 0, NULL),
('Featured', 49.00, 10, 'Featured'),
('Verified', 99.00, 25, 'Verified'),
('Top Tier', 199.00, 50, 'Priority Partner');

CREATE TABLE company_directory_status (
    company_id UUID PRIMARY KEY REFERENCES companies(id),
    tier_id UUID REFERENCES directory_listing_tiers(id),
    is_active BOOLEAN DEFAULT true,
    last_billed_at TIMESTAMPTZ
);


-- ==========================================
-- LAYER 3: INVOICING ARCHITECTURE
-- "No-Dispute Invoice Template"
-- ==========================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number SERIAL, -- "Invoice #"
    job_id UUID, -- Link to core job
    company_id UUID REFERENCES companies(id), -- Bill To
    
    -- Header Data
    move_date DATE,
    load_ref_number TEXT,
    permit_number TEXT,
    origin_city TEXT,
    dest_city TEXT,
    
    -- Section B: Escort Coverage
    lead_escort_cost NUMERIC(10, 2) DEFAULT 0,
    chase_escort_cost NUMERIC(10, 2) DEFAULT 0,
    high_pole_cost NUMERIC(10, 2) DEFAULT 0,
    steer_support_cost NUMERIC(10, 2) DEFAULT 0,
    
    -- Section C: Agency Coordination (Pass-Through)
    police_pass_through_cost NUMERIC(10, 2) DEFAULT 0,
    coordination_fee_cost NUMERIC(10, 2) DEFAULT 0,
    
    -- Section D: Premiums
    night_ops_premium NUMERIC(10, 2) DEFAULT 0,
    weekend_premium NUMERIC(10, 2) DEFAULT 0,
    urban_premium NUMERIC(10, 2) DEFAULT 0,
    rush_surcharge NUMERIC(10, 2) DEFAULT 0,
    
    -- Totals
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (
        lead_escort_cost + chase_escort_cost + high_pole_cost + steer_support_cost +
        police_pass_through_cost + coordination_fee_cost +
        night_ops_premium + weekend_premium + urban_premium + rush_surcharge
    ) STORED,
    
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (subtotal + tax_amount) STORED,
    
    -- Status
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'dispute', 'void')),
    
    -- Footer Legal Text
    footer_text TEXT DEFAULT 'This invoice reflects services rendered in accordance with permit routing and confirmed escort configuration. Police and agency charges are pass-through at cost. Coordination fees cover documentation handling, routing verification, agency communication, and compliance review.',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE
);

-- Line Items for granular detail if needed (optional extension)
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    description TEXT, -- "Lead Escort - 400 miles @ $2.50"
    amount NUMERIC(10, 2)
);
