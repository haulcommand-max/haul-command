
-- Phase 16: Fair Range Engine Infrastructure
-- Tables: benchmarks + region map + outcome rollups

-- Regions we’ll use across US + Canada
CREATE TABLE IF NOT EXISTS public.geo_regions (
  geo_key text primary key,         -- e.g. "us:fl", "us:tx", "ca:on"
  country text not null,
  admin1 text not null,             -- state/province code
  region text not null              -- southeast, midwest, northeast, southwest, west_coast, canada_west, canada_east
);

-- Pricing benchmarks (seeded from industry data)
CREATE TABLE IF NOT EXISTS public.rate_benchmarks (
  id uuid primary key default gen_random_uuid(),
  country text not null,             -- 'us' | 'ca'
  region text not null,              -- southeast, midwest, northeast, southwest, west_coast, west_coast_canada, midwest_northeast, etc.
  service_type text not null,        -- 'pevo_lead_chase', 'height_pole', 'bucket_truck', 'route_survey', 'police_state', 'police_local'
  unit text not null,                -- 'per_mile' | 'per_day' | 'per_hour' | 'flat' | 'multiplier'
  low numeric,
  high numeric,
  notes text,
  source text not null default 'haul_command_rate_guides',
  updated_at timestamptz not null default now(),
  unique(country, region, service_type, unit)
);

-- Observed outcomes (coach feedback)
CREATE TABLE IF NOT EXISTS public.rate_outcomes_rollup (
  country text not null,
  region text not null,
  service_type text not null,
  bucket text not null, -- 'below'|'fair'|'strong'
  avg_fill_minutes numeric,
  fill_rate_01 numeric, -- % of loads that filled within 24h/72h
  sample_size int not null default 0,
  updated_at timestamptz not null default now(),
  primary key(country, region, service_type, bucket)
);

-- Upgrading load_intel with pricing and probability fields
ALTER TABLE public.load_intel
ADD COLUMN IF NOT EXISTS posted_rate_per_mile numeric,
ADD COLUMN IF NOT EXISTS market_low_per_mile numeric,
ADD COLUMN IF NOT EXISTS market_high_per_mile numeric,
ADD COLUMN IF NOT EXISTS rate_position_01 numeric,
ADD COLUMN IF NOT EXISTS rate_signal text, -- 'below' | 'fair' | 'strong'
ADD COLUMN IF NOT EXISTS fill_probability_01 numeric,
ADD COLUMN IF NOT EXISTS deadhead_risk_01 numeric,
ADD COLUMN IF NOT EXISTS benchmark_confidence text; -- 'high'|'medium'|'simulated'

-- Helper functions
CREATE OR REPLACE FUNCTION public.clamp01(x numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$ SELECT GREATEST(0, LEAST(1, x)); $$;

CREATE OR REPLACE FUNCTION public.rate_position_01(p_rate numeric, p_low numeric, p_high numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$
  SELECT public.clamp01( (p_rate - p_low) / nullif(p_high - p_low, 0) );
$$;

-- Benchmark Picker
CREATE OR REPLACE FUNCTION public.pick_benchmark_per_mile(
  p_country text,
  p_region text,
  p_service_type text
)
RETURNS table(low numeric, high numeric)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  -- exact match
  RETURN QUERY
  SELECT rb.low, rb.high
  FROM public.rate_benchmarks rb
  WHERE rb.country = p_country
    AND rb.region = p_region
    AND rb.service_type = p_service_type
    AND rb.unit = 'per_mile'
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- region wildcard (all)
  RETURN QUERY
  SELECT rb.low, rb.high
  FROM public.rate_benchmarks rb
  WHERE rb.country = p_country
    AND rb.region = 'all'
    AND rb.service_type = p_service_type
    AND rb.unit = 'per_mile'
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Canada simulation fallback
  IF p_country = 'ca' THEN
    RETURN QUERY
    SELECT rb.low, rb.high
    FROM public.rate_benchmarks rb
    WHERE rb.country = 'us'
      AND rb.region IN ('west_coast','midwest','northeast')
      AND rb.service_type = p_service_type
      AND rb.unit = 'per_mile'
    ORDER BY CASE rb.region WHEN 'west_coast' THEN 0 ELSE 1 END
    LIMIT 1;
  END IF;

  RETURN;
END;
$$;

-- Posting Hint RPC
CREATE OR REPLACE FUNCTION public.get_posting_rate_hint(
  p_country text,
  p_region text,
  p_service_type text,
  p_posted_rate_per_mile numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_low numeric; v_high numeric; v_pos numeric; v_bucket text;
  v_roll record;
BEGIN
  SELECT low, high INTO v_low, v_high
  FROM public.pick_benchmark_per_mile(p_country, p_region, p_service_type);

  IF v_low IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'hint', 'No benchmark yet for this region/service.');
  END IF;

  v_pos := public.rate_position_01(p_posted_rate_per_mile, v_low, v_high);
  v_bucket := CASE WHEN v_pos >= 0.65 THEN 'strong' WHEN v_pos >= 0.40 THEN 'fair' ELSE 'below' END;

  SELECT * INTO v_roll
  FROM public.rate_outcomes_rollup
  WHERE country=p_country AND region=p_region AND service_type=p_service_type AND bucket=v_bucket;

  RETURN jsonb_build_object(
    'ok', true,
    'market_low', v_low,
    'market_high', v_high,
    'rate_position_01', v_pos,
    'bucket', v_bucket,
    'message',
      CASE
        when v_bucket='below' then 'Below market — expect slower fill. Raise rate to improve acceptance.'
        when v_bucket='fair' then 'Within range — normal fill expected.'
        else 'Strong rate — fast fill likely.'
      END,
    'outcomes',
      CASE WHEN v_roll IS NULL THEN NULL ELSE
        jsonb_build_object('avg_fill_minutes', v_roll.avg_fill_minutes, 'fill_rate_01', v_roll.fill_rate_01, 'sample_size', v_roll.sample_size)
      END
  );
END;
$$;
