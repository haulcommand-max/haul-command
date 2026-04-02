-- ============================================================================
-- HAUL COMMAND: Role + Intent Engine — Step 6: Seed Live Rows
-- Seeds: role families, roles, modes, intents, page types, actions,
--        completion gates, role-intents, route patterns, next-move rules
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ROLE FAMILIES
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_role_families (family_key, label, description, icon_key, sort_order) VALUES
  ('work_supply',                'Work & Transport',      'People who perform, escort, haul, or directly execute transport work',                          'truck',       10),
  ('freight_demand',             'Jobs & Dispatch',       'People who create, dispatch, coordinate, or manage transport jobs',                             'clipboard',   20),
  ('support_services',           'Services & Support',    'Businesses that support heavy haul movement and operator needs',                                'wrench',      30),
  ('compliance_and_routing',     'Compliance & Permits',  'People and entities tied to permits, route legality, escorts, and compliance',                  'shield',      40),
  ('marketplace_and_equipment',  'Equipment & Gear',      'Sellers, installers, and builders of heavy haul support equipment',                             'shopping-bag',50),
  ('property_and_infrastructure','Property & Space',      'Owners or operators of land, yards, and infrastructure that can be monetized',                  'map-pin',     60),
  ('intelligence_and_enterprise','Data & Research',       'Users who need insights, forecasts, corridor intelligence, or ecosystem data',                  'bar-chart',   70),
  ('community_and_training',    'Community & Learning',   'Users seeking learning, networking, teaching, recruiting, or reputation',                       'users',       80)
