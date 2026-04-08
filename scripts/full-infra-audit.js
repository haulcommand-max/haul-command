/**
 * Full Infrastructure Audit
 * Inspects Supabase production state: tables, views, functions, RLS,
 * RPC endpoints, realtime channels, storage buckets, and edge functions.
 */
const { Client } = require("pg");

const POOLER_URL =
  "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const c = new Client({
    connectionString: POOLER_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("══════════════════════════════════════════════════");
  console.log("  HAUL COMMAND FULL INFRASTRUCTURE AUDIT");
  console.log("══════════════════════════════════════════════════\n");

  // 1. Table count by prefix
  const { rows: tablePrefixes } = await c.query(`
    SELECT 
      CASE 
        WHEN tablename LIKE 'hc_%' THEN split_part(tablename, '_', 2)
        ELSE '__other__'
      END as prefix,
      COUNT(*) as cnt
    FROM pg_tables 
    WHERE schemaname = 'public'
    GROUP BY prefix
    ORDER BY cnt DESC
    LIMIT 30
  `);
  console.log("=== TABLE DISTRIBUTION (top 30 prefixes) ===");
  tablePrefixes.forEach(r => console.log(`  hc_${r.prefix}*: ${r.cnt} tables`));

  // 2. Total tables, views, functions
  const { rows: [totals] } = await c.query(`
    SELECT 
      (SELECT COUNT(*) FROM pg_tables WHERE schemaname='public') as tables,
      (SELECT COUNT(*) FROM information_schema.views WHERE table_schema='public') as views,
      (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.prokind='f') as functions,
      (SELECT COUNT(*) FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON t.typnamespace=n.oid WHERE n.nspname='public') as enum_values
  `);
  console.log(`\n=== TOTALS ===`);
  console.log(`  Tables: ${totals.tables}`);
  console.log(`  Views: ${totals.views}`);
  console.log(`  Functions: ${totals.functions}`);
  console.log(`  Enum values: ${totals.enum_values}`);

  // 3. RLS status
  const { rows: rlsStatus } = await c.query(`
    SELECT 
      COUNT(*) FILTER (WHERE rowsecurity) as rls_enabled,
      COUNT(*) FILTER (WHERE NOT rowsecurity) as rls_disabled,
      COUNT(*) as total
    FROM pg_tables t
    JOIN pg_class c ON t.tablename = c.relname
    WHERE t.schemaname = 'public'
  `);
  console.log(`\n=== RLS STATUS ===`);
  console.log(`  RLS enabled: ${rlsStatus[0]?.rls_enabled}`);
  console.log(`  RLS disabled: ${rlsStatus[0]?.rls_disabled}`);

  // 4. Tables with actual data (row counts for key tables)
  const keyTables = [
    'escort_profiles', 'hc_loads', 'hc_reviews', 'hc_entities',
    'hc_identities', 'hc_jobs', 'hc_lanes', 'hc_corridors',
    'hc_notifications', 'hc_push_tokens', 'hc_signals',
    'hc_operator_availability', 'hc_claims', 'hc_surfaces',
    'hc_entity_profiles', 'hc_attributes', 'hc_ai_scores',
    'hc_agent_jobs', 'hc_surge_page', 'hc_market_surge_window',
    'port_infrastructure', 'terminal_registry',
    'hc_glossary_terms', 'hc_training_modules', 'hc_tools',
    'hc_blog_posts', 'hc_ad_campaigns', 'ad_campaigns',
    'hc_monetization_products', 'hc_geo_overlays',
    'hc_leaderboard', 'hc_trust_profiles',
    'hc_regulation_rules', 'hc_permit_rules',
    'hc_internal_links', 'hc_page_surfaces',
    'gsd_diff_analysis_runs', 'hc_gbp_readiness_audit'
  ];
  
  console.log(`\n=== KEY TABLE ROW COUNTS ===`);
  for (const tbl of keyTables) {
    try {
      const { rows: [{ cnt }] } = await c.query(`SELECT COUNT(*) as cnt FROM public."${tbl}"`);
      const status = Number(cnt) > 0 ? '🟢' : '⚪';
      console.log(`  ${status} ${tbl}: ${cnt} rows`);
    } catch {
      console.log(`  ❌ ${tbl}: TABLE NOT FOUND`);
    }
  }

  // 5. Schemas
  const { rows: schemas } = await c.query(`
    SELECT schema_name FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ORDER BY schema_name
  `);
  console.log(`\n=== SCHEMAS ===`);
  schemas.forEach(s => console.log(`  ${s.schema_name}`));

  // 6. Storage buckets
  const { rows: buckets } = await c.query(`
    SELECT id, name, public, created_at FROM storage.buckets ORDER BY name
  `);
  console.log(`\n=== STORAGE BUCKETS ===`);
  if (buckets.length === 0) console.log("  (none)");
  buckets.forEach(b => console.log(`  ${b.public ? '🌐' : '🔒'} ${b.name} (created: ${b.created_at})`));

  // 7. Check for key RPC functions
  const rpcFunctions = [
    'upsert_role_state', 'get_nearby_operators', 'resolve_next_moves',
    'track_behavior', 'compute_trust_score', 'match_load_to_operators',
    'claim_entity', 'hc_set_updated_at', 'broadcast_availability',
    'search_directory', 'get_operator_score', 'refresh_leaderboard'
  ];
  console.log(`\n=== KEY RPC FUNCTIONS ===`);
  for (const fn of rpcFunctions) {
    const { rows } = await c.query(
      "SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname=$1",
      [fn]
    );
    const status = rows.length > 0 ? '🟢' : '⚪';
    console.log(`  ${status} ${fn}: ${rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
  }

  // 8. Active triggers
  const { rows: triggerCount } = await c.query(`
    SELECT COUNT(*) as cnt FROM pg_trigger 
    WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace)
    AND NOT tgisinternal
  `);
  console.log(`\n=== TRIGGERS ===`);
  console.log(`  Active triggers: ${triggerCount[0]?.cnt}`);

  // 9. Check auth.users count
  try {
    const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM auth.users");
    console.log(`\n=== AUTH ===`);
    console.log(`  Registered users: ${cnt}`);
  } catch {
    console.log(`\n=== AUTH ===`);
    console.log(`  Could not query auth.users`);
  }

  // 10. Recently modified tables (by updated_at if exists)
  console.log(`\n=== RECENT DATA ACTIVITY (tables with recent updated_at) ===`);
  const tablesWithUpdatedAt = [
    'escort_profiles', 'hc_operator_availability', 'hc_reviews',
    'hc_trust_profiles', 'hc_identities', 'hc_push_tokens'
  ];
  for (const tbl of tablesWithUpdatedAt) {
    try {
      const { rows } = await c.query(`SELECT MAX(updated_at) as latest FROM public."${tbl}"`);
      if (rows[0]?.latest) {
        console.log(`  ${tbl}: last update ${rows[0].latest}`);
      }
    } catch { /* skip */ }
  }

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
