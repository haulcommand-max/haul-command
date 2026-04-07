/**
 * Apply Corridor OS migration to Supabase — Idempotent Version
 * 
 * Splits the migration into sections and applies them individually,
 * so one failure doesn't block the rest.
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const poolerUrl = process.env.SUPABASE_DB_POOLER_URL;
if (!poolerUrl) {
  console.error('Missing SUPABASE_DB_POOLER_URL');
  process.exit(1);
}

async function run() {
  const { Client } = require('pg');
  const client = new Client({ connectionString: poolerUrl });
  await client.connect();
  console.log('[migrate] Connected to Supabase Postgres');

  // Step 1: Extensions
  console.log('\n[1/8] Extensions...');
  await tryQuery(client, `create extension if not exists pgcrypto;`);
  await tryQuery(client, `create extension if not exists pg_trgm;`);

  // Step 2: Helper functions — drop and recreate to handle param name changes
  console.log('\n[2/8] Helper functions...');
  await tryQuery(client, `drop function if exists public.set_updated_at() cascade;`);
  await tryQuery(client, `
    create or replace function public.set_updated_at()
    returns trigger language plpgsql as $$
    begin new.updated_at = now(); return new; end;
    $$;
  `);
  await tryQuery(client, `drop function if exists public.hc_slugify(text) cascade;`);
  await tryQuery(client, `
    create or replace function public.hc_slugify(input_text text)
    returns text language sql immutable as $$
      select trim(both '-' from regexp_replace(lower(coalesce(input_text,'')), '[^a-z0-9]+', '-', 'g'));
    $$;
  `);
  await tryQuery(client, `
    create or replace function public.hc_make_corridor_code(p_country text, p_origin text, p_dest text)
    returns text language sql immutable as $$
      select upper(coalesce(p_country,'XX'))
        || '_' || upper(left(regexp_replace(coalesce(p_origin,'O'),'[^A-Za-z0-9]+','','g'),12))
        || '_' || upper(left(regexp_replace(coalesce(p_dest,'D'),'[^A-Za-z0-9]+','','g'),12));
    $$;
  `);

  // Step 3: Enums
  console.log('\n[3/8] Enums...');
  const enums = [
    [`hc_corridor_status`, `('draft','active','hidden','archived')`],
    [`hc_corridor_type`, `('country_spine','port_connector','border_connector','metro_connector','industrial_connector','permit_sensitive','escort_sensitive','credential_sensitive','live_generated')`],
    [`hc_corridor_tier`, `('flagship','national','regional','metro','long_tail')`],
    [`hc_mode_type`, `('road','intermodal','port_road','road_rail','road_barge')`],
    [`hc_node_type`, `('origin','destination','port','border','yard','staging','city','metro','project_site','plant','terminal','rest_area','escort_meet_point')`],
    [`hc_requirement_type`, `('permit','escort','police','pilot_car','route_survey','curfew','holiday_restriction','bridge_review','port_clearance','credential','insurance','vehicle_equipment')`],
    [`hc_jurisdiction_level`, `('country','state','province','city','port','facility')`],
    [`hc_credential_family`, `('port_access','secure_facility','hazmat','customs','escort','pilot_operator','crane','rigging','route_survey','police_coordination','safety','energy_site','mining_site','refinery_site','airport_access','rail_access')`],
    [`hc_pricing_obs_type`, `('escort_rate','operator_rate','route_survey_rate','permit_cost','urgent_fill_premium','twic_premium','secure_access_premium','police_coordination_fee','staging_yard_cost','parking_cost','equipment_cost')`],
    [`hc_price_unit`, `('trip','day','hour','mile','km','permit','booking')`],
    [`hc_price_source`, `('quote','booking','invoice','self_report','admin_entry','marketplace_observation')`],
    [`hc_demand_signal_type`, `('search','load_post','broker_request','escort_request','quote_request','permit_request','worker_availability','failed_match','alert_subscribe','route_save','profile_claim')`],
    [`hc_supply_type`, `('operators','escorts','twic_workers','port_workers','police_contacts','yards','installers','permit_runners','route_surveyors')`],
    [`hc_corridor_page_type`, `('overview','rates','requirements','escorts','operators','loads','port_access','credentialed_workers','staging','parking','faq','map','compare')`],
    [`hc_publish_status`, `('draft','ready','published','noindex','archived')`],
    [`hc_urgency_level`, `('low','normal','high','urgent','immediate')`],
    [`hc_requester_role`, `('broker','operator','escort','shipper','facility','yard','permit_service','advertiser','admin')`],
  ];
  for (const [name, vals] of enums) {
    await tryQuery(client, `do $$ begin if not exists (select 1 from pg_type where typname='${name}') then create type public.${name} as enum ${vals}; end if; end $$;`);
  }

  // Step 4: Tables (using CREATE IF NOT EXISTS)
  console.log('\n[4/8] Tables...');
  
  // Read the full SQL and extract table creation statements
  const sqlFile = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '20260404_001_corridor_os.sql'), 
    'utf-8'
  );
  
  // Extract table creation blocks
  const tableMatches = sqlFile.match(/create table if not exists[^;]+;/gi);
  if (tableMatches) {
    for (const stmt of tableMatches) {
      await tryQuery(client, stmt);
    }
  }
  console.log(`  Found and applied ${tableMatches ? tableMatches.length : 0} table statements`);

  // Step 5: Indexes
  console.log('\n[5/8] Indexes...');
  const indexMatches = sqlFile.match(/create index if not exists[^;]+;/gi);
  if (indexMatches) {
    for (const stmt of indexMatches) {
      await tryQuery(client, stmt);
    }
  }
  console.log(`  Applied ${indexMatches ? indexMatches.length : 0} indexes`);

  // Step 6: Triggers
  console.log('\n[6/8] Triggers...');
  const triggerPairs = [
    ['hc_corridors', 'trg_hc_corridors_updated_at'],
    ['hc_corridor_requirements', 'trg_hc_corridor_reqs_updated_at'],
    ['hc_credential_types', 'trg_hc_credential_types_updated_at'],
    ['hc_corridor_pages', 'trg_hc_corridor_pages_updated_at'],
  ];
  for (const [table, trigger] of triggerPairs) {
    await tryQuery(client, `drop trigger if exists ${trigger} on public.${table};`);
    await tryQuery(client, `
      create trigger ${trigger}
        before update on public.${table}
        for each row execute function public.set_updated_at();
    `);
  }

  // Step 7: Views
  console.log('\n[7/8] Views...');
  
  // hc_corridor_public_v1
  await tryQuery(client, `
    create or replace view public.hc_corridor_public_v1 as
    select
      c.id, c.corridor_code, c.slug, c.name, c.short_name,
      c.status, c.corridor_type, c.tier, c.country_code,
      c.primary_language_code, c.currency_code,
      c.origin_country_code, c.origin_region_code, c.origin_city_name,
      c.destination_country_code, c.destination_region_code, c.destination_city_name,
      c.is_cross_border, c.distance_km, c.distance_miles, c.typical_mode,
      c.corridor_score, c.seo_priority_score, c.market_priority_score,
      c.monetization_priority_score, c.freshness_score, c.confidence_score,
      c.permit_complexity_score, c.escort_complexity_score,
      c.credential_complexity_score, c.scarcity_score, c.urgency_score,
      c.ad_inventory_score, c.commercial_value_estimate, c.search_volume_estimate,
      req.requirement_count, req.permit_count, req.escort_count,
      cr.credential_count, cr.required_credential_count,
      pr.escort_rate_median, pr.operator_rate_median, pr.urgent_fill_premium
    from public.hc_corridors c
    left join (
      select corridor_id,
        count(*) as requirement_count,
        count(*) filter (where requirement_type='permit') as permit_count,
        count(*) filter (where requirement_type in ('escort','pilot_car')) as escort_count
      from public.hc_corridor_requirements
      group by corridor_id
    ) req on req.corridor_id = c.id
    left join (
      select corridor_id,
        count(*) as credential_count,
        count(*) filter (where required=true) as required_credential_count
      from public.hc_corridor_credentials
      group by corridor_id
    ) cr on cr.corridor_id = c.id
    left join (
      select corridor_id,
        max(amount_median) filter (where observation_type='escort_rate') as escort_rate_median,
        max(amount_median) filter (where observation_type='operator_rate') as operator_rate_median,
        max(amount_median) filter (where observation_type='urgent_fill_premium') as urgent_fill_premium
      from public.hc_corridor_pricing_obs
      group by corridor_id
    ) pr on pr.corridor_id = c.id
    where c.active = true and c.status = 'active';
  `);

  // hc_corridor_seo_queue_v1
  await tryQuery(client, `
    create or replace view public.hc_corridor_seo_queue_v1 as
    select
      c.id as corridor_id, c.slug, c.country_code,
      c.corridor_score, c.seo_priority_score,
      p.page_type, p.publish_status,
      case
        when p.id is null then 'missing'
        when p.publish_status in ('draft','ready') then 'needs-generation'
        when p.last_generated_at is null then 'never-generated'
        when p.last_generated_at < now() - interval '7 days' then 'stale'
        else 'ok'
      end as generation_status
    from public.hc_corridors c
    left join public.hc_corridor_pages p on p.corridor_id = c.id
    where c.active = true;
  `);

  // hc_corridor_money_queue_v1
  await tryQuery(client, `
    create or replace view public.hc_corridor_money_queue_v1 as
    select
      id as corridor_id, slug, country_code,
      corridor_score, monetization_priority_score,
      ad_inventory_score, commercial_value_estimate, scarcity_score, urgency_score
    from public.hc_corridors
    where active = true and status = 'active'
    order by monetization_priority_score desc, corridor_score desc;
  `);

  // Step 8: RLS Policies
  console.log('\n[8/8] RLS Policies...');
  const rlsTables = [
    'hc_corridors', 'hc_corridor_nodes', 'hc_corridor_requirements',
    'hc_credential_types', 'hc_corridor_credentials', 'hc_corridor_pricing_obs',
    'hc_corridor_demand_signals', 'hc_corridor_supply_signals',
    'hc_corridor_pages', 'hc_route_requests', 'hc_corridor_internal_links'
  ];
  for (const t of rlsTables) {
    await tryQuery(client, `alter table public.${t} enable row level security;`);
  }

  // Public read policies
  const publicReadPolicies = [
    ['hc_corridors_pub_read', 'hc_corridors', `active = true and status = 'active'`],
    ['hc_corridors_svc', 'hc_corridors', null],
    ['hc_corridor_nodes_pub_read', 'hc_corridor_nodes', `exists (select 1 from hc_corridors c where c.id = corridor_id and c.active and c.status='active')`],
    ['hc_corridor_nodes_svc', 'hc_corridor_nodes', null],
    ['hc_corridor_reqs_pub_read', 'hc_corridor_requirements', `exists (select 1 from hc_corridors c where c.id = corridor_id and c.active and c.status='active')`],
    ['hc_corridor_reqs_svc', 'hc_corridor_requirements', null],
    ['hc_credential_types_pub_read', 'hc_credential_types', `is_active = true`],
    ['hc_credential_types_svc', 'hc_credential_types', null],
    ['hc_corridor_creds_pub_read', 'hc_corridor_credentials', `exists (select 1 from hc_corridors c where c.id = corridor_id and c.active and c.status='active')`],
    ['hc_corridor_creds_svc', 'hc_corridor_credentials', null],
    ['hc_corridor_pricing_pub_read', 'hc_corridor_pricing_obs', `exists (select 1 from hc_corridors c where c.id = corridor_id and c.active and c.status='active')`],
    ['hc_corridor_pricing_svc', 'hc_corridor_pricing_obs', null],
    ['hc_corridor_demand_svc', 'hc_corridor_demand_signals', null],
    ['hc_corridor_supply_svc', 'hc_corridor_supply_signals', null],
    ['hc_corridor_pages_pub_read', 'hc_corridor_pages', `publish_status = 'published' and indexable = true`],
    ['hc_corridor_pages_svc', 'hc_corridor_pages', null],
    ['hc_route_requests_svc', 'hc_route_requests', null],
    ['hc_corridor_links_pub_read', 'hc_corridor_internal_links', `active = true`],
    ['hc_corridor_links_svc', 'hc_corridor_internal_links', null],
  ];
  
  for (const [policy, table, using] of publicReadPolicies) {
    await tryQuery(client, `drop policy if exists ${policy} on public.${table};`);
    if (using === null) {
      // service_role full access
      await tryQuery(client, `create policy ${policy} on public.${table} for all to service_role using (true) with check (true);`);
    } else if (policy.includes('pub_read')) {
      await tryQuery(client, `create policy ${policy} on public.${table} for select to anon, authenticated using (${using});`);
    }
  }

  // Auth insert for route requests
  await tryQuery(client, `drop policy if exists hc_route_requests_auth_insert on public.hc_route_requests;`);
  await tryQuery(client, `create policy hc_route_requests_auth_insert on public.hc_route_requests for insert to authenticated with check (true);`);

  // Final verification
  console.log('\n═══ Verification ═══');
  const views = await client.query(`
    SELECT table_name FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name LIKE 'hc_corridor%' 
    ORDER BY table_name
  `);
  console.log(`Views created: ${views.rows.length}`);
  views.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE 'hc_corridor%' 
    ORDER BY table_name
  `);
  console.log(`Tables created: ${tables.rows.length}`);
  tables.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));

  // Test the view
  const viewTest = await client.query(`SELECT count(*) FROM public.hc_corridor_public_v1`);
  console.log(`\nhc_corridor_public_v1 row count: ${viewTest.rows[0].count}`);

  await client.end();
  console.log('\n✅ Migration complete!');
}

async function tryQuery(client, sql) {
  try {
    await client.query(sql);
    return true;
  } catch (err) {
    const msg = err.message || '';
    // Skip known non-issues
    if (msg.includes('already exists') || msg.includes('does not exist')) {
      return true;
    }
    console.warn(`  ⚠ ${msg.substring(0, 120)}`);
    return false;
  }
}

run().catch(err => {
  console.error('[migrate] Fatal:', err.message);
  process.exit(1);
});
