-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 040 — PERMIT AND CORRIDOR LAYER
-- Permit actors, corridors, route survey assets, risk profiles
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── permit_actors ──
CREATE TABLE IF NOT EXISTS public.permit_actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  actor_name text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('permit_office','police','municipality','highway_authority','utility','bridge_authority','toll_operator','port','rail','border','other')),
  actor_scope text NOT NULL CHECK (actor_scope IN ('national','state_province','region','city','corridor','facility','cross_border')),
  actor_level text,
  jurisdiction_type text,
  jurisdiction_name text,
  contact_methods jsonb DEFAULT '{}'::jsonb,
  approval_type jsonb DEFAULT '[]'::jsonb,
  fee_type jsonb DEFAULT '[]'::jsonb,
  lead_time_hours integer,
  escort_trigger jsonb DEFAULT '{}'::jsonb,
  police_trigger jsonb DEFAULT '{}'::jsonb,
  utility_trigger jsonb DEFAULT '{}'::jsonb,
  bridge_review_trigger jsonb DEFAULT '{}'::jsonb,
  route_survey_trigger jsonb DEFAULT '{}'::jsonb,
  travel_window_control jsonb DEFAULT '{}'::jsonb,
  after_hours_control jsonb DEFAULT '{}'::jsonb,
  source_url text,
  source_type text DEFAULT 'official',
  confidence text DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pa_country ON public.permit_actors(country_id);
CREATE INDEX IF NOT EXISTS idx_pa_type ON public.permit_actors(actor_type);
CREATE INDEX IF NOT EXISTS idx_pa_scope ON public.permit_actors(actor_scope);
CREATE INDEX IF NOT EXISTS idx_pa_jurisdiction_trgm ON public.permit_actors USING gin(jurisdiction_name gin_trgm_ops);

-- ── hc_corridors — OS-grade corridor table ──
-- Extends existing corridors table concept
CREATE TABLE IF NOT EXISTS public.hc_corridors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  corridor_key text NOT NULL,
  corridor_name text NOT NULL,
  origin_zone text,
  destination_zone text,
  corridor_type text CHECK (corridor_type IN ('port','industrial','wind','mining','construction','cross_border','utility','other')),
  risk_summary jsonb DEFAULT '{}'::jsonb,
  demand_score integer DEFAULT 0,
  supply_score integer DEFAULT 0,
  monetization_score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country_id, corridor_key)
);
CREATE INDEX IF NOT EXISTS idx_hc_corr_country ON public.hc_corridors(country_id);
CREATE INDEX IF NOT EXISTS idx_hc_corr_demand ON public.hc_corridors(demand_score DESC);
CREATE INDEX IF NOT EXISTS idx_hc_corr_money ON public.hc_corridors(monetization_score DESC);

-- ── route_survey_assets — survey once, sell many times ──
CREATE TABLE IF NOT EXISTS public.route_survey_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  corridor_id uuid REFERENCES public.hc_corridors(id),
  job_id uuid REFERENCES public.hc_jobs(id),
  captured_by_entity_id uuid REFERENCES public.market_entities(id),
  asset_key text UNIQUE NOT NULL,
  route_name text NOT NULL,
  start_label text,
  end_label text,
  summary_pdf_path text,
  raw_geojson jsonb DEFAULT '{}'::jsonb,
  survey_findings jsonb DEFAULT '[]'::jsonb,
  bridge_clearance_points jsonb DEFAULT '[]'::jsonb,
  hazards_detected jsonb DEFAULT '[]'::jsonb,
  survey_status text DEFAULT 'draft' CHECK (survey_status IN ('draft','pending_review','approved','archived')),
  resale_tier text DEFAULT 'internal' CHECK (resale_tier IN ('internal','partner','public')),
  resale_price numeric(12,2),
  currency_code char(3),
  captured_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rsa_country ON public.route_survey_assets(country_id);
CREATE INDEX IF NOT EXISTS idx_rsa_corridor ON public.route_survey_assets(corridor_id);
CREATE INDEX IF NOT EXISTS idx_rsa_status ON public.route_survey_assets(survey_status);
CREATE INDEX IF NOT EXISTS idx_rsa_resale ON public.route_survey_assets(resale_tier);

-- ── corridor_risk_profiles ──
CREATE TABLE IF NOT EXISTS public.corridor_risk_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  corridor_id uuid NOT NULL REFERENCES public.hc_corridors(id),
  wind_risk_score integer DEFAULT 0,
  curfew_risk_score integer DEFAULT 0,
  bridge_risk_score integer DEFAULT 0,
  urban_turn_risk_score integer DEFAULT 0,
  hazmat_restriction_score integer DEFAULT 0,
  seasonality_score integer DEFAULT 0,
  permit_difficulty_score integer DEFAULT 0,
  risk_notes jsonb DEFAULT '[]'::jsonb,
  last_calculated_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(country_id, corridor_id)
);
CREATE INDEX IF NOT EXISTS idx_crp_corridor ON public.corridor_risk_profiles(corridor_id);
CREATE INDEX IF NOT EXISTS idx_crp_permit ON public.corridor_risk_profiles(permit_difficulty_score DESC);

-- Wire deferred FKs
DO $$ BEGIN
  ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_corridor
    FOREIGN KEY (corridor_id) REFERENCES public.hc_corridors(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.job_stack_templates ADD CONSTRAINT fk_jst_corridor
    FOREIGN KEY (corridor_id) REFERENCES public.hc_corridors(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.capacity_heatmaps ADD CONSTRAINT fk_ch_corridor
    FOREIGN KEY (corridor_id) REFERENCES public.hc_corridors(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.pricing_observations ADD CONSTRAINT fk_po_permit_actor
    FOREIGN KEY (permit_actor_id) REFERENCES public.permit_actors(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT public.attach_updated_at_trigger('public.permit_actors');
SELECT public.attach_updated_at_trigger('public.hc_corridors');
SELECT public.attach_updated_at_trigger('public.route_survey_assets');
