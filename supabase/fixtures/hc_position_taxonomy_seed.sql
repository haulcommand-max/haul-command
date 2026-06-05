-- ============================================================================
-- Haul Command Position / Capability / Hazard / Rate Fixture Seed
-- Purpose: make field-grade roles concrete before wiring production pricing,
-- glossary, load-board filters, profile capabilities, and quote logic.
-- Safe to run repeatedly.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.hc_position_taxonomy (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_label text not null,
  role_family text not null,
  position_type text not null,
  public_account_role text,
  marketplace_visible boolean not null default true,
  glossary_required boolean not null default true,
  profile_capability_required boolean not null default true,
  load_board_filter_required boolean not null default true,
  rate_category_slug text,
  requires_special_skill boolean not null default false,
  country_scope text[] not null default array['US'],
  hazard_triggers text[] not null default '{}',
  related_glossary_slugs text[] not null default '{}',
  definition_seed text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_position_aliases (
  id uuid primary key default gen_random_uuid(),
  position_slug text not null references public.hc_position_taxonomy(slug) on delete cascade,
  alias text not null,
  alias_type text not null default 'field_term',
  country_code text,
  region_code text,
  language_code text default 'en',
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  unique(position_slug, lower(alias), coalesce(country_code,''), coalesce(region_code,''), coalesce(language_code,''))
);

create table if not exists public.hc_hazard_modifiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  hazard_family text not null,
  definition_seed text not null,
  likely_required_positions text[] not null default '{}',
  likely_rate_categories text[] not null default '{}',
  country_scope text[] not null default array['US'],
  marketplace_filter_required boolean not null default true,
  pricing_modifier_required boolean not null default true,
  glossary_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hc_rate_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  rate_family text not null,
  unit text not null,
  definition_seed text not null,
  applies_to_positions text[] not null default '{}',
  applies_to_hazards text[] not null default '{}',
  country_scope text[] not null default array['US'],
  requires_live_market_data boolean not null default true,
  created_at timestamptz not null default now()
);

