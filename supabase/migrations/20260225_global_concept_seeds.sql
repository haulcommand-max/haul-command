-- ============================================================================
-- Seed: Top 100 Global Concepts + Australia Mining/Wind Term Variants
-- Run AFTER 20260225_global_concepts.sql
-- ============================================================================

-- ── CORE LOAD TYPES ──────────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('oversize-load',           'Oversize / Abnormal Load',         'A vehicle and/or load exceeding standard legal dimensions or weight requiring special routing, permits, or escorts.', 'core', 100),
('overweight-load',         'Overweight Load',                  'A load exceeding legal weight limits, requiring weight-specific permits and potentially reinforced routing.', 'core', 95),
('overdimension-load',      'Overdimension Load',               'A load exceeding standard dimensional limits in width, height, or length.', 'core', 93),
('abnormal-load',           'Abnormal Load',                    'UK/AU term for a load that cannot be transported without special authorization due to size or weight.', 'core', 92),
('superload',               'Superload / Special Movement',     'Extremely large or heavy move requiring engineering review and special authorization.', 'permits', 90),
('project-cargo',           'Project Cargo',                    'Specialized freight for industrial projects — power plants, refineries, wind farms, mining.', 'project_cargo', 88),
('heavy-haul',              'Heavy Haul',                       'Transport of loads exceeding standard weight and/or dimensional limits, requiring specialized equipment and planning.', 'core', 96),
('extra-legal-vehicle',     'Extra-Legal Vehicle',              'A vehicle operating beyond standard legal size/weight under special permit authority.', 'core', 70),
('non-divisible-load',      'Non-Divisible Load',               'A load that cannot be reasonably separated into smaller components for transport.', 'core', 80),
('divisible-load',          'Divisible Load',                   'A load that could be separated into smaller legal loads but is transported whole for efficiency.', 'core', 65)
on conflict (concept_slug) do nothing;

-- ── ESCORT OPERATIONS ────────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('pilot-escort-vehicle',    'Pilot / Escort Vehicle',           'A vehicle assigned to guide and warn traffic around oversize or abnormal loads.', 'escort', 98),
('lead-escort',             'Lead Escort',                      'Escort vehicle positioned ahead of the oversize load to warn oncoming traffic and scout clearances.', 'escort', 85),
('rear-escort',             'Rear Escort',                      'Escort vehicle following behind the oversize load to protect against rear-end collisions.', 'escort', 84),
('high-pole-escort',        'High-Pole Escort',                 'Escort vehicle equipped with a height pole to detect overhead obstructions before the load arrives.', 'escort', 82),
('leapfrogging',            'Leapfrogging',                     'Escort technique where vehicles alternate positions at intersections or obstacles.', 'escort', 60),
('traffic-break',           'Traffic Break',                    'Temporary halt of traffic flow to allow safe passage of an oversize load.', 'escort', 75),
('rolling-roadblock',       'Rolling Roadblock',                'Mobile traffic control where escort vehicles slow or stop lanes of traffic progressively.', 'escort', 72),
('lane-control',            'Lane Control',                     'Managing traffic lanes to create safe passage for oversize loads.', 'escort', 70),
('center-up',               'Center Up',                        'Positioning the oversize load in the center of the roadway for safe passage.', 'escort', 55),
('spotter',                 'Spotter',                          'Person providing visual guidance during tight-clearance or complex maneuvers.', 'escort', 60)
on conflict (concept_slug) do nothing;

-- ── PERMITS & COMPLIANCE ─────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('oversize-permit',         'Oversize Permit',                  'Legal authorization to transport a load exceeding standard dimensional limits.', 'permits', 94),
('overweight-permit',       'Overweight Permit',                'Legal authorization to transport a load exceeding standard weight limits.', 'permits', 91),
('annual-permit',           'Annual Permit',                    'Permit valid for one year covering repeated oversize/overweight movements.', 'permits', 75),
('single-trip-permit',      'Single-Trip Permit',               'Permit authorizing one specific oversize/overweight movement.', 'permits', 80),
('regional-permit',         'Regional Permit',                  'Permit covering a multi-state or multi-province region.', 'permits', 60),
('permit-amendment',        'Permit Amendment',                 'Modification to an existing oversize/overweight permit.', 'permits', 50),
('permit-curfew',           'Permit Curfew',                    'Time restrictions prohibiting oversize load movement during specific hours.', 'permits', 65),
('travel-restrictions',     'Travel Restrictions',              'Conditions limiting when and where oversize loads can operate.', 'permits', 70),
('holiday-restrictions',    'Holiday Restrictions',             'Prohibition on oversize load movement during public holidays and peak traffic periods.', 'permits', 68),
('route-survey',            'Route Survey',                     'Physical or digital assessment of a planned oversize load route for clearance and safety.', 'permits', 78)
on conflict (concept_slug) do nothing;

