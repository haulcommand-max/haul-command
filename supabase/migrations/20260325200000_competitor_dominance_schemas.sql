-- ==============================================================================
-- HAUL COMMAND COMPETITOR DOMINANCE SPRINT
-- Target A: ODSNA.com (Onboarding & Documentation Gaps)
-- Target B: Oversize.io (Hyperlocal Curfews & Dynamic Filtering Gaps)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ODSNA COMPLIANCE CRUSHER (Vendor Document & Asset Enforcement)
-- ODSNA explicitly requires $1M liability, "escort pilot" named insurance,
-- ACORD certs, and detailed vehicle/equipment photo verification.
-- We are enforcing these in a dedicated rapid-verification table to 
-- fuel our autonomous automated fast-pay ("Same Day Pay") engine.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hc_odsna_compliance_matrix (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id uuid NOT NULL, -- references whatever user/operator identity table exists
    
    -- ODSNA specific high-barrier insurance limits
    liability_insurance_amount numeric NOT NULL DEFAULT 0.00,
    is_insured_as_escort_pilot boolean DEFAULT false,
    hauler_acord_certificate_verified boolean DEFAULT false,
    
    -- ODSNA specific experience mapping
    years_experience_high_pole integer DEFAULT 0,
    years_experience_steerman integer DEFAULT 0,
    years_experience_lead_chase integer DEFAULT 0,
    
    -- ODSNA asset & equipment audits
    has_mandatory_equipment_list boolean DEFAULT false, -- Flares, cones, stop/slow paddles
    has_vehicle_photos_verified boolean DEFAULT false,
    
    -- Monetization / Fast Pay
    payment_terms_preference text CHECK (payment_terms_preference IN ('same_day_fast_pay', 'standard_net_30', 'factored')),
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_odsna_compliance_matrix_op ON public.hc_odsna_compliance_matrix(operator_id);
-- Fixed the WHERE clause issue that would fail in pg: partial indexes need valid expressions
CREATE INDEX IF NOT EXISTS idx_hc_odsna_compliance_fast_pay ON public.hc_odsna_compliance_matrix(payment_terms_preference) WHERE has_vehicle_photos_verified = true;

-- ------------------------------------------------------------------------------
-- 2. OVERSIZE.IO REGULATION CRUSHER (Escort Dimensions & Weight Rules)
-- Oversize.io has static tables. Users cannot filter by load.
-- We are creating discrete trigger columns so our dashboard can instantly 
-- filter the rules by the user's exact input (e.g. Width: 14' -> 1 Front Escort).
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hc_regulatory_dimension_rules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code text NOT NULL,
    state_or_province text NOT NULL,
    
    -- Oversize.io tracked weight boundaries
    legal_max_width numeric NOT NULL, -- in feet (e.g., 8.5)
    legal_max_height numeric NOT NULL, -- in feet (e.g., 13.5 or 14)
    legal_gross_weight numeric NOT NULL, -- in lbs (e.g., 80000)
    single_axle_max_weight numeric, 
    tandem_axle_max_weight numeric,
    tridem_axle_max_weight numeric,
    
    -- Precise specific escort triggers extracted from their tables
    trigger_1_escort_front_width numeric, -- e.g., 14.0 for Texas 2-lane
    trigger_1_escort_rear_width numeric,
    trigger_2_escorts_width numeric,      -- e.g., 16.0 for Texas all roads
    
    trigger_height_pole numeric,          -- e.g., 17.0 for Texas, 14.5 for Florida
    trigger_1_escort_length numeric,      -- e.g., 110.0 for Texas
    trigger_2_escorts_length numeric,     -- e.g., 125.0
    
    -- Time of Day logic missing from their dynamic tools
    night_travel_allowed boolean DEFAULT false,
    night_travel_max_width numeric,       -- e.g., 10.0 (Interstate only)
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (country_code, state_or_province)
);

-- ------------------------------------------------------------------------------
-- 3. OVERSIZE.IO CURFEW CRUSHER (Hyperlocal Time-of-Day Engine)
-- Oversize.io relies on "see permit" for curfews. 
-- We will digitize county/city level curfews (e.g. Houston I-610 restrictions)
-- directly and flag them on the dispatch map autonomously.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hc_regulatory_hyperlocal_curfews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dimension_rule_id uuid REFERENCES public.hc_regulatory_dimension_rules(id) ON DELETE CASCADE,
    jurisdiction_type text CHECK (jurisdiction_type IN ('statewide', 'county', 'city', 'zone', 'route')),
    jurisdiction_name text NOT NULL, -- e.g. "Houston", "Harris County", "I-610 Loop"
    
    -- Specific restriction windows
    curfew_start_time time, -- e.g., 06:00:00
    curfew_end_time time,   -- e.g., 09:00:00
    is_am_peak boolean DEFAULT true,
    is_pm_peak boolean DEFAULT false,
    
    -- Triggers (e.g. curfews only apply if over 10ft wide or 100ft long)
    applies_to_width_over numeric,
    applies_to_length_over numeric,
    
    -- Explicit holiday overrides
    holiday_restriction_details text, -- Resolves the "see permit" gap
    
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_reg_hyperlocal_curfews_jurisdiction ON public.hc_regulatory_hyperlocal_curfews(jurisdiction_name);

-- ------------------------------------------------------------------------------
-- SEED EXAMPLE: Destroying Oversize.io's Texas Page
-- ------------------------------------------------------------------------------
INSERT INTO public.hc_regulatory_dimension_rules (
    country_code, state_or_province, legal_max_width, legal_max_height, legal_gross_weight, 
    single_axle_max_weight, tandem_axle_max_weight, tridem_axle_max_weight,
    trigger_1_escort_front_width, trigger_2_escorts_width,
    trigger_height_pole, trigger_1_escort_length, trigger_2_escorts_length,
    night_travel_allowed, night_travel_max_width
) VALUES (
    'US', 'TX', 8.5, 14.0, 80000, 
    20000, 34000, 42000,
    14.0, 16.0,
    17.0, 110.0, 125.0,
    true, 10.0
) ON CONFLICT (country_code, state_or_province) DO NOTHING;
