-- ================================================================
-- Training Catalog Seed Data
-- Seeds the core training programs, modules, levels, geo fit,
-- and cross-system links for the initial launch inventory.
-- ================================================================
begin;

-- ============================================================
-- 1. CORE TRAINING PROGRAMS
-- ============================================================
INSERT INTO training_catalog (slug, title, summary, quick_answer, training_type, credential_level, module_count, hours_total, jurisdiction_scope, reciprocity_scope, requirement_fit, ranking_impact, pricing_mode, sponsor_eligible, confidence_state, freshness_state, cta_primary, cta_secondary) VALUES

('pilot-car-operator-certification', 
 'Pilot Car Operator Certification',
 'Comprehensive certification program for escort vehicle operators covering flagging, communication, route surveying, legal compliance, and emergency procedures across all US states and Canadian provinces.',
 'Become a certified pilot car operator with Haul Command training. Learn flagging, route surveys, legal requirements, and earn your Road Ready or Certified badge.',
 'certification', 'certified', 12, 40,
 'multi-state', 'Recognized across all US states. Canadian provinces may require supplemental provincial exam.',
 'required', 'Certified badge adds +25 rank points and unlocks priority dispatch.',
 'paid', true, 'verified_current', 'updated_recently',
 '/training/pilot-car-operator-certification/enroll', '/training/pilot-car-operator-certification'),

('heavy-haul-driver-essentials',
 'Heavy Haul Driver Essentials',
 'Foundational training for oversize/overweight load drivers covering permit requirements, route planning, load securement, bridge formula compliance, and multi-state legal frameworks.',
 'Master the fundamentals of heavy haul driving. Covers permits, load securement, bridge formulas, and route planning for oversize loads.',
 'course', 'road_ready', 8, 24,
 'national', 'US-focused with international regulations overview module.',
 'useful', 'Road Ready badge adds +15 rank points.',
 'freemium', true, 'verified_current', 'updated_recently',
 '/training/heavy-haul-driver-essentials/enroll', '/training/heavy-haul-driver-essentials'),

('escort-vehicle-elite',
 'Escort Vehicle Elite Program',
 'Advanced pilot car training covering night operations, multi-vehicle convoy coordination, superload escort protocols, adverse weather procedures, and AV integration readiness.',
 'Elite-level escort vehicle training. Night ops, superload convoys, adverse weather, and autonomous vehicle integration.',
 'certification', 'elite', 16, 60,
 'global', 'Recognized across US, CA, AU, NZ, GB, and EU member states.',
 'useful', 'Elite badge adds +50 rank points, unlocks superload dispatch priority, and appears on broker-side trust display.',
 'paid', true, 'verified_current', 'updated_recently',
 '/training/escort-vehicle-elite/enroll', '/training/escort-vehicle-elite'),

('av-integration-specialist',
 'AV Integration Specialist',
 'Cutting-edge certification for operators working alongside autonomous and semi-autonomous heavy haul vehicles. Covers V2X communication, remote monitoring, fallback protocols, and regulatory frameworks.',
 'Get certified for the autonomous freight era. V2X comms, remote monitoring, and AV regulatory compliance.',
 'certification', 'av_ready', 10, 30,
 'global', 'Globally applicable — aligned with FHWA, NHTSA, and EU AV framework guidelines.',
 'optional', 'AV-Ready badge adds +75 rank points and future-proofs your profile for autonomous load opportunities.',
 'paid', true, 'seeded_needs_review', 'seeded_needs_review',
 '/training/av-integration-specialist/enroll', '/training/av-integration-specialist'),

('state-permit-compliance-masterclass',
 'State Permit Compliance Masterclass',
 'Deep-dive into US state-by-state permit requirements, application procedures, fee structures, and common rejection pitfalls. Includes live walkthroughs of 10 highest-volume state permit portals.',
 'Master the US state permit maze. Every state''s requirements, fees, portals, and common mistakes — in one course.',
 'course', 'certified', 6, 18,
 'national', 'US-only. Each state module can be taken independently.',
 'useful', 'Certified badge adds +25 rank points. Completing all 50 state modules earns the Permit Master achievement.',
 'paid', false, 'verified_current', 'updated_recently',
 '/training/state-permit-compliance-masterclass/enroll', '/training/state-permit-compliance-masterclass'),

