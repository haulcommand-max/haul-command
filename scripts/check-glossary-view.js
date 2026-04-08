const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // 1. Check glossary_public view definition
  console.log("=== glossary_public view ===");
  const { rows: viewDef } = await c.query(
    "SELECT pg_get_viewdef('public.glossary_public'::regclass) as def"
  );
  console.log(viewDef[0]?.def || "VIEW NOT FOUND");

  // 2. Check row count
  try {
    const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM public.glossary_public");
    console.log("\nRow count: " + cnt);
  } catch (e) {
    console.log("\nError: " + e.message);
  }

  // 3. Check sample rows
  try {
    const { rows: sample } = await c.query("SELECT slug, term FROM public.glossary_public LIMIT 10");
    console.log("\nSample terms:");
    sample.forEach(r => console.log("  " + r.slug + " → " + r.term));
  } catch (e) {
    console.log("\n  Sample error: " + e.message);
  }

  // 4. Check base glossary tables
  const glossaryTables = ["glossary_terms", "glossary_public", "hc_glossary_terms"];
  for (const tbl of glossaryTables) {
    try {
      const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM public.\"" + tbl + "\"");
      console.log("\n" + tbl + ": " + cnt + " rows");
    } catch {
      console.log("\n" + tbl + ": NOT ACCESSIBLE");
    }
  }

  // 5. Check if glossary_public is view or table
  const { rows: viewCheck } = await c.query(
    "SELECT table_type FROM information_schema.tables WHERE table_schema='public' AND table_name='glossary_public'"
  );
  console.log("\nglossary_public type: " + (viewCheck[0]?.table_type || "NOT FOUND"));

  // Check its source if there's a glossary_terms table
  const { rows: gtCheck } = await c.query(
    "SELECT table_type FROM information_schema.tables WHERE table_schema='public' AND table_name='glossary_terms'"
  );
  console.log("glossary_terms type: " + (gtCheck[0]?.table_type || "NOT FOUND"));

  await c.end();
})();
