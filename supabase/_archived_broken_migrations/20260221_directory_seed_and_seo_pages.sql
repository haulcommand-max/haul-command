-- ============================================================
-- Migration: 20260221_directory_seed_and_seo_pages.sql
-- OSOW Haven Counter-Build: Supply Seed + SEO Domination
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- MOVE 1: Directory Seed Infrastructure
-- ─────────────────────────────────────────────────────────────

-- Track claimed status on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS claimed boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'self_registered';
  -- source: 'self_registered' | 'directory_seed' | 'import'

-- Queue table for imported directory entries
CREATE TABLE IF NOT EXISTS directory_seed_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  city text,
  state_abbr text,
  phone text,
  source_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','imported','duplicate','failed','skipped')),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_seed_queue_status ON directory_seed_queue(status);
CREATE INDEX IF NOT EXISTS idx_seed_queue_phone ON directory_seed_queue(phone);
CREATE INDEX IF NOT EXISTS idx_seed_queue_state ON directory_seed_queue(state_abbr);

-- RLS: admin only
ALTER TABLE directory_seed_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_seed_queue" ON directory_seed_queue
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','super_admin'));

-- ─────────────────────────────────────────────────────────────
-- MOVE 2 + 3: SEO Pages — States, Provinces, Corridors
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('corridor','region','city','hybrid','hub')),
  region text,
  corridor_slug text,
  city text,
  country text DEFAULT 'US' CHECK (country IN ('US','CA')),
  title text NOT NULL,
  h1 text NOT NULL,
  meta_description text NOT NULL,
  content_md text DEFAULT '',
  jsonld jsonb DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','noindex')),
  canonical_url text,
  internal_link_count int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_pages_slug ON seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_type ON seo_pages(type);