-- Core paid move positions and high-value capability positions.
insert into public.hc_position_taxonomy
(slug, canonical_label, role_family, position_type, public_account_role, rate_category_slug, requires_special_skill, country_scope, hazard_triggers, related_glossary_slugs, definition_seed)
values
('pilot_car_operator','Pilot Car Operator','escort_operations','public_role','pilot_car_escort','escort_base_rate',false,array['US','CA'],'{}',array['pilot-car','escort-vehicle'],'A pilot car operator drives an escort vehicle that accompanies an oversize or overweight load to warn traffic, communicate hazards, and support safe movement.'),
('lead_car','Lead Car','escort_operations','paid_move_position','pilot_car_escort','lead_car_rate',true,array['US','CA'],'{oncoming_traffic,route_clearance,high_pole_required}',array['pilot-car','lead-car','height-pole'],'The lead car travels ahead of the load to warn oncoming traffic, verify route conditions, communicate hazards, and often carry a height pole for tall loads.'),
('rear_escort','Rear Escort','escort_operations','paid_move_position','pilot_car_escort','rear_escort_rate',true,array['US','CA'],'{rear_overhang,traffic_merge_risk,multiple_escort_cars_required}',array['chase-car','rear-escort'],'The rear escort follows the oversize load to protect the back of the movement, warn traffic from behind, and support lane changes or turns.'),
('high_pole_escort','High Pole Escort','escort_operations','paid_move_position','pilot_car_escort','high_pole_rate',true,array['US','CA'],'{over_legal_height,low_bridge,overhead_wires,high_pole_required}',array['height-pole','high-pole-escort','bridge-clearance'],'A high pole escort uses a calibrated height pole on the lead vehicle to check overhead obstructions before the load reaches them.'),
('steer_operator','Steer Operator','escort_operations','paid_move_position','pilot_car_escort','steer_rate',true,array['US','CA','AU','GB'],'{extreme_length,steerable_trailer,rear_steer_required,tight_turn_radius,urban_route,bridge_crossing}',array['steerman','steersman','tillerman','rear-steer-operator'],'A steer operator assists a long or specialized trailer through turns and tight route geometry, often coordinating rear steer or trailer articulation.'),
('supplemental_escort_vehicle','Supplemental Escort Vehicle','escort_operations','paid_move_position','pilot_car_escort','extra_escort_rate',true,array['US','CA'],'{multiple_escort_cars_required,fifth_car_required,superload}',array['fifth-car','extra-escort-car'],'A supplemental escort vehicle is an additional escort beyond the normal lead/rear setup, often called a fifth car when permit conditions or hazards require more coverage.'),
('route_surveyor','Route Surveyor','route_intelligence','paid_service','route_survey_provider','route_survey_rate',true,array['US','CA','AU','GB','NZ'],'{route_survey_required,superload,low_bridge,narrow_bridge,railroad_crossing,urban_route}',array['route-survey','route-check','clearance'],'A route surveyor inspects the planned route before a move to identify clearance, weight, turn-radius, utility, construction, and permit problems.'),
('drone_route_surveyor','Drone Route Surveyor','route_intelligence','paid_service','route_survey_provider','drone_route_survey_rate',true,array['US','CA','AU','GB'],'{drone_survey_required,overhead_wires,bridge_clearance,turn_radius,construction_zone}',array['route-survey','drone-route-survey','overhead-obstruction-survey'],'A drone route surveyor uses UAV imagery or video to inspect overhead, turn, access, and obstruction issues before or during a heavy haul move.'),
('lidar_route_survey_provider','LiDAR Route Survey Provider','route_intelligence','paid_service','route_survey_provider','technical_survey_rate',true,array['US','CA','AU','GB','DE'],'{engineering_review_required,bridge_analysis_required,extreme_height,extreme_length}',array['lidar-route-survey','digital-twin-route-modeler'],'A LiDAR route survey provider captures precise 3D route geometry for clearance, swept-path, and digital-twin analysis.'),
('traffic_control_escort','Traffic Control Escort','traffic_control','paid_move_position','traffic_control_provider','traffic_control_rate',true,array['US','CA','AU','GB'],'{traffic_control_required,urban_route,intersection_control,road_closure_required}',array['traffic-control','flagger'],'A traffic control escort manages traffic around the load, including intersection control, temporary stops, lane closures, and route protection.'),
('police_escort_coordinator','Police Escort Coordinator','traffic_control','paid_service','traffic_control_provider','police_coordination_rate',true,array['US','CA','AU','GB','AE'],'{police_escort_required,superload,urban_route,law_enforcement_required}',array['police-escort','law-enforcement-escort'],'A police escort coordinator arranges required law-enforcement support for oversize or superload movements.'),
('bucket_truck_provider','Bucket Truck Provider','utility_clearance','paid_service','utility_clearance_provider','bucket_truck_rate',true,array['US','CA'],'{bucket_truck_required,overhead_wires,wire_lifting_needed}',array['bucket-truck-escort','utility-coordination'],'A bucket truck provider supplies elevated work equipment and crews to lift, protect, or manage overhead lines and obstructions for tall loads.'),
('overhead_wire_lifter','Overhead Wire Lifter','utility_clearance','paid_service','utility_clearance_provider','wire_lift_rate',true,array['US','CA'],'{wire_lifting_needed,overhead_wires,over_legal_height}',array['overhead-wires','utility-coordination'],'An overhead wire lifter coordinates or performs temporary lifting or management of wires so tall loads can pass safely.'),
('permit_service_company','Permit Service Company','permit_compliance','public_role','permit_provider','permit_service_rate',true,array['US','CA','AU','GB','NZ'],'{permit_required,superload,cross_border_move}',array['oversize-permit','overweight-permit'],'A permit service company prepares and files oversize, overweight, superload, route, and jurisdiction-specific permits.'),
('escort_dispatcher','Escort Dispatcher','broker_dispatch','paid_service','broker_dispatcher','dispatch_rate',false,array['US','CA'],'{rush_move,multiple_escort_cars_required,coverage_gap}',array['dispatching','pilot-car-dispatcher'],'An escort dispatcher matches pilot cars, route surveyors, traffic control, and support providers to loads and route requirements.'),
('heavy_haul_broker','Heavy Haul Broker','broker_dispatch','public_role','broker','broker_margin',false,array['US','CA','AU','GB'],'{load_posted,quote_needed,carrier_needed}',array['freight-broker','heavy-haul'],'A heavy haul broker connects shippers, carriers, pilot cars, permit services, and support providers for specialized loads.'),
('oversize_load_driver','Oversize Load Driver','carrier_operations','public_role','carrier_driver','driver_rate',true,array['US','CA','AU','GB'],'{over_legal_width,over_legal_height,over_legal_length,superload}',array['oversize-load','heavy-haul-driver'],'An oversize load driver operates the truck or tractor moving a permitted oversize or overweight load.'),
('rigging_supervisor','Rigging Supervisor','site_rigging','paid_service','site_support_provider','rigging_rate',true,array['US','CA','AU','GB'],'{loading_complexity,high_value_load,crane_required}',array['rigging','load-securement'],'A rigging supervisor plans and oversees loading, securing, lifting, and site movement for heavy or complex cargo.'),
('pilot_car_upfitter','Pilot Car Upfitter','equipment_marketplace','public_role','equipment_installer','installer_rate',true,array['US','CA','AU','GB'],'{equipment_fail,certified_escort_required}',array['pilot-car-equipment','height-pole-kit'],'A pilot car upfitter installs lights, signs, radios, height poles, flags, GPS, dashcams, and other required escort vehicle equipment.'),
('secure_staging_yard_provider','Secure Staging Yard Provider','route_support_infrastructure','paid_service','infrastructure_provider','staging_yard_rate',false,array['US','CA','AU','GB'],'{staging_needed,superload,night_move,port_entry}',array['staging-yard','oversize-parking'],'A secure staging yard provider offers space to stage loads, escorts, equipment, or crews before, during, or after a heavy haul move.')
on conflict (slug) do update set
  canonical_label = excluded.canonical_label,
  role_family = excluded.role_family,
  position_type = excluded.position_type,
  public_account_role = excluded.public_account_role,
  rate_category_slug = excluded.rate_category_slug,
  requires_special_skill = excluded.requires_special_skill,
  country_scope = excluded.country_scope,
  hazard_triggers = excluded.hazard_triggers,
  related_glossary_slugs = excluded.related_glossary_slugs,
  definition_seed = excluded.definition_seed,
  updated_at = now();

