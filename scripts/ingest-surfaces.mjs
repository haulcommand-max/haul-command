#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND — Global Surface Ingestion Engine v3.0
// Scope: 120-country source of truth from lib/geo/countries.ts
//
// Pulls heavy-haul demand surfaces from OpenStreetMap Overpass API
// into Supabase surfaces table.
//
// Design rules:
// - No local 50/52/57-country shadow list.
// - Country scope is read from lib/geo/countries.ts.
// - Overpass area lookup uses ISO3166-1 country code, so new countries
//   added to HC_COUNTRIES automatically become ingestion candidates.
// - Surfaces are monetizable, SEO-worthy, service-routeable, and usable
//   for AdGrid, dispatch, port access, staging, parking, route support,
//   and data products.
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";
import { createRequire } from "module";

// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvjyfyzotqobfkakjozp.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes("--dry-run") || process.env.INGEST_DRY_RUN === "1";
const MAX_WRITES = parseInt(process.env.INGEST_MAX_WRITES || "50000", 10);
const OVERPASS_API = process.env.OVERPASS_API || "https://overpass-api.de/api/interpreter";
const BATCH_SIZE = parseInt(process.env.INGEST_BATCH_SIZE || "200", 10);
const BASE_DELAY_MS = parseInt(process.env.INGEST_BASE_DELAY_MS || "12000", 10);
const MAX_RETRIES = parseInt(process.env.INGEST_MAX_RETRIES || "3", 10);
const COUNTRY_FILE = join(process.cwd(), "lib", "geo", "countries.ts");

// ── RUN ID ───────────────────────────────────────────────────
const RUN_ID = new Date().toISOString().replace(/[:.]/g, "-");
const LOG_DIR = process.env.INGEST_LOG_DIR || join(process.cwd(), "logs");
const CHECKPOINT_DIR = process.env.INGEST_CHECKPOINT_DIR || join(process.cwd(), "checkpoints");
mkdirSync(LOG_DIR, { recursive: true });
mkdirSync(CHECKPOINT_DIR, { recursive: true });
const LOG_FILE = join(LOG_DIR, `ingest_${RUN_ID}.jsonl`);
const RETRY_FILE = join(LOG_DIR, `retry_queue_${RUN_ID}.json`);

