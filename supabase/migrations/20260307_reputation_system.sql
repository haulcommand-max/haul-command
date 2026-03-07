-- ════════════════════════════════════════════════════════════
-- HAUL COMMAND REPUTATION SYSTEM — Database Schema
-- Layer A: Universal Trust Score (8 categories)
-- Layer B: Role-Specific Capability Modules (5 families)
-- ════════════════════════════════════════════════════════════

-- ── Role Taxonomy Reference ──
CREATE TABLE IF NOT EXISTS public.role_taxonomy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family TEXT NOT NULL,
    subtype TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed role taxonomy
INSERT INTO public.role_taxonomy (family, subtype, label, display_order) VALUES
  -- A. Escort Operations
  ('escort_operations', 'lead_escort', 'Lead Escort / Front PEVO', 10),
  ('escort_operations', 'chase_escort', 'Chase Escort / Rear PEVO', 20),
  ('escort_operations', 'dual_role_escort', 'Dual-Role Escort (Lead + Chase)', 30),
  ('escort_operations', 'height_pole_escort', 'Height Pole Escort', 40),
  ('escort_operations', 'night_advanced_visibility', 'Night / Advanced Visibility Escort', 50),
  ('escort_operations', 'multi_unit_team', 'Multi-Unit Escort Team', 60),
  -- B. Specialized Utility
  ('specialized_utility', 'bucket_truck_escort', 'Bucket Truck Escort', 110),
  ('specialized_utility', 'line_lift_coordination', 'Line Lift / Utility Coordination', 120),
  ('specialized_utility', 'overhead_clearance', 'Overhead Clearance Support', 130),
  ('specialized_utility', 'urban_utility_conflict', 'Urban Utility Conflict Support', 140),
  -- C. Route Planning
  ('route_planning', 'route_survey_provider', 'Route Survey Provider', 210),
  ('route_planning', 'bridge_clearance_review', 'Bridge / Clearance Review', 220),
  ('route_planning', 'multi_state_coordination', 'Multi-State Route Coordination', 230),
  ('route_planning', 'engineering_permit_support', 'Engineering / Permit Support', 240),
  ('route_planning', 'route_mapping_obstruction', 'Route Mapping / Obstruction Planning', 250),
  -- D. Law Enforcement
  ('law_enforcement', 'police_escort_coordination', 'Police Escort Coordination', 310),
  ('law_enforcement', 'state_escort_coordination', 'State Escort Coordination', 320),
  ('law_enforcement', 'municipal_escort_coordination', 'Municipal Escort Coordination', 330),
  ('law_enforcement', 'multi_agency_coordination', 'Multi-Agency Escort Coordination', 340),
  -- E. Support Readiness
  ('support_readiness', 'deadhead_repositioning', 'Deadhead / Repositioning Ready', 410),
  ('support_readiness', 'layover_multi_day', 'Layover / Multi-Day Ready', 420),
  ('support_readiness', 'after_hours_night', 'After-Hours / Night Move Ready', 430),
  ('support_readiness', 'weekend_seasonal', 'Weekend / Seasonal Ready', 440),
  ('support_readiness', 'high_complexity_urban', 'High-Complexity / Urban Move Ready', 450)
ON CONFLICT (subtype) DO NOTHING;

-- ── Operator Role Assignments (M2M) ──
CREATE TABLE IF NOT EXISTS public.operator_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    role_subtype TEXT NOT NULL REFERENCES public.role_taxonomy(subtype),
    is_primary BOOLEAN DEFAULT false,
    self_reported BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    experience_years NUMERIC(4,1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(operator_id, role_subtype)
);

