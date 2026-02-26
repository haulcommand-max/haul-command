import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/* ──────────────────────────────────────────────────────────
 * Typesense HTTP client (no SDK needed — raw fetch)
 * ────────────────────────────────────────────────────────── */

interface TypesenseConfig {
    host: string;
    port: string;
    protocol: string;
    apiKey: string;
}

function getTypesenseConfig(): TypesenseConfig {
    return {
        host: Deno.env.get("TYPESENSE_HOST") || "hc-typesense.internal",
        port: Deno.env.get("TYPESENSE_PORT") || "8108",
        protocol: Deno.env.get("TYPESENSE_PROTOCOL") || "http",
        apiKey: Deno.env.get("TYPESENSE_API_KEY") || "",
    };
}

function typesenseUrl(cfg: TypesenseConfig, path: string): string {
    return `${cfg.protocol}://${cfg.host}:${cfg.port}${path}`;
}

/** Table name → Typesense collection name */
const COLLECTION_MAP: Record<string, string> = {
    driver_profiles: "driver_profiles",
    loads: "loads",
    corridors: "corridors",
};

/** Transform a raw DB row into a Typesense document.
 *  Handles geopoint conversion and epoch timestamps. */
function transformForTypesense(tableName: string, row: Record<string, any>): Record<string, any> {
    const doc: Record<string, any> = { id: row.id };

    if (tableName === "driver_profiles") {
        doc.display_name = row.company_name || row.display_name || "";
        doc.company_name = row.company_name || "";
        doc.phone_e164 = row.phone_e164 || "";
        doc.email = row.email || "";
        doc.country = row.country_code || "US";
        doc.state_province = row.region_code || row.home_base_state || "";
        doc.city = row.city_slug || row.home_base_city || "";
        doc.postal_code = row.postal_code || "";
        if (row.latitude && row.longitude) {
            doc.home_location = [parseFloat(row.latitude), parseFloat(row.longitude)];
        }
        doc.coverage_radius_miles = row.coverage_radius_miles || 100;
        doc.is_seeded = row.is_seeded ?? false;
        doc.is_claimed = row.is_claimed ?? false;
        doc.verification_status = row.verification_status || "unverified";
        doc.has_insurance = row.insurance_status === "verified";
        doc.has_twic = row.certifications_json?.twic ?? false;
        doc.has_height_pole = row.certifications_json?.high_pole ?? false;
        doc.trust_score = row.trust_score || 0;
        doc.response_time_min = row.response_time_minutes || 0;
        doc.acceptance_rate = row.acceptance_rate || 0;
        doc.on_time_rate = row.on_time_rate || 0;
        doc.updated_at = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
    } else if (tableName === "loads") {
        doc.status = row.status || "open";
        doc.equipment_type = row.equipment_type || "";
        doc.is_oversize = row.is_oversize ?? false;
        doc.origin_country = row.origin_country || "US";
        doc.origin_state_province = row.origin_state || "";
        doc.origin_city = row.origin_city || "";
        if (row.origin_lat && row.origin_lng) {
            doc.origin_location = [parseFloat(row.origin_lat), parseFloat(row.origin_lng)];
        }
        doc.dest_country = row.dest_country || "US";
        doc.dest_state_province = row.dest_state || "";
        doc.dest_city = row.dest_city || "";
        if (row.dest_lat && row.dest_lng) {
            doc.dest_location = [parseFloat(row.dest_lat), parseFloat(row.dest_lng)];
        }
        doc.corridor_slug = row.corridor_slug || "";
        doc.price_total = row.price_total || 0;
        doc.rate_per_mile_est = row.rate_per_mile || 0;
        doc.distance_miles_est = row.distance_miles || 0;
        doc.predicted_fill_minutes = row.predicted_fill_minutes || 0;
        doc.pickup_date_epoch = row.pickup_date ? new Date(row.pickup_date).getTime() : 0;
        doc.created_at = row.created_at ? new Date(row.created_at).getTime() : Date.now();
    } else if (tableName === "corridors") {
        doc.slug = row.slug || "";
        doc.display_name = row.display_name || row.name || "";
        doc.country = row.country || "US";
        doc.primary_states_provinces = row.primary_states || [];
        doc.corridor_type = row.corridor_type || "";
        if (row.center_lat && row.center_lng) {
            doc.center = [parseFloat(row.center_lat), parseFloat(row.center_lng)];
        }
        doc.length_miles_est = row.length_miles || 0;
        doc.domination_score = row.domination_score || 0;
        doc.risk_score = row.risk_score || 0;
        doc.liquidity_score = row.liquidity_score || 0;
        doc.updated_at = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
    }

    return doc;
}

