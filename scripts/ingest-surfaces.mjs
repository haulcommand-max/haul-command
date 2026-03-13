#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND — Bulk Surface Ingestion Engine v2.0 (Production)
// Pulls from OpenStreetMap Overpass API → Supabase surfaces table
// Implements: run ID, JSONL logging, checkpoints, exponential
// backoff, retry caps, max writes, resume, live summaries
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || "https://hvjyfyzotqobfkakjozp.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes("--dry-run") || process.env.INGEST_DRY_RUN === "1";
const MAX_WRITES = parseInt(process.env.INGEST_MAX_WRITES || "50000", 10);
const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const BATCH_SIZE = 200;
const BASE_DELAY_MS = 12000;
const MAX_RETRIES = 3;

// ── RUN ID ───────────────────────────────────────────────────
const RUN_ID = new Date().toISOString().replace(/[:.]/g, "-");
const LOG_DIR = process.env.INGEST_LOG_DIR || join(process.cwd(), "logs");
const CHECKPOINT_DIR = join(process.cwd(), "checkpoints");
mkdirSync(LOG_DIR, { recursive: true });
mkdirSync(CHECKPOINT_DIR, { recursive: true });
const LOG_FILE = join(LOG_DIR, `ingest_${RUN_ID}.jsonl`);
const RETRY_FILE = join(LOG_DIR, `retry_queue_${RUN_ID}.json`);

