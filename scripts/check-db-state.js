const { Client } = require("pg");

(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // List all hc_ tables
  const r = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'hc_%' ORDER BY tablename"
  );
  console.log("=== EXISTING HC TABLES ===");
  r.rows.forEach((x) => console.log("  " + x.tablename));
  console.log("Total:", r.rows.length);

  // Check if hc_attributes exists specifically
  const attr = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='hc_attributes'"
  );
  console.log("\nhc_attributes exists:", attr.rows.length > 0);

  // Check _hc_migrations
  try {
    const m = await c.query("SELECT filename FROM public._hc_migrations ORDER BY id");
    console.log("\n=== APPLIED MIGRATIONS ===");
    m.rows.forEach((x) => console.log("  " + x.filename));
  } catch (e) {
    console.log("No migration tracking table yet.");
  }

  await c.end();
})();
