-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 015: Seeds
-- ============================================================================
-- Prerequisites: ALL preceding blocks (001–014)
-- Seeds: starter workflows, skills catalog, model policies, country configs,
--         leaderboard boards, SEO blueprints, AdGrid slots, monetization rules
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. STARTER WORKFLOWS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_workflows (workflow_key, display_name, description, trigger_events, max_concurrency, timeout_seconds)
VALUES
    ('profile_enrichment_v1', 'Profile Enrichment', 'Enriches new entity profiles with external data', '{profile.created,entity.upserted}', 10, 600),
    ('load_ingestion_pipeline', 'Load Ingestion Pipeline', 'Processes newly ingested loads: classify, score, match', '{load.ingested}', 20, 300),
    ('broker_surface_builder', 'Broker Surface Builder', 'Generates broker-facing intelligence surfaces', '{entity.verified,broker.onboarded}', 5, 900),
    ('market_mode_evaluator', 'Market Mode Evaluator', 'Evaluates and transitions market modes based on telemetry', '{cron.market_eval}', 1, 120),
    ('seo_surface_generator', 'SEO Surface Generator', 'Generates SEO-optimized content pages', '{seo.surface_requested}', 5, 600),
    ('trust_score_recompute', 'Trust Score Recompute', 'Recomputes trust scores after new observations', '{observation.created,review.posted}', 10, 180),
    ('community_digest', 'Community Digest', 'Generates weekly community summaries and reputation updates', '{cron.weekly_digest}', 1, 300),
    ('adgrid_optimization', 'AdGrid Optimization', 'Evaluates campaign performance and generates recommendations', '{cron.adgrid_eval}', 2, 300)
