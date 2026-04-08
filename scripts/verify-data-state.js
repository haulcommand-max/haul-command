const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("══════════════════════════════════════════════════");
  console.log("  HAUL COMMAND — POST-SPRINT DATA STATE");
  console.log("══════════════════════════════════════════════════\n");

  const tables = [
    // Crown jewel data
    ["hc_surfaces", "SEO surface engine"],
    ["hc_internal_links", "Internal linking graph"],
    ["hc_entities", "Entity graph (bootstrapped from identities)"],
    ["hc_identities", "Identity registry (source)"],
    ["hc_geo_overlays", "Country localization overlays"],
    ["hc_glossary_terms", "Industry glossary"],
    ["hc_tools", "Tools registry"],
    ["hc_corridors", "Corridor intelligence"],
    ["hc_regulation_rules", "Unified regulation rules"],
    // Legacy regulation tables (data lives here)
    ["hc_escort_requirements", "Escort threshold rules"],
    ["hc_regulation_sources", "Official source URLs"],
    ["hc_permit_cost_rules", "Permit pricing rules"],
    ["hc_jurisdiction_regulations", "Jurisdiction rules"],
    ["state_regulations", "State-by-state rules"],
    ["country_regulations", "Country-level rules"],
    ["hc_certification_requirements", "Certification rules"],
    ["hc_signage_requirements", "Signage rules"],
    ["hc_regulation_alerts", "Active alerts"],
    // Infrastructure
    ["port_infrastructure", "Port data"],
    ["terminal_registry", "Terminal data"],
    ["hc_training_modules", "Training content"],
    ["hc_loads", "Load board"],
    ["escort_profiles", "Operator profiles"],
    // Empty but important
    ["hc_reviews", "Reviews"],
    ["hc_operator_availability", "Availability broadcasts"],
    ["hc_claims", "Claims"],
    ["hc_trust_profiles", "Trust scores"],
    ["hc_leaderboard", "Leaderboard"],
    ["hc_ai_scores", "AI readiness scores"],
    ["hc_agent_jobs", "Agent job queue"],
    ["hc_page_surfaces", "Discovery Graph pages"],
    ["hc_surge_page", "Surge SEO pages"],
    ["push_tokens", "Push notification tokens"],
    ["hc_blog_posts", "Blog posts"],
    ["hc_monetization_products", "Monetization products"],
    ["ad_campaigns", "Ad campaigns"],
  ];

  let liveCount = 0, emptyCount = 0, missingCount = 0;
  
  for (const [tbl, desc] of tables) {
    try {
      const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM public.\"" + tbl + "\"");
      const n = Number(cnt);
      const status = n > 0 ? "🟢" : "⚪";
      if (n > 0) liveCount++; else emptyCount++;
      const formatted = n.toLocaleString().padStart(10);
      console.log("  " + status + formatted + "  " + tbl.padEnd(35) + desc);
    } catch {
      missingCount++;
      console.log("  ❌" + "N/A".padStart(10) + "  " + tbl.padEnd(35) + desc + " [MISSING]");
    }
  }

  console.log("\n══════════════════════════════════════════════════");
  console.log("  SUMMARY: " + liveCount + " tables with data, " + emptyCount + " empty, " + missingCount + " missing");
  console.log("══════════════════════════════════════════════════");

  // Auth users
  try {
    const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM auth.users");
    console.log("\n  Auth users: " + cnt);
  } catch {}

  // Total schema size
  const { rows: [totals] } = await c.query(`
    SELECT 
      (SELECT COUNT(*) FROM pg_tables WHERE schemaname='public') as tables,
      (SELECT COUNT(*) FROM information_schema.views WHERE table_schema='public') as views,
      (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.prokind='f') as functions
  `);
  console.log("  Schema: " + totals.tables + " tables, " + totals.views + " views, " + totals.functions + " functions");

  await c.end();
})();
