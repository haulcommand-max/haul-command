-- ============================================================================
-- ESC TRAINING PROGRAMS & CERTIFICATION DATA
-- Sources: 
--   https://www.esc.org/pre-class-support
--   https://www.esc.org/program/pilot-car/pre-class-information/student
--   https://www.esc.org/program/pilot-car/pre-class-information/witpac
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code text NOT NULL UNIQUE,
  program_name text NOT NULL,
  provider text NOT NULL DEFAULT 'Evergreen Safety Council',
  provider_url text DEFAULT 'https://www.esc.org',
  provider_email text,
  provider_phone text,
  description text,
  delivery_methods text[] DEFAULT '{}',  -- in_person, online_live, self_directed, blended
  passing_score int,
  requirements jsonb DEFAULT '{}',
  resources jsonb DEFAULT '{}',
  country_code text DEFAULT 'US',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Washington PEVO Certification
INSERT INTO public.training_programs (
  program_code, program_name, provider, provider_email, provider_phone,
  description, delivery_methods, passing_score, requirements, resources
) VALUES (
  'WA_PEVO',
  'Washington State PEVO Certification',
  'Evergreen Safety Council',
  'esc@esc.org',
  '+14258143868',
  'Washington State Pilot/Escort Vehicle Operator (PEVO) certification. Nationally recognized training covering federal, state, and industry standards with advanced bridge-hit prevention.',
  ARRAY['online_live', 'in_person'],
  80,
  '{"valid_drivers_license": true, "camera_on_during_class": true, "microphone_on_during_class": true, "attend_full_class": true}'::jsonb,
  '{"handbook_pdf": "https://cdn.prod.website-files.com/684fa28e292bf57f395a7b57/68fff22ba8eeed304298e669_WA-2025-PEVO-Handbook-Digital-Version.pdf", "handbook_audio": "https://open.spotify.com/show/0J2oyAHHMtHTDn8zNNO40C", "zoom_download": "https://zoom.us/download", "tech_support_booking": "https://calendly.com/manuelm-evergreensafety/", "registration": "https://esc.arlo.co/w/courses/cat-8-pilot-escort-vehicle-operator-pevo/"}'::jsonb
) ON CONFLICT (program_code) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  resources = EXCLUDED.resources;

-- WITPAC Certification
INSERT INTO public.training_programs (
  program_code, program_name, provider, provider_email, provider_phone,
  description, delivery_methods, passing_score, requirements, resources
) VALUES (
  'WITPAC',
  'WITPAC Certification (Western Interstate)',
  'Evergreen Safety Council',
  'esc@esc.org',
  '+14258143868',
  'Western Interstate Truck Pilot Automobile Coalition certification. Multi-state reciprocity program requiring PEVO certification even in states that don''t mandate it. Includes online prep course + live instructor session.',
  ARRAY['blended', 'online_live', 'in_person'],
  80,
  '{"valid_drivers_license_or_cdl": true, "us_or_canadian_license": true, "accepted_cdl_types": ["US Class A CDL", "Ontario Class A CDL", "Canadian Province Class 1"], "existing_pevo_cert_from": ["AZ","CO","FL","GA","MN","NC","OK","UT","VA","WA"], "pre_course_required": true, "camera_on_during_class": true, "microphone_on_during_class": true, "arrive_30min_early": true}'::jsonb,
  '{"lms_platform": "TalentLMS", "lms_url": "https://evergreen.talentlms.com/", "lms_domain": "evergreen", "lms_default_password": "Evergreenissafe.", "mobile_app": "https://www.talentlms.com/mobile", "student_packet": "https://www.esc.org/resources/witpac/student-resources", "student_packet_pdf": "https://cdn.prod.website-files.com/684fa28e292bf57f395a7b57/68c32c3a1ade9eff15fe4e85_WITPAC-Student-Packet-2024-768x994.webp", "tech_support_booking": "https://calendly.com/manuelm-evergreensafety/", "zoom_download": "https://zoom.us/download", "lms_help": "https://www.esc.org/how-to-access-your-online-course"}'::jsonb
) ON CONFLICT (program_code) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  resources = EXCLUDED.resources;

-- Flagger Certification
INSERT INTO public.training_programs (
  program_code, program_name, provider,
  description, delivery_methods, passing_score, requirements
) VALUES (
  'WA_FLAGGER',
  'Washington State Flagger Certification',
  'Evergreen Safety Council',
  'Flagger certification for traffic control in work zones. Covers MUTCD signal standards, hi-vis apparel requirements, and work zone safety protocols.',
  ARRAY['online_live', 'in_person'],
  80,
  '{"valid_id": true, "attend_full_class": true}'::jsonb
) ON CONFLICT (program_code) DO NOTHING;

-- Traffic Control Supervisor
INSERT INTO public.training_programs (
  program_code, program_name, provider,
  description, delivery_methods, passing_score, requirements
) VALUES (
  'TCS',
  'Traffic Control Supervisor Certification',
  'Evergreen Safety Council',
  'Advanced certification for supervisors overseeing traffic control operations in work zones. Covers TCP development, MUTCD compliance, and team coordination.',
  ARRAY['online_live', 'in_person'],
  80,
  '{"valid_id": true, "attend_full_class": true}'::jsonb
) ON CONFLICT (program_code) DO NOTHING;

-- PEVO Instructor
INSERT INTO public.training_programs (
  program_code, program_name, provider,
  description, delivery_methods, requirements
) VALUES (
  'PEVO_INSTRUCTOR',
  'PEVO Instructor Certification',
  'Evergreen Safety Council',
  'Train-the-trainer program for experienced PEVOs who want to teach pilot car certification courses. Requires existing PEVO certification and field experience.',
  ARRAY['in_person', 'online_live'],
  '{"existing_pevo_cert": true, "field_experience_required": true}'::jsonb
) ON CONFLICT (program_code) DO NOTHING;

-- Flagger Instructor
INSERT INTO public.training_programs (
  program_code, program_name, provider,
  description, delivery_methods, requirements
) VALUES (
  'FLAGGER_INSTRUCTOR',
  'Flagger Instructor Certification',
  'Evergreen Safety Council',
  'Train-the-trainer program for experienced flaggers who want to teach flagger certification courses.',
  ARRAY['in_person', 'online_live'],
  '{"existing_flagger_cert": true, "field_experience_required": true}'::jsonb
) ON CONFLICT (program_code) DO NOTHING;

-- RLS
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_public_read" ON public.training_programs FOR SELECT USING (true);
CREATE POLICY "sr_training" ON public.training_programs FOR ALL USING (auth.role() = 'service_role');

-- Update WITPAC reciprocity states in certification rules
-- These states accept WITPAC certs specifically
UPDATE public.pevo_certification_rules 
SET additional_notes = COALESCE(additional_notes, '') || ' WITPAC accepted.'
WHERE state_code IN ('AZ','CO','FL','GA','MN','NC','OK','UT','VA','WA');
