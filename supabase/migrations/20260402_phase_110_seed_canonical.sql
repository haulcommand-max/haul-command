-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED SCRIPT — Canonical Roles, Archetype Defaults, Monetization Rules,
-- Intake Channels, Job Stack Templates
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══ CANONICAL ROLES (20 roles) ═══
INSERT INTO public.canonical_roles (role_key, role_name, role_family, is_dispatchable, is_regulated, is_private_market) VALUES
('pilot_car_operator',          'Pilot Car Operator',              'escort_and_convoy',         true, false, true),
('escort_vehicle_operator',     'Escort Vehicle Operator',         'escort_and_convoy',         true, false, true),
('high_pole_escort',            'High Pole Escort',                'escort_and_convoy',         true, false, true),
('route_surveyor',              'Route Surveyor',                  'permit_route_regulatory',   true, false, true),
('permit_service',              'Permit Service',                  'permit_route_regulatory',   true, false, true),
('police_escort_liaison',       'Police Escort Liaison',           'permit_route_regulatory',   true, false, true),
('traffic_control_crew',        'Traffic Control Crew',            'field_support',             true, false, true),
('bucket_truck_line_lift_crew', 'Bucket Truck / Line Lift Crew',   'field_support',             true, false, true),
('staging_yard_operator',       'Staging Yard Operator',           'field_support',             true, false, true),
('secure_parking_operator',     'Secure Parking Operator',         'field_support',             true, false, true),
('recovery_tow_specialist',    'Recovery / Tow Specialist',        'field_support',             true, false, true),
('customs_broker',              'Customs Broker',                  'border_port_site',          true, false, true),
('project_cargo_broker',        'Project Cargo Broker',            'demand_side',               false, false, true),
('heavy_haul_carrier',          'Heavy Haul Carrier',              'transport_execution',       true, false, true),
('utility_coordination_manager','Utility Coordination Manager',    'permit_route_regulatory',   true, false, true),
('bf3_escort',                  'BF3 Escort',                      'escort_and_convoy',         true, true, true),
('bf4_escort',                  'BF4 Escort',                      'escort_and_convoy',         true, true, true),
('scorta_tecnica',              'Scorta Tecnica',                  'escort_and_convoy',         true, true, true),
('vehicle_pilote',              'Véhicule Pilote',                 'escort_and_convoy',         true, false, true),
('odc_coordinator',             'ODC Coordinator',                 'permit_route_regulatory',   true, false, true)
ON CONFLICT (role_key) DO NOTHING;

-- ═══ ARCHETYPE DEFAULTS ═══
INSERT INTO public.archetype_defaults (archetype_key, roles_default, pricing_modes, monetization_priority) VALUES
('us_pilot_car',
  '["pilot_car_operator","high_pole_escort","route_surveyor","permit_service","police_escort_liaison","bucket_truck_line_lift_crew"]'::jsonb,
  '["per_mile","per_day","minimum_charge","standby","cancellation","deadhead"]'::jsonb,
  '["job_take_rate","directory","subscriptions","permit_service","route_survey","urgent_fee","insurance_referral"]'::jsonb),
('uk_abnormal_load',
  '["escort_vehicle_operator","route_surveyor","permit_service","police_escort_liaison"]'::jsonb,
  '["per_job","hourly","day_rate","standby"]'::jsonb,
  '["job_take_rate","compliance","route_service","authority_coordination","directory","training"]'::jsonb),
('german_bf',
  '["bf3_escort","bf4_escort","route_surveyor","permit_service"]'::jsonb,
  '["per_km","hourly","per_job","day_rate"]'::jsonb,
  '["job_take_rate","technical_escort_routing","compliance","directory","enterprise_data"]'::jsonb),
('italian_scorta',
  '["scorta_tecnica","permit_service","route_surveyor"]'::jsonb,
  '["per_km","per_job","hourly"]'::jsonb,
  '["job_take_rate","technical_escort","directory","compliance"]'::jsonb),
('spanish_transporte_especial',
  '["escort_vehicle_operator","permit_service","route_surveyor"]'::jsonb,
  '["per_km","day_rate","minimum_charge"]'::jsonb,
  '["job_take_rate","directory","permit_service","route_service","training"]'::jsonb)
ON CONFLICT (archetype_key) DO NOTHING;

-- ═══ MONETIZATION DEFAULT RULES ═══
INSERT INTO public.monetization_default_rules (role_family, can_receive_jobs, lead_unlockable, subscription_eligible, featured_listing_eligible, rush_fee_eligible, standby_margin_eligible, data_sale_eligible, api_exposure_eligible, territory_sponsor_eligible, corridor_sponsor_eligible, default_revenue_priority_score) VALUES
('escort_and_convoy',       true, true, true, true, true, true, false, false, false, false, 95),
('permit_route_regulatory', true, true, true, true, false, false, true, true, false, false, 90),
('field_support',           true, true, true, true, false, false, false, false, false, false, 85),
('border_port_site',        true, true, true, true, false, false, false, false, false, false, 80),
('demand_side',             false, false, true, false, false, false, false, true, true, true, 100),
('transport_execution',     true, true, true, true, true, true, false, false, false, false, 92)
ON CONFLICT DO NOTHING;

-- ═══ INTAKE CHANNELS ═══
INSERT INTO public.intake_channels (channel_key, channel_type, display_name, is_active) VALUES
('ui_manual',       'ui',       'UI Manual Intake',       true),
('api_direct',      'api',      'Direct API Intake',      true),
('edi_204',         'edi_204',  'EDI 204 Intake',         true),
('edi_214',         'edi_214',  'EDI 214 Intake',         true),
('email_to_load',   'email',    'Email to Load',          true),
('voice_agent',     'voice',    'Voice Agent Intake',     true),
('sms_intake',      'sms',      'SMS Intake',             true),
('whatsapp_intake', 'whatsapp', 'WhatsApp Intake',        true),
('webhook_partner', 'webhook',  'Partner Webhook Intake', true)
ON CONFLICT (channel_key) DO NOTHING;

-- ═══ JOB STACK TEMPLATES ═══
INSERT INTO public.job_stack_templates (template_key, scope_type, job_type, required_roles, optional_roles, required_fees) VALUES
('us_basic_escort_move', 'country', 'multi_role_move',
  '["pilot_car_operator","escort_vehicle_operator"]'::jsonb,
  '["high_pole_escort","route_surveyor","permit_service","bucket_truck_line_lift_crew"]'::jsonb,
  '["platform_take","deadhead","standby"]'::jsonb),
('route_survey_only', 'global', 'route_survey',
  '["route_surveyor"]'::jsonb,
  '["permit_service"]'::jsonb,
  '["platform_take"]'::jsonb),
('enterprise_reserved_capacity', 'enterprise', 'multi_role_move',
  '["escort_vehicle_operator"]'::jsonb,
  '["high_pole_escort","traffic_control_crew","police_escort_liaison"]'::jsonb,
  '["platform_take","capacity_hold"]'::jsonb)
ON CONFLICT (template_key) DO NOTHING;
