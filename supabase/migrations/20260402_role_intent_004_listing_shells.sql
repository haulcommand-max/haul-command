-- ============================================================================
-- HAUL COMMAND: Role + Intent Engine — Step 4: Listing Shell Generation Tables
-- Tables: hc_entity_contact_observations, hc_listing_shell_queue,
--         hc_listing_shell_events, hc_entity_surface_links
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. hc_entity_contact_observations — Normalized contact observations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_entity_contact_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text,
  source_row_id text,
  hc_entity_id uuid,
  hc_identity_id uuid,
  observed_phone_e164 text,
  observed_phone_raw text,
  observed_name text,
  observed_role_hint text,
  observed_country_code text,
  observed_region_code text,
  observed_city_slug text,
  observed_url text,
  confidence_score numeric NOT NULL DEFAULT 0,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_entity_contact_obs_entity
  ON public.hc_entity_contact_observations(hc_entity_id);
CREATE INDEX IF NOT EXISTS idx_hc_entity_contact_obs_identity
  ON public.hc_entity_contact_observations(hc_identity_id);
CREATE INDEX IF NOT EXISTS idx_hc_entity_contact_obs_phone
  ON public.hc_entity_contact_observations(observed_phone_e164);
CREATE INDEX IF NOT EXISTS idx_hc_entity_contact_obs_market
  ON public.hc_entity_contact_observations(observed_country_code, observed_region_code);
CREATE INDEX IF NOT EXISTS idx_hc_entity_contact_obs_name_tsv
  ON public.hc_entity_contact_observations
  USING gin (to_tsvector('simple', coalesce(observed_name, '')));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. hc_listing_shell_queue — Queue of listing shells to create or refresh
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_listing_shell_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hc_entity_id uuid,
  hc_identity_id uuid,
  source_key text NOT NULL,
  role_key text,
  country_code text,
  region_code text,
  city_slug text,
  phone_e164 text,
  display_name text,
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  priority_rank integer NOT NULL DEFAULT 0,
  error_text text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_hc_listing_shell_queue_status_priority
  ON public.hc_listing_shell_queue(status, priority_rank DESC, queued_at ASC);
CREATE INDEX IF NOT EXISTS idx_hc_listing_shell_queue_entity
  ON public.hc_listing_shell_queue(hc_entity_id);
CREATE INDEX IF NOT EXISTS idx_hc_listing_shell_queue_phone
  ON public.hc_listing_shell_queue(phone_e164);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. hc_listing_shell_events — Audit shell creation and publication
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_listing_shell_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.hc_listing_shell_queue(id),
  hc_entity_id uuid,
  listing_id uuid,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_listing_shell_events_queue
  ON public.hc_listing_shell_events(queue_id);
CREATE INDEX IF NOT EXISTS idx_hc_listing_shell_events_entity
  ON public.hc_listing_shell_events(hc_entity_id);
CREATE INDEX IF NOT EXISTS idx_hc_listing_shell_events_type
  ON public.hc_listing_shell_events(event_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. hc_entity_surface_links — Link canonical entities to public surfaces
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_entity_surface_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hc_entity_id uuid NOT NULL,
  surface_type text NOT NULL,
  surface_path text NOT NULL,
  country_code text,
  region_code text,
  role_key text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hc_entity_id, surface_type, surface_path)
);

CREATE INDEX IF NOT EXISTS idx_hc_entity_surface_links_entity
  ON public.hc_entity_surface_links(hc_entity_id);
CREATE INDEX IF NOT EXISTS idx_hc_entity_surface_links_market
  ON public.hc_entity_surface_links(country_code, region_code);

COMMIT;