-- ── DIMENSIONS ───────────────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('legal-height',            'Legal Height',                     'Maximum height a vehicle can be without requiring an oversize permit.', 'dimensions', 72),
('legal-width',             'Legal Width',                      'Maximum width a vehicle can be without requiring an oversize permit.', 'dimensions', 73),
('legal-length',            'Legal Length',                     'Maximum length a vehicle combination can be without requiring an oversize permit.', 'dimensions', 71),
('rear-overhang',           'Rear Overhang',                    'Distance a load extends beyond the rear of the trailer.', 'dimensions', 55),
('front-overhang',          'Front Overhang',                   'Distance a load extends beyond the front of the vehicle.', 'dimensions', 54),
('axle-spacing',            'Axle Spacing',                     'Distance between axle centers, critical for bridge weight calculations.', 'dimensions', 60),
('tandem-axle',             'Tandem Axle',                      'Two axle assembly sharing a common suspension system.', 'dimensions', 50),
('tridem-axle',             'Tridem Axle',                      'Three axle assembly with shared suspension, used on heavy-haul trailers.', 'dimensions', 48),
('gross-vehicle-weight',    'Gross Vehicle Weight',             'Total weight of vehicle plus load, cargo, fuel, and occupants.', 'dimensions', 80),
('bridge-formula',          'Bridge Formula',                   'Mathematical formula determining allowable weight based on axle configuration and spacing.', 'dimensions', 68)
on conflict (concept_slug) do nothing;

-- ── TRAILERS & EQUIPMENT ─────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('lowboy',                  'Lowboy',                           'Low-deck trailer designed for hauling tall equipment within legal height limits.', 'equipment', 82),
('rgn-trailer',             'RGN Trailer',                      'Removable Gooseneck trailer allowing front-loading of heavy equipment.', 'equipment', 78),
('step-deck',               'Step Deck',                        'Trailer with a lower rear deck for taller cargo accommodation.', 'equipment', 75),
('multi-axle-trailer',      'Multi-Axle Trailer',               'Trailer with additional axles for distributing heavy loads across more contact points.', 'equipment', 70),
('jeep-dolly',              'Jeep & Dolly',                     'Additional axle assemblies added to redistribute load weight.', 'equipment', 55),
('booster',                 'Booster',                          'Rear axle trailer extension used to distribute weight on heavy hauls.', 'equipment', 52),
('steerable-axle',          'Steerable Axle',                   'Axle that can be turned to improve maneuverability on multi-axle loads.', 'equipment', 60),
('tillerman',               'Tillerman / Steerperson',          'Person steering the rear of a long load through tight turns and obstacles.', 'equipment', 58),
('steerperson',             'Steerperson',                      'Operator responsible for rear-steer control on oversize loads.', 'equipment', 57),
('truck-tractor',           'Truck Tractor',                    'Power unit designed to pull trailers carrying freight.', 'equipment', 65)
on conflict (concept_slug) do nothing;

-- ── TRAFFIC CONTROL ──────────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('mutcd',                   'MUTCD',                            'Manual on Uniform Traffic Control Devices — US federal standard for traffic signs, signals, and markings.', 'traffic_control', 65),
('traffic-control-plan',    'Traffic Control Plan',             'Formal routing and traffic management plan for complex moves.', 'traffic_control', 76),
('temporary-traffic-control','Temporary Traffic Control',       'Short-term traffic management setup for construction, moves, or emergencies.', 'traffic_control', 62),
('flagger',                 'Flagger',                          'Person directing traffic with flags or signs at a work zone or oversize load crossing.', 'traffic_control', 68),
('flagging-operations',     'Flagging Operations',              'Coordinated traffic direction at intersections or narrow passages for oversize loads.', 'traffic_control', 66),
('lane-closure',            'Lane Closure',                     'Temporarily closing one or more traffic lanes for oversize load passage.', 'traffic_control', 64),
('detour-route',            'Detour Route',                     'Alternative route used when primary route cannot accommodate the oversize load.', 'traffic_control', 55),
('safe-haven',              'Safe Haven / Pull-Out',            'Designated area where an oversize load can safely pull off the roadway.', 'traffic_control', 58),
('staging-area',            'Staging Area',                     'Location where oversize loads assemble before beginning their permitted route.', 'traffic_control', 60),
('pull-out',                'Pull-Out',                         'Act of pulling an oversize load off the roadway to let traffic pass or during curfew.', 'traffic_control', 53)
on conflict (concept_slug) do nothing;

