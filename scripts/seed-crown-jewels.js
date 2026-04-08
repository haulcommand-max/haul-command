/**
 * Seed crown jewel tables with real production data:
 * 1. hc_geo_overlays — US, Canada, Australia core markets
 * 2. hc_glossary_terms — industry glossary from live site terms
 * 3. hc_entities — bootstrap from hc_identities (6,951 records)
 */
const { Client } = require("pg");

const POOLER_URL =
  "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const c = new Client({
    connectionString: POOLER_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  console.log("Connected.\n");

  // ═══════════════════════════════════════════
  // 1. SEED GEO OVERLAYS
  // ═══════════════════════════════════════════
  console.log("═══ SEEDING hc_geo_overlays ═══");
  const geoOverlays = [
    { country_code: "US", default_language: "en", currency_code: "USD", measurement_system: "imperial", date_format: "MM/DD/YYYY", time_format: "12h",
      role_aliases: { "pilot_car": "pilot car", "escort_vehicle": "escort vehicle", "chase_car": "chase car", "bucket_truck": "bucket truck", "high_pole": "height pole" },
      service_aliases: { "oversize_load": "oversize load", "wide_load": "wide load", "superload": "superload", "over_dimensional": "over-dimensional" },
      priority_sectors: ["wind_energy", "oil_gas", "construction", "military", "refinery", "manufacturing"],
      local_search_phrases: ["pilot car near me", "escort car service", "oversize load escort", "wide load pilot car", "heavy haul escort"] },
    { country_code: "CA", default_language: "en", currency_code: "CAD", measurement_system: "metric", date_format: "YYYY-MM-DD", time_format: "24h",
      role_aliases: { "pilot_car": "pilot vehicle", "escort_vehicle": "escort vehicle", "lead_vehicle": "lead vehicle", "trail_vehicle": "trail vehicle" },
      service_aliases: { "oversize_load": "oversize load", "over_dimensional": "over-dimensional", "wide_load": "extra-wide load" },
      priority_sectors: ["mining", "oil_sands", "forestry", "wind_energy", "hydroelectric"],
      local_search_phrases: ["pilot vehicle service", "escort vehicle Canada", "oversize load escort", "over-dimensional transport"] },
    { country_code: "AU", default_language: "en", currency_code: "AUD", measurement_system: "metric", date_format: "DD/MM/YYYY", time_format: "12h",
      role_aliases: { "pilot_car": "pilot vehicle", "escort_vehicle": "escort vehicle", "lead_vehicle": "lead vehicle", "rear_escort": "rear escort" },
      service_aliases: { "oversize_load": "over-size load", "over_dimensional": "over-dimensional", "OSOM": "over-size over-mass" },
      priority_sectors: ["mining", "wind_energy", "construction", "agriculture", "defence"],
      local_search_phrases: ["pilot vehicle service Australia", "over-size load escort", "OSOM escort", "heavy vehicle escort"] },
    { country_code: "GB", default_language: "en", currency_code: "GBP", measurement_system: "imperial", date_format: "DD/MM/YYYY", time_format: "24h",
      role_aliases: { "pilot_car": "escort vehicle", "escort_vehicle": "abnormal load escort", "STGO": "STGO vehicle" },
      service_aliases: { "oversize_load": "abnormal load", "wide_load": "wide load", "heavy_load": "heavy load" },
      priority_sectors: ["wind_energy", "construction", "nuclear", "infrastructure"],
      local_search_phrases: ["abnormal load escort UK", "wide load escort", "STGO escort vehicle", "abnormal load notification"] },
    { country_code: "DE", default_language: "de", currency_code: "EUR", measurement_system: "metric", date_format: "DD.MM.YYYY", time_format: "24h",
      role_aliases: { "pilot_car": "Begleitfahrzeug", "escort_vehicle": "Transportbegleitung" },
      service_aliases: { "oversize_load": "Großraum- und Schwertransport", "heavy_transport": "Schwertransport" },
      priority_sectors: ["wind_energy", "manufacturing", "construction", "automotive"],
      local_search_phrases: ["Schwertransport Begleitung", "Großraumtransport Begleitfahrzeug", "BF3 Begleitfahrzeug"] },
    { country_code: "MX", default_language: "es", currency_code: "MXN", measurement_system: "metric", date_format: "DD/MM/YYYY", time_format: "24h",
      role_aliases: { "pilot_car": "vehículo piloto", "escort_vehicle": "vehículo escolta", "banderero": "banderero" },
      service_aliases: { "oversize_load": "carga sobredimensionada", "heavy_haul": "transporte pesado" },
      priority_sectors: ["oil_gas", "mining", "wind_energy", "manufacturing", "construction"],
      local_search_phrases: ["escolta de carga sobredimensionada", "vehículo piloto México", "transporte pesado escolta"] },
    { country_code: "BR", default_language: "pt", currency_code: "BRL", measurement_system: "metric", date_format: "DD/MM/YYYY", time_format: "24h",
      role_aliases: { "pilot_car": "batedor", "escort_vehicle": "veículo escolta" },
      service_aliases: { "oversize_load": "carga indivisível", "heavy_transport": "transporte especial" },
      priority_sectors: ["mining", "oil_gas", "agribusiness", "wind_energy", "hydroelectric"],
      local_search_phrases: ["escolta de carga especial", "batedor de transporte", "AET escolta"] },
    { country_code: "ZA", default_language: "en", currency_code: "ZAR", measurement_system: "metric", date_format: "YYYY/MM/DD", time_format: "24h",
      role_aliases: { "pilot_car": "pilot vehicle", "escort_vehicle": "escort vehicle", "abnormal_vehicle": "abnormal load vehicle" },
      service_aliases: { "oversize_load": "abnormal load", "heavy_transport": "abnormal transport" },
      priority_sectors: ["mining", "wind_energy", "construction", "ports"],
      local_search_phrases: ["abnormal load escort South Africa", "pilot vehicle Gauteng", "abnormal transport escort"] },
  ];

  let geoCount = 0;
  for (const geo of geoOverlays) {
    const { rowCount } = await c.query(`
      INSERT INTO public.hc_geo_overlays 
        (country_code, default_language, currency_code, measurement_system, date_format, time_format, 
         role_aliases_json, service_aliases_json, priority_sectors_json, local_search_phrases_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (country_code, region_code) DO NOTHING
    `, [
      geo.country_code, geo.default_language, geo.currency_code, geo.measurement_system,
      geo.date_format, geo.time_format,
      JSON.stringify(geo.role_aliases), JSON.stringify(geo.service_aliases),
      JSON.stringify(geo.priority_sectors), JSON.stringify(geo.local_search_phrases)
    ]);
    if (rowCount > 0) geoCount++;
  }
  console.log(`   ✅ Inserted ${geoCount} country overlays\n`);

  // ═══════════════════════════════════════════
  // 2. SEED GLOSSARY TERMS
  // ═══════════════════════════════════════════
  console.log("═══ SEEDING hc_glossary_terms ═══");
  const glossaryTerms = [
    { term: "Pilot Car", slug: "pilot-car", short: "A vehicle that drives ahead of or behind an oversize load to warn traffic and guide the transport safely through roads, intersections, and hazards.", aliases: ["pilot vehicle", "escort car", "lead car", "chase car", "scout car"] },
    { term: "Escort Vehicle", slug: "escort-vehicle", short: "A vehicle assigned to accompany an oversize or overweight load to ensure safe passage, warn other motorists, and assist with navigation.", aliases: ["escort car", "pilot car", "lead vehicle", "trail vehicle", "chase vehicle"] },
    { term: "Oversize Load", slug: "oversize-load", short: "A load that exceeds the standard legal dimensions (width, height, length, or weight) for a given jurisdiction and requires special permits and/or escorts.", aliases: ["over-dimensional load", "wide load", "OD load", "abnormal load"] },
    { term: "Superload", slug: "superload", short: "An extremely heavy or large load that exceeds standard oversize permit thresholds and requires special routing, engineering analysis, bridge checks, and often police escorts.", aliases: ["super load", "mega load", "heavy haul superload"] },
    { term: "Height Pole", slug: "height-pole", short: "A pole mounted on a pilot car that extends to the height of the load being transported, used to check overhead clearances before the load passes.", aliases: ["high pole", "clearance pole", "overhead pole", "measuring pole"] },
    { term: "Wide Load", slug: "wide-load", short: "A load whose width exceeds the standard legal limit for the roadway, typically requiring permits, escorts, and warning signs or flags.", aliases: ["extra-wide load", "overwidth load", "OW load"] },
    { term: "Heavy Haul", slug: "heavy-haul", short: "The transportation of extremely heavy cargo that exceeds standard weight limits, requiring specialized trailers, permits, route surveys, and often multiple escorts.", aliases: ["heavy transport", "heavy hauling", "specialized transport"] },
    { term: "Overweight Load", slug: "overweight-load", short: "A load that exceeds the legal weight limits for a given road or bridge, requiring special permits and potentially restricted routing.", aliases: ["OW load", "over-mass load"] },
    { term: "TWIC Card", slug: "twic-card", short: "Transportation Worker Identification Credential — a biometric security card issued by TSA required for unescorted access to secure areas of ports and maritime facilities in the United States.", aliases: ["TWIC", "Transportation Worker Identification Credential"] },
    { term: "Deadhead", slug: "deadhead-miles", short: "Miles driven without a load or without pay, typically when repositioning to pick up the next job.", aliases: ["deadhead miles", "dead miles", "empty miles", "unpaid miles"] },
    { term: "Repositioning", slug: "repositioning", short: "Moving a vehicle or equipment from its current location to where the next job begins, often involving deadhead miles.", aliases: ["repo", "reposition", "backhaul positioning"] },
    { term: "Route Survey", slug: "route-survey", short: "A physical inspection of the planned transport route to identify obstacles, low clearances, tight turns, construction zones, and other hazards before the load moves.", aliases: ["route inspection", "route check", "pre-route survey"] },
    { term: "Permit", slug: "permit", short: "A legal authorization issued by a state or provincial DOT allowing the transport of an oversize, overweight, or superload on public roads under specified conditions.", aliases: ["transport permit", "OS/OW permit", "movement permit", "hauling permit"] },
    { term: "COI", slug: "certificate-of-insurance", short: "Certificate of Insurance — a document proving that an operator or company carries the required liability insurance coverage.", aliases: ["certificate of insurance", "insurance certificate", "proof of insurance"] },
    { term: "Corridor", slug: "corridor", short: "A defined geographic route or lane frequently used for heavy haul transport, often connecting industrial zones, ports, wind farms, or manufacturing centers.", aliases: ["transport corridor", "haul corridor", "freight corridor", "route corridor"] },
    { term: "Flagman", slug: "flagman", short: "A person who directs traffic using flags, signs, or signals during the movement of an oversize load through intersections, construction zones, or restricted areas.", aliases: ["flagger", "traffic control person", "flag person", "banderero"] },
    { term: "Police Escort", slug: "police-escort", short: "Law enforcement vehicles required by some jurisdictions to accompany superloads or certain oversize loads through high-traffic areas, intersections, or restricted zones.", aliases: ["LEO escort", "law enforcement escort", "state patrol escort"] },
    { term: "Bucket Truck", slug: "bucket-truck", short: "A vehicle with an extendable hydraulic boom and platform (bucket) used to raise and move overhead utility lines so an oversize load can pass underneath.", aliases: ["boom truck", "aerial lift truck", "utility truck", "line lifter"] },
    { term: "Load Board", slug: "load-board", short: "An online marketplace or bulletin board where brokers, carriers, and dispatchers post available loads and operators can find work.", aliases: ["freight board", "job board", "available loads", "load postings"] },
    { term: "Dispatch", slug: "dispatch", short: "The process of assigning and coordinating transport resources — operators, escorts, trucks — to execute a specific load movement.", aliases: ["dispatching", "load assignment", "fleet dispatch"] },
  ];

  let glossaryCount = 0;
  for (const g of glossaryTerms) {
    const { rowCount } = await c.query(`
      INSERT INTO public.hc_glossary_terms 
        (canonical_term, slug, definition_short, aliases_json, ai_snippet_answer, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (slug) DO NOTHING
    `, [
      g.term, g.slug, g.short, JSON.stringify(g.aliases),
      g.short // ai_snippet_answer = same as short definition for now
    ]);
    if (rowCount > 0) glossaryCount++;
  }
  console.log(`   ✅ Inserted ${glossaryCount} glossary terms\n`);

  // ═══════════════════════════════════════════
  // 3. BOOTSTRAP hc_entities FROM hc_identities
  // ═══════════════════════════════════════════
  console.log("═══ BOOTSTRAPPING hc_entities FROM hc_identities ═══");
  
  // Check hc_identities schema first
  const { rows: idCols } = await c.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='hc_identities' 
    ORDER BY ordinal_position
  `);
  console.log("   hc_identities columns:", idCols.map(x => x.column_name).join(", "));

  // Get count
  const { rows: [{cnt: identityCount}] } = await c.query("SELECT COUNT(*) as cnt FROM public.hc_identities");
  console.log(`   Found ${identityCount} identities to migrate`);

  // Check what columns are available for mapping
  const colNames = idCols.map(x => x.column_name);
  const hasName = colNames.includes("name") || colNames.includes("display_name") || colNames.includes("business_name");
  const hasCountry = colNames.includes("country_code") || colNames.includes("country");
  const hasType = colNames.includes("entity_type") || colNames.includes("type") || colNames.includes("role");
  
  // Get a sample row
  const { rows: sampleRows } = await c.query("SELECT * FROM public.hc_identities LIMIT 2");
  if (sampleRows.length > 0) {
    console.log("   Sample row keys:", Object.keys(sampleRows[0]).join(", "));
  }

  // Bootstrap: insert unique identities as entities
  if (identityCount > 0) {
    // Find the right column names
    const nameCol = colNames.includes("display_name") ? "display_name" 
                  : colNames.includes("business_name") ? "business_name"
                  : colNames.includes("name") ? "name"
                  : null;
    const countryCol = colNames.includes("country_code") ? "country_code"
                     : colNames.includes("country") ? "country"
                     : null;
    const typeCol = colNames.includes("entity_type") ? "entity_type"
                  : colNames.includes("type") ? "type"
                  : colNames.includes("role") ? "role"
                  : null;

    if (nameCol) {
      const insertSQL = `
        INSERT INTO public.hc_entities (name, entity_type, country_code, status, source_system, source_id)
        SELECT 
          i.${nameCol},
          COALESCE(${typeCol ? 'i.' + typeCol : "'operator'"}),
          COALESCE(${countryCol ? 'i.' + countryCol : "'US'"}, 'US'),
          'active',
          'hc_identities',
          i.id::text
        FROM public.hc_identities i
        WHERE i.${nameCol} IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM public.hc_entities e 
            WHERE e.source_system = 'hc_identities' AND e.source_id = i.id::text
          )
        LIMIT 5000
      `;
      
      try {
        const result = await c.query(insertSQL);
        console.log(`   ✅ Bootstrapped ${result.rowCount} entities from hc_identities`);
      } catch (err) {
        console.log(`   ⚠️  Entity bootstrap needs column adjustment: ${err.message}`);
        // Try simpler approach
        try {
          const simpleSQL = `
            INSERT INTO public.hc_entities (name, entity_type, country_code, status)
            SELECT 
              COALESCE(${nameCol}, 'Unknown'),
              'operator',
              'US',
              'active'
            FROM public.hc_identities
            WHERE ${nameCol} IS NOT NULL
            LIMIT 5000
          `;
          const result2 = await c.query(simpleSQL);
          console.log(`   ✅ Bootstrapped ${result2.rowCount} entities (simple mode)`);
        } catch (err2) {
          console.log(`   ❌ Entity bootstrap failed: ${err2.message}`);
        }
      }
    } else {
      console.log("   ⚠️  No name column found in hc_identities — skipping entity bootstrap");
    }
  }

  // ═══════════════════════════════════════════
  // 4. SEED TOOLS
  // ═══════════════════════════════════════════
  console.log("\n═══ SEEDING hc_tools ═══");
  const tools = [
    { name: "Escort Calculator", slug: "escort-calculator", type: "calculator", desc: "Calculate exact escort requirements by state for your load dimensions and route." },
    { name: "Compliance Card Generator", slug: "compliance-card", type: "document", desc: "Generate a one-page PDF with escort thresholds for any state." },
    { name: "Regulation Alerts", slug: "regulation-alerts", type: "subscription", desc: "Subscribe to get notified when escort rules change in your states." },
    { name: "Permit Cost Estimator", slug: "permit-cost-estimator", type: "calculator", desc: "Estimate permit costs for oversize/overweight loads by state and weight class." },
    { name: "Route Planner", slug: "route-planner", type: "planning", desc: "Plan routes with bridge clearance, weight limits, and escort requirement checks." },
    { name: "Discovery Map", slug: "discovery-map", type: "map", desc: "Interactive map showing operators, corridors, ports, and service infrastructure." },
  ];

  let toolCount = 0;
  for (const t of tools) {
    const { rowCount } = await c.query(`
      INSERT INTO public.hc_tools (tool_name, slug, tool_type, status)
      VALUES ($1, $2, $3, 'active')
      ON CONFLICT (slug) DO NOTHING
    `, [t.name, t.slug, t.type]);
    if (rowCount > 0) toolCount++;
  }
  console.log(`   ✅ Inserted ${toolCount} tools\n`);

  // Final verification
  console.log("═══ VERIFICATION ═══");
  const tables = ["hc_geo_overlays", "hc_glossary_terms", "hc_tools", "hc_entities", "hc_blog_posts", "hc_monetization_products"];
  for (const tbl of tables) {
    try {
      const { rows: [{cnt}] } = await c.query(`SELECT COUNT(*) as cnt FROM public."${tbl}"`);
      console.log(`   ${tbl}: ${cnt} rows`);
    } catch {
      console.log(`   ${tbl}: NOT FOUND`);
    }
  }

  await c.end();
  console.log("\n✅ Seeding complete.");
}

main().catch(e => { console.error(e); process.exit(1); });
