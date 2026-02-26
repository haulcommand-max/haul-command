import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

// =========================================================
// miles-compute — HERE Auto Miles Compute (v2)
// Spec: haul-command-here-miles-engine v1.0.0
// Triggered by DB trigger (via pg_net) or direct POST
// POST { load_id, hash? }
//
// Doctrine:
//   1. Manual wins (miles_locked = true) → exit
//   2. Coords missing → exit (missing)
//   3. Hash dedup → exit if same hash + computed
//   4. Build full HERE request with vehicle params + avoid profile
//   5. Call HERE with multi-section sum, 429 handling, up to 2 retries
//   6. Write result via set_load_miles_here RPC + audit log
//   7. On failure → set_load_miles_failed + audit log
// =========================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HERE_API_KEY = Deno.env.get("HERE_API_KEY") ?? "";
const HERE_BASE_URL = "https://router.hereapi.com/v8/routes";
const HERE_TIMEOUT = 8_000;
const MAX_RETRIES = 2;
const RETRY_BACKOFF = [400, 1200]; // ms between retries

// Global vehicle defaults (cm / kg) — overridden by per-load fields
const VEHICLE_DEFAULTS = {
    height_cm: 472,      // 15'6"
    width_cm: 366,      // 12'0"
    length_cm: 3658,     // 120'0"
    gross_weight_kg: 72575,    // 160,000 lb
    current_weight_kg: null as number | null,
    axle_count: 9,
    trailer_count: 1,
    tunnel_category: null as string | null,
    shipped_hazardous_goods: [] as string[],
};

// Avoid features by profile
const AVOID_PROFILES: Record<string, string[]> = {
    light: ["ferry"],
    medium: ["ferry", "tunnel"],
    heavy: ["ferry", "tunnel", "dirtRoad"],
};

// ── Helpers ────────────────────────────────────────────────

/** Convert metres (sum across all sections) → miles, 1 decimal */
function metresToMiles(m: number): number {
    return Math.round((m / 1609.344) * 10) / 10;
}

/** Sum lengths across all route sections */
function extractMetres(hereJson: Record<string, unknown>): number | null {
    const routes = (hereJson as any)?.routes;
    if (!Array.isArray(routes) || routes.length === 0) return null;
    const sections = routes[0]?.sections;
    if (!Array.isArray(sections) || sections.length === 0) return null;
    const total = sections.reduce((acc: number, s: any) => acc + (s?.summary?.length ?? 0), 0);
    return total > 0 ? total : null;
}

/** Resolve vehicle field: per-load → default → null */
function coalesce<T>(perLoad: T | null | undefined, def: T | null): T | null {
    if (perLoad != null) return perLoad;
    if (def != null) return def;
    return null;
}

/** Build SHA-256 hash from all inputs that affect the HERE request */
function buildRequestHash(load: Record<string, any>, vehicleProfile: Record<string, any>): string {
    const parts = [
        load.origin_lat,
        load.origin_lng,
        load.dest_lat,
        load.dest_lng,
        load.route_avoid_profile ?? "light",
        load.route_options_version ?? 1,
        vehicleProfile.height_cm,
        vehicleProfile.width_cm,
        vehicleProfile.length_cm,
        vehicleProfile.gross_weight_kg,
        vehicleProfile.current_weight_kg,
        vehicleProfile.axle_count,
        vehicleProfile.trailer_count,
        vehicleProfile.tunnel_category,
        JSON.stringify(vehicleProfile.shipped_hazardous_goods ?? []),
    ].map(v => v == null ? "" : String(v));

    return createHash("sha256").update(parts.join("|")).digest("hex");
}