-- ── ROAD GEOMETRY ────────────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('divided-highway',         'Divided Highway',                  'Highway with a physical barrier or median separating opposing traffic flows.', 'road_geometry', 50),
('undivided-highway',       'Undivided Highway',                'Highway without a physical separation between opposing traffic.', 'road_geometry', 48),
('multilane-highway',       'Multilane Highway',                'Highway with two or more lanes in each direction.', 'road_geometry', 46),
('two-lane-highway',        'Two-Lane Highway',                 'Highway with one lane in each direction, common in rural areas.', 'road_geometry', 47),
('gore-strip',              'Gore Strip',                       'Triangular area between a highway exit ramp and the main road.', 'road_geometry', 30),
('fog-line',                'Fog Line',                         'White line marking the edge of the travel lane.', 'road_geometry', 32),
('zipper-merge',            'Zipper Merge',                     'Merging technique where vehicles alternate from two lanes into one.', 'road_geometry', 28),
('pork-chop-island',        'Pork Chop Island',                 'Triangular raised traffic island at intersection corners.', 'road_geometry', 25),
('skinny-bridge',           'Skinny Bridge',                    'Narrow bridge that may require lane centering for oversize loads.', 'road_geometry', 40),
('clearance-point',         'Clearance Point',                  'Location where overhead or lateral clearance is at its minimum.', 'road_geometry', 55)
on conflict (concept_slug) do nothing;

-- ── PORT & SECURITY ──────────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('twic-card',               'TWIC Card',                        'Transportation Worker Identification Credential required for unescorted access to secure port areas.', 'port', 60),
('secure-area',             'Secure Area',                      'Restricted zone within a port or terminal requiring credentialed access.', 'port', 45),
('port-escort',             'Port Escort',                      'Escort service specifically for oversize movements within port/terminal boundaries.', 'port', 55),
('terminal-appointment',    'Terminal Appointment',              'Scheduled time slot for cargo pickup or delivery at a port terminal.', 'port', 50),
('drayage',                 'Drayage',                          'Short-distance freight transport, typically between a port and nearby warehouse.', 'port', 52),
('bonded-cargo',            'Bonded Cargo',                     'Imported goods held under customs bond until duties are paid.', 'port', 35),
('customs-hold',            'Customs Hold',                     'Delay in cargo release due to customs inspection or documentation issues.', 'port', 38),
('port-congestion',         'Port Congestion',                  'Operational delays at a port due to high traffic volumes.', 'port', 42),
('yard-move',               'Yard Move',                        'Movement of cargo within a port or terminal yard area.', 'port', 30),
('gate-appointment',        'Gate Appointment',                 'Scheduled arrival time at a port gate for container pickup or delivery.', 'port', 32)
on conflict (concept_slug) do nothing;

-- ── RADIO & FIELD LINGO ──────────────────────────────────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('alligators',              'Alligators',                       'Trucker slang for tire treads or debris on the roadway.', 'lingo', 20),
('bear',                    'Bear',                             'CB radio slang for law enforcement officer.', 'lingo', 18),
('bumpin-up',               'Bumpin'' Up',                      'Escort call indicating the load is approaching an obstacle or intersection.', 'lingo', 25),
('drop-down',               'Drop Down',                        'Instruction to lower height pole or reduce speed for clearance.', 'lingo', 22),
('clean-on-ramp',           'Clean On-Ramp',                    'On-ramp clear of traffic; safe for oversize load to enter highway.', 'lingo', 28),
('dirty-on-ramp',           'Dirty On-Ramp',                    'On-ramp occupied by traffic; oversize load should hold or use caution.', 'lingo', 27),
('back-off',                'Back Off',                         'Instruction for escort or following traffic to increase distance.', 'lingo', 24),
('steppin-out',             'Steppin'' Out',                    'Escort call indicating they are moving into traffic to control flow.', 'lingo', 23),
('left-track',              'Left Track',                       'Instruction for load to track to the left side of the lane.', 'lingo', 26),
('right-track',             'Right Track',                      'Instruction for load to track to the right side of the lane.', 'lingo', 26)
on conflict (concept_slug) do nothing;

