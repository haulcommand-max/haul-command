-- ============================================================================
-- SEED DATA: VERIFICATION REQUIREMENTS (The Trust Moat)
-- "Senior Operator" Rules: FL Cones, NY Lightbar, NV Permits, VA Lights
-- ============================================================================

INSERT INTO verification_requirements (jurisdiction_code, requirement_type, rules_json, severity, applies_to) VALUES

-- 🍊 FLORIDA (Cones)
('US-FL', 'VEHICLE_PHOTOS', '{"description": "Florida requires 28-inch orange cones", "min_cone_height_inches": 28, "cone_count": 4}', 'BLOCK', ARRAY['ESCORT'::profile_type]),

-- 🗽 NEW YORK (Light Bar)
('US-NY', 'LIGHTBAR', '{"description": "New York requires a 'A-Type' amber light bar visible 360 degrees", "min_length_inches": 43, "candela_rating": 500}', 'BLOCK', ARRAY['ESCORT'::profile_type]),

-- 🎰 NEVADA (Permits)
('US-NV', 'CERT', '{"description": "Nevada State Amber Light Permit is mandatory for operation", "permit_name": "NV Amber Light"}', 'WARN', ARRAY['ESCORT'::profile_type]),

-- 🏛️ VIRGINIA (Lights)
('US-VA', 'LIGHTBAR', '{"description": "Virginia requires High-Intensity Amber Lights", "sae_class": 1}', 'WARN', ARRAY['ESCORT'::profile_type]),

-- 🇨🇦 ONTARIO (Signage)
('CA-ON', 'VEHICLE_PHOTOS', '{"description": "D-Sign required (Red/White stripes)", "text": "D"}', 'BLOCK', ARRAY['ESCORT'::profile_type])

ON CONFLICT DO NOTHING;
