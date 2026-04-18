-- ═══════════════════════════════════════════════════════════════════════
-- HAUL COMMAND — Global SEO Tools Matrix (120-Country Expansion)
-- Creates the database-driven tool registry that powers localized
-- interactive calculators across all 5 tiers.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Core tool registry — each row is one localized SEO tool page
CREATE TABLE IF NOT EXISTS public.hc_seo_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES public.hc_countries(iso2) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN (
    'permit_checker',
    'axle_weight_calculator',
    'escort_requirement_checker',
    'bridge_clearance_calculator',
    'route_complexity_scorer',
    'cost_estimator',
    'police_escort_mandate',
    'port_clearance_estimator',
    'cross_border_customs',
    'emission_zone_checker',
    'road_train_configurator',
    'spmt_weight_distributor'
  )),
  local_seo_slug TEXT NOT NULL,          -- e.g., 'esdal-abnormal-load-calculator'
  h1_title TEXT NOT NULL,                -- e.g., 'UK Abnormal Load Notification Calculator'
  meta_description TEXT,
  unit_system TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('imperial', 'metric')),
  currency_code TEXT NOT NULL DEFAULT 'USD',
  regulatory_body TEXT,                  -- e.g., 'NHVR', 'ESDAL', 'ANTT', 'FMCSA'
  regulatory_variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: { "max_width_m": 2.5, "escort_trigger_width_m": 3.5, "max_gvw_kg": 44000 }
  search_volume_est INT DEFAULT 0,
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C', 'D', 'E')),
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(country_code, tool_type)
);

ALTER TABLE public.hc_seo_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read seo_tools" ON public.hc_seo_tools FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_tools_country ON public.hc_seo_tools(country_code);
CREATE INDEX IF NOT EXISTS idx_seo_tools_type ON public.hc_seo_tools(tool_type);
CREATE INDEX IF NOT EXISTS idx_seo_tools_slug ON public.hc_seo_tools(local_seo_slug);
CREATE INDEX IF NOT EXISTS idx_seo_tools_tier ON public.hc_seo_tools(tier);
CREATE INDEX IF NOT EXISTS idx_seo_tools_live ON public.hc_seo_tools(is_live) WHERE is_live = true;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. TIER A (Gold) — 10 countries, full tool suites
-- ═══════════════════════════════════════════════════════════════════════

