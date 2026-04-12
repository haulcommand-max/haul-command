-- WAVE-7: SEO Public Surface Infrastructure
-- Additive only. No existing tables modified destructively.

-- 1. Static SEO page registry — tracks every published URL for sitemap + IndexNow
CREATE TABLE IF NOT EXISTS seo_page_registry (
  id              bigserial PRIMARY KEY,
  url_path        text        NOT NULL UNIQUE,
  page_family     text        NOT NULL, -- 'corridor', 'profile', 'glossary', 'regulations', 'city', 'country', 'tool'
  country_iso     text        NULL,
  region_code     text        NULL,
  priority        numeric(3,2) NOT NULL DEFAULT 0.80,
  change_freq     text        NOT NULL DEFAULT 'weekly',
  last_published  timestamptz NOT NULL DEFAULT now(),
  last_indexed_at timestamptz NULL,
  indexnow_sent   boolean     NOT NULL DEFAULT false,
  noindex         boolean     NOT NULL DEFAULT false,
  canonical_url   text        NULL,  -- if this page has a canonical redirect target
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_registry_country_family_idx
  ON seo_page_registry (country_iso, page_family);

CREATE INDEX IF NOT EXISTS seo_registry_published_idx
  ON seo_page_registry (last_published DESC)
  WHERE indexnow_sent = false;

-- 2. Function: register a URL in the SEO registry (upsert-safe)
CREATE OR REPLACE FUNCTION fn_register_seo_url(
  p_url_path    text,
  p_page_family text,
  p_country_iso text DEFAULT NULL,
  p_region_code text DEFAULT NULL,
  p_priority    numeric DEFAULT 0.80
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO seo_page_registry (url_path, page_family, country_iso, region_code, priority, last_published, indexnow_sent)
  VALUES (p_url_path, p_page_family, p_country_iso, p_region_code, p_priority, now(), false)
  ON CONFLICT (url_path) DO UPDATE
    SET last_published = now(),
        indexnow_sent  = false,  -- re-queue for IndexNow on content change
        priority       = EXCLUDED.priority;
END;
$$;

-- 3. Auto-register corridor pages when corridor rows are inserted/updated
CREATE OR REPLACE FUNCTION fn_auto_register_corridor_seo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM fn_register_seo_url(
    '/rates/corridors/' || NEW.slug,
    'corridor',
    NEW.country,
    NULL,
    0.90
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_corridor_seo ON corridors;
CREATE TRIGGER trg_corridor_seo
  AFTER INSERT OR UPDATE OF slug, display_name ON corridors
  FOR EACH ROW EXECUTE FUNCTION fn_auto_register_corridor_seo();

-- 4. Auto-register profile pages when profiles are claimed / trust_score changes
CREATE OR REPLACE FUNCTION fn_auto_register_profile_seo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.slug IS NOT NULL AND (NEW.is_claimed = true OR NEW.trust_score >= 40) THEN
    PERFORM fn_register_seo_url(
      '/directory/' || COALESCE(LOWER(NEW.country_iso), 'us') ||
        CASE WHEN NEW.region_code IS NOT NULL THEN '/' || LOWER(NEW.region_code) ELSE '' END ||
        '/' || NEW.slug,
      'profile',
      NEW.country_iso,
      NEW.region_code,
      CASE WHEN NEW.is_claimed THEN 0.80 ELSE 0.65 END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_seo ON profiles;
CREATE TRIGGER trg_profile_seo
  AFTER INSERT OR UPDATE OF slug, is_claimed, trust_score ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_auto_register_profile_seo();

-- 5. Add OpenGraph + meta fields to corridors table if missing
ALTER TABLE corridors
  ADD COLUMN IF NOT EXISTS og_title       text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url   text,
  ADD COLUMN IF NOT EXISTS schema_json    jsonb;

-- 6. Add IndexNow tracking columns to corridors
ALTER TABLE corridors
  ADD COLUMN IF NOT EXISTS last_seo_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS indexnow_sent_at      timestamptz;

-- 7. Ensure profiles table has slug column for URL generation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_uidx ON profiles(slug) WHERE slug IS NOT NULL;

-- 8. Backfill slugs for claimed profiles without one
UPDATE profiles
SET slug = LOWER(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL AND is_claimed = true AND display_name IS NOT NULL;
