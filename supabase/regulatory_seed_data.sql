-- ============================================================
-- HAUL COMMAND: REGULATORY SEED DATA
-- Priority Jurisdictions + Global Market Readiness + Corridors
-- ============================================================
-- Run AFTER: regulatory_intelligence_engine.sql
-- ============================================================

-- ============================================================
-- JURISDICTION MASTER — U.S. States (10 Priority)
-- ============================================================
INSERT INTO jurisdiction_master (id, country_code, region_code, authority_name, authority_type,
    digital_maturity_score, permit_complexity_score, escort_usage, police_escort_likelihood,
    engineering_review_required, permit_portal_url, strategic_score, nightmare_state, premium_pricing_zone)
VALUES
-- FL (Home Base)
('11111111-0001-4000-a000-000000000001', 'US', 'FL', 'Florida DOT', 'STATE',
    4, 2, TRUE, 'RARE', FALSE,
    'https://www.fdot.gov/maintenance/permitting', 9.5, FALSE, FALSE),

-- GA (Home Base Adjacent)
('11111111-0002-4000-a000-000000000002', 'US', 'GA', 'Georgia DOT', 'STATE',
    3, 3, TRUE, 'COMMON', FALSE,
    'https://www.dot.ga.gov/InvestSmart/Permits', 8.5, FALSE, FALSE),

-- TX (Volume King)
('11111111-0003-4000-a000-000000000003', 'US', 'TX', 'Texas DOT (TxDOT)', 'STATE',
    4, 3, TRUE, 'RARE', TRUE,
    'https://www.txdot.gov/business/oversize-overweight-permits.html', 9.0, FALSE, FALSE),

-- WA (West Coast Energy)
('11111111-0004-4000-a000-000000000004', 'US', 'WA', 'Washington State DOT (WSDOT)', 'STATE',
    4, 3, TRUE, 'COMMON', TRUE,
    'https://www.wsdot.wa.gov/CommercialVehicle/permits.htm', 7.5, FALSE, FALSE),

-- CA (Nightmare = Weapon)
('11111111-0005-4000-a000-000000000005', 'US', 'CA', 'California DOT (Caltrans)', 'STATE',
    3, 5, TRUE, 'MANDATORY', TRUE,
    'https://travelpermits.dot.ca.gov/', 8.0, TRUE, TRUE),

-- OH (Midwest Hub)
('11111111-0006-4000-a000-000000000006', 'US', 'OH', 'Ohio DOT (ODOT)', 'STATE',
    3, 3, TRUE, 'COMMON', TRUE,
    'https://www.transportation.ohio.gov/programs/special-hauling-permits', 7.0, FALSE, FALSE),

-- IL (Midwest Hub / Chicago Nightmare)
('11111111-0007-4000-a000-000000000007', 'US', 'IL', 'Illinois DOT (IDOT)', 'STATE',
    3, 4, TRUE, 'COMMON', TRUE,
    'https://www.idot.illinois.gov/transportation-system/local-transportation-partners/county-engineers-and-local-public-agencies/oversize-overweight-vehicles', 7.0, TRUE, TRUE),

-- NY (Nightmare = Weapon)
('11111111-0008-4000-a000-000000000008', 'US', 'NY', 'New York State DOT (NYSDOT)', 'STATE',
    3, 5, TRUE, 'MANDATORY', TRUE,
    'https://www.dot.ny.gov/portal/page/portal/divisions/operating/oom/specialized-hauling', 7.5, TRUE, TRUE),

-- PA (Nightmare = Weapon)
('11111111-0009-4000-a000-000000000009', 'US', 'PA', 'Pennsylvania DOT (PennDOT)', 'STATE',
    2, 5, TRUE, 'MANDATORY', TRUE,
    'https://www.dot.state.pa.us/Public/Bureaus/Motor%20Vehicles/OSOW.aspx', 7.0, TRUE, TRUE),

