-- ============================================================================
-- GLOBAL INGESTION & DATA MOAT SCHEMA
-- Enables recursive crawling, entity resolution, and market dominance.
-- ============================================================================

-- 1) ENTITIES (Master Record for Scraped & Claimed Data)
CREATE TABLE IF NOT EXISTS public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('operator','broker','hotel','truck_stop','authority','installer','other')),
  name text NOT NULL,
  normalized_name text,
  description text,
  primary_phone text,
  primary_email text,
  website text,
  country_code text DEFAULT 'US',
  region text,
  city text,
  lat double precision,
  lng double precision,
  source text,
  source_url text,
  confidence_score double precision DEFAULT 0,
  freshness_score double precision DEFAULT 0,
  source_reliability_score double precision DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entities_normalized_name ON public.entities(normalized_name);
CREATE INDEX IF NOT EXISTS idx_entities_phone ON public.entities(primary_phone);
CREATE INDEX IF NOT EXISTS idx_entities_email ON public.entities(primary_email);
CREATE INDEX IF NOT EXISTS idx_entities_website ON public.entities(website);
CREATE INDEX IF NOT EXISTS idx_entities_geo ON public.entities(country_code, region);
CREATE INDEX IF NOT EXISTS idx_entities_type ON public.entities(type);

-- 2) CONTACTS
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  name text,
  role text,
  phone text,
  email text,
  linkedin text,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_entity ON public.contacts(entity_id);

-- 3) SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  service_type text NOT NULL, -- e.g. pilot_car, police_escort, heavy_haul
  coverage_area jsonb,        -- Array of states/regions or GeoJSON
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_entity ON public.services(entity_id);

-- 4) CERTIFICATIONS
CREATE TABLE IF NOT EXISTS public.entity_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  cert_name text NOT NULL,
  issuing_authority text,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) LOCATIONS (Secondary locations for entities with multiple branches)
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  address text,
  city text,
  region text,
  country_code text DEFAULT 'US',
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) INFRASTRUCTURE NODES
CREATE TABLE IF NOT EXISTS public.infrastructure_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  node_type text NOT NULL CHECK (node_type IN ('hotel','truck_stop','staging_yard','escort_meet_point','other')),
  features jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7) STATE RULES
CREATE TABLE IF NOT EXISTS public.state_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text DEFAULT 'US',
  region text NOT NULL,
  rule_type text NOT NULL,
  details jsonb NOT NULL,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8) ENTITY RELATIONSHIPS (Graph Edges)
CREATE TABLE IF NOT EXISTS public.entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  to_entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL, -- worked_with, referred, partner, listed_with
  confidence double precision DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_entity_rels_from ON public.entity_relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_rels_to ON public.entity_relationships(to_entity_id);

-- 9) CLAIMS (Monetization & Ownership)
CREATE TABLE IF NOT EXISTS public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  -- Assuming users are in auth.users or public.profiles
  claimed_by_user_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','claimed','rejected')),
  claim_score double precision DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10) AD SLOTS
CREATE TABLE IF NOT EXISTS public.ad_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  slot_type text NOT NULL CHECK (slot_type IN ('featured','top_rank','corridor_dominance')),
  price double precision NOT NULL,
  region text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11) INGESTION JOBS
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed')),
  records_found int DEFAULT 0,
  records_inserted int DEFAULT 0,
  records_updated int DEFAULT 0,
  error_log text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 12) CRAWL QUEUE
CREATE TABLE IF NOT EXISTS public.crawl_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','crawling','done','failed')),
  depth int DEFAULT 0,
  priority int DEFAULT 5,
  discovered_from text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crawl_queue_status ON public.crawl_queue(status, priority, created_at);

-- RLS
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_queue ENABLE ROW LEVEL SECURITY;

-- Allow public read access to most directory tables
CREATE POLICY "entities_public_read" ON public.entities FOR SELECT USING (true);
CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (true);
CREATE POLICY "locations_public_read" ON public.locations FOR SELECT USING (true);
CREATE POLICY "state_rules_public_read" ON public.state_rules FOR SELECT USING (true);
CREATE POLICY "infra_nodes_public_read" ON public.infrastructure_nodes FOR SELECT USING (true);

-- Allow service role full access to everything
CREATE POLICY "service_role_all" ON public.entities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.services FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.entity_certifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.locations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.infrastructure_nodes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.state_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.entity_relationships FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.claims FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.ad_slots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.ingestion_jobs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.crawl_queue FOR ALL USING (auth.role() = 'service_role');
