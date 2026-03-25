-- ============================================================================
-- ESC SAFETY LIBRARY KNOWLEDGE BASE SEED
-- Source: https://www.esc.org/safety-library
-- Structured data for PEVO training, certification reciprocity, 
-- insurance providers, equipment requirements, and safety intelligence.
-- ============================================================================

-- ── PEVO CERTIFICATION REQUIREMENTS BY STATE ──
CREATE TABLE IF NOT EXISTS public.pevo_certification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  state_name text NOT NULL,
  requires_certification boolean NOT NULL DEFAULT false,
  accepts_wa_cert boolean DEFAULT false,
  wa_accepts_theirs boolean DEFAULT false,
  additional_notes text,
  source_url text DEFAULT 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(state_code)
);

INSERT INTO public.pevo_certification_rules (state_code, state_name, requires_certification, accepts_wa_cert, wa_accepts_theirs) VALUES
('AZ', 'Arizona', true, true, true),
('CO', 'Colorado', true, true, true),
('FL', 'Florida', true, true, false),
('GA', 'Georgia', true, true, false),
('KS', 'Kansas', true, true, true),
('MN', 'Minnesota', true, true, true),
('NY', 'New York', true, false, false),
('NC', 'North Carolina', true, true, false),
('OK', 'Oklahoma', true, true, true),
('PA', 'Pennsylvania', true, true, false),
('TX', 'Texas', true, true, true),
('UT', 'Utah', true, true, true),
('VA', 'Virginia', true, true, false),
('WA', 'Washington', true, true, true)
ON CONFLICT (state_code) DO UPDATE SET
  requires_certification = EXCLUDED.requires_certification,
  accepts_wa_cert = EXCLUDED.accepts_wa_cert,
  wa_accepts_theirs = EXCLUDED.wa_accepts_theirs;

-- ── PEVO INSURANCE PROVIDERS ──
CREATE TABLE IF NOT EXISTS public.pevo_insurance_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  city text,
  state_code text,
  website text,
  offers_cert_discount boolean DEFAULT false,
  policy_types text[] DEFAULT '{}',
  source_url text DEFAULT 'https://www.esc.org/safety-library',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pevo_insurance_providers (provider_name, city, state_code, website, offers_cert_discount, policy_types) VALUES
('Charles James Cayias Insurance, Inc.', 'Salt Lake City', 'UT', 'https://www.cayias.com/', true, ARRAY['commercial_auto', 'general_liability', 'errors_omissions']),
('V.R. Williams & Company', 'Winchester', 'TN', 'https://vrwilliams.com/', true, ARRAY['commercial_auto', 'general_liability', 'errors_omissions']),
('Risk Managers Insurance', NULL, 'UT', 'https://www.riskmanagersinc.com/', false, ARRAY['occupational_accident', 'workers_compensation'])
ON CONFLICT DO NOTHING;

-- ── PEVO EQUIPMENT REQUIREMENTS ──
CREATE TABLE IF NOT EXISTS public.pevo_equipment_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- vehicle, ppe, signaling, other
  item_name text NOT NULL,
  description text,
  required boolean DEFAULT true,
  source_url text DEFAULT 'https://www.esc.org/safety-library',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pevo_equipment_requirements (category, item_name, description, required) VALUES
