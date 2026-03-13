-- ============================================================
-- Variant Pack Tables Migration (applied to Supabase 2026-03-13)
-- Local copy for version control
-- ============================================================

-- 1. hc_prompt_templates
CREATE TABLE IF NOT EXISTS public.hc_prompt_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  version       INT NOT NULL DEFAULT 1,
  entity_type   TEXT,
  usage_slot    TEXT NOT NULL DEFAULT 'hero',
  prompt_template TEXT NOT NULL,
  description     TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  win_count     INT NOT NULL DEFAULT 0,
  use_count     INT NOT NULL DEFAULT 0,
  meta          JSONB DEFAULT '{}'
);

-- 2. hc_variant_generation_runs
CREATE TABLE IF NOT EXISTS public.hc_variant_generation_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  usage_slot    TEXT NOT NULL DEFAULT 'hero',
  template_id   UUID REFERENCES public.hc_prompt_templates(id) ON DELETE SET NULL,
  prompt_used   TEXT NOT NULL,
  variant_count INT NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','generating','completed','failed')),
  model         TEXT DEFAULT 'gemini-2.0-flash-exp',
  asset_ids     UUID[] DEFAULT '{}',
  error_message TEXT,
  meta          JSONB DEFAULT '{}'
);

-- 3. hc_template_win_events
CREATE TABLE IF NOT EXISTS public.hc_template_win_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  template_id   UUID NOT NULL REFERENCES public.hc_prompt_templates(id) ON DELETE CASCADE,
  asset_id      UUID NOT NULL REFERENCES public.hc_generated_assets(id) ON DELETE CASCADE,
  run_id        UUID REFERENCES public.hc_variant_generation_runs(id) ON DELETE SET NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  usage_slot    TEXT NOT NULL,
  event_type    TEXT NOT NULL DEFAULT 'selected_primary'
    CHECK (event_type IN ('selected_primary','made_live','promoted','won_ab_test'))
);

-- 4. hc_entity_media_history
CREATE TABLE IF NOT EXISTS public.hc_entity_media_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  usage_slot    TEXT NOT NULL,
  action        TEXT NOT NULL
    CHECK (action IN ('set_primary','make_live','rollback','archive','swap','unlink')),
  old_asset_id  UUID REFERENCES public.hc_generated_assets(id) ON DELETE SET NULL,
  new_asset_id  UUID REFERENCES public.hc_generated_assets(id) ON DELETE SET NULL,
  actor         TEXT DEFAULT 'admin',
  notes         TEXT,
  meta          JSONB DEFAULT '{}'
);

-- 5. Variant columns on hc_generated_assets
ALTER TABLE public.hc_generated_assets
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.hc_prompt_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_group_id UUID,
  ADD COLUMN IF NOT EXISTS variant_index INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.hc_variant_generation_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS usage_slot TEXT DEFAULT 'gallery',
  ADD COLUMN IF NOT EXISTS previous_primary_id UUID REFERENCES public.hc_generated_assets(id) ON DELETE SET NULL;

-- 6. RLS
ALTER TABLE public.hc_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_variant_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_template_win_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_entity_media_history ENABLE ROW LEVEL SECURITY;