-- ── AU-SPECIFIC CONCEPTS (MINING / WIND / REMOTE) ───────────────────────────
insert into public.glossary_concepts (concept_slug, concept_name, concept_description, category, global_priority) values
('nhvr',                    'NHVR (National Heavy Vehicle Regulator)', 'Australia''s national body regulating heavy vehicle access, permits, and compliance.', 'regulatory', 85),
('class-1-heavy-vehicle',   'Class 1 Heavy Vehicle',             'NHVR classification covering oversize/overmass vehicles requiring specific access approval.', 'permits', 80),
('wind-turbine-transport',  'Wind Turbine Transport',            'Movement of wind energy components — blades, nacelles, and tower sections.', 'project_cargo', 78),
('mine-site-delivery',      'Mine Site Delivery',                'Final-mile heavy haul movement into active mining operations.', 'mining', 75),
('remote-area-haul',        'Remote Area Heavy Haul',            'Transport operations across sparsely populated or undeveloped regions.', 'operations', 65),
('police-escort',           'Police Escort',                     'Law enforcement escort required for specific oversize load categories.', 'escort', 70),
('notification-period',     'Notification Period',               'Required advance notice before moving an oversize or abnormal load.', 'permits', 55),
('escort-level',            'Escort Level / Class',              'Classification of escort requirements based on load size and route.', 'escort', 62)
on conflict (concept_slug) do nothing;

