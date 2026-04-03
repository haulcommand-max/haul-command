-- supabase/migrations/20260404_country_readiness_engine.sql
-- Autonomous Country Expansion Engine
-- States: dormant → prepared → seed → live
-- Scoring: supply, demand, law, trust, monetization, cross-border, localization

-- ═══════════════════════════════════════════════════════
-- 1. COUNTRY READINESS TABLE
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hc_country_readiness (
    country_code TEXT PRIMARY KEY,
    country_name TEXT NOT NULL,
    -- State machine
    market_state TEXT NOT NULL DEFAULT 'dormant'
        CHECK (market_state IN ('dormant', 'prepared', 'seed', 'live')),
    previous_state TEXT,
    state_changed_at TIMESTAMPTZ DEFAULT now(),
    -- Scoring components (0.0 – 1.0)
    supply_depth_score NUMERIC(5,4) DEFAULT 0,
    demand_pull_score NUMERIC(5,4) DEFAULT 0,
    claimable_surface_density_score NUMERIC(5,4) DEFAULT 0,
    law_readiness_score NUMERIC(5,4) DEFAULT 0,
    trust_signal_density_score NUMERIC(5,4) DEFAULT 0,
    monetization_readiness_score NUMERIC(5,4) DEFAULT 0,
    cross_border_leverage_score NUMERIC(5,4) DEFAULT 0,
    localization_strength_score NUMERIC(5,4) DEFAULT 0,
    -- Computed weighted total
    total_score NUMERIC(5,4) GENERATED ALWAYS AS (
        0.24 * supply_depth_score
        + 0.20 * demand_pull_score
        + 0.14 * claimable_surface_density_score
        + 0.14 * law_readiness_score
        + 0.08 * trust_signal_density_score
        + 0.08 * monetization_readiness_score
        + 0.06 * cross_border_leverage_score
        + 0.06 * localization_strength_score
    ) STORED,
    -- Gates (boolean hard requirements for promotion)
    law_pack_gate BOOLEAN DEFAULT false,
    supply_gate BOOLEAN DEFAULT false,
    demand_gate BOOLEAN DEFAULT false,
    localization_gate BOOLEAN DEFAULT false,
    support_gate BOOLEAN DEFAULT false,
    payments_gate BOOLEAN DEFAULT false,
    trust_gate BOOLEAN DEFAULT false,
    -- Metadata
    currency_code TEXT DEFAULT 'USD',
    timezone TEXT,
    language_primary TEXT DEFAULT 'en',
    measurement_system TEXT DEFAULT 'imperial' CHECK (measurement_system IN ('imperial', 'metric')),
    -- Packs / readiness artifacts
    legal_source_pack JSONB DEFAULT '{}',
    terminology_pack JSONB DEFAULT '{}',
    role_map JSONB DEFAULT '{}',
    first_metros JSONB DEFAULT '[]',
    first_corridors JSONB DEFAULT '[]',
    cross_border_adjacency JSONB DEFAULT '[]',
    entity_hunt_queue JSONB DEFAULT '[]',
    -- Autonomous future tags
    autonomous_freight_score NUMERIC(3,2) DEFAULT 0,
    av_regulatory_maturity TEXT DEFAULT 'none' CHECK (av_regulatory_maturity IN ('none', 'exploring', 'framework', 'active', 'commercial')),
    -- Audit
    last_scored_at TIMESTAMPTZ,
    last_promotion_reason TEXT,
    last_demotion_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast sorting by score
CREATE INDEX IF NOT EXISTS idx_country_readiness_score ON hc_country_readiness (total_score DESC);
CREATE INDEX IF NOT EXISTS idx_country_readiness_state ON hc_country_readiness (market_state);

-- ═══════════════════════════════════════════════════════
-- 2. STATE TRANSITION LOG
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hc_country_state_log (
    id BIGSERIAL PRIMARY KEY,
    country_code TEXT NOT NULL REFERENCES hc_country_readiness(country_code),
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    reason TEXT,
    score_snapshot JSONB,
    triggered_by TEXT DEFAULT 'system', -- 'system' | 'manual' | 'cron'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 3. CLAIM PRESSURE TIMER TABLE
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hc_claim_pressure_state (
    entity_id TEXT PRIMARY KEY,
    country_code TEXT NOT NULL,
    -- Aging
    shell_published_at TIMESTAMPTZ DEFAULT now(),
    shell_age_days INTEGER GENERATED ALWAYS AS (
        EXTRACT(DAY FROM (now() - shell_published_at))
    ) STORED,
    -- Pressure stage (0–4)
    pressure_stage INTEGER DEFAULT 0 CHECK (pressure_stage BETWEEN 0 AND 4),
    -- Signals
    page_indexed BOOLEAN DEFAULT false,
    organic_impressions INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    nearby_competitor_claims INTEGER DEFAULT 0,
    saved_search_touches INTEGER DEFAULT 0,
    demand_activity_touches INTEGER DEFAULT 0,
    -- Claim state
    claim_status TEXT DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'nudged', 'invited', 'claimed', 'verified')),
    claimed_at TIMESTAMPTZ,
    last_nudge_at TIMESTAMPTZ,
    nudge_count INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_pressure_stage ON hc_claim_pressure_state (pressure_stage, claim_status);
CREATE INDEX IF NOT EXISTS idx_claim_pressure_country ON hc_claim_pressure_state (country_code);

-- ═══════════════════════════════════════════════════════
-- 4. PROMOTION FUNCTION
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION promote_country(
    p_country_code TEXT,
    p_target_state TEXT,
    p_reason TEXT DEFAULT 'autonomous promotion'
) RETURNS void AS $$
DECLARE
    v_current_state TEXT;
BEGIN
    SELECT market_state INTO v_current_state
    FROM hc_country_readiness
    WHERE country_code = p_country_code;

    IF v_current_state IS NULL THEN
        RAISE EXCEPTION 'Country % not found', p_country_code;
    END IF;

    -- Log transition
    INSERT INTO hc_country_state_log (country_code, from_state, to_state, reason, score_snapshot)
    SELECT country_code, market_state, p_target_state, p_reason,
           jsonb_build_object(
               'supply', supply_depth_score,
               'demand', demand_pull_score,
               'law', law_readiness_score,
               'total', total_score
           )
    FROM hc_country_readiness
    WHERE country_code = p_country_code;

    -- Update state
    UPDATE hc_country_readiness
    SET previous_state = market_state,
        market_state = p_target_state,
        state_changed_at = now(),
        last_promotion_reason = p_reason,
        updated_at = now()
    WHERE country_code = p_country_code;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════
-- 5. SEED ALL 120 COUNTRIES AS DORMANT
-- ═══════════════════════════════════════════════════════
INSERT INTO hc_country_readiness (country_code, country_name, market_state, currency_code, measurement_system, language_primary) VALUES
    -- Wave 1: Launch countries → 'live'
    ('US', 'United States', 'live', 'USD', 'imperial', 'en'),
    ('CA', 'Canada', 'seed', 'CAD', 'metric', 'en'),
    ('AU', 'Australia', 'seed', 'AUD', 'metric', 'en'),
    -- Tier A Gold → 'prepared'
    ('GB', 'United Kingdom', 'prepared', 'GBP', 'imperial', 'en'),
    ('NZ', 'New Zealand', 'prepared', 'NZD', 'metric', 'en'),
    ('ZA', 'South Africa', 'prepared', 'ZAR', 'metric', 'en'),
    ('DE', 'Germany', 'prepared', 'EUR', 'metric', 'de'),
    ('NL', 'Netherlands', 'prepared', 'EUR', 'metric', 'nl'),
    ('AE', 'United Arab Emirates', 'prepared', 'AED', 'metric', 'ar'),
    ('BR', 'Brazil', 'prepared', 'BRL', 'metric', 'pt'),
    -- Tier B Blue
    ('IE', 'Ireland', 'dormant', 'EUR', 'metric', 'en'),
    ('SE', 'Sweden', 'dormant', 'SEK', 'metric', 'sv'),
    ('NO', 'Norway', 'dormant', 'NOK', 'metric', 'nb'),
    ('DK', 'Denmark', 'dormant', 'DKK', 'metric', 'da'),
    ('FI', 'Finland', 'dormant', 'EUR', 'metric', 'fi'),
    ('BE', 'Belgium', 'dormant', 'EUR', 'metric', 'nl'),
    ('AT', 'Austria', 'dormant', 'EUR', 'metric', 'de'),
    ('CH', 'Switzerland', 'dormant', 'CHF', 'metric', 'de'),
    ('ES', 'Spain', 'dormant', 'EUR', 'metric', 'es'),
    ('FR', 'France', 'dormant', 'EUR', 'metric', 'fr'),
    ('IT', 'Italy', 'dormant', 'EUR', 'metric', 'it'),
    ('PT', 'Portugal', 'dormant', 'EUR', 'metric', 'pt'),
    ('SA', 'Saudi Arabia', 'dormant', 'SAR', 'metric', 'ar'),
    ('QA', 'Qatar', 'dormant', 'QAR', 'metric', 'ar'),
    ('MX', 'Mexico', 'dormant', 'MXN', 'metric', 'es'),
    -- Tier C Silver
    ('PL', 'Poland', 'dormant', 'PLN', 'metric', 'pl'),
    ('CZ', 'Czech Republic', 'dormant', 'CZK', 'metric', 'cs'),
    ('SK', 'Slovakia', 'dormant', 'EUR', 'metric', 'sk'),
    ('HU', 'Hungary', 'dormant', 'HUF', 'metric', 'hu'),
    ('SI', 'Slovenia', 'dormant', 'EUR', 'metric', 'sl'),
    ('EE', 'Estonia', 'dormant', 'EUR', 'metric', 'et'),
    ('LV', 'Latvia', 'dormant', 'EUR', 'metric', 'lv'),
    ('LT', 'Lithuania', 'dormant', 'EUR', 'metric', 'lt'),
    ('HR', 'Croatia', 'dormant', 'EUR', 'metric', 'hr'),
    ('RO', 'Romania', 'dormant', 'RON', 'metric', 'ro'),
    ('BG', 'Bulgaria', 'dormant', 'BGN', 'metric', 'bg'),
    ('GR', 'Greece', 'dormant', 'EUR', 'metric', 'el'),
    ('TR', 'Turkey', 'dormant', 'TRY', 'metric', 'tr'),
    ('KW', 'Kuwait', 'dormant', 'KWD', 'metric', 'ar'),
    ('OM', 'Oman', 'dormant', 'OMR', 'metric', 'ar'),
    ('BH', 'Bahrain', 'dormant', 'BHD', 'metric', 'ar'),
    ('SG', 'Singapore', 'dormant', 'SGD', 'metric', 'en'),
    ('MY', 'Malaysia', 'dormant', 'MYR', 'metric', 'ms'),
    ('JP', 'Japan', 'dormant', 'JPY', 'metric', 'ja'),
    ('KR', 'South Korea', 'dormant', 'KRW', 'metric', 'ko'),
    ('CL', 'Chile', 'dormant', 'CLP', 'metric', 'es'),
    ('AR', 'Argentina', 'dormant', 'ARS', 'metric', 'es'),
    ('CO', 'Colombia', 'dormant', 'COP', 'metric', 'es'),
    ('PE', 'Peru', 'dormant', 'PEN', 'metric', 'es'),
    ('IN', 'India', 'dormant', 'INR', 'metric', 'hi'),
    ('ID', 'Indonesia', 'dormant', 'IDR', 'metric', 'id'),
    ('TH', 'Thailand', 'dormant', 'THB', 'metric', 'th'),
    ('VN', 'Vietnam', 'dormant', 'VND', 'metric', 'vi'),
    ('PH', 'Philippines', 'dormant', 'PHP', 'metric', 'en'),
    -- Tier D Slate
    ('UY', 'Uruguay', 'dormant', 'UYU', 'metric', 'es'),
    ('PA', 'Panama', 'dormant', 'USD', 'metric', 'es'),
    ('CR', 'Costa Rica', 'dormant', 'CRC', 'metric', 'es'),
    ('IL', 'Israel', 'dormant', 'ILS', 'metric', 'he'),
    ('NG', 'Nigeria', 'dormant', 'NGN', 'metric', 'en'),
    ('EG', 'Egypt', 'dormant', 'EGP', 'metric', 'ar'),
    ('KE', 'Kenya', 'dormant', 'KES', 'metric', 'sw'),
    ('MA', 'Morocco', 'dormant', 'MAD', 'metric', 'fr'),
    ('RS', 'Serbia', 'dormant', 'RSD', 'metric', 'sr'),
    ('UA', 'Ukraine', 'dormant', 'UAH', 'metric', 'uk'),
    ('KZ', 'Kazakhstan', 'dormant', 'KZT', 'metric', 'kk'),
    ('TW', 'Taiwan', 'dormant', 'TWD', 'metric', 'zh'),
    ('PK', 'Pakistan', 'dormant', 'PKR', 'metric', 'ur'),
    ('BD', 'Bangladesh', 'dormant', 'BDT', 'metric', 'bn'),
    -- Tier E Copper
    ('BO', 'Bolivia', 'dormant', 'BOB', 'metric', 'es'),
    ('GT', 'Guatemala', 'dormant', 'GTQ', 'metric', 'es'),
    ('AL', 'Albania', 'dormant', 'ALL', 'metric', 'sq'),
    ('IQ', 'Iraq', 'dormant', 'IQD', 'metric', 'ar'),
    ('ET', 'Ethiopia', 'dormant', 'ETB', 'metric', 'am'),
    ('GH', 'Ghana', 'dormant', 'GHS', 'metric', 'en'),
    ('TZ', 'Tanzania', 'dormant', 'TZS', 'metric', 'sw'),
    ('MN', 'Mongolia', 'dormant', 'MNT', 'metric', 'mn'),
    ('GE', 'Georgia', 'dormant', 'GEL', 'metric', 'ka'),
    ('AZ', 'Azerbaijan', 'dormant', 'AZN', 'metric', 'az'),
    ('CY', 'Cyprus', 'dormant', 'EUR', 'metric', 'el'),
    ('IS', 'Iceland', 'dormant', 'ISK', 'metric', 'is'),
    ('LU', 'Luxembourg', 'dormant', 'EUR', 'metric', 'fr'),
    ('EC', 'Ecuador', 'dormant', 'USD', 'metric', 'es'),
    ('PY', 'Paraguay', 'dormant', 'PYG', 'metric', 'es'),
    ('DO', 'Dominican Republic', 'dormant', 'DOP', 'metric', 'es'),
    ('HN', 'Honduras', 'dormant', 'HNL', 'metric', 'es'),
    ('SV', 'El Salvador', 'dormant', 'USD', 'metric', 'es'),
    ('NI', 'Nicaragua', 'dormant', 'NIO', 'metric', 'es'),
    ('JM', 'Jamaica', 'dormant', 'JMD', 'metric', 'en'),
    ('TT', 'Trinidad and Tobago', 'dormant', 'TTD', 'metric', 'en'),
    ('JO', 'Jordan', 'dormant', 'JOD', 'metric', 'ar'),
    ('GY', 'Guyana', 'dormant', 'GYD', 'metric', 'en'),
    ('SR', 'Suriname', 'dormant', 'SRD', 'metric', 'nl'),
    ('BA', 'Bosnia and Herzegovina', 'dormant', 'BAM', 'metric', 'bs'),
    ('ME', 'Montenegro', 'dormant', 'EUR', 'metric', 'sr'),
    ('MK', 'North Macedonia', 'dormant', 'MKD', 'metric', 'mk'),
    ('MD', 'Moldova', 'dormant', 'MDL', 'metric', 'ro'),
    ('NA', 'Namibia', 'dormant', 'NAD', 'metric', 'en'),
    ('AO', 'Angola', 'dormant', 'AOA', 'metric', 'pt'),
    ('MZ', 'Mozambique', 'dormant', 'MZN', 'metric', 'pt'),
    ('CI', 'Ivory Coast', 'dormant', 'XOF', 'metric', 'fr'),
    ('SN', 'Senegal', 'dormant', 'XOF', 'metric', 'fr'),
    ('BW', 'Botswana', 'dormant', 'BWP', 'metric', 'en'),
    ('ZM', 'Zambia', 'dormant', 'ZMW', 'metric', 'en'),
    ('UG', 'Uganda', 'dormant', 'UGX', 'metric', 'en'),
    ('CM', 'Cameroon', 'dormant', 'XAF', 'metric', 'fr'),
    ('KH', 'Cambodia', 'dormant', 'KHR', 'metric', 'km'),
    ('LK', 'Sri Lanka', 'dormant', 'LKR', 'metric', 'si'),
    ('UZ', 'Uzbekistan', 'dormant', 'UZS', 'metric', 'uz'),
    ('LA', 'Laos', 'dormant', 'LAK', 'metric', 'lo'),
    ('NP', 'Nepal', 'dormant', 'NPR', 'metric', 'ne'),
    ('DZ', 'Algeria', 'dormant', 'DZD', 'metric', 'ar'),
    ('TN', 'Tunisia', 'dormant', 'TND', 'metric', 'ar'),
    ('MT', 'Malta', 'dormant', 'EUR', 'metric', 'mt'),
    ('BN', 'Brunei', 'dormant', 'BND', 'metric', 'ms'),
    ('RW', 'Rwanda', 'dormant', 'RWF', 'metric', 'rw'),
    ('MG', 'Madagascar', 'dormant', 'MGA', 'metric', 'fr'),
    ('PG', 'Papua New Guinea', 'dormant', 'PGK', 'metric', 'en'),
    ('TM', 'Turkmenistan', 'dormant', 'TMT', 'metric', 'tk'),
    ('KG', 'Kyrgyzstan', 'dormant', 'KGS', 'metric', 'ky'),
    ('MW', 'Malawi', 'dormant', 'MWK', 'metric', 'en')
ON CONFLICT (country_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- 6. CROSS-BORDER ADJACENCY FOR WAVE 1
-- ═══════════════════════════════════════════════════════
UPDATE hc_country_readiness SET cross_border_adjacency = '["CA", "MX"]'::jsonb WHERE country_code = 'US';
UPDATE hc_country_readiness SET cross_border_adjacency = '["US"]'::jsonb WHERE country_code = 'CA';
UPDATE hc_country_readiness SET cross_border_adjacency = '["NZ", "PG"]'::jsonb WHERE country_code = 'AU';

-- ═══════════════════════════════════════════════════════
-- 7. VIEW: NEXT COUNTRY CANDIDATES
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_next_country_candidates AS
SELECT
    country_code,
    country_name,
    market_state,
    total_score,
    supply_depth_score,
    demand_pull_score,
    law_readiness_score,
    -- All gates must be true for promotion eligibility
    (law_pack_gate AND supply_gate AND demand_gate AND localization_gate AND support_gate AND payments_gate AND trust_gate) AS all_gates_passed,
    -- Promotion recommendation
    CASE
        WHEN market_state = 'dormant' AND law_pack_gate AND localization_gate THEN 'promote_to_prepared'
        WHEN market_state = 'prepared' AND supply_gate AND demand_gate THEN 'promote_to_seed'
        WHEN market_state = 'seed' AND law_pack_gate AND supply_gate AND demand_gate AND localization_gate AND support_gate AND payments_gate AND trust_gate THEN 'promote_to_live'
        ELSE 'hold'
    END AS recommendation,
    autonomous_freight_score,
    av_regulatory_maturity,
    last_scored_at
FROM hc_country_readiness
WHERE market_state != 'live'
ORDER BY total_score DESC;
