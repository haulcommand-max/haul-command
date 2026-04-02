-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 010 — GLOBAL DICTIONARY
-- Canonical roles, countries (extends country_tiers), archetypes, monetization defaults
-- Upgrade-only: preserves existing country_tiers, extends with canonical role layer
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── canonical_roles ──
CREATE TABLE IF NOT EXISTS public.canonical_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text UNIQUE NOT NULL,
  role_name text NOT NULL,
  role_family text NOT NULL,
  is_dispatchable boolean DEFAULT true,
  is_regulated boolean DEFAULT false,
  is_authority_actor boolean DEFAULT false,
  is_private_market boolean DEFAULT true,
  default_pricing_models jsonb DEFAULT '[]'::jsonb,
  default_required_documents jsonb DEFAULT '[]'::jsonb,
  default_required_equipment jsonb DEFAULT '[]'::jsonb,
  default_trust_signals jsonb DEFAULT '[]'::jsonb,
  default_money_score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_canonical_roles_family ON public.canonical_roles(role_family);
CREATE INDEX IF NOT EXISTS idx_canonical_roles_dispatchable ON public.canonical_roles(is_dispatchable);
CREATE INDEX IF NOT EXISTS idx_canonical_roles_authority ON public.canonical_roles(is_authority_actor);

-- ── countries (the full 120-country OS-grade table, coexists with country_tiers) ──
CREATE TABLE IF NOT EXISTS public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code char(2) UNIQUE NOT NULL,
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('gold','blue','silver','slate','copper')),
  archetype_profile text NOT NULL,
  languages jsonb DEFAULT '[]'::jsonb,
  local_roots jsonb DEFAULT '[]'::jsonb,
  legal_root text NOT NULL DEFAULT 'common_law',
  geo_order jsonb DEFAULT '[]'::jsonb,
  validation_priority text NOT NULL DEFAULT 'medium' CHECK (validation_priority IN ('high','medium','low')),
  market_status text DEFAULT 'research' CHECK (market_status IN ('research','seeding','demand_capture','waitlist','live','paused')),
  pricing_capture_status text DEFAULT 'unknown' CHECK (pricing_capture_status IN ('unknown','seeded','partial','strong')),
  roles_capture_status text DEFAULT 'unknown' CHECK (roles_capture_status IN ('unknown','partial','strong')),
  permit_actor_capture_status text DEFAULT 'unknown' CHECK (permit_actor_capture_status IN ('unknown','partial','strong')),
  dispatch_launch_status text DEFAULT 'not_ready' CHECK (dispatch_launch_status IN ('not_ready','pilot','partial','live')),
  directory_launch_status text DEFAULT 'not_ready' CHECK (directory_launch_status IN ('not_ready','pilot','partial','live')),
  payment_launch_status text DEFAULT 'not_ready' CHECK (payment_launch_status IN ('not_ready','pilot','partial','live')),
  top_cities jsonb DEFAULT '[]'::jsonb,
  top_corridors jsonb DEFAULT '[]'::jsonb,
  top_ports jsonb DEFAULT '[]'::jsonb,
  top_border_crossings jsonb DEFAULT '[]'::jsonb,
  top_industrial_zones jsonb DEFAULT '[]'::jsonb,
  monetization_priority jsonb DEFAULT '[]'::jsonb,
  risk_notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_countries_tier ON public.countries(tier);
CREATE INDEX IF NOT EXISTS idx_countries_archetype ON public.countries(archetype_profile);
CREATE INDEX IF NOT EXISTS idx_countries_market_status ON public.countries(market_status);

-- ── archetype_defaults ──
CREATE TABLE IF NOT EXISTS public.archetype_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_key text UNIQUE NOT NULL,
  roles_default jsonb DEFAULT '[]'::jsonb,
  pricing_modes jsonb DEFAULT '[]'::jsonb,
  monetization_priority jsonb DEFAULT '[]'::jsonb,
  intake_defaults jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── monetization_default_rules ──
CREATE TABLE IF NOT EXISTS public.monetization_default_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_family text NOT NULL,
  can_receive_jobs boolean DEFAULT true,
  lead_unlockable boolean DEFAULT true,
  subscription_eligible boolean DEFAULT true,
  featured_listing_eligible boolean DEFAULT true,
  territory_sponsor_eligible boolean DEFAULT false,
  corridor_sponsor_eligible boolean DEFAULT false,
  training_eligible boolean DEFAULT false,
  insurance_referral_eligible boolean DEFAULT false,
  financing_referral_eligible boolean DEFAULT false,
  equipment_marketplace_eligible boolean DEFAULT false,
  rush_fee_eligible boolean DEFAULT false,
  standby_margin_eligible boolean DEFAULT false,
  data_sale_eligible boolean DEFAULT false,
  api_exposure_eligible boolean DEFAULT false,
  default_revenue_priority_score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_monetization_defaults_family ON public.monetization_default_rules(role_family);

-- Attach updated_at triggers
SELECT public.attach_updated_at_trigger('public.canonical_roles');
SELECT public.attach_updated_at_trigger('public.countries');
SELECT public.attach_updated_at_trigger('public.archetype_defaults');