/* ──────────────────────────────────────────────────────────
 * Typesense sync operations
 * ────────────────────────────────────────────────────────── */

async function typesenseUpsert(cfg: TypesenseConfig, collection: string, doc: Record<string, any>) {
    const url = typesenseUrl(cfg, `/collections/${collection}/documents?action=upsert`);
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-TYPESENSE-API-KEY": cfg.apiKey,
        },
        body: JSON.stringify(doc),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Typesense upsert failed (${res.status}): ${body}`);
    }
    return { success: true };
}

async function typesenseDelete(cfg: TypesenseConfig, collection: string, docId: string) {
    const url = typesenseUrl(cfg, `/collections/${collection}/documents/${docId}`);
    const res = await fetch(url, {
        method: "DELETE",
        headers: { "X-TYPESENSE-API-KEY": cfg.apiKey },
    });
    // 404 = already gone, not an error
    if (!res.ok && res.status !== 404) {
        const body = await res.text();
        throw new Error(`Typesense delete failed (${res.status}): ${body}`);
    }
    return { success: true };
}

/* ──────────────────────────────────────────────────────────
 * Main handler — drains search_jobs queue
 * ────────────────────────────────────────────────────────── */

serve(async (_req) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            { auth: { persistSession: false } }
        );

        console.log("search-indexer: starting batch run...");

        // 1. Resolve provider (always typesense per user decision)
        const { data: settings } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "search_provider")
            .single();

        const provider = settings?.value || "typesense";

        if (provider !== "typesense") {
            console.log(`search-indexer: provider '${provider}' not supported yet.`);
            return new Response(JSON.stringify({ skipped: true, reason: `unsupported provider: ${provider}` }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        const cfg = getTypesenseConfig();
        if (!cfg.apiKey) {
            throw new Error("TYPESENSE_API_KEY not set");
        }

        // 2. Fetch up to 100 pending jobs
        const { data: jobs, error: fetchError } = await supabase
            .from("search_jobs")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(100);

        if (fetchError) throw fetchError;
        if (!jobs || jobs.length === 0) {
            return new Response(JSON.stringify({ success: true, processed: 0 }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log(`search-indexer: processing ${jobs.length} jobs`);

        let processed = 0;
        let errors = 0;

        for (const job of jobs) {
            const collection = COLLECTION_MAP[job.table_name];
            if (!collection) {
                console.warn(`search-indexer: no collection for table '${job.table_name}', skipping`);
                await supabase.from("search_jobs").update({ status: "skipped" }).eq("id", job.id);
                continue;
            }

            try {
                if (job.operation === "DELETE") {
                    await typesenseDelete(cfg, collection, job.record_id);
                } else {
                    // UPSERT: fetch latest row from source table
                    const { data: row } = await supabase
                        .from(job.table_name)
                        .select("*")
                        .eq("id", job.record_id)
                        .single();

                    if (!row) {
                        // Row gone — treat as delete
                        await typesenseDelete(cfg, collection, job.record_id);
                    } else {
                        const doc = transformForTypesense(job.table_name, row);
                        await typesenseUpsert(cfg, collection, doc);
                    }
                }

                await supabase.from("search_jobs").update({ status: "completed" }).eq("id", job.id);
                processed++;
            } catch (err: any) {
                console.error(`search-indexer: job ${job.id} failed:`, err.message);
                await supabase.from("search_jobs").update({
                    status: job.attempts >= 3 ? "dead" : "failed",
                    attempts: job.attempts + 1,
                    last_attempt_at: new Date().toISOString(),
                }).eq("id", job.id);
                errors++;
            }
        }

        console.log(`search-indexer: done. processed=${processed} errors=${errors}`);
        return new Response(JSON.stringify({ success: true, processed, errors }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("search-indexer: fatal error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