/** Build HERE URL — omits null vehicle params */
function buildHereUrl(load: Record<string, any>, vp: Record<string, any>): string {
    const avoidFeatures = AVOID_PROFILES[load.route_avoid_profile ?? "light"] ?? ["ferry"];

    const params: Record<string, string> = {
        apiKey: HERE_API_KEY,
        transportMode: "truck",
        routingMode: "fast",
        origin: `${load.origin_lat},${load.origin_lng}`,
        destination: `${load.dest_lat},${load.dest_lng}`,
        return: "summary,travelSummary",
    };

    if (avoidFeatures.length > 0) params["avoid[features]"] = avoidFeatures.join(",");

    const vehicleMap: Record<string, string | number | null> = {
        "vehicle[height]": vp.height_cm,
        "vehicle[width]": vp.width_cm,
        "vehicle[length]": vp.length_cm,
        "vehicle[grossWeight]": vp.gross_weight_kg,
        "vehicle[currentWeight]": vp.current_weight_kg,
        "vehicle[axleCount]": vp.axle_count,
        "vehicle[trailerCount]": vp.trailer_count,
        "vehicle[tunnelCategory]": vp.tunnel_category,
    };

    for (const [k, v] of Object.entries(vehicleMap)) {
        if (v != null) params[k] = String(v);
    }

    const hazmat: string[] = vp.shipped_hazardous_goods ?? [];
    if (hazmat.length > 0) params["vehicle[shippedHazardousGoods]"] = hazmat.join(",");

    return `${HERE_BASE_URL}?${new URLSearchParams(params)}`;
}

/** Sleep (for retry backoff) */
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Audit log helper ───────────────────────────────────────

async function audit(
    supabase: ReturnType<typeof createClient>,
    loadId: string,
    action: string,
    opts: { hash?: string; request_payload?: object; response_meta?: object; actor?: string; notes?: string }
) {
    await supabase.from("routing_audit_log").insert({
        load_id: loadId,
        action,
        request_hash: opts.hash ?? null,
        request_payload_json: opts.request_payload ?? null,  // sanitized — no apiKey
        response_meta_json: opts.response_meta ?? null,
        actor: opts.actor ?? "system",
        notes: opts.notes ?? null,
    });
}