-- NJ (Nightmare = Weapon)
('11111111-0010-4000-a000-000000000010', 'US', 'NJ', 'New Jersey DOT (NJDOT)', 'STATE',
    2, 5, TRUE, 'MANDATORY', TRUE,
    'https://www.state.nj.us/transportation/freight/trucking/oversized.shtm', 6.5, TRUE, TRUE);


-- ============================================================
-- JURISDICTION MASTER — Canadian Provinces (3 Priority)
-- ============================================================
INSERT INTO jurisdiction_master (id, country_code, region_code, authority_name, authority_type,
    digital_maturity_score, permit_complexity_score, escort_usage, police_escort_likelihood,
    engineering_review_required, permit_portal_url, strategic_score, nightmare_state, premium_pricing_zone)
VALUES
-- ON (Ontario — Cross-border Giant)
('22222222-0001-4000-a000-000000000001', 'CA', 'ON', 'Ontario Ministry of Transportation (MTO)', 'PROVINCIAL',
    4, 4, TRUE, 'COMMON', TRUE,
    'https://www.ontario.ca/page/get-commercial-vehicle-permit', 9.0, TRUE, TRUE),

-- AB (Alberta — Oil & Gas Corridor)
('22222222-0002-4000-a000-000000000002', 'CA', 'AB', 'Alberta Transportation', 'PROVINCIAL',
    4, 3, TRUE, 'RARE', TRUE,
    'https://www.alberta.ca/oversize-overweight-vehicle-permits', 8.5, FALSE, FALSE),

-- BC (British Columbia — Port Gateway)
('22222222-0003-4000-a000-000000000003', 'CA', 'BC', 'BC Ministry of Transportation and Infrastructure', 'PROVINCIAL',
    3, 4, TRUE, 'COMMON', TRUE,
    'https://www2.gov.bc.ca/gov/content/transportation/vehicle-safety-enforcement/services/oversize-overweight', 7.5, FALSE, FALSE);


-- ============================================================
-- PERMIT FRAMEWORK — FL (Escort Triggers)
-- ============================================================
INSERT INTO permit_framework (jurisdiction_id, dimension_type, threshold_value, threshold_unit,
    result_action, escort_count, applies_to_road_type, submission_format, avg_processing_hours, rush_available, rush_fee_cents)
VALUES
-- Width triggers
('11111111-0001-4000-a000-000000000001', 'WIDTH', 12.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 24, TRUE, 5000),
('11111111-0001-4000-a000-000000000001', 'WIDTH', 14.5, 'ft', 'MULTI_ESCORT', 2, 'all', 'online', 48, TRUE, 10000),
('11111111-0001-4000-a000-000000000001', 'WIDTH', 16.0, 'ft', 'POLICE_REQUIRED', 2, 'all', 'online', 72, FALSE, NULL),
-- Height triggers
('11111111-0001-4000-a000-000000000001', 'HEIGHT', 14.6, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 24, TRUE, 5000),
('11111111-0001-4000-a000-000000000001', 'HEIGHT', 16.0, 'ft', 'ENGINEERING_REVIEW', 1, 'all', 'online', 120, FALSE, NULL),
-- Length triggers
('11111111-0001-4000-a000-000000000001', 'LENGTH', 95.0, 'ft', 'ESCORT_REQUIRED', 1, 'interstate', 'online', 24, TRUE, 5000),
('11111111-0001-4000-a000-000000000001', 'LENGTH', 120.0, 'ft', 'MULTI_ESCORT', 2, 'all', 'online', 48, TRUE, 10000),
-- Weight triggers
('11111111-0001-4000-a000-000000000001', 'WEIGHT', 80000, 'lbs', 'PERMIT_REQUIRED', 0, 'all', 'online', 24, TRUE, 5000),
('11111111-0001-4000-a000-000000000001', 'WEIGHT', 200000, 'lbs', 'SUPERLOAD', 2, 'all', 'online', 240, FALSE, NULL);

-- ============================================================
-- PERMIT FRAMEWORK — GA (Escort Triggers)
-- ============================================================
INSERT INTO permit_framework (jurisdiction_id, dimension_type, threshold_value, threshold_unit,
    result_action, escort_count, applies_to_road_type, submission_format, avg_processing_hours)
