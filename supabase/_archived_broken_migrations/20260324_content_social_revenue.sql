-- ============================================================
-- Haul Command — Content Machine v3 + Social + Revenue
-- Migration: 20260324_content_social_revenue.sql
-- Safe to run on existing DB (CREATE TABLE IF NOT EXISTS)
-- ============================================================

-- ── Content Topics ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_topics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic         text NOT NULL,
  keyword       text NOT NULL,
  type          text NOT NULL DEFAULT 'blog_article',
  audience      text NOT NULL DEFAULT 'general_public',
  country_code  text,
  region        text,
  corridor_id   uuid,
  priority      int NOT NULL DEFAULT 3,
  source        text DEFAULT 'manual',
  status        text NOT NULL DEFAULT 'pending',
  assigned_at   timestamptz,
  completed_at  timestamptz,
  blog_post_id  uuid,
  notes         text,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_topics_status_priority ON content_topics(status, priority);
CREATE INDEX IF NOT EXISTS content_topics_country ON content_topics(country_code);

-- ── Blog Posts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id              uuid REFERENCES content_topics(id) ON DELETE SET NULL,
  slug                  text UNIQUE NOT NULL,
  title                 text NOT NULL,
  meta_description      text,
  content               text NOT NULL,
  summary               text,
  keyword               text,
  country_code          text,
  region                text,
  audience              text DEFAULT 'general_public',
  status                text NOT NULL DEFAULT 'draft',
  published             boolean DEFAULT false,
  published_at          timestamptz,
  word_count            int,
  video_generated       boolean DEFAULT false,
  elai_video_id         text,
  video_status          text,
  video_url_en          text,
  video_urls            jsonb DEFAULT '{}',
  youtube_urls          jsonb DEFAULT '{}',
  social_posts_created  boolean DEFAULT false,
  views                 int DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_video ON blog_posts(video_generated, video_status);

-- ── Social Posts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id      uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  content_topic_id  uuid REFERENCES content_topics(id) ON DELETE SET NULL,
  platform          text NOT NULL,
  content           text NOT NULL,
  media_url         text,
  status            text NOT NULL DEFAULT 'draft',
  scheduled_for     timestamptz,
  posted_at         timestamptz,
  post_url          text,
  engagement        jsonb DEFAULT '{}',
  buffer_post_id    text,
  error_msg         text,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_posts_status ON social_posts(status, scheduled_for);

-- ── Permit Filings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permit_filings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  load_id           uuid,
  state             text NOT NULL,
  permit_type       text NOT NULL DEFAULT 'oversize',
  dimensions        jsonb NOT NULL DEFAULT '{}',
  route             jsonb NOT NULL DEFAULT '{}',
  status            text NOT NULL DEFAULT 'pending',
  stripe_payment_id text,
  amount_cents      int,
  permit_number     text,
  permit_pdf_url    text,
  filed_at          timestamptz,
  delivered_at      timestamptz,
  error_msg         text,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS permit_filings_user ON permit_filings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS permit_filings_status ON permit_filings(status);

-- ── Insurance Referrals ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS insurance_referrals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner           text NOT NULL DEFAULT 'nbis',
  placement         text,
  clicked_at        timestamptz DEFAULT now(),
  converted_at      timestamptz,
  policy_confirmed  boolean DEFAULT false,
  commission_amount numeric(10,2),
  paid_at           timestamptz,
  notes             text
);
CREATE INDEX IF NOT EXISTS insurance_referrals_user ON insurance_referrals(user_id);

-- ── Sponsors / Advertising ────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsors (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name      text NOT NULL,
  logo_url          text,
  website_url       text NOT NULL,
  placement_type    text NOT NULL,
  corridor_id       uuid,
  region            text,
  module_id         uuid,
  monthly_fee_cents int,
  active_from       date NOT NULL,
  active_to         date NOT NULL,
  impressions       int DEFAULT 0,
  clicks            int DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sponsors_dates ON sponsors(active_from, active_to);

-- ── Video Jobs (Elai.io) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id    uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  elai_video_id   text,
  language        text NOT NULL DEFAULT 'en',
  source_url      text,
  status          text NOT NULL DEFAULT 'queued',
  admin_approved  boolean DEFAULT false,
  approved_at     timestamptz,
  video_url       text,
  supabase_path   text,
  youtube_url     text,
  duration_secs   int,
  error_msg       text,
  attempts        int DEFAULT 0,
  last_polled_at  timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS video_jobs_status ON video_jobs(status, language);

-- ── RSS Alert Cache ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rss_alert_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_url      text NOT NULL,
  item_guid     text NOT NULL,
  title         text,
  link          text,
  published_at  timestamptz,
  topic_created boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(feed_url, item_guid)
);

