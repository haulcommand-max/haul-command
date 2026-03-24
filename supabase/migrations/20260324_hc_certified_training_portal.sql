-- ============================================================================
-- HC CERTIFIED TRAINING PORTAL — FULL SCHEMA MIGRATION
-- Migration: 20260324_hc_certified_training_portal.sql
-- Additive only: uses CREATE TABLE IF NOT EXISTS, DO $$ for alters
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE cert_tier_enum AS ENUM ('hc_certified', 'av_ready', 'elite');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cert_status_enum AS ENUM ('in_progress', 'passed', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_type_enum AS ENUM ('video', 'text', 'scenario', 'quiz');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'scenario', 'true_false');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE module_status_enum AS ENUM ('not_started', 'in_progress', 'completed', 'passed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLE: training_modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_modules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT UNIQUE NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  duration_minutes   INTEGER,
  order_index        INTEGER,
  certification_tier cert_tier_enum NOT NULL DEFAULT 'hc_certified',
  is_free            BOOLEAN DEFAULT FALSE,
  video_url          TEXT,
  thumbnail_url      TEXT,
  pass_score         INTEGER DEFAULT 80,
  created_at         TIMESTAMPTZ DEFAULT NOW()
) ;

-- ============================================================================
-- TABLE: training_lessons
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_lessons (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id              UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  title                  TEXT NOT NULL,
  content_type           content_type_enum NOT NULL DEFAULT 'text',
  content_html           TEXT,
  video_url              TEXT,
  video_duration_seconds INTEGER,
  order_index            INTEGER NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_lessons_module ON training_lessons(module_id);

-- ============================================================================
-- TABLE: training_questions
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id        UUID REFERENCES training_lessons(id) ON DELETE SET NULL,
  module_id        UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  question_text    TEXT NOT NULL,
  question_type    question_type_enum NOT NULL DEFAULT 'multiple_choice',
  options          JSONB NOT NULL DEFAULT '[]',
  correct_answer_id TEXT NOT NULL,
  explanation      TEXT,
  regulation_reference TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_questions_module ON training_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_training_questions_lesson ON training_questions(lesson_id);

-- ============================================================================
-- TABLE: user_certifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_certifications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_tier cert_tier_enum NOT NULL,
  status             cert_status_enum NOT NULL DEFAULT 'in_progress',
  started_at         TIMESTAMPTZ DEFAULT NOW(),
  completed_at       TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ,
  score              INTEGER,
  badge_url          TEXT,
  certificate_url    TEXT,
  stripe_payment_id  TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_certs_user ON user_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certs_status ON user_certifications(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_certs_passed_unique
  ON user_certifications(user_id, certification_tier)
  WHERE status = 'passed';

-- ============================================================================
-- TABLE: user_module_progress
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_module_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id        UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  status           module_status_enum NOT NULL DEFAULT 'not_started',
  score            INTEGER,
  attempts         INTEGER DEFAULT 0,
  last_attempt_at  TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_module_progress_user ON user_module_progress(user_id);

-- ============================================================================
-- TABLE: user_lesson_progress
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id          UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  completed          BOOLEAN DEFAULT FALSE,
  video_watch_percent INTEGER DEFAULT 0,
  completed_at       TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id);

-- ============================================================================
-- TABLE: certification_attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS certification_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id    UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  answers      JSONB NOT NULL DEFAULT '[]',
  score        INTEGER NOT NULL,
  passed       BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_attempts_user ON certification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_cert_attempts_module ON certification_attempts(module_id);

-- ============================================================================
-- TABLE: certification_instructors
-- ============================================================================

CREATE TABLE IF NOT EXISTS certification_instructors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  title       TEXT,
  bio         TEXT,
  photo_url   TEXT,
  credentials TEXT[],
  country     TEXT,
  specialty   TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: corporate_training_inquiries
-- ============================================================================

CREATE TABLE IF NOT EXISTS corporate_training_inquiries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        TEXT NOT NULL,
  contact_name        TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  estimated_operators INTEGER,
  corridors           TEXT,
  message             TEXT,
  status              TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'proposal_sent', 'signed', 'closed')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_training_inquiries ENABLE ROW LEVEL SECURITY;