-- United States
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('US', 'permit_checker', 'us-oversize-permit-checker', 'US Oversize/Overweight Permit Complexity Checker', 'imperial', 'USD', 'FMCSA / State DOTs', 'A', true, '{"max_width_in": 102, "max_height_in": 162, "max_gvw_lbs": 80000, "escort_trigger_width_in": 120, "dual_escort_trigger_width_in": 144, "police_threshold_width_in": 160}'::jsonb),
('US', 'axle_weight_calculator', 'us-axle-weight-calculator', 'US Federal Bridge Formula Calculator', 'imperial', 'USD', 'FHWA', 'A', true, '{"bridge_formula": "W = 500 * (LN / (N-1) + 12N + 36)", "max_single_axle_lbs": 20000, "max_tandem_axle_lbs": 34000}'::jsonb),
('US', 'escort_requirement_checker', 'us-pilot-car-requirement-checker', 'US Pilot Car / Escort Vehicle Requirements by State', 'imperial', 'USD', 'State DOTs', 'A', true, '{"cert_required": true, "reciprocity_states": 23, "non_reciprocity_states": 12}'::jsonb),
('US', 'bridge_clearance_calculator', 'us-bridge-clearance-checker', 'US Bridge & Overhead Clearance Route Checker', 'imperial', 'USD', 'FHWA / NBI', 'A', true, '{"nbi_database": true, "min_clearance_ft": 14}'::jsonb),
('US', 'cost_estimator', 'us-heavy-haul-cost-estimator', 'US Heavy Haul Transport Cost Estimator', 'imperial', 'USD', 'FMCSA', 'A', true, '{"base_rate_per_mile": 3.50, "escort_rate_per_mile": 1.75, "permit_fee_range_usd": [50, 1200]}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- Canada
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('CA', 'permit_checker', 'ca-oversize-permit-checker', 'Canadian Oversize Load Permit Checker by Province', 'metric', 'CAD', 'Provincial MOTs', 'A', true, '{"max_width_m": 2.6, "max_height_m": 4.15, "max_gvw_kg": 63500, "escort_trigger_width_m": 3.2}'::jsonb),
('CA', 'axle_weight_calculator', 'ca-axle-weight-calculator', 'Canadian Axle Weight & Configuration Calculator', 'metric', 'CAD', 'Transport Canada', 'A', true, '{"max_single_axle_kg": 9100, "max_tandem_axle_kg": 17000}'::jsonb),
('CA', 'escort_requirement_checker', 'ca-pilot-vehicle-requirement-checker', 'Canadian Pilot Vehicle Requirements by Province', 'metric', 'CAD', 'Provincial MOTs', 'A', true, '{"term": "Pilot Vehicle", "cert_required": true}'::jsonb),
('CA', 'cost_estimator', 'ca-heavy-haul-cost-estimator', 'Canadian Heavy Haul Transport Cost Estimator', 'metric', 'CAD', 'Transport Canada', 'A', true, '{"base_rate_per_km": 4.20, "escort_rate_per_km": 2.10}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- Australia
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('AU', 'permit_checker', 'au-osom-permit-checker', 'Australian OSOM Vehicle Permit Checker', 'metric', 'AUD', 'NHVR', 'A', true, '{"max_width_m": 2.5, "max_height_m": 4.3, "max_gvm_kg": 42500, "escort_trigger_width_m": 3.5, "police_trigger_width_m": 5.0}'::jsonb),
('AU', 'escort_requirement_checker', 'au-pilot-vehicle-requirement-checker', 'Australian Pilot Vehicle Requirements by State', 'metric', 'AUD', 'NHVR', 'A', true, '{"term": "Pilot Vehicle", "levels": ["Warning", "Lead", "Rear"], "cert_name": "NHVR Pilot Vehicle Driver Accreditation"}'::jsonb),
('AU', 'road_train_configurator', 'au-road-train-route-configurator', 'Australian Road Train Route & Configuration Tool', 'metric', 'AUD', 'NHVR', 'A', true, '{"max_type_1_length_m": 36.5, "max_type_2_length_m": 53.5, "pbs_levels": [1,2,3,4]}'::jsonb),
('AU', 'bridge_clearance_calculator', 'au-bridge-height-clearance-checker', 'Australian Bridge & Overhead Height Clearance Checker', 'metric', 'AUD', 'NHVR / State Roads', 'A', true, '{"min_clearance_m": 4.3}'::jsonb),
('AU', 'cost_estimator', 'au-heavy-haulage-cost-estimator', 'Australian Heavy Haulage Cost Estimator', 'metric', 'AUD', 'NHVR', 'A', true, '{"base_rate_per_km": 5.50, "pilot_rate_per_km": 2.80}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- United Kingdom
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('GB', 'permit_checker', 'uk-abnormal-load-notification-checker', 'UK Abnormal Load ESDAL Notification Checker', 'metric', 'GBP', 'ESDAL / Highways England', 'A', true, '{"max_width_m": 2.9, "max_height_m": 4.95, "max_gvw_kg": 44000, "notification_trigger_width_m": 3.0, "police_trigger_width_m": 5.0, "notification_days_required": 2}'::jsonb),
('GB', 'escort_requirement_checker', 'uk-abnormal-load-escort-checker', 'UK Abnormal Load Escort Vehicle Requirements', 'metric', 'GBP', 'ESDAL', 'A', true, '{"term": "Escort Vehicle", "cert_name": "ESDAL Attendant Certification", "police_notation": "required above 5m width or 80t"}'::jsonb),
('GB', 'bridge_clearance_calculator', 'uk-bridge-strike-prevention-checker', 'UK Bridge Strike Prevention Height Checker', 'metric', 'GBP', 'Network Rail / HA', 'A', true, '{"min_clearance_m": 5.03, "network_rail_alerts": true}'::jsonb),
('GB', 'cost_estimator', 'uk-abnormal-load-transport-cost-estimator', 'UK Abnormal Load Transport Cost Estimator', 'metric', 'GBP', 'DVSA', 'A', true, '{"base_rate_per_mile": 4.80, "escort_rate_per_mile": 2.40}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- New Zealand
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('NZ', 'permit_checker', 'nz-overweight-permit-checker', 'New Zealand Overweight Vehicle Permit Checker', 'metric', 'NZD', 'Waka Kotahi NZTA', 'A', true, '{"max_width_m": 2.5, "max_height_m": 4.25, "max_gvw_kg": 44000, "escort_trigger_width_m": 3.1}'::jsonb),
('NZ', 'escort_requirement_checker', 'nz-pilot-vehicle-requirement-checker', 'New Zealand Pilot Vehicle Requirements', 'metric', 'NZD', 'Waka Kotahi NZTA', 'A', true, '{"term": "Pilot Vehicle", "cert_required": true}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- South Africa
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('ZA', 'permit_checker', 'za-abnormal-load-permit-checker', 'South African Abnormal Load Permit Checker', 'metric', 'ZAR', 'CBRTA / SANRAL', 'A', true, '{"max_width_m": 2.5, "max_height_m": 4.3, "max_gvw_kg": 56000, "escort_trigger_width_m": 3.5, "police_trigger_width_m": 4.5}'::jsonb),
('ZA', 'escort_requirement_checker', 'za-escort-vehicle-requirement-checker', 'South African Escort Vehicle Requirements', 'metric', 'ZAR', 'CBRTA', 'A', true, '{"term": "Escort Vehicle", "categories": ["Yellow Escort", "Traffic Accommodation"]}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- Germany
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('DE', 'permit_checker', 'de-schwertransport-genehmigung-checker', 'German Schwertransport Permit Checker', 'metric', 'EUR', 'BASt / Straßenverkehrsämter', 'A', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000, "escort_trigger_width_m": 3.0, "bf3_trigger_width_m": 3.5, "police_trigger_width_m": 4.4}'::jsonb),
('DE', 'escort_requirement_checker', 'de-begleitfahrzeug-anforderungen', 'German BF3 Begleitfahrzeug Requirements', 'metric', 'EUR', 'BASt', 'A', true, '{"term": "Begleitfahrzeug (BF3)", "cert_name": "BF3-Sachkundenachweis", "police_notation": "Polizeibegleitung required > 4.4m width"}'::jsonb),
('DE', 'emission_zone_checker', 'de-umweltzone-schwertransport-checker', 'German Umweltzone (LEZ) Heavy Transport Checker', 'metric', 'EUR', 'Umweltbundesamt', 'A', true, '{"zones_count": 58, "plakette_required": "green", "fine_eur": 80}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- Netherlands
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('NL', 'permit_checker', 'nl-exceptioneel-transport-checker', 'Dutch Exceptioneel Transport Permit Checker', 'metric', 'EUR', 'RDW / Rijkswaterstaat', 'A', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 50000, "escort_trigger_width_m": 3.0}'::jsonb),
('NL', 'escort_requirement_checker', 'nl-transportbegeleiding-checker', 'Dutch Transportbegeleiding (Transport Escort) Checker', 'metric', 'EUR', 'RDW', 'A', true, '{"term": "Transportbegeleider", "cert_name": "TBV Certificering"}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- UAE
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('AE', 'permit_checker', 'ae-abnormal-load-permit-checker', 'UAE Abnormal Load Permit Checker', 'metric', 'AED', 'RTA / ITC', 'A', true, '{"max_width_m": 2.5, "max_height_m": 4.5, "max_gvw_kg": 65000, "escort_trigger_width_m": 3.5}'::jsonb),
('AE', 'spmt_weight_distributor', 'ae-spmt-module-weight-calculator', 'UAE SPMT Module Weight Distribution Calculator', 'metric', 'AED', 'ADNOC / RTA', 'A', true, '{"max_axle_load_kg": 12000, "module_axle_lines": [4, 6, 8, 12], "typical_load_range_tonnes": [100, 5000]}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- Brazil
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('BR', 'permit_checker', 'br-aet-cargas-especiais-checker', 'Brazilian AET Special Cargo Permit Checker', 'metric', 'BRL', 'ANTT / DNIT', 'A', true, '{"max_width_m": 2.6, "max_height_m": 4.4, "max_pbt_kg": 57000, "escort_trigger_width_m": 3.2, "term": "Batedor"}'::jsonb),
('BR', 'axle_weight_calculator', 'br-peso-por-eixo-calculadora', 'Brazilian Peso por Eixo (Axle Weight) Calculator', 'metric', 'BRL', 'ANTT', 'A', true, '{"max_single_axle_kg": 10000, "max_tandem_axle_kg": 17000, "max_tridem_axle_kg": 25500}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. TIER B (Blue) — 18 countries, core tool suites
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('IE', 'permit_checker', 'ie-abnormal-load-permit-checker', 'Ireland Abnormal Load Permit Checker', 'metric', 'EUR', 'TII / An Garda', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.65, "max_gvw_kg": 44000, "escort_trigger_width_m": 3.0}'::jsonb),
('SE', 'permit_checker', 'se-tungtransport-tillstand-checker', 'Swedish Tungtransport Permit Checker', 'metric', 'SEK', 'Trafikverket', 'B', true, '{"max_width_m": 2.6, "max_height_m": 4.5, "max_gvw_kg": 64000, "escort_trigger_width_m": 3.1}'::jsonb),
('NO', 'permit_checker', 'no-spesialtransport-checker', 'Norwegian Spesialtransport Permit Checker', 'metric', 'NOK', 'Statens vegvesen', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.5, "max_gvw_kg": 50000}'::jsonb),
('DK', 'permit_checker', 'dk-blokvogn-tilladelse-checker', 'Danish Blokvogn Permit Checker', 'metric', 'DKK', 'Vejdirektoratet', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.1, "max_gvw_kg": 48000}'::jsonb),
('FI', 'permit_checker', 'fi-erikoiskuljetus-checker', 'Finnish Erikoiskuljetus (Special Transport) Checker', 'metric', 'EUR', 'Traficom', 'B', true, '{"max_width_m": 2.6, "max_height_m": 4.4, "max_gvw_kg": 76000}'::jsonb),
('BE', 'permit_checker', 'be-uitzonderlijk-vervoer-checker', 'Belgian Uitzonderlijk Vervoer Permit Checker', 'metric', 'EUR', 'FOD Mobiliteit', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 44000}'::jsonb),
('AT', 'permit_checker', 'at-sondertransport-checker', 'Austrian Sondertransport Permit Checker', 'metric', 'EUR', 'ASFINAG', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('CH', 'permit_checker', 'ch-ausnahmetransport-checker', 'Swiss Ausnahmetransport Permit Checker', 'metric', 'CHF', 'ASTRA / FEDRO', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('ES', 'permit_checker', 'es-transporte-especial-checker', 'Spanish Transporte Especial Permit Checker', 'metric', 'EUR', 'DGT', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_mma_kg": 40000}'::jsonb),
('FR', 'permit_checker', 'fr-transport-exceptionnel-checker', 'French Transport Exceptionnel Permit Checker', 'metric', 'EUR', 'DREAL / Préfectures', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000, "categories": ["1ère", "2ème", "3ème"]}'::jsonb),
('IT', 'permit_checker', 'it-trasporto-eccezionale-checker', 'Italian Trasporto Eccezionale Permit Checker', 'metric', 'EUR', 'ANAS / Province', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 44000}'::jsonb),
('PT', 'permit_checker', 'pt-transporte-especial-checker', 'Portuguese Transporte Especial Permit Checker', 'metric', 'EUR', 'IMT', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('SA', 'permit_checker', 'sa-abnormal-load-permit-checker', 'Saudi Arabia Abnormal Load Permit Checker', 'metric', 'SAR', 'TGA / MOT', 'B', true, '{"max_width_m": 2.5, "max_height_m": 4.5, "max_gvw_kg": 65000}'::jsonb),
('QA', 'permit_checker', 'qa-abnormal-load-permit-checker', 'Qatar Abnormal Load Permit Checker', 'metric', 'QAR', 'MOI / Ashghal', 'B', true, '{"max_width_m": 2.5, "max_height_m": 4.5, "max_gvw_kg": 65000}'::jsonb),
('MX', 'permit_checker', 'mx-carga-sobredimensionada-checker', 'Mexican Carga Sobredimensionada Permit Checker', 'metric', 'MXN', 'SCT', 'B', true, '{"max_width_m": 2.6, "max_height_m": 4.25, "max_gvw_kg": 66500}'::jsonb),
('IN', 'permit_checker', 'in-odc-cargo-permit-checker', 'India ODC (Over Dimensional Cargo) Permit Checker', 'metric', 'INR', 'MoRTH / NHAI', 'B', true, '{"max_width_m": 2.6, "max_height_m": 4.75, "max_gvw_kg": 49000}'::jsonb),
('ID', 'permit_checker', 'id-muatan-lebih-permit-checker', 'Indonesian Muatan Lebih (Oversize) Permit Checker', 'metric', 'IDR', 'Kemenhub', 'B', true, '{"max_width_m": 2.5, "max_height_m": 4.2, "max_gvw_kg": 25000}'::jsonb),
('TH', 'permit_checker', 'th-oversize-load-permit-checker', 'Thailand Oversize Load Permit Checker', 'metric', 'THB', 'DLT / Highways Dept', 'B', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 50500}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. TIER C (Silver) — 26 countries, permit checkers
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
('PL', 'permit_checker', 'pl-transport-nienormatywny-checker', 'Polish Transport Nienormatywny Permit Checker', 'metric', 'PLN', 'GDDKiA', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('CZ', 'permit_checker', 'cz-nadmerny-naklad-checker', 'Czech Nadměrný Náklad Permit Checker', 'metric', 'CZK', 'ŘSD ČR', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 48000}'::jsonb),
('SK', 'permit_checker', 'sk-nadrozmerny-naklad-checker', 'Slovak Nadrozmerný Náklad Permit Checker', 'metric', 'EUR', 'SSC', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('HU', 'permit_checker', 'hu-tulmeretes-szallitas-checker', 'Hungarian Túlméretes Szállítás Permit Checker', 'metric', 'HUF', 'NIF', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('SI', 'permit_checker', 'si-izredni-prevoz-checker', 'Slovenian Izredni Prevoz Permit Checker', 'metric', 'EUR', 'DARS', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('EE', 'permit_checker', 'ee-erivedu-checker', 'Estonian Erivedu (Special Transport) Checker', 'metric', 'EUR', 'Transpordiamet', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 44000}'::jsonb),
('LV', 'permit_checker', 'lv-parmerigs-parvadajums-checker', 'Latvian Pārmēŗīgs Pārvadājums Permit Checker', 'metric', 'EUR', 'LVC', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('LT', 'permit_checker', 'lt-negabaritinis-krovinys-checker', 'Lithuanian Negabaritinis Krovinys Permit Checker', 'metric', 'EUR', 'LAKD', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('HR', 'permit_checker', 'hr-izvanredni-prijevoz-checker', 'Croatian Izvanredni Prijevoz Permit Checker', 'metric', 'EUR', 'HAC / Hrvatske ceste', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('RO', 'permit_checker', 'ro-transport-agabaritic-checker', 'Romanian Transport Agabaritic Permit Checker', 'metric', 'RON', 'CNAIR', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('BG', 'permit_checker', 'bg-izvanredni-prevozi-checker', 'Bulgarian Извънредни Превози Permit Checker', 'metric', 'BGN', 'API', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('GR', 'permit_checker', 'gr-ypervares-metafores-checker', 'Greek Υπερβαρείς Μεταφορές Permit Checker', 'metric', 'EUR', 'OASA / Egnatia Odos', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('TR', 'permit_checker', 'tr-gabari-asimi-checker', 'Turkish Gabari Aşımı Permit Checker', 'metric', 'TRY', 'KGM', 'C', true, '{"max_width_m": 2.55, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('KW', 'permit_checker', 'kw-abnormal-load-permit-checker', 'Kuwait Abnormal Load Permit Checker', 'metric', 'KWD', 'MOI / MPW', 'C', true, '{"max_width_m": 2.5, "max_height_m": 4.5}'::jsonb),
('OM', 'permit_checker', 'om-abnormal-load-permit-checker', 'Oman Abnormal Load Permit Checker', 'metric', 'OMR', 'ROP / MOT', 'C', true, '{"max_width_m": 2.5, "max_height_m": 4.5}'::jsonb),
('BH', 'permit_checker', 'bh-abnormal-load-permit-checker', 'Bahrain Abnormal Load Permit Checker', 'metric', 'BHD', 'MOW / MOI', 'C', true, '{"max_width_m": 2.5, "max_height_m": 4.5}'::jsonb),
('SG', 'permit_checker', 'sg-oversize-vehicle-permit-checker', 'Singapore Oversize Vehicle Permit Checker', 'metric', 'SGD', 'LTA', 'C', true, '{"max_width_m": 2.5, "max_height_m": 4.5, "max_gvw_kg": 44000}'::jsonb),
('MY', 'permit_checker', 'my-kenderaan-khas-permit-checker', 'Malaysian Kenderaan Khas (Special Vehicle) Checker', 'metric', 'MYR', 'JPJ / JKR', 'C', true, '{"max_width_m": 2.5, "max_height_m": 4.5, "max_gvw_kg": 38000}'::jsonb),
('JP', 'permit_checker', 'jp-tokushu-sharyo-permit-checker', 'Japanese 特殊車両 (Tokushu Sharyō) Permit Checker', 'metric', 'JPY', 'MLIT', 'C', true, '{"max_width_m": 2.5, "max_height_m": 3.8, "max_gvw_kg": 25000}'::jsonb),
('KR', 'permit_checker', 'kr-gwadaek-hwamul-permit-checker', 'Korean 과적화물 (Oversize Cargo) Permit Checker', 'metric', 'KRW', 'MOLIT / KEC', 'C', true, '{"max_width_m": 2.5, "max_height_m": 4.0, "max_gvw_kg": 40000}'::jsonb),
('CL', 'permit_checker', 'cl-carga-sobredimensionada-checker', 'Chilean Carga Sobredimensionada Permit Checker', 'metric', 'CLP', 'MOP / Vialidad', 'C', true, '{"max_width_m": 2.6, "max_height_m": 4.2, "max_gvw_kg": 45000}'::jsonb),
('AR', 'permit_checker', 'ar-carga-excepcional-checker', 'Argentine Carga Excepcional Permit Checker', 'metric', 'ARS', 'DNV / Vialidad Nacional', 'C', true, '{"max_width_m": 2.6, "max_height_m": 4.1, "max_gvw_kg": 45000}'::jsonb),
('CO', 'permit_checker', 'co-carga-extradimensionada-checker', 'Colombian Carga Extradimensionada Permit Checker', 'metric', 'COP', 'INVIAS / ANI', 'C', true, '{"max_width_m": 2.6, "max_height_m": 4.4, "max_gvw_kg": 48000}'::jsonb),
('PE', 'permit_checker', 'pe-carga-especial-checker', 'Peruvian Carga Especial Permit Checker', 'metric', 'PEN', 'MTC / Provías Nacional', 'C', true, '{"max_width_m": 2.6, "max_height_m": 4.3, "max_gvw_kg": 48000}'::jsonb),
('VN', 'permit_checker', 'vn-hang-sieu-truong-checker', 'Vietnamese Hàng Siêu Trường (Oversize Cargo) Checker', 'metric', 'VND', 'DRVN / MOT', 'C', true, '{"max_width_m": 2.5, "max_height_m": 4.2, "max_gvw_kg": 30000}'::jsonb),
('PH', 'permit_checker', 'ph-oversize-load-permit-checker', 'Philippine Oversize Load Permit Checker', 'metric', 'PHP', 'DPWH / LTO', 'C', true, '{"max_width_m": 2.5, "max_height_m": 4.2, "max_gvw_kg": 32000}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. TIERS D & E (Slate + Copper) — permit checkers for all remaining
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_seo_tools (country_code, tool_type, local_seo_slug, h1_title, unit_system, currency_code, regulatory_body, tier, is_live, regulatory_variables) VALUES
-- Tier D (25)
('UY', 'permit_checker', 'uy-carga-excepcional-checker', 'Uruguayan Carga Excepcional Permit Checker', 'metric', 'UYU', 'DNV / MTOP', 'D', false, '{"max_width_m": 2.6, "max_gvw_kg": 45000}'::jsonb),
('PA', 'permit_checker', 'pa-carga-sobredimensionada-checker', 'Panamanian Carga Sobredimensionada Permit Checker', 'metric', 'PAB', 'ATTT', 'D', false, '{"max_width_m": 2.6, "max_gvw_kg": 36000}'::jsonb),
('CR', 'permit_checker', 'cr-carga-especial-checker', 'Costa Rican Carga Especial Permit Checker', 'metric', 'CRC', 'CONAVI', 'D', false, '{"max_width_m": 2.6, "max_gvw_kg": 36000}'::jsonb),
('IL', 'permit_checker', 'il-oversize-transport-permit-checker', 'Israel Oversize Transport Permit Checker', 'metric', 'ILS', 'Natiei / MOT', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 40000}'::jsonb),
('NG', 'permit_checker', 'ng-oversize-load-permit-checker', 'Nigerian Oversize Load Permit Checker', 'metric', 'NGN', 'FRSC / FERMA', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 40000}'::jsonb),
('EG', 'permit_checker', 'eg-abnormal-load-permit-checker', 'Egyptian Abnormal Load Permit Checker', 'metric', 'EGP', 'GARBLT', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 44000}'::jsonb),
('KE', 'permit_checker', 'ke-abnormal-load-permit-checker', 'Kenyan Abnormal Load Permit Checker', 'metric', 'KES', 'KeNHA', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 48000}'::jsonb),
('MA', 'permit_checker', 'ma-transport-exceptionnel-checker', 'Moroccan Transport Exceptionnel Permit Checker', 'metric', 'MAD', 'ADM / DR', 'D', false, '{"max_width_m": 2.55, "max_gvw_kg": 40000}'::jsonb),
('RS', 'permit_checker', 'rs-vanredni-prevoz-checker', 'Serbian Vanredni Prevoz Permit Checker', 'metric', 'RSD', 'PE Putevi Srbije', 'D', false, '{"max_width_m": 2.55, "max_gvw_kg": 40000}'::jsonb),
('UA', 'permit_checker', 'ua-negabaritnyy-vantazh-checker', 'Ukrainian Негабаритний Вантаж Permit Checker', 'metric', 'UAH', 'Ukravtodor', 'D', false, '{"max_width_m": 2.55, "max_gvw_kg": 40000}'::jsonb),
('KZ', 'permit_checker', 'kz-oversize-cargo-permit-checker', 'Kazakhstan Oversize Cargo Permit Checker', 'metric', 'KZT', 'KazAvtoZhol', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 44000}'::jsonb),
('TW', 'permit_checker', 'tw-oversize-load-permit-checker', 'Taiwan Oversize Load Permit Checker', 'metric', 'TWD', 'MOTC / DGH', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 35000}'::jsonb),
('PK', 'permit_checker', 'pk-oversize-load-permit-checker', 'Pakistan Oversize Load Permit Checker', 'metric', 'PKR', 'NHA', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 40000}'::jsonb),
('BD', 'permit_checker', 'bd-oversize-load-permit-checker', 'Bangladesh Oversize Load Permit Checker', 'metric', 'BDT', 'RHD / BRTA', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 32000}'::jsonb),
('MN', 'permit_checker', 'mn-oversize-load-permit-checker', 'Mongolian Oversize Load Permit Checker', 'metric', 'MNT', 'MRTD', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 38000}'::jsonb),
('TT', 'permit_checker', 'tt-oversize-load-permit-checker', 'Trinidad & Tobago Oversize Load Permit Checker', 'metric', 'TTD', 'MOWT', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 32000}'::jsonb),
('JO', 'permit_checker', 'jo-oversize-load-permit-checker', 'Jordanian Oversize Load Permit Checker', 'metric', 'JOD', 'MPWH', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 44000}'::jsonb),
('GH', 'permit_checker', 'gh-oversize-load-permit-checker', 'Ghanaian Oversize Load Permit Checker', 'metric', 'GHS', 'GHA / DVLA', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 40000}'::jsonb),
('TZ', 'permit_checker', 'tz-oversize-load-permit-checker', 'Tanzanian Oversize Load Permit Checker', 'metric', 'TZS', 'TANROADS', 'D', false, '{"max_width_m": 2.5, "max_gvw_kg": 48000}'::jsonb),
('GE', 'permit_checker', 'ge-oversize-load-permit-checker', 'Georgian Oversize Load Permit Checker', 'metric', 'GEL', 'Roads Dept', 'D', false, '{"max_width_m": 2.55, "max_gvw_kg": 40000}'::jsonb),
('AZ', 'permit_checker', 'az-oversize-load-permit-checker', 'Azerbaijan Oversize Load Permit Checker', 'metric', 'AZN', 'AzerYolServis', 'D', false, '{"max_width_m": 2.55, "max_gvw_kg": 38000}'::jsonb),
('CY', 'permit_checker', 'cy-oversize-load-permit-checker', 'Cyprus Oversize Load Permit Checker', 'metric', 'EUR', 'PWD / MOT', 'D', false, '{"max_width_m": 2.55, "max_gvw_kg": 40000}'::jsonb),
('IS', 'permit_checker', 'is-oversize-load-permit-checker', 'Icelandic Oversize Load Permit Checker', 'metric', 'ISK', 'Vegagerðin', 'D', false, '{"max_width_m": 2.55, "max_gvw_kg": 40000}'::jsonb),
('LU', 'permit_checker', 'lu-transport-exceptionnel-checker', 'Luxembourg Transport Exceptionnel Permit Checker', 'metric', 'EUR', 'Ponts et Chaussées', 'D', false, '{"max_width_m": 2.55, "max_gvw_kg": 44000}'::jsonb),
('EC', 'permit_checker', 'ec-carga-pesada-checker', 'Ecuadorian Carga Pesada Permit Checker', 'metric', 'USD', 'MTOP / ANT', 'D', false, '{"max_width_m": 2.6, "max_gvw_kg": 42000}'::jsonb),
-- Tier E (41) — all as permit_checker seed
('BO', 'permit_checker', 'bo-carga-especial-checker', 'Bolivian Carga Especial Permit Checker', 'metric', 'BOB', 'ABC', 'E', false, '{"max_width_m": 2.6}'::jsonb),
('PY', 'permit_checker', 'py-carga-excepcional-checker', 'Paraguayan Carga Excepcional Permit Checker', 'metric', 'PYG', 'MOPC', 'E', false, '{"max_width_m": 2.6}'::jsonb),
('GT', 'permit_checker', 'gt-carga-especial-checker', 'Guatemalan Carga Especial Permit Checker', 'metric', 'GTQ', 'DGC', 'E', false, '{"max_width_m": 2.6}'::jsonb),
('DO', 'permit_checker', 'do-carga-sobredimensionada-checker', 'Dominican Carga Sobredimensionada Checker', 'metric', 'DOP', 'MOPC', 'E', false, '{"max_width_m": 2.6}'::jsonb),
('HN', 'permit_checker', 'hn-carga-especial-checker', 'Honduran Carga Especial Permit Checker', 'metric', 'HNL', 'INSEP', 'E', false, '{"max_width_m": 2.6}'::jsonb),
('SV', 'permit_checker', 'sv-carga-especial-checker', 'Salvadoran Carga Especial Permit Checker', 'metric', 'USD', 'MOP', 'E', false, '{"max_width_m": 2.6}'::jsonb),
('NI', 'permit_checker', 'ni-carga-especial-checker', 'Nicaraguan Carga Especial Permit Checker', 'metric', 'NIO', 'MTI', 'E', false, '{"max_width_m": 2.6}'::jsonb),
('JM', 'permit_checker', 'jm-oversize-load-permit-checker', 'Jamaican Oversize Load Permit Checker', 'metric', 'JMD', 'NWA', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('GY', 'permit_checker', 'gy-oversize-load-permit-checker', 'Guyanese Oversize Load Permit Checker', 'metric', 'GYD', 'WSD', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('SR', 'permit_checker', 'sr-oversize-load-permit-checker', 'Surinamese Oversize Load Permit Checker', 'metric', 'SRD', 'MOW', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('BA', 'permit_checker', 'ba-vanredni-prijevoz-checker', 'Bosnian Vanredni Prijevoz Permit Checker', 'metric', 'BAM', 'JP Ceste', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('ME', 'permit_checker', 'me-vanredni-prevoz-checker', 'Montenegrin Vanredni Prevoz Permit Checker', 'metric', 'EUR', 'Monteput', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('MK', 'permit_checker', 'mk-vonreden-prevoz-checker', 'North Macedonian Вонреден Превоз Checker', 'metric', 'MKD', 'JP Makedonski Patishta', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('AL', 'permit_checker', 'al-transport-jashtzakonshëm-checker', 'Albanian Transport Jashtëzakonshëm Checker', 'metric', 'ALL', 'ARRSH', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('MD', 'permit_checker', 'md-transport-agabaritic-checker', 'Moldovan Transport Agabaritic Permit Checker', 'metric', 'MDL', 'ASD', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('IQ', 'permit_checker', 'iq-oversize-load-permit-checker', 'Iraqi Oversize Load Permit Checker', 'metric', 'IQD', 'SCRB', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('NA', 'permit_checker', 'na-oversize-load-permit-checker', 'Namibian Oversize Load Permit Checker', 'metric', 'NAD', 'RA / NaTIS', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('AO', 'permit_checker', 'ao-carga-excepcional-checker', 'Angolan Carga Excepcional Permit Checker', 'metric', 'AOA', 'INEA', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('MZ', 'permit_checker', 'mz-carga-excepcional-checker', 'Mozambican Carga Excepcional Permit Checker', 'metric', 'MZN', 'ANE', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('ET', 'permit_checker', 'et-oversize-load-permit-checker', 'Ethiopian Oversize Load Permit Checker', 'metric', 'ETB', 'ERA', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('CI', 'permit_checker', 'ci-transport-exceptionnel-checker', 'Ivorian Transport Exceptionnel Permit Checker', 'metric', 'XOF', 'AGEROUTE', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('SN', 'permit_checker', 'sn-transport-exceptionnel-checker', 'Senegalese Transport Exceptionnel Permit Checker', 'metric', 'XOF', 'AGEROUTE', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('BW', 'permit_checker', 'bw-oversize-load-permit-checker', 'Botswana Oversize Load Permit Checker', 'metric', 'BWP', 'DRS', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('ZM', 'permit_checker', 'zm-oversize-load-permit-checker', 'Zambian Oversize Load Permit Checker', 'metric', 'ZMW', 'RDA / RTSA', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('UG', 'permit_checker', 'ug-oversize-load-permit-checker', 'Ugandan Oversize Load Permit Checker', 'metric', 'UGX', 'UNRA', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('CM', 'permit_checker', 'cm-transport-exceptionnel-checker', 'Cameroonian Transport Exceptionnel Checker', 'metric', 'XAF', 'MINTP', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('KH', 'permit_checker', 'kh-oversize-load-permit-checker', 'Cambodian Oversize Load Permit Checker', 'metric', 'KHR', 'MPWT', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('LK', 'permit_checker', 'lk-oversize-load-permit-checker', 'Sri Lankan Oversize Load Permit Checker', 'metric', 'LKR', 'RDA', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('UZ', 'permit_checker', 'uz-oversize-load-permit-checker', 'Uzbekistan Oversize Load Permit Checker', 'metric', 'UZS', 'UzAvtoyol', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('LA', 'permit_checker', 'la-oversize-load-permit-checker', 'Laotian Oversize Load Permit Checker', 'metric', 'LAK', 'DPWT', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('NP', 'permit_checker', 'np-oversize-load-permit-checker', 'Nepali Oversize Load Permit Checker', 'metric', 'NPR', 'DOR', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('DZ', 'permit_checker', 'dz-transport-exceptionnel-checker', 'Algerian Transport Exceptionnel Permit Checker', 'metric', 'DZD', 'DTP', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('TN', 'permit_checker', 'tn-transport-exceptionnel-checker', 'Tunisian Transport Exceptionnel Permit Checker', 'metric', 'TND', 'DGPC', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('MT', 'permit_checker', 'mt-oversize-load-permit-checker', 'Maltese Oversize Load Permit Checker', 'metric', 'EUR', 'TM / Infrastructure Malta', 'E', false, '{"max_width_m": 2.55}'::jsonb),
('BN', 'permit_checker', 'bn-oversize-load-permit-checker', 'Bruneian Oversize Load Permit Checker', 'metric', 'BND', 'MOD / PWD', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('RW', 'permit_checker', 'rw-oversize-load-permit-checker', 'Rwandan Oversize Load Permit Checker', 'metric', 'RWF', 'RTDA', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('MG', 'permit_checker', 'mg-transport-exceptionnel-checker', 'Malagasy Transport Exceptionnel Permit Checker', 'metric', 'MGA', 'ARM', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('PG', 'permit_checker', 'pg-oversize-load-permit-checker', 'Papua New Guinean Oversize Load Permit Checker', 'metric', 'PGK', 'DOW / NRA', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('TM', 'permit_checker', 'tm-oversize-load-permit-checker', 'Turkmen Oversize Load Permit Checker', 'metric', 'TMT', 'Turkmenawtoyollary', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('KG', 'permit_checker', 'kg-oversize-load-permit-checker', 'Kyrgyz Oversize Load Permit Checker', 'metric', 'KGS', 'MOTC', 'E', false, '{"max_width_m": 2.5}'::jsonb),
('MW', 'permit_checker', 'mw-oversize-load-permit-checker', 'Malawian Oversize Load Permit Checker', 'metric', 'MWK', 'RA', 'E', false, '{"max_width_m": 2.5}'::jsonb)
ON CONFLICT (country_code, tool_type) DO NOTHING;