CREATE INDEX IF NOT EXISTS idx_operator_roles_operator
    ON public.operator_roles(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_roles_subtype
    ON public.operator_roles(role_subtype);

-- ── Reputation Scores (computed, stored) ──
CREATE TABLE IF NOT EXISTS public.reputation_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    entity_id TEXT,

    -- Layer A: Universal Trust Score
    overall_trust_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_trust_score BETWEEN 0 AND 100),
    trust_tier TEXT NOT NULL DEFAULT 'unverified' CHECK (trust_tier IN (
        'elite', 'strong', 'verified', 'basic', 'unverified'
    )),
    hard_gate_passed BOOLEAN DEFAULT false,
    hard_gate_failures TEXT[] DEFAULT '{}',

    -- Universal category subscores (0-100 each)
    identity_ownership_score INTEGER DEFAULT 0,
    profile_strength_score INTEGER DEFAULT 0,
    verification_compliance_score INTEGER DEFAULT 0,
    responsiveness_score INTEGER DEFAULT 0,
    reliability_score INTEGER DEFAULT 0,
    freshness_score INTEGER DEFAULT 0,
    territory_coverage_score INTEGER DEFAULT 0,
    dispatch_readiness_score INTEGER DEFAULT 0,

    -- Layer B: Capability Module Scores (null = not offered)
    pevo_readiness INTEGER CHECK (pevo_readiness IS NULL OR pevo_readiness BETWEEN 0 AND 100),
    specialized_escort_readiness INTEGER CHECK (specialized_escort_readiness IS NULL OR specialized_escort_readiness BETWEEN 0 AND 100),
    utility_support_readiness INTEGER CHECK (utility_support_readiness IS NULL OR utility_support_readiness BETWEEN 0 AND 100),
    route_survey_readiness INTEGER CHECK (route_survey_readiness IS NULL OR route_survey_readiness BETWEEN 0 AND 100),
    escort_coordination_readiness INTEGER CHECK (escort_coordination_readiness IS NULL OR escort_coordination_readiness BETWEEN 0 AND 100),

    -- Role metadata
    primary_role_family TEXT,
    role_families TEXT[] DEFAULT '{}',
    role_subtypes TEXT[] DEFAULT '{}',

    -- Badges
    badges JSONB DEFAULT '[]',
    badge_count INTEGER DEFAULT 0,

    -- Timestamps
    computed_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(operator_id)
);

-- Search indexes for Typesense sync and ranking queries
CREATE INDEX IF NOT EXISTS idx_reputation_trust
    ON public.reputation_scores(overall_trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_tier
    ON public.reputation_scores(trust_tier);
CREATE INDEX IF NOT EXISTS idx_reputation_pevo
    ON public.reputation_scores(pevo_readiness DESC)
    WHERE pevo_readiness IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reputation_specialized
    ON public.reputation_scores(specialized_escort_readiness DESC)
    WHERE specialized_escort_readiness IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reputation_utility
    ON public.reputation_scores(utility_support_readiness DESC)
    WHERE utility_support_readiness IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reputation_survey
    ON public.reputation_scores(route_survey_readiness DESC)
    WHERE route_survey_readiness IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reputation_coordination
    ON public.reputation_scores(escort_coordination_readiness DESC)
    WHERE escort_coordination_readiness IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reputation_dispatch
    ON public.reputation_scores(dispatch_readiness_score DESC)
    WHERE dispatch_readiness_score > 0;

-- GIN index for role-based filtering
CREATE INDEX IF NOT EXISTS idx_reputation_role_families
    ON public.reputation_scores USING GIN (role_families);
CREATE INDEX IF NOT EXISTS idx_reputation_role_subtypes
    ON public.reputation_scores USING GIN (role_subtypes);

-- ── Score History (audit trail) ──
CREATE TABLE IF NOT EXISTS public.reputation_score_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    overall_trust_score INTEGER NOT NULL,
    trust_tier TEXT NOT NULL,
    category_scores JSONB NOT NULL,       -- snapshot of all category scores
    capability_scores JSONB DEFAULT '{}',  -- snapshot of capability modules
    badges JSONB DEFAULT '[]',
    trigger_reason TEXT,                   -- what caused the recompute
    computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reputation_history_operator
    ON public.reputation_score_history(operator_id, computed_at DESC);

-- ── Enable RLS ──
ALTER TABLE public.role_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_score_history ENABLE ROW LEVEL SECURITY;

-- Public read for role taxonomy (reference data)
CREATE POLICY role_taxonomy_read ON public.role_taxonomy
    FOR SELECT TO anon, authenticated USING (true);

-- Operators can read their own roles
CREATE POLICY operator_roles_own_read ON public.operator_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = operator_id);

-- Public read for reputation scores (public trust data)
CREATE POLICY reputation_public_read ON public.reputation_scores
    FOR SELECT TO anon, authenticated USING (true);

-- Operator reads their own history
CREATE POLICY reputation_history_own_read ON public.reputation_score_history
    FOR SELECT TO authenticated
    USING (auth.uid() = operator_id);

-- Updated_at trigger
CREATE TRIGGER trg_reputation_scores_updated
    BEFORE UPDATE ON public.reputation_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_claim_readiness_timestamp();