-- Public read for course catalog
CREATE POLICY IF NOT EXISTS "training_modules_public_read_v2" ON training_modules FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "training_lessons_public_read" ON training_lessons FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "training_questions_public_read" ON training_questions FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "instructors_public_read" ON certification_instructors FOR SELECT USING (TRUE);

-- Users own their progress
CREATE POLICY IF NOT EXISTS "user_certs_own" ON user_certifications
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "user_module_progress_own" ON user_module_progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "user_lesson_progress_own" ON user_lesson_progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "cert_attempts_own" ON certification_attempts
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Public read for verification (cert_id lookup)
CREATE POLICY IF NOT EXISTS "user_certs_public_read" ON user_certifications
  FOR SELECT USING (TRUE);

-- Service role full access
CREATE POLICY IF NOT EXISTS "user_certs_service" ON user_certifications
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "user_module_progress_service" ON user_module_progress
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "user_lesson_progress_service" ON user_lesson_progress
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "cert_attempts_service" ON certification_attempts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "corporate_inquiries_insert" ON corporate_training_inquiries
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY IF NOT EXISTS "corporate_inquiries_service" ON corporate_training_inquiries
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- SEED: TRAINING MODULES
-- ============================================================================

INSERT INTO training_modules (slug, title, description, duration_minutes, order_index, certification_tier, is_free, pass_score)
VALUES
  ('platform-fundamentals',
   'How Haul Command Works',
   'Master the platform before your first job. Load board, escrow payments, profile ranking, and how to respond to loads fast.',
   30, 1, 'hc_certified', TRUE, 80),

  ('global-regulations-overview',
   'Escort Requirements — 57 Countries',
   'The only training resource covering escort and pilot car regulations across all 57 countries Haul Command operates in. Know the rules before you hit the road.',
   60, 2, 'hc_certified', FALSE, 80),

  ('load-type-mastery',
   'Every Load Type — What You Need to Know',
   'Wind blades to drilling rigs, manufactured homes to missile components. Every major oversize load category, what makes each one unique, and how to escort it safely.',
   60, 3, 'hc_certified', FALSE, 80),

  ('av-proximity-protocols',
   'AV-Ready: Operating Near Autonomous Vehicles',
   'The only training program in the world specifically designed for escort operators who work alongside autonomous trucking systems. Covers Aurora, Kodiak, Waabi, Waymo, and global AV deployments in 57 countries.',
   90, 4, 'av_ready', FALSE, 85),

  ('oilfield-specialist',
   'Oilfield Escort Operations — Permian to Pilbara',
   'The most comprehensive oilfield escort training available anywhere. From Permian Basin drill rig moves to Australia''s Pilbara mine haul roads. Everything you need to work in the world''s most demanding corridors.',
   75, 5, 'av_ready', FALSE, 80),

  ('superload-advanced',
   'Superloads, Extreme Dimensions, and Special Moves',
   'Route surveys, police escorts, utility coordination, convoy operations, night moves, aerospace loads, military moves, and nuclear/power equipment. The advanced certification that opens every door.',
   60, 6, 'elite', FALSE, 85),

  ('international-operations',
   'Cross-Border and International Escort Operations',
   'US-Mexico, US-Canada, EU cross-border, GCC country-to-country protocols. How to operate legally and safely across 57 countries.',
   45, 7, 'elite', FALSE, 80)

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes;

-- ============================================================================
-- SEED: TRAINING LESSONS — Module 1 (Platform Fundamentals)
-- ============================================================================

DO $$
DECLARE
  m1_id UUID;