VALUES
('11111111-0002-4000-a000-000000000002', 'WIDTH', 12.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 48),
('11111111-0002-4000-a000-000000000002', 'WIDTH', 14.0, 'ft', 'MULTI_ESCORT', 2, 'all', 'online', 72),
('11111111-0002-4000-a000-000000000002', 'WIDTH', 16.0, 'ft', 'POLICE_REQUIRED', 2, 'all', 'online', 96),
('11111111-0002-4000-a000-000000000002', 'HEIGHT', 14.6, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 48),
('11111111-0002-4000-a000-000000000002', 'LENGTH', 100.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 48),
('11111111-0002-4000-a000-000000000002', 'WEIGHT', 80000, 'lbs', 'PERMIT_REQUIRED', 0, 'all', 'online', 48),
('11111111-0002-4000-a000-000000000002', 'WEIGHT', 200000, 'lbs', 'SUPERLOAD', 2, 'all', 'online', 240);

-- ============================================================
-- PERMIT FRAMEWORK — TX (Escort Triggers)
-- ============================================================
INSERT INTO permit_framework (jurisdiction_id, dimension_type, threshold_value, threshold_unit,
    result_action, escort_count, applies_to_road_type, submission_format, avg_processing_hours)
VALUES
('11111111-0003-4000-a000-000000000003', 'WIDTH', 12.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 24),
('11111111-0003-4000-a000-000000000003', 'WIDTH', 14.0, 'ft', 'MULTI_ESCORT', 2, 'all', 'online', 48),
('11111111-0003-4000-a000-000000000003', 'HEIGHT', 14.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 24),
('11111111-0003-4000-a000-000000000003', 'HEIGHT', 17.0, 'ft', 'SUPERLOAD', 2, 'all', 'online', 240),
('11111111-0003-4000-a000-000000000003', 'LENGTH', 110.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 24),
('11111111-0003-4000-a000-000000000003', 'WEIGHT', 80000, 'lbs', 'PERMIT_REQUIRED', 0, 'all', 'online', 24),
('11111111-0003-4000-a000-000000000003', 'WEIGHT', 254300, 'lbs', 'SUPERLOAD', 2, 'all', 'online', 360);

-- ============================================================
-- PERMIT FRAMEWORK — CA (Nightmare State = Premium Weapon)
-- ============================================================
INSERT INTO permit_framework (jurisdiction_id, dimension_type, threshold_value, threshold_unit,
    result_action, escort_count, applies_to_road_type, submission_format, avg_processing_hours)
VALUES
('11111111-0005-4000-a000-000000000005', 'WIDTH', 10.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 72),
('11111111-0005-4000-a000-000000000005', 'WIDTH', 12.0, 'ft', 'MULTI_ESCORT', 2, 'all', 'online', 120),
('11111111-0005-4000-a000-000000000005', 'WIDTH', 14.0, 'ft', 'POLICE_REQUIRED', 2, 'all', 'online', 168),
('11111111-0005-4000-a000-000000000005', 'HEIGHT', 14.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 72),
('11111111-0005-4000-a000-000000000005', 'HEIGHT', 15.0, 'ft', 'ENGINEERING_REVIEW', 1, 'all', 'online', 240),
('11111111-0005-4000-a000-000000000005', 'LENGTH', 75.0, 'ft', 'ESCORT_REQUIRED', 1, 'all', 'online', 72),
('11111111-0005-4000-a000-000000000005', 'WEIGHT', 80000, 'lbs', 'PERMIT_REQUIRED', 0, 'all', 'online', 72),
('11111111-0005-4000-a000-000000000005', 'WEIGHT', 132000, 'lbs', 'SUPERLOAD', 2, 'all', 'online', 480);

-- ============================================================
-- PERMIT FRAMEWORK — ON (Ontario)
-- ============================================================
INSERT INTO permit_framework (jurisdiction_id, dimension_type, threshold_value, threshold_unit,
    result_action, escort_count, applies_to_road_type, submission_format, avg_processing_hours)
