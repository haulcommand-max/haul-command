#!/usr/bin/env node
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export function buildOperatorGeocodeAddress(row) {
  return [
    row.address || row.street_address,
    row.city || row.city_inferred,
    row.admin1_code || row.state || row.region_code,
    row.postal_code,
    row.country_code,
  ]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(", ");
}

export function parseGoogleGeocodeResult(payload) {
  const first = payload?.results?.[0];
  const location = first?.geometry?.location;
  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") return null;

  return {
    lat: location.lat,
    lng: location.lng,
    formattedAddress: first.formatted_address ?? null,
    confidence: first.geometry?.location_type === "ROOFTOP" ? "rooftop" : "approximate",
    placeId: first.place_id ?? null,
  };
}

function parseArgs(argv) {
  const valueAfter = (flag, fallback = null) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : fallback);
  return {
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply"),
    limit: Number(valueAfter("--limit", "25")),
    queueView: valueAfter("--queue-view", "v_operator_geocode_queue"),
    targetTable: valueAfter("--target-table", "operators"),
    idColumn: valueAfter("--id-column", "id"),
  };
}

async function loadEnv() {
  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: ".env.local" });
    dotenv.config();
  } catch {
    // dotenv is optional for tests/imports.
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnv();

  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Missing GOOGLE_GEOCODING_API_KEY or GOOGLE_MAPS_API_KEY.");
    process.exit(1);
  }

  const { Client } = await import("pg");
  const connectionString =
    process.env.SUPABASE_DB_POOLER_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Missing SUPABASE_DB_POOLER_URL, SUPABASE_DATABASE_URL, or DATABASE_URL.");
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows } = await client.query(
    `select * from public.${args.queueView} limit $1`,
    [Number.isFinite(args.limit) && args.limit > 0 ? args.limit : 25],
  );

  let prepared = 0;
  let skipped = 0;
  for (const row of rows) {
    const address = buildOperatorGeocodeAddress(row);
    const id = row[args.idColumn] || row.operator_id || row.profile_id;
    if (!address || !id) {
      skipped += 1;
      continue;
    }

    const url = new URL(GOOGLE_GEOCODE_URL);
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);
    if (row.country_code) url.searchParams.set("region", String(row.country_code).toLowerCase());

    const response = await fetch(url);
    const payload = await response.json();
    const result = parseGoogleGeocodeResult(payload);
    if (!result) {
      skipped += 1;
      continue;
    }

    if (!args.dryRun) {
      await client.query(
        `update public.${args.targetTable}
            set lat = $1,
                lng = $2,
                geocode_confidence = $3,
                geocode_source = 'google_geocoding',
                geocoded_at = now()
          where ${args.idColumn} = $4`,
        [result.lat, result.lng, result.confidence, id],
      );
    }

    prepared += 1;
  }

  await client.end();
  console.log(JSON.stringify({ ok: true, dryRun: args.dryRun, scanned: rows.length, prepared, skipped }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