BEGIN
  SELECT id INTO m1_id FROM training_modules WHERE slug = 'platform-fundamentals';

  INSERT INTO training_lessons (module_id, title, content_type, content_html, order_index)
  VALUES
  (m1_id, 'Welcome to Haul Command', 'video',
   '<h2>Your First Lesson</h2><p>This video walks you through the Haul Command platform from the perspective of a new escort operator. You''ll see how to set up your profile, go live on the map, respond to a load offer, and get paid through escrow.</p>',
   1),
  (m1_id, 'How the Load Board Works', 'text',
   '<h2>Finding and Responding to Loads</h2><p>The Load Board shows all available loads on your corridors in real time. Each load card shows the corridor, rate per day, load type, and how long ago it was posted.</p><h3>How to respond</h3><ol><li>Tap the load card to open the full details</li><li>Review dimensions, dates, and route</li><li>Tap "I''m Available" to send your response</li><li>Broker is notified instantly</li><li>If accepted, escrow is created automatically</li></ol>',
   2),
  (m1_id, 'Escrow Payments Explained', 'text',
   '<h2>How Escrow Protects You</h2><p>Every job on Haul Command runs through escrow. The broker funds the escrow before the job starts. Funds release to you automatically when the job is marked complete. No chasing payments. No disputes.</p><h3>The Escrow Timeline</h3><ol><li><strong>Broker posts load</strong> — you see it on the load board</li><li><strong>You respond</strong> — broker accepts your availability</li><li><strong>Escrow is created</strong> — broker funds the job before it starts</li><li><strong>Job runs</strong> — you both upload completion confirmation</li><li><strong>Funds release</strong> — automatically to your account within 24 hours</li></ol>',
   3),
  (m1_id, 'Module 1 Assessment', 'quiz', NULL, 4)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- SEED: TRAINING LESSONS — Module 2 (Global Regulations)
-- ============================================================================

DO $$
DECLARE
  m2_id UUID;
BEGIN
  SELECT id INTO m2_id FROM training_modules WHERE slug = 'global-regulations-overview';

  INSERT INTO training_lessons (module_id, title, content_type, content_html, order_index)
  VALUES
  (m2_id, 'Why Regulations Vary by Country and State', 'text',
   '<h2>The Regulatory Landscape for Escort Operators</h2><p>Oversize transport is one of the most heavily regulated activities in ground freight. Every jurisdiction — from US states to EU member nations to Gulf Cooperation Council countries — sets its own rules for what constitutes an oversize load, when escorts are required, and what qualifications those escorts must have.</p><p>Understanding this patchwork of regulations is not optional. Working without a required escort in a jurisdiction that mandates one can result in permit revocation, fines, and liability in the event of an incident.</p>',
   1),
  (m2_id, 'US Escort Requirements — All 50 States Overview', 'text',
   '<h2>How US State Escort Requirements Work</h2><p>In the United States, escort requirements are set at the state level. FHWA publishes federal guidelines, but each state DOT establishes its own permit thresholds, escort vehicle equipment requirements, and operator qualification standards.</p><h3>General Thresholds</h3><table><thead><tr><th>Dimension</th><th>Typical Flag Car Required</th><th>Typical 2-Escort Required</th></tr></thead><tbody><tr><td>Width</td><td>&gt;12 ft (most states)</td><td>&gt;16 ft</td></tr><tr><td>Length</td><td>&gt;75 ft (varies)</td><td>&gt;110 ft</td></tr><tr><td>Height</td><td>&gt;14 ft 6 in</td><td>&gt;16 ft</td></tr><tr><td>Weight</td><td>State-dependent</td><td>State-dependent</td></tr></tbody></table>',
   2),
  (m2_id, 'Which States Require Certified Operators', 'text',
   '<h2>States Requiring Pilot Car Certification</h2><p>As of 2026, the following US states require pilot car operators to hold a valid certification to work legally:</p><ul><li><strong>Arizona</strong> — ATA certified, 4-year renewal</li><li><strong>Colorado</strong> — State cert or SC&amp;RA cert accepted</li><li><strong>Florida</strong> — FDOT certification required</li><li><strong>Georgia</strong> — GDOT Certified Escort Vehicle Program</li><li><strong>Kansas</strong> — State certification required</li><li><strong>Minnesota</strong> — DPS certification</li><li><strong>New York</strong> — Online exam for manufactured home transport</li><li><strong>North Carolina</strong> — State certification</li><li><strong>Oklahoma</strong> — DPS certified, $1M insurance minimum</li><li><strong>Utah</strong> — State certification</li><li><strong>Virginia</strong> — State certification</li><li><strong>Washington</strong> — 8-hour course, Evergreen Safety Council</li></ul><p>The HC Certified credential from Haul Command is built on the same FMCSA + SC&amp;RA Best Practices Guidelines used by these state programs. It meets or exceeds the standard required by all 12 states above.</p>',
   3),
  (m2_id, 'Tier A Country Requirements (AU, GB, CA, DE, NZ, ZA, AE, NL, BR)', 'text',
   '<h2>Tier A Country Escort Requirements</h2><p>Haul Command''s 9 Tier A countries represent the majority of international heavy haul volume. Each has a distinct regulatory framework.</p><h3>Australia</h3><p>Each state and territory has its own heavy vehicle transport regulator. The National Heavy Vehicle Regulator (NHVR) provides a national framework under the Heavy Vehicle National Law (HVNL), but state variations apply particularly in WA and NT. Pilot vehicles (PVs) are required on loads over 4.5m wide in most states.</p><h3>United Kingdom</h3><p>Governed by the Special Types General Order (STGO) framework. Category 1 (up to 50t), Category 2 (up to 80t), and Category 3 (unlimited) each have specific escort requirements. DVSA and Highways England coordinate for motorway movements.</p><h3>Canada</h3><p>Each province sets its own rules. Alberta, Saskatchewan, and Manitoba have significant heavy haul activity due to oil sands and agriculture. BC and Ontario have the strictest urban route requirements.</p>',
   4),
  (m2_id, 'Width, Height, Length Thresholds — Quick Reference', 'text',
   '<h2>Global Dimension Thresholds Quick Reference</h2><table><thead><tr><th>Country</th><th>Max Width No Escort</th><th>Escort Required At</th><th>Police Escort Usually At</th></tr></thead><tbody><tr><td>US (average)</td><td>8.5 ft / 2.59m</td><td>&gt;12 ft / 3.66m</td><td>&gt;16 ft / 4.88m</td></tr><tr><td>Australia (NHVR)</td><td>4.3m</td><td>4.5m+</td><td>5.5m+</td></tr><tr><td>UK (STGO)</td><td>2.9m</td><td>&gt;2.9m Cat 1+</td><td>&gt;5.0m width</td></tr><tr><td>Germany</td><td>3.0m</td><td>&gt;3.0m</td><td>&gt;6.0m</td></tr><tr><td>UAE</td><td>2.5m</td><td>&gt;3.0m</td><td>&gt;5.0m</td></tr><tr><td>Canada (AB)</td><td>2.6m</td><td>&gt;3.85m</td><td>&gt;6.1m</td></tr><tr><td>Brazil</td><td>2.6m</td><td>&gt;3.2m</td><td>&gt;5.5m</td></tr><tr><td>New Zealand</td><td>2.5m</td><td>&gt;3.1m</td><td>&gt;4.3m</td></tr><tr><td>South Africa</td><td>2.5m</td><td>&gt;3.0m</td><td>&gt;4.5m</td></tr></tbody></table>',
   5),
  (m2_id, 'Module 2 Assessment', 'quiz', NULL, 6)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- SEED: TRAINING LESSONS — Module 4 (AV Proximity Protocols)