CREATE INDEX IF NOT EXISTS idx_seo_pages_status ON seo_pages(status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_region ON seo_pages(region);

ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_published" ON seo_pages
  FOR SELECT USING (status = 'published');
CREATE POLICY "admin_all_seo_pages" ON seo_pages
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin','super_admin'));

CREATE TABLE IF NOT EXISTS seo_internal_links (
  from_slug text NOT NULL,
  to_slug text NOT NULL,
  weight int DEFAULT 1,
  PRIMARY KEY (from_slug, to_slug)
);

CREATE TABLE IF NOT EXISTS seo_impressions_daily (
  page_slug text NOT NULL,
  date date NOT NULL,
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  avg_position numeric,
  ctr numeric,
  PRIMARY KEY (page_slug, date)
);

-- ─────────────────────────────────────────────────────────────
-- SEED: All 50 US States — Regulation Hub Pages
-- ─────────────────────────────────────────────────────────────

INSERT INTO seo_pages (slug, type, region, country, title, h1, meta_description, status, canonical_url)
VALUES
-- Popular states (publish first)
('rules/texas/escort-requirements','region','texas','US','Texas Pilot Car Requirements & Escort Regulations 2025','Texas Pilot Car & Escort Vehicle Requirements 2025','Complete Texas pilot car requirements, escort vehicle rules, TXDOT permit thresholds, and compliance info. Updated 2025.','draft','/rules/texas/escort-requirements'),
('rules/florida/escort-requirements','region','florida','US','Florida Pilot Car Requirements & Escort Regulations 2025','Florida Pilot Car & Escort Vehicle Requirements 2025','Complete Florida pilot car requirements, FDOT permits, escort vehicle certification, and oversize thresholds. Updated 2025.','draft','/rules/florida/escort-requirements'),
('rules/california/escort-requirements','region','california','US','California Pilot Car Requirements & Escort Regulations 2025','California Pilot Car & Escort Vehicle Requirements 2025','Complete California pilot car requirements, escort vehicle rules, Caltrans permits, and color-coded route system. Updated 2025.','draft','/rules/california/escort-requirements'),
('rules/georgia/escort-requirements','region','georgia','US','Georgia Pilot Car Requirements & Escort Regulations 2025','Georgia Pilot Car & Escort Vehicle Requirements 2025','Complete Georgia pilot car requirements, GDOT permits, escort vehicle rules, and oversize load compliance. Updated 2025.','draft','/rules/georgia/escort-requirements'),
('rules/new-york/escort-requirements','region','new-york','US','New York Pilot Car Requirements & Escort Regulations 2025','New York Pilot Car & Escort Vehicle Requirements 2025','Complete New York pilot car requirements, NYSDOT permits, escort vehicle certification, and oversize thresholds. Updated 2025.','draft','/rules/new-york/escort-requirements'),
-- All remaining US states
('rules/alabama/escort-requirements','region','alabama','US','Alabama Pilot Car Requirements & Escort Regulations 2025','Alabama Pilot Car & Escort Vehicle Requirements 2025','Complete Alabama pilot car requirements, ALDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/alabama/escort-requirements'),
('rules/alaska/escort-requirements','region','alaska','US','Alaska Pilot Car Requirements & Escort Regulations 2025','Alaska Pilot Car & Escort Vehicle Requirements 2025','Complete Alaska pilot car requirements, DOT permits, escort vehicle rules, and oversize load compliance. Updated 2025.','draft','/rules/alaska/escort-requirements'),
('rules/arizona/escort-requirements','region','arizona','US','Arizona Pilot Car Requirements & Escort Regulations 2025','Arizona Pilot Car & Escort Vehicle Requirements 2025','Complete Arizona pilot car requirements, ADOT permits, CVSA certification requirements, and oversize rules. Updated 2025.','draft','/rules/arizona/escort-requirements'),
('rules/arkansas/escort-requirements','region','arkansas','US','Arkansas Pilot Car Requirements & Escort Regulations 2025','Arkansas Pilot Car & Escort Vehicle Requirements 2025','Complete Arkansas pilot car requirements, ARDOT permits, weekend travel rules, and escort requirements. Updated 2025.','draft','/rules/arkansas/escort-requirements'),
('rules/colorado/escort-requirements','region','colorado','US','Colorado Pilot Car Requirements & Escort Regulations 2025','Colorado Pilot Car & Escort Vehicle Requirements 2025','Complete Colorado pilot car requirements, mountainous vs non-mountainous rules, CDOT permits. Updated 2025.','draft','/rules/colorado/escort-requirements'),
('rules/connecticut/escort-requirements','region','connecticut','US','Connecticut Pilot Car Requirements & Escort Regulations 2025','Connecticut Pilot Car & Escort Vehicle Requirements 2025','Complete Connecticut pilot car requirements, mandatory route surveys for 14ft1in+, CTDOT permits. Updated 2025.','draft','/rules/connecticut/escort-requirements'),
('rules/delaware/escort-requirements','region','delaware','US','Delaware Pilot Car Requirements & Escort Regulations 2025','Delaware Pilot Car & Escort Vehicle Requirements 2025','Complete Delaware pilot car requirements (no operator certification required), DelDOT permits. Updated 2025.','draft','/rules/delaware/escort-requirements'),
('rules/hawaii/escort-requirements','region','hawaii','US','Hawaii Pilot Car Requirements & Escort Regulations 2025','Hawaii Pilot Car & Escort Vehicle Requirements 2025','Complete Hawaii pilot car requirements, HDOT permits, escort vehicle rules, and island-specific regulations. Updated 2025.','draft','/rules/hawaii/escort-requirements'),
('rules/idaho/escort-requirements','region','idaho','US','Idaho Pilot Car Requirements & Escort Regulations 2025','Idaho Pilot Car & Escort Vehicle Requirements 2025','Complete Idaho pilot car requirements, ITD permits, escort vehicle certification, and oversize compliance. Updated 2025.','draft','/rules/idaho/escort-requirements'),
('rules/illinois/escort-requirements','region','illinois','US','Illinois Pilot Car Requirements & Escort Regulations 2025','Illinois Pilot Car & Escort Vehicle Requirements 2025','Complete Illinois pilot car requirements, IDOT permits, escort vehicle rules, and oversize thresholds. Updated 2025.','draft','/rules/illinois/escort-requirements'),
('rules/indiana/escort-requirements','region','indiana','US','Indiana Pilot Car Requirements & Escort Regulations 2025','Indiana Pilot Car & Escort Vehicle Requirements 2025','Complete Indiana pilot car requirements, INDOT permits, escort vehicle certification, and oversize rules. Updated 2025.','draft','/rules/indiana/escort-requirements'),
('rules/iowa/escort-requirements','region','iowa','US','Iowa Pilot Car Requirements & Escort Regulations 2025','Iowa Pilot Car & Escort Vehicle Requirements 2025','Complete Iowa pilot car requirements, Iowa DOT permits, escort vehicle rules, and compliance. Updated 2025.','draft','/rules/iowa/escort-requirements'),
('rules/kansas/escort-requirements','region','kansas','US','Kansas Pilot Car Requirements & Escort Regulations 2025','Kansas Pilot Car & Escort Vehicle Requirements 2025','Complete Kansas pilot car requirements, KDOT permits, escort vehicle rules, and oversize thresholds. Updated 2025.','draft','/rules/kansas/escort-requirements'),
('rules/kentucky/escort-requirements','region','kentucky','US','Kentucky Pilot Car Requirements & Escort Regulations 2025','Kentucky Pilot Car & Escort Vehicle Requirements 2025','Complete Kentucky pilot car requirements, KYTC permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/kentucky/escort-requirements'),
('rules/louisiana/escort-requirements','region','louisiana','US','Louisiana Pilot Car Requirements & Escort Regulations 2025','Louisiana Pilot Car & Escort Vehicle Requirements 2025','Complete Louisiana pilot car requirements, LADOTD permits, escort vehicle rules, and swamp route compliance. Updated 2025.','draft','/rules/louisiana/escort-requirements'),
('rules/maine/escort-requirements','region','maine','US','Maine Pilot Car Requirements & Escort Regulations 2025','Maine Pilot Car & Escort Vehicle Requirements 2025','Complete Maine pilot car requirements, MaineDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/maine/escort-requirements'),
('rules/maryland/escort-requirements','region','maryland','US','Maryland Pilot Car Requirements & Escort Regulations 2025','Maryland Pilot Car & Escort Vehicle Requirements 2025','Complete Maryland pilot car requirements, MDOT permits, escort vehicle rules, and oversize thresholds. Updated 2025.','draft','/rules/maryland/escort-requirements'),
('rules/massachusetts/escort-requirements','region','massachusetts','US','Massachusetts Pilot Car Requirements & Escort Regulations 2025','Massachusetts Pilot Car & Escort Vehicle Requirements 2025','Complete Massachusetts pilot car requirements, MassDOT permits, escort vehicle rules, and compliance. Updated 2025.','draft','/rules/massachusetts/escort-requirements'),
('rules/michigan/escort-requirements','region','michigan','US','Michigan Pilot Car Requirements & Escort Regulations 2025','Michigan Pilot Car & Escort Vehicle Requirements 2025','Complete Michigan pilot car requirements, MDOT permits, escort vehicle certification, and oversize rules. Updated 2025.','draft','/rules/michigan/escort-requirements'),
('rules/minnesota/escort-requirements','region','minnesota','US','Minnesota Pilot Car Requirements & Escort Regulations 2025','Minnesota Pilot Car & Escort Vehicle Requirements 2025','Complete Minnesota pilot car requirements, MnDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/minnesota/escort-requirements'),
('rules/mississippi/escort-requirements','region','mississippi','US','Mississippi Pilot Car Requirements & Escort Regulations 2025','Mississippi Pilot Car & Escort Vehicle Requirements 2025','Complete Mississippi pilot car requirements, MDOT permits, escort vehicle rules, and oversize thresholds. Updated 2025.','draft','/rules/mississippi/escort-requirements'),
('rules/missouri/escort-requirements','region','missouri','US','Missouri Pilot Car Requirements & Escort Regulations 2025','Missouri Pilot Car & Escort Vehicle Requirements 2025','Complete Missouri pilot car requirements, MoDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/missouri/escort-requirements'),
('rules/montana/escort-requirements','region','montana','US','Montana Pilot Car Requirements & Escort Regulations 2025','Montana Pilot Car & Escort Vehicle Requirements 2025','Complete Montana pilot car requirements, MDT permits, escort vehicle rules, and wide-load compliance. Updated 2025.','draft','/rules/montana/escort-requirements'),
('rules/nebraska/escort-requirements','region','nebraska','US','Nebraska Pilot Car Requirements & Escort Regulations 2025','Nebraska Pilot Car & Escort Vehicle Requirements 2025','Complete Nebraska pilot car requirements, NDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/nebraska/escort-requirements'),
('rules/nevada/escort-requirements','region','nevada','US','Nevada Pilot Car Requirements & Escort Regulations 2025','Nevada Pilot Car & Escort Vehicle Requirements 2025','Complete Nevada pilot car requirements, NDOT permits, escort vehicle rules, and desert corridor compliance. Updated 2025.','draft','/rules/nevada/escort-requirements'),
('rules/new-hampshire/escort-requirements','region','new-hampshire','US','New Hampshire Pilot Car Requirements & Escort Regulations 2025','New Hampshire Pilot Car & Escort Vehicle Requirements 2025','Complete New Hampshire pilot car requirements, NHDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/new-hampshire/escort-requirements'),
('rules/new-jersey/escort-requirements','region','new-jersey','US','New Jersey Pilot Car Requirements & Escort Regulations 2025','New Jersey Pilot Car & Escort Vehicle Requirements 2025','Complete New Jersey pilot car requirements, NJDOT permits, escort vehicle rules, and tunnel/bridge compliance. Updated 2025.','draft','/rules/new-jersey/escort-requirements'),
('rules/new-mexico/escort-requirements','region','new-mexico','US','New Mexico Pilot Car Requirements & Escort Regulations 2025','New Mexico Pilot Car & Escort Vehicle Requirements 2025','Complete New Mexico pilot car requirements, NMDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/new-mexico/escort-requirements'),
('rules/north-carolina/escort-requirements','region','north-carolina','US','North Carolina Pilot Car Requirements & Escort Regulations 2025','North Carolina Pilot Car & Escort Vehicle Requirements 2025','Complete North Carolina pilot car requirements, NCDOT permits, escort vehicle rules, and mountain corridor compliance. Updated 2025.','draft','/rules/north-carolina/escort-requirements'),
('rules/north-dakota/escort-requirements','region','north-dakota','US','North Dakota Pilot Car Requirements & Escort Regulations 2025','North Dakota Pilot Car & Escort Vehicle Requirements 2025','Complete North Dakota pilot car requirements, NDDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/north-dakota/escort-requirements'),
('rules/ohio/escort-requirements','region','ohio','US','Ohio Pilot Car Requirements & Escort Regulations 2025','Ohio Pilot Car & Escort Vehicle Requirements 2025','Complete Ohio pilot car requirements, ODOT permits, escort vehicle rules, and industrial corridor compliance. Updated 2025.','draft','/rules/ohio/escort-requirements'),
('rules/oklahoma/escort-requirements','region','oklahoma','US','Oklahoma Pilot Car Requirements & Escort Regulations 2025','Oklahoma Pilot Car & Escort Vehicle Requirements 2025','Complete Oklahoma pilot car requirements, ODOT permits, escort vehicle rules, and energy corridor compliance. Updated 2025.','draft','/rules/oklahoma/escort-requirements'),
('rules/oregon/escort-requirements','region','oregon','US','Oregon Pilot Car Requirements & Escort Regulations 2025','Oregon Pilot Car & Escort Vehicle Requirements 2025','Complete Oregon pilot car requirements, ODOT permits, escort vehicle certification, and mountain pass compliance. Updated 2025.','draft','/rules/oregon/escort-requirements'),
('rules/pennsylvania/escort-requirements','region','pennsylvania','US','Pennsylvania Pilot Car Requirements & Escort Regulations 2025','Pennsylvania Pilot Car & Escort Vehicle Requirements 2025','Complete Pennsylvania pilot car requirements, PennDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/pennsylvania/escort-requirements'),
('rules/rhode-island/escort-requirements','region','rhode-island','US','Rhode Island Pilot Car Requirements & Escort Regulations 2025','Rhode Island Pilot Car & Escort Vehicle Requirements 2025','Complete Rhode Island pilot car requirements, RIDOT permits, escort vehicle rules, and compliance. Updated 2025.','draft','/rules/rhode-island/escort-requirements'),
('rules/south-carolina/escort-requirements','region','south-carolina','US','South Carolina Pilot Car Requirements & Escort Regulations 2025','South Carolina Pilot Car & Escort Vehicle Requirements 2025','Complete South Carolina pilot car requirements, SCDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/south-carolina/escort-requirements'),
('rules/south-dakota/escort-requirements','region','south-dakota','US','South Dakota Pilot Car Requirements & Escort Regulations 2025','South Dakota Pilot Car & Escort Vehicle Requirements 2025','Complete South Dakota pilot car requirements, SDDOT permits, escort vehicle rules, and prairie corridor compliance. Updated 2025.','draft','/rules/south-dakota/escort-requirements'),
('rules/tennessee/escort-requirements','region','tennessee','US','Tennessee Pilot Car Requirements & Escort Regulations 2025','Tennessee Pilot Car & Escort Vehicle Requirements 2025','Complete Tennessee pilot car requirements, TDOT permits, escort vehicle rules, and Appalachian corridor compliance. Updated 2025.','draft','/rules/tennessee/escort-requirements'),
('rules/utah/escort-requirements','region','utah','US','Utah Pilot Car Requirements & Escort Regulations 2025','Utah Pilot Car & Escort Vehicle Requirements 2025','Complete Utah pilot car requirements, UDOT permits, escort vehicle rules, and canyon corridor compliance. Updated 2025.','draft','/rules/utah/escort-requirements'),
('rules/vermont/escort-requirements','region','vermont','US','Vermont Pilot Car Requirements & Escort Regulations 2025','Vermont Pilot Car & Escort Vehicle Requirements 2025','Complete Vermont pilot car requirements, VTrans permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/vermont/escort-requirements'),
('rules/virginia/escort-requirements','region','virginia','US','Virginia Pilot Car Requirements & Escort Regulations 2025','Virginia Pilot Car & Escort Vehicle Requirements 2025','Complete Virginia pilot car requirements, VDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/virginia/escort-requirements'),
('rules/washington/escort-requirements','region','washington','US','Washington Pilot Car Requirements & Escort Regulations 2025','Washington Pilot Car & Escort Vehicle Requirements 2025','Complete Washington state pilot car requirements, WSDOT permits, escort vehicle rules, and Cascade corridor compliance. Updated 2025.','draft','/rules/washington/escort-requirements'),
('rules/west-virginia/escort-requirements','region','west-virginia','US','West Virginia Pilot Car Requirements & Escort Regulations 2025','West Virginia Pilot Car & Escort Vehicle Requirements 2025','Complete West Virginia pilot car requirements, WVDOT permits, escort vehicle rules, and mountain corridor compliance. Updated 2025.','draft','/rules/west-virginia/escort-requirements'),
('rules/wisconsin/escort-requirements','region','wisconsin','US','Wisconsin Pilot Car Requirements & Escort Regulations 2025','Wisconsin Pilot Car & Escort Vehicle Requirements 2025','Complete Wisconsin pilot car requirements, WisDOT permits, escort vehicle rules, and oversize compliance. Updated 2025.','draft','/rules/wisconsin/escort-requirements'),
('rules/wyoming/escort-requirements','region','wyoming','US','Wyoming Pilot Car Requirements & Escort Regulations 2025','Wyoming Pilot Car & Escort Vehicle Requirements 2025','Complete Wyoming pilot car requirements, WYDOT permits, escort vehicle rules, and high-wind corridor compliance. Updated 2025.','draft','/rules/wyoming/escort-requirements'),
-- ─────────────────────────────────────────────────────────────
-- SEED: 13 Canadian Provinces & Territories — ENTIRELY UNCONTESTED
-- ─────────────────────────────────────────────────────────────
('rules/ontario/escort-requirements','region','ontario','CA','Ontario Pilot Car Requirements & Escort Regulations 2025','Ontario Pilot Car & Escort Vehicle Requirements 2025','Complete Ontario pilot car requirements, MTO permits, escort vehicle certification, and oversize compliance for Canadian corridors. Updated 2025.','draft','/rules/ontario/escort-requirements'),
('rules/british-columbia/escort-requirements','region','british-columbia','CA','British Columbia Pilot Car Requirements & Escort Regulations 2025','BC Pilot Car & Escort Vehicle Requirements 2025','Complete BC pilot car requirements, TranBC permits, escort vehicle rules, and mountain corridor compliance. Updated 2025.','draft','/rules/british-columbia/escort-requirements'),
('rules/alberta/escort-requirements','region','alberta','CA','Alberta Pilot Car Requirements & Escort Regulations 2025','Alberta Pilot Car & Escort Vehicle Requirements 2025','Complete Alberta pilot car requirements, Alberta Transportation permits, escort vehicle rules, and energy corridor compliance. Updated 2025.','draft','/rules/alberta/escort-requirements'),
('rules/quebec/escort-requirements','region','quebec','CA','Quebec Pilot Car Requirements & Escort Regulations 2025','Quebec Pilot Car & Escort Vehicle Requirements 2025','Complete Quebec pilot car requirements, MTQ permits, escort vehicle rules, and French-language compliance forms. Updated 2025.','draft','/rules/quebec/escort-requirements'),
('rules/saskatchewan/escort-requirements','region','saskatchewan','CA','Saskatchewan Pilot Car Requirements & Escort Regulations 2025','Saskatchewan Pilot Car & Escort Vehicle Requirements 2025','Complete Saskatchewan pilot car requirements, SGI permits, escort vehicle rules, and prairie corridor compliance. Updated 2025.','draft','/rules/saskatchewan/escort-requirements'),
('rules/manitoba/escort-requirements','region','manitoba','CA','Manitoba Pilot Car Requirements & Escort Regulations 2025','Manitoba Pilot Car & Escort Vehicle Requirements 2025','Complete Manitoba pilot car requirements, MIT permits, escort vehicle rules, and Trans-Canada corridor compliance. Updated 2025.','draft','/rules/manitoba/escort-requirements'),
('rules/nova-scotia/escort-requirements','region','nova-scotia','CA','Nova Scotia Pilot Car Requirements & Escort Regulations 2025','Nova Scotia Pilot Car & Escort Vehicle Requirements 2025','Complete Nova Scotia pilot car requirements, NSTIR permits, escort vehicle rules, and Maritime corridor compliance. Updated 2025.','draft','/rules/nova-scotia/escort-requirements'),
('rules/new-brunswick/escort-requirements','region','new-brunswick','CA','New Brunswick Pilot Car Requirements & Escort Regulations 2025','New Brunswick Pilot Car & Escort Vehicle Requirements 2025','Complete New Brunswick pilot car requirements, NBDTI permits, escort vehicle rules, and Maritime corridor compliance. Updated 2025.','draft','/rules/new-brunswick/escort-requirements'),
('rules/prince-edward-island/escort-requirements','region','prince-edward-island','CA','Prince Edward Island Pilot Car Requirements 2025','PEI Pilot Car & Escort Vehicle Requirements 2025','Complete Prince Edward Island pilot car requirements, PEI DOT permits, escort vehicle rules, and compliance. Updated 2025.','draft','/rules/prince-edward-island/escort-requirements'),
('rules/newfoundland/escort-requirements','region','newfoundland','CA','Newfoundland & Labrador Pilot Car Requirements 2025','Newfoundland Pilot Car & Escort Vehicle Requirements 2025','Complete Newfoundland and Labrador pilot car requirements, TOW permits, escort vehicle rules, and remote corridor compliance. Updated 2025.','draft','/rules/newfoundland/escort-requirements'),
('rules/yukon/escort-requirements','region','yukon','CA','Yukon Pilot Car Requirements & Escort Regulations 2025','Yukon Pilot Car & Escort Vehicle Requirements 2025','Complete Yukon pilot car requirements, YHW permits, escort vehicle rules, and northern corridor compliance. Updated 2025.','draft','/rules/yukon/escort-requirements'),
('rules/northwest-territories/escort-requirements','region','northwest-territories','CA','Northwest Territories Pilot Car Requirements 2025','NWT Pilot Car & Escort Vehicle Requirements 2025','Complete Northwest Territories pilot car requirements, GNWT permits, escort vehicle rules, and arctic corridor compliance. Updated 2025.','draft','/rules/northwest-territories/escort-requirements'),
('rules/nunavut/escort-requirements','region','nunavut','CA','Nunavut Pilot Car Requirements & Escort Regulations 2025','Nunavut Pilot Car & Escort Vehicle Requirements 2025','Complete Nunavut pilot car requirements, GN permits, escort vehicle rules, and arctic compliance. Updated 2025.','draft','/rules/nunavut/escort-requirements')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SEED: Move 3 — Corridor Hub Pages (ZERO competition)
-- ─────────────────────────────────────────────────────────────

INSERT INTO seo_pages (slug, type, corridor_slug, country, title, h1, meta_description, status, canonical_url)
VALUES
('corridors/i-95-northeast','corridor','i-95-northeast','US','I-95 Pilot Car Services & Escort Requirements | FL to ME','I-95 Oversize Load Escort & Pilot Car Services','I-95 pilot car requirements from Florida to Maine. Escort regulations by state, permit thresholds, and certified escort companies along I-95.','draft','/corridors/i-95-northeast'),
('corridors/i-10-southern','corridor','i-10-southern','US','I-10 Pilot Car Services & Escort Requirements | CA to FL','I-10 Oversize Load Escort & Pilot Car Services','I-10 pilot car requirements from California to Florida. Escort regulations, permit thresholds, and certified escort companies along I-10.','draft','/corridors/i-10-southern'),
('corridors/i-75-southeast','corridor','i-75-southeast','US','I-75 Pilot Car Services & Escort Requirements | FL to MI','I-75 Oversize Load Escort & Pilot Car Services','I-75 pilot car requirements from Florida to Michigan. Escort regulations by state, permit thresholds, and certified escort companies along I-75.','draft','/corridors/i-75-southeast'),
('corridors/i-80-transcontinental','corridor','i-80-transcontinental','US','I-80 Pilot Car Services & Escort Requirements | CA to NJ','I-80 Oversize Load Escort & Pilot Car Services','I-80 pilot car requirements coast-to-coast. Escort regulations by state, permit thresholds, and certified escort companies along I-80.','draft','/corridors/i-80-transcontinental'),
('corridors/i-40-southern-cross','corridor','i-40-southern-cross','US','I-40 Pilot Car Services & Escort Requirements | CA to NC','I-40 Oversize Load Escort & Pilot Car Services','I-40 pilot car requirements from California to North Carolina. Escort regulations, permits, and certified escort companies along I-40.','draft','/corridors/i-40-southern-cross'),
('corridors/trans-canada-highway','corridor','trans-canada-highway','CA','Trans-Canada Highway Pilot Car Services & Escort Requirements','Trans-Canada Highway Oversize Load Escort Requirements','Trans-Canada Highway pilot car requirements from BC to Ontario. Province-by-province escort regulations, permits, and certified Canadian escort companies.','draft','/corridors/trans-canada-highway')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- RPC: process_seed_entry — import a seedq row to profiles
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION process_seed_entry(p_seed_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seed directory_seed_queue%ROWTYPE;
  v_profile_id uuid;
  v_dup_id uuid;
BEGIN
  SELECT * INTO v_seed FROM directory_seed_queue WHERE id = p_seed_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','seed not found'); END IF;
  IF v_seed.status <> 'pending' THEN RETURN jsonb_build_object('error','already processed','status',v_seed.status); END IF;

  -- Dedup: check by phone
  IF v_seed.phone IS NOT NULL THEN
    SELECT id INTO v_dup_id FROM profiles WHERE phone = v_seed.phone LIMIT 1;
    IF FOUND THEN
      UPDATE directory_seed_queue SET status='duplicate', processed_at=now(), profile_id=v_dup_id, notes='dup:phone' WHERE id=p_seed_id;
      RETURN jsonb_build_object('status','duplicate','profile_id',v_dup_id);
    END IF;
  END IF;

  -- Create unclaimed profile
  INSERT INTO profiles (
    full_name, city, state,
    claimed, source,
    profile_strength, visibility_tier,
    onboarding_state,
    created_at, updated_at
  ) VALUES (
    v_seed.company_name, v_seed.city, v_seed.state_abbr,
    false, 'directory_seed',
    15, 'hidden',
    jsonb_build_object('step','seeded','source','osow_haven'),
    now(), now()
  )
  RETURNING id INTO v_profile_id;

  UPDATE directory_seed_queue
    SET status='imported', processed_at=now(), profile_id=v_profile_id
    WHERE id=p_seed_id;

  RETURN jsonb_build_object('status','imported','profile_id',v_profile_id);
END;
$$;

-- RPC: bulk_process_seeds — process all pending seeds
CREATE OR REPLACE FUNCTION bulk_process_seeds(p_limit int DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
  v_imported int := 0;
  v_duplicate int := 0;
  v_failed int := 0;
  v_result jsonb;
BEGIN
  FOR v_id IN
    SELECT id FROM directory_seed_queue WHERE status='pending' LIMIT p_limit
  LOOP
    BEGIN
      v_result := process_seed_entry(v_id);
      IF v_result->>'status' = 'imported' THEN v_imported := v_imported + 1;
      ELSIF v_result->>'status' = 'duplicate' THEN v_duplicate := v_duplicate + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE directory_seed_queue SET status='failed', notes=SQLERRM WHERE id=v_id;
      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('imported',v_imported,'duplicate',v_duplicate,'failed',v_failed);
END;
$$;
