-- ============================================================================
-- GLOBAL INTELLIGENCE LAYER: Country Compliance + Regulatory + Social Gravity
-- This is the database backbone for the 3.3M entity system.
-- ============================================================================

-- 1. COUNTRY REGULATORY SOURCES (FMCSA Equivalents)
CREATE TABLE IF NOT EXISTS public.country_regulatory_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    authority_name TEXT NOT NULL,
    registry_name TEXT,
    registry_url TEXT,
    data_format TEXT DEFAULT 'unknown',        -- csv, api, scrape, manual
    scrape_difficulty TEXT DEFAULT 'unknown',   -- easy, medium, hard, impossible
    last_verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(country_code, authority_name)
);

COMMENT ON TABLE public.country_regulatory_sources IS 'FMCSA-equivalent registries for each country. Powers the autonomous global scraper grid.';

-- 2. COUNTRY COMPLIANCE RULES (Legal Layer)
CREATE TABLE IF NOT EXISTS public.country_compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    rule_type TEXT NOT NULL,                    -- escort_requirement, permit_rule, insurance_rule, police_trigger
    description TEXT NOT NULL,
    threshold_details JSONB DEFAULT '{}',       -- e.g. {"width_m": 3.5, "escorts_required": 2}
    source_url TEXT,
    effective_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(country_code, rule_type, description)
);

COMMENT ON TABLE public.country_compliance_rules IS 'Per-country oversize load regulations: escort requirements, permit thresholds, insurance minimums, police triggers.';

-- 3. COUNTRY LANGUAGE CULTURE MAP (Social Gravity Engine)
CREATE TABLE IF NOT EXISTS public.country_language_culture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL UNIQUE,
    primary_language TEXT NOT NULL,
    local_term_pilot_car TEXT,                 -- What they call a "Pilot Car" locally
    local_slang TEXT[],                        -- Industry slang array
    search_phrasing_examples TEXT[],           -- How locals search for this service
    social_platforms TEXT[],                   -- Dominant social platforms
    cultural_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.country_language_culture IS 'Language, slang, search phrasing, and social platform data per country. Powers localized SEO and social acquisition.';

-- 4. SEED REGULATORY SOURCES FOR TIER A
INSERT INTO public.country_regulatory_sources (country_code, authority_name, registry_name, registry_url, data_format, scrape_difficulty)
VALUES
    ('US', 'FMCSA', 'SAFER Web', 'https://safer.fmcsa.dot.gov', 'csv', 'easy'),
    ('CA', 'Transport Canada', 'NSC Carrier Profiles', 'https://tc.canada.ca', 'api', 'medium'),
    ('AU', 'NHVR', 'National Heavy Vehicle Register', 'https://nhvr.gov.au', 'scrape', 'medium'),
    ('GB', 'DVSA', 'O-Licence Database', 'https://www.gov.uk/manage-vehicle-operator-licence', 'scrape', 'medium'),
    ('DE', 'BALM', 'VEMAGS / Unternehmensregister', 'https://www.balm.bund.de', 'scrape', 'hard'),
    ('FR', 'DREAL', 'Registre Électronique National', 'https://www.ecologie.gouv.fr', 'scrape', 'hard'),
    ('BR', 'ANTT', 'RNTRC', 'https://www.gov.br/antt', 'csv', 'medium'),
    ('ZA', 'CBRTA', 'Operator Permit Registry', 'https://www.cbrta.co.za', 'scrape', 'hard'),
    ('IN', 'MoRTH', 'VAHAN e-Register', 'https://vahan.parivahan.gov.in', 'api', 'medium'),
    ('MX', 'SCT', 'DGAF Registry', 'https://www.gob.mx/sct', 'scrape', 'hard'),
    ('AE', 'RTA', 'Commercial Transport Register', 'https://www.rta.ae', 'scrape', 'hard'),
    ('NZ', 'NZTA Waka Kotahi', 'Transport Operator Register', 'https://www.nzta.govt.nz', 'api', 'easy')
ON CONFLICT DO NOTHING;