// ── SUPABASE CLIENT ──────────────────────────────────────────
let supabase = null;
if (!DRY_RUN) {
  if (!SUPABASE_SERVICE_KEY) {
    console.error("❌  Set SUPABASE_SERVICE_ROLE_KEY env var (or use --dry-run)");
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

// ── COUNTRY LIST ─────────────────────────────────────────────
const COUNTRIES = {
  US: 3600148838, CA: 3600263009, AU: 3600080500, GB: 3600062149,
  NZ: 3600556706, ZA: 3600087565, DE: 3600051477, NL: 3600047796,
  AE: 3600307763, BR: 3600185086, IE: 3600062273, SE: 3600052822,
  NO: 3600054224, DK: 3600050046, FI: 3600054224, BE: 3600052411,
  AT: 3600016239, CH: 3600051701, ES: 3600349053, FR: 3600001403,
  IT: 3600365331, PT: 3600295480, SA: 3600307584, QA: 3600305095,
  MX: 3600114686, PL: 3600049715, CZ: 3600051684, SK: 3600014296,
  HU: 3600021335, SI: 3600218657, EE: 3600079510, LV: 3600072594,
  LT: 3600072596, HR: 3600214885, RO: 3600090689, BG: 3600186382,
  GR: 3600071525, TR: 3600174737, KW: 3600305099, OM: 3600305138,
  BH: 3600378734, SG: 3600536780, MY: 3600122584, JP: 3600382313,
  KR: 3600307756, CL: 3600167454, AR: 3600286393, CO: 3600120027,
  PE: 3600288247, UY: 3600287072, PA: 3600287668, CR: 3600287667,
};

// ── SURFACE TYPE QUERIES ─────────────────────────────────────
const SURFACE_QUERIES = [
  {
    surface_type: "port",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["harbour:type"](area.a);nwr["seamark:type"="harbour"](area.a);nwr["landuse"="port"](area.a);nwr["industrial"="port"](area.a););out center 2000;`,
    monetization: 0.95, demand: "very_high",
  },
  {
    surface_type: "intermodal_yard",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["landuse"="railway"]["railway"="yard"](area.a);nwr["railway"="yard"](area.a);nwr["railway"="station"]["usage"="freight"](area.a););out center 2000;`,
    monetization: 0.90, demand: "very_high",
  },
  {
    surface_type: "industrial_plant",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["landuse"="industrial"]["name"](area.a);nwr["man_made"="works"]["name"](area.a););out center 1500;`,
    monetization: 0.75, demand: "high",
  },
  {
    surface_type: "power_plant",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["power"="plant"]["name"](area.a);nwr["power"="generator"]["generator:source"="wind"]["name"](area.a);nwr["power"="substation"]["voltage"~"[0-9]{6,}"](area.a););out center 1500;`,
    monetization: 0.85, demand: "high",
  },
  {
    surface_type: "refinery",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["industrial"="refinery"](area.a);nwr["man_made"="petroleum_well"](area.a););out center 1000;`,
    monetization: 0.90, demand: "very_high",
  },
  {
    surface_type: "wind_farm",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["plant:source"="wind"]["name"](area.a);nwr["generator:source"="wind"]["name"](area.a););out center 1000;`,
    monetization: 0.85, demand: "high",
  },
  {
    surface_type: "mining_site",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["landuse"="quarry"]["name"](area.a);nwr["industrial"="mine"]["name"](area.a););out center 1000;`,
    monetization: 0.80, demand: "high",
  },
  {
    surface_type: "truck_stop",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["amenity"="fuel"]["hgv"="yes"](area.a);nwr["highway"="services"]["name"](area.a);nwr["amenity"="truck_stop"](area.a););out center 2000;`,
    monetization: 0.65, demand: "medium",
  },
  {
    surface_type: "weigh_station",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["amenity"="weighbridge"](area.a);nwr["highway"="weighbridge"](area.a););out center 500;`,
    monetization: 0.70, demand: "medium",
  },
  {
    surface_type: "crane_yard",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["man_made"="crane"]["name"](area.a);nwr["industrial"="crane"](area.a););out center 500;`,
    monetization: 0.85, demand: "high",
  },
  {
    surface_type: "construction_yard",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["landuse"="construction"]["name"](area.a););out center 1000;`,
    monetization: 0.70, demand: "medium",
  },
  {
    surface_type: "heavy_equipment_dealer",
    query: (areaId) => `[out:json][timeout:90];area(${areaId})->.a;(nwr["shop"="trade"]["trade"~"construction|machinery"]["name"](area.a);nwr["shop"="machinery"]["name"](area.a););out center 500;`,
    monetization: 0.60, demand: "medium",
  },
];

// Slug generation: shared canonical contract (scripts/lib/slugify.js)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { generateCanonicalSlug: _genSlug, generateSimpleSlug: _simpleSlug } = require("./lib/slugify");

function slugify(text, countryCode, surfaceType) {
  // Use canonical slug with surface_type as entity_type and countryCode as disambiguator
  return _genSlug(text, countryCode || '', surfaceType || '');
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

function isCheckpointed(cc, surfaceType) {
  const file = join(CHECKPOINT_DIR, `${checkpointKey(cc, surfaceType)}.done`);
  return existsSync(file);
}

function writeCheckpoint(cc, surfaceType, count) {
  const file = join(CHECKPOINT_DIR, `${checkpointKey(cc, surfaceType)}.done`);
  writeFileSync(file, JSON.stringify({ cc, surfaceType, count, ts: new Date().toISOString(), run_id: RUN_ID }));
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
        const wait = jitter(30000 * Math.pow(2, attempt - 1)); // 30s, 60s, 120s + jitter
        console.log(`  ⏳ 429 rate-limited on ${label}. Backoff ${(wait / 1000).toFixed(0)}s (attempt ${attempt}/${MAX_RETRIES})`);
        logEntry({ country: label, action: "rate_limited", attempt, backoff_ms: wait });
        await sleep(wait);
        continue;
      }

      if (resp.status >= 500) {
        const wait = jitter(10000 * Math.pow(2, attempt - 1)); // 10s, 20s, 40s + jitter
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
        console.log(`  ⚠️  Attempt ${attempt}/${MAX_RETRIES} failed for ${label}: ${err.message}. Retry in ${(wait / 1000).toFixed(0)}s`);
        await sleep(wait);
      }
    }
  }
  // Exhausted retries — add to retry queue
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
    city: tags["addr:city"] || tags["addr:town"] || null,
    state_region: tags["addr:state"] || tags["addr:province"] || null,
    postal_code: tags["addr:postcode"] || null,
    geo: `SRID=4326;POINT(${coords.lon} ${coords.lat})`,
    phone: tags.phone || tags["contact:phone"] || null,
    email: tags.email || tags["contact:email"] || null,
    website: tags.website || tags["contact:website"] || null,
    claim_status: "unclaimed",
    data_confidence_score: 0.6,
    monetization_score: surfaceDef.monetization,
    liquidity_score: 0.3,
    source: "osm",
    source_id: sourceId,
    metadata: {
      osm_type: osmType,
      osm_id: osmId,
      demand_signal: surfaceDef.demand,
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

  const { data, error, count } = await supabase
    .from("surfaces")
    .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true, count: "exact" });

  if (error) {
    console.error(`  ⚠️  Upsert error: ${error.message}`);
    logEntry({ action: "upsert_error", error: error.message, batch_size: rows.length });
    return { inserted: 0, skipped: rows.length };
  }

  // count may be null when ignoreDuplicates is true
  const inserted = count ?? rows.length;
  return { inserted, skipped: rows.length - inserted };
}

// ── TIERS ────────────────────────────────────────────────────
const TIER_A = ["US", "CA", "AU", "GB", "NZ", "ZA", "DE", "NL", "AE", "BR"];
const TIER_B = ["IE", "SE", "NO", "DK", "FI", "BE", "AT", "CH", "ES", "FR", "IT", "PT", "SA", "QA", "MX"];
const TIER_C = ["PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", "BG", "GR", "TR", "KW", "OM", "BH", "SG", "MY", "JP", "KR", "CL", "AR", "CO", "PE"];
const TIER_D = ["UY", "PA", "CR"];
const ALL_COUNTRIES_ORDERED = [...TIER_A, ...TIER_B, ...TIER_C, ...TIER_D];

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log(" HAUL COMMAND — Bulk Surface Ingestion Engine v2.0");
  console.log("═══════════════════════════════════════════════════");
  console.log(`Run ID:      ${RUN_ID}`);
  console.log(`Mode:        ${DRY_RUN ? "🧪 DRY RUN" : "🚀 LIVE"}`);
  console.log(`Max writes:  ${MAX_WRITES}`);
  console.log(`Log file:    ${LOG_FILE}`);
  console.log(`Checkpoints: ${CHECKPOINT_DIR}`);
  console.log(`Retries:     ${MAX_RETRIES} per query`);
  console.log("");

  const filterCountries = process.argv.filter((a) => /^[A-Z]{2}$/.test(a));
  const countries = filterCountries.length > 0 ? filterCountries : ALL_COUNTRIES_ORDERED;
  console.log(`Countries:   ${countries.join(", ")} (${countries.length})`);
  console.log(`Surface types: ${SURFACE_QUERIES.length}`);
  console.log("");

  logEntry({ action: "run_start", countries, surface_types: SURFACE_QUERIES.length, max_writes: MAX_WRITES, dry_run: DRY_RUN });

  for (const cc of countries) {
    const areaId = COUNTRIES[cc];
    if (!areaId) {
      console.log(`⚠️  No area ID for ${cc}, skipping`);
      continue;
    }

    // Max writes cap
    if (stats.totalWrites >= MAX_WRITES) {
      console.log(`\n🛑 MAX_WRITES cap reached (${MAX_WRITES}). Stopping.`);
      logEntry({ action: "max_writes_reached", total: stats.totalWrites });
      break;
    }

    console.log(`\n🌍 ══ ${cc} ══════════════════════════════════════`);

    for (const surfaceDef of SURFACE_QUERIES) {
      const label = `${cc}/${surfaceDef.surface_type}`;

      // Check checkpoint — skip if already done
      if (isCheckpointed(cc, surfaceDef.surface_type)) {
        console.log(`  ⏭️  ${label} — already checkpointed, skipping`);
        continue;
      }

      // Max writes cap (inner check)
      if (stats.totalWrites >= MAX_WRITES) break;

      try {
        console.log(`  📡 Querying ${label}...`);
        const queryStr = surfaceDef.query(areaId);
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
              logEntry({
                country: cc,
                surface_type: surfaceDef.surface_type,
                source: "osm",
                source_id: row.source_id,
                action: "insert",
                ok: true,
              });
            }
          }
          stats.inserts += batchInserted;
          stats.skips += batchSkipped;
          stats.totalWrites += batchInserted;
          console.log(`  ✅ ${batchInserted} inserted, ${batchSkipped} skipped`);
        }

        // Checkpoint this query as done
        writeCheckpoint(cc, surfaceDef.surface_type, rows.length);

        // Print summary every 5 queries
        if (stats.queriesRun % 5 === 0) {
          printSummary(`After ${stats.queriesRun} queries`);
        }

        // Rate limit
        await sleep(jitter(BASE_DELAY_MS));

      } catch (err) {
        console.error(`  ❌ FAILED ${label}: ${err.message}`);
        stats.errors++;
        logEntry({ country: cc, surface_type: surfaceDef.surface_type, action: "error", error: err.message });
        // Don't checkpoint — allow retry on next run
        await sleep(jitter(BASE_DELAY_MS));
      }
    }

    // Country summary
    printSummary(`${cc} complete`);
  }

  // ── FINAL REPORT ─────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log(" ✅ INGESTION COMPLETE");
  console.log("═══════════════════════════════════════════════════");
  printSummary("FINAL");

  if (stats.retryQueue.length > 0) {
    console.log(`\n⚠️  ${stats.retryQueue.length} queries exhausted retries. Saved to ${RETRY_FILE}`);
    writeFileSync(RETRY_FILE, JSON.stringify(stats.retryQueue, null, 2));
  }

  logEntry({ action: "run_end", ...stats, retryQueue: stats.retryQueue.length });

  // Final DB count
  if (!DRY_RUN && supabase) {
    const { count } = await supabase
      .from("surfaces")
      .select("id", { count: "exact", head: true });
    console.log(`\n📊 Total surfaces in database: ${count}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  logEntry({ action: "fatal", error: err.message });
  process.exit(1);
});