insert into public.hc_position_aliases (position_slug, alias, alias_type, country_code, language_code, is_preferred) values
('pilot_car_operator','Pilot Car Operator','canonical','US','en',true),
('pilot_car_operator','P/EVO','acronym','US','en',false),
('pilot_car_operator','Pilot/Escort Vehicle Operator','formal','US','en',false),
('lead_car','Lead Car','field_term','US','en',true),
('lead_car','Lead Pilot','field_term','US','en',false),
('lead_car','Front Escort','field_term','US','en',false),
('rear_escort','Chase Car','field_term','US','en',true),
('rear_escort','Rear Car','field_term','US','en',false),
('rear_escort','Tail Escort','field_term','US','en',false),
('high_pole_escort','High Pole','field_term','US','en',true),
('high_pole_escort','Height Pole Operator','field_term','US','en',false),
('steer_operator','Steerman','field_term','US','en',true),
('steer_operator','Steersman','field_term','US','en',false),
('steer_operator','Tillerman','field_term','US','en',false),
('steer_operator','Steer Car','field_term','US','en',false),
('steer_operator','Rear Steer Operator','field_term','US','en',false),
('supplemental_escort_vehicle','Fifth Car','field_term','US','en',true),
('supplemental_escort_vehicle','Extra Escort Car','field_term','US','en',false),
('supplemental_escort_vehicle','Supplemental Escort','field_term','US','en',false),
('drone_route_surveyor','Drone Route Survey','service_alias','US','en',true),
('drone_route_surveyor','UAV Route Survey','service_alias','US','en',false),
('lidar_route_survey_provider','LiDAR Route Survey','service_alias','US','en',true),
('bucket_truck_provider','Bucket Truck Escort','field_term','US','en',true),
('overhead_wire_lifter','Wire Lift Crew','field_term','US','en',true),
('permit_service_company','Permit Runner','field_term','US','en',false),
('heavy_haul_broker','Oversize Load Broker','field_term','US','en',false)
on conflict do nothing;

