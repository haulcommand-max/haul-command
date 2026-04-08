const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  console.log("Connected.\n");

  // Bootstrap hc_entities from hc_identities
  // hc_entities requires: id (uuid auto), hc_id (text NOT NULL), entity_type, canonical_name, display_name, slug, status, ...
  // hc_identities has: identity_id, user_id, display_name, role, home_base_city, home_base_region, ...

  const result = await c.query(`
    INSERT INTO public.hc_entities (
      hc_id, entity_type, canonical_name, display_name, slug,
      status, claim_status, source_type, source_confidence,
      country_code, region_code, city_name
    )
    SELECT
      'hci-' || i.identity_id::text,
      COALESCE(NULLIF(i.role, ''), 'operator'),
      i.display_name,
      i.display_name,
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(
        COALESCE(i.display_name, 'unknown-' || i.identity_id::text), 
        ' ', '-'), '''', ''), '.', ''), ',', ''
      )) || '-' || LEFT(i.identity_id::text, 8),
      CASE WHEN i.published THEN 'active' ELSE 'draft' END,
      'unclaimed',
      'identity_import',
      0.6,
      'US',
      i.home_base_region,
      i.home_base_city
    FROM public.hc_identities i
    WHERE i.display_name IS NOT NULL
      AND i.display_name != ''
      AND NOT EXISTS (
        SELECT 1 FROM public.hc_entities e 
        WHERE e.hc_id = 'hci-' || i.identity_id::text
      )
  `);

  console.log("✅ Bootstrapped " + result.rowCount + " entities from hc_identities");

  // Verify
  const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM public.hc_entities");
  console.log("   Total entities now: " + cnt);

  // Check distribution by type
  const { rows: types } = await c.query(
    "SELECT entity_type, COUNT(*) as cnt FROM public.hc_entities GROUP BY entity_type ORDER BY cnt DESC LIMIT 10"
  );
  console.log("\n   Entity type distribution:");
  types.forEach(t => console.log("     " + t.entity_type + ": " + t.cnt));

  // Check distribution by region
  const { rows: regions } = await c.query(
    "SELECT region_code, COUNT(*) as cnt FROM public.hc_entities WHERE region_code IS NOT NULL GROUP BY region_code ORDER BY cnt DESC LIMIT 10"
  );
  console.log("\n   Top regions:");
  regions.forEach(r => console.log("     " + r.region_code + ": " + r.cnt));

  await c.end();
})();
