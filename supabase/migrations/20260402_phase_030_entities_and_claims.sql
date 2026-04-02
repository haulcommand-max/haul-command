-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 030 — ENTITIES AND CLAIMS
-- Master entities, claim pipeline, documents, trust rollups
-- Extends existing 'entities' table if present
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── market_entities — canonical business entities ──
CREATE TABLE IF NOT EXISTS public.market_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('person','company','agency','property','facility','team','unknown')),
  display_name text NOT NULL,
  legal_name text,
  country_id uuid REFERENCES public.countries(id),
  primary_language text,
  email text,
  phone_e164 text,
  website_url text,
  source_origin text DEFAULT 'manual',
  claim_status text DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed','invited','claimed','verified','blocked')),
  claimed_by_user_id uuid,
  hq_lat numeric(9,6),
  hq_lng numeric(9,6),
  service_area_summary jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_entities_country ON public.market_entities(country_id);
CREATE INDEX IF NOT EXISTS idx_market_entities_claim ON public.market_entities(claim_status);
CREATE INDEX IF NOT EXISTS idx_market_entities_name_trgm ON public.market_entities USING gin(display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_market_entities_phone ON public.market_entities(phone_e164);
CREATE INDEX IF NOT EXISTS idx_market_entities_email ON public.market_entities(email);

-- ── claim_activation_pipeline ──
CREATE TABLE IF NOT EXISTS public.claim_activation_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  country_role_id uuid REFERENCES public.country_roles(id),
  pipeline_stage text NOT NULL CHECK (pipeline_stage IN ('seeded','enriched','contactable','contacted','responded','claimed','verified','activated','lost')),
  contact_priority_score integer DEFAULT 0,
  reason_to_claim text,
  activation_offer text,
  last_contact_at timestamptz,
  next_action_at timestamptz,
  contact_channels jsonb DEFAULT '[]'::jsonb,
  owner_agent_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_claim_pipeline_stage ON public.claim_activation_pipeline(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_claim_pipeline_priority ON public.claim_activation_pipeline(contact_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_claim_pipeline_next ON public.claim_activation_pipeline(next_action_at);

-- ── provider_documents ──
CREATE TABLE IF NOT EXISTS public.provider_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  country_role_id uuid REFERENCES public.country_roles(id),
  document_type text NOT NULL,
  document_number text,
  issuing_authority text,
  issued_at date,
  expires_at date,
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected','expired')),
  file_path text,
  ocr_summary jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_docs_entity ON public.provider_documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_provider_docs_role ON public.provider_documents(country_role_id);
CREATE INDEX IF NOT EXISTS idx_provider_docs_status ON public.provider_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_docs_expires ON public.provider_documents(expires_at);

-- ── provider_performance_rollups ──
CREATE TABLE IF NOT EXISTS public.provider_performance_rollups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  country_role_id uuid REFERENCES public.country_roles(id),
  country_id uuid REFERENCES public.countries(id),
  trust_score numeric(6,2) DEFAULT 0,
  response_rate numeric(6,2) DEFAULT 0,
  acceptance_rate numeric(6,2) DEFAULT 0,
  completion_rate numeric(6,2) DEFAULT 0,
  on_time_rate numeric(6,2) DEFAULT 0,
  incident_rate numeric(6,2) DEFAULT 0,
  repeat_customer_rate numeric(6,2) DEFAULT 0,
  proof_of_work_rate numeric(6,2) DEFAULT 0,
  completed_jobs_count integer DEFAULT 0,
  last_rolled_up_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(entity_id, country_role_id, country_id)
);
CREATE INDEX IF NOT EXISTS idx_perf_rollups_country ON public.provider_performance_rollups(country_id);
CREATE INDEX IF NOT EXISTS idx_perf_rollups_role ON public.provider_performance_rollups(country_role_id);
CREATE INDEX IF NOT EXISTS idx_perf_rollups_trust ON public.provider_performance_rollups(trust_score DESC);

SELECT public.attach_updated_at_trigger('public.market_entities');
SELECT public.attach_updated_at_trigger('public.claim_activation_pipeline');
SELECT public.attach_updated_at_trigger('public.provider_documents');
