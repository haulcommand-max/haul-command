-- 20260219_seo_views.sql
-- High-performance views for Programmatic SEO ('Content Pincer')

-- 1) City-Level Market Pulse
-- Aggregates provider density and regional benchmarks for city directory pages.
CREATE OR REPLACE VIEW public.seo_market_pulse AS
WITH city_counts AS (
  SELECT 
    country,
    state as region_code,
    city,
    COUNT(*) as total_providers,
    COUNT(*) FILTER (WHERE trust_score > 70) as elite_providers,
    AVG(trust_score) as avg_trust_score
  FROM public.providers
  WHERE status = 'active'
  GROUP BY country, state, city
),
city_loads AS (
  SELECT 
    origin_country,
    origin_admin1 as region_code,
    origin_city as city,
    COUNT(*) as active_loads,
    AVG(rate_amount / NULLIF(miles, 0)) FILTER (WHERE status = 'active') as avg_posted_rpm
  FROM public.loads
  WHERE status = 'active'
  GROUP BY origin_country, origin_admin1, origin_city
)
SELECT 
  cc.country,
  cc.region_code,
  cc.city,
  cc.total_providers,
  cc.elite_providers,
  cc.avg_trust_score,
  COALESCE(cl.active_loads, 0) as active_loads,
  COALESCE(cl.avg_posted_rpm, 0) as avg_posted_rpm,
  rb.low as benchmark_low,
  rb.high as benchmark_high,
  rb.service_type
FROM city_counts cc
LEFT JOIN city_loads cl ON cl.country = cc.country AND cl.region_code = cc.region_code AND cl.city = cc.city
LEFT JOIN public.rate_benchmarks rb ON rb.country = cc.country AND rb.region = cc.region_code
ORDER BY cc.total_providers DESC;

-- 2) State/Province Highlights
-- For regional landing pages
CREATE OR REPLACE VIEW public.seo_region_stats AS
SELECT 
  country,
  state as region_code,
  COUNT(*) as total_providers,
  COUNT(DISTINCT city) as coverage_cities,
  AVG(trust_score) as region_trust_index
FROM public.providers
WHERE status = 'active'
GROUP BY country, state;

-- 3) Regulatory Moat Helper
-- Returns summary of state regulations for the 'Regulatory Moat' section.
CREATE OR REPLACE FUNCTION public.get_state_reg_summary(p_state_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'state_name', state_name,
    'escort_width', escort_required_width,
    'escort_height', escort_required_height,
    'pole_trigger', height_pole_threshold,
    'night_rules', night_restrictions,
    'holiday_rules', holiday_rules,
    'confidence', confidence_score
  ) INTO v_summary
  FROM public.state_regulations
  WHERE state_code = p_state_code
  LIMIT 1;

  RETURN COALESCE(v_summary, '{}'::jsonb);
END;
$$;

-- 4) Permissions
GRANT SELECT ON public.seo_market_pulse TO anon, authenticated;
GRANT SELECT ON public.seo_region_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_state_reg_summary(text) TO anon, authenticated;