('load-securement-fundamentals',
 'Load Securement Fundamentals',
 'Essential training on FMCSA load securement standards, tie-down calculations, equipment inspection, and liability frameworks for oversize/overweight loads.',
 'Learn FMCSA load securement standards, tie-down math, equipment checks, and liability protection for heavy haul.',
 'course', 'road_ready', 5, 12,
 'national', 'US FMCSA standards. International equivalents covered in supplemental module.',
 'required', 'Road Ready badge adds +15 rank points.',
 'free', true, 'verified_current', 'stable_reference',
 '/training/load-securement-fundamentals/enroll', '/training/load-securement-fundamentals'),

('global-escort-regulations-overview',
 'Global Escort Regulations Overview',
 'Survey of escort vehicle regulations across 120 countries. Covers certification requirements, vehicle specifications, marking rules, and authority notification procedures by jurisdiction.',
 'Understand escort regulations worldwide. 120 countries, certification paths, vehicle specs, and notification rules.',
 'course', 'road_ready', 20, 40,
 'global', 'Covers all 120 countries in the Haul Command operating map across 5 tiers.',
 'useful', 'Completing all country modules unlocks the Global Operator badge (+40 rank points).',
 'freemium', true, 'seeded_needs_review', 'seeded_needs_review',
 '/training/global-escort-regulations-overview/enroll', '/training/global-escort-regulations-overview'),

('route-survey-and-planning',
 'Route Survey & Planning',
 'Professional route survey training covering bridge clearance verification, utility line assessment, turn radius analysis, time-of-travel restrictions, and digital route documentation tools.',
 'Learn professional route surveying: bridge clearances, utility lines, turn radii, curfews, and digital documentation.',
 'course', 'certified', 6, 16,
 'multi-state', 'US and Canada. Principles apply globally.',
 'useful', 'Route Survey Certified badge adds +20 rank points and unlocks route survey job eligibility.',
 'paid', false, 'verified_current', 'updated_recently',
 '/training/route-survey-and-planning/enroll', '/training/route-survey-and-planning')

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. TRAINING LEVELS (Badge System)
-- ============================================================
INSERT INTO training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight) VALUES

((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'road_ready', 'Road Ready', 'Complete modules 1-6 to earn your Road Ready badge. Demonstrates foundational escort knowledge.', 'road-ready', 15, 10),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'certified', 'Certified Operator', 'Complete all 12 modules and pass the certification exam. Full pilot car operator credential.', 'certified-operator', 25, 20),

((SELECT id FROM training_catalog WHERE slug = 'escort-vehicle-elite'), 'elite', 'Elite Escort', 'Complete advanced modules including night ops, superload, and adverse weather. Reserved for experienced operators.', 'elite-escort', 50, 40),

((SELECT id FROM training_catalog WHERE slug = 'av-integration-specialist'), 'av_ready', 'AV-Ready Specialist', 'Complete AV integration training and demonstrate V2X communication competency.', 'av-ready', 75, 50),

((SELECT id FROM training_catalog WHERE slug = 'heavy-haul-driver-essentials'), 'road_ready', 'Road Ready Driver', 'Complete all 8 modules for foundational heavy haul driving competency.', 'road-ready-driver', 15, 10),

((SELECT id FROM training_catalog WHERE slug = 'state-permit-compliance-masterclass'), 'certified', 'Permit Specialist', 'Complete the masterclass and pass the compliance exam.', 'permit-specialist', 25, 15),

((SELECT id FROM training_catalog WHERE slug = 'route-survey-and-planning'), 'certified', 'Route Survey Certified', 'Complete route survey training and field assessment.', 'route-survey-certified', 20, 15)

ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. TRAINING GEO FIT (Tier A + B countries)
-- ============================================================
INSERT INTO training_geo_fit (training_id, country_code, fit_type, note, confidence_state, freshness_state) VALUES

-- Pilot Car Certification — Tier A
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'US', 'required', 'Most US states require formal certification or training for escort vehicle operators.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'CA', 'required', 'Canadian provinces each have unique certification requirements. Alberta, BC, Ontario are most stringent.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'AU', 'required', 'NHVR requires pilot certification. State-level recognition varies.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'GB', 'useful', 'UK self-escort code of practice recommends but does not mandate certification.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'NZ', 'required', 'NZQA Unit Standard 23892 mandates formal pilot certification.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'ZA', 'useful', 'South Africa TRH11 framework recommends escort training.', 'partially_verified', 'seeded_needs_review'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'DE', 'required', 'BF3 transport escort training is legally mandated.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'NL', 'required', 'RDW requires certified escort operators for exceptional transport.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'AE', 'useful', 'UAE requires escort for abnormal loads; operator training framework varies by emirate.', 'partially_verified', 'seeded_needs_review'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'BR', 'required', 'PRF Manual M-017 mandates trained escort operators for oversized loads.', 'verified_current', 'updated_recently'),