// ── SUPABASE CLIENT ──────────────────────────────────────────
let supabase = null;
if (!DRY_RUN) {
  if (!SUPABASE_SERVICE_KEY) {
    console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY env var or use --dry-run");
    process.exit(1);
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ── STATS ────────────────────────────────────────────────────
const stats = {
  inserts: 0,
  skips: 0,
  updates: 0,
  errors: 0,
  totalWrites: 0,
  queriesRun: 0,
  startTime: Date.now(),
  retryQueue: [],
};

// ── COUNTRY SOURCE OF TRUTH ──────────────────────────────────
function loadHcCountryCodes() {
  if (!existsSync(COUNTRY_FILE)) {
    throw new Error(`Missing country source of truth: ${COUNTRY_FILE}`);
  }

  const raw = readFileSync(COUNTRY_FILE, "utf8");
  const matches = [...raw.matchAll(/iso2:\s*["']([A-Z]{2})["']/g)].map((m) => m[1]);
  const unique = [...new Set(matches)];

  if (unique.length < 100) {
    throw new Error(`Expected 120-country source of truth, found only ${unique.length} ISO codes in lib/geo/countries.ts`);
  }

  return unique;
}

const HC_COUNTRY_CODES = loadHcCountryCodes();

function areaPrefix(countryCode) {
  // Uses ISO country lookup instead of numeric area IDs so the script can scale
  // with lib/geo/countries.ts without manually maintaining Overpass area IDs.
  return `area["ISO3166-1"="${countryCode}"][admin_level=2]->.a;`;
}

function overpassQuery(countryCode, body, outLimit = 2000, timeout = 90) {
  return `[out:json][timeout:${timeout}];${areaPrefix(countryCode)}(${body});out center ${outLimit};`;
}

// ── SURFACE TYPE QUERIES ─────────────────────────────────────
const SURFACE_QUERIES = [
  // Tier 1: hard infrastructure / highest commercial intent
  {
    surface_type: "port",
    query: (cc) => overpassQuery(cc, `nwr["harbour:type"](area.a);nwr["seamark:type"="harbour"](area.a);nwr["landuse"="port"](area.a);nwr["industrial"="port"](area.a);`, 3000),
    monetization: 0.95,
    demand: "very_high",
    service_families: ["port_access_dispatch", "credentialed_operator_rescue", "port_sponsorship", "port_capacity_data"],
  },
  {
    surface_type: "port_terminal",
    query: (cc) => overpassQuery(cc, `nwr["landuse"="port"]["operator"](area.a);nwr["seamark:harbour:category"](area.a);nwr["cargo"](area.a);nwr["industrial"="terminal"](area.a);`, 2000),
    monetization: 0.95,
    demand: "very_high",
    service_families: ["terminal_access", "port_no_show_recovery", "terminal_sponsor_inventory"],
  },
  {
    surface_type: "dry_port",
    query: (cc) => overpassQuery(cc, `nwr["logistics"="dry_port"](area.a);nwr["industrial"="logistics"]["name"~"dry port|inland port",i](area.a);nwr["name"~"dry port|inland port",i](area.a);`, 1500),
    monetization: 0.90,
    demand: "very_high",
    service_families: ["inland_port_dispatch", "corridor_preflight", "capacity_data"],
  },
  {
    surface_type: "intermodal_yard",
    query: (cc) => overpassQuery(cc, `nwr["landuse"="railway"]["railway"="yard"](area.a);nwr["railway"="yard"](area.a);nwr["railway"="station"]["usage"="freight"](area.a);nwr["intermodal"](area.a);`, 2500),
    monetization: 0.90,
    demand: "very_high",
    service_families: ["intermodal_dispatch", "rail_yard_access", "escort_meetup"],
  },
  {
    surface_type: "heavy_industrial_plant",
    query: (cc) => overpassQuery(cc, `nwr["landuse"="industrial"]["name"](area.a);nwr["man_made"="works"]["name"](area.a);nwr["industrial"~"steel|shipyard|factory|manufacturing"](area.a);`, 2500),
    monetization: 0.78,
    demand: "high",
    service_families: ["project_cargo_dispatch", "route_support_pack", "industrial_sponsor_inventory"],
  },
  {
    surface_type: "energy_site",
    query: (cc) => overpassQuery(cc, `nwr["power"="plant"]["name"](area.a);nwr["power"="substation"]["voltage"~"[0-9]{6,}"](area.a);nwr["industrial"="refinery"](area.a);nwr["plant:source"](area.a);`, 2500),
    monetization: 0.88,
    demand: "high",
    service_families: ["energy_project_dispatch", "superload_specialist_desk", "route_survey"],
  },
  {
    surface_type: "wind_farm",
    query: (cc) => overpassQuery(cc, `nwr["plant:source"="wind"]["name"](area.a);nwr["generator:source"="wind"]["name"](area.a);`, 2000),
    monetization: 0.86,
    demand: "high",
    service_families: ["blade_move_dispatch", "route_survey", "escort_capacity_data"],
  },
  {
    surface_type: "logistics_park",
    query: (cc) => overpassQuery(cc, `nwr["landuse"="industrial"]["name"~"logistics|freight|distribution|warehouse|cargo",i](area.a);nwr["industrial"="logistics"](area.a);nwr["amenity"="warehouse"](area.a);`, 2500),
    monetization: 0.76,
    demand: "high",
    service_families: ["logistics_dispatch", "sponsor_inventory", "shipper_lead_generation"],
  },

  // Tier 2: flow/support surfaces
  {
    surface_type: "staging_yard",
    query: (cc) => overpassQuery(cc, `nwr["amenity"="parking"]["hgv"="yes"](area.a);nwr["parking"="surface"]["hgv"](area.a);nwr["landuse"="industrial"]["name"~"staging|yard|laydown|storage",i](area.a);`, 2000),
    monetization: 0.82,
    demand: "high",
    service_families: ["staging_reservation", "curfew_holdover", "emergency_delay_support"],
  },
  {
    surface_type: "secure_parking",
    query: (cc) => overpassQuery(cc, `nwr["amenity"="parking"]["hgv"="yes"](area.a);nwr["amenity"="parking"]["access"~"private|customers|permissive"](area.a);nwr["parking"="truck"](area.a);`, 2500),
    monetization: 0.74,
    demand: "medium_high",
    service_families: ["secure_parking", "curfew_holdover", "parking_sponsorship"],
  },
  {
    surface_type: "truck_stop",
    query: (cc) => overpassQuery(cc, `nwr["amenity"="fuel"]["hgv"="yes"](area.a);nwr["highway"="services"]["name"](area.a);nwr["amenity"="truck_stop"](area.a);`, 3000),
    monetization: 0.68,
    demand: "medium",
    service_families: ["truck_stop_sponsorship", "route_support", "fuel_partner"],
  },
  {
    surface_type: "oversize_hotel",
    query: (cc) => overpassQuery(cc, `nwr["tourism"="hotel"]["parking"](area.a);nwr["tourism"="motel"]["parking"](area.a);nwr["name"~"truck|driver|motel",i]["tourism"](area.a);`, 1500),
    monetization: 0.58,
    demand: "medium",
    service_families: ["crew_lodging", "curfew_holdover", "hotel_affiliate"],
  },
  {
    surface_type: "repair_support",
    query: (cc) => overpassQuery(cc, `nwr["shop"="truck_repair"](area.a);nwr["shop"="tyres"]["hgv"="yes"](area.a);nwr["amenity"="vehicle_inspection"](area.a);nwr["craft"="mechanic"](area.a);`, 2000),
    monetization: 0.72,
    demand: "medium_high",
    service_families: ["breakdown_recovery", "repair_partner_routing", "route_support_pack"],
  },
  {
    surface_type: "equipment_upfitter",
    query: (cc) => overpassQuery(cc, `nwr["shop"="trade"]["trade"~"construction|machinery|automotive",i](area.a);nwr["shop"="machinery"](area.a);nwr["craft"~"metal_construction|electrician|mechanic"](area.a);`, 1500),
    monetization: 0.66,
    demand: "medium",
    service_families: ["routeready_installer", "gear_install", "operator_readiness"],
  },
  {
    surface_type: "weigh_station",
    query: (cc) => overpassQuery(cc, `nwr["amenity"="weighbridge"](area.a);nwr["highway"="weighbridge"](area.a);`, 1000),
    monetization: 0.70,
    demand: "medium",
    service_families: ["route_compliance", "corridor_preflight", "data_product"],
  },
  {
    surface_type: "crane_yard",
    query: (cc) => overpassQuery(cc, `nwr["man_made"="crane"]["name"](area.a);nwr["industrial"="crane"](area.a);nwr["name"~"crane|rigging|heavy lift",i](area.a);`, 1500),
    monetization: 0.85,
    demand: "high",
    service_families: ["heavy_lift_partner", "project_cargo_support", "specialist_marketplace"],
  },
];

// ── SLUG CONTRACT ────────────────────────────────────────────
const require = createRequire(import.meta.url);
const { generateCanonicalSlug: _genSlug } = require("./lib/slugify");

function slugify(text, countryCode, surfaceType) {
  return _genSlug(text, countryCode || "", surfaceType || "");
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function jitter(ms) { return ms + Math.floor(Math.random() * ms * 0.3); }

function logEntry(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), run_id: RUN_ID, ...entry });
  appendFileSync(LOG_FILE, line + "\n");
}

function printSummary(label) {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
  console.log(`\n  ┌─── ${label} ───────────────────────────`);
  console.log(`  │ Inserts:  ${stats.inserts}`);
  console.log(`  │ Skips:    ${stats.skips}`);
  console.log(`  │ Errors:   ${stats.errors}`);
  console.log(`  │ Queries:  ${stats.queriesRun}`);
  console.log(`  │ Writes:   ${stats.totalWrites} / ${MAX_WRITES}`);
  console.log(`  │ Elapsed:  ${elapsed}s`);
  console.log(`  └────────────────────────────────────────\n`);
}

// ── CHECKPOINT ───────────────────────────────────────────────
function checkpointKey(cc, surfaceType) { return `${cc}_${surfaceType}`; }
function isCheckpointed(cc, surfaceType) { return existsSync(join(CHECKPOINT_DIR, `${checkpointKey(cc, surfaceType)}.done`)); }
function writeCheckpoint(cc, surfaceType, count) {
  writeFileSync(join(CHECKPOINT_DIR, `${checkpointKey(cc, surfaceType)}.done`), JSON.stringify({ cc, surfaceType, count, ts: new Date().toISOString(), run_id: RUN_ID }));
}

// ── OVERPASS ─────────────────────────────────────────────────
async function queryOverpass(queryStr, label) {
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const t0 = Date.now();
    try {
      const resp = await fetch(OVERPASS_API, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(queryStr)}`,
      });

      if (resp.status === 429) {
        const wait = jitter(30000 * Math.pow(2, attempt - 1));
        console.log(`  ⏳ 429 rate-limited on ${label}. Backoff ${(wait / 1000).toFixed(0)}s (attempt ${attempt}/${MAX_RETRIES})`);
        logEntry({ country: label, action: "rate_limited", attempt, backoff_ms: wait });
        await sleep(wait);
        continue;
      }

      if (resp.status >= 500) {
        const wait = jitter(10000 * Math.pow(2, attempt - 1));
        console.log(`  ⏳ ${resp.status} server error on ${label}. Backoff ${(wait / 1000).toFixed(0)}s (attempt ${attempt}/${MAX_RETRIES})`);
        logEntry({ country: label, action: "server_error", status: resp.status, attempt, backoff_ms: wait });
        await sleep(wait);
        continue;
      }

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Overpass ${resp.status}: ${text.slice(0, 200)}`);
      }

      const json = await resp.json();
      const ms = Date.now() - t0;
      logEntry({ country: label, action: "query_ok", elements: (json.elements || []).length, ms });
      return json.elements || [];
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const wait = jitter(15000 * attempt);
        console.log(`  ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed for ${label}: ${err.message}. Retry in ${(wait / 1000).toFixed(0)}s`);
        await sleep(wait);
      }
    }
  }

  stats.retryQueue.push({ label, error: lastErr?.message });
  throw lastErr || new Error(`Max retries exhausted for ${label}`);
}

