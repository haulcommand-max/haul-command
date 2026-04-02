-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 020 — COUNTRY ROLE LAYER
-- Country-specific roles + alias/search resolution
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.country_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  canonical_role_id uuid NOT NULL REFERENCES public.canonical_roles(id),
  local_title text,
  local_plural text,
  commercial_title text,
  legal_title text,
  english_fallback text,
  role_family_override text,
  is_core_dispatchable_supply boolean DEFAULT true,
  is_regulated boolean DEFAULT false,
  is_private_market boolean DEFAULT true,
  is_police_only boolean DEFAULT false,
  is_authority_actor boolean DEFAULT false,
  is_required_for_some_loads boolean DEFAULT false,
  is_optional_add_on boolean DEFAULT false,
  required_certifications jsonb DEFAULT '[]'::jsonb,
  required_equipment jsonb DEFAULT '[]'::jsonb,
  required_documents jsonb DEFAULT '[]'::jsonb,
  required_vehicle_type text,
  required_staffing_count integer,
  required_insurance jsonb DEFAULT '{}'::jsonb,
  typical_booking_lead_time_hours integer,
  typical_trigger_conditions jsonb DEFAULT '[]'::jsonb,
  pricing_model_types jsonb DEFAULT '[]'::jsonb,
  dispatch_priority integer DEFAULT 100,
  trust_signals jsonb DEFAULT '[]'::jsonb,
  can_be_job_fed_by_haul_command boolean DEFAULT true,
  can_be_subscription_sold boolean DEFAULT true,
  can_be_advertised boolean DEFAULT true,
  can_be_financed boolean DEFAULT false,
  can_be_cross_sold boolean DEFAULT true,
  money_score integer DEFAULT 0,
  capture_confidence text DEFAULT 'medium' CHECK (capture_confidence IN ('low','medium','high')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country_id, canonical_role_id)
);
CREATE INDEX IF NOT EXISTS idx_country_roles_country ON public.country_roles(country_id);
CREATE INDEX IF NOT EXISTS idx_country_roles_canonical ON public.country_roles(canonical_role_id);
CREATE INDEX IF NOT EXISTS idx_country_roles_dispatchable ON public.country_roles(is_core_dispatchable_supply);
CREATE INDEX IF NOT EXISTS idx_country_roles_police ON public.country_roles(is_police_only);
CREATE INDEX IF NOT EXISTS idx_country_roles_money ON public.country_roles(money_score DESC);

-- ── role_aliases — search resolution ──
CREATE TABLE IF NOT EXISTS public.role_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_role_id uuid NOT NULL REFERENCES public.country_roles(id),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  alias_text text NOT NULL,
  alias_normalized text NOT NULL,
  alias_language text NOT NULL,
  alias_type text NOT NULL CHECK (alias_type IN ('local','legal','commercial','slang','english_fallback','seo','intake')),
  search_intent_type text NOT NULL CHECK (search_intent_type IN ('service','directory','regulation','pricing','tool','glossary','job')),
  legal_or_commercial text NOT NULL CHECK (legal_or_commercial IN ('legal','commercial','mixed')),
  field_or_formal text NOT NULL CHECK (field_or_formal IN ('field','formal','mixed')),
  confidence text DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  source_type text DEFAULT 'manual',
  source_ref text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country_role_id, alias_normalized)
);
CREATE INDEX IF NOT EXISTS idx_role_aliases_trgm ON public.role_aliases USING gin(alias_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_role_aliases_country ON public.role_aliases(country_id);
CREATE INDEX IF NOT EXISTS idx_role_aliases_lang ON public.role_aliases(alias_language);
CREATE INDEX IF NOT EXISTS idx_role_aliases_intent ON public.role_aliases(search_intent_type);

SELECT public.attach_updated_at_trigger('public.country_roles');
SELECT public.attach_updated_at_trigger('public.role_aliases');
