import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/discovery/ingest
 * 
 * Ingests raw entity data into the discovery pipeline.
 * Accepts either single entities or batches.
 * 
 * Body:
 * {
 *   source_type: "gov" | "association" | "directory" | "maps" | "social" | "manual" | "partner",
 *   source_name: "google_maps_au" | "yellow_pages_us" | etc,
 *   source_url?: "https://...",
 *   country_code: "US" | "AU" | "GB" | etc,
 *   entities: [{ name, phone, email, city, state, website, lat, lng, ... }],
 *   auto_promote?: boolean  // if true, runs full pipeline immediately
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.slice(7);
        if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const {
            source_type = "manual",
            source_name,
            source_url,
            country_code,
            entities = [],
            auto_promote = false,
        } = body;

        if (!source_name || !country_code) {
            return NextResponse.json({ error: "source_name and country_code required" }, { status: 400 });
        }

        if (!entities.length) {
            return NextResponse.json({ error: "entities array is empty" }, { status: 400 });
        }

        const sb = getSupabaseAdmin();

        // Insert raw entities
        const rawRecords = entities.map((entity: Record<string, unknown>, i: number) => ({
            source_type,
            source_name,
            source_url: source_url || null,
            country_code: country_code.toUpperCase(),
            external_id: (entity.external_id as string) || `${source_name}_${Date.now()}_${i}`,
            payload: entity,
        }));

        const { data: insertedRaw, error: rawError } = await sb
            .from("hc_entities_raw")
            .insert(rawRecords)
            .select("id");

        if (rawError) {
            console.error("Raw insert error:", rawError);
            return NextResponse.json({ error: rawError.message }, { status: 500 });
        }

        const result: {
            inserted: number;
            promoted: number;
            duplicates: number;
            errors: number;
        } = {
            inserted: insertedRaw?.length || 0,
            promoted: 0,
            duplicates: 0,
            errors: 0,
        };

        // Auto-promote if requested
        if (auto_promote && insertedRaw) {
            const { data: batchResult, error: batchError } = await sb.rpc(
                "hc_run_ingestion_batch",
                { p_limit: insertedRaw.length }
            );

            if (batchError) {
                console.error("Batch error:", batchError);
            } else if (batchResult) {
                result.promoted = batchResult.promoted || 0;
                result.duplicates = batchResult.duplicates_found || 0;
                result.errors = batchResult.errors || 0;
            }
        }

        return NextResponse.json({
            ok: true,
            ...result,
        });
    } catch (err) {
        console.error("Discovery ingest error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
