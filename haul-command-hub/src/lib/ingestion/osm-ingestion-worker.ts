/**
 * HAUL COMMAND — V1.1 OSM INGESTION WORKER
 *
 * Production-ready worker that:
 *  1) Creates an hc_ingestion_runs row
 *  2) Queries OSM Overpass by bbox + category (tag map)
 *  3) Normalizes records into canonical NormalizedPlace shape
 *  4) Calls batch_upsert_places() RPC in chunks of 250
 *  5) Records exact run→place mapping via hc_place_ingestion_map
 *  6) Runs QA gates (duplicate rate, coverage minimums)
 *  7) Publishes draft→published via publish_places_for_run()
 *
 * USAGE:
 *   Server-side only (cron, worker, or queue consumer).
 *   Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────

type SourceType = "osm";

type OSMElement =
    | { type: "node"; id: number; lat: number; lon: number; tags?: Record<string, string> }
    | { type: "way"; id: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }
    | { type: "relation"; id: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

type OverpassResponse = { elements: OSMElement[] };

type BBox = { south: number; west: number; north: number; east: number };

type CategoryKey =
    | "port"
    | "truck_parking"
    | "truck_stop"
    | "weigh_station"
    | "rest_area"
    | "fuel_station_diesel"
    | "industrial_zone"
    | "rail_intermodal"
    | "twic_enrollment";

export type RunParams = {
    run_key: string;        // e.g. "osm_us_ports_20260303"
    country_code: string;   // ISO-2: "US", "CA", "AU", etc.
    category_key: CategoryKey;
    bbox: BBox;
    admin1_code?: string | null;
};

type NormalizedPlace = {
    name: string;
    country_code: string;
    category_key: CategoryKey;
    lat: number;
    lng: number;
    address: string | null;
    locality: string | null;
    admin1_code: string | null;
    admin2_name: string | null;
    postal_code: string | null;
    phone: string | null;
    website: string | null;
    source_type: SourceType;
    source_id: string;      // "node/123" or "way/456"
    source_raw: Record<string, unknown>;
};

type BatchItem = NormalizedPlace;

type QAResult = {
    ok: boolean;
    issues: string[];
    stats: {
        total_seen: number;
        total_upserted: number;
        total_errors: number;
        duplicate_rate: number;
    };
};

// ─────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const BATCH_SIZE = 250;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000;
const BBOX_MAX_AREA = 500; // split bboxes larger than this (degree²)

// ─────────────────────────────────────────────────────────────────────
// OVERPASS QUERY BUILDER
// ─────────────────────────────────────────────────────────────────────

/**
 * Map category → OSM tag query fragments.
 * Pragmatic v1; expand with better tag coverage over time.
 */
function buildOverpassQuery(category: CategoryKey, bbox: BBox): string {
    const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;

    const categoryToFragments: Record<CategoryKey, string[]> = {
        port: [
            `node["harbour"="port"](${b});`,
            `way["harbour"="port"](${b});`,
            `relation["harbour"="port"](${b});`,
            `node["industrial"="port"](${b});`,
            `way["industrial"="port"](${b});`,
            `node["landuse"="port"](${b});`,
            `way["landuse"="port"](${b});`,
            `relation["landuse"="port"](${b});`,
        ],
        truck_parking: [
            `node["amenity"="parking"]["hgv"="designated"](${b});`,
            `way["amenity"="parking"]["hgv"="designated"](${b});`,
            `node["amenity"="parking"]["hgv"="yes"](${b});`,
            `way["amenity"="parking"]["hgv"="yes"](${b});`,
        ],
        truck_stop: [
            `node["amenity"="fuel"]["hgv"="yes"](${b});`,
            `way["amenity"="fuel"]["hgv"="yes"](${b});`,
            `node["highway"="services"]["hgv"="yes"](${b});`,
            `way["highway"="services"]["hgv"="yes"](${b});`,
        ],
        weigh_station: [
            `node["amenity"="weighbridge"](${b});`,
            `way["amenity"="weighbridge"](${b});`,
            `node["highway"="services"]["services"="weigh_station"](${b});`,
        ],
        rest_area: [
            `node["highway"="rest_area"](${b});`,
            `way["highway"="rest_area"](${b});`,
            `node["highway"="services"](${b});`,
            `way["highway"="services"](${b});`,
        ],
        fuel_station_diesel: [
            `node["amenity"="fuel"]["fuel:diesel"="yes"](${b});`,
            `way["amenity"="fuel"]["fuel:diesel"="yes"](${b});`,
        ],
        industrial_zone: [
            `node["landuse"="industrial"](${b});`,
            `way["landuse"="industrial"](${b});`,
            `relation["landuse"="industrial"](${b});`,
        ],
        rail_intermodal: [
            `node["railway"="station"]["usage"="industrial"](${b});`,
            `way["landuse"="railway"](${b});`,
            `node["railway"="yard"](${b});`,
            `way["railway"="yard"](${b});`,
        ],
        twic_enrollment: [
            // Unreliable in OSM; gov dataset is better. Keep for completeness.
            `node["office"="government"]["name"~"TWIC",i](${b});`,
        ],
    };

    const fragments = categoryToFragments[category] ?? [];
    return `
    [out:json][timeout:180];
    (
      ${fragments.join("\n      ")}
    );
    out center tags;
  `;
}