ON CONFLICT (family_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. ROLES (first live batch)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_roles (role_key, family_key, label, core_fear, core_goal, is_dual_mode_capable, sort_order) VALUES
  ('pilot_car_operator',   'work_supply',                'Pilot Car Operator',   'No work. Dead miles. Empty calendar.',                                       'Stay loaded. Get paid. Build a reputation that keeps brokers calling.',            false, 10),
  ('escort_driver',        'work_supply',                'Escort Driver',        'No bookings. Compliance confusion.',                                         'Get booked, positioned, and compliant in every jurisdiction.',                     false, 15),
  ('heavy_haul_driver',    'work_supply',                'Heavy Haul Driver',    'Route problems. Compliance failures. Payment delays.',                       'Secure jobs, route safely, and reduce friction.',                                 false, 18),
  ('owner_operator',       'work_supply',                'Owner Operator',       'Underutilized capacity. Invisible to brokers.',                              'Maximize earnings and business visibility.',                                      false, 20),
  ('fleet_team',           'work_supply',                'Fleet / Team',         'Units sitting idle. Fragmented dispatch.',                                   'Keep all units booked and visible.',                                              false, 22),
  ('broker',               'freight_demand',             'Broker',               'Load sitting, no escort, shipper breathing down my neck.',                   'Find a qualified pilot car fast, know it is legal, get it done.',                 false, 30),
  ('dispatcher',           'freight_demand',             'Dispatcher',           'Capacity gaps and timing failure.',                                          'Source coverage fast and move freight smoothly.',                                 false, 35),
  ('load_planner',         'freight_demand',             'Load Planner',         'Route mismatch. Timing failure. Compliance gaps.',                           'Match routes, timing, and qualified support.',                                    false, 38),
  ('project_manager',      'freight_demand',             'Project Manager',      'Too many unknowns.',                                                        'Coordinate execution with fewer unknowns.',                                       false, 40),
  ('shipper',              'freight_demand',             'Shipper',              'Can not find trusted partners.',                                             'Find trusted execution partners.',                                                false, 42),
  ('both_pilot_and_broker','freight_demand',             'Pilot + Broker',       'The platform shows me the wrong tools for the hat I am wearing today.',      'Switch modes instantly depending on what I need right now.',                       true,  45),
  ('truck_stop',           'support_services',           'Truck Stop',           'Operators do not know I exist.',                                             'Get more operator traffic.',                                                      false, 50),
  ('fuel_provider',        'support_services',           'Fuel Provider',        'Missing corridor demand.',                                                   'Capture corridor demand.',                                                        false, 52),
  ('repair_shop',          'support_services',           'Repair Shop',          'Invisible in urgent moments.',                                               'Be found when operators need urgent help.',                                       false, 54),
  ('tire_service',         'support_services',           'Tire Service',         'Losing urgent jobs to unknown competitors.',                                 'Capture urgent and repeat work.',                                                 false, 56),
  ('hotel_motel',          'support_services',           'Hotel / Motel',        'Missing oversize transport traffic.',                                        'Be discovered by oversize transport traffic.',                                    false, 58),
  ('restaurant_food',      'support_services',           'Food / Restaurant',    'Drivers pass by without stopping.',                                          'Capture operator stops and route traffic.',                                       false, 59),
  ('wash_service',         'support_services',           'Wash / Cleaning Service','Invisible in operator flow.',                                              'Get discovered by operators in corridor flow.',                                   false, 60),
  ('roadside_assistance',  'support_services',           'Roadside Assistance',  'Missing the urgent call.',                                                   'Capture urgent assistance demand.',                                               false, 61),
  ('tow_recovery',         'support_services',           'Tow / Recovery',       'High-value incidents go to competitors.',                                    'Capture high-value urgent incidents.',                                            false, 62),
  ('secure_parking_operator','support_services',         'Secure Parking Operator','Empty bays earning nothing.',                                              'Monetize secure parking inventory.',                                              false, 63),
  ('staging_location_operator','support_services',       'Staging Location Operator','Demand walks past.',                                                     'Monetize staging demand.',                                                        false, 64),
  ('support_partner',      'support_services',           'Support Partner',      'Operators do not know I exist.',                                             'Be found when someone on the corridor needs what I offer.',                       false, 65),
  ('permit_specialist',    'compliance_and_routing',     'Permit Specialist',    'High-intent traffic goes elsewhere.',                                        'Capture permit and compliance demand.',                                           false, 70),
  ('routing_specialist',   'compliance_and_routing',     'Routing Specialist',   'Expertise is undermonetized.',                                               'Sell route expertise.',                                                           false, 72),
  ('compliance_consultant','compliance_and_routing',     'Compliance Consultant','Leads go to generalists.',                                                   'Generate leads from compliance pain.',                                            false, 74),
  ('escort_requirement_advisor','compliance_and_routing','Escort Requirement Advisor','Users guess instead of asking.',                                        'Help users determine escort need and requirements.',                              false, 78),
  ('gear_seller',          'marketplace_and_equipment',  'Gear Seller',          'Niche buyers never find me.',                                                'Sell gear, bundles, and installs to active operators.',                            false, 80),
  ('vehicle_upfitter',     'marketplace_and_equipment',  'Vehicle Upfitter',     'Low volume of qualified fitment demand.',                                    'Book installs and capture niche fitment demand.',                                 false, 82),
  ('parts_supplier',       'marketplace_and_equipment',  'Parts Supplier',       'Recurring buyers shop elsewhere.',                                           'Sell recurring support parts.',                                                   false, 86),
  ('yard_owner',           'property_and_infrastructure','Yard Owner',           'Unused space earning nothing.',                                              'Monetize staging, parking, and storage demand.',                                  false, 90),
  ('land_owner',           'property_and_infrastructure','Land Owner',           'Land sits idle.',                                                            'Turn unused land into transport revenue.',                                        false, 92),
  ('property_manager',     'property_and_infrastructure','Property Manager',     'Spaces underutilized.',                                                      'Fill space with qualified demand.',                                               false, 94),
  ('storage_host',         'property_and_infrastructure','Storage Host',         'Overflow capacity goes to waste.',                                           'Monetize secure storage or overflow capacity.',                                   false, 96),
  ('analyst',              'intelligence_and_enterprise','Analyst',              'No signal, only noise.',                                                     'Get reliable market intelligence.',                                               false, 100),
  ('researcher',           'intelligence_and_enterprise','Researcher',           'Fragmented data.',                                                           'Understand the ecosystem and its movement patterns.',                             false, 102),
  ('enterprise_buyer',     'intelligence_and_enterprise','Enterprise Buyer',     'Unreliable partner visibility.',                                             'Acquire actionable industry data and partner visibility.',                         false, 104),
  ('insurance_partner',    'intelligence_and_enterprise','Insurance Partner',    'Opaque risk landscape.',                                                     'Access risk and transaction opportunities.',                                      false, 108),
  ('observer_researcher',  'intelligence_and_enterprise','Observer / Researcher','No signal, only noise.',                                                     'Get clean maps, trends, and intelligence.',                                       false, 110),
  ('new_operator',         'community_and_training',     'New Operator',         'Do not know where to start.',                                                'Get started and earn safely.',                                                    false, 120),
  ('trainer',              'community_and_training',     'Trainer / Educator',   'Students go elsewhere.',                                                     'Teach, recruit, and build trust.',                                                false, 122),
  ('recruiter',            'community_and_training',     'Recruiter',            'Cannot find qualified people.',                                              'Find qualified people.',                                                          false, 126),
  ('community_member',     'community_and_training',     'Community Member',     'Disconnected from the network.',                                             'Learn, connect, and stay plugged in.',                                            false, 128)
ON CONFLICT (role_key) DO UPDATE SET
  family_key = EXCLUDED.family_key,
  label = EXCLUDED.label,
  core_fear = EXCLUDED.core_fear,
  core_goal = EXCLUDED.core_goal,
  is_dual_mode_capable = EXCLUDED.is_dual_mode_capable,
  sort_order = EXCLUDED.sort_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. MODES
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_modes (mode_key, label, description, color_token, nav_emphasis, sort_order) VALUES
  ('work_mode',        'Work Mode',        'Jobs, loads, earnings, availability',                     'gold',   '["loads","map","inbox"]'::jsonb,                              10),
  ('dispatch_mode',    'Dispatch Mode',    'Find capacity, post loads, verify providers',             'blue',   '["directory","post_load","inbox","escrow"]'::jsonb,            20),
  ('live_mode',        'Live Mode',        'Urgent, recent, real-time opportunities',                 'red',    '["loads","map","inbox"]'::jsonb,                               25),
  ('growth_mode',      'Growth Mode',      'Claim, rank, visibility, more customers',                 'green',  '["directory","profile","leaderboard"]'::jsonb,                 30),
  ('compliance_mode',  'Compliance Mode',  'Rules, permits, escort requirements, calculators',        'amber',  '["permit_calculator","corridors","rate_guides"]'::jsonb,       40),
  ('property_mode',    'Property Mode',    'List, monetize, and promote space',                       'teal',   '["property","directory","inbox"]'::jsonb,                      50),
  ('marketplace_mode', 'Marketplace Mode', 'Sell or buy products and installs',                       'purple', '["marketplace","installers","inbox"]'::jsonb,                  60),
  ('data_mode',        'Data Mode',        'Guides, rates, corridor intelligence, enterprise products','slate', '["rate_guides","corridors","data_products"]'::jsonb,           70),
  ('community_mode',   'Community Mode',   'Networking, learning, social proof, training',            'orange', '["community","leaderboard","inbox"]'::jsonb,                   80)
ON CONFLICT (mode_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  color_token = EXCLUDED.color_token,
  nav_emphasis = EXCLUDED.nav_emphasis,
  sort_order = EXCLUDED.sort_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. INTENTS
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_intents (intent_key, label, description, mode_key, urgency_class, sort_order) VALUES
  ('find_work',        'Find Work',                    'Discover loads, jobs, and opportunities',                   'work_mode',        'medium',  10),
  ('find_work_now',    'Find Work Now',                'Urgent, real-time work matching',                           'live_mode',         'high',    20),
  ('get_positioned',   'Where Should I Go?',           'Positioning intelligence for best opportunities',           'work_mode',         'medium',  25),
  ('check_rates',      'Check Rates',                  'Market rate intelligence and benchmarks',                   'data_mode',         'low',     30),
  ('check_rules',      'Check Rules / Permits',        'Compliance, escort requirements, permit tools',             'compliance_mode',   'medium',  40),
  ('grow_business',    'Get More Customers',           'Increase visibility, ranking, and inbound demand',          'growth_mode',       'medium',  50),
  ('claim_profile',    'Claim / Improve My Profile',   'Claim listing and build verified profile',                  'growth_mode',       'medium',  60),
  ('find_capacity',    'Find Capacity Fast',           'Source operators and escort providers quickly',              'dispatch_mode',     'high',    70),
  ('post_load',        'Post a Load',                  'Create and distribute a load posting',                      'dispatch_mode',     'high',    80),
  ('verify_provider',  'Verify Provider',              'Check credentials, trust, and reliability',                 'dispatch_mode',     'medium',  90),
  ('manage_payment',   'Manage Payment / Escrow',      'Fund, release, or track escrow and payments',               'dispatch_mode',     'medium',  100),
  ('promote_listing',  'Promote My Listing',           'Boost visibility with paid promotion',                      'growth_mode',       'low',     105),
  ('list_property',    'List Property / Space',        'Monetize yards, parking, staging, or storage',              'property_mode',     'low',     110),
  ('sell_products',    'Sell Products / Services',     'List gear, installs, and services in marketplace',          'marketplace_mode',  'low',     120),
  ('buy_data',         'Get Data / Intelligence',      'Access corridor, rate, and market intelligence',            'data_mode',         'low',     130),
  ('network_learn',    'Learn / Network',              'Training, community, mentorship, and social',               'community_mode',    'low',     140),
  ('track_earnings',   'Track Earnings / ROI',         'Monitor revenue, job performance, and platform value',      'work_mode',         'low',     150)
ON CONFLICT (intent_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  mode_key = EXCLUDED.mode_key,
  urgency_class = EXCLUDED.urgency_class,
  sort_order = EXCLUDED.sort_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. PAGE TYPES
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_page_types (page_type_key, label) VALUES
  ('marketing_home',    'Marketing Home'),
  ('marketing_country', 'Country Page'),
  ('marketing_directory','Marketing Directory'),
  ('directory_search',  'Directory Search'),
  ('directory_listing', 'Directory Listing'),
  ('load_board',        'Load Board'),
  ('load_detail',       'Load Detail'),
  ('map',               'Map'),
  ('corridor',          'Corridor'),
  ('rate_guide',        'Rate Guide'),
  ('permit_tool',       'Permit Tool'),
  ('inbox',             'Inbox'),
  ('escrow',            'Escrow'),
  ('profile',           'Profile'),
  ('settings',          'Settings'),
  ('marketplace',       'Marketplace'),
  ('property',          'Property'),
  ('community',         'Community'),
  ('data_products',     'Data Products')
ON CONFLICT (page_type_key) DO UPDATE SET
  label = EXCLUDED.label;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. ACTION CATALOG
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_action_catalog (action_key, label, target_path, target_kind, requires_auth, requires_market_context, is_monetized) VALUES
  ('go_to_load_board_filtered',  'Find Loads Near You',         '/loads',             'route', false, true,  false),
  ('toggle_available_now',       'I''m Available Right Now',    '/loads?mode=live',   'route', true,  true,  false),
  ('claim_profile',              'Claim Your Listing',          '/claim',             'route', false, false, false),
  ('check_local_rates',          'Check Local Rates',           '/rates',             'route', false, true,  false),
  ('check_escort_rules',         'Check Escort Rules',          '/permits',           'route', false, true,  false),
  ('find_available_operators',   'Find Available Operators',    '/directory',         'route', false, true,  false),
  ('post_load',                  'Post a Load',                 '/loads/new',         'route', true,  false, false),
  ('verify_provider',            'Verify Provider',             '/directory',         'route', false, false, false),
  ('fund_escrow',                'Fund Escrow',                 '/escrow',            'route', true,  false, true),
  ('promote_listing',            'Promote My Listing',          '/billing/promote',   'route', true,  false, true),
  ('list_yard',                  'List Your Yard',              '/property/new',      'route', true,  false, false),
  ('open_marketplace_seller',    'Sell Products',               '/marketplace/seller','route', true,  false, false),
  ('open_data_products',         'Explore Data Products',       '/data-products',     'route', false, false, false),
  ('set_service_area',           'Set Your Service Area',       '/profile/service-area','route',true, false, false),
  ('view_earnings',              'View Your Earnings',          '/earnings',          'route', true,  false, false),
  ('upgrade_featured_listing',   'Upgrade to Featured Listing', '/billing/featured',  'route', true,  false, true),
  ('join_community',             'Join the Community',          '/community',         'route', false, false, false),
  ('start_training',             'Start Training',              '/training',          'route', false, false, false)
ON CONFLICT (action_key) DO UPDATE SET
  label = EXCLUDED.label,
  target_path = EXCLUDED.target_path,
  target_kind = EXCLUDED.target_kind,
  requires_auth = EXCLUDED.requires_auth,
  requires_market_context = EXCLUDED.requires_market_context,
  is_monetized = EXCLUDED.is_monetized;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. COMPLETION GATES
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_completion_gates (gate_key, label, gate_type, sort_order) VALUES
  ('claimed_profile',            'Claimed Profile',             'activation',  10),
  ('set_service_area',           'Set Service Area',            'activation',  20),
  ('verified_identity',          'Verified Identity',           'trust',       30),
  ('posted_first_load',          'Posted First Load',           'activation',  40),
  ('responded_to_first_load',    'Responded To First Load',     'activation',  50),
  ('added_rate_info',            'Added Rate Information',      'enrichment',  55),
  ('added_listing_photos',       'Added Listing Photos',        'enrichment',  58),
  ('added_hours_services',       'Added Hours & Services',      'enrichment',  60),
  ('connected_payment',          'Connected Payment',           'monetization',70),
  ('funded_escrow',              'Funded Escrow',               'monetization',75),
  ('completed_first_transaction','Completed First Transaction', 'monetization',80),
  ('listed_property',            'Listed Property',             'activation',  85)
ON CONFLICT (gate_key) DO UPDATE SET
  label = EXCLUDED.label,
  gate_type = EXCLUDED.gate_type,
  sort_order = EXCLUDED.sort_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. ROLE-INTENT MAPPINGS (which intents each role can access)
-- ═══════════════════════════════════════════════════════════════════════════

-- Pilot Car Operator
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('pilot_car_operator', 'find_work',     true,  10),
  ('pilot_car_operator', 'find_work_now', false, 20),
  ('pilot_car_operator', 'get_positioned',false, 25),
  ('pilot_car_operator', 'check_rates',   false, 30),
  ('pilot_car_operator', 'check_rules',   false, 40),
  ('pilot_car_operator', 'grow_business', false, 50),
  ('pilot_car_operator', 'claim_profile', false, 60),
  ('pilot_car_operator', 'track_earnings',false, 70)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Escort Driver
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('escort_driver', 'find_work',     true,  10),
  ('escort_driver', 'find_work_now', false, 20),
  ('escort_driver', 'get_positioned',false, 25),
  ('escort_driver', 'check_rules',   false, 30),
  ('escort_driver', 'grow_business', false, 40),
  ('escort_driver', 'claim_profile', false, 50)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Heavy Haul Driver
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('heavy_haul_driver', 'find_work',       true,  10),
  ('heavy_haul_driver', 'get_positioned',  false, 20),
  ('heavy_haul_driver', 'check_rules',     false, 30),
  ('heavy_haul_driver', 'manage_payment',  false, 40),
  ('heavy_haul_driver', 'track_earnings',  false, 50)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Owner Operator
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('owner_operator', 'find_work',      true,  10),
  ('owner_operator', 'grow_business',  false, 20),
  ('owner_operator', 'claim_profile',  false, 30),
  ('owner_operator', 'track_earnings', false, 40),
  ('owner_operator', 'check_rates',    false, 50),
  ('owner_operator', 'manage_payment', false, 60)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Fleet / Team
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('fleet_team', 'find_work',      true,  10),
  ('fleet_team', 'grow_business',  false, 20),
  ('fleet_team', 'claim_profile',  false, 30),
  ('fleet_team', 'track_earnings', false, 40),
  ('fleet_team', 'manage_payment', false, 50)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Broker
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('broker', 'find_capacity',   true,  10),
  ('broker', 'post_load',       false, 20),
  ('broker', 'verify_provider', false, 30),
  ('broker', 'manage_payment',  false, 40),
  ('broker', 'check_rates',     false, 50),
  ('broker', 'check_rules',     false, 60)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Dispatcher
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('dispatcher', 'find_capacity',   true,  10),
  ('dispatcher', 'post_load',       false, 20),
  ('dispatcher', 'verify_provider', false, 30),
  ('dispatcher', 'manage_payment',  false, 40)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Load Planner
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('load_planner', 'find_capacity',   true,  10),
  ('load_planner', 'check_rules',     false, 20),
  ('load_planner', 'verify_provider', false, 30),
  ('load_planner', 'manage_payment',  false, 40)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Project Manager
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('project_manager', 'find_capacity',   true,  10),
  ('project_manager', 'verify_provider', false, 20),
  ('project_manager', 'check_rules',     false, 30),
  ('project_manager', 'manage_payment',  false, 40),
  ('project_manager', 'buy_data',        false, 50)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Shipper
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('shipper', 'find_capacity',   true,  10),
  ('shipper', 'verify_provider', false, 20),
  ('shipper', 'manage_payment',  false, 30),
  ('shipper', 'buy_data',        false, 40)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Pilot + Broker (dual mode)
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('both_pilot_and_broker', 'find_work',      false, 10),
  ('both_pilot_and_broker', 'find_capacity',  false, 20),
  ('both_pilot_and_broker', 'post_load',      false, 30),
  ('both_pilot_and_broker', 'check_rules',    false, 40),
  ('both_pilot_and_broker', 'manage_payment', false, 50)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Support Partner (generic)
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('support_partner', 'claim_profile',   true,  10),
  ('support_partner', 'grow_business',   false, 20),
  ('support_partner', 'promote_listing', false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Truck Stop
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('truck_stop', 'claim_profile',   true,  10),
  ('truck_stop', 'promote_listing', false, 20),
  ('truck_stop', 'grow_business',   false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Repair Shop
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('repair_shop', 'claim_profile', true,  10),
  ('repair_shop', 'grow_business', false, 20),
  ('repair_shop', 'promote_listing', false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Yard Owner
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('yard_owner', 'list_property',   true,  10),
  ('yard_owner', 'grow_business',   false, 20),
  ('yard_owner', 'promote_listing', false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Land Owner
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('land_owner', 'list_property', true,  10),
  ('land_owner', 'grow_business', false, 20)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Property Manager
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('property_manager', 'list_property',   true,  10),
  ('property_manager', 'promote_listing', false, 20)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Storage Host
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('storage_host', 'list_property', true,  10),
  ('storage_host', 'grow_business', false, 20)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Permit Specialist
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('permit_specialist', 'claim_profile', true,  10),
  ('permit_specialist', 'grow_business', false, 20),
  ('permit_specialist', 'check_rules',   false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Routing Specialist
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('routing_specialist', 'claim_profile', true,  10),
  ('routing_specialist', 'grow_business', false, 20),
  ('routing_specialist', 'buy_data',      false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Compliance Consultant
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('compliance_consultant', 'claim_profile', true,  10),
  ('compliance_consultant', 'grow_business', false, 20),
  ('compliance_consultant', 'check_rules',   false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Gear Seller
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('gear_seller', 'sell_products',   true,  10),
  ('gear_seller', 'promote_listing', false, 20),
  ('gear_seller', 'grow_business',   false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Vehicle Upfitter
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('vehicle_upfitter', 'sell_products', true,  10),
  ('vehicle_upfitter', 'grow_business', false, 20),
  ('vehicle_upfitter', 'promote_listing', false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Parts Supplier
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('parts_supplier', 'sell_products',   true,  10),
  ('parts_supplier', 'promote_listing', false, 20)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Analyst
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('analyst', 'buy_data',     true,  10),
  ('analyst', 'check_rates',  false, 20),
  ('analyst', 'network_learn',false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Researcher
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('researcher', 'buy_data',      true,  10),
  ('researcher', 'network_learn', false, 20)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Enterprise Buyer
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('enterprise_buyer', 'buy_data',        true,  10),
  ('enterprise_buyer', 'verify_provider', false, 20),
  ('enterprise_buyer', 'check_rates',     false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Insurance Partner
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('insurance_partner', 'buy_data',        true,  10),
  ('insurance_partner', 'verify_provider', false, 20),
  ('insurance_partner', 'manage_payment',  false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Observer / Researcher
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('observer_researcher', 'buy_data',    true,  10),
  ('observer_researcher', 'check_rates', false, 20)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- New Operator
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('new_operator', 'find_work',      true,  10),
  ('new_operator', 'check_rules',    false, 20),
  ('new_operator', 'network_learn',  false, 30),
  ('new_operator', 'claim_profile',  false, 40)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Trainer
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('trainer', 'network_learn',  true,  10),
  ('trainer', 'grow_business',  false, 20),
  ('trainer', 'claim_profile',  false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Recruiter
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('recruiter', 'find_capacity',  true,  10),
  ('recruiter', 'network_learn',  false, 20),
  ('recruiter', 'grow_business',  false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- Community Member
INSERT INTO public.hc_role_intents (role_key, intent_key, is_primary, sort_order) VALUES
  ('community_member', 'network_learn',  true,  10),
  ('community_member', 'check_rules',    false, 20),
  ('community_member', 'grow_business',  false, 30)
ON CONFLICT (role_key, intent_key, stage_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. ROUTE PATTERNS
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_route_patterns (route_pattern, page_type_key, priority_rank) VALUES
  ('/',                       'marketing_home',     100),
  ('/countries/:country',     'marketing_country',  100),
  ('/directory',              'directory_search',   100),
  ('/directory/:slug',        'directory_listing',  110),
  ('/loads',                  'load_board',         100),
  ('/loads/:id',              'load_detail',        110),
  ('/map',                    'map',                100),
  ('/corridors/:slug',        'corridor',           100),
  ('/rates',                  'rate_guide',         100),
  ('/permits',                'permit_tool',        100),
  ('/inbox',                  'inbox',              100),
  ('/escrow',                 'escrow',             100),
  ('/profile',                'profile',            100),
  ('/settings',               'settings',           100),
  ('/property',               'property',           100),
  ('/property/new',           'property',           110),
  ('/marketplace',            'marketplace',        100),
  ('/marketplace/seller',     'marketplace',        110),
  ('/data-products',          'data_products',      100),
  ('/community',              'community',          100),
  ('/claim',                  'directory_listing',  90),
  ('/billing/promote',        'profile',            90),
  ('/billing/featured',       'profile',            90)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. NEXT-MOVE RULES (first live batch)
-- ═══════════════════════════════════════════════════════════════════════════

-- Pilot Car Operator rules
INSERT INTO public.hc_next_move_rules (role_key, intent_key, mode_key, page_type_key, priority_rank, primary_action_key, secondary_action_keys, helper_copy) VALUES
  ('pilot_car_operator', 'find_work',     'work_mode',   'marketing_home',  10, 'go_to_load_board_filtered', '["claim_profile","check_local_rates"]'::jsonb,          'Loads are moving. Are you on one?'),
  ('pilot_car_operator', 'find_work_now', 'live_mode',   'load_board',      10, 'toggle_available_now',      '["check_local_rates","check_escort_rules"]'::jsonb,     'Show brokers you are ready right now.'),
  ('pilot_car_operator', 'grow_business', 'growth_mode', 'directory_listing',10,'claim_profile',             '["promote_listing","check_local_rates"]'::jsonb,        'Get found, get ranked, get called.'),
  ('pilot_car_operator', 'check_rates',   'data_mode',   'rate_guide',      10, 'check_local_rates',         '["go_to_load_board_filtered","claim_profile"]'::jsonb,  'Know what the market pays before you commit.'),
  ('pilot_car_operator', 'check_rules',   'compliance_mode','permit_tool',  10, 'check_escort_rules',        '["go_to_load_board_filtered","claim_profile"]'::jsonb,  'Stay compliant. Stay legal. Stay earning.'),
  ('pilot_car_operator', 'find_work',     'work_mode',   'load_board',      10, 'go_to_load_board_filtered', '["toggle_available_now","check_local_rates"]'::jsonb,   'Filter by your service area.'),
  ('pilot_car_operator', 'find_work',     'work_mode',   'map',             10, 'go_to_load_board_filtered', '["toggle_available_now","check_escort_rules"]'::jsonb,  'See where the work is moving.')
ON CONFLICT DO NOTHING;

-- Broker rules
INSERT INTO public.hc_next_move_rules (role_key, intent_key, mode_key, page_type_key, priority_rank, primary_action_key, secondary_action_keys, helper_copy) VALUES
  ('broker', 'find_capacity',  'dispatch_mode', 'marketing_home',  10, 'find_available_operators',  '["post_load","verify_provider"]'::jsonb,                'What state? Let us find your pilot car.'),
  ('broker', 'post_load',      'dispatch_mode', 'directory_search', 10,'post_load',                 '["find_available_operators","verify_provider"]'::jsonb,  'Move freight faster with a better roster.'),
  ('broker', 'manage_payment', 'dispatch_mode', 'escrow',          10, 'fund_escrow',               '["verify_provider","post_load"]'::jsonb,                'Lock in execution and reduce risk.'),
  ('broker', 'find_capacity',  'dispatch_mode', 'load_board',      10, 'find_available_operators',  '["post_load","check_escort_rules"]'::jsonb,             'Browse available operators by market.'),
  ('broker', 'verify_provider','dispatch_mode', 'directory_listing',10,'verify_provider',           '["post_load","find_available_operators"]'::jsonb,        'Check credentials before you commit.')
ON CONFLICT DO NOTHING;

-- Support Partner rules
INSERT INTO public.hc_next_move_rules (role_key, intent_key, mode_key, page_type_key, priority_rank, primary_action_key, secondary_action_keys, helper_copy) VALUES
  ('support_partner', 'grow_business',  'growth_mode', 'marketing_home',   10, 'claim_profile',   '["promote_listing","go_to_load_board_filtered"]'::jsonb, 'Get in front of active operators moving through your corridor.'),
  ('support_partner', 'claim_profile',  'growth_mode', 'directory_listing', 10, 'claim_profile',   '["promote_listing","set_service_area"]'::jsonb,          'This listing could be yours. Claim it now.'),
  ('support_partner', 'promote_listing','growth_mode', 'profile',          10, 'promote_listing',  '["claim_profile","set_service_area"]'::jsonb,            'Boost your visibility in corridor results.')
ON CONFLICT DO NOTHING;

-- Yard Owner rules
INSERT INTO public.hc_next_move_rules (role_key, intent_key, mode_key, page_type_key, priority_rank, primary_action_key, secondary_action_keys, helper_copy) VALUES
  ('yard_owner', 'list_property',  'property_mode', 'property',        10, 'list_yard',       '["promote_listing","claim_profile"]'::jsonb,    'Turn unused space into heavy-haul revenue.'),
  ('yard_owner', 'list_property',  'property_mode', 'marketing_home',  10, 'list_yard',       '["claim_profile","promote_listing"]'::jsonb,    'Your yard could be earning right now.'),
  ('yard_owner', 'grow_business',  'growth_mode',   'directory_listing',10,'claim_profile',   '["promote_listing","list_yard"]'::jsonb,         'Claim your listing, then promote it.')
ON CONFLICT DO NOTHING;

-- Gear Seller rules
INSERT INTO public.hc_next_move_rules (role_key, intent_key, mode_key, page_type_key, priority_rank, primary_action_key, secondary_action_keys, helper_copy) VALUES
  ('gear_seller', 'sell_products', 'marketplace_mode', 'marketplace',     10, 'open_marketplace_seller', '["promote_listing","claim_profile"]'::jsonb,  'Put your products in front of active buyers.'),
  ('gear_seller', 'sell_products', 'marketplace_mode', 'marketing_home',  10, 'open_marketplace_seller', '["claim_profile","promote_listing"]'::jsonb,  'Operators are shopping. Are you listed?')
ON CONFLICT DO NOTHING;

-- Observer / Researcher rules
INSERT INTO public.hc_next_move_rules (role_key, intent_key, mode_key, page_type_key, priority_rank, primary_action_key, secondary_action_keys, helper_copy) VALUES
  ('observer_researcher', 'buy_data',    'data_mode', 'data_products',   10, 'open_data_products',  '["check_local_rates","check_escort_rules"]'::jsonb,  'Get signal, not noise.'),
  ('observer_researcher', 'check_rates', 'data_mode', 'rate_guide',      10, 'check_local_rates',   '["open_data_products","check_escort_rules"]'::jsonb,  'Real rates from real moves.')
ON CONFLICT DO NOTHING;

-- New Operator rules
INSERT INTO public.hc_next_move_rules (role_key, intent_key, mode_key, page_type_key, priority_rank, primary_action_key, secondary_action_keys, helper_copy) VALUES
  ('new_operator', 'find_work',     'work_mode',       'marketing_home',  10, 'go_to_load_board_filtered', '["claim_profile","start_training"]'::jsonb,       'Your first load is waiting.'),
  ('new_operator', 'network_learn', 'community_mode',  'community',       10, 'join_community',            '["start_training","claim_profile"]'::jsonb,       'Learn from operators who have been where you are.'),
  ('new_operator', 'check_rules',   'compliance_mode', 'permit_tool',     10, 'check_escort_rules',        '["go_to_load_board_filtered","claim_profile"]'::jsonb, 'Know the rules before you hit the road.')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. ROLE ALIASES (first live aliases for top roles)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.hc_role_aliases (role_key, country_code, language_code, alias_text, alias_type, sort_order) VALUES
  ('pilot_car_operator', 'US', 'en', 'pilot car',                 'common',    10),
  ('pilot_car_operator', 'US', 'en', 'escort driver',             'common',    20),
  ('pilot_car_operator', 'US', 'en', 'escort vehicle operator',   'formal',    30),
  ('pilot_car_operator', 'US', 'en', 'pace car',                  'regional',  40),
  ('pilot_car_operator', 'US', 'en', 'warning car',               'regional',  50),
  ('pilot_car_operator', 'AU', 'en', 'pilot vehicle',             'common',    10),
  ('pilot_car_operator', 'AU', 'en', 'escort vehicle',            'common',    20),
  ('pilot_car_operator', 'GB', 'en', 'escort vehicle',            'common',    10),
  ('pilot_car_operator', 'CA', 'en', 'pilot vehicle',             'common',    10),
  ('pilot_car_operator', 'CA', 'fr', 'véhicule pilote',           'common',    10),
  ('heavy_haul_driver',  'GB', 'en', 'abnormal load driver',      'common',    10),
  ('heavy_haul_driver',  'AU', 'en', 'oversize load driver',      'common',    10),
  ('broker',             'US', 'en', 'freight broker',             'common',    10),
  ('broker',             'US', 'en', 'load broker',               'common',    20),
  ('dispatcher',         'US', 'en', 'dispatch',                  'common',    10),
  ('dispatcher',         'US', 'en', 'load coordinator',          'common',    20),
  ('compliance_consultant','DE','de','Grossraum- und Schwertransport Beratung','common', 10)
ON CONFLICT DO NOTHING;

COMMIT;