// ── MAP + TRANSFORM ──────────────────────────────────────────
function extractCoords(el) {
  const lat = el.center?.lat ?? el.lat;
  const lon = el.center?.lon ?? el.lon;
  if (lat == null || lon == null) return null;
  return { lat, lon };
}

function mapElement(el, countryCode, surfaceDef) {
  const tags = el.tags || {};
  const name = tags.name || tags["name:en"] || tags.operator || tags.brand;
  if (!name) return null;

  const coords = extractCoords(el);
  if (!coords) return null;

  const osmType = el.type;
  const osmId = el.id;
  const sourceId = `${osmType}/${osmId}`;

  return {
    country_code: countryCode,
    surface_type: surfaceDef.surface_type,
    name: name.slice(0, 255),
    slug: slugify(name, countryCode, surfaceDef.surface_type),
    address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null,
    city: tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || null,
    state_region: tags["addr:state"] || tags["addr:province"] || tags["addr:region"] || null,
    postal_code: tags["addr:postcode"] || null,
    geo: `SRID=4326;POINT(${coords.lon} ${coords.lat})`,
    phone: tags.phone || tags["contact:phone"] || null,
    email: tags.email || tags["contact:email"] || null,
    website: tags.website || tags["contact:website"] || null,
    claim_status: "unclaimed",
    data_confidence_score: 0.6,
    monetization_score: surfaceDef.monetization,
    liquidity_score: surfaceDef.demand === "very_high" ? 0.7 : surfaceDef.demand === "high" ? 0.55 : 0.35,
    source: "osm",
    source_id: sourceId,
    metadata: {
      osm_type: osmType,
      osm_id: osmId,
      demand_signal: surfaceDef.demand,
      service_families: surfaceDef.service_families,
      global_scope: "120_country_source_of_truth",
      osm_tags: tags,
      ingested_at: new Date().toISOString(),
      ingested_run_id: RUN_ID,
      ingested_by: "ingest-surfaces.mjs",
    },
  };
}