VALUES
('22222222-0001-4000-a000-000000000001', 'WIDTH', 3.85, 'm', 'ESCORT_REQUIRED', 1, 'all', 'online', 72),
('22222222-0001-4000-a000-000000000001', 'WIDTH', 4.3, 'm', 'MULTI_ESCORT', 2, 'all', 'online', 120),
('22222222-0001-4000-a000-000000000001', 'WIDTH', 5.0, 'm', 'POLICE_REQUIRED', 2, 'all', 'online', 168),
('22222222-0001-4000-a000-000000000001', 'HEIGHT', 4.4, 'm', 'ESCORT_REQUIRED', 1, 'all', 'online', 72),
('22222222-0001-4000-a000-000000000001', 'LENGTH', 25.0, 'm', 'ESCORT_REQUIRED', 1, 'all', 'online', 72),
('22222222-0001-4000-a000-000000000001', 'WEIGHT', 63500, 'kg', 'PERMIT_REQUIRED', 0, 'all', 'online', 72);


-- ============================================================
-- ESCORT REGULATION — Priority States
-- ============================================================
INSERT INTO escort_regulation (jurisdiction_id, civilian_escort_allowed, police_required_threshold,
    certification_required, certification_name, certification_provider, certification_url,
    certification_reciprocity, reciprocity_states, height_pole_required, height_pole_threshold_ft,
    lead_chase_rules, common_rejection_reasons, avg_response_time_hours)
VALUES
-- FL
('11111111-0001-4000-a000-000000000001', TRUE, 'Width > 16ft or load-specific',
    FALSE, NULL, NULL, NULL,
    FALSE, NULL, TRUE, 15.0,
    'Lead car required for width > 12ft. Lead and chase for > 14.5ft.',
    ARRAY['Incomplete application', 'Wrong route', 'Missing insurance'],
    12.0),

-- GA
('11111111-0002-4000-a000-000000000002', TRUE, 'Width > 16ft',
    FALSE, NULL, NULL, NULL,
    FALSE, NULL, TRUE, 15.0,
    'Lead and chase required for > 14ft width. Lead only for 12-14ft.',
    ARRAY['Insufficient escort count', 'Route not approved', 'Expired insurance'],
    24.0),

-- TX
('11111111-0003-4000-a000-000000000003', TRUE, 'Rarely required for civilian',
    FALSE, NULL, NULL, NULL,
    FALSE, NULL, TRUE, 16.0,
    'Lead car for > 12ft width. Dual escort for > 14ft.',
    ARRAY['Wrong form', 'No bond on file', 'Equipment weight exceeds bridge rating'],
    8.0),

-- CA
('11111111-0005-4000-a000-000000000005', TRUE, 'Width > 14ft on freeways, most superloads',
    TRUE, 'CHP Escort Certification', 'California Highway Patrol', 'https://www.chp.ca.gov/',
    FALSE, NULL, TRUE, 14.5,
    'CHP escort mandatory for superloads. Civilian escort for standard oversize. Strict lane requirements.',
    ARRAY['Missing CHP coordination', 'Bridge clearance not verified', 'Incorrect route survey', 'Missing utility coordination'],
    48.0),

-- ON
('22222222-0001-4000-a000-000000000001', TRUE, 'Width > 5m or provincial discretion',
    TRUE, 'Pilot Car Operator Certification', 'Ontario MTO', 'https://www.ontario.ca/page/pilot-cars-oversize-loads',
    FALSE, NULL, TRUE, 4.5,
    'Pilot vehicles required based on load category. Lead and chase for Cat 2+.',
    ARRAY['Missing pilot car cert', 'Route survey incomplete', 'Bridge restriction not addressed'],
    36.0),

-- AB
('22222222-0002-4000-a000-000000000002', TRUE, 'Rarely required',
    TRUE, 'Pilot Vehicle Operator Certificate', 'Alberta Transportation', 'https://www.alberta.ca/pilot-vehicle-operators',
    TRUE, ARRAY['SK', 'MB', 'BC'], TRUE, 5.3,
    'Pilot vehicles per Alberta guidelines. Lead required for oversized.',
    ARRAY['Missing PVO certificate', 'Route not pre-approved'],
    16.0);