CREATE TABLE IF NOT EXISTS rss_feed_config (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  url           text UNIQUE NOT NULL,
  topic_type    text DEFAULT 'blog_article',
  audience      text DEFAULT 'general_public',
  country_code  text,
  priority      int DEFAULT 2,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;
  ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE permit_filings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE insurance_referrals ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
  ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE rss_alert_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE rss_feed_config ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY IF NOT EXISTS "blog_public_read" ON blog_posts FOR SELECT USING (published = true);
CREATE POLICY IF NOT EXISTS "permits_own" ON permit_filings FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "insurance_own" ON insurance_referrals FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "sponsors_public" ON sponsors FOR SELECT USING (active_from <= current_date AND active_to >= current_date);
CREATE POLICY IF NOT EXISTS "svc_content_topics" ON content_topics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "svc_social_posts" ON social_posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "svc_video_jobs" ON video_jobs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "svc_rss" ON rss_alert_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "svc_rss_config" ON rss_feed_config FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "svc_sponsors" ON sponsors FOR ALL USING (auth.role() = 'service_role');

-- ── Seed: Content Topics (key evergreen keywords) ────────────
INSERT INTO content_topics (topic, keyword, type, audience, country_code, region, priority, source) VALUES
('Pilot car requirements in Texas 2026', 'pilot car requirements Texas', 'blog_article', 'general_public', 'us', 'tx', 4, 'keyword_db'),
('Pilot car requirements in California 2026', 'pilot car requirements California', 'blog_article', 'general_public', 'us', 'ca', 4, 'keyword_db'),
('Pilot car requirements in Florida 2026', 'pilot car requirements Florida', 'blog_article', 'general_public', 'us', 'fl', 4, 'keyword_db'),
('Pilot car requirements in North Dakota 2026', 'pilot car requirements North Dakota', 'blog_article', 'general_public', 'us', 'nd', 4, 'keyword_db'),
('Pilot car requirements in Pennsylvania 2026', 'pilot car requirements Pennsylvania', 'blog_article', 'general_public', 'us', 'pa', 4, 'keyword_db'),
('Pilot car requirements in Oklahoma 2026', 'pilot car requirements Oklahoma', 'blog_article', 'general_public', 'us', 'ok', 4, 'keyword_db'),
('Pilot car requirements in Wyoming 2026', 'pilot car requirements Wyoming', 'blog_article', 'general_public', 'us', 'wy', 4, 'keyword_db'),
('How much does a pilot car cost in Texas 2026', 'pilot car cost Texas', 'blog_article', 'broker', 'us', 'tx', 4, 'keyword_db'),
('How much does a pilot car cost in California 2026', 'pilot car cost California', 'blog_article', 'broker', 'us', 'ca', 4, 'keyword_db'),
('Average pilot car rates per mile 2026', 'pilot car rates per mile 2026', 'blog_article', 'broker', 'us', null, 3, 'keyword_db'),
('How escort operators work alongside Aurora autonomous trucks', 'Aurora autonomous truck escort requirements', 'blog_article', 'escort_operator', 'us', 'tx', 3, 'keyword_db'),
('What AV-Ready certified means for escort operators in 2026', 'AV ready escort certification 2026', 'blog_article', 'escort_operator', 'us', null, 3, 'keyword_db'),
('The human infrastructure behind self-driving trucks', 'escort requirements autonomous vehicles', 'blog_article', 'av_company', 'us', null, 3, 'keyword_db'),
('Kodiak Robotics Texas corridor escort operator guide', 'Kodiak Robotics escort requirements', 'blog_article', 'escort_operator', 'us', 'tx', 2, 'keyword_db'),
('Texas Permian Basin oilfield escort requirements 2026', 'Permian Basin escort requirements', 'blog_article', 'escort_operator', 'us', 'tx', 3, 'keyword_db'),
('North Dakota Bakken oilfield escort requirements 2026', 'Bakken oilfield escort requirements', 'blog_article', 'escort_operator', 'us', 'nd', 3, 'keyword_db'),
('Wind turbine transport escort guide 2026', 'wind turbine transport escort requirements', 'blog_article', 'broker', 'us', null, 3, 'keyword_db'),
('How to become a certified escort operator in 2026', 'how to become certified escort operator', 'blog_article', 'escort_operator', 'us', null, 3, 'keyword_db'),
('How to start a pilot car business in 2026', 'start pilot car business 2026', 'blog_article', 'escort_operator', 'us', null, 3, 'keyword_db'),
('Oversize load escort requirements in Australia 2026', 'oversize load escort Australia', 'blog_article', 'general_public', 'au', null, 3, 'keyword_db'),
('Pilot vehicle operator rules in the UK 2026', 'pilot vehicle operator rules UK', 'blog_article', 'general_public', 'gb', null, 3, 'keyword_db'),
('Oversize transport escort requirements in Germany 2026', 'oversize escort Germany Begleitfahrzeug', 'blog_article', 'general_public', 'de', null, 3, 'keyword_db'),
('Heavy haul escort requirements in the UAE 2026', 'heavy haul escort UAE requirements', 'blog_article', 'general_public', 'ae', null, 3, 'keyword_db'),
('Oversize load escort requirements in Canada 2026', 'oversize load escort Canada', 'blog_article', 'general_public', 'ca', null, 3, 'keyword_db'),
('How to find certified pilot car operators near me', 'find certified pilot car operators near me', 'blog_article', 'broker', 'us', null, 3, 'keyword_db'),
('Best load boards for oversize loads in 2026', 'best load boards oversize loads 2026', 'blog_article', 'broker', 'us', null, 3, 'keyword_db'),
('FMCSA escort vehicle requirements — what operators must know', 'FMCSA escort vehicle requirements', 'blog_article', 'escort_operator', 'us', null, 3, 'keyword_db'),
('SC&RA escort standards explained — definitive guide', 'SC&RA escort operator standards', 'blog_article', 'escort_operator', 'us', null, 3, 'keyword_db'),
('How escort operators make money in the oilfield 2026', 'oilfield escort operator income', 'blog_article', 'escort_operator', 'us', null, 3, 'keyword_db'),
('HC Certified vs OSHA certification — what escort operators need', 'escort operator certification requirements', 'blog_article', 'escort_operator', 'us', null, 3, 'keyword_db')
ON CONFLICT DO NOTHING;

-- ── Seed: RSS Feed Config ─────────────────────────────────────
INSERT INTO rss_feed_config (name, url, topic_type, audience, priority) VALUES
('Google Alert: autonomous trucking Texas', 'https://www.google.com/alerts/feeds/REPLACE_1/rss', 'blog_article', 'av_company', 2),
('Google Alert: Aurora Innovation freight', 'https://www.google.com/alerts/feeds/REPLACE_2/rss', 'blog_article', 'av_company', 2),
('Google Alert: oilfield Texas permit', 'https://www.google.com/alerts/feeds/REPLACE_3/rss', 'blog_article', 'escort_operator', 2),
('Google Alert: heavy haul escort', 'https://www.google.com/alerts/feeds/REPLACE_4/rss', 'blog_article', 'general_public', 2),
('Google Alert: pilot car requirements', 'https://www.google.com/alerts/feeds/REPLACE_5/rss', 'blog_article', 'general_public', 2)
ON CONFLICT DO NOTHING;

-- ── Lesson content for modules 3,5,6,7 ───────────────────────
INSERT INTO training_lessons (module_id, title, lesson_type, order_index, duration_minutes, content_text, is_free_preview)
SELECT m.id, l.title, l.lesson_type, l.order_index, l.duration_minutes, l.content_text, l.is_free_preview
FROM (VALUES
  -- MODULE 3: Load Type Mastery
  ('load-type-mastery', 'The 8 Core Load Types You''ll Encounter', 'video', 1, 12, 'Wind turbines, oilfield machinery, manufactured housing, bridge beams, transformers, aerospace components, military vehicles, and containerized cargo. Each has different escort requirements, different risks, and different permit needs. This module covers them all.', true),
  ('load-type-mastery', 'Wind Energy Loads — Blade, Nacelle, Tower', 'video', 2, 18, 'Wind turbine components are among the most complex escort jobs. Blades can exceed 200 feet. Nacelles weigh 400,000 lbs. Tower sections require specialized trailers. Learn how to position your escort vehicle, manage curve navigation, and communicate with the transport crew.', false),
  ('load-type-mastery', 'Oilfield Machinery — Drill Rigs, Frac Units, Compressors', 'video', 3, 15, 'Oilfield moves are time-critical. Drill rigs move in convoy. Frac units may travel at night. Learn the specific escort positioning for each equipment type, how to communicate with rig hands, and what to do when you hit an unexpected low-clearance bridge.', false),
  ('load-type-mastery', 'Manufactured Housing — Doubles, Triples, and Modular', 'video', 4, 10, 'Manufactured homes represent 30% of escort work in Texas and Florida. Doubles require front + rear. Triples require additional state police in some states. This lesson covers escort positioning, intersection management, and how to handle a load that''s shifted.', false),
  ('load-type-mastery', 'Transformers and Utility Equipment', 'video', 5, 14, 'Transformer moves are slow, heavy, and require careful utility coordination. Some transformers weigh 500+ tons and move at 5 mph. Learn how to coordinate with utility companies for power line lifts, how to scout the route, and what makes transformer moves uniquely dangerous.', false),
  ('load-type-mastery', 'Module 3 Assessment — Load Type Protocols', 'quiz', 6, 20, 'Assessment covering all 5 core load type categories. You need 80% to pass. Focus on escort positioning, communication protocols, and special requirements for each load type.', false),

  -- MODULE 5: Oilfield Specialist
  ('oilfield-specialist', 'The Oilfield Ecosystem — Basins, Players, and Demand Cycles', 'video', 1, 14, 'The Permian Basin, Eagle Ford, Bakken, Marcellus, DJ Basin. Each has different characteristics, different load types, and different permit requirements. Demand is cyclical — tied to oil price. Learn when oilfield work is abundant and how to position yourself in the slow seasons.', true),
  ('oilfield-specialist', 'TxDMV Oilfield Permits — The Subchapter D System', 'video', 2, 16, 'Texas has a dedicated permit system for oilfield equipment under TxDMV Subchapter D. These permits move faster than standard oversize permits. Learn which equipment qualifies, how to verify permit validity, and what to do if a load is stopped by TxDPS.', false),
  ('oilfield-specialist', 'Drill Rig Convoy Operations', 'video', 3, 20, 'Moving a full drill rig involves 20-40 trucks moving in sequence. You may escort 3-5 loads per day on the same route. Learn convoy spacing requirements, how to leapfrog escorts efficiently, and communication protocols between convoy operators.', false),
  ('oilfield-specialist', 'HAZMAT Awareness for Oilfield Escorts', 'video', 4, 12, 'Oilfield moves sometimes include pressurized vessels, chemical tanks, and equipment with residual hydrocarbons. You don''t need a HAZMAT endorsement to escort, but you need to know the risks, how to identify placard requirements, and what your responsibilities are in an incident.', false),
  ('oilfield-specialist', 'Balancing Act — Maximizing Oilfield Earnings', 'text', 5, 10, 'Oilfield escorts pay premium rates but require premium reliability. Learn how top oilfield escort operators structure their businesses: preferred carrier agreements, day rate vs per-mile debates, how to stay on active call lists for major operators like Pioneer and Halliburton.', false),
  ('oilfield-specialist', 'Module 5 Assessment — Oilfield Specialist', 'quiz', 6, 20, 'Assessment covering Permian Basin operations, TxDMV Subchapter D permits, convoy protocols, and HAZMAT awareness. Pass threshold: 80%.', false),

  -- MODULE 6: Superloads Advanced
  ('superloads-advanced', 'What Makes a Superload? Federal and State Definitions', 'video', 1, 12, 'A superload exceeds standard oversize thresholds by a significant margin. In Texas, any load over 20ft wide or 125ft long is a superload. Federal thresholds trigger a different permit and routing process. This lesson defines exactly where the line is in each state.', true),
  ('superloads-advanced', 'Route Surveys and Pre-Move Engineering', 'video', 2, 20, 'Superloads require a physical route survey before permits are approved. You''ll work alongside a route survey engineer to document bridge capacities, overhead clearances, and road conditions. Learn what surveyors look for and how your escort vehicle data contributes to route approval.', false),
  ('superloads-advanced', 'State Police Escorts — When Required, How They Work', 'video', 3, 15, 'Many states require state police escorts for loads over certain dimensions. Learn which states require police escorts at what thresholds, how to coordinate with the police escort team, who pays, and how the presence of police changes your role and responsibilities.', false),
  ('superloads-advanced', 'Nighttime Superload Operations', 'video', 4, 14, 'Some superloads can only move at night due to traffic restrictions or utility line lifting schedules. Night moves require heightened visibility, different communication protocols, and a clear plan for what happens at first light if the move isn''t complete.', false),
  ('superloads-advanced', 'Aerospace and Defense Loads — Special Protocols', 'video', 5, 16, 'NASA shuttle components, military vehicles, and aerospace equipment require special security protocols in addition to oversize permits. Learn security escort procedures, how to handle media attention on high-profile moves, and documentation requirements for defense contractors.', false),
  ('superloads-advanced', 'Module 6 Assessment — Superloads Advanced', 'quiz', 6, 20, 'Assessment covering superload definitions, route survey procedures, police escort coordination, and night operations. Pass threshold: 85%.', false),

  -- MODULE 7: International Operations
  ('international-operations', '57 Countries — The Global Heavy Haul Map', 'video', 1, 15, 'Haul Command operates across 57 countries. Each has its own escort terminology (pilot vehicle, follow vehicle, route blocker), certification requirements, and regulatory body. This lesson provides the global map — where the work is, what it pays, and how to navigate foreign permit systems.', true),
  ('international-operations', 'Australia — The High-Value Pacific Market', 'video', 2, 16, 'Australia is one of the highest-paying escort markets in the world. Pilot vehicle operators in Western Australia (mining) and Queensland (wind/coal) can earn AU$600-900/day. Learn NHVR requirements, state-specific rules, and how to get licensed to work in Australia as a US operator.', false),
  ('international-operations', 'UK and European Operations', 'video', 3, 18, 'The UK, Germany, Netherlands, and Belgium are major heavy haul markets tied to offshore wind and manufacturing. Learn STGO categories in the UK, German Schwertransport regulations, and how the EU cross-border permit system works for international moves.', false),
  ('international-operations', 'Middle East — UAE, Saudi Arabia, Qatar', 'video', 4, 14, 'The Gulf states are construction and oil & gas powerhouses with massive heavy haul demand. Learn the role of the Road Transport Authority in UAE, how to navigate permit systems in Saudi Arabia, and what makes GCC escort work fundamentally different from North American operations.', false),
  ('international-operations', 'Cross-Border Operations — Mexico and Canada', 'video', 5, 16, 'Cross-border movements between the US and its neighbors are common in certain corridors (Texas-Mexico, Montana-Alberta). Learn SEMARNAT requirements in Mexico, provincial regulations in Canada, and how your US certification ports over — or doesn''t.', false),
  ('international-operations', 'Module 7 Assessment — International Operations', 'quiz', 6, 25, 'Assessment covering global regulatory frameworks, major international markets, and cross-border protocols. Pass threshold: 80%.', false)
) AS l(module_slug, title, lesson_type, order_index, duration_minutes, content_text, is_free_preview)
JOIN training_modules m ON m.slug = l.module_slug
ON CONFLICT DO NOTHING;

-- ── Assessment Questions for Modules 3, 5, 6, 7 ──────────────
INSERT INTO training_questions (module_id, question_text, question_type, options, correct_answer_id, explanation, order_index)
SELECT m.id, q.question_text, q.question_type, q.options::jsonb, q.correct_answer_id, q.explanation, q.order_index
FROM (VALUES
  -- Module 3: Load Type Mastery
  ('load-type-mastery', 'A wind turbine blade exceeds the permitted length mid-route. What is the correct first action?', 'scenario',
   '[{"id":"a","text":"Continue moving until you reach the next safe stopping area, then notify the broker","correct":false,"explanation":"Continuing with an over-permitted load exposes you and the carrier to significant liability."},{"id":"b","text":"Stop the convoy immediately, call the permit office, and wait for amended permit before continuing","correct":true,"explanation":"Correct. An exceeded permit parameter requires an amended permit before continuing. The load must stop at the nearest safe location."},{"id":"c","text":"Slow to 5 mph and contact state police for guidance while moving","correct":false,"explanation":"Moving with an illegal permit configuration is still moving illegally, regardless of speed."},{"id":"d","text":"Return the load to origin and rebook the permit","correct":false,"explanation":"Returning to origin is unnecessary — an amended permit can be issued to cover the current position forward."}]',
   'b', 'Any load exceeding its permitted parameters must stop until the permit is amended. The escort operator is responsible for flagging this.', 1),

  ('load-type-mastery', 'When escorting a double-wide manufactured home, at what width does a rear escort become required in Texas?', 'multiple_choice',
   '[{"id":"a","text":"12 feet wide","correct":false,"explanation":"12 ft is within standard oversize — single front escort only."},{"id":"b","text":"14 feet wide","correct":false,"explanation":"14 ft triggers escort requirements but not rear in all cases."},{"id":"c","text":"16 feet wide","correct":true,"explanation":"Correct. In Texas, loads exceeding 16 ft wide require both front and rear escorts."},{"id":"d","text":"20 feet wide","correct":false,"explanation":"Loads over 20 ft are superloads with additional requirements beyond rear escort."}]',
   'c', 'Texas requires rear escort at 16+ ft wide. This is a commonly tested threshold on Texas DOT enforcement.', 2),

  -- Module 5: Oilfield Specialist
  ('oilfield-specialist', 'You are escorting a frac pump on a TxDMV Subchapter D oilfield permit. TxDPS stops your convoy and informs you the permit has expired. What do you do?', 'scenario',
   '[{"id":"a","text":"Argue that the permit was valid when you departed and continue moving","correct":false,"explanation":"Permits must be valid throughout the entire move. An expired permit during transit is a violation."},{"id":"b","text":"Contact the carrier immediately, have the convoy stop, and coordinate emergency permit renewal before continuing","correct":true,"explanation":"Correct. Stop the convoy, do not argue with TxDPS, and coordinate with the carrier to get the permit renewed before resuming."},{"id":"c","text":"Show the officer your HC Elite certification as proof of compliance","correct":false,"explanation":"Certification status does not override an expired transport permit."},{"id":"d","text":"Continue to the nearest city to await instructions from dispatch","correct":false,"explanation":"Continuing to move without a valid permit is a violation regardless of destination."}]',
   'b', 'Permits must be valid for the entire duration of movement. Stopping immediately and coordinating renewal is the only correct course of action.', 1),

  ('oilfield-specialist', 'Which TxDMV permit category covers oilfield equipment specifically?', 'multiple_choice',
   '[{"id":"a","text":"Subchapter A — Standard Oversize","correct":false,"explanation":"SubA is standard non-divisible oversize permits without oilfield-specific provisions."},{"id":"b","text":"Subchapter C — Superloads","correct":false,"explanation":"SubC is for extreme oversize loads above superload thresholds."},{"id":"c","text":"Subchapter D — Oilfield Equipment","correct":true,"explanation":"Correct. Subchapter D is specifically for oil and gas production equipment, with expedited processing and different fee structures."},{"id":"d","text":"Annual Permit — Blanket Authorization","correct":false,"explanation":"Annual permits exist but are not the oilfield-specific category."}]',
   'c', 'TxDMV Subchapter D provides expedited permits for oilfield equipment moving to and from active production sites. Critical knowledge for Texas oilfield escort work.', 2),

  -- Module 6: Superloads Advanced
  ('superloads-advanced', 'A state police escort has been assigned to your superload convoy. Who controls the movement of the convoy?', 'multiple_choice',
   '[{"id":"a","text":"The lead escort vehicle operator","correct":false,"explanation":"When police are present, they take authority over civilian escorts."},{"id":"b","text":"The transport truck driver","correct":false,"explanation":"The driver follows the escort team''s lead, but police have authority."},{"id":"c","text":"The state police officer","correct":true,"explanation":"Correct. When state police escort is assigned, they have command authority over convoy movement, speed, and stops. Your role becomes support."},{"id":"d","text":"The permit office dispatcher","correct":false,"explanation":"The permit office authorizes the move but does not control real-time operations."}]',
   'c', 'State police escorts take command authority. Your job becomes supporting their directives and managing communication with the carrier.', 1),

  ('superloads-advanced', 'During a nighttime superload move, sunrise is 30 minutes away and you are still 45 miles from your destination. What is the correct action?', 'scenario',
   '[{"id":"a","text":"Speed up to complete the move before sunrise","correct":false,"explanation":"Superloads have maximum speed limits and speeding creates extreme safety risk."},{"id":"b","text":"Continue at normal pace — sunrise restrictions only apply to standard oversize loads","correct":false,"explanation":"Many states restrict superload movement to nighttime hours. The restriction applies."},{"id":"c","text":"Find a safe staging area, park the load, and wait for the next permitted nighttime window","correct":true,"explanation":"Correct. If your permit restricts movement to nighttime hours and you cannot complete before sunrise, you must stop and stage the load safely."},{"id":"d","text":"Contact the permit office to request a daytime extension while moving","correct":false,"explanation":"Permit amendments require stopping. Calling while continuing to move with a potentially expired time window is non-compliant."}]',
   'c', 'Time-restricted permits must be respected. When a nighttime window closes, the load must stop at the nearest safe staging location.', 2),

  -- Module 7: International Operations
  ('international-operations', 'In Australia, which federal body oversees heavy vehicle compliance including oversize loads?', 'multiple_choice',
   '[{"id":"a","text":"AMSA (Australian Maritime Safety Authority)","correct":false,"explanation":"AMSA handles maritime safety, not road transport."},{"id":"b","text":"NHVR (National Heavy Vehicle Regulator)","correct":true,"explanation":"Correct. The NHVR is Australia''s national body for heavy vehicle compliance. All oversize permits in participating states go through NHVR."},{"id":"c","text":"ATA (Australian Trucking Association)","correct":false,"explanation":"ATA is an industry association, not a regulatory body."},{"id":"d","text":"DIRDA (Department of Infrastructure, Regional Development and Australia)","correct":false,"explanation":"This department provides policy oversight but NHVR handles operational compliance."}]',
   'b', 'NHVR is the National Heavy Vehicle Regulator — the key authority for all Australian oversize and heavy vehicle compliance. Essential knowledge for AU market operations.', 1),

  ('international-operations', 'You are coordinating a cross-border move from Texas into Mexico. Which Mexican authority administers oversize transport permits?', 'multiple_choice',
   '[{"id":"a","text":"CAPUFE (National Toll Road Authority)","correct":false,"explanation":"CAPUFE manages toll collection on federal highways, not oversize permits."},{"id":"b","text":"SICT (Ministry of Infrastructure, Communications and Transport)","correct":true,"explanation":"Correct. SICT (formerly SCT) is the Mexican federal authority for oversize transport permits. Known as permisos especiales de transporte."},{"id":"c","text":"SEMARNAT (Environment Ministry)","correct":false,"explanation":"SEMARNAT handles environmental permits, not transport permits."},{"id":"d","text":"AMAC (Mexican Association of Cargo Carriers)","correct":false,"explanation":"AMAC is an industry association, not a permit authority."}]',
   'b', 'SICT administers permisos especiales de transporte for oversize loads in Mexico. Cross-border Mexican moves require dual US and Mexican permit documentation.', 2)
) AS q(module_slug, question_text, question_type, options, correct_answer_id, explanation, order_index)
JOIN training_modules m ON m.slug = q.module_slug
ON CONFLICT DO NOTHING;