// ── UPSERT ───────────────────────────────────────────────────
async function upsertBatch(rows) {
  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  const { error, count } = await supabase
    .from("surfaces")
    .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true, count: "exact" });

  if (error) {
    console.error(`  ⚠️ Upsert error: ${error.message}`);
    logEntry({ action: "upsert_error", error: error.message, batch_size: rows.length });
    return { inserted: 0, skipped: rows.length };
  }

  const inserted = count ?? rows.length;
  return { inserted, skipped: rows.length - inserted };
}

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log(" HAUL COMMAND — Global Surface Ingestion Engine v3.0");
  console.log("═══════════════════════════════════════════════════");
  console.log(`Run ID:        ${RUN_ID}`);
  console.log(`Mode:          ${DRY_RUN ? "🧪 DRY RUN" : "🚀 LIVE"}`);
  console.log(`Country source:${COUNTRY_FILE}`);
  console.log(`Country count: ${HC_COUNTRY_CODES.length}`);
  console.log(`Max writes:    ${MAX_WRITES}`);
  console.log(`Log file:      ${LOG_FILE}`);
  console.log(`Checkpoints:   ${CHECKPOINT_DIR}`);
  console.log(`Retries:       ${MAX_RETRIES} per query`);
  console.log("");

  const filterCountries = process.argv.filter((a) => /^[A-Z]{2}$/.test(a));
  const countries = filterCountries.length > 0 ? filterCountries : HC_COUNTRY_CODES;
  console.log(`Countries:     ${countries.join(", ")} (${countries.length})`);
  console.log(`Surface types: ${SURFACE_QUERIES.length}`);
  console.log("");

  logEntry({ action: "run_start", countries, country_count: countries.length, source_of_truth: "lib/geo/countries.ts", surface_types: SURFACE_QUERIES.length, max_writes: MAX_WRITES, dry_run: DRY_RUN });

  for (const cc of countries) {
    if (!HC_COUNTRY_CODES.includes(cc)) {
      console.log(`⚠️ ${cc} is not in lib/geo/countries.ts, skipping`);
      continue;
    }

    if (stats.totalWrites >= MAX_WRITES) {
      console.log(`\n🛑 MAX_WRITES cap reached (${MAX_WRITES}). Stopping.`);
      logEntry({ action: "max_writes_reached", total: stats.totalWrites });
      break;
    }

    console.log(`\n🌍 ══ ${cc} ══════════════════════════════════════`);

    for (const surfaceDef of SURFACE_QUERIES) {
      const label = `${cc}/${surfaceDef.surface_type}`;
      if (isCheckpointed(cc, surfaceDef.surface_type)) {
        console.log(`  ⏭️ ${label} — already checkpointed, skipping`);
        continue;
      }
      if (stats.totalWrites >= MAX_WRITES) break;

      try {
        console.log(`  📡 Querying ${label}...`);
        const queryStr = surfaceDef.query(cc);
        const elements = await queryOverpass(queryStr, label);
        stats.queriesRun++;

        const rows = elements.map((el) => mapElement(el, cc, surfaceDef)).filter(Boolean);
        console.log(`  📦 ${elements.length} raw → ${rows.length} valid`);

        if (rows.length === 0) {
          logEntry({ country: cc, surface_type: surfaceDef.surface_type, action: "empty", raw: elements.length });
          writeCheckpoint(cc, surfaceDef.surface_type, 0);
          await sleep(2000);
          continue;
        }

        if (DRY_RUN) {
          console.log(`  🧪 [DRY] Would insert ${rows.length} rows`);
          stats.inserts += rows.length;
          stats.totalWrites += rows.length;
          logEntry({ country: cc, surface_type: surfaceDef.surface_type, action: "dry_insert", count: rows.length });
        } else {
          let batchInserted = 0;
          let batchSkipped = 0;
          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const result = await upsertBatch(batch);
            batchInserted += result.inserted;
            batchSkipped += result.skipped;

            for (const row of batch) {
              logEntry({ country: cc, surface_type: surfaceDef.surface_type, source: "osm", source_id: row.source_id, action: "insert", ok: true });
            }
          }
          stats.inserts += batchInserted;
          stats.skips += batchSkipped;
          stats.totalWrites += batchInserted;
          console.log(`  ✅ ${batchInserted} inserted, ${batchSkipped} skipped`);
        }

        writeCheckpoint(cc, surfaceDef.surface_type, rows.length);
        if (stats.queriesRun % 5 === 0) printSummary(`After ${stats.queriesRun} queries`);
        await sleep(jitter(BASE_DELAY_MS));
      } catch (err) {
        console.error(`  ❌ FAILED ${label}: ${err.message}`);
        stats.errors++;
        logEntry({ country: cc, surface_type: surfaceDef.surface_type, action: "error", error: err.message });
        await sleep(jitter(BASE_DELAY_MS));
      }
    }

    printSummary(`${cc} complete`);
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log(" ✅ INGESTION COMPLETE");
  console.log("═══════════════════════════════════════════════════");
  printSummary("FINAL");

  if (stats.retryQueue.length > 0) {
    console.log(`\n⚠️ ${stats.retryQueue.length} queries exhausted retries. Saved to ${RETRY_FILE}`);
    writeFileSync(RETRY_FILE, JSON.stringify(stats.retryQueue, null, 2));
  }

  logEntry({ action: "run_end", ...stats, retryQueue: stats.retryQueue.length });

  if (!DRY_RUN && supabase) {
    const { count } = await supabase.from("surfaces").select("id", { count: "exact", head: true });
    console.log(`\n📊 Total surfaces in database: ${count}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  logEntry({ action: "fatal", error: err.message });
  process.exit(1);
});