insert into public.hc_rate_categories
(slug, label, rate_family, unit, definition_seed, applies_to_positions, applies_to_hazards, country_scope, requires_live_market_data)
values
('escort_base_rate','Escort Base Rate','escort','per_mile_or_day','Base pricing for standard pilot car escort service before specialty modifiers.',array['pilot_car_operator'],array['over_legal_width','over_legal_length'],array['US','CA'],true),
('lead_car_rate','Lead Car Rate','escort','per_mile_or_day','Rate for the lead escort vehicle traveling ahead of the load.',array['lead_car'],array['route_clearance','oncoming_traffic'],array['US','CA'],true),
('rear_escort_rate','Rear Escort Rate','escort','per_mile_or_day','Rate for the rear/chase escort vehicle protecting the back of the movement.',array['rear_escort'],array['rear_overhang','traffic_merge_risk'],array['US','CA'],true),
('high_pole_rate','High Pole Rate','escort_specialty','per_mile_or_day','Premium rate for high pole/height pole escort service.',array['high_pole_escort'],array['over_legal_height','low_bridge','overhead_wires'],array['US','CA'],true),
('steer_rate','Steer / Steerman Rate','escort_specialty','per_mile_or_day','Premium rate for steer/tillerman/rear-steer support.',array['steer_operator'],array['extreme_length','tight_turn_radius','rear_steer_required'],array['US','CA'],true),
('extra_escort_rate','Fifth Car / Extra Escort Rate','escort_specialty','per_mile_or_day','Rate for extra/supplemental escort vehicles beyond the standard formation.',array['supplemental_escort_vehicle'],array['fifth_car_required','multiple_escort_cars_required'],array['US','CA'],true),
('route_survey_rate','Route Survey Rate','survey','flat_or_hourly','Rate for route survey service and written route report.',array['route_surveyor'],array['route_survey_required','superload'],array['US','CA'],true),
('drone_route_survey_rate','Drone Route Survey Rate','survey_technical','flat_or_hourly','Rate for drone/UAV route inspection, imagery, and clearance review.',array['drone_route_surveyor'],array['drone_survey_required','overhead_wires'],array['US','CA'],true),
('technical_survey_rate','Technical Survey Rate','survey_technical','flat_or_hourly','Rate for LiDAR, photogrammetry, 360-camera, or digital-twin route survey work.',array['lidar_route_survey_provider'],array['engineering_review_required','bridge_analysis_required'],array['US','CA','DE'],true),
('traffic_control_rate','Traffic Control Rate','traffic_control','hourly_or_day','Rate for traffic control escorts, flaggers, lane closures, and intersection control.',array['traffic_control_escort'],array['traffic_control_required','road_closure_required'],array['US','CA'],true),
('police_coordination_rate','Police Escort Coordination Rate','traffic_control','flat_or_admin','Administrative/service rate for arranging required police or law enforcement escorts.',array['police_escort_coordinator'],array['police_escort_required'],array['US','CA','AE'],true),
('bucket_truck_rate','Bucket Truck Rate','utility_clearance','hourly_or_day','Rate for bucket truck and elevated utility clearance support.',array['bucket_truck_provider'],array['bucket_truck_required','wire_lifting_needed'],array['US','CA'],true),
('wire_lift_rate','Wire Lift Rate','utility_clearance','hourly_or_event','Rate for overhead wire lifting, utility crew coordination, and obstruction clearance.',array['overhead_wire_lifter'],array['wire_lifting_needed','overhead_wires'],array['US','CA'],true),
('deadhead_rate','Deadhead Mileage','accessorial','per_mile','Mileage rate for unpaid travel to pickup, from dropoff, or between disconnected moves.',array['pilot_car_operator','lead_car','rear_escort'],array['remote_origin','coverage_gap'],array['US','CA'],true),
('layover_detention_rate','Layover / Detention Rate','accessorial','hourly_or_day','Rate for waiting time, overnight hold, permit delays, weather holds, or shipper-caused delay.',array['pilot_car_operator','route_surveyor','traffic_control_escort'],array['wait_time','weather_hold','permit_delay'],array['US','CA'],true)
on conflict (slug) do update set
  label = excluded.label,
  rate_family = excluded.rate_family,
  unit = excluded.unit,
  definition_seed = excluded.definition_seed,
  applies_to_positions = excluded.applies_to_positions,
  applies_to_hazards = excluded.applies_to_hazards,
  country_scope = excluded.country_scope,
  requires_live_market_data = excluded.requires_live_market_data;

