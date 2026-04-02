-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 050 — INTAKE AND ORDER COMPOSER
-- All inbound channels → one structured order spine
-- This is the conversion spine. Fastest path to multi-line-item monetization.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── intake_channels ──
CREATE TABLE IF NOT EXISTS public.intake_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_key text UNIQUE NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('ui','api','edi_204','edi_214','email','voice','sms','whatsapp','webhook','manual')),
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  parser_strategy text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ── intake_events — every inbound signal becomes a row ──
CREATE TABLE IF NOT EXISTS public.intake_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_channel_id uuid NOT NULL REFERENCES public.intake_channels(id),
  source_entity_id uuid REFERENCES public.market_entities(id),
  created_job_id uuid, -- FK added after jobs table exists
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized_payload jsonb DEFAULT '{}'::jsonb,
  parse_status text DEFAULT 'pending' CHECK (parse_status IN ('pending','parsed','failed','review_needed')),
  parse_confidence text DEFAULT 'medium' CHECK (parse_confidence IN ('low','medium','high')),
  source_reference text,
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_intake_events_status ON public.intake_events(parse_status);
CREATE INDEX IF NOT EXISTS idx_intake_events_received ON public.intake_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_events_source ON public.intake_events(source_entity_id);

-- ── job_stack_templates — reusable composable order blueprints ──
CREATE TABLE IF NOT EXISTS public.job_stack_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('global','country','archetype','corridor','enterprise')),
  country_id uuid REFERENCES public.countries(id),
  corridor_id uuid, -- FK deferred until corridors table created
  archetype_profile text,
  job_type text NOT NULL,
  load_type text,
  dimension_rules jsonb DEFAULT '{}'::jsonb,
  required_roles jsonb DEFAULT '[]'::jsonb,
  optional_roles jsonb DEFAULT '[]'::jsonb,
  required_fees jsonb DEFAULT '[]'::jsonb,
  required_documents jsonb DEFAULT '[]'::jsonb,
  trigger_rules jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_job_stack_templates_scope ON public.job_stack_templates(scope_type);
CREATE INDEX IF NOT EXISTS idx_job_stack_templates_type ON public.job_stack_templates(job_type);
CREATE INDEX IF NOT EXISTS idx_job_stack_templates_country ON public.job_stack_templates(country_id);
