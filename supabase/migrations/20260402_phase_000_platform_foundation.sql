-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 000 — PLATFORM FOUNDATION
-- Extensions, helpers, triggers, timestamps, soft-delete, RLS scaffolding
-- Upgrade-only: all CREATE statements use IF NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ── touch_updated_at() trigger function ──
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── set_created_by_from_auth() helper ──
CREATE OR REPLACE FUNCTION public.set_created_by_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── normalize_text() for alias/search fields ──
CREATE OR REPLACE FUNCTION public.normalize_text(input text)
RETURNS text AS $$
BEGIN
  RETURN lower(trim(unaccent(input)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── money_round() helper — rounds to 2 decimal places ──
CREATE OR REPLACE FUNCTION public.money_round(val numeric)
RETURNS numeric AS $$
BEGIN
  RETURN round(val, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── Helper to attach updated_at trigger to any table ──
CREATE OR REPLACE FUNCTION public.attach_updated_at_trigger(tbl regclass)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()',
    tbl
  );
EXCEPTION WHEN duplicate_object THEN
  NULL; -- trigger already exists
END;
$$ LANGUAGE plpgsql;