-- Pilot Car Certification — Tier B
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'IE', 'useful', 'Ireland follows UK abnormal load framework with some differences.', 'partially_verified', 'seeded_needs_review'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'SE', 'required', 'Trafikverket mandates Vägtransportledare certification.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'FR', 'required', 'Arrêté du 2 mai 2011 mandates formation professionnelle for guide vehicle drivers.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'ES', 'required', 'DGT ACC framework requires trained accompaniment for oversized loads.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'BE', 'required', 'Wallonia requires exam + stage for escort operators.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'FI', 'required', 'Traficom Erikoiskuljetus framework requires warning car operators to be trained.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'MX', 'useful', 'SCT guidance recommends escort training but enforcement varies by state.', 'partially_verified', 'seeded_needs_review'),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'IN', 'useful', 'ODC permit framework recommends pilot vehicle operators. State-level requirements vary.', 'partially_verified', 'seeded_needs_review'),

-- Heavy Haul Essentials — broad applicability
((SELECT id FROM training_catalog WHERE slug = 'heavy-haul-driver-essentials'), 'US', 'required', 'FMCSA compliance is mandatory for all oversize/overweight loads.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'heavy-haul-driver-essentials'), 'CA', 'useful', 'Canadian highway standards differ from FMCSA but principles align.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'heavy-haul-driver-essentials'), 'AU', 'useful', 'NHVR standards differ but heavy haul principles are universal.', 'partially_verified', 'seeded_needs_review'),
((SELECT id FROM training_catalog WHERE slug = 'heavy-haul-driver-essentials'), 'BR', 'useful', 'DNIT oversized transport regulations apply. FMCSA-equivalent concepts.', 'partially_verified', 'seeded_needs_review'),

-- Load Securement — US-focused
((SELECT id FROM training_catalog WHERE slug = 'load-securement-fundamentals'), 'US', 'required', 'FMCSA Part 393 Subpart I mandates load securement compliance.', 'verified_current', 'stable_reference'),
((SELECT id FROM training_catalog WHERE slug = 'load-securement-fundamentals'), 'CA', 'useful', 'NSC Standard 10 aligns with FMCSA standards.', 'verified_current', 'stable_reference'),

-- Global Escort Regulations — all Tier A countries
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'US', 'useful', 'US module covers all 50 states + DC.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'CA', 'useful', 'Canada module covers all provinces/territories.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'AU', 'useful', 'Australia module covers NHVR + all states.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'GB', 'useful', 'UK module covers abnormal load self-escort framework.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'DE', 'useful', 'Germany module covers BF3 and Schwertransporte regulations.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'FR', 'useful', 'France module covers transport exceptionnel framework.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'BR', 'useful', 'Brazil module covers PRF and DNIT frameworks.', 'verified_current', 'updated_recently'),
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'JP', 'useful', 'Japan module covers MLIT special vehicle guidance.', 'verified_current', 'updated_recently')

ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CROSS-SYSTEM CONTENT EDGES (Training ↔ Glossary/Regulations)
-- ============================================================
INSERT INTO content_edges (from_type, from_id, to_type, to_id, link_type, anchor_text, priority) VALUES

-- Training → Glossary links
('training', 'pilot-car-operator-certification', 'glossary', 'pilot-car', 'explains', 'What is a Pilot Car?', 80),
('training', 'pilot-car-operator-certification', 'glossary', 'escort-vehicle', 'explains', 'Escort Vehicle Definition', 75),
('training', 'pilot-car-operator-certification', 'glossary', 'superload', 'explains', 'What is a Superload?', 70),
('training', 'pilot-car-operator-certification', 'glossary', 'route-survey', 'explains', 'Route Survey Explained', 65),
('training', 'pilot-car-operator-certification', 'glossary', 'curfew', 'explains', 'Curfew Restrictions', 60),

('training', 'heavy-haul-driver-essentials', 'glossary', 'heavy-haul', 'explains', 'What is Heavy Haul?', 80),
('training', 'heavy-haul-driver-essentials', 'glossary', 'overdimensional', 'explains', 'Overdimensional Loads', 75),
('training', 'heavy-haul-driver-essentials', 'glossary', 'bill-of-lading', 'explains', 'Bill of Lading', 70),
('training', 'heavy-haul-driver-essentials', 'glossary', 'steerable-trailer', 'explains', 'Steerable Trailers', 65),

