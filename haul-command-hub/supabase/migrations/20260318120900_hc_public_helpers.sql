-- ─── Helper Functions ───

CREATE OR REPLACE FUNCTION hc_days_since(ts timestamptz)
RETURNS numeric
LANGUAGE sql IMMUTABLE AS $$
  SELECT extract(epoch FROM (now() - ts)) / 86400.0
$$;

CREATE OR REPLACE FUNCTION hc_clamp_01(val numeric)
RETURNS numeric
LANGUAGE sql IMMUTABLE AS $$
  SELECT greatest(0, least(1, val))
$$;

-- ─── Updated_at triggers for all Gap 12 tables ───

CREATE OR REPLACE FUNCTION hc_update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'hc_market_truth_flags',
      'hc_page_seo_contracts',
      'hc_sponsor_inventory',
      'hc_provider_best_public_record',
      'hc_provider_search_index',
      'hc_broker_public_profile',
      'hc_rates_public',
      'hc_requirements_public'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I; CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION hc_update_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ─── RLS: Public read for all Gap 12 tables ───

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'hc_market_truth_flags',
      'hc_page_seo_contracts',
      'hc_sponsor_inventory',
      'hc_provider_best_public_record',
      'hc_provider_search_index',
      'hc_broker_public_profile',
      'hc_rates_public',
      'hc_requirements_public'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format(
      'DROP POLICY IF EXISTS public_read ON %I; CREATE POLICY public_read ON %I FOR SELECT USING (true);',
      tbl, tbl
    );
  END LOOP;
END;
$$;