-- ── US CORE TERM VARIANTS ────────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, noindex) values
('oversize-load',       'US', 'en-US', 'oversize load',        true, '{"OSOW","overweight load","oversized load"}', false),
('pilot-escort-vehicle','US', 'en-US', 'pilot car',            true, '{"escort vehicle","escort car","pilot vehicle"}', false),
('superload',           'US', 'en-US', 'superload',            true, '{"super load","super-load"}', false),
('heavy-haul',          'US', 'en-US', 'heavy haul',           true, '{"heavy haul trucking","heavy haul transport"}', false),
('oversize-permit',     'US', 'en-US', 'oversize permit',      true, '{"OS/OW permit","overweight permit"}', false),
('route-survey',        'US', 'en-US', 'route survey',         true, '{"route assessment"}', false),
('traffic-control-plan','US', 'en-US', 'traffic control plan', true, '{"TCP"}', false)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── CA TERM VARIANTS ─────────────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, noindex) values
('oversize-load',       'CA', 'en-CA', 'oversize load',         true, '{"oversized load","overweight load"}', false),
('pilot-escort-vehicle','CA', 'en-CA', 'pilot car',             true, '{"escort vehicle"}', false),
('oversize-load',       'CA', 'fr-CA', 'chargement surdimensionné', true, '{}', true),
('pilot-escort-vehicle','CA', 'fr-CA', 'véhicule d''escorte',   true, '{}', true),
('superload',           'CA', 'fr-CA', 'convoi exceptionnel',   true, '{}', true),
('traffic-control-plan','CA', 'fr-CA', 'plan de gestion de la circulation', true, '{}', true),
('route-survey',        'CA', 'fr-CA', 'étude d''itinéraire',   true, '{}', true)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── AU TERM VARIANTS (MINING / WIND / REMOTE FOCUSED) ───────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('oversize-load',           'AU', 'en-AU', 'oversize load',             true,  '{"overmass load","overdimension vehicle","OSOM"}', null, false),
('pilot-escort-vehicle',    'AU', 'en-AU', 'pilot vehicle',             true,  '{"escort vehicle","pilot car"}', null, false),
('superload',               'AU', 'en-AU', 'Class 1 heavy vehicle',     false, '{"NHVR Class 1"}', 'Common under NHVR classification', false),
('heavy-haul',              'AU', 'en-AU', 'heavy haul',                true,  '{"mining heavy haul","resource sector transport"}', null, false),
('oversize-permit',         'AU', 'en-AU', 'NHVR access permit',        true,  '{"NHVR oversize permit","NHVR OSOM permit"}', null, false),
('route-survey',            'AU', 'en-AU', 'route assessment',          true,  '{"heavy vehicle route assessment"}', null, false),
('traffic-control-plan',    'AU', 'en-AU', 'traffic management plan',   true,  '{"TMP"}', null, false),
('safe-haven',              'AU', 'en-AU', 'approved rest area',        true,  '{"approved parking location"}', null, false),
('high-pole-escort',        'AU', 'en-AU', 'height pole escort',        true,  '{}', null, false),
('nhvr',                    'AU', 'en-AU', 'NHVR',                      true,  '{"National Heavy Vehicle Regulator","NHVR permit system"}', null, false),
('class-1-heavy-vehicle',   'AU', 'en-AU', 'Class 1 heavy vehicle',     true,  '{}', null, false),
('wind-turbine-transport',  'AU', 'en-AU', 'wind turbine transport',    true,  '{"wind blade transport","wind blade haulage","nacelle transport","tower section transport"}', null, false),
('mine-site-delivery',      'AU', 'en-AU', 'mine site delivery',        true,  '{"mine haul delivery"}', null, false),
('remote-area-haul',        'AU', 'en-AU', 'remote heavy haul',         true,  '{"outback transport"}', null, false),
('staging-area',            'AU', 'en-AU', 'laydown yard',              true,  '{}', null, false),
('traffic-break',           'AU', 'en-AU', 'rolling traffic hold',      true,  '{}', null, false)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── GB TERM VARIANTS ─────────────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('oversize-load',           'GB', 'en-GB', 'abnormal load',             true,  '{"abnormal transport","STGO load"}', null, false),
('pilot-escort-vehicle',    'GB', 'en-GB', 'escort vehicle',            true,  '{"private escort"}', null, false),
('superload',               'GB', 'en-GB', 'STGO Category 3 load',     true,  '{}', 'UK Special Types General Order', false),
('oversize-permit',         'GB', 'en-GB', 'movement order',            true,  '{}', null, false),
('route-survey',            'GB', 'en-GB', 'route notification survey', true,  '{}', null, false),
('traffic-control-plan',    'GB', 'en-GB', 'traffic management plan',   true,  '{}', null, false),
('police-escort',           'GB', 'en-GB', 'police escort',             true,  '{}', null, false),
('abnormal-load',           'GB', 'en-GB', 'Special Types General Order', true, '{"STGO"}', null, false)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── NZ TERM VARIANTS ─────────────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, noindex) values
('oversize-load',           'NZ', 'en-NZ', 'oversize load',             true,  '{"overdimension load"}', false),
('pilot-escort-vehicle',    'NZ', 'en-NZ', 'pilot vehicle',             true,  '{"escort vehicle"}', false),
('oversize-permit',         'NZ', 'en-NZ', 'oversize permit',           true,  '{"overdimension permit"}', false)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── DE TERM VARIANTS ─────────────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('oversize-load',           'DE', 'de-DE', 'Großraumtransport',         true,  '{}', null, true),
('heavy-haul',              'DE', 'de-DE', 'Schwertransport',           true,  '{}', null, true),
('pilot-escort-vehicle',    'DE', 'de-DE', 'Begleitfahrzeug',           true,  '{}', null, true),
('police-escort',           'DE', 'de-DE', 'Polizeibegleitung',         true,  '{}', null, true),
('oversize-permit',         'DE', 'de-DE', '§29 StVO Genehmigung',      true,  '{}', null, true),
('route-survey',            'DE', 'de-DE', 'Streckenprüfung',           true,  '{}', null, true),
('traffic-control-plan',    'DE', 'de-DE', 'Verkehrszeichenplan',       true,  '{}', null, true),
('superload',               'DE', 'de-DE', 'Großraum- und Schwertransport', true, '{"GST"}', null, true),
('escort-level',            'DE', 'de-DE', 'BF3 Begleitfahrzeug',       true,  '{}', null, true)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── NZ EXPANDED TERM VARIANTS ────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('oversize-load',           'NZ', 'en-NZ', 'overdimension load',         true,  '{}', null, false),
('overweight-load',         'NZ', 'en-NZ', 'HPMV',                       true,  '{"High Productivity Motor Vehicle"}', 'NZTA classification', false),
('oversize-permit',         'NZ', 'en-NZ', 'NZTA permit',                false, '{}', null, false),
('route-survey',            'NZ', 'en-NZ', 'route suitability assessment', true, '{}', null, false),
('traffic-control-plan',    'NZ', 'en-NZ', 'traffic management plan',    true,  '{}', null, false),
('heavy-haul',              'NZ', 'en-NZ', 'heavy haulage',              true,  '{}', null, false)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── SE (SWEDEN) TERM VARIANTS ────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('oversize-load',           'SE', 'sv-SE', 'bred last',                  true,  '{}', null, true),
('heavy-haul',              'SE', 'sv-SE', 'tung transport',             true,  '{}', null, true),
('pilot-escort-vehicle',    'SE', 'sv-SE', 'följebil',                   true,  '{}', null, true),
('oversize-permit',         'SE', 'sv-SE', 'transportdispens',           true,  '{}', null, true),
('wind-turbine-transport',  'SE', 'sv-SE', 'vindkraftstransport',        true,  '{}', null, true),
('route-survey',            'SE', 'sv-SE', 'ruttbedömning',              true,  '{}', null, true),
('traffic-control-plan',    'SE', 'sv-SE', 'trafikledningsplan',         true,  '{}', null, true)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── NO (NORWAY) TERM VARIANTS ────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('oversize-load',           'NO', 'no-NO', 'spesialtransport',           true,  '{}', null, true),
('heavy-haul',              'NO', 'no-NO', 'tungtransport',              true,  '{}', null, true),
('pilot-escort-vehicle',    'NO', 'no-NO', 'følgebil',                   true,  '{}', null, true),
('oversize-permit',         'NO', 'no-NO', 'transporttillatelse',        true,  '{}', null, true),
('route-survey',            'NO', 'no-NO', 'rutevurdering',              true,  '{}', null, true),
('traffic-control-plan',    'NO', 'no-NO', 'trafikkstyring',             true,  '{}', null, true),
('wind-turbine-transport',  'NO', 'no-NO', 'vindturbintransport',        true,  '{}', null, true)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── AE (UAE) TERM VARIANTS ───────────────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('heavy-haul',              'AE', 'en-AE', 'project cargo',              true,  '{}', null, true),
('oversize-load',           'AE', 'en-AE', 'oversize transport',         true,  '{}', null, true),
('pilot-escort-vehicle',    'AE', 'en-AE', 'escort vehicle',             true,  '{}', null, true),
('police-escort',           'AE', 'en-AE', 'RTA escort',                 true,  '{}', 'Roads and Transport Authority', true),
('port-escort',             'AE', 'en-AE', 'port escort service',        true,  '{}', null, true),
('oversize-permit',         'AE', 'en-AE', 'RTA transport permit',       true,  '{}', null, true)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── SA (SAUDI ARABIA) TERM VARIANTS ─────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('heavy-haul',              'SA', 'en-SA', 'heavy transport',            true,  '{}', null, true),
('oversize-load',           'SA', 'ar-SA', 'حمولة كبيرة',                true,  '{}', null, true),
('pilot-escort-vehicle',    'SA', 'ar-SA', 'مركبة مرافقة',               true,  '{}', null, true),
('police-escort',           'SA', 'en-SA', 'traffic police escort',      true,  '{}', null, true),
('project-cargo',           'SA', 'en-SA', 'giga project transport',     true,  '{}', 'NEOM, The Line, Jeddah Tower', true),
('oversize-permit',         'SA', 'en-SA', 'MOT transport permit',       true,  '{}', null, true)
on conflict (concept_slug, country_code, locale, term_local) do nothing;

-- ── ZA (SOUTH AFRICA) TERM VARIANTS ────────────────────────────────────────
insert into public.glossary_term_variants (concept_slug, country_code, locale, term_local, is_primary, search_aliases, regulatory_notes, noindex) values
('heavy-haul',              'ZA', 'en-ZA', 'abnormal load transport',    true,  '{}', null, true),
('oversize-load',           'ZA', 'en-ZA', 'abnormal load',              true,  '{}', null, true),
('pilot-escort-vehicle',    'ZA', 'en-ZA', 'escort vehicle',             true,  '{}', null, true),
('oversize-permit',         'ZA', 'en-ZA', 'abnormal load permit',       true,  '{}', 'SANRAL framework', true),
('route-survey',            'ZA', 'en-ZA', 'route clearance survey',     true,  '{}', null, true),
('traffic-control-plan',    'ZA', 'en-ZA', 'traffic management plan',    true,  '{}', null, true),
('mine-site-delivery',      'ZA', 'en-ZA', 'mine site delivery',         true,  '{"mining haul"}', null, true)
on conflict (concept_slug, country_code, locale, term_local) do nothing;