-- 5. SEED LANGUAGE CULTURE MAP FOR TIER A + KEY B
INSERT INTO public.country_language_culture (country_code, primary_language, local_term_pilot_car, local_slang, search_phrasing_examples, social_platforms)
VALUES
    ('US', 'en', 'Pilot Car', ARRAY['chase car', 'lead car', 'escort', 'flag car'], ARRAY['pilot car near me', 'oversize load escort', 'wide load escort service'], ARRAY['Facebook', 'TikTok', 'Instagram', 'LinkedIn']),
    ('CA', 'en/fr', 'Pilot Vehicle', ARRAY['escort vehicle', 'lead vehicle'], ARRAY['pilot car service canada', 'oversize load escort alberta'], ARRAY['Facebook', 'LinkedIn']),
    ('AU', 'en', 'Pilot Vehicle', ARRAY['warning vehicle', 'escort vehicle', 'pilot'], ARRAY['pilot vehicle australia', 'oversize escort nsw'], ARRAY['Facebook', 'LinkedIn']),
    ('GB', 'en', 'Escort Vehicle', ARRAY['abnormal load escort', 'wide load escort'], ARRAY['abnormal load escort uk', 'wide load escort service'], ARRAY['WhatsApp', 'Facebook', 'LinkedIn']),
    ('DE', 'de', 'BF3/BF4 Begleitfahrzeug', ARRAY['Schwertransportbegleitung', 'Überbreite Begleitung'], ARRAY['Schwertransport Begleitung', 'BF4 Begleitfahrzeug buchen'], ARRAY['WhatsApp', 'LinkedIn', 'Xing']),
    ('FR', 'fr', 'Véhicule d''accompagnement', ARRAY['voiture pilote', 'convoi exceptionnel'], ARRAY['convoi exceptionnel france', 'transport exceptionnel escort'], ARRAY['WhatsApp', 'LinkedIn', 'Facebook']),
    ('BR', 'pt', 'Escolta de Cargas Especiais', ARRAY['batedor', 'veículo de escolta'], ARRAY['escolta carga pesada brasil', 'transporte especial escolta'], ARRAY['WhatsApp', 'Facebook', 'TikTok']),
    ('MX', 'es', 'Escolta de Carga Sobredimensionada', ARRAY['carro piloto', 'vehículo guía'], ARRAY['escolta carga especial mexico', 'transporte sobredimensionado'], ARRAY['WhatsApp', 'Facebook', 'TikTok']),
    ('IN', 'en/hi', 'Pilot Vehicle', ARRAY['escort vehicle', 'ODC pilot'], ARRAY['ODC transport india', 'pilot vehicle heavy load'], ARRAY['WhatsApp', 'Facebook', 'Instagram']),
    ('AE', 'ar/en', 'مركبة مرافقة', ARRAY['سيارة الحراسة', 'مركبة القيادة'], ARRAY['heavy transport escort dubai', 'oversize load uae'], ARRAY['WhatsApp', 'Instagram']),
    ('ZA', 'en/af', 'Pilot Vehicle', ARRAY['abnormal load escort', 'lead vehicle'], ARRAY['abnormal load escort south africa', 'pilot car johannesburg'], ARRAY['WhatsApp', 'Facebook']),
    ('NZ', 'en', 'Pilot Vehicle', ARRAY['warning vehicle', 'over-dimension escort'], ARRAY['pilot vehicle nz', 'overdimension load escort'], ARRAY['Facebook', 'LinkedIn']),
    ('SA', 'ar', 'مركبة مرافقة', ARRAY['سيارة القيادة'], ARRAY['نقل حمولات كبيرة السعودية'], ARRAY['WhatsApp', 'Snapchat']),
    ('JP', 'ja', '特殊車両誘導車', ARRAY['先導車', '誘導車'], ARRAY['特殊車両 誘導 サービス'], ARRAY['LINE', 'Twitter']),
    ('NL', 'nl', 'Begeleidingsvoertuig', ARRAY['exceptioneel transport begeleiding'], ARRAY['zwaar transport begeleiding nederland'], ARRAY['WhatsApp', 'LinkedIn'])
ON CONFLICT DO NOTHING;

-- 6. SEED COMPLIANCE RULES FOR US (Baseline)
INSERT INTO public.country_compliance_rules (country_code, rule_type, description, threshold_details)
VALUES
    ('US', 'escort_requirement', 'Single pilot car required for loads exceeding 12ft width', '{"width_ft": 12, "escorts": 1}'),
    ('US', 'escort_requirement', 'Front and rear escort required for loads exceeding 14ft width', '{"width_ft": 14, "escorts": 2}'),
    ('US', 'escort_requirement', 'Police escort required for loads exceeding 16ft width in most states', '{"width_ft": 16, "escorts": 2, "police": true}'),
    ('US', 'permit_rule', 'Single-trip oversize permit required for loads exceeding 8.5ft width', '{"width_ft": 8.5}'),
    ('US', 'permit_rule', 'Superload permit required for loads exceeding 200,000 lbs or 16ft width', '{"weight_lbs": 200000, "width_ft": 16}'),
    ('US', 'insurance_rule', 'Minimum $1M liability insurance for escort vehicles in most states', '{"min_coverage_usd": 1000000}'),
    ('AU', 'escort_requirement', 'Class 1 pilot vehicle for loads 3.5m-5.0m wide', '{"width_m": 3.5, "class": 1}'),
    ('AU', 'escort_requirement', 'Class 2 pilot + police for loads exceeding 5.0m wide', '{"width_m": 5.0, "class": 2, "police": true}'),
    ('GB', 'escort_requirement', 'Abnormal load notification required for loads exceeding 3.0m width', '{"width_m": 3.0}'),
    ('GB', 'escort_requirement', 'Police notification required for loads exceeding 5.0m width', '{"width_m": 5.0, "police": true}'),
    ('DE', 'escort_requirement', 'BF3 escort required for loads exceeding 3.0m width', '{"width_m": 3.0, "bf_class": 3}'),
    ('DE', 'escort_requirement', 'BF4 escort + police required for loads exceeding 3.5m width', '{"width_m": 3.5, "bf_class": 4, "police": true}')
ON CONFLICT DO NOTHING;

-- 7. RLS POLICIES
ALTER TABLE public.country_regulatory_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_language_culture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_regulatory_sources" ON public.country_regulatory_sources FOR SELECT USING (true);
CREATE POLICY "public_read_compliance_rules" ON public.country_compliance_rules FOR SELECT USING (true);
CREATE POLICY "public_read_language_culture" ON public.country_language_culture FOR SELECT USING (true);

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_regulatory_country ON public.country_regulatory_sources(country_code);
CREATE INDEX IF NOT EXISTS idx_compliance_country ON public.country_compliance_rules(country_code);
CREATE INDEX IF NOT EXISTS idx_compliance_type ON public.country_compliance_rules(rule_type);
