const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // Check if pilot-car exists
  const { rows } = await c.query("SELECT slug, term FROM glossary_terms WHERE slug LIKE '%pilot%'");
  console.log("Pilot-related terms:");
  rows.forEach(r => console.log("  " + r.slug + " → " + r.term));

  // Check if there are terms NOT in glossary_public (unpublished or noindex)
  const { rows: [{total}] } = await c.query("SELECT COUNT(*) as total FROM glossary_terms");
  const { rows: [{pub}] } = await c.query("SELECT COUNT(*) as pub FROM glossary_public");
  console.log("\nTotal terms: " + total + ", Published: " + pub + ", Hidden: " + (total - pub));

  // Check specific slugs from our hc_glossary_terms
  const slugsToCheck = ['pilot-car', 'escort-vehicle', 'oversize-load', 'superload', 'height-pole', 'heavy-haul', 'twic-card', 'deadhead-miles'];
  console.log("\nSlug availability in glossary_terms:");
  for (const slug of slugsToCheck) {
    const { rows } = await c.query("SELECT slug, term, published, noindex FROM glossary_terms WHERE slug = $1", [slug]);
    if (rows.length > 0) {
      console.log("  ✅ " + slug + " → " + rows[0].term + " (published: " + rows[0].published + ", noindex: " + rows[0].noindex + ")");
    } else {
      console.log("  ❌ " + slug + " → NOT IN glossary_terms");
    }
  }

  await c.end();
})();
