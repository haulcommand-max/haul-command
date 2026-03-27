-- 120-Country Global Expansion, Taxonomy, Glossary, and Trust/Report-Card Schema Updates

-- 1. AUTONOMOUS COUNTRY EXPANSION ENGINE
CREATE TABLE IF NOT EXISTS public.country_market (
    country_code TEXT PRIMARY KEY,
    country_name TEXT NOT NULL,
    tier TEXT DEFAULT 'E',
    status TEXT DEFAULT 'seed_only',
    country_domination_score INTEGER DEFAULT 0,
    country_priority_bucket TEXT DEFAULT 'seed_only',
    next_recommended_action TEXT,
    language_pack_status TEXT DEFAULT 'missing',
    compliance_pack_status TEXT DEFAULT 'missing',
    regulatory_pack_status TEXT DEFAULT 'missing',
    social_pack_status TEXT DEFAULT 'missing',
    seo_pack_status TEXT DEFAULT 'missing',
    payments_pack_status TEXT DEFAULT 'missing',
    last_scored_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.country_market_score_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT REFERENCES public.country_market(country_code),
    claim_conversion_score INTEGER DEFAULT 0,
    alive_profile_score INTEGER DEFAULT 0,
    app_install_activation_score INTEGER DEFAULT 0,
    listing_density_score INTEGER DEFAULT 0,
    supply_liquidity_score INTEGER DEFAULT 0,
    demand_liquidity_score INTEGER DEFAULT 0,
    seo_indexation_visibility_score INTEGER DEFAULT 0,
    social_gravity_score INTEGER DEFAULT 0,
    regulatory_readiness_score INTEGER DEFAULT 0,
    compliance_coverage_score INTEGER DEFAULT 0,
    monetization_readiness_score INTEGER DEFAULT 0,
    payment_readiness_score INTEGER DEFAULT 0,
    country_domination_score INTEGER DEFAULT 0,
    snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.country_expansion_decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT REFERENCES public.country_market(country_code),
    decision_type TEXT NOT NULL,
    decision_reason TEXT NOT NULL,
    decision_payload_json JSONB DEFAULT '{}'::jsonb,
    blocking_factors_json JSONB DEFAULT '{}'::jsonb,
    recommended_actions_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.country_regulatory_source (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT REFERENCES public.country_market(country_code),
    agency_name TEXT NOT NULL,
    agency_type TEXT NOT NULL,
    agency_url TEXT,
    oversize_rules_available BOOLEAN DEFAULT FALSE,
    escort_rules_available BOOLEAN DEFAULT FALSE,
    permit_rules_available BOOLEAN DEFAULT FALSE,
    confidence_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.country_language_pack (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT REFERENCES public.country_market(country_code),
    primary_language TEXT NOT NULL,
    industry_terms_json JSONB DEFAULT '{}'::jsonb,
    pilot_car_terms_json JSONB DEFAULT '{}'::jsonb,
    search_aliases_json JSONB DEFAULT '{}'::jsonb,
    slang_json JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GLOBAL ROLE TAXONOMY & CLAIM MACHINE
CREATE TABLE IF NOT EXISTS public.canonical_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_slug TEXT UNIQUE NOT NULL,
    role_name TEXT NOT NULL,
    role_layer TEXT NOT NULL,
    is_claimable BOOLEAN DEFAULT TRUE,
    is_rankable BOOLEAN DEFAULT TRUE,
    is_monetizable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.country_role_alias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT REFERENCES public.country_market(country_code),
    canonical_role_id UUID REFERENCES public.canonical_role(id),
    alias_term TEXT NOT NULL,
    confidence_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profile_claim_funnel_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT REFERENCES public.country_market(country_code),
    canonical_role_id UUID REFERENCES public.canonical_role(id),
    channel TEXT NOT NULL,
    date DATE NOT NULL,
    profiles_exposed INTEGER DEFAULT 0,
    claim_starts INTEGER DEFAULT 0,
    claim_completes INTEGER DEFAULT 0,
    alive_profiles INTEGER DEFAULT 0,
    adgrid_activations INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GLOBAL GLOSSARY, VOICE SEARCH & GOVERNANCE
CREATE TABLE IF NOT EXISTS public.glossary_control_term (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_slug TEXT UNIQUE NOT NULL,
    term_name TEXT NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('confirmed_safe', 'review_needed', 'blocked')),
    term_type TEXT NOT NULL,
    maps_to_role UUID REFERENCES public.canonical_role(id),
    maps_to_profile_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.glossary_country_variant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    glossary_term_id UUID REFERENCES public.glossary_control_term(id),
    country_code TEXT REFERENCES public.country_market(country_code),
    language_code TEXT NOT NULL,
    variant_text TEXT NOT NULL,
    risk_classification TEXT DEFAULT 'review_needed',
    search_intent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voice_query_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT REFERENCES public.country_market(country_code),
    language_code TEXT NOT NULL,
    query_pattern TEXT NOT NULL,
    mapped_term_id UUID REFERENCES public.glossary_control_term(id),
    mapped_profile_type TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.term_risk_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_text TEXT NOT NULL,
    country_code TEXT REFERENCES public.country_market(country_code),
    risk_reason TEXT NOT NULL,
    review_status TEXT DEFAULT 'pending',
    approved_route_families_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRUST SYSTEM AND REPORT CARDS (Expanding on identity_scores)
-- Linking directory_listings to the core identity_score logic to ensure
-- every 1.5M operator instantly gets a "Trust Status" badge/report card logic.
ALTER TABLE public.directory_listings ADD COLUMN IF NOT EXISTS hc_id TEXT UNIQUE;
ALTER TABLE public.directory_listings ADD COLUMN IF NOT EXISTS trust_score_id UUID REFERENCES public.identity_scores(id);
ALTER TABLE public.directory_listings ADD COLUMN IF NOT EXISTS alive_status TEXT DEFAULT 'scraped' CHECK (alive_status IN ('scraped', 'claimed', 'verified', 'alive', 'deactivated'));

-- 5. UPGRADED ADGRID MONETIZATION PATHS
CREATE TABLE IF NOT EXISTS public.adgrid_monetization_path (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_slug TEXT UNIQUE NOT NULL,
    path_name TEXT NOT NULL,
    pricing_model TEXT NOT NULL, -- CPC, CPM, Subscription, Territory_Sponsorship
    surface_type TEXT NOT NULL, -- Directory, Corridor, Voice_Answer, Glossary_Sponsor
    country_scope TEXT[],
    role_scope TEXT[],
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_claim_offer_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT REFERENCES public.country_market(country_code),
    canonical_role_id UUID REFERENCES public.canonical_role(id),
    offer_slug TEXT NOT NULL,
    offer_priority INTEGER DEFAULT 1,
    monetization_path_id UUID REFERENCES public.adgrid_monetization_path(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_country_market_tier ON public.country_market(tier);
CREATE INDEX IF NOT EXISTS idx_glossary_term_slug ON public.glossary_control_term(term_slug);
CREATE INDEX IF NOT EXISTS idx_canonical_role_slug ON public.canonical_role(role_slug);
CREATE INDEX IF NOT EXISTS idx_directory_listings_alive ON public.directory_listings(alive_status);
CREATE INDEX IF NOT EXISTS idx_cm_score_snapshot ON public.country_market_score_snapshot(snapshot_at);

-- RLS Hardening (Default Deny / Service Role only by default)
ALTER TABLE public.country_market ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_market_score_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_expansion_decision_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_regulatory_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_language_pack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_role_alias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_claim_funnel_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_control_term ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_country_variant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_query_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_risk_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adgrid_monetization_path ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_claim_offer_matrix ENABLE ROW LEVEL SECURITY;

-- Expose purely public routing/taxonomies for the frontend Next.js App
CREATE POLICY "Public taxonomies viewable" ON public.canonical_role FOR SELECT USING (true);
CREATE POLICY "Public role aliases viewable" ON public.country_role_alias FOR SELECT USING (true);
CREATE POLICY "Public dictionary terms viewable" ON public.glossary_control_term FOR SELECT USING (classification = 'confirmed_safe');
CREATE POLICY "Public term variants viewable" ON public.glossary_country_variant FOR SELECT USING (risk_classification = 'confirmed_safe');
CREATE POLICY "Public voice queries viewable" ON public.voice_query_template FOR SELECT USING (status = 'active');
CREATE POLICY "Public country limits" ON public.country_market FOR SELECT USING (status IN ('activation_ready', 'expansion_now', 'dominate_now', 'monetize_now'));
