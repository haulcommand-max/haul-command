-- ============================================================================
-- SEED DATA: Bridge Engineering Module (Validation)
-- ============================================================================

-- 1. Skinny Bridge (Width 28ft)
-- Location: Mock Coordinate (User's HQ or typical route)
INSERT INTO infrastructure_assets (
    asset_type, asset_ref_id, name, road_name, 
    latitude, longitude, state_code, 
    attributes, source
) VALUES (
    'bridge',
    'TEST-BR-001',
    'Old River Bridge (Test)',
    'County Rd 405',
    35.0000000, -90.0000000, -- Mock Location
    'TN',
    '{
        "weight_rating_code": "HS-20",
        "weight_limit_lbs": 60000,
        "vertical_clearance_ft": 14.5,
        "curb_to_curb_width_ft": 28.0
    }'::JSONB,
    'SEED_DATA'
) ON CONFLICT (asset_type, asset_ref_id) DO NOTHING;

-- 2. Humped Railroad Crossing (12% Grade)
INSERT INTO infrastructure_assets (
    asset_type, asset_ref_id, name, road_name, 
    latitude, longitude, state_code, 
    attributes, source
) VALUES (
    'railroad_crossing',
    'TEST-RR-882',
    'High Profile Crossing (Test)',
    'Industrial Blvd',
    35.0500000, -90.0500000, -- Near the bridge
    'TN',
    '{
        "fra_id": "123456X",
        "is_humped": true,
        "hump_grade_percent": 12.0
    }'::JSONB,
    'SEED_DATA'
) ON CONFLICT (asset_type, asset_ref_id) DO NOTHING;
