const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // Check hc_entities schema
  const { rows } = await c.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_entities' ORDER BY ordinal_position"
  );
  console.log("=== hc_entities columns ===");
  rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  // Now bootstrap using correct columns
  const colNames = rows.map(r => r.column_name);
  console.log("\nAvailable columns:", colNames.join(", "));

  // Insert from hc_identities using the correct column mapping
  const entityNameCol = colNames.includes("entity_name") ? "entity_name" : colNames.includes("display_name") ? "display_name" : null;
  console.log("Entity name column to use:", entityNameCol || "need to create alias mapping");

  // Direct insert 
  try {
    const result = await c.query(`
      INSERT INTO public.hc_entities (entity_type, country_code)
      SELECT 
        COALESCE(i.role, 'operator'),
        'US'
      FROM public.hc_identities i
      LIMIT 1
    `);
    console.log("Test insert result:", result.rowCount);
    // Delete test row
    await c.query("DELETE FROM public.hc_entities WHERE entity_type IS NOT NULL LIMIT 1");
  } catch (e) {
    console.log("Test insert error:", e.message);
  }

  await c.end();
})();
