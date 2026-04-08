/**
 * GET /api/cron/osm-enrichment
 *
 * Scheduled: daily via vercel.json
 * Purpose: Pull OSM Overpass data for oversize-load-relevant POIs
 *          and upsert into hc_places / directory entity tables.
 *
 * Observability contract:
 *   run_id, started_at, ended_at, duration_ms,
 *   inserted_count, updated_count, skipped_count,
 *   duplicate_collisions, error_count
 */

import { NextRequest, NextResponse } from "next/server";
import { cronGuard, logCronRun } from "@/app/api/cron/_lib/cron-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — OSM calls can be slow

const JOB_ID = "osm-enrichment";

// City bounding boxes to enrich each run (rotate or expand as needed)
const PRIORITY_CITIES: Array<{ name: string; bbox: [number, number, number, number] }> = [
  { name: "Houston, TX", bbox: [29.5, -95.8, 30.1, -95.0] },
  { name: "Dallas, TX", bbox: [32.6, -97.1, 33.0, -96.5] },
  { name: "Chicago, IL", bbox: [41.6, -87.9, 42.1, -87.5] },
  { name: "Los Angeles, CA", bbox: [33.7, -118.7, 34.3, -117.9] },
  { name: "Atlanta, GA", bbox: [33.6, -84.6, 33.9, -84.2] },
];

export async function GET(req: NextRequest) {
  const start = Date.now();
  const run_id = crypto.randomUUID();

  const guard = await cronGuard();
  if (guard) return guard;

  const supabase = getSupabaseAdmin();

  let inserted_count = 0;
  let updated_count = 0;
  let skipped_count = 0;
  let duplicate_collisions = 0;
  let error_count = 0;

  console.log(
    JSON.stringify({
      level: "info",
      job: JOB_ID,
      run_id,
      event: "osm_enrichment.started",
      cities: PRIORITY_CITIES.length,
    }),
  );

  for (const city of PRIORITY_CITIES) {
    try {
      // Build Overpass query for heavy-haul-relevant entities
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"fuel|truck_stop|weighbridge"](${city.bbox.join(",")});
          node["industrial"~"logistics|warehouse|port|heavy_industry"](${city.bbox.join(",")});
          way["landuse"~"industrial|port"](${city.bbox.join(",")});
          node["highway"="weigh_station"](${city.bbox.join(",")});
        );
        out body;
      `;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        error_count++;
        console.error(
          JSON.stringify({ level: "error", job: JOB_ID, run_id, city: city.name, status: res.status }),
        );
        continue;
      }

      const json = await res.json();
      const elements: any[] = json.elements ?? [];

      for (const el of elements) {
        if (!el.lat && !el.center?.lat) { skipped_count++; continue; }

        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        const name = el.tags?.name ?? el.tags?.["name:en"] ?? null;
        const osm_id = `osm_${el.type}_${el.id}`;

        if (!name) { skipped_count++; continue; }

        const record = {
          osm_id,
          name,
          lat,
          lon,
          city: city.name,
          country_code: "US",
          entity_type: el.tags?.amenity ?? el.tags?.industrial ?? el.tags?.highway ?? "poi",
          source: "osm",
          source_attribution: `OpenStreetMap (https://www.openstreetmap.org/node/${el.id})`,
          fetched_at: new Date().toISOString(),
          raw_tags: el.tags ?? {},
        };

        // Upsert with dedupe on osm_id
        const { error: upsertError, data: upsertResult } = await supabase
          .from("hc_osm_entities")
          .upsert(record, { onConflict: "osm_id", ignoreDuplicates: false })
          .select("id");

        if (upsertError) {
          if (upsertError.code === "23505") {
            duplicate_collisions++;
          } else {
            error_count++;
          }
        } else {
          inserted_count++;
        }
      }
    } catch (err: any) {
      error_count++;
      console.error(
        JSON.stringify({ level: "error", job: JOB_ID, run_id, city: city.name, error: err.message }),
      );
    }
  }

  const duration_ms = Date.now() - start;

  await logCronRun(JOB_ID, start, error_count > 0 ? "failed" : "success", {
    rows_affected: inserted_count + updated_count,
    metadata: {
      run_id,
      inserted_count,
      updated_count,
      skipped_count,
      duplicate_collisions,
      error_count,
      cities_processed: PRIORITY_CITIES.length,
    },
  });

  console.log(
    JSON.stringify({
      level: "info",
      job: JOB_ID,
      run_id,
      event: "osm_enrichment.completed",
      duration_ms,
      inserted_count,
      updated_count,
      skipped_count,
      duplicate_collisions,
      error_count,
    }),
  );

  return NextResponse.json({
    ok: true,
    run_id,
    duration_ms,
    inserted_count,
    updated_count,
    skipped_count,
    duplicate_collisions,
    error_count,
  });
}
