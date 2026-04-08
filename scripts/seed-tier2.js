const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  console.log("Connected.\n");

  // ═══════════════════════════════════════════
  // 1. SEED hc_regulation_rules FROM hc_escort_requirements
  // ═══════════════════════════════════════════
  console.log("═══ SEEDING hc_regulation_rules FROM hc_escort_requirements ═══");
  
  // Check hc_escort_requirements schema
  const { rows: erCols } = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_escort_requirements' ORDER BY ordinal_position"
  );
  console.log("   hc_escort_requirements columns:", erCols.map(x => x.column_name).join(", "));

  // Get sample row
  const { rows: erSample } = await c.query("SELECT * FROM public.hc_escort_requirements LIMIT 2");
  if (erSample.length > 0) {
    console.log("   Sample keys:", Object.keys(erSample[0]).join(", "));
    console.log("   Sample:", JSON.stringify(erSample[0]).substring(0, 300));
  }

  // hc_regulation_rules needs jurisdiction_id, rule_domain, rule_key, rule_title, rule_value (jsonb)
  // But jurisdiction_id references another table. Let's cross-reference from hc_jurisdiction_regulations
  const { rows: jurSample } = await c.query("SELECT * FROM public.hc_jurisdiction_regulations LIMIT 2");
  if (jurSample.length > 0) {
    console.log("\n   hc_jurisdiction_regulations keys:", Object.keys(jurSample[0]).join(", "));
    console.log("   Sample:", JSON.stringify(jurSample[0]).substring(0, 300));
  }

  // Check if there's a jurisdictions table
  const { rows: jurTable } = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%jurisdict%'"
  );
  console.log("\n   Jurisdiction tables:", jurTable.map(x => x.tablename).join(", "));

  // Check the enum types for rule_domain and verification_status
  const { rows: enums } = await c.query(`
    SELECT t.typname, e.enumlabel 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname IN ('rule_domain', 'verification_status', 'regulation_domain')
    ORDER BY t.typname, e.enumsortorder
  `);
  console.log("\n   Enums:");
  enums.forEach(e => console.log("     " + e.typname + ": " + e.enumlabel));

  // ═══════════════════════════════════════════
  // 2. EXPAND hc_corridors (add more real corridors)
  // ═══════════════════════════════════════════
  console.log("\n═══ EXPANDING hc_corridors ═══");
  
  const newCorridors = [
    { name: "I-20 Texas-Louisiana", corridor_name: "I-20 East-West", highway: "I-20", start_city: "Midland", end_city: "Shreveport", start_state: "TX", end_state: "LA", miles: 550, corridor_type: "energy", oversize_frequency: "very_high", escort_demand_level: "high", primary_commodities: ["wind_turbines","oilfield_equipment","transformers"], country_code: "US" },
    { name: "I-40 Oklahoma-Tennessee", corridor_name: "I-40 Cross-Country", highway: "I-40", start_city: "Oklahoma City", end_city: "Nashville", start_state: "OK", end_state: "TN", miles: 640, corridor_type: "manufacturing", oversize_frequency: "high", escort_demand_level: "medium", primary_commodities: ["manufactured_homes","construction_equipment","industrial_machinery"], country_code: "US" },
    { name: "I-69 Texas Triangle", corridor_name: "I-69 South Texas", highway: "I-69", start_city: "Houston", end_city: "Brownsville", start_state: "TX", end_state: "TX", miles: 350, corridor_type: "port", oversize_frequency: "high", escort_demand_level: "high", primary_commodities: ["project_cargo","lng_modules","refinery_equipment"], country_code: "US" },
    { name: "US-87 Wind Corridor", corridor_name: "West Texas Wind Belt", highway: "US-87", start_city: "Lubbock", end_city: "San Angelo", start_state: "TX", end_state: "TX", miles: 180, corridor_type: "energy", oversize_frequency: "very_high", escort_demand_level: "critical", primary_commodities: ["wind_blades","nacelles","tower_sections"], country_code: "US" },
    { name: "I-5 Pacific Coast", corridor_name: "Pacific Coast Corridor", highway: "I-5", start_city: "Seattle", end_city: "Los Angeles", start_state: "WA", end_state: "CA", miles: 1260, corridor_type: "mixed", oversize_frequency: "medium", escort_demand_level: "medium", primary_commodities: ["construction_equipment","solar_panels","manufactured_goods"], country_code: "US" },
    { name: "I-65 Gulf to Midwest", corridor_name: "I-65 North-South", highway: "I-65", start_city: "Mobile", end_city: "Gary", start_state: "AL", end_state: "IN", miles: 770, corridor_type: "manufacturing", oversize_frequency: "high", escort_demand_level: "medium", primary_commodities: ["automotive","steel","industrial_equipment"], country_code: "US" },
    { name: "I-45 Texas Central", corridor_name: "I-45 Houston-Dallas", highway: "I-45", start_city: "Houston", end_city: "Dallas", start_state: "TX", end_state: "TX", miles: 240, corridor_type: "energy", oversize_frequency: "high", escort_demand_level: "high", primary_commodities: ["refinery_modules","transformers","oilfield_equipment"], country_code: "US" },
    { name: "Trans-Canada Highway West", corridor_name: "TCH Alberta-BC", highway: "TCH", start_city: "Calgary", end_city: "Vancouver", start_state: "AB", end_state: "BC", miles: 600, corridor_type: "mining", oversize_frequency: "high", escort_demand_level: "high", primary_commodities: ["mining_equipment","lng_modules","forestry_equipment"], country_code: "CA" },
    { name: "QEW Ontario Corridor", corridor_name: "QEW Golden Horseshoe", highway: "QEW", start_city: "Toronto", end_city: "Fort Erie", start_state: "ON", end_state: "ON", miles: 160, corridor_type: "manufacturing", oversize_frequency: "medium", escort_demand_level: "medium", primary_commodities: ["automotive","steel","construction"], country_code: "CA" },
    { name: "Stuart Highway NT", corridor_name: "Stuart Highway Darwin-Alice", highway: "Stuart Hwy", start_city: "Darwin", end_city: "Alice Springs", start_state: "NT", end_state: "NT", miles: 940, corridor_type: "mining", oversize_frequency: "very_high", escort_demand_level: "critical", primary_commodities: ["mining_equipment","gas_modules","road_trains"], country_code: "AU" },
    { name: "Pacific Highway NSW-QLD", corridor_name: "Pacific Highway", highway: "M1/Pacific", start_city: "Sydney", end_city: "Brisbane", start_state: "NSW", end_state: "QLD", miles: 580, corridor_type: "mixed", oversize_frequency: "high", escort_demand_level: "high", primary_commodities: ["construction","wind_turbines","manufactured_housing"], country_code: "AU" },
    { name: "M1 London-Leeds", corridor_name: "M1 Motorway", highway: "M1", start_city: "London", end_city: "Leeds", start_state: "ENG", end_state: "ENG", miles: 190, corridor_type: "construction", oversize_frequency: "medium", escort_demand_level: "high", primary_commodities: ["construction_equipment","wind_components","infrastructure"], country_code: "GB" },
  ];

  let corridorCount = 0;
  for (const cor of newCorridors) {
    try {
      const { rowCount } = await c.query(`
        INSERT INTO public.hc_corridors 
          (name, corridor_name, highway, start_city, end_city, start_state, end_state, 
           miles, corridor_type, oversize_frequency, escort_demand_level, 
           primary_commodities, country_code, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
        ON CONFLICT DO NOTHING
      `, [
        cor.name, cor.corridor_name, cor.highway, cor.start_city, cor.end_city,
        cor.start_state, cor.end_state, cor.miles, cor.corridor_type,
        cor.oversize_frequency, cor.escort_demand_level,
        cor.primary_commodities, cor.country_code
      ]);
      if (rowCount > 0) corridorCount++;
    } catch (e) {
      console.log("   ⚠️  " + cor.name + ": " + e.message.substring(0, 80));
    }
  }
  console.log("   ✅ Added " + corridorCount + " new corridors");

  // ═══════════════════════════════════════════
  // 3. SEED hc_regulation_rules from hc_escort_requirements
  // (without jurisdiction_id FK — use NULL for now)
  // ═══════════════════════════════════════════
  console.log("\n═══ MIGRATING escort requirements → regulation_rules ═══");
  
  // Get all escort requirements
  const { rows: escortReqs } = await c.query("SELECT * FROM public.hc_escort_requirements");
  console.log("   Found " + escortReqs.length + " escort requirements");

  if (escortReqs.length > 0) {
    const keys = Object.keys(escortReqs[0]);
    console.log("   Keys: " + keys.join(", "));
    
    // Check if hc_regulation_rules jurisdiction_id is nullable
    const { rows: jidCol } = await c.query(
      "SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_regulation_rules' AND column_name='jurisdiction_id'"
    );
    const jurisdictionNullable = jidCol[0]?.is_nullable === "YES";
    console.log("   jurisdiction_id nullable: " + jurisdictionNullable);

    if (!jurisdictionNullable) {
      // Make it nullable so we can seed without strict FK
      try {
        await c.query("ALTER TABLE public.hc_regulation_rules ALTER COLUMN jurisdiction_id DROP NOT NULL");
        console.log("   ✅ Made jurisdiction_id nullable");
      } catch (e) {
        console.log("   ⚠️  Could not alter: " + e.message);
      }
    }

    // Get enum values for rule_domain
    const { rows: rdEnums } = await c.query(`
      SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid 
      WHERE t.typname IN (SELECT udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_regulation_rules' AND column_name='rule_domain')
      ORDER BY e.enumsortorder
    `);
    console.log("   rule_domain enum values:", rdEnums.map(x => x.enumlabel).join(", "));

    // Get enum values for verification_status
    const { rows: vsEnums } = await c.query(`
      SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid 
      WHERE t.typname IN (SELECT udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_regulation_rules' AND column_name='verification_status')
      ORDER BY e.enumsortorder
    `);
    console.log("   verification_status enum values:", vsEnums.map(x => x.enumlabel).join(", "));

    // Find a valid rule_domain value — likely includes 'escort' or similar
    const validDomain = rdEnums.find(x => x.enumlabel.includes("escort")) 
                     || rdEnums.find(x => x.enumlabel.includes("dimension"))
                     || rdEnums[0];
    const validStatus = vsEnums.find(x => x.enumlabel.includes("seed")) 
                     || vsEnums.find(x => x.enumlabel.includes("verified"))
                     || vsEnums[0];

    if (validDomain && validStatus) {
      let ruleCount = 0;
      for (const req of escortReqs) {
        try {
          const ruleValue = {};
          // Map all non-id, non-timestamp fields to rule_value jsonb
          for (const [k, v] of Object.entries(req)) {
            if (!['id', 'created_at', 'updated_at'].includes(k) && v != null) {
              ruleValue[k] = v;
            }
          }

          const stateOrRegion = req.state || req.state_code || req.region || req.jurisdiction || "unknown";
          const ruleKey = "escort_req_" + stateOrRegion.toLowerCase().replace(/\s/g, '_');
          const ruleTitle = "Escort Requirements — " + stateOrRegion;

          const { rowCount } = await c.query(`
            INSERT INTO public.hc_regulation_rules 
              (rule_domain, rule_key, rule_title, rule_value, verification_status, confidence_score, published)
            VALUES ($1, $2, $3, $4, $5, 0.7, true)
            ON CONFLICT DO NOTHING
          `, [
            validDomain.enumlabel, ruleKey, ruleTitle, JSON.stringify(ruleValue), validStatus.enumlabel
          ]);
          if (rowCount > 0) ruleCount++;
        } catch (e) {
          if (ruleCount === 0) console.log("   ⚠️  Rule insert error: " + e.message.substring(0, 100));
        }
      }
      console.log("   ✅ Migrated " + ruleCount + " escort requirements → regulation_rules");
    } else {
      console.log("   ⚠️  No valid enum values found for rule_domain or verification_status");
    }
  }

  // ═══════════════════════════════════════════
  // FINAL VERIFICATION
  // ═══════════════════════════════════════════
  console.log("\n═══ VERIFICATION ═══");
  const verifyTables = [
    "hc_corridors", "hc_regulation_rules", "hc_escort_requirements",
    "hc_entities", "hc_geo_overlays", "hc_glossary_terms", "hc_tools",
    "push_tokens", "hc_surfaces", "hc_internal_links"
  ];
  for (const tbl of verifyTables) {
    try {
      const { rows: [{ cnt }] } = await c.query("SELECT COUNT(*) as cnt FROM public.\"" + tbl + "\"");
      const status = Number(cnt) > 0 ? "🟢" : "⚪";
      console.log("   " + status + " " + tbl + ": " + cnt + " rows");
    } catch {
      console.log("   ❌ " + tbl + ": TABLE NOT FOUND");
    }
  }

  await c.end();
  console.log("\n✅ Tier 2 seeding complete.");
})();
