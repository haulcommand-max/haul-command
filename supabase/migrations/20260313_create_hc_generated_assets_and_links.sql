-- ============================================================
-- hc_generated_assets — AI-generated media (Gemini, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_generated_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Generation metadata
  source        TEXT NOT NULL DEFAULT 'gemini',
  model         TEXT,
  prompt        TEXT,
  kind          TEXT NOT NULL DEFAULT 'general',

  -- Optional entity binding
  entity_type   TEXT,
  entity_id     TEXT,

  -- Storage
  storage_bucket TEXT NOT NULL DEFAULT 'hc-generated-images',
  storage_path   TEXT NOT NULL,
  public_url     TEXT NOT NULL,
  mime_type      TEXT DEFAULT 'image/png',

  -- Lineage (for edits)
  source_asset_id UUID REFERENCES public.hc_generated_assets(id) ON DELETE SET NULL,

  -- Extra
  notes         TEXT,
  meta          JSONB DEFAULT '{}',
  is_archived   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_hc_gen_assets_kind ON public.hc_generated_assets (kind);
CREATE INDEX IF NOT EXISTS idx_hc_gen_assets_entity ON public.hc_generated_assets (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hc_gen_assets_created ON public.hc_generated_assets (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hc_gen_assets_updated_at ON public.hc_generated_assets;
CREATE TRIGGER trg_hc_gen_assets_updated_at
  BEFORE UPDATE ON public.hc_generated_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- hc_asset_entity_links — many-to-many with slot/ordering
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hc_asset_entity_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  asset_id      UUID NOT NULL REFERENCES public.hc_generated_assets(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,

  usage_slot    TEXT NOT NULL DEFAULT 'gallery',
  sort_order    INT NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,

  UNIQUE (asset_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_hc_ael_entity ON public.hc_asset_entity_links (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hc_ael_asset ON public.hc_asset_entity_links (asset_id);

ALTER TABLE public.hc_generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_asset_entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_hc_gen_assets" ON public.hc_generated_assets
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_hc_ael" ON public.hc_asset_entity_links
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
