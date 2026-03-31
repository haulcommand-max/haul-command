-- ============================================================================
-- ESC PEVO GLOSSARY + 120-COUNTRY TIER SEED
-- Haul Command Global Market Tiers for expansion priority
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.country_tiers (
  country_code text PRIMARY KEY,
  country_name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('gold','blue','silver','slate','copper')),
  tier_rank int NOT NULL, -- 1=gold, 2=blue, 3=silver, 4=slate, 5=copper
  flag_emoji text,
  expansion_priority int DEFAULT 50,
  market_status text DEFAULT 'planned', -- active, launching, planned
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tier A — Gold (10)
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('US', 'United States', 'gold', 1, '🇺🇸', 100, 'active'),
('CA', 'Canada', 'gold', 1, '🇨🇦', 95, 'active'),
('AU', 'Australia', 'gold', 1, '🇦🇺', 90, 'launching'),
('GB', 'United Kingdom', 'gold', 1, '🇬🇧', 88, 'launching'),
('NZ', 'New Zealand', 'gold', 1, '🇳🇿', 85, 'launching'),
('ZA', 'South Africa', 'gold', 1, '🇿🇦', 82, 'planned'),
('DE', 'Germany', 'gold', 1, '🇩🇪', 80, 'planned'),
('NL', 'Netherlands', 'gold', 1, '🇳🇱', 78, 'planned'),
('AE', 'United Arab Emirates', 'gold', 1, '🇦🇪', 75, 'planned'),
('BR', 'Brazil', 'gold', 1, '🇧🇷', 72, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority, market_status = EXCLUDED.market_status;

-- Tier B — Blue (18)
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('IE', 'Ireland', 'blue', 2, '🇮🇪', 65, 'planned'),
('SE', 'Sweden', 'blue', 2, '🇸🇪', 64, 'planned'),
('NO', 'Norway', 'blue', 2, '🇳🇴', 63, 'planned'),
('DK', 'Denmark', 'blue', 2, '🇩🇰', 62, 'planned'),
('FI', 'Finland', 'blue', 2, '🇫🇮', 61, 'planned'),
('BE', 'Belgium', 'blue', 2, '🇧🇪', 60, 'planned'),
('AT', 'Austria', 'blue', 2, '🇦🇹', 59, 'planned'),
('CH', 'Switzerland', 'blue', 2, '🇨🇭', 58, 'planned'),
('ES', 'Spain', 'blue', 2, '🇪🇸', 57, 'planned'),
('FR', 'France', 'blue', 2, '🇫🇷', 56, 'planned'),
('IT', 'Italy', 'blue', 2, '🇮🇹', 55, 'planned'),
('PT', 'Portugal', 'blue', 2, '🇵🇹', 54, 'planned'),
('SA', 'Saudi Arabia', 'blue', 2, '🇸🇦', 53, 'planned'),
('QA', 'Qatar', 'blue', 2, '🇶🇦', 52, 'planned'),
('MX', 'Mexico', 'blue', 2, '🇲🇽', 70, 'planned'),
('IN', 'India', 'blue', 2, '🇮🇳', 68, 'planned'),
('ID', 'Indonesia', 'blue', 2, '🇮🇩', 50, 'planned'),
('TH', 'Thailand', 'blue', 2, '🇹🇭', 49, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority;

-- Tier C — Silver (26)
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('PL', 'Poland', 'silver', 3, '🇵🇱', 45, 'planned'),
('CZ', 'Czech Republic', 'silver', 3, '🇨🇿', 44, 'planned'),
('SK', 'Slovakia', 'silver', 3, '🇸🇰', 43, 'planned'),
('HU', 'Hungary', 'silver', 3, '🇭🇺', 42, 'planned'),
('SI', 'Slovenia', 'silver', 3, '🇸🇮', 41, 'planned'),
('EE', 'Estonia', 'silver', 3, '🇪🇪', 40, 'planned'),
('LV', 'Latvia', 'silver', 3, '🇱🇻', 39, 'planned'),
('LT', 'Lithuania', 'silver', 3, '🇱🇹', 38, 'planned'),
('HR', 'Croatia', 'silver', 3, '🇭🇷', 37, 'planned'),
('RO', 'Romania', 'silver', 3, '🇷🇴', 36, 'planned'),
('BG', 'Bulgaria', 'silver', 3, '🇧🇬', 35, 'planned'),
('GR', 'Greece', 'silver', 3, '🇬🇷', 34, 'planned'),
('TR', 'Turkey', 'silver', 3, '🇹🇷', 48, 'planned'),
('KW', 'Kuwait', 'silver', 3, '🇰🇼', 33, 'planned'),
('OM', 'Oman', 'silver', 3, '🇴🇲', 32, 'planned'),
('BH', 'Bahrain', 'silver', 3, '🇧🇭', 31, 'planned'),
('SG', 'Singapore', 'silver', 3, '🇸🇬', 47, 'planned'),
('MY', 'Malaysia', 'silver', 3, '🇲🇾', 30, 'planned'),
('JP', 'Japan', 'silver', 3, '🇯🇵', 46, 'planned'),
('KR', 'South Korea', 'silver', 3, '🇰🇷', 44, 'planned'),
('CL', 'Chile', 'silver', 3, '🇨🇱', 29, 'planned'),
('AR', 'Argentina', 'silver', 3, '🇦🇷', 28, 'planned'),
('CO', 'Colombia', 'silver', 3, '🇨🇴', 27, 'planned'),
('PE', 'Peru', 'silver', 3, '🇵🇪', 26, 'planned'),
('VN', 'Vietnam', 'silver', 3, '🇻🇳', 25, 'planned'),
('PH', 'Philippines', 'silver', 3, '🇵🇭', 24, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority;

-- Tier D — Slate (25)
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('UY', 'Uruguay', 'slate', 4, '🇺🇾', 15, 'planned'),
('PA', 'Panama', 'slate', 4, '🇵🇦', 14, 'planned'),
('CR', 'Costa Rica', 'slate', 4, '🇨🇷', 13, 'planned'),
('IL', 'Israel', 'slate', 4, '🇮🇱', 12, 'planned'),
('NG', 'Nigeria', 'slate', 4, '🇳🇬', 12, 'planned'),
('EG', 'Egypt', 'slate', 4, '🇪🇬', 12, 'planned'),
('KE', 'Kenya', 'slate', 4, '🇰🇪', 11, 'planned'),
('MA', 'Morocco', 'slate', 4, '🇲🇦', 11, 'planned'),
('RS', 'Serbia', 'slate', 4, '🇷🇸', 11, 'planned'),
('UA', 'Ukraine', 'slate', 4, '🇺🇦', 10, 'planned'),
('KZ', 'Kazakhstan', 'slate', 4, '🇰🇿', 10, 'planned'),
('TW', 'Taiwan', 'slate', 4, '🇹🇼', 10, 'planned'),
('PK', 'Pakistan', 'slate', 4, '🇵🇰', 9, 'planned'),
('BD', 'Bangladesh', 'slate', 4, '🇧🇩', 9, 'planned'),
('MN', 'Mongolia', 'slate', 4, '🇲🇳', 9, 'planned'),
('TT', 'Trinidad & Tobago', 'slate', 4, '🇹🇹', 8, 'planned'),
('JO', 'Jordan', 'slate', 4, '🇯🇴', 8, 'planned'),
('GH', 'Ghana', 'slate', 4, '🇬🇭', 8, 'planned'),
('TZ', 'Tanzania', 'slate', 4, '🇹🇿', 7, 'planned'),
('GE', 'Georgia', 'slate', 4, '🇬🇪', 7, 'planned'),
('AZ', 'Azerbaijan', 'slate', 4, '🇦🇿', 7, 'planned'),
('CY', 'Cyprus', 'slate', 4, '🇨🇾', 6, 'planned'),
('IS', 'Iceland', 'slate', 4, '🇮🇸', 6, 'planned'),
('LU', 'Luxembourg', 'slate', 4, '🇱🇺', 6, 'planned'),
('EC', 'Ecuador', 'slate', 4, '🇪🇨', 6, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority;

-- Tier E — Copper (41)
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('BO', 'Bolivia', 'copper', 5, '🇧🇴', 5, 'planned'),
('PY', 'Paraguay', 'copper', 5, '🇵🇾', 5, 'planned'),
('GT', 'Guatemala', 'copper', 5, '🇬🇹', 5, 'planned'),
('DO', 'Dominican Republic', 'copper', 5, '🇩🇴', 5, 'planned'),
('HN', 'Honduras', 'copper', 5, '🇭🇳', 5, 'planned'),
('SV', 'El Salvador', 'copper', 5, '🇸🇻', 4, 'planned'),
('NI', 'Nicaragua', 'copper', 5, '🇳🇮', 4, 'planned'),
('JM', 'Jamaica', 'copper', 5, '🇯🇲', 4, 'planned'),
('GY', 'Guyana', 'copper', 5, '🇬🇾', 4, 'planned'),
('SR', 'Suriname', 'copper', 5, '🇸🇷', 4, 'planned'),
('BA', 'Bosnia & Herzegovina', 'copper', 5, '🇧🇦', 3, 'planned'),
('ME', 'Montenegro', 'copper', 5, '🇲🇪', 3, 'planned'),
('MK', 'North Macedonia', 'copper', 5, '🇲🇰', 3, 'planned'),
('AL', 'Albania', 'copper', 5, '🇦🇱', 3, 'planned'),
('MD', 'Moldova', 'copper', 5, '🇲🇩', 3, 'planned'),
('IQ', 'Iraq', 'copper', 5, '🇮🇶', 3, 'planned'),
('NA', 'Namibia', 'copper', 5, '🇳🇦', 3, 'planned'),
('AO', 'Angola', 'copper', 5, '🇦🇴', 3, 'planned'),
('MZ', 'Mozambique', 'copper', 5, '🇲🇿', 2, 'planned'),
('ET', 'Ethiopia', 'copper', 5, '🇪🇹', 2, 'planned'),
('CI', 'Côte d''Ivoire', 'copper', 5, '🇨🇮', 2, 'planned'),
('SN', 'Senegal', 'copper', 5, '🇸🇳', 2, 'planned'),
('BW', 'Botswana', 'copper', 5, '🇧🇼', 2, 'planned'),
('ZM', 'Zambia', 'copper', 5, '🇿🇲', 2, 'planned'),
('UG', 'Uganda', 'copper', 5, '🇺🇬', 1, 'planned'),
('CM', 'Cameroon', 'copper', 5, '🇨🇲', 1, 'planned'),
('KH', 'Cambodia', 'copper', 5, '🇰🇭', 1, 'planned'),
('LK', 'Sri Lanka', 'copper', 5, '🇱🇰', 1, 'planned'),
('UZ', 'Uzbekistan', 'copper', 5, '🇺🇿', 1, 'planned'),
('LA', 'Laos', 'copper', 5, '🇱🇦', 1, 'planned'),
('NP', 'Nepal', 'copper', 5, '🇳🇵', 1, 'planned'),
('DZ', 'Algeria', 'copper', 5, '🇩🇿', 1, 'planned'),
('TN', 'Tunisia', 'copper', 5, '🇹🇳', 1, 'planned'),
('MT', 'Malta', 'copper', 5, '🇲🇹', 1, 'planned'),
('BN', 'Brunei', 'copper', 5, '🇧🇳', 1, 'planned'),
('RW', 'Rwanda', 'copper', 5, '🇷🇼', 1, 'planned'),
('MG', 'Madagascar', 'copper', 5, '🇲🇬', 1, 'planned'),
('PG', 'Papua New Guinea', 'copper', 5, '🇵🇬', 1, 'planned'),
('TM', 'Turkmenistan', 'copper', 5, '🇹🇲', 1, 'planned'),
('KG', 'Kyrgyzstan', 'copper', 5, '🇰🇬', 1, 'planned'),
('MW', 'Malawi', 'copper', 5, '🇲🇼', 1, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority;

-- Enable RLS
ALTER TABLE public.country_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "country_tiers_public_read_120" ON public.country_tiers;
CREATE POLICY "country_tiers_public_read_120" ON public.country_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "sr_country_tiers_120" ON public.country_tiers;
CREATE POLICY "sr_country_tiers_120" ON public.country_tiers FOR ALL USING (auth.role() = 'service_role');

-- Add robust internal-linking schemas to glossary_terms if we missed them
ALTER TABLE public.glossary_terms ADD COLUMN IF NOT EXISTS related_tools jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Ensure public view captures it 
DROP VIEW IF EXISTS public.glossary_public;
CREATE OR REPLACE VIEW public.glossary_public AS
SELECT
    slug, term, short_definition, long_definition, category, synonyms,
    related_slugs, acronyms, tags, jurisdiction, example_usage, common_mistakes,
    source_confidence, snippet_priority, last_reviewed_at, schema_faq_eligible, snippet_eligible,
    related_rules, related_services, related_problems, related_corridors, related_entities, related_tools,
    surface_categories, applicable_countries, sources, updated_at
FROM public.glossary_terms
WHERE published = true and noindex = false;