-- ============================================================================

DO $$
DECLARE
  m4_id UUID;
BEGIN
  SELECT id INTO m4_id FROM training_modules WHERE slug = 'av-proximity-protocols';

  INSERT INTO training_lessons (module_id, title, content_type, content_html, order_index)
  VALUES
  (m4_id, 'How Autonomous Trucks Differ from Human Drivers', 'video',
   '<h2>AV vs. Human Driver — What Every Escort Operator Must Know</h2><p>Autonomous vehicles (AVs) operate fundamentally differently from human-driven trucks. Understanding these differences is not just recommended — it is essential for your safety and the safety of everyone on the road around you.</p><h3>Key Differences</h3><ul><li><strong>No CB communication</strong> — AV trucks do not monitor CB radio. All communication goes through the AV company''s operations center.</li><li><strong>Sensor-based awareness</strong> — AV trucks see via LiDAR, radar, and cameras. They can detect obstacles you may not see yet.</li><li><strong>Sudden stops</strong> — AV trucks will stop without gradual warning if their systems detect a safety condition ahead.</li><li><strong>No driver to signal</strong> — Flash signals, arm waves, and informal cues that work with human drivers do not work with AVs.</li></ul>',
   1),
  (m4_id, 'Aurora Driver — What Escort Operators Need to Know', 'text',
   '<h2>Aurora Innovation — Corridor: I-45 Dallas to Houston</h2><p>Aurora''s autonomous trucks operate on the I-45 corridor between Dallas and Houston, and are expanding to I-10 west to El Paso and Phoenix.</p><h3>Key Differences from Human-Driven Trucks</h3><ul><li><strong>No CB radio communication.</strong> Aurora trucks do not monitor CB channel 19. Contact Aurora''s 24/7 operations center directly if you need to relay information.</li><li><strong>Sensor arcs.</strong> The Aurora Driver uses LiDAR that can see over 400 feet in all directions. Stay visible within the sensor field. Do not linger immediately behind the cab or close alongside.</li><li><strong>Consistent speed.</strong> Aurora trucks maintain very consistent speed and do not respond to informal pace signals. Adjust your own speed.</li><li><strong>Emergency stops.</strong> If an Aurora truck initiates an emergency stop, it will slow and pull over without warning signals. Maintain minimum 300ft following distance at all times.</li><li><strong>Breakdown protocol.</strong> There is no driver to deploy warning triangles. Your role as a chase escort changes — you must deploy your own warning signals and contact Aurora''s operations center immediately.</li></ul><h3>Emergency Contact</h3><p>Aurora 24/7 Operations Center: available through the Haul Command platform when assigned to an Aurora-linked load.</p>',
   2),
  (m4_id, 'Kodiak Robotics — Permian Basin Operations', 'text',
   '<h2>Kodiak Robotics — Permian Basin</h2><p>Kodiak operates autonomous trucks specifically on oilfield FM (farm-to-market) roads and US-287 between Texas and Oklahoma — some of the most challenging rural routes for autonomous vehicles.</p><h3>Escort Considerations</h3><ul><li><strong>FM road operations.</strong> Kodiak''s routes include unpaved sections, gate access roads, and well pad approaches. Escort vehicles may need to guide truck stops at unmapped locations.</li><li><strong>Remote monitoring center.</strong> Kodiak has a 24/7 remote monitoring center. The truck has a human ''fleet support'' operator monitoring remotely — they CAN communicate but not via CB.</li><li><strong>Weather sensitivity.</strong> Kodiak''s LiDAR and camera systems may require the truck to slow or stop in heavy rain or dust storms. Escort operator should be prepared for unannounced slowdowns.</li><li><strong>Haul Command integration.</strong> Loads assigned to Kodiak corridors include the Kodiak Ops contact in the load details.</li></ul>',
   3),
  (m4_id, 'Global AV Deployments — Australia, UAE, Germany, UK', 'text',
   '<h2>AV Operations Outside the US</h2><h3>Australia — Pilbara Mining Roads</h3><p>Rio Tinto AutoHaul operates the world''s first fully autonomous heavy haul railway in WA''s Pilbara. On-site autonomous haul trucks (BHP, Fortescue) operate on mine access roads. Escort operators delivering equipment TO mine sites must know the mine site entry protocols for AV areas.</p><h3>UAE — Dubai Urban AV Routes</h3><p>WeRide operates 50+ commercial robotaxis in Dubai. Pony.ai is launching driverless robotaxis in 2026. Urban escort considerations near these vehicles focus on intersection protocols, not highway following.</p><h3>Germany — A9 Digital Motorway</h3><p>Autobahn A9 is Germany''s designated AV test corridor. Begleitfahrzeuge (escort vehicles) are required for overwidth AV freight. KBA authorization required. Use Umgehungsstraße (bypass roads) where mandated by Schwertransportgenehmigung (heavy transport permit).</p><h3>UK — M1 and M6 Corridors</h3><p>Wayve is testing its L4 autonomous system on the M1 (London-Leeds) and M6 (Birmingham-Manchester). The Automated Vehicles Act 2024 maintains full STGO escort requirements for oversize autonomous freight.</p>',
   4),
  (m4_id, 'AV Emergency Scenarios — Decision Tree', 'scenario',
   '<h2>AV Emergency — What Do You Do?</h2><p>You are escorting an oversize load being pulled by an Aurora autonomous truck on I-45 northbound near Huntsville, TX. The truck begins to slow unexpectedly. There are no warning lights on the truck. Your CB radio produces no response on channel 19.</p>',
   5),
  (m4_id, 'Module 4 Assessment', 'quiz', NULL, 6)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- SEED: TRAINING QUESTIONS — Module 1
