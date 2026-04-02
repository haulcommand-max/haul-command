-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 070 — DISPATCH SUPPLY AND NETWORK EFFECTS
-- Supply visibility, availability, referrals, bounties
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── dispatch_supply ──
CREATE TABLE IF NOT EXISTS public.dispatch_supply (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  country_role_id uuid NOT NULL REFERENCES public.country_roles(id),
  availability_status text DEFAULT 'unknown' CHECK (availability_status IN ('unknown','available','busy','offline','paused')),
  accepts_urgent boolean DEFAULT false,
  accepts_night_moves boolean DEFAULT false,
  accepts_weekend_moves boolean DEFAULT false,
  accepts_cross_border boolean DEFAULT false,
  service_radius_km integer,
  coverage_summary jsonb DEFAULT '{}'::jsonb,
  home_base_label text,
  home_lat numeric(9,6),
  home_lng numeric(9,6),
  priority_score integer DEFAULT 0,
  response_time_minutes_estimate integer,
  trust_score_snapshot numeric(6,2),
  document_status_snapshot text DEFAULT 'unknown',
  payment_terms_summary jsonb DEFAULT '{}'::jsonb,
  last_seen_at timestamptz,
  last_dispatch_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_id, country_role_id)
);
CREATE INDEX IF NOT EXISTS idx_ds_country_status ON public.dispatch_supply(country_id, availability_status);
CREATE INDEX IF NOT EXISTS idx_ds_role_status ON public.dispatch_supply(country_role_id, availability_status);
CREATE INDEX IF NOT EXISTS idx_ds_priority ON public.dispatch_supply(priority_score DESC);

-- ── partner_referral_edges ──
CREATE TABLE IF NOT EXISTS public.partner_referral_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  to_entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  country_id uuid REFERENCES public.countries(id),
  referral_type text NOT NULL CHECK (referral_type IN ('hotel','yard','parking','fuel','repair','installer','insurance','financing','training','other')),
  commission_mode text CHECK (commission_mode IN ('flat','percent','lead_fee','none')),
  commission_value numeric(12,2),
  currency_code char(3),
  is_active boolean DEFAULT true,
  quality_score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_pre_from ON public.partner_referral_edges(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_pre_to ON public.partner_referral_edges(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_pre_type ON public.partner_referral_edges(referral_type);
CREATE INDEX IF NOT EXISTS idx_pre_quality ON public.partner_referral_edges(quality_score DESC);

-- ── capacity_heatmaps ──
CREATE TABLE IF NOT EXISTS public.capacity_heatmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  corridor_id uuid,  -- FK deferred
  country_role_id uuid REFERENCES public.country_roles(id),
  geo_bucket text NOT NULL,
  supply_available_count integer DEFAULT 0,
  demand_open_count integer DEFAULT 0,
  imbalance_score integer DEFAULT 0,
  recommended_bounty numeric(12,2),
  currency_code char(3),
  last_calculated_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ch_country ON public.capacity_heatmaps(country_id);
CREATE INDEX IF NOT EXISTS idx_ch_role ON public.capacity_heatmaps(country_role_id);
CREATE INDEX IF NOT EXISTS idx_ch_imbalance ON public.capacity_heatmaps(imbalance_score DESC);
CREATE INDEX IF NOT EXISTS idx_ch_geo ON public.capacity_heatmaps(geo_bucket);

-- ── relocation_bounties ──
CREATE TABLE IF NOT EXISTS public.relocation_bounties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  country_role_id uuid NOT NULL REFERENCES public.country_roles(id),
  capacity_heatmap_id uuid REFERENCES public.capacity_heatmaps(id),
  job_id uuid REFERENCES public.hc_jobs(id),
  geo_target text NOT NULL,
  bounty_amount numeric(12,2) NOT NULL,
  currency_code char(3) NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open','claimed','expired','cancelled','paid')),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_rb_role ON public.relocation_bounties(country_role_id);
CREATE INDEX IF NOT EXISTS idx_rb_status ON public.relocation_bounties(status);
CREATE INDEX IF NOT EXISTS idx_rb_expires ON public.relocation_bounties(expires_at);

SELECT public.attach_updated_at_trigger('public.dispatch_supply');
