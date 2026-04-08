const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const targets = [
    "hc_ai_scores","hc_page_surfaces","hc_internal_links",
    "hc_proof_items","hc_claim_sessions","hc_intent_queries",
    "hc_query_gaps","hc_agent_jobs","hc_surge_page",
    "hc_market_surge_window","gsd_diff_analysis_runs",
    "hc_urgent_market_signal","hc_gbp_readiness_audit"
  ];
  const placeholders = targets.map((_, i) => "$" + (i + 1)).join(",");
  const r = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN (" + placeholders + ") ORDER BY tablename",
    targets
  );
  console.log("Found:", r.rows.length, "of", targets.length);
  r.rows.forEach(x => console.log("  ✓", x.tablename));
  const found = new Set(r.rows.map(x => x.tablename));
  const missing = targets.filter(t => !found.has(t));
  if (missing.length > 0) {
    console.log("\nMissing:");
    missing.forEach(m => console.log("  ✗", m));
  }
  await c.end();
})();