ON CONFLICT (workflow_key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. STARTER SKILL CATALOG
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_skills (skill_key, display_name, operating_group, skill_type, cost_tier, model_preference, timeout_seconds)
VALUES
    -- Acquisition skills
    ('profile_shell_publisher', 'Profile Shell Publisher', 'acquisition', 'autonomous', 'standard', 'sonnet', 60),
    ('broker_surface_creator', 'Broker Surface Creator', 'acquisition', 'autonomous', 'premium', 'sonnet', 120),
    ('entity_dedup_resolver', 'Entity Dedup Resolver', 'acquisition', 'autonomous', 'standard', 'sonnet', 90),
    -- Enrichment skills
    ('fmcsa_dot_enricher', 'FMCSA/DOT Enricher', 'enrichment', 'autonomous', 'standard', null, 120),
    ('browser_grid_scraper', 'Browser Grid Scraper', 'enrichment', 'autonomous', 'premium', null, 300),
    ('phone_email_verifier', 'Phone/Email Verifier', 'enrichment', 'autonomous', 'standard', null, 60),
    ('review_aggregator', 'Review Aggregator', 'enrichment', 'autonomous', 'standard', 'gemini', 90),
    -- Intelligence skills
    ('trust_score_calculator', 'Trust Score Calculator', 'intelligence', 'autonomous', 'free', null, 30),
    ('freshness_evaluator', 'Freshness Evaluator', 'intelligence', 'autonomous', 'free', null, 15),
    ('load_classifier', 'Load Classifier', 'intelligence', 'autonomous', 'standard', 'gemini', 30),
    ('load_matcher', 'Load Matcher', 'intelligence', 'autonomous', 'standard', null, 60),
    ('corridor_scorer', 'Corridor Scorer', 'intelligence', 'autonomous', 'free', null, 30),
    -- SEO skills
    ('seo_page_generator', 'SEO Page Generator', 'seo', 'autonomous', 'premium', 'sonnet', 180),
    ('seo_internal_linker', 'SEO Internal Linker', 'seo', 'autonomous', 'standard', null, 60),
    ('seo_faq_generator', 'SEO FAQ Generator', 'seo', 'autonomous', 'standard', 'gemini', 90),
    ('seo_freshness_checker', 'SEO Freshness Checker', 'seo', 'autonomous', 'free', null, 30),
    -- Monetization skills
    ('adgrid_recommender', 'AdGrid Recommender', 'monetization', 'autonomous', 'standard', 'gemini', 60),
    ('pressure_evaluator', 'Pressure Evaluator', 'monetization', 'autonomous', 'standard', null, 30),
    ('dominance_scorer', 'Dominance Scorer', 'monetization', 'autonomous', 'standard', null, 60),
    -- Communication skills
    ('conversation_summarizer', 'Conversation Summarizer', 'communication', 'autonomous', 'standard', 'sonnet', 60),
    ('action_item_extractor', 'Action Item Extractor', 'communication', 'autonomous', 'standard', 'gemini', 45),
    ('followup_scheduler', 'Followup Scheduler', 'communication', 'autonomous', 'free', null, 15),
    -- Glossary skills
    ('glossary_term_generator', 'Glossary Term Generator', 'seo', 'autonomous', 'standard', 'sonnet', 120),
    ('glossary_localizer', 'Glossary Localizer', 'seo', 'autonomous', 'premium', 'opus', 180)
ON CONFLICT (skill_key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. MODEL POLICIES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_model_policies (policy_key, model_name, operating_group, cost_ceiling_usd, max_tokens, temperature, priority)
VALUES
    ('default', 'claude-sonnet-4.6', null, 0.50, 4096, 0.20, 50),
    ('cheap_default', 'gemini-3.5-pro', null, 0.10, 4096, 0.15, 30),
    ('intelligence_default', 'gemini-3.5-pro', 'intelligence', 0.05, 2048, 0.10, 60),
    ('seo_generator', 'claude-sonnet-4.6', 'seo', 1.00, 8192, 0.30, 70),
    ('opus_hard_tasks', 'claude-opus', null, 5.00, 16384, 0.10, 90),
    ('communication', 'claude-sonnet-4.6', 'communication', 0.30, 4096, 0.20, 60),
    ('adgrid_analysis', 'gemini-3.5-pro', 'monetization', 0.15, 4096, 0.10, 55)
ON CONFLICT (policy_key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. COUNTRY CONFIGS — Top 15 markets
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO hc_country_configs (country_code, country_name, currency_code, measurement_system, language_primary, regulatory_body, permit_complexity, market_state, is_active)
VALUES
    ('US', 'United States', 'USD', 'imperial', 'en', 'FMCSA', 'complex', 'live', true),
    ('CA', 'Canada', 'CAD', 'metric', 'en', 'Transport Canada', 'complex', 'live', true),
    ('AU', 'Australia', 'AUD', 'metric', 'en', 'NHVR', 'complex', 'prepared', true),
    ('GB', 'United Kingdom', 'GBP', 'imperial', 'en', 'DVSA', 'standard', 'prepared', true),
    ('DE', 'Germany', 'EUR', 'metric', 'de', 'BASt', 'complex', 'seed', false),
    ('FR', 'France', 'EUR', 'metric', 'fr', 'DRIEA', 'complex', 'seed', false),
    ('MX', 'Mexico', 'MXN', 'metric', 'es', 'SCT', 'standard', 'prepared', true),
    ('BR', 'Brazil', 'BRL', 'metric', 'pt', 'DNIT', 'complex', 'seed', false),
    ('IN', 'India', 'INR', 'metric', 'en', 'NHAI', 'extreme', 'dormant', false),
    ('ZA', 'South Africa', 'ZAR', 'metric', 'en', 'RTMC', 'standard', 'dormant', false),
    ('AE', 'United Arab Emirates', 'AED', 'metric', 'en', 'RTA', 'standard', 'dormant', false),
    ('SA', 'Saudi Arabia', 'SAR', 'metric', 'ar', 'MOT', 'standard', 'dormant', false),
    ('NZ', 'New Zealand', 'NZD', 'metric', 'en', 'NZTA', 'standard', 'seed', false),
    ('JP', 'Japan', 'JPY', 'metric', 'ja', 'MLIT', 'extreme', 'dormant', false),
    ('NO', 'Norway', 'NOK', 'metric', 'no', 'Statens vegvesen', 'complex', 'dormant', false)
ON CONFLICT (country_code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. LEADERBOARD BOARDS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO lbd_boards (board_key, display_name, board_type, scope_type, country_code, period_type, entity_types_eligible)
VALUES
    ('global-operator-monthly', 'Global Operator Leaderboard', 'competitive', 'global', null, 'monthly', '{operator}'),
    ('us-operator-monthly', 'US Operator Leaderboard', 'competitive', 'country', 'US', 'monthly', '{operator}'),
    ('ca-operator-monthly', 'Canada Operator Leaderboard', 'competitive', 'country', 'CA', 'monthly', '{operator}'),
    ('au-operator-monthly', 'Australia Operator Leaderboard', 'competitive', 'country', 'AU', 'monthly', '{operator}'),
    ('global-contributor-monthly', 'Top Contributors', 'contributor', 'global', null, 'monthly', '{person,operator,broker}'),
    ('global-broker-quarterly', 'Broker Excellence', 'achievement', 'global', null, 'quarterly', '{broker}')
ON CONFLICT (board_key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. BADGES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO lbd_badges (badge_key, display_name, badge_tier, category, unlock_conditions)
VALUES
    ('road-captain', 'Road Captain', 'gold', 'achievement', '{"completed_runs_min": 100, "trust_score_min": 80}'),
    ('verified-escort', 'Verified Escort', 'silver', 'certification', '{"docs_verified": true, "insurance_current": true}'),
    ('top-responder', 'Top Responder', 'bronze', 'community', '{"avg_response_hours_max": 2, "responses_min": 50}'),
    ('iron-horse', 'Iron Horse', 'platinum', 'milestone', '{"completed_runs_min": 500}'),
    ('local-legend', 'Local Legend', 'gold', 'achievement', '{"market_rank_max": 3, "consecutive_months_min": 6}'),
    ('trusted-broker', 'Trusted Broker', 'gold', 'trust', '{"trust_score_min": 90, "operators_matched_min": 25}'),
    ('diamond-carrier', 'Diamond Carrier', 'diamond', 'milestone', '{"completed_runs_min": 1000, "zero_incident_months_min": 12}'),
    ('community-hero', 'Community Hero', 'gold', 'community', '{"community_reputation_min": 500, "best_answers_min": 10}')
ON CONFLICT (badge_key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. SEO BLUEPRINT FAMILIES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO seo_surface_blueprints (blueprint_key, surface_family, display_name, title_template, h1_template, target_word_count, internal_link_budget, faq_count, structured_data_types, required_variables)
VALUES
    ('corridor', 'corridors', 'Corridor Page', 'Oversize Load Escort: {origin} to {destination} | Haul Command', 'Heavy Haul Escort: {origin} to {destination}', 2000, 15, 5, '{FAQPage,BreadcrumbList}', '{origin,destination,country_code}'),
    ('state_requirements', 'requirements', 'State Requirements', '{state} Oversize Load Permit & Escort Requirements | Haul Command', '{state} Oversize/Overweight Permit Requirements', 2500, 12, 7, '{FAQPage,BreadcrumbList}', '{state,country_code}'),
    ('port_guide', 'directory', 'Port Guide', 'Heavy Haul Services Near {port_name} | Haul Command', 'Escort & Heavy Haul Services: {port_name}', 1500, 10, 5, '{LocalBusiness,FAQPage}', '{port_name,country_code}'),
    ('glossary_term', 'glossary', 'Glossary Term', '{term} — Heavy Haul Glossary | Haul Command', 'What is {term}?', 800, 8, 3, '{DefinedTerm,FAQPage}', '{term}'),
    ('training_hub', 'training', 'Training Hub', '{topic} Training & Certification | Haul Command', '{topic} Training for Heavy Haul Operators', 1800, 10, 5, '{Course,FAQPage,BreadcrumbList}', '{topic,country_code}'),
    ('operator_profile', 'directory', 'Operator Profile', '{operator_name} — Verified Escort Service | Haul Command', '{operator_name} — Heavy Haul Escort Services', 1200, 8, 3, '{LocalBusiness,AggregateRating}', '{operator_name,country_code}'),
    ('country_overview', 'requirements', 'Country Overview', 'Heavy Haul & Oversize Load Regulations: {country_name} | Haul Command', 'Oversize Load Regulations in {country_name}', 3000, 20, 10, '{FAQPage,BreadcrumbList}', '{country_name,country_code}')
ON CONFLICT (blueprint_key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. ADGRID SLOT TYPES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO adg_slots (slot_key, display_name, surface_type, position, format, pricing_model, floor_price_minor_units)
VALUES
    ('directory_sidebar_global', 'Directory Sidebar', 'directory', 'sidebar', 'card', 'cpc', 50),
    ('directory_featured_listing', 'Featured Directory Listing', 'directory', 'featured', 'sponsored_listing', 'cpm', 200),
    ('load_board_banner', 'Load Board Banner', 'load_board', 'header', 'banner', 'cpm', 150),
    ('corridor_page_sponsor', 'Corridor Page Sponsor', 'corridor_page', 'sidebar', 'card', 'flat_rate', 5000),
    ('search_results_promoted', 'Promoted Search Result', 'search_results', 'inline', 'native', 'cpc', 75),
    ('homepage_hero_sponsor', 'Homepage Hero Sponsor', 'homepage', 'header', 'banner', 'flat_rate', 25000),
    ('requirements_page_banner', 'Requirements Page Banner', 'corridor_page', 'inline', 'banner', 'cpm', 100)
ON CONFLICT (slot_key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. MONETIZATION TRIGGER RULES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO mon_pressure_rules (rule_key, display_name, pressure_type, multiplier, trigger_conditions, cooldown_hours)
VALUES
    ('scarcity_boost_high', 'High Scarcity Boost', 'scarcity_premium', 1.5, '{"fill_rate_below": 0.2, "market_mode": "shortage"}', 12),
    ('urgency_load_premium', 'Urgent Load Premium', 'urgency_flag', 1.3, '{"pickup_within_hours": 24, "no_match_hours": 4}', 6),
    ('new_market_offer', 'New Market Welcome', 'offer_nudge', 1.0, '{"market_mode": "seeding", "entity_created_within_days": 7}', 168),
    ('upsell_verified', 'Verification Upsell', 'upsell', 1.0, '{"claim_status": "claimed", "verification_status": "none"}', 72)
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO mon_offer_triggers (trigger_key, display_name, offer_type, trigger_conditions, offer_value, target_entity_types, max_redemptions)
VALUES
    ('welcome_trial', 'Welcome Trial', 'trial', '{"days_since_signup_max": 30}', '{"trial_days": 14, "feature": "featured_listing"}', '{operator}', null),
    ('referral_bonus', 'Referral Bonus', 'referral', '{"referrals_min": 1}', '{"bonus_credits_minor_units": 5000}', '{operator,broker}', null),
    ('seasonal_discount', 'Seasonal Discount', 'discount', '{"month_in": [11,12,1]}', '{"discount_pct": 15, "valid_days": 60}', '{operator}', 500)
ON CONFLICT (trigger_key) DO NOTHING;
