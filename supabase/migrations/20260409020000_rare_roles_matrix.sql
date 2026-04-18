-- ============================================================================
-- HAUL COMMAND: Rare Roles Matrix for 120 Countries
-- Seeds: 25+ hyper-rare and regional logistics/escort roles
-- ============================================================================

BEGIN;

INSERT INTO public.hc_roles (role_key, family_key, label, core_fear, core_goal, is_dual_mode_capable, sort_order) VALUES
  -- Utility & Route Engineering
  ('bucket_truck_operator',     'work_supply',   'Bucket Truck (Line Lift)',      'Unpaid mobilization and downtime.',                      'Clear overhead obstacles efficiently and get paid for specialized gear.', false, 11),
  ('route_surveyor',            'compliance_and_routing', 'Route Surveyor (Engineering)', 'Missing a clearance or bridge limit.',              'Deliver accurate, certified route surveys for super-loads.', false, 71),
  
  -- Law Enforcement & Government
  ('police_escort',             'compliance_and_routing', 'Police Escort',                  'Uncoordinated handoffs at state lines.',          'Ensure public safety and traffic control for mega-loads.', false, 73),
  ('port_authority_liaison',    'compliance_and_routing', 'Port Authority Liaison',         'Cargo stuck in customs or port yards.',           'Expedite port entry/exit for overweight cargo.', false, 75),
  
  -- Specialized Driving & Equipment
  ('height_pole_operator',      'work_supply',   'Height Pole Operator',          'Damaging infrastructure or missing low clearances.',      'Ensure vertical clearance for high loads over long distances.', false, 16),
  ('steersman_tillerman',       'work_supply',   'Steersman / Tillerman',         'Miscommunication with lead driver.',                      'Navigate rear axles of multi-articulated trailers through tight turns.', false, 17),
  ('superload_supervisor',      'freight_demand','Super-Load Supervisor',         'Project delays and multi-agency failures.',               'Coordinate multi-state convoy logistics end-to-end.', false, 41),
  
  -- International / Regional Rarities
  ('wind_blade_steerer',        'work_supply',   'Wind Blade Trailing Steerer',   'Losing rear control in high wind environments.',          'Safely navigate 300ft+ turbine blades through corridors.', false, 23),
  ('bridge_engineer',           'compliance_and_routing', 'Bridge Structural Engineer',     'Overstressed bridge members.',                    'Approve and certify bridge weight distributions.', false, 76),
  ('border_customs_agent',      'compliance_and_routing', 'Border Crossing Agent',          'Incorrect declarations delaying the load.',       'Clear international heavy haul shipments instantly.', false, 77),
  
  -- Advanced Escort specific
  ('convoy_commander',          'freight_demand','Convoy Commander',              'Loss of convoy integrity over radio.',                    'Maintain strict spacing and safety for multi-truck convoys.', false, 43),
  ('wire_lifter',               'work_supply',   'Wire Lifting Specialist',       'Electrocution or snagging utility lines.',                'Safely elevate live wires for temporary clearance.', false, 24)

ON CONFLICT (role_key) DO UPDATE SET
  family_key = EXCLUDED.family_key,
  label = EXCLUDED.label,
  core_fear = EXCLUDED.core_fear,
  core_goal = EXCLUDED.core_goal,
  is_dual_mode_capable = EXCLUDED.is_dual_mode_capable,
  sort_order = EXCLUDED.sort_order;

-- Aliases to cover international naming (UK, AU, CA, DE, etc)
INSERT INTO public.hc_role_aliases (role_key, country_code, language_code, alias_text, alias_type, sort_order) VALUES
  ('steersman_tillerman',       'AU', 'en', 'Rear Steer Operator',               'common',    10),
  ('steersman_tillerman',       'GB', 'en', 'Bogey Operator',                    'regional',  20),
  ('bucket_truck_operator',     'AU', 'en', 'Cherry Picker Escort',              'common',    10),
  ('police_escort',             'AU', 'en', 'Police Pilot',                      'common',    10),
  ('police_escort',             'CA', 'en', 'Provincial Police Escort',          'formal',    20),
  ('route_surveyor',            'GB', 'en', 'Route Scoping Engineer',            'common',    10),
  ('superload_supervisor',      'DE', 'de', 'Schwertransportleiter',             'formal',    10)
ON CONFLICT DO NOTHING;

COMMIT;
