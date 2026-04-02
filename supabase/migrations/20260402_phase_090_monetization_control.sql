-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 090 — MONETIZATION CONTROL PLANE
-- Per entity-role-country monetization switches
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.monetization_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  country_id uuid REFERENCES public.countries(id),
  country_role_id uuid REFERENCES public.country_roles(id),
  can_receive_jobs boolean DEFAULT true,
  can_pay_take_rate boolean DEFAULT true,
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
  revenue_priority_score integer DEFAULT 0,
  lifecycle_stage text DEFAULT 'seed' CHECK (lifecycle_stage IN ('seed','claim','activate','sell','dispatch','retain','expand')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_id, country_id, country_role_id)
);
CREATE INDEX IF NOT EXISTS idx_mf_entity ON public.monetization_flags(entity_id);
CREATE INDEX IF NOT EXISTS idx_mf_country ON public.monetization_flags(country_id);
CREATE INDEX IF NOT EXISTS idx_mf_role ON public.monetization_flags(country_role_id);
CREATE INDEX IF NOT EXISTS idx_mf_revenue ON public.monetization_flags(revenue_priority_score DESC);

SELECT public.attach_updated_at_trigger('public.monetization_flags');