-- ============================================================
-- MOVEMENT RESTRICTION — Friday Night Calculator Seeds
-- ============================================================
INSERT INTO movement_restriction (jurisdiction_id, restriction_type, applies_to,
    start_time, end_time, day_of_week, metro_areas, absolute_ban, escort_override, notes)
VALUES
-- FL: No major night restrictions (escort state, not ban state)
('11111111-0001-4000-a000-000000000001', 'NIGHT', 'metro',
    '22:00', '06:00', ARRAY['FRIDAY', 'SATURDAY'], ARRAY['Miami-Dade', 'Broward', 'Palm Beach'],
    FALSE, TRUE, 'Metro night travel discouraged but not banned. Escorts can override.'),

-- GA: Night restriction
('11111111-0002-4000-a000-000000000002', 'NIGHT', 'metro',
    '20:00', '06:00', ARRAY['FRIDAY', 'SATURDAY', 'SUNDAY'], ARRAY['Metro Atlanta'], 
    TRUE, FALSE, 'No oversize movement in Metro Atlanta Friday 8pm - Monday 6am.'),

-- TX: Minimal restrictions
('11111111-0003-4000-a000-000000000003', 'NIGHT', 'all',
    '00:00', '05:00', ARRAY['SATURDAY', 'SUNDAY'], NULL,
    FALSE, TRUE, 'General discouragement. Not a hard ban. Escorts can override.'),

