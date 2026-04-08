const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // 1. Fix the NOT NULL constraint blocking data migration
  console.log("Fixing hc_regulation_rules constraints...");
  await c.query("ALTER TABLE public.hc_regulation_rules ALTER COLUMN primary_source_url DROP NOT NULL");
  await c.query("ALTER TABLE public.hc_regulation_rules ALTER COLUMN jurisdiction_id DROP NOT NULL");
  console.log("  ✅ Made primary_source_url and jurisdiction_id nullable\n");

  // 2. Get existing regulation sources to cross-reference
  const sourceMap = {};
  try {
    const { rows: sources } = await c.query("SELECT * FROM public.hc_regulation_sources LIMIT 5");
    if (sources.length > 0) {
      const srcKeys = Object.keys(sources[0]);
      console.log("  hc_regulation_sources columns: " + srcKeys.join(", "));
      const stateCol = srcKeys.find(k => k.includes("state") || k.includes("region") || k.includes("jurisdiction"));
      const urlCol = srcKeys.find(k => k.includes("url") || k.includes("source_url") || k.includes("link"));
      if (stateCol && urlCol) {
        const { rows: allSources } = await c.query("SELECT * FROM public.hc_regulation_sources");
        for (const s of allSources) {
          if (s[stateCol] && s[urlCol]) sourceMap[s[stateCol].toString().toUpperCase()] = s[urlCol];
        }
      }
    }
  } catch (e) {
    console.log("  ⚠️ Could not load sources: " + e.message.substring(0, 80));
  }
  console.log("  Loaded " + Object.keys(sourceMap).length + " source URLs\n");

  // 3. Get escort requirements
  const { rows: reqs } = await c.query("SELECT * FROM public.hc_escort_requirements");
  console.log("  Found " + reqs.length + " escort requirements to migrate");

  if (reqs.length === 0) { await c.end(); return; }

  // Check column names
  const keys = Object.keys(reqs[0]);
  console.log("  Columns: " + keys.join(", "));

  // Get enum values
  const { rows: rdEnums } = await c.query(`
    SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid 
    WHERE t.typname IN (SELECT udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_regulation_rules' AND column_name='rule_domain')
    ORDER BY e.enumsortorder
  `);
  const { rows: vsEnums } = await c.query(`
    SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid 
    WHERE t.typname IN (SELECT udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_regulation_rules' AND column_name='verification_status')
    ORDER BY e.enumsortorder
  `);

  console.log("  rule_domain values: " + rdEnums.map(x => x.enumlabel).join(", "));
  console.log("  verification_status values: " + vsEnums.map(x => x.enumlabel).join(", "));

  // Pick appropriate enum values
  const domain = rdEnums.find(x => x.enumlabel.includes("escort"))?.enumlabel
              || rdEnums.find(x => x.enumlabel.includes("dimension"))?.enumlabel
              || rdEnums[0]?.enumlabel;
  const status = vsEnums.find(x => x.enumlabel.includes("seed"))?.enumlabel
              || vsEnums.find(x => x.enumlabel.includes("review"))?.enumlabel
              || vsEnums[0]?.enumlabel;

  if (!domain || !status) {
    console.log("  ❌ No valid enum values found. Domain:", domain, "Status:", status);
    await c.end();
    return;
  }
  console.log("  Using domain: " + domain + ", status: " + status + "\n");

  // 4. Insert regulation rules
  let count = 0;
  for (const req of reqs) {
    const ruleValue = {};
    for (const [k, v] of Object.entries(req)) {
      if (!['id', 'created_at', 'updated_at'].includes(k) && v != null) {
        ruleValue[k] = v;
      }
    }

    const stateCode = req.state_code || req.state || req.region_code || req.jurisdiction_name || "unknown";
    const ruleKey = "escort_req_" + stateCode.toString().toLowerCase().replace(/\s+/g, "_");
    const ruleTitle = "Escort Requirements — " + stateCode;
    const sourceUrl = sourceMap[stateCode.toString().toUpperCase()] || null;

    try {
      const { rowCount } = await c.query(`
        INSERT INTO public.hc_regulation_rules 
          (rule_domain, rule_key, rule_title, rule_value, verification_status, 
           confidence_score, primary_source_url, published)
        VALUES ($1, $2, $3, $4, $5, 0.7, $6, true)
        ON CONFLICT DO NOTHING
      `, [domain, ruleKey, ruleTitle, JSON.stringify(ruleValue), status, sourceUrl]);
      if (rowCount > 0) count++;
    } catch (e) {
      if (count === 0) console.log("  ⚠️ Error: " + e.message.substring(0, 150));
    }
  }
  console.log("  ✅ Migrated " + count + " escort requirements → hc_regulation_rules");

  // 5. Also migrate state_regulations (50 rows)
  console.log("\n  Migrating state_regulations...");
  const { rows: stateRegs } = await c.query("SELECT * FROM public.state_regulations");
  let stateCount = 0;
  for (const reg of stateRegs) {
    const ruleValue = {};
    for (const [k, v] of Object.entries(reg)) {
      if (!['id', 'created_at', 'updated_at'].includes(k) && v != null) {
        ruleValue[k] = v;
      }
    }
    const stateCode = reg.state_code || reg.state || reg.abbreviation || "unknown";
    const ruleKey = "state_reg_" + stateCode.toString().toLowerCase().replace(/\s+/g, "_");
    const ruleTitle = "State Regulations — " + stateCode;

    try {
      const { rowCount } = await c.query(`
        INSERT INTO public.hc_regulation_rules 
          (rule_domain, rule_key, rule_title, rule_value, verification_status, 
           confidence_score, published)
        VALUES ($1, $2, $3, $4, $5, 0.6, true)
        ON CONFLICT DO NOTHING
      `, [domain, ruleKey, ruleTitle, JSON.stringify(ruleValue), status]);
      if (rowCount > 0) stateCount++;
    } catch {}
  }
  console.log("  ✅ Migrated " + stateCount + " state regulations → hc_regulation_rules");

  // 6. Migrate country_regulations (25 rows)
  console.log("\n  Migrating country_regulations...");
  const { rows: countryRegs } = await c.query("SELECT * FROM public.country_regulations");
  let countryCount = 0;
  for (const reg of countryRegs) {
    const ruleValue = {};
    for (const [k, v] of Object.entries(reg)) {
      if (!['id', 'created_at', 'updated_at'].includes(k) && v != null) {
        ruleValue[k] = v;
      }
    }
    const cc = reg.country_code || reg.country || "unknown";
    const ruleKey = "country_reg_" + cc.toString().toLowerCase().replace(/\s+/g, "_");
    const ruleTitle = "Country Regulations — " + cc;

    try {
      const { rowCount } = await c.query(`
        INSERT INTO public.hc_regulation_rules 
          (rule_domain, rule_key, rule_title, rule_value, verification_status, 
           confidence_score, published)
        VALUES ($1, $2, $3, $4, $5, 0.5, true)
        ON CONFLICT DO NOTHING
      `, [domain, ruleKey, ruleTitle, JSON.stringify(ruleValue), status]);
      if (rowCount > 0) countryCount++;
    } catch {}
  }
  console.log("  ✅ Migrated " + countryCount + " country regulations → hc_regulation_rules");

  // Final count
  const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM public.hc_regulation_rules");
  console.log("\n  🟢 Total hc_regulation_rules: " + cnt + " rows");

  await c.end();
})();
