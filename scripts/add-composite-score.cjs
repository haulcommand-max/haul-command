const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function run() {
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await client.connect();

  // Drop first — Postgres can't add/rename columns on existing views
  await client.query(`DROP VIEW IF EXISTS public.hc_corridor_public_v1;`);

  // Recreate view with composite_score alias added
  await client.query(`
    CREATE OR REPLACE VIEW public.hc_corridor_public_v1 AS
    SELECT
      c.id,
      c.corridor_key AS corridor_code,
      COALESCE(c.corridor_key, lower(replace(c.name, ' ', '-'))) AS slug,
      COALESCE(c.corridor_name, c.name) AS name,
      c.name AS short_name,
      'active' AS status,
      c.corridor_type,
      CASE 
        WHEN c.importance >= 0.9 THEN 'flagship'
        WHEN c.importance >= 0.7 THEN 'national'
        WHEN c.importance >= 0.5 THEN 'regional'
        WHEN c.importance >= 0.3 THEN 'metro'
        ELSE 'long_tail'
      END AS tier,
      c.country_code,
      'en' AS primary_language_code,
      'USD' AS currency_code,
      c.country_code AS origin_country_code,
      c.start_state AS origin_region_code,
      c.start_city AS origin_city_name,
      c.country_code AS destination_country_code,
      c.end_state AS destination_region_code,
      c.end_city AS destination_city_name,
      false AS is_cross_border,
      CASE WHEN c.miles IS NOT NULL THEN c.miles * 1.60934 ELSE NULL END AS distance_km,
      c.miles AS distance_miles,
      'road' AS typical_mode,
      COALESCE(c.demand_score, 0)::numeric(6,2) AS corridor_score,
      COALESCE(c.demand_score, 0)::numeric(6,2) AS composite_score,
      COALESCE(c.demand_score, 0)::numeric(6,2) AS seo_priority_score,
      COALESCE(c.demand_score, 0)::numeric(6,2) AS market_priority_score,
      COALESCE(c.monetization_score, 0)::numeric(6,2) AS monetization_priority_score,
      c.importance::numeric(6,2) AS freshness_score,
      c.importance::numeric(6,2) AS confidence_score,
      COALESCE(c.permit_complexity_avg, 0)::numeric(6,2) AS permit_complexity_score,
      CASE WHEN c.escort_demand_level = 'very_high' THEN 90
           WHEN c.escort_demand_level = 'high' THEN 70
           WHEN c.escort_demand_level = 'moderate' THEN 50
           WHEN c.escort_demand_level = 'low' THEN 30
           ELSE 10 END::numeric(6,2) AS escort_complexity_score,
      0::numeric(6,2) AS credential_complexity_score,
      0::numeric(6,2) AS scarcity_score,
      0::numeric(6,2) AS urgency_score,
      0::numeric(6,2) AS ad_inventory_score,
      COALESCE(c.avg_rate_per_mile_cents, 0)::numeric(12,2) AS commercial_value_estimate,
      COALESCE(c.load_count_30d, 0) AS search_volume_estimate,
      0::bigint AS requirement_count,
      0::bigint AS permit_count,
      0::bigint AS escort_count,
      0::bigint AS credential_count,
      0::bigint AS required_credential_count,
      c.avg_rate_per_mile_cents::numeric(12,2) AS escort_rate_median,
      c.avg_rate_per_mile_cents::numeric(12,2) AS operator_rate_median,
      0::numeric(12,2) AS urgent_fill_premium,
      c.highway,
      c.oversize_frequency,
      c.primary_commodities,
      c.escort_demand_level,
      c.load_count_30d,
      c.operator_count,
      c.risk_tier,
      c.origin_zone,
      c.destination_zone,
      c.supply_score,
      c.demand_score,
      c.risk_summary,
      c.metadata
    FROM public.hc_corridors c
    WHERE c.active = true;
  `);

  // Grant access
  await client.query(`GRANT SELECT ON public.hc_corridor_public_v1 TO anon;`);
  await client.query(`GRANT SELECT ON public.hc_corridor_public_v1 TO authenticated;`);

  // Verify
  const result = await client.query(`SELECT count(*), max(composite_score) as max_score FROM public.hc_corridor_public_v1`);
  console.log('View updated with composite_score column');
  console.log('Rows:', result.rows[0].count, '| Max composite_score:', result.rows[0].max_score);

  // Sample
  const sample = await client.query(`SELECT name, composite_score, corridor_score FROM public.hc_corridor_public_v1 ORDER BY composite_score DESC LIMIT 3`);
  sample.rows.forEach(r => console.log(`  ${r.name}: composite=${r.composite_score}, corridor=${r.corridor_score}`));

  await client.end();
  console.log('\n✅ Done! composite_score column now exists in the view.');
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