// ─────────────────────────────────────────────────────────────────────
// OVERPASS FETCH (with retry)
// ─────────────────────────────────────────────────────────────────────

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Split a bbox into sub-bboxes if the area is too large for Overpass.
 */
function splitBBox(bbox: BBox): BBox[] {
    const width = bbox.east - bbox.west;
    const height = bbox.north - bbox.south;
    const area = width * height;

    if (area <= BBOX_MAX_AREA) return [bbox];

    const midLat = (bbox.south + bbox.north) / 2;
    const midLng = (bbox.west + bbox.east) / 2;

    const quads: BBox[] = [
        { south: bbox.south, west: bbox.west, north: midLat, east: midLng },
        { south: bbox.south, west: midLng, north: midLat, east: bbox.east },
        { south: midLat, west: bbox.west, north: bbox.north, east: midLng },
        { south: midLat, west: midLng, north: bbox.north, east: bbox.east },
    ];

    // Recursively split if still too large
    return quads.flatMap(splitBBox);
}

async function fetchOverpass(query: string): Promise<OverpassResponse> {
    let lastErr: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            const delay = RETRY_DELAY_MS * attempt;
            console.log(`[overpass] retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
            await sleep(delay);
        }

        try {
            const res = await fetch(OVERPASS_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
                body: new URLSearchParams({ data: query }),
            });

            if (res.status === 429 || res.status === 504) {
                lastErr = new Error(`overpass_rate_limited status=${res.status}`);
                continue;
            }

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`overpass_error status=${res.status} body=${text.slice(0, 500)}`);
            }

            return (await res.json()) as OverpassResponse;
        } catch (e) {
            lastErr = e instanceof Error ? e : new Error(String(e));
            if (attempt === MAX_RETRIES) break;
        }
    }

    throw lastErr ?? new Error("overpass_fetch_failed");
}

// ─────────────────────────────────────────────────────────────────────
// NORMALIZATION
// ─────────────────────────────────────────────────────────────────────

function normalizeOSMElement(
    el: OSMElement,
    params: RunParams
): NormalizedPlace | null {
    const tags = el.tags ?? {};

    const name = tags.name || tags["operator"] || tags["brand"] || tags["ref"] || null;

    const lat = el.type === "node" ? el.lat : el.center?.lat ?? null;
    const lng = el.type === "node" ? el.lon : el.center?.lon ?? null;

    if (!lat || !lng) return null;

    // Geo sanity check
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    // Address best-effort
    const housenumber = tags["addr:housenumber"] ?? "";
    const street = tags["addr:street"] ?? "";
    const city = tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? null;
    const state = tags["addr:state"] ?? null;
    const postcode = tags["addr:postcode"] ?? null;

    const addressLine = [housenumber, street].filter(Boolean).join(" ").trim() || null;

    const website = tags.website ?? tags["contact:website"] ?? null;
    const phone = tags.phone ?? tags["contact:phone"] ?? null;

    // V1: skip nameless unless pure-infrastructure
    const allowNameless = ["rest_area", "weigh_station", "truck_parking"].includes(params.category_key);
    if (!name && !allowNameless) return null;

    const fallbackName =
        name ?? `${params.category_key.replace(/_/g, " ")} (${lat.toFixed(4)},${lng.toFixed(4)})`;

    return {
        name: fallbackName,
        country_code: params.country_code,
        category_key: params.category_key,
        lat,
        lng,
        address: addressLine,
        locality: city,
        admin1_code: params.admin1_code ?? state ?? null,
        admin2_name: null,
        postal_code: postcode,
        phone,
        website,
        source_type: "osm",
        source_id: `${el.type}/${el.id}`,
        source_raw: { ...el, tags },
    };
}

// ─────────────────────────────────────────────────────────────────────
// SUPABASE HELPERS
// ─────────────────────────────────────────────────────────────────────

function createSupabaseClient(): SupabaseClient {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

    return createClient(url, key, {
        auth: { persistSession: false },
    });
}

async function createIngestionRun(
    supabase: SupabaseClient,
    params: RunParams
): Promise<string> {
    const { data, error } = await supabase
        .from("hc_ingestion_runs")
        .insert({
            source_type: "osm",
            run_key: params.run_key,
            params,
            status: "running",
        })
        .select("id")
        .single();

    if (error || !data?.id) throw new Error(`create_ingestion_run_failed: ${error?.message}`);
    return data.id as string;
}

async function logEvent(
    supabase: SupabaseClient,
    run_id: string,
    event_type: string,
    payload: Record<string, unknown>
) {
    try {
        await supabase.from("hc_ingestion_events").insert({ run_id, event_type, payload });
    } catch {
        // never let logging kill the run
    }
}

async function finalizeRun(
    supabase: SupabaseClient,
    run_id: string,
    status: "success" | "failed",
    stats: Record<string, unknown>,
    errorText?: string
) {
    await supabase
        .from("hc_ingestion_runs")
        .update({
            status,
            ended_at: new Date().toISOString(),
            stats,
            error: errorText ?? null,
        })
        .eq("id", run_id);
}

// ─────────────────────────────────────────────────────────────────────
// BATCH UPSERT + PUBLISH RPCs
// ─────────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

async function batchUpsertPlacesRPC(
    supabase: SupabaseClient,
    run_id: string,
    items: BatchItem[]
): Promise<{ source_id: string; place_id: string; action: string }[]> {
    const { data, error } = await supabase.rpc("batch_upsert_places", {
        p_items: items,
        p_run_id: run_id,
    });
    if (error) throw new Error(`batch_upsert_places_failed: ${error.message}`);
    return (data ?? []) as { source_id: string; place_id: string; action: string }[];
}

async function publishExactForRun(supabase: SupabaseClient, run_id: string): Promise<number> {
    const { data, error } = await supabase.rpc("publish_places_for_run", {
        p_run_id: run_id,
    });
    if (error) throw new Error(`publish_places_for_run_failed: ${error.message}`);
    return (data ?? 0) as number;
}

// ─────────────────────────────────────────────────────────────────────
// QA GATES
// ─────────────────────────────────────────────────────────────────────

function runQAGates(normalized: NormalizedPlace[], upserted: number, errors: number): QAResult {
    const issues: string[] = [];

    // Duplicate estimate by name + rounded lat/lng
    const seen = new Set<string>();
    let dupes = 0;
    for (const r of normalized) {
        const key = `${r.name.toLowerCase().trim()}|${r.lat.toFixed(4)}|${r.lng.toFixed(4)}`;
        if (seen.has(key)) dupes++;
        else seen.add(key);
    }
    const dupRate = normalized.length ? dupes / normalized.length : 0;

    if (dupRate > 0.03) {
        issues.push(`duplicate_rate_too_high: ${(dupRate * 100).toFixed(2)}%`);
    }

    // Coverage minimum (adjustable per category)
    const minCount = 10; // lowered from 50 for initial runs
    if (normalized.length < minCount) {
        issues.push(`coverage_below_minimum: got=${normalized.length} min=${minCount}`);
    }

    // Error rate check
    const errorRate = normalized.length ? errors / normalized.length : 0;
    if (errorRate > 0.10) {
        issues.push(`error_rate_too_high: ${(errorRate * 100).toFixed(2)}%`);
    }

    return {
        ok: issues.length === 0,
        issues,
        stats: {
            total_seen: normalized.length,
            total_upserted: upserted,
            total_errors: errors,
            duplicate_rate: dupRate,
        },
    };
}

// ─────────────────────────────────────────────────────────────────────
// MAIN JOB
// ─────────────────────────────────────────────────────────────────────

export async function runOSMIngestionJob(params: RunParams) {
    const supabase = createSupabaseClient();
    const run_id = await createIngestionRun(supabase, params);

    console.log(`[ingestion] run=${params.run_key} id=${run_id} started`);

    let totalUpserted = 0;
    let totalErrors = 0;

    try {
        // 1) Split bbox if too large, then pull from Overpass per sub-bbox
        const subBboxes = splitBBox(params.bbox);
        console.log(`[ingestion] querying overpass for ${params.category_key} in ${params.country_code} (${subBboxes.length} sub-regions)...`);

        const allElements: OSMElement[] = [];
        for (const [i, subBbox] of subBboxes.entries()) {
            const query = buildOverpassQuery(params.category_key, subBbox);
            console.log(`[ingestion] sub-region ${i + 1}/${subBboxes.length}...`);
            try {
                const overpass = await fetchOverpass(query);
                allElements.push(...overpass.elements);
                console.log(`[ingestion]   got ${overpass.elements.length} elements`);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                console.warn(`[ingestion]   sub-region ${i + 1} failed: ${msg} (continuing...)`);
                await logEvent(supabase, run_id, "overpass_sub_error", { sub_index: i, error: msg });
            }
            // Courtesy delay between Overpass calls
            if (i < subBboxes.length - 1) await sleep(5000);
        }

        console.log(`[ingestion] overpass returned ${allElements.length} total elements`);

        await logEvent(supabase, run_id, "overpass_response", {
            elements_count: allElements.length,
            sub_regions: subBboxes.length,
        });

        // 2) Normalize
        const normalized: NormalizedPlace[] = [];
        let skipped = 0;
        const seenSourceIds = new Set<string>();
        for (const el of allElements) {
            const rec = normalizeOSMElement(el, params);
            if (!rec) { skipped++; continue; }
            // Dedup across sub-regions
            if (seenSourceIds.has(rec.source_id)) { skipped++; continue; }
            seenSourceIds.add(rec.source_id);
            normalized.push(rec);
        }

        console.log(`[ingestion] normalized: ${normalized.length} places, skipped: ${skipped}`);
        await logEvent(supabase, run_id, "normalize", {
            normalized: normalized.length,
            skipped,
        });

        // 3) Batch upsert in chunks of 250
        const batches = chunk(normalized, BATCH_SIZE);
        console.log(`[ingestion] upserting ${normalized.length} places in ${batches.length} batches...`);

        for (const [idx, batch] of batches.entries()) {
            try {
                const results = await batchUpsertPlacesRPC(supabase, run_id, batch);
                totalUpserted += results.length;

                const inserted = results.filter((r) => r.action === "inserted").length;
                const updated = results.filter((r) => r.action === "updated").length;

                console.log(
                    `[ingestion] batch ${idx + 1}/${batches.length}: ${results.length} ok (${inserted} new, ${updated} updated)`
                );

                await logEvent(supabase, run_id, "batch_upsert", {
                    batch_index: idx,
                    batch_size: batch.length,
                    results_count: results.length,
                    inserted,
                    updated,
                });
            } catch (e: unknown) {
                totalErrors += batch.length;
                const msg = e instanceof Error ? e.message : String(e);
                console.error(`[ingestion] batch ${idx + 1} FAILED: ${msg}`);

                await logEvent(supabase, run_id, "batch_error", {
                    batch_index: idx,
                    batch_size: batch.length,
                    error: msg,
                });
            }
        }

        // 4) QA gates
        const qa = runQAGates(normalized, totalUpserted, totalErrors);
        console.log(`[ingestion] QA: ok=${qa.ok} issues=${qa.issues.join(", ") || "none"}`);
        await logEvent(supabase, run_id, "qa_result", qa);

        // 5) Publish if QA passes
        let published = 0;
        if (qa.ok) {
            published = await publishExactForRun(supabase, run_id);
            console.log(`[ingestion] published ${published} places`);
            await logEvent(supabase, run_id, "publish_exact", { published });
        } else {
            console.warn(`[ingestion] publish SKIPPED: QA failed — ${qa.issues.join(", ")}`);
            await logEvent(supabase, run_id, "publish_skipped", {
                reason: "qa_failed",
                issues: qa.issues,
            });
        }

        // 6) Finalize
        await finalizeRun(supabase, run_id, "success", {
            ...qa.stats,
            published,
            qa_ok: qa.ok,
            qa_issues: qa.issues,
        });

        console.log(`[ingestion] ✅ run=${params.run_key} complete. upserted=${totalUpserted} published=${published}`);

        return {
            run_id,
            run_key: params.run_key,
            ...qa.stats,
            published,
            qa_ok: qa.ok,
            qa_issues: qa.issues,
        };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[ingestion] ❌ FATAL: ${msg}`);
        await logEvent(supabase, run_id, "fatal", { error: msg });
        await finalizeRun(supabase, run_id, "failed", { upserted: totalUpserted, errors: totalErrors }, msg);
        throw e;
    }
}