-- CA: Strict curfews
('11111111-0005-4000-a000-000000000005', 'CURFEW', 'metro',
    '06:00', '09:00', ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    ARRAY['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
    TRUE, FALSE, 'Morning commute curfew. No oversize on freeways 6am-9am in major metros.'),
('11111111-0005-4000-a000-000000000005', 'CURFEW', 'metro',
    '15:00', '19:00', ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    ARRAY['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
    TRUE, FALSE, 'Evening commute curfew. No oversize on freeways 3pm-7pm in major metros.'),
('11111111-0005-4000-a000-000000000005', 'WEEKEND', 'all',
    NULL, NULL, ARRAY['SATURDAY', 'SUNDAY'], NULL,
    FALSE, TRUE, 'Weekend movement allowed with escorts. Holiday weekends banned.'),

-- IL: Chicago is a nightmare
('11111111-0007-4000-a000-000000000007', 'CURFEW', 'metro',
    '06:00', '09:00', ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    ARRAY['Chicago', 'Cook County'],
    TRUE, FALSE, 'No oversize movement during AM rush in Chicago metro.'),
('11111111-0007-4000-a000-000000000007', 'CURFEW', 'metro',
    '15:30', '19:00', ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    ARRAY['Chicago', 'Cook County'],
    TRUE, FALSE, 'No oversize movement during PM rush in Chicago metro.'),

-- ON: Spring thaw
('22222222-0001-4000-a000-000000000001', 'SPRING_THAW', 'all',
    NULL, NULL, NULL, NULL,
    TRUE, FALSE, 'Annual spring load restrictions. Typically March-May. Weight limits reduced on secondary highways.'),
('22222222-0001-4000-a000-000000000001', 'NIGHT', 'all',
    '21:00', '06:00', ARRAY['FRIDAY', 'SATURDAY', 'SUNDAY'], NULL,
    FALSE, TRUE, 'Nighttime oversize discouraged but allowed with proper pilot vehicle lighting.');


-- ============================================================
-- ESCORT EQUIPMENT SPECS — Priority States
-- ============================================================
INSERT INTO escort_equipment_specs (jurisdiction_id, sign_size, sign_text, font_color, background_color,
    flag_size, flag_color, amber_beacon_visibility, roof_mount_required, dash_mount_allowed,
    mutcd_reference, ticket_risk)
VALUES
-- FL
('11111111-0001-4000-a000-000000000001', '7ft x 18in', 'OVERSIZE LOAD', 'Black', 'Yellow',
    '18in x 18in', 'red/orange', '500 ft', FALSE, TRUE,
    TRUE, 2),

-- GA
('11111111-0002-4000-a000-000000000002', '7ft x 18in', 'OVERSIZE LOAD', 'Black', 'Yellow',
    '18in x 18in', 'red/orange', '500 ft', FALSE, TRUE,
    TRUE, 3),

-- TX
('11111111-0003-4000-a000-000000000003', '7ft x 18in', 'OVERSIZE LOAD', 'Black', 'Yellow',
    '18in x 18in', 'red/orange', '500 ft', FALSE, TRUE,
    TRUE, 2),

-- CA (Strict)
('11111111-0005-4000-a000-000000000005', '7ft x 18in', 'OVERSIZE LOAD', 'Black', 'Yellow',
    '18in x 18in', 'red/orange', '1000 ft', TRUE, FALSE,
    TRUE, 5),

-- ON
('22222222-0001-4000-a000-000000000001', '2.1m x 450mm', 'OVERSIZE LOAD / CHARGE EXCEDENAIRE', 'Black', 'Yellow',
    '450mm x 450mm', 'red/orange', '300 m', TRUE, FALSE,
    FALSE, 4),

-- AB
('22222222-0002-4000-a000-000000000002', '2.1m x 450mm', 'OVERSIZE LOAD', 'Black', 'Yellow',
    '450mm x 450mm', 'red/orange', '300 m', FALSE, TRUE,
    FALSE, 3);


-- ============================================================
-- REGULATORY CONFIDENCE — Initial Scores
-- ============================================================
INSERT INTO regulatory_confidence (jurisdiction_id, source_count, last_verified,
    enforcement_history_score, confidence_score, data_source_urls, verified_by, verification_method)
VALUES
('11111111-0001-4000-a000-000000000001', 5, NOW(), 8.0, 9.0,
    ARRAY['https://www.fdot.gov', 'https://www.esc.org'], 'system', 'web_scrape'),
('11111111-0002-4000-a000-000000000002', 4, NOW(), 7.0, 8.0,
    ARRAY['https://www.dot.ga.gov', 'https://www.esc.org'], 'system', 'web_scrape'),
('11111111-0003-4000-a000-000000000003', 5, NOW(), 8.0, 9.0,
    ARRAY['https://www.txdot.gov', 'https://www.esc.org'], 'system', 'web_scrape'),
('11111111-0005-4000-a000-000000000005', 6, NOW(), 9.0, 8.5,
    ARRAY['https://travelpermits.dot.ca.gov', 'https://www.chp.ca.gov', 'https://www.esc.org'], 'system', 'web_scrape'),
('11111111-0006-4000-a000-000000000006', 3, NOW(), 6.0, 7.0,
    ARRAY['https://www.transportation.ohio.gov'], 'system', 'web_scrape'),
('11111111-0007-4000-a000-000000000007', 4, NOW(), 7.0, 7.5,
    ARRAY['https://www.idot.illinois.gov'], 'system', 'web_scrape'),
('22222222-0001-4000-a000-000000000001', 4, NOW(), 8.0, 8.0,
    ARRAY['https://www.ontario.ca'], 'system', 'web_scrape'),
('22222222-0002-4000-a000-000000000002', 3, NOW(), 7.0, 8.0,
    ARRAY['https://www.alberta.ca'], 'system', 'web_scrape'),
('22222222-0003-4000-a000-000000000003', 3, NOW(), 7.0, 7.5,
    ARRAY['https://www2.gov.bc.ca'], 'system', 'web_scrape');


-- ============================================================
-- AUTHORITY NODE GRAPH — Multi-Authority Examples
-- ============================================================
-- FL Federal → FL State
INSERT INTO authority_node_graph (parent_id, child_id, relationship_type, scope, priority_order)
VALUES
-- FHWA overrides state DOT on interstates
-- For this to work, we'd add a federal entry. For now, state-to-state examples:
-- GA defers to FL on I-95 corridor south of Savannah
('11111111-0002-4000-a000-000000000002', '11111111-0001-4000-a000-000000000001',
    'COORDINATES_WITH', 'I-95 corridor cross-border escort handoff', 1),

-- ON coordinates with NY on cross-border
('22222222-0001-4000-a000-000000000001', '11111111-0008-4000-a000-000000000008',
    'COORDINATES_WITH', 'Cross-border oversize at Niagara, Thousand Islands, Cornwall', 1),

-- AB coordinates with BC on Trans-Canada
('22222222-0002-4000-a000-000000000002', '22222222-0003-4000-a000-000000000003',
    'COORDINATES_WITH', 'Trans-Canada Highway oversize corridor AB→BC', 1);


-- ============================================================
-- GLOBAL CORRIDOR INDEX — Priority Corridors
-- ============================================================
INSERT INTO global_corridor_index (corridor_name, origin_jurisdiction_id, dest_jurisdiction_id,
    project_density_score, enforcement_score, infrastructure_quality, permit_friction_score,
    corridor_heat_score, top_load_types, seasonal_notes, seasonal_risk_months)
VALUES
-- I-10 FL → TX (Energy Corridor)
('I-10 FL→TX', '11111111-0001-4000-a000-000000000001', '11111111-0003-4000-a000-000000000003',
    8, 6, 7, 4, 78.0,
    ARRAY['wind_turbines', 'transformer', 'modular', 'refinery_equipment'],
    'Hurricane season Jun-Nov. Spring construction peaks.',
    ARRAY[6, 7, 8, 9, 10, 11]),

-- I-95 FL → GA (Home Base Corridor)
('I-95 FL→GA', '11111111-0001-4000-a000-000000000001', '11111111-0002-4000-a000-000000000002',
    7, 5, 8, 3, 65.0,
    ARRAY['construction', 'modular', 'military', 'industrial'],
    'Low seasonal risk. Construction peaks Q2-Q3.',
    ARRAY[4, 5, 6, 7, 8]),

-- I-5 WA → CA (West Coast Spine)
('I-5 WA→CA', '11111111-0004-4000-a000-000000000004', '11111111-0005-4000-a000-000000000005',
    9, 8, 6, 8, 85.0,
    ARRAY['wind_turbines', 'data_center', 'modular', 'heavy_machinery'],
    'Extreme permit friction in CA. Fire season closures. Mountain passes in winter.',
    ARRAY[1, 2, 7, 8, 9, 10]),

-- Trans-Canada ON → AB (Oil & Gas Artery)
('Trans-Canada ON→AB', '22222222-0001-4000-a000-000000000001', '22222222-0002-4000-a000-000000000002',
    8, 7, 6, 7, 72.0,
    ARRAY['pipeline', 'oil_gas', 'mining', 'modular_camp'],
    'Spring thaw March-May (weight restrictions). Extreme winter Nov-Mar.',
    ARRAY[1, 2, 3, 4, 5, 11, 12]),

-- I-75 FL → OH (Southeast to Midwest)
('I-75 FL→OH', '11111111-0001-4000-a000-000000000001', '11111111-0006-4000-a000-000000000006',
    6, 6, 7, 5, 58.0,
    ARRAY['transformer', 'modular', 'construction', 'industrial'],
    'GA night restrictions. OH bridge limitations.',
    ARRAY[1, 2, 3]),

-- I-90/I-80 OH → IL (Midwest Link)
('I-90 OH→IL', '11111111-0006-4000-a000-000000000006', '11111111-0007-4000-a000-000000000007',
    7, 7, 6, 6, 62.0,
    ARRAY['wind_turbines', 'transformer', 'industrial', 'heavy_machinery'],
    'Chicago metro curfews. Indiana bridge limits. Winter weather.',
    ARRAY[1, 2, 3, 11, 12]),

-- Cross-Border ON → NY (Niagara Corridor)
('ON→NY Niagara', '22222222-0001-4000-a000-000000000001', '11111111-0008-4000-a000-000000000008',
    7, 8, 5, 9, 70.0,
    ARRAY['industrial', 'transformer', 'wind_turbines', 'modular'],
    'Both sides are nightmare jurisdictions. Premium pricing zone. Cross-border coordination required.',
    ARRAY[1, 2, 3, 4, 5, 11, 12]);


-- ============================================================
-- GLOBAL MARKET READINESS — Tier 1, 2, 3 Countries
-- ============================================================
INSERT INTO global_market_readiness (country_code, country_name, tier,
    market_size_billions, industrial_spend_score, freight_volume_score,
    regulatory_structure_score, digital_permit_adoption, enforcement_strength,
    market_heat_score, entry_strategy, key_sectors, primary_challenge)
VALUES
-- TIER 1: Active Markets
('US', 'United States', 'TIER_1',
    45.0, 10, 10, 8, 6, 9,
    123.0, 'Direct', ARRAY['energy', 'wind', 'construction', 'military', 'oil_gas'],
    'Market fragmentation — 50 state permit systems'),

('CA', 'Canada', 'TIER_1',
    8.5, 9, 8, 7, 5, 8,
    92.0, 'Direct', ARRAY['oil_gas', 'mining', 'pipeline', 'wind', 'modular_camp'],
    '10 provincial systems + spring thaw restrictions'),

('AU', 'Australia', 'TIER_2',
    6.2, 8, 7, 7, 7, 7,
    77.0, 'Partnership', ARRAY['mining', 'LNG', 'wind', 'solar', 'construction'],
    'Remote distances. State-by-state permit systems. NHVR harmonization ongoing.'),

('GB', 'United Kingdom', 'TIER_2',
    3.1, 7, 6, 8, 8, 8,
    66.0, 'Partnership', ARRAY['offshore_wind', 'nuclear', 'infrastructure', 'construction'],
    'Small geography. Strict regulations. ESDAL system.'),

('DE', 'Germany', 'TIER_2',
    4.5, 9, 8, 9, 7, 9,
    97.0, 'Partnership', ARRAY['wind', 'industrial', 'automotive', 'construction'],
    'VEMAGS digital permit system exists. Weekend/holiday heavy vehicle bans.'),

('SA', 'Saudi Arabia', 'TIER_2',
    5.8, 9, 7, 5, 3, 6,
    77.0, 'Partnership', ARRAY['oil_gas', 'construction', 'solar', 'NEOM'],
    'Rapid infrastructure buildout. Emerging regulation. Vision 2030 megaprojects.'),

('BR', 'Brazil', 'TIER_2',
    3.5, 7, 7, 4, 3, 5,
    61.0, 'Monitor', ARRAY['mining', 'oil_gas', 'wind', 'agriculture', 'hydroelectric'],
    'Massive distances. Poor road infrastructure. Complex bureaucracy.'),

('IN', 'India', 'TIER_3',
    2.8, 8, 8, 3, 2, 4,
    73.0, 'Monitor', ARRAY['construction', 'power', 'mining', 'industrial'],
    'Massive volume but fragmented regulation. Emerging digital infrastructure.'),

('AE', 'United Arab Emirates', 'TIER_2',
    2.1, 8, 6, 6, 7, 7,
    68.0, 'Partnership', ARRAY['oil_gas', 'construction', 'solar', 'desalination'],
    'Small market but high-value projects. Hub for Middle East expansion.'),

('MX', 'Mexico', 'TIER_2',
    2.9, 7, 7, 4, 3, 4,
    60.0, 'Monitor', ARRAY['oil_gas', 'automotive', 'mining', 'wind', 'solar'],
    'Near-shoring boom creating demand. Security concerns. Cross-border complexity.');

-- ============================================================
-- Insert computed market_heat_score using formula:
-- (Industrial × Freight) + Regulatory + Digital + Enforcement
-- ============================================================
UPDATE global_market_readiness SET market_heat_score = 
    (industrial_spend_score * freight_volume_score) 
    + regulatory_structure_score 
    + digital_permit_adoption 
    + enforcement_strength;
