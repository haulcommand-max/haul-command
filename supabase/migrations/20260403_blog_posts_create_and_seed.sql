-- ============================================================
-- HAUL COMMAND: blog_posts table creation + 10-post seed
-- Run in: Supabase SQL Editor (https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql/new)
-- ============================================================

-- STEP 1: Create blog_posts table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  meta_title            TEXT,
  meta_description      TEXT,
  excerpt               TEXT,
  h1                    TEXT,
  hero_image_url        TEXT,
  content_html          TEXT,
  published             BOOLEAN NOT NULL DEFAULT false,
  country_code          VARCHAR(5) DEFAULT 'US',
  target_keyword        TEXT,
  published_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  faq_section           TEXT,    -- JSON string (parsed client-side)
  quick_answer_block    TEXT,    -- JSON string
  glossary_terms_to_link TEXT[], -- Array of terms to hyperlink
  internal_link_targets  TEXT[], -- Array of internal URLs
  author                TEXT DEFAULT 'Haul Command Intelligence Unit',
  reading_time_min      INT,
  view_count            BIGINT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug      ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published  ON public.blog_posts(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_country    ON public.blog_posts(country_code);
CREATE INDEX IF NOT EXISTS idx_blog_posts_keyword    ON public.blog_posts(target_keyword);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- RLS (public read for published posts, service role write)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published blog posts" ON public.blog_posts;
CREATE POLICY "Public read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Service role full access blog posts" ON public.blog_posts;
CREATE POLICY "Service role full access blog posts"
  ON public.blog_posts FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();


-- STEP 2: Seed 10 publish-ready blog posts
-- ============================================================
INSERT INTO public.blog_posts (
  title, slug, meta_title, meta_description, excerpt, h1,
  published, country_code, target_keyword, published_at,
  faq_section, quick_answer_block, glossary_terms_to_link,
  internal_link_targets, content_html
) VALUES

-- POST 1
(
  'The Complete Guide to Finding a Pilot Car Near You',
  'find-pilot-car-near-me',
  'Find a Pilot Car Near Me | Verified Operators | Haul Command',
  'Find verified pilot car operators near you with real-time availability. Search the Haul Command directory by state, city, or corridor. 1,200+ certified providers across North America.',
  'Searching "pilot car near me" gets you unverified results. Here is how to find certified, insured escort vehicle operators in your state using the Haul Command verified directory.',
  'How to Find a Verified Pilot Car Near You (Not Just Anyone on Google)',
  true, 'US', 'pilot car near me', NOW(),
  '[{"question":"How do I find a pilot car near me?","answer":"Search the Haul Command directory by city, state, or corridor. All operators are screened for insurance, equipment compliance, and state certification."},{"question":"What is the best app to find pilot cars?","answer":"Haul Command is the most comprehensive pilot car directory, covering 50 states and 120 countries."},{"question":"How much does a pilot car cost near me?","answer":"Typical rates run $1.50-$3.00/mile for standard escorts. Use the Haul Command Rate Index for corridor-specific pricing."}]',
  '{"question":"What is the fastest way to find a pilot car near me?","answer":"Use the Haul Command directory at haulcommand.com/directory. Filter by state or city, check operator availability, and call directly."}',
  ARRAY['pilot car', 'escort vehicle', 'oversize load', 'route survey'],
  ARRAY['/directory', '/near', '/rates', '/requirements', '/claim'],
  '<h2>Why Google Results Fail You</h2><p>When you search "pilot car near me," you get directories with unverified listings, outdated contact info, and no way to check if the operator is insured or state-certified. That is dangerous on a live heavy haul move.</p><h2>How the Haul Command Directory Works</h2><p>Every operator in the Haul Command directory is screened. We verify commercial auto liability coverage, state certifications, and equipment compliance. You see real trust scores, not fake reviews.</p><p>[INJECT_THRESHOLD_TABLE]</p><h2>Searching by Location</h2><p>Use the <a href="/directory">Haul Command Operator Directory</a> and filter by state. For specific cities, search <a href="/near/houston-tx">pilot cars near Houston</a>, <a href="/near/dallas-tx">Dallas</a>, and 100+ other cities.</p><h2>What to Check Before You Book</h2><ul><li>Valid commercial auto insurance (minimum $1M in most states)</li><li>State escort certification (required in 38+ states)</li><li>Proper equipment (flags, signs, lights, banners)</li></ul>'
),

-- POST 2
(
  'Oversize Load Escort Requirements: What Every State Demands in 2026',
  'oversize-load-escort-requirements-by-state',
  'Oversize Load Escort Requirements by State 2026 | Haul Command',
  'Complete guide to oversize load escort requirements for all 50 US states. Width, height, and weight thresholds that trigger front and rear pilot car requirements. Updated 2026.',
  'Escort vehicle requirements for oversize loads vary dramatically by state. This guide covers every state''s front escort, rear escort, and height pole requirements.',
  'Oversize Load Escort Requirements by State: The 2026 Complete Guide',
  true, 'US', 'oversize load escort requirements by state', NOW(),
  '[{"question":"When is a pilot car required for an oversize load?","answer":"In most US states, an oversize load over 12 feet wide requires at least one pilot car. Loads over 14 feet wide typically require front AND rear escorts."},{"question":"Do all states require pilot cars for wide loads?","answer":"Most states require pilot cars once a load exceeds 12 to 14 feet. Texas requires one pilot car at 14 feet, two at 16 feet."},{"question":"What are the federal escort requirements for oversize loads?","answer":"FHWA guidelines set baseline requirements, but individual states enforce their own rules."}]',
  '{"question":"What width triggers a pilot car requirement for oversize loads?","answer":"In most US states, loads over 12 feet wide require a pilot car. At 14 feet wide, most states require at least one front escort. At 16 feet, two escorts are typically required."}',
  ARRAY['oversize load', 'pilot car', 'escort vehicle', 'oversize permit', 'high pole', 'route survey'],
  ARRAY['/requirements', '/directory', '/tools/permit-calculator', '/near', '/glossary/front-escort'],
  '<h2>Quick Answer: When Do You Need a Pilot Car?</h2><p>In most US states, you need at least one pilot car when your load exceeds <strong>12 feet in width</strong>. At 16 feet or more, two pilot cars (front and rear) are typically mandatory.</p><p>[INJECT_THRESHOLD_TABLE]</p><h2>State-by-State Escort Requirements</h2><p>Use the <a href="/requirements">Haul Command Requirements Database</a> to look up exact thresholds for any state.</p><ul><li><strong>Texas:</strong> One pilot car at 14 feet wide, two at 16 feet.</li><li><strong>California:</strong> Pilot car required at 14 feet wide.</li><li><strong>Florida:</strong> Follows FHWA guidelines closely.</li></ul>'
),

-- POST 3
(
  'How to Get a Heavy Haul Permit: The Complete 2026 Process',
  'how-to-get-heavy-haul-permit',
  'How to Get a Heavy Haul Permit in 2026 | State-by-State Guide',
  'Step-by-step guide to obtaining oversize and overweight permits for heavy haul transport. Covers single-trip, annual, and superload permits for all 50 states.',
  'Getting a heavy haul permit wrong can cost you days and thousands of dollars. This guide walks through the exact permit process for oversize and overweight loads in every US state.',
  'How to Get a Heavy Haul Permit: Step-by-Step for All 50 States (2026)',
  true, 'US', 'how to get heavy haul permit', NOW(),
  '[{"question":"How much does a heavy haul permit cost?","answer":"Single-trip oversize/overweight permit costs range from $15 to $500+ depending on the state. Superload permits can cost $5,000+."},{"question":"How long does it take to get an oversize load permit?","answer":"Standard single-trip permits are often issued same-day or within 24-48 hours. Superload permits can take 2-6 weeks."},{"question":"Can I get a heavy haul permit online?","answer":"Most states offer online permit applications through their DOT portal."}]',
  '{"question":"What is required to get a heavy haul permit?","answer":"You need load dimensions (height, width, length, weight), vehicle configuration details, proposed route, and proof of insurance."}',
  ARRAY['oversize permit', 'overweight permit', 'superload', 'route survey', 'pilot car'],
  ARRAY['/tools/permit-calculator', '/requirements', '/directory', '/corridors', '/training'],
  '<h2>What is a Heavy Haul Permit?</h2><p>An oversize or overweight (OS/OW) permit is a legal document issued by a state DOT authorizing a specific load to travel on public roads that exceed standard legal dimensions.</p><h2>Step 1: Determine If You Need a Permit</h2><p>Standard legal limits: Width 8 feet 6 inches, Height 13 feet 6 inches, GVW 80,000 lbs. Any load exceeding these requires a permit.</p><h2>Step 2: Gather Load Documentation</h2><ul><li>Exact load dimensions</li><li>Gross vehicle weight</li><li>Vehicle axle configuration</li><li>Origin and destination</li></ul><h2>Step 3: Apply Through the State DOT</h2><p>Apply directly through the state DOT portal. Use the <a href="/tools/permit-calculator">Haul Command Permit Calculator</a> to estimate costs.</p><p>[INJECT_THRESHOLD_TABLE]</p>'
),

-- POST 4
(
  'What Is a Route Survey for Heavy Haul? (And When You Need One)',
  'heavy-haul-route-survey-guide',
  'Heavy Haul Route Survey Guide 2026 | What It Is & When You Need It',
  'Learn what a heavy haul route survey is, when it is required, how long it takes, and how much it costs. Covers height poles, bridge weight checks, and turning radius analysis.',
  'A route survey is a physical pre-move inspection of your proposed route. This guide explains what surveyors look for, when states require them, and how to book a certified high-pole route survey.',
  'Heavy Haul Route Survey: What Is It, When You Need One, and How Much It Costs',
  true, 'US', 'heavy haul route survey', NOW(),
  '[{"question":"What is a heavy haul route survey?","answer":"A route survey is a physical pre-trip inspection where a certified technician drives your proposed route to check bridge clearances, overhead wire heights, turning radii, and road weight limits."},{"question":"How long does a route survey take?","answer":"A standard route survey takes 1-5 hours for shorter routes. Long interstate surveys can take 1-3 days."},{"question":"How much does a route survey cost?","answer":"Basic route surveys run $200-$800 for shorter routes. Full superload surveys cost $1,500-$5,000+."}]',
  '{"question":"What does a height pole operator do in a route survey?","answer":"A height pole operator drives ahead of the load with a pole set 6 inches higher than the load. If the pole strikes a wire or bridge beam, that clearance is flagged on the survey report."}',
  ARRAY['route survey', 'height pole', 'pilot car', 'superload', 'oversize permit'],
  ARRAY['/directory', '/glossary/height-pole-escort', '/glossary/route-survey', '/permits', '/near'],
  '<h2>What Route Surveyors Actually Check</h2><ul><li>Bridge structural ratings vs. your load weight</li><li>Minimum vertical clearances (tunnels, overhead wires, traffic signals)</li><li>Turning radii at intersections and roundabouts</li><li>Road surface and weight restrictions</li><li>Known construction zones and detours</li></ul><h2>When Is a Route Survey Required?</h2><p>Most states require a route survey for any load designated as a superload.</p><h2>Finding a Certified Route Survey Operator</h2><p>Use the <a href="/directory?service=route-survey">Haul Command Route Survey Directory</a> to find certified operators in your state.</p>'
),

-- POST 5
(
  'How Brokers Match Loads to Pilot Car Operators (And How to Win More Loads)',
  'how-brokers-match-pilot-car-operators',
  'How Brokers Match Loads to Pilot Cars | Haul Command Matching Guide',
  'Understand how heavy haul brokers select pilot car operators for escort assignments. Learn what brokers look for, how to build your profile, and how the Haul Command matching engine works.',
  'Brokers do not pick operators randomly. They use trust signals, availability, location, and past performance. Here is exactly how the matching process works.',
  'How Heavy Haul Brokers Select Pilot Car Operators: A Complete Matching Guide',
  true, 'US', 'how brokers find pilot car operators', NOW(),
  '[{"question":"How do heavy haul brokers find pilot car operators?","answer":"Brokers use their existing rolodex, load board postings, and verified directories like Haul Command. They filter by location, availability, equipment type, insurance status, and past performance."},{"question":"What do brokers look for in a pilot car operator?","answer":"Brokers prioritize: verified insurance, state certifications, proper equipment, fast response times, and a track record of clean moves."},{"question":"How can I get more loads as a pilot car operator?","answer":"Claim your profile on Haul Command to be discoverable by brokers searching your corridor."}]',
  '{"question":"What is the fastest way to get matched with broker loads as a pilot car operator?","answer":"Claim your verified profile on Haul Command, fill in all service capabilities and equipment details, and enable availability notifications."}',
  ARRAY['pilot car', 'escort vehicle', 'broker', 'dispatcher', 'oversize load', 'load board'],
  ARRAY['/claim', '/directory', '/loads', '/dashboard', '/blog/find-pilot-car-near-me'],
  '<h2>How Broker Dispatch Actually Works</h2><p>When a carrier needs an escort, they need to find a certified pilot car fast — often same-day. The broker first calls operators they already know, then turns to a directory or load board.</p><h2>Trust Signals Brokers Screen For</h2><ul><li>Valid insurance certificate ($1M commercial auto liability)</li><li>State certification for the route state</li><li>Height pole capability if needed</li><li>Fast response time</li><li>Clean move history</li></ul><h2>How Haul Command Matching Works</h2><p>When a broker posts a load, the platform matches available operators by location, equipment type, service capabilities, and trust score. <a href="/claim">Claim your profile today</a> to enter the matching pool.</p>'
),

-- POST 6
(
  'Emergency Fill Loads: How to Find and Win Same-Day Pilot Car Assignments',
  'emergency-fill-pilot-car-loads',
  'Emergency Fill Pilot Car Loads | Same-Day Escort Assignments | Haul Command',
  'Learn how to find and win emergency fill escort assignments as a pilot car operator. Covers premium rates, how to position yourself for same-day loads, and the Haul Command emergency dispatch network.',
  'Emergency fill loads pay premium rates because carriers are desperate. Here is how experienced pilot car operators position themselves to win same-day assignments.',
  'Emergency Fill Pilot Car Loads: How to Win Same-Day Assignments at Premium Rates',
  true, 'US', 'emergency pilot car fill loads', NOW(),
  '[{"question":"What is an emergency fill load in pilot car work?","answer":"An emergency fill load is a same-day assignment where the original operator cancelled. These loads typically pay 1.25x to 1.75x standard rates due to the urgency premium."},{"question":"How much extra do emergency fill loads pay?","answer":"Emergency fill loads typically pay a 25%-75% premium over standard rates. Same-day superload support commands the highest premiums."},{"question":"How do I get on emergency fill lists for pilot car work?","answer":"Join the Haul Command emergency dispatch network. Maintain 24-hour availability. Respond within 15 minutes."}]',
  '{"question":"What premium do emergency fill pilot car loads pay?","answer":"Emergency pilot car fills typically pay 25%-75% above standard rates. Same-day assignments for superloads can command 2x normal rates."}',
  ARRAY['pilot car', 'emergency fill', 'escort vehicle', 'load board', 'dispatch'],
  ARRAY['/loads', '/emergency', '/directory', '/near', '/claim'],
  '<h2>Why Emergency Fill Loads Pay More</h2><p>When a carrier schedule collapses 12 hours before a permitted move, they face enormous pressure. Emergency fills command premiums because certified, available operators are scarce on short notice.</p><h2>How to Position for Emergency Fills</h2><ul><li>Keep your Haul Command availability calendar updated daily</li><li>Respond to dispatches within 15 minutes</li><li>Have your insurance certificate digitally accessible</li><li>Maintain a 24/7 reachable phone number</li></ul><h2>The Haul Command Emergency Network</h2><p>Haul Command alerts verified operators when urgent loads appear in their coverage area. Enable emergency alerts on your profile to get first call on premium assignments.</p>'
),

-- POST 7
(
  'Texas Pilot Car Requirements 2026: Everything You Need to Know',
  'texas-pilot-car-requirements-2026',
  'Texas Pilot Car Requirements 2026 — Width, Height & Escort Rules',
  'Complete guide to Texas pilot car and escort vehicle requirements for 2026. Covers DPS escort thresholds, width and height triggers, I-35 and Texas Triangle corridor rules, and TxDMV permit requirements.',
  'Texas has some of the most complex pilot car laws in the country. This guide covers every threshold, DPS escort requirement, and permit rule for oversize loads in the Lone Star State.',
  'Texas Pilot Car Requirements 2026: Width Thresholds, DPS Escort Rules & Permit Guide',
  true, 'US', 'texas pilot car requirements 2026', NOW(),
  '[{"question":"When is a pilot car required in Texas?","answer":"A pilot car is required when a load exceeds 14 feet in width. At 16 feet or more, both front and rear escorts are required. DPS escort is required for loads over 20 feet wide or 250,000 lbs."},{"question":"What are Texas DPS escort requirements for oversize loads?","answer":"Texas requires a DPS law enforcement escort for loads over 20 feet wide, over 18 feet tall, or over 250,000 lbs gross weight."},{"question":"Do I need a permit to drive an oversize load through Texas?","answer":"Yes. All oversize and overweight loads require a TxDMV permit."}]',
  '{"question":"What width load requires a pilot car in Texas?","answer":"Texas law requires at least one pilot car when a load exceeds 14 feet in width. When the load exceeds 16 feet wide, both a front and rear pilot car are required. DPS escort is mandated for loads over 20 feet wide."}',
  ARRAY['pilot car', 'DPS escort', 'oversize permit', 'Texas Triangle', 'I-35 corridor', 'TxDMV'],
  ARRAY['/near/houston-tx', '/near/dallas-tx', '/requirements', '/corridors', '/tools/permit-calculator'],
  '<h2>Texas Escort Width Thresholds at a Glance</h2><p>[INJECT_THRESHOLD_TABLE]</p><h2>Key Texas Corridors</h2><ul><li><strong>I-35 Corridor:</strong> Dallas to Laredo. High wind energy component traffic.</li><li><strong>I-10 Gulf Coast:</strong> El Paso to Beaumont. Heavy petrochemical and refinery equipment.</li><li><strong>Texas Triangle:</strong> Dallas-Houston-San Antonio. General oversize freight.</li></ul><h2>TxDMV Permit Process</h2><p>Apply at txdmv.gov. Single-trip permits available within hours. Use the <a href="/tools/permit-calculator">Haul Command Permit Calculator</a> for cost estimates.</p>'
),

-- POST 8
(
  'What Is a High Pole in Pilot Car Work? Requirements & Safety Rules',
  'high-pole-pilot-car-requirements',
  'High Pole Pilot Car Guide 2026 | Height Pole Requirements & Safety',
  'Complete guide to height pole operations in pilot car work. Covers when a high pole is required, pole height calibration rules, state-by-state regulations, and safety procedures.',
  'A height pole (or high pole) is a specialized piece of escort equipment designed to detect low clearances before your load reaches them.',
  'High Pole Pilot Car Guide: Requirements, Calibration, and State Regulations (2026)',
  true, 'US', 'high pole pilot car requirements', NOW(),
  '[{"question":"What is a high pole in pilot car work?","answer":"A height pole is a retractable fiberglass pole mounted on a front escort vehicle, set 6 inches above the load height to detect overhead obstructions."},{"question":"When is a height pole required?","answer":"Height poles are required whenever a load height exceeds standard clearances along the route, or when the permit specifically requires one."},{"question":"How high should a height pole be set?","answer":"Standard practice is to set the pole 6 inches above the load maximum height. Some states mandate a specific overage — always check your permit conditions."}]',
  '{"question":"What height should a pilot car height pole be set at?","answer":"Set the height pole at the load maximum height plus 6 inches. For example, a 15-foot load requires the pole set at 15 feet 6 inches."}',
  ARRAY['height pole', 'high pole', 'pilot car', 'route survey', 'escort vehicle', 'oversize load'],
  ARRAY['/directory?service=high-pole', '/glossary/height-pole-escort', '/requirements', '/gear', '/training'],
  '<h2>Why Height Poles Save Lives and Loads</h2><p>Bridge strikes are one of the most costly incidents in heavy haul. A properly deployed height pole prevents this.</p><h2>Height Pole Equipment Requirements</h2><ul><li>Pole must be constructed of non-conductive material (fiberglass) - never metal</li><li>Pole must be retractable</li><li>Visibility markings required (orange/red flags or reflective tape)</li><li>Operator must be in communication with load driver at all times</li></ul><h2>Finding High Pole Certified Operators</h2><p>Search the <a href="/directory?service=high-pole">Haul Command High Pole Directory</a> to find certified height pole operators in your state.</p>'
),

-- POST 9
(
  'How to Get Verified as a Pilot Car Operator on Haul Command',
  'how-to-get-verified-pilot-car-operator',
  'Get Verified as a Pilot Car Operator | Haul Command Verification Guide',
  'Step-by-step guide to getting your pilot car operator profile verified on Haul Command. Covers insurance verification, state certification upload, trust score calculation, and verified badge.',
  'Unverified operator listings get ignored by brokers. Here is exactly how to get the Haul Command Verified badge and increase your load volume.',
  'How to Get Your Pilot Car Operator Profile Verified on Haul Command',
  true, 'US', 'verified pilot car operator', NOW(),
  '[{"question":"What does it mean to be a verified pilot car operator on Haul Command?","answer":"Verification means we have confirmed your commercial auto insurance, state certifications, and equipment compliance. Verified operators get 3x more job inquiries."},{"question":"What documents do I need to get verified on Haul Command?","answer":"You will need: current COI showing commercial auto liability coverage, state pilot car certification if applicable, and a photo of your escort vehicle."},{"question":"How long does verification take on Haul Command?","answer":"Standard verification takes 24-48 business hours after document submission."}]',
  '{"question":"How does Haul Command verify pilot car operators?","answer":"Haul Command verifies operators through document review: insurance certificate, state certification, and equipment photos."}',
  ARRAY['pilot car', 'escort vehicle', 'verification', 'trust score', 'claim profile'],
  ARRAY['/claim', '/onboarding', '/directory', '/trust', '/blog/how-brokers-match-pilot-car-operators'],
  '<h2>Why Verification Matters</h2><p>Brokers get burned by unverified operators who say they have the right equipment and insurance, then show up without it. Verified operators are pre-screened.</p><h2>Step 1: Claim Your Profile</h2><p>Go to <a href="/claim">haulcommand.com/claim</a> and search for your business. The claim is free.</p><h2>Step 2: Upload Your Documents</h2><ul><li>Certificate of Insurance (COI) - must show commercial auto liability, $1M minimum</li><li>State certification documents</li><li>Vehicle photos showing flags, signs, amber lights, and banners</li></ul><h2>Step 3: Get Your Verified Badge</h2><p>After our team reviews your documents (24-48 hours), your profile goes live with the Verified badge.</p>'
),

-- POST 10
(
  'I-35 Corridor Heavy Haul Guide: Texas to Minnesota Escort Intelligence',
  'i-35-corridor-heavy-haul-guide',
  'I-35 Corridor Heavy Haul Guide | Pilot Car & Escort Intelligence',
  'Complete escort intelligence guide for the I-35 heavy haul corridor from Texas to Minnesota. Covers state permit requirements, weigh stations, low bridge choke points, and available pilot car operators.',
  'The I-35 corridor is one of the highest-volume heavy haul routes in North America. This guide covers every state permit requirements, known choke points, and where to find certified pilot car operators.',
  'I-35 Corridor Pilot Car & Escort Guide: Texas to Minnesota Heavy Haul Intelligence',
  true, 'US', 'I-35 heavy haul corridor pilot car', NOW(),
  '[{"question":"What permits do I need for an oversize load on I-35?","answer":"You need an OS/OW permit from every state your route crosses: Texas (TxDMV), Oklahoma (ODOT), Kansas (KDOT), Iowa (Iowa DOT), and Minnesota (MnDOT)."},{"question":"How many pilot cars do I need on I-35?","answer":"Requirements vary by load dimensions and by state. Texas requires one pilot car at 14 feet wide, two at 16 feet."},{"question":"What are the known heavy haul choke points on I-35?","answer":"Key choke points include Kansas City metro interchanges, the Austin metro I-35 construction zones, and the Laredo border crossing approach."}]',
  '{"question":"What pilot car rules apply across the entire I-35 corridor?","answer":"Each state on I-35 has its own escort rules. Texas: 14 feet (one escort). Oklahoma: 12 feet. Kansas: 12 feet. Iowa and Minnesota: 12 feet. Use the Haul Command permit calculator for a multi-state breakdown."}',
  ARRAY['I-35 corridor', 'pilot car', 'oversize permit', 'escort vehicle', 'route survey', 'heavy haul'],
  ARRAY['/corridors', '/near/dallas-tx', '/near/oklahoma-city-ok', '/near/kansas-city-mo', '/tools/permit-calculator', '/requirements'],
  '<h2>I-35 Corridor Fast Facts for Carriers</h2><ul><li>Total route length: ~1,568 miles (Laredo, TX to Duluth, MN)</li><li>States crossed: Texas, Oklahoma, Kansas, Iowa, Minnesota</li><li>Primary loads: wind energy components, petrochemical equipment, industrial machinery</li><li>Peak season: March-November</li></ul><h2>State-by-State Permit Requirements on I-35</h2><p>[INJECT_THRESHOLD_TABLE]</p><h2>Finding Pilot Cars Along I-35</h2><p>Use Haul Command to find certified escort operators at every major I-35 city: <a href="/near/dallas-tx">Dallas</a>, <a href="/near/oklahoma-city-ok">Oklahoma City</a>, <a href="/near/kansas-city-mo">Kansas City</a>, and <a href="/near/des-moines-ia">Des Moines</a>.</p>'
)

ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  meta_title     = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  content_html   = EXCLUDED.content_html,
  published      = EXCLUDED.published,
  updated_at     = NOW();

-- STEP 3: Verify
SELECT id, slug, published, published_at FROM public.blog_posts ORDER BY published_at DESC;
