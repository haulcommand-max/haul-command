const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // 1. Check push_tokens table
  console.log("=== push_tokens ===");
  const { rows: ptCols } = await c.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='push_tokens' ORDER BY ordinal_position"
  );
  if (ptCols.length === 0) console.log("  TABLE NOT FOUND");
  else ptCols.forEach(r => console.log("  " + r.column_name + ": " + r.data_type));

  // 2. Check hc_regulation_rules
  console.log("\n=== hc_regulation_rules ===");
  const { rows: rrCols } = await c.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_regulation_rules' ORDER BY ordinal_position"
  );
  if (rrCols.length === 0) console.log("  TABLE NOT FOUND");
  else rrCols.forEach(r => console.log("  " + r.column_name + ": " + r.data_type));

  // 3. Check hc_corridors
  console.log("\n=== hc_corridors ===");
  const { rows: ccCols } = await c.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_corridors' ORDER BY ordinal_position"
  );
  if (ccCols.length === 0) console.log("  TABLE NOT FOUND");
  else ccCols.forEach(r => console.log("  " + r.column_name + ": " + r.data_type));

  // 4. Get existing corridor data
  console.log("\n=== Existing corridors ===");
  const { rows: corridors } = await c.query("SELECT * FROM public.hc_corridors LIMIT 5");
  if (corridors.length > 0) {
    console.log("  Columns: " + Object.keys(corridors[0]).join(", "));
    corridors.forEach(r => console.log("  " + (r.corridor_name || r.name || r.display_name || JSON.stringify(r).substring(0, 120))));
  }

  // 5. Check related regulation tables
  console.log("\n=== All regulation/permit tables ===");
  const { rows: regTables } = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND (tablename LIKE '%regulation%' OR tablename LIKE '%permit%' OR tablename LIKE '%escort_req%' OR tablename LIKE '%requirement%') ORDER BY tablename"
  );
  regTables.forEach(r => console.log("  " + r.tablename));

  // 6. Check row counts for those tables
  for (const tbl of regTables) {
    try {
      const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM public.\"" + tbl.tablename + "\"");
      console.log("    → " + tbl.tablename + ": " + cnt + " rows");
    } catch {}
  }

  // 7. Check hc_push_tokens vs push_tokens
  console.log("\n=== hc_push_tokens ===");
  const { rows: hptCols } = await c.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_push_tokens' ORDER BY ordinal_position"
  );
  if (hptCols.length === 0) console.log("  TABLE NOT FOUND");
  else hptCols.forEach(r => console.log("  " + r.column_name + ": " + r.data_type));

  await c.end();
})();