('training', 'load-securement-fundamentals', 'glossary', 'heavy-haul', 'supports', 'Heavy Haul Load Securement', 75),

-- Training → Regulations links
('training', 'pilot-car-operator-certification', 'regulation', 'us-federal', 'trains_for', 'FHWA National Escort Manual', 80),
('training', 'state-permit-compliance-masterclass', 'regulation', 'us-federal', 'trains_for', 'Federal Permit Requirements', 85),
('training', 'load-securement-fundamentals', 'regulation', 'us-federal', 'trains_for', 'FMCSA Part 393 Subpart I', 90),

-- Training → Tools links
('training', 'route-survey-and-planning', 'tool', 'route-planner', 'supports', 'Route Planning Tool', 80),
('training', 'state-permit-compliance-masterclass', 'tool', 'permit-calculator', 'supports', 'Permit Cost Calculator', 75),

-- Glossary → Training (reverse links for "training available" sections)
('glossary', 'pilot-car', 'training', 'pilot-car-operator-certification', 'next_action', 'Get Pilot Car Certified', 90),
('glossary', 'escort-vehicle', 'training', 'pilot-car-operator-certification', 'next_action', 'Escort Vehicle Certification', 85),
('glossary', 'heavy-haul', 'training', 'heavy-haul-driver-essentials', 'next_action', 'Heavy Haul Driver Training', 90),
('glossary', 'superload', 'training', 'escort-vehicle-elite', 'next_action', 'Superload Elite Certification', 85),
('glossary', 'route-survey', 'training', 'route-survey-and-planning', 'next_action', 'Route Survey Training', 90)

ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. TRAINING LINKS (within training_links table)
-- ============================================================
INSERT INTO training_links (training_id, link_type, target_type, target_id, anchor_text, priority) VALUES

((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'related_glossary', 'glossary', '/glossary/pilot-car', 'Pilot Car', 80),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'related_glossary', 'glossary', '/glossary/escort-vehicle', 'Escort Vehicle', 75),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'related_glossary', 'glossary', '/glossary/superload', 'Superload', 70),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'related_regulation', 'regulation', '/regulations/us', 'US Federal Escort Requirements', 85),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'next_action', 'page', '/directory', 'Find Pilot Car Operators', 90),
((SELECT id FROM training_catalog WHERE slug = 'pilot-car-operator-certification'), 'claim_path', 'page', '/claim', 'Claim Your Profile', 70),

((SELECT id FROM training_catalog WHERE slug = 'heavy-haul-driver-essentials'), 'related_glossary', 'glossary', '/glossary/heavy-haul', 'Heavy Haul', 80),
((SELECT id FROM training_catalog WHERE slug = 'heavy-haul-driver-essentials'), 'related_glossary', 'glossary', '/glossary/overdimensional', 'Overdimensional', 75),
((SELECT id FROM training_catalog WHERE slug = 'heavy-haul-driver-essentials'), 'next_action', 'page', '/tools', 'Heavy Haul Tools', 85),

((SELECT id FROM training_catalog WHERE slug = 'escort-vehicle-elite'), 'related_glossary', 'glossary', '/glossary/superload', 'Superload', 80),
((SELECT id FROM training_catalog WHERE slug = 'escort-vehicle-elite'), 'next_action', 'page', '/directory', 'Elite Operator Directory', 90),

((SELECT id FROM training_catalog WHERE slug = 'load-securement-fundamentals'), 'related_regulation', 'regulation', '/regulations/us', 'FMCSA Load Securement Rules', 85),

((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'related_regulation', 'regulation', '/regulations', 'Regulations Hub', 90),
((SELECT id FROM training_catalog WHERE slug = 'global-escort-regulations-overview'), 'related_glossary', 'glossary', '/glossary', 'Full Glossary', 75),

((SELECT id FROM training_catalog WHERE slug = 'route-survey-and-planning'), 'related_tool', 'tool', '/tools', 'Route Planning Tools', 80),
((SELECT id FROM training_catalog WHERE slug = 'route-survey-and-planning'), 'related_glossary', 'glossary', '/glossary/route-survey', 'Route Survey', 75)

ON CONFLICT DO NOTHING;

commit;