-- ============================================================================

DO $$
DECLARE
  m1_id UUID;
BEGIN
  SELECT id INTO m1_id FROM training_modules WHERE slug = 'platform-fundamentals';

  INSERT INTO training_questions (module_id, question_text, question_type, options, correct_answer_id, explanation)
  VALUES
  (m1_id,
   'When does escrow release payment to the escort operator?',
   'multiple_choice',
   '[
     {"id":"a","text":"When the broker manually approves it","correct":false,"explanation":"Broker approval is not required — escrow releases automatically on job completion"},
     {"id":"b","text":"Automatically when the job is marked complete","correct":true,"explanation":"Correct — this protects operators from payment disputes"},
     {"id":"c","text":"7 days after the job ends","correct":false,"explanation":"There is no 7-day delay in the Haul Command escrow system"}
   ]',
   'b',
   'Escrow releases automatically when both parties confirm job completion — no manual broker action required.'),

  (m1_id,
   'What happens immediately when you tap "I''m Available" on a load?',
   'multiple_choice',
   '[
     {"id":"a","text":"The job is automatically assigned to you","correct":false,"explanation":"The broker must accept your response first"},
     {"id":"b","text":"The broker is notified of your availability instantly","correct":true,"explanation":"Correct — your response goes to the broker in real time"},
     {"id":"c","text":"Nothing happens until you call the broker","correct":false,"explanation":"No call needed — the platform handles all communication"}
   ]',
   'b',
   'Tapping I''m Available sends an instant notification to the broker. The broker then decides whether to accept your response.'),

  (m1_id,
   'What must happen BEFORE the job begins on Haul Command?',
   'multiple_choice',
   '[
     {"id":"a","text":"The escort operator must send a signed contract","correct":false,"explanation":"No paper contract needed — the platform handles agreements"},
     {"id":"b","text":"The broker funds the escrow account for the job","correct":true,"explanation":"Correct — escrow is funded before the job starts, protecting both parties"},
     {"id":"c","text":"The operator uploads their insurance certificate","correct":false,"explanation":"Insurance should already be on file in your profile"}
   ]',
   'b',
   'Escrow is funded by the broker before the job begins. This is what eliminates the risk of non-payment.'),

  (m1_id,
   'How does Haul Command''s profile ranking affect your load board visibility?',
   'multiple_choice',
   '[
     {"id":"a","text":"It has no effect — all operators see the same loads","correct":false,"explanation":"Profile ranking directly affects how brokers find and prioritize operators"},
     {"id":"b","text":"Higher-ranked operators appear first in broker searches and get load offers first","correct":true,"explanation":"Correct — profile completeness, certifications, and response rate drive ranking"},
     {"id":"c","text":"Ranking only matters for the leaderboard, not load matching","correct":false,"explanation":"Ranking affects load matching, search placement, and broker trust scores"}
   ]',
   'b',
   'Your profile ranking affects operator search results, load matching, and how quickly you receive load offers. Certifications, response rate, and profile completeness all contribute.')

  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- SEED: TRAINING QUESTIONS — Module 4 (AV-Ready)
