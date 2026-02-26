-- 📦 EQUIPMENT TIERS (Business-in-a-Box)
-- Directive: "Define the Standard Kits for the Equipment Marketplace."

CREATE TABLE IF NOT EXISTS equipment_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL, -- 'Tier 1: Legal Floor', 'Tier 2: High Pole Pro'
  cost_range_low NUMERIC,
  cost_range_high NUMERIC,
  description TEXT,
  required_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  revenue_multiplier NUMERIC DEFAULT 1.0, -- 1.25x for High Pole
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO equipment_tiers (tier_name, cost_range_low, cost_range_high, description, required_items, revenue_multiplier) VALUES
(
  'Tier 1: Legal Floor', 
  800, 
  2500, 
  'Must-have gear to operate legally. Access to 70% of standard loads.',
  '[
    {"item": "Amber Light Bar (360)", "mandatory": true},
    {"item": "Oversize Load Signs", "mandatory": true},
    {"item": "CB Radio 40-ch", "mandatory": true},
    {"item": "Stop/Slow Paddle (18in)", "mandatory": true},
    {"item": "Class 2/3 Safety Vest", "mandatory": true},
    {"item": "Fire Extinguisher 5lb", "mandatory": true},
    {"item": "Reflective Triangles", "mandatory": true}
  ]'::jsonb,
  1.0
),
(
  'Tier 2: High Pole Pro', 
  1400, 
  4500, 
  'Unlocks High Pole and Lead Escort work. Access to 95% of loads + Premium Pay.',
  '[
    {"item": "Fiberglass Height Pole", "mandatory": true},
    {"item": "Bumper Mount", "mandatory": true},
    {"item": "Laser Measure", "mandatory": true},
    {"item": "Dual Dash Cam", "mandatory": true},
    {"item": "Traffic Cones (28in)", "mandatory": false}
  ]'::jsonb,
  1.25
)
ON CONFLICT DO NOTHING; -- No natural key to conflict on easily, just insert if empty. 
-- In real prod, use a unique code/slug.