// ── Main handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
        });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    let body: { load_id: string; hash?: string };
    try { body = await req.json(); } catch {
        return Response.json({ error: "invalid_body" }, { status: 400 });
    }

    const { load_id, hash: incomingHash } = body;
    if (!load_id) return Response.json({ error: "load_id required" }, { status: 400 });

    // ── Fetch full load ──
    const { data: load, error: loadErr } = await supabase
        .from("loads")
        .select(`
      id, origin_lat, origin_lng, dest_lat, dest_lng,
      miles_source, miles_value, miles_status, miles_locked, here_request_hash,
      route_avoid_profile, route_options_version,
      vehicle_height_cm, vehicle_width_cm, vehicle_length_cm,
      vehicle_gross_weight_kg, vehicle_current_weight_kg,
      vehicle_axle_count, vehicle_trailer_count,
      vehicle_tunnel_category, vehicle_shipped_hazardous_goods
    `)
        .eq("id", load_id)
        .single();

    if (loadErr || !load) {
        return Response.json({ error: "load_not_found" }, { status: 404 });
    }

    // ── STEP 1: Manual wins ──
    if (load.miles_locked === true) {
        console.log(`[miles-compute] ${load_id}: manually locked, skipping.`);
        return Response.json({ skipped: true, reason: "manual_locked" });
    }

    // ── STEP 2: Coords present? ──
    const hasCoords =
        load.origin_lat != null && load.origin_lng != null &&
        load.dest_lat != null && load.dest_lng != null;

    if (!hasCoords) {
        // Load changed after job was enqueued — update DB so UI shows correct state
        await supabase.from("loads").update({ miles_status: "missing", miles_failure_reason: null }).eq("id", load_id);
        return Response.json({ skipped: true, reason: "missing_coords" });
    }

    if (!HERE_API_KEY) {
        await supabase.rpc("set_load_miles_failed", { p_load_id: load_id, p_reason: "here_api_key_missing" });
        return Response.json({ error: "HERE_API_KEY not configured" }, { status: 500 });
    }

    // ── Resolve effective vehicle profile ──
    const vp = {
        height_cm: coalesce(load.vehicle_height_cm, VEHICLE_DEFAULTS.height_cm),
        width_cm: coalesce(load.vehicle_width_cm, VEHICLE_DEFAULTS.width_cm),
        length_cm: coalesce(load.vehicle_length_cm, VEHICLE_DEFAULTS.length_cm),
        gross_weight_kg: coalesce(load.vehicle_gross_weight_kg, VEHICLE_DEFAULTS.gross_weight_kg),
        current_weight_kg: coalesce(load.vehicle_current_weight_kg, VEHICLE_DEFAULTS.current_weight_kg),
        axle_count: coalesce(load.vehicle_axle_count, VEHICLE_DEFAULTS.axle_count),
        trailer_count: coalesce(load.vehicle_trailer_count, VEHICLE_DEFAULTS.trailer_count),
        tunnel_category: coalesce(load.vehicle_tunnel_category, VEHICLE_DEFAULTS.tunnel_category),
        shipped_hazardous_goods: (load.vehicle_shipped_hazardous_goods as string[]) ?? VEHICLE_DEFAULTS.shipped_hazardous_goods,
    };

    // ── STEP 3: Richer hash dedup ──
    const computedHash = buildRequestHash(load, vp);
    if (
        computedHash &&
        load.here_request_hash === computedHash &&
        load.miles_status === "computed"
    ) {
        console.log(`[miles-compute] ${load_id}: hash dedup hit.`);
        return Response.json({ skipped: true, reason: "hash_dedup" });
    }

    // ── STEP 4: Build URL (sanitized payload for audit — no apiKey) ──
    const hereUrl = buildHereUrl(load, vp);
    const sanitized = {
        transportMode: "truck",
        origin: `${load.origin_lat},${load.origin_lng}`,
        destination: `${load.dest_lat},${load.dest_lng}`,
        avoid_profile: load.route_avoid_profile ?? "light",
        vehicle_profile: vp,
    };

    await audit(supabase, load_id, "compute_attempt", {
        hash: computedHash,
        request_payload: sanitized,
    });

    // ── STEP 5: Call HERE with retries ──
    let attempt = 0;
    let lastError = "";
    let rateLimited = false;

    while (attempt < MAX_RETRIES) {
        attempt++;

        try {
            const hereResp = await fetch(hereUrl, { signal: AbortSignal.timeout(HERE_TIMEOUT) });

            // 429 — rate limited, fail immediately
            if (hereResp.status === 429) {
                rateLimited = true;
                lastError = "rate_limited_429";
                console.warn(`[miles-compute] ${load_id}: 429 rate limited`);
                break;
            }

            if (!hereResp.ok) {
                lastError = `http_error_${hereResp.status}`;
                console.warn(`[miles-compute] attempt ${attempt}: ${lastError}`);
                if (attempt < MAX_RETRIES) await sleep(RETRY_BACKOFF[attempt - 1] ?? 1200);
                continue;
            }

            const hereJson = await hereResp.json() as Record<string, unknown>;
            const metresTotal = extractMetres(hereJson);

            if (metresTotal == null) {
                lastError = "no_route_in_response";
                console.warn(`[miles-compute] attempt ${attempt}: ${lastError}`);
                if (attempt < MAX_RETRIES) await sleep(RETRY_BACKOFF[attempt - 1] ?? 1200);
                continue;
            }

            const miles = metresToMiles(metresTotal);
            const sections = ((hereJson as any)?.routes?.[0]?.sections ?? []) as any[];
            const routeSummary = sections.map((s: any) => s?.summary ?? {});

            // ── Write success ──
            await supabase.rpc("set_load_miles_here", {
                p_load_id: load_id,
                p_miles: miles,
                p_hash: computedHash,
                p_polyline: sections[0]?.polyline ?? null,
                p_route_summary: routeSummary,
            });

            await audit(supabase, load_id, "compute_success", {
                hash: computedHash,
                response_meta: { meters_total: metresTotal, miles, sections_count: sections.length },
            });

            console.log(`[miles-compute] ${load_id}: ${miles} miles (${attempt} attempt(s))`);
            return Response.json({ ok: true, miles, attempts: attempt });

        } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            console.warn(`[miles-compute] attempt ${attempt} exception: ${lastError}`);
            if (attempt < MAX_RETRIES) await sleep(RETRY_BACKOFF[attempt - 1] ?? 1200);
        }
    }

    // ── STEP 6: Failure ──
    const failureReason = rateLimited ? "rate_limited_429" : lastError.slice(0, 120);

    await supabase.rpc("set_load_miles_failed", { p_load_id: load_id, p_reason: failureReason });
    await audit(supabase, load_id, "compute_fail", {
        hash: computedHash,
        response_meta: { reason: failureReason, attempts: attempt },
    });

    console.error(`[miles-compute] ${load_id}: failed after ${attempt} attempts. ${failureReason}`);
    // Return 200 so pg_net does not auto-retry — we already have internal retry logic above
    return Response.json({ error: "computation_failed", reason: failureReason });
});