-- Vehicle Equipment
('vehicle', 'Oversize Load Sign', 'Mounted to the roof, visible from front and back. Should be retractable or removable.', true),
('vehicle', 'Amber Strobe Light', 'At least one roof-mounted flashing or rotating amber strobe, visible 360° for minimum 500 feet.', true),
('vehicle', 'High Pole', 'Professional-grade, non-conductive, adjustable high pole with extra striker tips.', true),
('vehicle', 'High Pole Mount', 'At least one mount on the front of the vehicle, preferably welded to frame.', true),
('vehicle', 'CB Radio (40-channel)', 'Quality 40-channel, 4-watt radio installed in vehicle. Hands-free recommended.', true),
('vehicle', 'Handheld Two-Way Radio', 'At least one handheld radio with extra batteries.', true),
-- PPE
('ppe', 'Hi-Vis Upper Garment', 'Vest or jacket with retroreflective banding. Fluorescent yellow-green, orange-red, or red. ANSI Class 2 or 3.', true),
('ppe', 'Hi-Vis Hard Hat', 'White, yellow, yellow-green, orange, or red with retroreflective banding for night ops.', true),
('ppe', 'Hi-Vis Pants (ANSI Class E)', 'Required for nighttime operations.', true),
('ppe', 'Steel-Toed Boots', 'Protective footwear required at all times.', true),
('ppe', 'Protective Eyewear', 'Safety glasses or goggles.', true),
('ppe', 'Hi-Vis Gloves', 'Recommended for flagging situations.', false),
-- Signaling Equipment
('signaling', 'Emergency Reflective Triangles', 'At least 3 bi-directional emergency reflective triangles.', true),
('signaling', 'Traffic Cones (28-inch)', 'At least 3 orange traffic cones with retroreflective collars.', true),
('signaling', 'Flashlight w/ Red Cone', 'Flashlight with red nose cone, additional batteries, and extra bulb.', true),
('signaling', 'STOP/SLOW Paddle (18-inch)', 'Retroreflective, with optional 6-7 foot staff. 24-inch paddle recommended for night use.', true),
('signaling', 'Red Flag (24-inch)', 'Weighted, 24-inch red flag mounted on a 36-inch staff.', true),
-- Backup & Additional
('other', 'Backup High Pole', 'At least one additional high pole for each mounted high pole.', true),
('other', 'Extra Striker Tips', 'At least six additional striker tips.', true),
('other', 'Convex Mirror or Dashcam', 'To see the tip of the high pole without moving from normal driving position.', false),
('other', 'Additional Mounting Hardware', 'Extra clamps, brackets, pins, and/or screws.', true)
ON CONFLICT DO NOTHING;

-- ── INSURANCE POLICY TYPES (Reference) ──
INSERT INTO public.glossary_terms (term, definition, category, source_url) VALUES
('Commercial Automotive Insurance', 'Protects against damages to your pilot/escort vehicle. Standard auto policies may not cover PEVO activities.', 'regulation', 'https://www.esc.org/safety-library'),
('General Liability Insurance', 'Covers injury or property damage claims. Essential for PEVOs who work near oversize loads and infrastructure.', 'regulation', 'https://www.esc.org/safety-library'),
('Professional E&O Insurance', 'Professional Errors and Omissions insurance. Protects against injury or property damage above and beyond general liability coverage. Critical for bridge strike scenarios.', 'regulation', 'https://www.esc.org/safety-library'),
('WITPAC', 'Western Interstate Truck Pilot Automobile Coalition. A multi-state certification reciprocity program requiring PEVO certification regardless of state requirements.', 'official', 'https://www.esc.org/safety-library'),
('PEVO', 'Pilot/Escort Vehicle Operator. A certified driver who operates a warning and guide vehicle for oversize and overweight loads.', 'official', 'https://www.esc.org/safety-library'),
('Bridge Strike', 'When an oversize load hits a bridge or overhead structure. Can cause hundreds of thousands in damage. Prevention requires proper high pole operation and route surveys.', 'official', 'https://www.esc.org/safety-library'),
('Route Survey', 'A detailed breakdown of the planned route with images, maps, notes, and descriptions of all hazards and restrictions including railroad crossings, bridges, and overhead clearances.', 'official', 'https://www.esc.org/safety-library'),
('Pre-Trip Meeting', 'An essential meeting before every Oversize Load move covering route survey details, team roles, communication protocols, and safety procedures.', 'official', 'https://www.esc.org/safety-library')
ON CONFLICT (term, category) DO NOTHING;

-- RLS
ALTER TABLE public.pevo_certification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pevo_insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pevo_equipment_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pevo_cert_public_read" ON public.pevo_certification_rules FOR SELECT USING (true);
CREATE POLICY "pevo_insurance_public_read" ON public.pevo_insurance_providers FOR SELECT USING (true);
CREATE POLICY "pevo_equip_public_read" ON public.pevo_equipment_requirements FOR SELECT USING (true);
CREATE POLICY "sr_pevo_cert" ON public.pevo_certification_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "sr_pevo_insurance" ON public.pevo_insurance_providers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "sr_pevo_equip" ON public.pevo_equipment_requirements FOR ALL USING (auth.role() = 'service_role');