// ─────────────────────────────────────────────────────────────────────
// PRESET BBOXES (handy for common runs)
// ─────────────────────────────────────────────────────────────────────

export const BBOXES: Record<string, BBox> = {
    US: { south: 24.396308, west: -124.848974, north: 49.384358, east: -66.885444 },
    CA: { south: 41.681, west: -141.002, north: 83.111, east: -52.619 },
    AU: { south: -43.659, west: 113.155, north: -10.683, east: 153.639 },
    GB: { south: 49.871, west: -6.379, north: 58.635, east: 1.768 },
    NZ: { south: -47.292, west: 166.426, north: -34.393, east: 178.577 },
    DE: { south: 47.270, west: 5.867, north: 55.099, east: 15.042 },
    SE: { south: 55.337, west: 11.027, north: 69.060, east: 24.167 },
    NO: { south: 57.959, west: 4.992, north: 71.185, east: 31.078 },
    AE: { south: 22.633, west: 51.583, north: 26.084, east: 56.381 },
    SA: { south: 16.379, west: 34.572, north: 32.154, east: 55.666 },
    ZA: { south: -34.834, west: 16.458, north: -22.126, east: 32.830 },
    MX: { south: 14.533, west: -118.404, north: 32.718, east: -86.710 },
};

// ─────────────────────────────────────────────────────────────────────
// CONVENIENCE: RUN MULTIPLE CATEGORIES FOR A COUNTRY
// ─────────────────────────────────────────────────────────────────────

export async function runCountryIngestion(
    country_code: string,
    categories: CategoryKey[],
    dateStr?: string
) {
    const bbox = BBOXES[country_code];
    if (!bbox) throw new Error(`no_bbox_for_country: ${country_code}`);

    const ds = dateStr ?? new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const results = [];
    for (const cat of categories) {
        const run_key = `osm_${country_code.toLowerCase()}_${cat}_${ds}`;
        console.log(`\n═══ Starting: ${run_key} ═══`);
        try {
            const result = await runOSMIngestionJob({
                run_key,
                country_code,
                category_key: cat,
                bbox,
            });
            const { run_key: _, ...rest } = result;
            results.push({ run_key, status: "success", ...rest });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[${run_key}] FAILED: ${msg}`);
            results.push({ run_key, status: "failed", error: msg });
        }

        // Rate-limit courtesy: 5s between Overpass calls
        await sleep(5000);
    }

    return results;
}