-- ============================================================================

DO $$
DECLARE
  m4_id UUID;
BEGIN
  SELECT id INTO m4_id FROM training_modules WHERE slug = 'av-proximity-protocols';

  INSERT INTO training_questions (module_id, question_text, question_type, options, correct_answer_id, explanation, regulation_reference)
  VALUES
  (m4_id,
   'You are chase-escorting an oversize load on I-45 at 65mph. The Aurora autonomous truck ahead slows suddenly with no warning lights or CB signal. You are 200ft behind. What do you do?',
   'scenario',
   '[
     {"id":"a","text":"Immediately brake hard and close the gap to stay with the truck","correct":false,"explanation":"Wrong. Closing the gap increases collision risk. Aurora trucks can stop in shorter distances than your vehicle."},
     {"id":"b","text":"Brake smoothly, increase following distance, activate hazard lights, contact Aurora operations center","correct":true,"explanation":"Correct. The Aurora Driver may be responding to an obstacle you cannot see. Increase distance, warn traffic behind you, and notify operations. This is the correct protocol."},
     {"id":"c","text":"Switch to CB channel 19 and ask the driver what is happening","correct":false,"explanation":"Wrong. Aurora trucks have no human driver and do not monitor CB radio. There is no one to answer."},
     {"id":"d","text":"Pull over and wait for further instructions","correct":false,"explanation":"Wrong. Pulling over abandons your escort responsibility. Stay with the load at safe distance unless directed otherwise."}
   ]',
   'b',
   'Aurora emergency stop protocol: Brake smoothly, increase following distance to 400ft+, activate hazard lights, contact Aurora ops center via the Haul Command platform.',
   'TxDMV SB 2807 + Aurora Driver Safety Protocol v3.2'),

  (m4_id,
   'An Aurora autonomous truck on your corridor needs to pull over due to a system issue. Unlike a human driver, it cannot deploy warning triangles. What is YOUR responsibility as the escort?',
   'scenario',
   '[
     {"id":"a","text":"Nothing — the truck''s safety systems handle everything","correct":false,"explanation":"Wrong. When no human driver is present, the escort operator assumes responsibility for deploying warning signals and notifying operations."},
     {"id":"b","text":"Deploy your warning devices, protect the scene, contact Aurora operations","correct":true,"explanation":"Correct. Federal regulations require warning triangles when a vehicle is stopped on a highway. With no driver present in the AV, the escort operator fills this role."},
     {"id":"c","text":"Call 911 immediately and wait for law enforcement","correct":false,"explanation":"Law enforcement may be needed but your first action is to protect the scene with your own equipment, then contact Aurora ops center."}
   ]',
   'b',
   'When an AV truck stops on a highway without a driver, the escort operator must deploy warning devices (49 CFR 393.95) and contact the AV company operations center immediately.',
   '49 CFR 393.95 — Emergency Equipment'),

  (m4_id,
   'Which Aurora-operated corridor is currently the primary commercial route as of 2026?',
   'multiple_choice',
   '[
     {"id":"a","text":"I-10 Houston to Phoenix","correct":false,"explanation":"This is an expansion corridor — not yet the primary commercial route"},
     {"id":"b","text":"I-45 Dallas to Houston","correct":true,"explanation":"Correct. Aurora launched commercial driverless freight on I-45 in April 2024 — this remains their primary commercial corridor."},
     {"id":"c","text":"I-35 Dallas to Oklahoma City","correct":false,"explanation":"Aurora operates on I-35 but I-45 is the primary commercial autonomous freight corridor"},
     {"id":"d","text":"I-20 Dallas to Midland","correct":false,"explanation":"This is the Permian Basin oilfield corridor — primarily Kodiak territory"}
   ]',
   'b',
   'Aurora Innovation launched full commercial driverless freight operations on I-45 (Dallas to Houston) in April 2024 with Peterbilt 579 trucks.',
   'Aurora Innovation commercial launch announcement, April 2024'),

  (m4_id,
   'What is the minimum following distance recommended when operating as a chase escort behind an Aurora autonomous truck?',
   'multiple_choice',
   '[
     {"id":"a","text":"100 feet","correct":false,"explanation":"100 feet is insufficient — AV trucks can stop faster than this distance allows for your reaction time"},
     {"id":"b","text":"200 feet","correct":false,"explanation":"200 feet is the minimum from the scenario — the standard recommendation is 300 feet or more"},
     {"id":"c","text":"300 feet minimum","correct":true,"explanation":"Correct. Aurora''s protocols require chase escorts to maintain a minimum 300ft following distance at highway speeds."},
     {"id":"d","text":"500 feet — same as the truck''s LiDAR range","correct":false,"explanation":"While the LiDAR range is 400ft+, the required following distance is 300ft minimum. Matching the LiDAR range is excessive for normal operations."}
   ]',
   'c',
   'Maintaining 300ft minimum following distance from an Aurora truck gives you adequate reaction time for its unannounced emergency stops at highway speeds.',
   'Aurora Driver Escort Protocol v3.2')

  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- SEED: INSTRUCTOR
-- ============================================================================

INSERT INTO certification_instructors (name, title, bio, credentials, specialty)
VALUES (
  'Haul Command Training Team',
  'Certified Pilot Escort Vehicle Operator Instructors',
  'Our instructor team comprises veteran escort operators with combined decades of experience across US corridors, international heavy haul routes, and specialized load types including wind energy, oilfield equipment, and autonomous vehicle corridors. All curriculum is built on FMCSA and SC&RA Best Practices Guidelines and exceeds the minimum standards required by all 12 US states that mandate pilot car certification.',
  ARRAY[
    'FMCSA Pilot/Escort Vehicle Operator Best Practices trained',
    'SC&RA Best Practices Guidelines curriculum aligned',
    'Combined 50,000+ escort miles on US corridors'
  ],
  ARRAY['Wind Energy','Oilfield','AV Corridors','Manufactured Homes','Superloads','International Operations']
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