insert into public.hc_hazard_modifiers
(slug, label, hazard_family, definition_seed, likely_required_positions, likely_rate_categories, country_scope)
values
('over_legal_width','Over Legal Width','dimension','The load exceeds standard legal width and may trigger escort, signage, permit, and route restrictions.',array['lead_car','rear_escort'],array['escort_base_rate','lead_car_rate','rear_escort_rate'],array['US','CA']),
('over_legal_height','Over Legal Height','dimension','The load exceeds legal height and may require height pole escort, route survey, or utility coordination.',array['high_pole_escort','route_surveyor'],array['high_pole_rate','route_survey_rate'],array['US','CA']),
('extreme_length','Extreme Length','dimension','The load or combination is long enough to create turning, sweep, bridge, or escort complexity.',array['steer_operator','supplemental_escort_vehicle','route_surveyor'],array['steer_rate','extra_escort_rate','route_survey_rate'],array['US','CA']),
('superload','Superload','permit_class','The movement exceeds ordinary oversize/overweight permit thresholds and requires special review, escorts, survey, or authorities.',array['route_surveyor','high_pole_escort','supplemental_escort_vehicle','police_escort_coordinator'],array['route_survey_rate','high_pole_rate','extra_escort_rate','police_coordination_rate'],array['US','CA']),
('low_bridge','Low Bridge','route_clearance','A bridge or overhead structure may not provide sufficient clearance for the load.',array['high_pole_escort','route_surveyor','drone_route_surveyor'],array['high_pole_rate','route_survey_rate','drone_route_survey_rate'],array['US','CA']),
('overhead_wires','Overhead Wires','route_clearance','Power, telecom, cable, or signal wires may interfere with a tall load.',array['high_pole_escort','bucket_truck_provider','overhead_wire_lifter','drone_route_surveyor'],array['high_pole_rate','bucket_truck_rate','wire_lift_rate','drone_route_survey_rate'],array['US','CA']),
('railroad_crossing','Railroad Crossing','route_clearance','A rail crossing may create grade, clearance, notification, or high-centering risk.',array['route_surveyor','rear_escort','traffic_control_escort'],array['route_survey_rate','traffic_control_rate'],array['US','CA']),
('urban_route','Urban Route','route_complexity','Dense urban routes may require intersection control, police, extra escorts, or night movement.',array['traffic_control_escort','police_escort_coordinator','supplemental_escort_vehicle'],array['traffic_control_rate','police_coordination_rate','extra_escort_rate'],array['US','CA']),
('fifth_car_required','Fifth Car Required','escort_formation','Permit, route, or hazard conditions require an additional escort vehicle beyond normal formation.',array['supplemental_escort_vehicle'],array['extra_escort_rate'],array['US','CA']),
('steer_tillerman_required','Steer / Tillerman Required','escort_formation','The move requires steer/tillerman support for trailer articulation, tight turns, or rear steer.',array['steer_operator'],array['steer_rate'],array['US','CA']),
('drone_survey_required','Drone Survey Required','survey','The route needs aerial/drone inspection for clearance, access, construction, wires, or approach geometry.',array['drone_route_surveyor'],array['drone_route_survey_rate'],array['US','CA']),
('police_escort_required','Police Escort Required','authority','Law enforcement escort or traffic authority support is required by permit, jurisdiction, or hazard.',array['police_escort_coordinator'],array['police_coordination_rate'],array['US','CA','AE']),
('bucket_truck_required','Bucket Truck Required','utility_clearance','A bucket truck is needed to manage overhead lines, signs, signals, or other elevated obstructions.',array['bucket_truck_provider'],array['bucket_truck_rate'],array['US','CA']),
('night_move','Night Move','timing','The move occurs at night and may require extra lighting, escorts, approvals, or premiums.',array['pilot_car_operator','traffic_control_escort'],array['escort_base_rate','traffic_control_rate'],array['US','CA']),
('port_twic_required','Port / TWIC Required','security','Port access or TWIC/security credentialing is required for the move.',array['pilot_car_operator','heavy_haul_broker'],array['escort_base_rate'],array['US'])
on conflict (slug) do update set
  label = excluded.label,
  hazard_family = excluded.hazard_family,
  definition_seed = excluded.definition_seed,
  likely_required_positions = excluded.likely_required_positions,
  likely_rate_categories = excluded.likely_rate_categories,
  country_scope = excluded.country_scope;

-- Optional bridge into the older glossary_terms model if present.
do $$
begin
  if to_regclass('public.glossary_terms') is not null then
    insert into public.glossary_terms
      (slug, term, short_definition, long_definition, category, synonyms, related_slugs, tags, jurisdiction, published, noindex, priority)
    select
      p.slug,
      p.canonical_label,
      left(p.definition_seed, 240),
      p.definition_seed,
      'Roles & Positions',
      coalesce((select array_agg(a.alias order by a.is_preferred desc, a.alias) from public.hc_position_aliases a where a.position_slug = p.slug), '{}'),
      p.related_glossary_slugs,
      array[p.role_family, p.position_type, coalesce(p.rate_category_slug,'no_rate_category')],
      'global',
      true,
      false,
      90
    from public.hc_position_taxonomy p
    on conflict (slug) do update set
      term = excluded.term,
      short_definition = excluded.short_definition,
      long_definition = excluded.long_definition,
      category = excluded.category,
      synonyms = excluded.synonyms,
      related_slugs = excluded.related_slugs,
      tags = excluded.tags,
      updated_at = now();
  end if;
end $$;
